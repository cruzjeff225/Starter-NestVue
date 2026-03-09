import { Injectable, NotFoundException } from '@nestjs/common';
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
    const hashedPassword = await bcrypt.hash(data.password, 10);

    const createData: any = {
      nombre: data.nombre,
      email: data.email,
      password: hashedPassword,
      activo: true,
    };

    if (data.rolId !== undefined) {
      createData.rolId = data.rolId; // solo incluir si viene definido
    }

    return this.prisma.usuario.create({ data: createData });
  }

  // ACTUALIZAR USUARIO
  async update(id: number, data: UpdateUserDto) {
    const user = await this.findOne(id); // valida existencia

    const updateData: any = {};

    if (data.nombre !== undefined) updateData.nombre = data.nombre;
    if (data.email !== undefined) updateData.email = data.email;
    if (data.password !== undefined) {
      updateData.password = await bcrypt.hash(data.password, 10);
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
    });
  }
}