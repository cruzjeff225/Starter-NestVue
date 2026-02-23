import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { UsersService } from './usersService';
import { JwtAuthGuard } from '../../common/guards/jwtAuthGuard';
import { RolesGuard } from '../../rbac/rolesGuard';
import { Roles } from '../../rbac/rolesDecorator';

@Controller('users')
// Protegemos todas las rutas de este controlador con autenticación JWT y control de roles
@UseGuards(JwtAuthGuard, RolesGuard)
export class UsersController {
  constructor(private usersService: UsersService) {}

  @Get()
  // Solo los usuarios con rol 'admin' pueden acceder a esta ruta
  @Roles('admin')
  findAll() {
    return this.usersService.findAll();
  }

  @Get('perfil/:id')
  // Tanto 'admin' como 'user' pueden acceder a esta ruta para ver su propio perfil
  @Roles('admin', 'user')
  findOne(@Param('id') id: string) {
    return this.usersService.findOne(Number(id));
  }
}
