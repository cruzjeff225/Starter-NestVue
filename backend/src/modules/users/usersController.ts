import {
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Body,
  UseGuards,
  ParseIntPipe,
  Request,
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

  @Get()
  @Permissions('usuarios:leer')
  findAll() {
    return this.usersService.findAll();
  }

  @Get('roles')
  @Permissions('usuarios:editar_rol')
  getRoles() {
    return this.usersService.getRolesWithPermissions();
  }

  @Get(':id')
  @Permissions('usuarios:leer')
  findOne(@Param('id') id: string) {
    return this.usersService.findOne(Number(id));
  }

  @Post()
  @Permissions('usuarios:crear')
  create(@Body() data: CreateUserDto) {
    return this.usersService.create(data);
  }

  @Patch(':id')
  @Permissions('usuarios:editar')
  update(@Param('id', ParseIntPipe) id: number, @Body() data: UpdateUserDto) {
    return this.usersService.update(id, data);
  }

  @Patch(':id/toggle_activo')
  @Permissions('usuarios:toggle_activo')
  toggleUser(@Param('id', ParseIntPipe) id: number, @Request() req: any) {
    return this.usersService.toggleUserStatus(id, req.user.userId ?? req.user.sub);
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
