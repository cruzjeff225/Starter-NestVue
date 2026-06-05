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
const money = (value: number) =>
  Math.round((value + Number.EPSILON) * 100) / 100;

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
    page?: number;
    limit?: number;
  }) {
    const { search, tipo, estado, page = 1, limit = 20 } = params ?? {};
    const skip = (page - 1) * limit;

    const where = {
      ...(tipo && { tipo }),
      ...(estado && { estado: estado as any }),
      ...(search && {
        OR: [
          { numeroFactura: { contains: search, mode: 'insensitive' as const } },
          { clienteNombre: { contains: search, mode: 'insensitive' as const } },
          { clienteEmail: { contains: search, mode: 'insensitive' as const } },
        ],
      }),
    };

    const [data, total] = await this.prisma.$transaction([
      this.prisma.factura.findMany({
        where,
        include: this.include,
        orderBy: { fechaEmision: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.factura.count({ where }),
    ]);

    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
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
    const cliente = await this.prisma.cliente.findUnique({
      where: { idCliente: dto.clienteId },
    });
    if (!cliente) throw new NotFoundException('Cliente no encontrado');

    if (dto.tipo === 'credito_fiscal' && !dto.clienteNit) {
      throw new BadRequestException('El NIT es requerido para CrÃ©dito Fiscal');
    }

    if (dto.reservacionId) {
      const reservacion = await this.prisma.reservacion.findUnique({
        where: { idReservacion: dto.reservacionId },
      });
      if (!reservacion)
        throw new NotFoundException('ReservaciÃ³n no encontrada');

      // Solo reservaciones completadas pueden facturarse
      if (reservacion.estado !== 'completada') {
        throw new BadRequestException(
          'Solo se pueden facturar reservaciones completadas',
        );
      }

      const yaFacturada = await this.prisma.factura.findUnique({
        where: { reservacionId: dto.reservacionId },
      });
      if (yaFacturada)
        throw new ConflictException(
          'Esta reservaciÃ³n ya tiene una factura emitida',
        );
    }

    if (!Array.isArray(dto.items) || dto.items.length === 0) {
      throw new BadRequestException('La factura debe tener al menos un item');
    }

    const items = dto.items.map((i) => ({
      descripcion: i.descripcion?.trim(),
      cantidad: Number(i.cantidad),
      precioUnit: money(Number(i.precioUnit)),
      subtotal: money(Number(i.cantidad) * Number(i.precioUnit)),
    }));

    const itemInvalido = items.some(
      (i) => !i.descripcion || i.cantidad < 1 || i.precioUnit < 0,
    );
    if (itemInvalido) {
      throw new BadRequestException(
        'Todos los items deben tener descripcion, cantidad y precio validos',
      );
    }

    const subtotal = money(items.reduce((s, i) => s + i.subtotal, 0));
    const descuento = 0;
    const subtotalConDesc = money(subtotal - descuento);

    let iva: number;
    let turismo: number;
    let total: number;

    if (dto.tipo === 'consumidor_final') {
      iva = money(subtotalConDesc - subtotalConDesc / (1 + IVA_RATE));
      turismo = money(subtotalConDesc * TURISMO_RATE);
      total = money(subtotalConDesc + turismo);
    } else {
      iva = money(subtotalConDesc * IVA_RATE);
      turismo = money(subtotalConDesc * TURISMO_RATE);
      total = money(subtotalConDesc + iva + turismo);
    }

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
      throw new ConflictException('La factura ya estÃ¡ anulada');
    }
    return this.prisma.factura.update({
      where: { idFactura },
      data: { estado: 'anulada', motivoAnulacion: dto.motivoAnulacion },
      include: this.include,
    });
  }

  async getItemsDesdeReservacion(idReservacion: number) {
    const r = await this.prisma.reservacion.findUnique({
      where: { idReservacion },
      include: {
        habitacion: { include: { tipo: true } },
        cliente: true,
      },
    });
    if (!r) throw new NotFoundException('ReservaciÃ³n no encontrada');

    const noches = Math.ceil(
      (new Date(r.fechaSalida).getTime() - new Date(r.fechaEntrada).getTime()) /
        (1000 * 60 * 60 * 24),
    );
    const precioNoche = Number(r.precioNoche);
    const descPct = Number(r.descuento);
    const subtotal = precioNoche * noches;
    const monto = subtotal * (1 - descPct / 100);

    // Check if this reservacion already has an invoice
    const facturaExistente = await this.prisma.factura.findUnique({
      where: { reservacionId: idReservacion },
      select: { idFactura: true, numeroFactura: true, estado: true },
    });

    return {
      reservacion: r,
      cliente: r.cliente,
      facturaExistente,
      items: [
        {
          descripcion: `EstadÃ­a â€” HabitaciÃ³n ${r.habitacion.numero} (${r.habitacion.tipo.nombre}) Â· ${noches} noche${noches > 1 ? 's' : ''}${descPct > 0 ? ` Â· Descuento ${descPct}%` : ''}`,
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

