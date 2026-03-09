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
  create(@Body() data: CreateUserDto) {
    return this.usersService.create(data);
  }

  // EDITAR USUARIO (INCLUYE ROL)
  @Patch(':id')
  @Roles('admin')
  update(@Param('id', ParseIntPipe) id: number, @Body() data: UpdateUserDto) {
    return this.usersService.update(id, data);
  }

  // ACTIVAR / DESACTIVAR USUARIO
  @Patch(':id/toggle-status')
  @Roles('admin')
  toggleUser(@Param('id', ParseIntPipe) id: number) {
    return this.usersService.toggleUserStatus(id);
  }
}
