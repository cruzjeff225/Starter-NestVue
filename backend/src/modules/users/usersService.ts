import {
  ConflictException,
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

  // LISTAR TODOS LOS USUARIOS
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
        creadoEn: true,
        activo: true,
        rol: { select: { nombre: true } },
      },
    });

    if (!user) throw new NotFoundException('Usuario no encontrado');
    return user;
  }

  // CREAR USUARIO
  async create(data: CreateUserDto) {
    // Verificar si el email ya existe
    const existingEmail = await this.prisma.usuario.findUnique({
      where: { email: data.email },
    });
    if (existingEmail)
      throw new ConflictException('El email ya está registrado');

    // Si no se proporciona un rol, asignar el rol "user" por defecto
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

    // Encriptar la contraseña antes de guardar
    const hashedPassword = await bcrypt.hash(data.contraseña, 10);

    const usuario = await this.prisma.usuario.create({
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

    return usuario;
  }

  // ACTUALIZAR USUARIO
  async update(id: number, data: UpdateUserDto) {
    const user = await this.findOne(id); // valida existencia

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
    });
  }

  // ACTIVAR / DESACTIVAR USUARIO
  async toggleUserStatus(id: number) {
    const user = await this.findOne(id);

    return this.prisma.usuario.update({
      where: { idUsuario: id },
      data: { activo: !user.activo },
      select: {
        idUsuario: true,
        nombre: true,
        email: true,
        rol: { select: { nombre: true } },
        activo: true,
      },
    });
  }
}
