import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prismaService';
import { CreateHabitacionDto } from './dto/createHabitacionDto';
import { UpdateHabitacionDto } from './dto/updateHabitacionDto';
import { CreateTipoHabitacionDto } from './dto/createTipoHabitacionDto';
import { UpdateTipoHabitacionDto } from './dto/updateTipoHabitacion';
import { CambiarEstadoDto } from './dto/cambiarEstadoDto';
import { EstadoHabitacion } from '@prisma/client';

// ── Modificadores de precio por industria hotelera ───────────────────────────
// Fuente: estándares Kalibri Labs / AltexSoft / Roompulse 2024-2026
const MODIFICADORES_VISTA: Record<string, number> = {
  mar:      0.25,  // +25% — vista al mar: mayor premium
  montania: 0.20,  // +20% — vistas de montaña/naturaleza
  ciudad:   0.15,  // +15% — vista panorámica urbana
  piscina:  0.12,  // +12% — vista directa a piscina
  jardin:   0.08,  // +8%  — vista a jardines
  ninguna:  0.00,  // sin modificador
};

const MODIFICADORES_CERCANIA: Record<string, number> = {
  playa:      0.15,  // +15% — acceso directo a playa
  piscina:    0.10,  // +10% — piscina en el mismo edificio/área
  spa:        0.08,  // +8%  — spa cercano
  restaurante: 0.06, // +6%  — restaurante conveniente
  bar:        0.05,  // +5%  — bar/lounge cercano
  gym:        0.04,  // +4%  — gym/fitness center
};

const MAX_MODIFICADOR = 0.45; // cap del 45% sobre precio base

export function calcularPrecioFinal(
  precioBase: number,
  vista?: string | null,
  cercanias?: string[],
): number {
  let modificador = 0;

  if (vista && MODIFICADORES_VISTA[vista]) {
    modificador += MODIFICADORES_VISTA[vista];
  }

  for (const c of cercanias ?? []) {
    if (MODIFICADORES_CERCANIA[c]) {
      modificador += MODIFICADORES_CERCANIA[c];
    }
  }

  // Cap máximo para evitar precios absurdos
  modificador = Math.min(modificador, MAX_MODIFICADOR);

  return Math.round(precioBase * (1 + modificador) * 100) / 100;
}

@Injectable()
export class HabitacionesService {
  constructor(private prisma: PrismaService) {}

  // ── Habitaciones ──────────────────────────────────────────────────────────

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

    const tipo = await this.findTipoOrFail(dto.tipoId);
    const precioFinal = calcularPrecioFinal(
      Number(tipo.precioBase),
      dto.vista,
      dto.cercaniasStr,
    );

    return this.prisma.habitacion.create({
      data: { ...dto, precioFinal },
      include: { tipo: true },
    });
  }

  async update(idHabitacion: number, dto: UpdateHabitacionDto) {
    const hab = await this.findOne(idHabitacion);

    if (dto.numero) {
      const existe = await this.prisma.habitacion.findFirst({
        where: { numero: dto.numero, NOT: { idHabitacion } },
      });
      if (existe)
        throw new ConflictException('Ese número de habitación ya está en uso');
    }

    const tipoId = dto.tipoId ?? hab.tipoId;
    const tipo = await this.findTipoOrFail(tipoId);

    const vista = dto.vista !== undefined ? dto.vista : hab.vista;
    const cercanias = dto.cercaniasStr !== undefined
      ? dto.cercaniasStr
      : hab.cercaniasStr;

    const precioFinal = calcularPrecioFinal(
      Number(tipo.precioBase),
      vista,
      cercanias,
    );

    return this.prisma.habitacion.update({
      where: { idHabitacion },
      data: { ...dto, precioFinal },
      include: { tipo: true },
    });
  }

  async cambiarEstado(idHabitacion: number, dto: CambiarEstadoDto) {
    const hab = await this.findOne(idHabitacion);

    // No se puede cambiar estado de habitación inactiva manualmente
    if (!hab.activo && dto.estado !== EstadoHabitacion.mantenimiento) {
      throw new BadRequestException(
        'No se puede cambiar el estado de una habitación inactiva',
      );
    }

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

  // ── Tipos ─────────────────────────────────────────────────────────────────

  async findAllTipos() {
    return this.prisma.tipoHabitacion.findMany({
      include: { _count: { select: { habitaciones: true } } },
      orderBy: { precioBase: 'asc' },
    });
  }

  async createTipo(dto: CreateTipoHabitacionDto) {
    const existe = await this.prisma.tipoHabitacion.findUnique({
      where: { nombre: dto.nombre },
    });
    if (existe)
      throw new ConflictException('Ya existe un tipo con ese nombre');
    return this.prisma.tipoHabitacion.create({ data: dto });
  }

  async updateTipo(idTipo: number, dto: UpdateTipoHabitacionDto) {
    await this.findTipoOrFail(idTipo);
    return this.prisma.tipoHabitacion.update({
      where: { idTipo },
      data: dto,
    });
  }

  async deleteTipo(idTipo: number) {
    const tipo = await this.prisma.tipoHabitacion.findUnique({
      where: { idTipo },
      include: { _count: { select: { habitaciones: true } } },
    });
    if (!tipo) throw new NotFoundException('Tipo no encontrado');
    if (tipo._count.habitaciones > 0)
      throw new ConflictException(
        `No se puede eliminar: tiene ${tipo._count.habitaciones} habitación(es) asignadas`,
      );
    return this.prisma.tipoHabitacion.delete({ where: { idTipo } });
  }

  // ── Helpers ───────────────────────────────────────────────────────────────

  async findTipoOrFail(idTipo: number) {
    const tipo = await this.prisma.tipoHabitacion.findUnique({
      where: { idTipo },
    });
    if (!tipo) throw new NotFoundException('Tipo de habitación no encontrado');
    return tipo;
  }
}
