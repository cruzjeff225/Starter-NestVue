import { Controller, Get, Param, Patch, Post, Body, UseGuards } from '@nestjs/common';
import { UsersService } from './usersService';
import { JwtAuthGuard } from '../../common/guards/jwtAuthGuard';
import { RolesGuard } from '../../rbac/rolesGuard';
import { Roles } from '../../rbac/rolesDecorator';

@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard)
export class UsersController {

  constructor(private usersService: UsersService) {}

  // LISTAR USUARIOS
  @Get()
  @Roles('admin')
  findAll() {
    return this.usersService.findAll();
  }

  // VER PERFIL
  @Get('perfil/:id')
  @Roles('admin', 'user')
  findOne(@Param('id') id: string) {
    return this.usersService.findOne(Number(id));
  }

  // CREAR USUARIO
  @Post()
  @Roles('admin')
  create(@Body() data: any) {
    return this.usersService.create(data);
  }

  // EDITAR USUARIO (INCLUYE ROL)
  @Patch(':id')
  @Roles('admin')
  update(
    @Param('id') id: string,
    @Body() data: any
  ) {
    return this.usersService.update(Number(id), data);
  }

  // ACTIVAR / DESACTIVAR USUARIO
  @Patch(':id/toggle-status')
  @Roles('admin')
  toggleUser(@Param('id') id: string) {
    return this.usersService.toggleUserStatus(Number(id));
  }
}