import {
  Injectable,
  UnauthorizedException,
  ConflictException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../../prisma/prismaService';
import { Usuario, Rol } from '@prisma/client';
import * as bcrypt from 'bcrypt';

type UserWithRole = Usuario & { rol: Rol };

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  async register(nombre: string, email: string, contraseña: string) {
    const existingUser = await this.prisma.usuario.findUnique({
      where: { email },
    });
    if (existingUser) throw new ConflictException(' El correo ya está en uso');

    const rolUser = await this.prisma.rol.findUnique({
      where: { nombre: 'user' },
    });
    if (!rolUser) throw new ConflictException('Rol de usuario no encontrado');

    const hashedPassword = await bcrypt.hash(contraseña, 10);

    const newUser = await this.prisma.usuario.create({
      data: {
        nombre,
        email,
        contraseña: hashedPassword,
        rolId: rolUser.idRol,
      },
      include: {
        rol: true,
      },
    });

    return this.generateToken(newUser as UserWithRole);
  }

  async login(email: string, contraseña: string) {
    const user = await this.prisma.usuario.findUnique({
      where: { email },
      include: { rol: true },
    });

    if (!user || !(await bcrypt.compare(contraseña, user.contraseña))) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    return this.generateToken(user as UserWithRole);
  }

  private generateToken(user: UserWithRole) {
    const payload = {
      sub: user.idUsuario,
      email: user.email,
      rol: user.rol.nombre,
    };

    return {
      access_token: this.jwtService.sign(payload),
      user: {
        id: user.idUsuario,
        nombre: user.nombre,
        email: user.email,
        rol: user.rol.nombre,
      },
    };
  }
}
