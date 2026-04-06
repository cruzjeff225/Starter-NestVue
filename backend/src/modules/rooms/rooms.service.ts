import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common'
import { PrismaService } from '../../prisma/prismaService'
import { CreateRoomDto } from './dto/create-room.dto'
import { UpdateRoomDto } from './dto/update-room.dto'
import { RoomStatus } from '@prisma/client'

@Injectable()
export class RoomsService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateRoomDto) {
    const existe = await this.prisma.room.findUnique({
      where: { number: dto.number },
    })

    if (existe) {
      throw new BadRequestException('Número de habitación ya existe')
    }

    const type = await this.prisma.roomType.findUnique({
      where: { id: dto.typeId },
    })

    if (!type) {
      throw new BadRequestException('Tipo de habitación no válido')
    }

    return this.prisma.room.create({
      data: dto,
      include: { type: true },
    })
  }

  async findAll() {
    return this.prisma.room.findMany({
      orderBy: { number: 'asc' },
      include: { type: true },
    })
  }

  async findOne(id: string) {
    const room = await this.prisma.room.findUnique({
      where: { id },
      include: {
        type: true,
        reservas: true,
      },
    })

    if (!room) {
      throw new NotFoundException('Habitación no encontrada')
    }

    return room
  }

  async update(id: string, dto: UpdateRoomDto) {
    await this.findOne(id)

    if (dto.number) {
      const existe = await this.prisma.room.findFirst({
        where: {
          number: dto.number,
          NOT: { id },
        },
      })

      if (existe) {
        throw new BadRequestException('Número de habitación ya en uso')
      }
    }

    return this.prisma.room.update({
      where: { id },
      data: dto,
      include: { type: true },
    })
  }

  async remove(id: string) {
    const room = await this.findOne(id)

    if (room.reservas.length > 0) {
      throw new BadRequestException(
        'No puede eliminar una habitación con reservas',
      )
    }

    return this.prisma.room.delete({
      where: { id },
    })
  }

  async changeStatus(id: string, status: RoomStatus) {
    await this.findOne(id)

    return this.prisma.room.update({
      where: { id },
      data: { status },
    })
  }
}