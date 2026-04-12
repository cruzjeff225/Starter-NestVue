import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prismaService';
import { CreateHabitacionDto } from './dto/createHabitacionDto';
import { UpdateHabitacionDto } from './dto/updateHabitacionDto';
import { CreateTipoHabitacionDto } from './dto/createTipoHabitacionDto';
import { UpdateTipoHabitacionDto } from './dto/updateTipoHabitacion';
import { CambiarEstadoDto } from './dto/cambiarEstadoDto';
import { EstadoHabitacion } from '@prisma/client';

@Injectable()
export class HabitacionesService {
  constructor(private prisma: PrismaService) {}

  // ── Habitaciones

  async findAll(search?: string, estado?: EstadoHabitacion, tipoId?: number) {
    return this.prisma.habitacion.findMany({
      where: {
        ...(estado && { estado }),
        ...(tipoId && { tipoId }),
        ...(search && {
          OR: [
            { numero: { contains: search, mode: 'insensitive' } },
            { descripcion: { contains: search, mode: 'insensitive' } },
          ],
        }),
      },
      include: { tipo: true },
      orderBy: [{ piso: 'asc' }, { numero: 'asc' }],
    });
  }

  async findOne(idHabitacion: number) {
    const hab = await this.prisma.habitacion.findUnique({
      where: { idHabitacion },
      include: { tipo: true },
    });
    if (!hab) throw new NotFoundException('Habitación no encontrada');
    return hab;
  }

  async create(dto: CreateHabitacionDto) {
    const existe = await this.prisma.habitacion.findUnique({
      where: { numero: dto.numero },
    });
    if (existe)
      throw new ConflictException('Ya existe una habitación con ese número');

    await this.findTipoOrFail(dto.tipoId);
    return this.prisma.habitacion.create({
      data: dto,
      include: { tipo: true },
    });
  }

  async update(idHabitacion: number, dto: UpdateHabitacionDto) {
    await this.findOne(idHabitacion);

    if (dto.numero) {
      const existe = await this.prisma.habitacion.findFirst({
        where: { numero: dto.numero, NOT: { idHabitacion } },
      });
      if (existe)
        throw new ConflictException('Ese número de habitación ya está en uso');
    }

    if (dto.tipoId) await this.findTipoOrFail(dto.tipoId);

    return this.prisma.habitacion.update({
      where: { idHabitacion },
      data: dto,
      include: { tipo: true },
    });
  }

  async cambiarEstado(idHabitacion: number, dto: CambiarEstadoDto) {
    await this.findOne(idHabitacion);
    return this.prisma.habitacion.update({
      where: { idHabitacion },
      data: { estado: dto.estado },
      include: { tipo: true },
    });
  }

  async toggleActivo(idHabitacion: number) {
    const hab = await this.findOne(idHabitacion);
    return this.prisma.habitacion.update({
      where: { idHabitacion },
      data: { activo: !hab.activo },
      include: { tipo: true },
    });
  }

  // ── Tipos de habitación

  async findAllTipos() {
    return this.prisma.tipoHabitacion.findMany({
      include: { _count: { select: { habitaciones: true } } },
      orderBy: { nombre: 'asc' },
    });
  }

  async createTipo(dto: CreateTipoHabitacionDto) {
    const existe = await this.prisma.tipoHabitacion.findUnique({
      where: { nombre: dto.nombre },
    });
    if (existe) throw new ConflictException('Ya existe un tipo con ese nombre');
    return this.prisma.tipoHabitacion.create({ data: dto });
  }

  async updateTipo(idTipo: number, dto: UpdateTipoHabitacionDto) {
    await this.findTipoOrFail(idTipo);
    return this.prisma.tipoHabitacion.update({ where: { idTipo }, data: dto });
  }

  async deleteTipo(idTipo: number) {
    const tipo = await this.findTipoOrFail(idTipo);
    if (tipo._count?.habitaciones > 0) {
      throw new ConflictException(
        'No se puede eliminar un tipo con habitaciones asociadas',
      );
    }
    return this.prisma.tipoHabitacion.delete({ where: { idTipo } });
  }

  private async findTipoOrFail(idTipo: number) {
    const tipo = await this.prisma.tipoHabitacion.findUnique({
      where: { idTipo },
      include: { _count: { select: { habitaciones: true } } },
    });
    if (!tipo) throw new NotFoundException('Tipo de habitación no encontrado');
    return tipo;
  }
}
