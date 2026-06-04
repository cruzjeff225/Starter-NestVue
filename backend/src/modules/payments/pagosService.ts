import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { EstadoPago } from '@prisma/client';
import { PrismaService } from '../../prisma/prismaService';
import { CreatePagoDto } from './dto/createPagoDto';
import { UpdateEstadoPagoDto } from './dto/updateEstadoPagoDto';
import { PaymentGatewayProvider } from './paymentGatewayProvider';

@Injectable()
export class PagosService {
  constructor(
    private prisma: PrismaService,
    private gateway: PaymentGatewayProvider,
  ) {}

  private readonly include = {
    reservacion: {
      select: {
        idReservacion: true,
        fechaEntrada: true,
        fechaSalida: true,
        totalCalculado: true,
        cliente: { select: { nombre: true, apellido: true, email: true } },
        habitacion: { select: { numero: true } },
      },
    },
    factura: {
      select: {
        idFactura: true,
        numeroFactura: true,
        total: true,
        estado: true,
      },
    },
  };

  async findAll(params?: {
    search?: string;
    estado?: EstadoPago;
    reservacionId?: number;
    facturaId?: number;
  }) {
    const { search, estado, reservacionId, facturaId } = params ?? {};

    return this.prisma.pago.findMany({
      where: {
        ...(estado && { estado }),
        ...(reservacionId && { reservacionId }),
        ...(facturaId && { facturaId }),
        ...(search && {
          OR: [
            { referencia: { contains: search, mode: 'insensitive' as const } },
            { titular: { contains: search, mode: 'insensitive' as const } },
            { emailPagador: { contains: search, mode: 'insensitive' as const } },
          ],
        }),
      },
      include: this.include,
      orderBy: { creadoEn: 'desc' },
    });
  }

  async findOne(idPago: number) {
    const pago = await this.prisma.pago.findUnique({
      where: { idPago },
      include: this.include,
    });
    if (!pago) throw new NotFoundException('Pago no encontrado');
    return pago;
  }

  async create(dto: CreatePagoDto) {
    if (!dto.reservacionId && !dto.facturaId) {
      throw new BadRequestException(
        'El pago debe estar asociado a una reservacion o factura',
      );
    }

    await this.validarReferencias(dto);

    const resultado = await this.gateway.procesar({
      monto: dto.monto,
      metodo: dto.metodo,
      titular: dto.titular,
      tarjetaNumero: dto.tarjetaNumero,
      vencimiento: dto.vencimiento,
      cvv: dto.cvv,
      bancoOrigen: dto.bancoOrigen,
      referenciaBancaria: dto.referenciaBancaria,
      pasarela: dto.pasarela,
    });

    return this.prisma.pago.create({
      data: {
        referencia: this.gateway.generarReferencia(),
        proveedor: 'simulado',
        metodo: dto.metodo,
        estado: resultado.estado,
        monto: dto.monto,
        moneda: dto.moneda ?? 'USD',
        autorizacion: resultado.autorizacion,
        motivoRechazo: resultado.motivoRechazo,
        titular: dto.titular,
        emailPagador: dto.emailPagador,
        ultimos4: resultado.ultimos4,
        marcaTarjeta: resultado.marcaTarjeta,
        tokenPasarela: resultado.tokenPasarela,
        notas: dto.notas,
        metadata: resultado.metadata as any,
        reservacionId: dto.reservacionId,
        facturaId: dto.facturaId,
      },
      include: this.include,
    });
  }

  async cambiarEstado(idPago: number, dto: UpdateEstadoPagoDto) {
    await this.findOne(idPago);

    return this.prisma.pago.update({
      where: { idPago },
      data: {
        estado: dto.estado,
        motivoRechazo:
          dto.estado === 'rechazado' ? dto.motivoRechazo : undefined,
      },
      include: this.include,
    });
  }

  async reembolsar(idPago: number) {
    const pago = await this.findOne(idPago);
    if (pago.estado !== 'aprobado') {
      throw new BadRequestException('Solo se pueden reembolsar pagos aprobados');
    }

    return this.prisma.pago.update({
      where: { idPago },
      data: { estado: 'reembolsado' },
      include: this.include,
    });
  }

  private async validarReferencias(dto: CreatePagoDto) {
    if (dto.reservacionId) {
      const reservacion = await this.prisma.reservacion.findUnique({
        where: { idReservacion: dto.reservacionId },
      });
      if (!reservacion) throw new NotFoundException('Reservacion no encontrada');
    }

    if (dto.facturaId) {
      const factura = await this.prisma.factura.findUnique({
        where: { idFactura: dto.facturaId },
      });
      if (!factura) throw new NotFoundException('Factura no encontrada');
      if (factura.estado === 'anulada') {
        throw new BadRequestException('No se puede pagar una factura anulada');
      }
    }
  }
}
