import {
  Injectable,
  UnauthorizedException,
  ConflictException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../../prisma/prismaService';
import { Usuario, Rol } from '@prisma/client';
import * as bcrypt from 'bcrypt';

type UserWithRole = Usuario & {
  rol: Rol & { permisos: { permiso: { nombre: string } }[] };
};

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  private async getUserPermissions(email: string) {
    return this.prisma.usuario.findUnique({
      where: { email },
      include: {
        rol: {
          include: {
            permisos: { include: { permiso: true } },
          },
        },
      },
    });
  }

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

    await this.prisma.usuario.create({
      data: { nombre, email, contraseña: hashedPassword, rolId: rolUser.idRol },
    });

    const newUser = await this.getUserPermissions(email);
    return this.generateToken(newUser as UserWithRole);
  }

  async login(email: string, contraseña: string) {
    const user = await this.getUserPermissions(email);

    if (!user || !(await bcrypt.compare(contraseña, user.contraseña))) {
      throw new UnauthorizedException('Credenciales incorrectas');
    }

    if (!user.activo) {
      throw new UnauthorizedException(
        'Tu cuenta está desactivada. Contacta al administrador.',
      );
    }

    return this.generateToken(user as UserWithRole);
  }

  private generateToken(user: UserWithRole) {
    const permissions = user.rol.permisos.map((rp) => rp.permiso.nombre);

    const payload = {
      sub: user.idUsuario,
      email: user.email,
      rol: user.rol.nombre,
      permissions, // Agregamos los permisos al payload del token
    };

    return {
      access_token: this.jwtService.sign(payload),
      user: {
        id: user.idUsuario,
        nombre: user.nombre,
        email: user.email,
        rol: user.rol.nombre,
        permissions, // También los incluimos en la respuesta del usuario
      },
    };
  }
}
