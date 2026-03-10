import {
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Body,
  UseGuards,
  ParseIntPipe,
} from '@nestjs/common';
import { UsersService } from './usersService';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { JwtAuthGuard } from '../../common/guards/jwtAuthGuard';
import { PermissionsGuard } from '../../common/guards/permissionsGuard';
import { Permissions } from '../../common/decorators/permissionsDecorator';

@Controller('users')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class UsersController {
  constructor(private usersService: UsersService) {}

  // LISTAR USUARIOS
  @Get()
  @Permissions('usuarios:leer')
  findAll() {
    return this.usersService.findAll();
  }

  // OBTENER ROLES Y PERMISOS
  @Get('roles')
  @Permissions('usuarios:editar_rol')
  getRoles() {
    return this.usersService.getRolesWithPermissions();
  }

  // VER PERFIL
  @Get(':id')
  @Permissions('usuarios:leer')
  findOne(@Param('id') id: string) {
    return this.usersService.findOne(Number(id));
  }

  // CREAR USUARIO
  @Post()
  @Permissions('usuarios:crear')
  create(@Body() data: CreateUserDto) {
    return this.usersService.create(data);
  }

  // EDITAR USUARIO (INCLUYE ROL)
  @Patch(':id')
  @Permissions('usuarios:editar')
  update(@Param('id', ParseIntPipe) id: number, @Body() data: UpdateUserDto) {
    return this.usersService.update(id, data);
  }

  // ACTIVAR / DESACTIVAR USUARIO
  @Patch(':id/toggle_activo')
  @Permissions('usuarios:toggle_activo')
  toggleUser(@Param('id', ParseIntPipe) id: number) {
    return this.usersService.toggleUserStatus(id);
  }

  @Patch(':id/rol')
  @Permissions('usuarios:editar_rol')
  cambiarRol(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: { rolId: number },
  ) {
    return this.usersService.cambiarRol(id, body.rolId);
  }
}
