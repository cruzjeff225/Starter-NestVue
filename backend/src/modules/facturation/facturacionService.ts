import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prismaService';
import { CreateFacturaDto } from './dto/createFacturaDto';
import { AnularFacturaDto } from './dto/anularFacturaDto';
import { TipoFactura } from '@prisma/client';

const IVA_RATE = 0.13;
const TURISMO_RATE = 0.05;

@Injectable()
export class FacturacionService {
  constructor(private prisma: PrismaService) {}

  private readonly include = {
    items: true,
    cliente: {
      select: {
        idCliente: true,
        nombre: true,
        apellido: true,
        email: true,
        dui: true,
      },
    },
    reservacion: {
      select: {
        idReservacion: true,
        fechaEntrada: true,
        fechaSalida: true,
        habitacion: {
          select: { numero: true, tipo: { select: { nombre: true } } },
        },
      },
    },
  };

  async findAll(params?: {
    search?: string;
    tipo?: TipoFactura;
    estado?: string;
  }) {
    const { search, tipo, estado } = params ?? {};
    return this.prisma.factura.findMany({
      where: {
        ...(tipo && { tipo }),
        ...(estado && { estado: estado as any }),
        ...(search && {
          OR: [
            { numeroFactura: { contains: search, mode: 'insensitive' } },
            { clienteNombre: { contains: search, mode: 'insensitive' } },
            { clienteEmail: { contains: search, mode: 'insensitive' } },
          ],
        }),
      },
      include: this.include,
      orderBy: { fechaEmision: 'desc' },
    });
  }

  async findOne(idFactura: number) {
    const f = await this.prisma.factura.findUnique({
      where: { idFactura },
      include: this.include,
    });
    if (!f) throw new NotFoundException('Factura no encontrada');
    return f;
  }

  async create(dto: CreateFacturaDto) {
    // Validar cliente
    const cliente = await this.prisma.cliente.findUnique({
      where: { idCliente: dto.clienteId },
    });
    if (!cliente) throw new NotFoundException('Cliente no encontrado');

    // Validar crédito fiscal — requiere NIT
    if (dto.tipo === 'credito_fiscal' && !dto.clienteNit) {
      throw new BadRequestException('El NIT es requerido para Crédito Fiscal');
    }

    // Validar reservación si viene
    if (dto.reservacionId) {
      const reservacion = await this.prisma.reservacion.findUnique({
        where: { idReservacion: dto.reservacionId },
      });
      if (!reservacion)
        throw new NotFoundException('Reservación no encontrada');

      const yaFacturada = await this.prisma.factura.findUnique({
        where: { reservacionId: dto.reservacionId },
      });
      if (yaFacturada)
        throw new ConflictException(
          'Esta reservación ya tiene una factura emitida',
        );
    }

    if (dto.items.length === 0) {
      throw new BadRequestException('La factura debe tener al menos un ítem');
    }

    // Calcular totales
    const items = dto.items.map((i) => ({
      descripcion: i.descripcion,
      cantidad: i.cantidad,
      precioUnit: i.precioUnit,
      subtotal: i.cantidad * i.precioUnit,
    }));

    const subtotal = items.reduce((s, i) => s + i.subtotal, 0);
    const descuento = 0; // el descuento ya viene aplicado en los ítems de estadía
    const subtotalConDesc = subtotal - descuento;

    // Crédito Fiscal: precio sin IVA - IVA desglosado
    // Consumidor Final: precio con IVA incluido se extrae para mostrar
    let iva: number;
    let turismo: number;

    if (dto.tipo === 'credito_fiscal') {
      // Precios netos - agregar impuestos encima
      iva = subtotalConDesc * IVA_RATE;
      turismo = subtotalConDesc * TURISMO_RATE;
    } else {
      // Precios con IVA incluido - extraer
      iva = subtotalConDesc - subtotalConDesc / (1 + IVA_RATE);
      turismo = subtotalConDesc * TURISMO_RATE; // turismo sobre base
    }

    const total =
      dto.tipo === 'credito_fiscal'
        ? subtotalConDesc + iva + turismo
        : subtotalConDesc + turismo; // IVA ya incluido en CF

    // Generar número correlativo
    const numeroFactura = await this.generarNumero(dto.tipo);

    return this.prisma.factura.create({
      data: {
        numeroFactura,
        tipo: dto.tipo,
        clienteId: dto.clienteId,
        reservacionId: dto.reservacionId,
        clienteNombre: `${cliente.nombre} ${cliente.apellido}`,
        clienteEmail: cliente.email,
        clienteDui: cliente.dui,
        clienteNit: dto.clienteNit,
        clienteNrc: dto.clienteNrc,
        clienteGiro: dto.clienteGiro,
        clienteDireccion: dto.clienteDireccion,
        notas: dto.notas,
        subtotal,
        descuento,
        subtotalConDesc,
        iva,
        turismo,
        total,
        items: { create: items },
      },
      include: this.include,
    });
  }

  async anular(idFactura: number, dto: AnularFacturaDto) {
    const factura = await this.findOne(idFactura);
    if (factura.estado === 'anulada') {
      throw new ConflictException('La factura ya está anulada');
    }
    return this.prisma.factura.update({
      where: { idFactura },
      data: { estado: 'anulada', motivoAnulacion: dto.motivoAnulacion },
      include: this.include,
    });
  }

  // Precargar ítems desde una reservación
  async getItemsDesdeReservacion(idReservacion: number) {
    const r = await this.prisma.reservacion.findUnique({
      where: { idReservacion },
      include: {
        habitacion: { include: { tipo: true } },
        cliente: true,
      },
    });
    if (!r) throw new NotFoundException('Reservación no encontrada');

    const noches = Math.ceil(
      (new Date(r.fechaSalida).getTime() - new Date(r.fechaEntrada).getTime()) /
        (1000 * 60 * 60 * 24),
    );
    const precioNoche = Number(r.precioNoche);
    const descPct = Number(r.descuento);
    const subtotal = precioNoche * noches;
    const monto = subtotal * (1 - descPct / 100);

    return {
      reservacion: r,
      cliente: r.cliente,
      items: [
        {
          descripcion: `Estadía — Habitación ${r.habitacion.numero} (${r.habitacion.tipo.nombre}) · ${noches} noche${noches > 1 ? 's' : ''}${descPct > 0 ? ` · Descuento ${descPct}%` : ''}`,
          cantidad: 1,
          precioUnit: monto,
        },
      ],
    };
  }

  private async generarNumero(tipo: TipoFactura): Promise<string> {
    const prefix = tipo === 'consumidor_final' ? 'CF' : 'CCF';
    const count = await this.prisma.factura.count({ where: { tipo } });
    return `${prefix}-${String(count + 1).padStart(4, '0')}`;
  }
}
