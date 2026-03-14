import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prismaService';
import { CreateRolDto } from './dto/createRolDto';
import { UpdateRolDto } from './dto/updateRolDto';

@Injectable()
export class RolesService {
  constructor(private prisma: PrismaService) {}

  findAll() {
    return this.prisma.rol.findMany({
      include: {
        permisos: {
          include: { permiso: true },
        },
        _count: { select: { usuarios: true } },
      },
      orderBy: { nombre: 'asc' },
    });
  }

  // Crear nuevo rol
  async create(dto: CreateRolDto) {
    // Verificar si el rol ya existe
    const existing = await this.prisma.rol.findUnique({
      where: { nombre: dto.nombre },
    });
    if (existing)
      throw new ConflictException('Ya existe un rol con ese nombre');

    // Crear el rol
    return this.prisma.rol.create({ data: { nombre: dto.nombre } });
  }

  // Actualizar un rol existente
  async update(id: number, dto: UpdateRolDto) {
    // Verificar si el rol existe
    await this.findOne(id);

    // Verificar si el nuevo nombre ya está en uso por otro rol
    const existing = await this.prisma.rol.findUnique({
      where: { nombre: dto.nombre },
    });
    if (existing && existing.idRol !== id) {
      throw new ConflictException('Ya existe un rol con ese nombre');
    }

    // Actualizar el rol
    return this.prisma.rol.update({
      where: { idRol: id },
      data: { nombre: dto.nombre },
    });
  }

  // Eliminar un rol
  async remove(id: number) {
    // Verificar si el rol existe
    const rol = await this.findOne(id);

    // Proteger el rol superadmin de ser eliminado
    if (rol.nombre === 'superadmin') {
      throw new ConflictException(
        'No se puede eliminar el rol base del sistema',
      );
    }

    // Verificar si el rol está asignado a algún usuario
    const assignedUser = await this.prisma.usuario.count({
      where: { rolId: id },
    });
    if (assignedUser > 0) {
      throw new ConflictException(
        `No se puede eliminar un rol que tiene ${assignedUser} usuario(s) asignado(s)`,
      );
    }

    // Quitar las asignaciones de permisos del rol antes de eliminarlo
    await this.prisma.rolPermiso.deleteMany({ where: { rolId: id } });

    // Eliminar el rol
    return this.prisma.rol.delete({ where: { idRol: id } });
  }

  // Asignar un permiso a un rol
  async assignPermission(rolId: number, permisoId: number) {
    // Verificar si el rol existe
    await this.findOne(rolId);

    // Verificar si el permiso existe
    const permission = await this.prisma.permiso.findUnique({
      where: { idPermiso: permisoId },
    });
    if (!permission) throw new NotFoundException('Permiso no encontrado');

    // Verificar si el permiso ya está asignado al rol
    const assigned = await this.prisma.rolPermiso.findUnique({
      where: { rolId_permisoId: { rolId, permisoId } },
    });
    if (assigned)
      throw new ConflictException('El permiso ya está asignado a este rol');

    // Asignar el permiso al rol
    return this.prisma.rolPermiso.create({
      data: { rolId, permisoId },
    });
  }

  // Quitar un permiso de un rol
  async removePermission(rolId: number, permisoId: number) {
    // Verificar si el rol existe
    await this.findOne(rolId);

    // Verificar si el permiso esta asignado al rol
    const assigned = await this.prisma.rolPermiso.findUnique({
      where: { rolId_permisoId: { rolId, permisoId } },
    });
    if (!assigned)
      throw new NotFoundException('El permiso no está asignado a este rol');

    // Quitar el permiso del rol
    return this.prisma.rolPermiso.delete({
      where: { rolId_permisoId: { rolId, permisoId } },
    });
  }

  // Obtener un rol por su ID
  async findOne(id: number) {
    const rol = await this.prisma.rol.findUnique({
      where: { idRol: id },
      include: {
        permisos: {
          include: { permiso: true },
        },
        _count: { select: { usuarios: true } },
      },
    });
    if (!rol) throw new NotFoundException('Rol no encontrado');
    return rol;
  }
}
