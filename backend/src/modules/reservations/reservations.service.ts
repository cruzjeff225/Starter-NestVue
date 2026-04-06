import { Injectable, BadRequestException } from '@nestjs/common'
import { PrismaService } from '../../prisma/prismaService'
import { CreateReservationDto } from './dto/create-reservation.dto'
import { UpdateReservationDto } from './dto/update-reservation.dto'
import { ReservationStatus, RoomStatus } from '@prisma/client'

@Injectable()
export class ReservationsService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateReservationDto) {
    const checkIn = new Date(dto.checkIn)
    const checkOut = new Date(dto.checkOut)

    // 🔴 Validación básica
    if (checkOut <= checkIn) {
      throw new BadRequestException('La fecha de salida debe ser mayor')
    }

    // 🔍 Validar cliente
    const customer = await this.prisma.customer.findUnique({
      where: { id: dto.customerId },
    })

    if (!customer) {
      throw new BadRequestException('Cliente no existe')
    }

    // 🔍 Validar habitación
    const room = await this.prisma.room.findUnique({
      where: { id: dto.roomId },
    })

    if (!room) {
      throw new BadRequestException('Habitación no existe')
    }

    if (room.status === RoomStatus.MAINTENANCE) {
      throw new BadRequestException('Habitación en mantenimiento')
    }

    // 🔥 VALIDACIÓN PRO (EVITA DOBLE RESERVA)
    const conflicto = await this.prisma.reservation.findFirst({
      where: {
        roomId: dto.roomId,
        status: { not: ReservationStatus.CANCELLED },
        AND: [
          { checkIn: { lte: checkOut } },
          { checkOut: { gte: checkIn } },
        ],
      },
    })

    if (conflicto) {
      throw new BadRequestException(
        'La habitación ya está reservada en esas fechas',
      )
    }

    // ✅ Crear reserva
    return this.prisma.reservation.create({
      data: {
        customerId: dto.customerId,
        roomId: dto.roomId,
        checkIn,
        checkOut,
        status: ReservationStatus.RESERVED,
      },
      include: {
        customer: true,
        room: {
          include: { type: true },
        },
      },
    })
  }

  findAll() {
    return this.prisma.reservation.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        customer: true,
        room: {
          include: { type: true },
        },
      },
    })
  }

  findOne(id: string) {
    return this.prisma.reservation.findUnique({
      where: { id },
      include: {
        customer: true,
        room: true,
      },
    })
  }

  async update(id: string, dto: UpdateReservationDto) {
    return this.prisma.reservation.update({
      where: { id },
      data: dto,
    })
  }

  // 🔥 CANCELAR
  async remove(id: string) {
    return this.prisma.reservation.update({
      where: { id },
      data: { status: ReservationStatus.CANCELLED },
    })
  }

  // 🔥 CHECK-IN
  async checkIn(id: string) {
    const reserva = await this.prisma.reservation.findUnique({
      where: { id },
    })

    if (!reserva) {
      throw new BadRequestException('Reserva no encontrada')
    }

    // ocupar habitación
    await this.prisma.room.update({
      where: { id: reserva.roomId },
      data: { status: RoomStatus.OCCUPIED },
    })

    return this.prisma.reservation.update({
      where: { id },
      data: { status: ReservationStatus.CHECKED_IN },
    })
  }

  // 🔥 CHECK-OUT
  async checkOut(id: string) {
    const reserva = await this.prisma.reservation.findUnique({
      where: { id },
    })

    if (!reserva) {
      throw new BadRequestException('Reserva no encontrada')
    }

    // liberar habitación
    await this.prisma.room.update({
      where: { id: reserva.roomId },
      data: { status: RoomStatus.AVAILABLE },
    })

    return this.prisma.reservation.update({
      where: { id },
      data: { status: ReservationStatus.CHECKED_OUT },
    })
  }
}