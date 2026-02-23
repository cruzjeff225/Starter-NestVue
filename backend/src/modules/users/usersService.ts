import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prismaService';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return this.prisma.usuario.findMany({
      select: {
        idUsuario: true,
        nombre: true,
        email: true,
        creadoEn: true,
        rol: { select: { nombre: true } },
      },
    });
  }

  async findOne(id: number) {
    return this.prisma.usuario.findUnique({
      where: { idUsuario: id },
      select: {
        idUsuario: true,
        nombre: true,
        email: true,
        creadoEn: true,
        rol: { select: { nombre: true } },
      },
    });
  }
}
