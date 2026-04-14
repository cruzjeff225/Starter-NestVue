import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prismaService';
import { CreateReservacionDto } from './dto/CreateReservacionDto';
import { UpdateReservacionDto } from './dto/updateReservacionDto';
import { CambiarEstadoReservacionDto } from './dto/cambiarEstadoReservacionDto';
import { EstadoReservacion } from '@prisma/client';

@Injectable()
export class ReservacionesService {
  constructor(private prisma: PrismaService) {}

  private readonly include = {
    cliente: {
      select: { idCliente: true, nombre: true, apellido: true, email: true },
    },
    habitacion: {
      select: { idHabitacion: true, numero: true, piso: true, tipo: true },
    },
  };

  async findAll(params?: {
    search?: string;
    estado?: EstadoReservacion;
    clienteId?: number;
    habitacionId?: number;
    fechaDesde?: string;
    fechaHasta?: string;
  }) {
    const { search, estado, clienteId, habitacionId, fechaDesde, fechaHasta } =
      params ?? {};
    return this.prisma.reservacion.findMany({
      where: {
        ...(estado && { estado }),
        ...(clienteId && { clienteId }),
        ...(habitacionId && { habitacionId }),
        ...(fechaDesde && { fechaEntrada: { gte: new Date(fechaDesde) } }),
        ...(fechaHasta && { fechaSalida: { lte: new Date(fechaHasta) } }),
        ...(search && {
          OR: [
            {
              cliente: {
                nombre: { contains: search, mode: 'insensitive' as const },
              },
            },
            {
              cliente: {
                apellido: { contains: search, mode: 'insensitive' as const },
              },
            },
            {
              habitacion: {
                numero: { contains: search, mode: 'insensitive' as const },
              },
            },
          ],
        }),
      },
      include: this.include,
      orderBy: { fechaEntrada: 'desc' },
    });
  }

  async findOne(idReservacion: number) {
    const r = await this.prisma.reservacion.findUnique({
      where: { idReservacion },
      include: this.include,
    });
    if (!r) throw new NotFoundException('Reservación no encontrada');
    return r;
  }

  async create(dto: CreateReservacionDto) {
    const {
      fechaEntrada,
      fechaSalida,
      habitacionId,
      clienteId,
      descuento,
      ...rest
    } = dto;

    const entrada = new Date(fechaEntrada);
    const salida = new Date(fechaSalida);

    if (salida <= entrada) {
      throw new BadRequestException(
        'La fecha de salida debe ser posterior a la de entrada',
      );
    }

    // Verificar disponibilidad de habitación
    await this.verificarDisponibilidad(habitacionId, entrada, salida);

    // Obtener precio base del tipo de habitación
    const habitacion = await this.prisma.habitacion.findUnique({
      where: { idHabitacion: habitacionId },
      include: { tipo: true },
    });
    if (!habitacion) throw new NotFoundException('Habitación no encontrada');
    if (!habitacion.activo)
      throw new BadRequestException('La habitación no está activa');

    // Verificar cliente activo
    const cliente = await this.prisma.cliente.findUnique({
      where: { idCliente: clienteId },
    });
    if (!cliente) throw new NotFoundException('Cliente no encontrado');
    if (!cliente.activo)
      throw new BadRequestException('El cliente no está activo');

    const noches = this.calcularNoches(entrada, salida);
    const precioNoche = Number(habitacion.tipo.precioBase);
    const totalBruto = precioNoche * noches;
    const totalCalculado = totalBruto * (1 - descuento / 100);

    return this.prisma.reservacion.create({
      data: {
        ...rest,
        fechaEntrada: entrada,
        fechaSalida: salida,
        habitacionId,
        clienteId,
        descuento,
        precioNoche,
        totalCalculado,
      },
      include: this.include,
    });
  }

  async update(idReservacion: number, dto: UpdateReservacionDto) {
    const reservacion = await this.findOne(idReservacion);

    const entrada = dto.fechaEntrada
      ? new Date(dto.fechaEntrada)
      : reservacion.fechaEntrada;
    const salida = dto.fechaSalida
      ? new Date(dto.fechaSalida)
      : reservacion.fechaSalida;
    const habitacionId = dto.habitacionId ?? reservacion.habitacionId;
    const descuento = dto.descuento ?? Number(reservacion.descuento);

    if (salida <= entrada) {
      throw new BadRequestException(
        'La fecha de salida debe ser posterior a la de entrada',
      );
    }

    // Reverificar disponibilidad si cambian fechas o habitación
    if (dto.fechaEntrada || dto.fechaSalida || dto.habitacionId) {
      await this.verificarDisponibilidad(
        habitacionId,
        entrada,
        salida,
        idReservacion,
      );
    }

    // Recalcular total si cambian fechas, habitación o descuento
    let precioNoche = Number(reservacion.precioNoche);
    if (dto.habitacionId) {
      const hab = await this.prisma.habitacion.findUnique({
        where: { idHabitacion: habitacionId },
        include: { tipo: true },
      });
      precioNoche = Number(hab!.tipo.precioBase);
    }

    const noches = this.calcularNoches(entrada, salida);
    const totalCalculado = precioNoche * noches * (1 - descuento / 100);

    return this.prisma.reservacion.update({
      where: { idReservacion },
      data: {
        ...dto,
        ...(dto.fechaEntrada && { fechaEntrada: entrada }),
        ...(dto.fechaSalida && { fechaSalida: salida }),
        precioNoche,
        totalCalculado,
      },
      include: this.include,
    });
  }

  async cambiarEstado(idReservacion: number, dto: CambiarEstadoReservacionDto) {
    await this.findOne(idReservacion);

    // Al confirmar: cambiar habitación a reservada, al iniciar (en_curso): cambiar habitación a ocupada, al completar/cancelar/no_show: liberar habitación
    const estadosQueOcupan: EstadoReservacion[] = ['en_curso'];
    const estadosQueReservan: EstadoReservacion[] = ['confirmada'];
    const estadosQueLibera: EstadoReservacion[] = [
      'completada',
      'cancelada',
      'no_show',
    ];

    const reservacion = await this.prisma.reservacion.findUnique({
      where: { idReservacion },
    });

    let nuevoEstadoHabitacion: string | undefined;
    if (estadosQueOcupan.includes(dto.estado))
      nuevoEstadoHabitacion = 'ocupada';
    else if (estadosQueReservan.includes(dto.estado))
      nuevoEstadoHabitacion = 'reservada';
    else if (estadosQueLibera.includes(dto.estado))
      nuevoEstadoHabitacion = 'disponible';

    const [updated] = await this.prisma.$transaction([
      this.prisma.reservacion.update({
        where: { idReservacion },
        data: {
          estado: dto.estado,
          ...(dto.motivoCancelacion && {
            motivoCancelacion: dto.motivoCancelacion,
          }),
        },
        include: this.include,
      }),
      ...(nuevoEstadoHabitacion
        ? [
            this.prisma.habitacion.update({
              where: { idHabitacion: reservacion!.habitacionId },
              data: { estado: nuevoEstadoHabitacion as any },
            }),
          ]
        : []),
    ]);

    return updated;
  }

  // Helpers

  private calcularNoches(entrada: Date, salida: Date): number {
    const diff = salida.getTime() - entrada.getTime();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  }

  private async verificarDisponibilidad(
    habitacionId: number,
    entrada: Date,
    salida: Date,
    excluirId?: number,
  ) {
    const conflicto = await this.prisma.reservacion.findFirst({
      where: {
        habitacionId,
        idReservacion: excluirId ? { not: excluirId } : undefined,
        estado: { notIn: ['cancelada', 'no_show', 'completada'] },
        AND: [
          { fechaEntrada: { lt: salida } },
          { fechaSalida: { gt: entrada } },
        ],
      },
    });
    if (conflicto) {
      throw new ConflictException(
        `La habitación ya tiene una reservación en esas fechas (${conflicto.estado})`,
      );
    }
  }
}
