import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prismaService';
import { CreatePermissionDto } from './dto/createPermissionDto';
import { UpdatePermissionDto } from './dto/updatePermissionDto';

@Injectable()
export class PermissionsService {
  constructor(private prisma: PrismaService) {}

  findAll() {
    return this.prisma.permiso.findMany({
      include: {
        _count: { select: { roles: true } },
      },
      orderBy: { nombre: 'asc' },
    });
  }

  // Crear un nuevo permiso
  async create(dto: CreatePermissionDto) {
    // Verificar si el permiso ya existe
    const existing = await this.prisma.permiso.findUnique({
      where: { nombre: dto.nombre },
    });
    if (existing)
      throw new ConflictException('Ya existe un permiso con ese nombre');

    return this.prisma.permiso.create({ data: { nombre: dto.nombre } });
  }

  // Actualizar un permiso existente
  async update(id: number, dto: UpdatePermissionDto) {
    // Verificar si el permiso existe
    await this.findOne(id);

    // Verificar si el nuevo nombre ya está en uso por otro permiso
    const existing = await this.prisma.permiso.findUnique({
      where: { nombre: dto.nombre },
    });
    if (existing && existing.idPermiso !== id) {
      throw new ConflictException('Ya existe un permiso con ese nombre');
    }

    return this.prisma.permiso.update({
      where: { idPermiso: id },
      data: { nombre: dto.nombre },
    });
  }

  // Eliminar un permiso
  async remove(id: number) {
    // Verificar si el permiso existe
    const permission = await this.findOne(id);

    // Proteger el permiso superadmi de ser eliminado
    if (permission.nombre === 'superadmin:todo') {
      throw new ConflictException(
        'No se puede eliminar el permiso base del sistema',
      );
    }

    // Verificar si el permiso está asignado a algún rol
    const assignedRoles = await this.prisma.rolPermiso.count({
      where: { permisoId: id },
    });
    if (assignedRoles > 0) {
      throw new ConflictException(
        'No se puede eliminar un permiso que está asignado a uno o más roles',
      );
    }

    return this.prisma.permiso.delete({ where: { idPermiso: id } });
  }

  // Obtener un permiso por su ID
  async findOne(id: number) {
    const permission = await this.prisma.permiso.findUnique({
      where: { idPermiso: id },
    });
    if (!permission) throw new NotFoundException('Permiso no encontrado');
    return permission;
  }
}
