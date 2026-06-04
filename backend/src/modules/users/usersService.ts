import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prismaService';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  // LISTAR TODOS LOS USUARIOS (sin contraseña)
  async findAll() {
    return this.prisma.usuario.findMany({
      select: {
        idUsuario: true,
        nombre: true,
        email: true,
        creadoEn: true,
        activo: true,
        rol: { select: { nombre: true } },
      },
    });
  }

  // OBTENER UN USUARIO POR ID
  async findOne(id: number) {
    const user = await this.prisma.usuario.findUnique({
      where: { idUsuario: id },
      select: {
        idUsuario: true,
        nombre: true,
        email: true,
        activo: true,
        rol: { select: { nombre: true } },
        creadoEn: true,
      },
    });

    if (!user) throw new NotFoundException('Usuario no encontrado');
    return user;
  }

  // CREAR USUARIO
  async create(data: CreateUserDto) {
    const existingEmail = await this.prisma.usuario.findUnique({
      where: { email: data.email },
    });
    if (existingEmail)
      throw new ConflictException('El email ya está registrado');

    let rolId: number;
    if (data.rolId) {
      rolId = data.rolId;
    } else {
      const rolUser = await this.prisma.rol.findUnique({
        where: { nombre: 'user' },
      });
      if (!rolUser) throw new NotFoundException('Rol user no encontrado');
      rolId = rolUser.idRol;
    }

    const hashedPassword = await bcrypt.hash(data.contraseña, 10);

    return this.prisma.usuario.create({
      data: {
        nombre: data.nombre,
        email: data.email,
        contraseña: hashedPassword,
        rolId,
      },
      select: {
        idUsuario: true,
        nombre: true,
        email: true,
        activo: true,
        creadoEn: true,
        rol: { select: { nombre: true } },
      },
    });
  }

  // ACTUALIZAR USUARIO
  async update(id: number, data: UpdateUserDto) {
    await this.findOne(id);

    const updateData: any = {};
    if (data.nombre !== undefined) updateData.nombre = data.nombre;
    if (data.email !== undefined) updateData.email = data.email;
    if (data.contraseña !== undefined) {
      updateData.contraseña = await bcrypt.hash(data.contraseña, 10);
    }
    if (data.rolId !== undefined) updateData.rolId = data.rolId;
    if (data.activo !== undefined) updateData.activo = data.activo;

    return this.prisma.usuario.update({
      where: { idUsuario: id },
      data: updateData,
      select: {
        idUsuario: true,
        nombre: true,
        email: true,
        activo: true,
        creadoEn: true,
        rol: { select: { nombre: true } },
      },
    });
  }

  // ACTIVAR / DESACTIVAR USUARIO — el superadmin no puede desactivarse a sí mismo
  async toggleUserStatus(id: number, callerId: number) {
    const user = await this.findOne(id);

    if (id === callerId && !user.activo === false) {
      // user is currently active and caller is trying to deactivate themselves
    }

    // Check if target is superadmin and caller is the same person
    const fullUser = await this.prisma.usuario.findUnique({
      where: { idUsuario: id },
      include: { rol: true },
    });

    if (fullUser?.rol.nombre === 'superadmin' && id === callerId) {
      throw new ForbiddenException(
        'El superadmin no puede desactivarse a sí mismo',
      );
    }

    return this.prisma.usuario.update({
      where: { idUsuario: id },
      data: { activo: !fullUser!.activo },
      select: {
        idUsuario: true,
        nombre: true,
        email: true,
        rol: { select: { nombre: true } },
        activo: true,
      },
    });
  }

  // OBTENER ROLES CON SUS PERMISOS
  async getRolesWithPermissions() {
    return this.prisma.rol.findMany({
      include: {
        permisos: {
          include: { permiso: true },
        },
      },
    });
  }

  // CAMBIAR ROL DE USUARIO
  async cambiarRol(id: number, rolId: number) {
    await this.findOne(id);

    return this.prisma.usuario.update({
      where: { idUsuario: id },
      data: { rolId },
      select: {
        idUsuario: true,
        nombre: true,
        email: true,
        activo: true,
        rol: {
          include: {
            permisos: { include: { permiso: true } },
          },
        },
      },
    });
  }
}
