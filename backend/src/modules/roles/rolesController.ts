import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  UseGuards,
  ParseIntPipe,
} from '@nestjs/common';
import { RolesService } from './rolesService';
import { CreateRolDto } from './dto/createRolDto';
import { UpdateRolDto } from './dto/updateRolDto';
import { AsignarPermisoDto } from './dto/assignPermissionDto';
import { JwtAuthGuard } from '../../common/guards/jwtAuthGuard';
import { PermissionsGuard } from '../../common/guards/permissionsGuard';
import { Permissions } from '../../common/decorators/permissionsDecorator';

@Controller('roles')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Permissions('superadmin:todo')
export class RolesController {
  constructor(private rolesService: RolesService) {}

  @Get()
  findAll() {
    return this.rolesService.findAll();
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.rolesService.findOne(id);
  }

  @Post()
  create(@Body() dto: CreateRolDto) {
    return this.rolesService.create(dto);
  }

  @Patch(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateRolDto) {
    return this.rolesService.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.rolesService.remove(id);
  }

  @Post(':id/permissions')
  assignPermission(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: AsignarPermisoDto,
  ) {
    return this.rolesService.assignPermission(id, dto.permisoId);
  }

  @Delete(':id/permissions/:permisoId')
  removePermission(
    @Param('id', ParseIntPipe) id: number,
    @Param('permisoId', ParseIntPipe) permisoId: number,
  ) {
    return this.rolesService.removePermission(id, permisoId);
  }
}
