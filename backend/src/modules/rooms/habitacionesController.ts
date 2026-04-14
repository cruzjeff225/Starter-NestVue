import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  ParseIntPipe,
  UseGuards,
} from '@nestjs/common';
import { HabitacionesService } from './habitacionesService';
import { CreateHabitacionDto } from './dto/createHabitacionDto';
import { UpdateHabitacionDto } from './dto/updateHabitacionDto';
import { CreateTipoHabitacionDto } from './dto/createTipoHabitacionDto';
import { UpdateTipoHabitacionDto } from './dto/updateTipoHabitacion';
import { CambiarEstadoDto } from './dto/cambiarEstadoDto';
import { JwtAuthGuard } from '../../common/guards/jwtAuthGuard';
import { PermissionsGuard } from '../../common/guards/permissionsGuard';
import { Permissions } from '../../common/decorators/permissionsDecorator';
import { EstadoHabitacion } from '@prisma/client';

@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('habitaciones')
export class HabitacionesController {
  constructor(private readonly service: HabitacionesService) {}

  @Get()
  @Permissions('habitaciones:leer')
  findAll(
    @Query('search') search?: string,
    @Query('estado') estado?: EstadoHabitacion,
    @Query('tipoId') tipoId?: string,
  ) {
    return this.service.findAll(search, estado, tipoId ? +tipoId : undefined);
  }

  @Get('tipos/lista')
  @Permissions('habitaciones:leer')
  findAllTipos() {
    return this.service.findAllTipos();
  }

  @Get('disponibles')
  @Permissions('habitaciones:leer')
  findDisponibles(@Query('search') search?: string) {
    return this.service.findAll(search, EstadoHabitacion.disponible);
  }

  @Get(':id')
  @Permissions('habitaciones:leer')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.service.findOne(id);
  }

  @Post()
  @Permissions('habitaciones:crear')
  create(@Body() dto: CreateHabitacionDto) {
    return this.service.create(dto);
  }

  @Patch(':id')
  @Permissions('habitaciones:editar')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateHabitacionDto,
  ) {
    return this.service.update(id, dto);
  }

  @Patch(':id/estado')
  @Permissions('habitaciones:cambiar_estado')
  cambiarEstado(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: CambiarEstadoDto,
  ) {
    return this.service.cambiarEstado(id, dto);
  }

  @Patch(':id/toggle-activo')
  @Permissions('habitaciones:toggle_activo')
  toggleActivo(@Param('id', ParseIntPipe) id: number) {
    return this.service.toggleActivo(id);
  }

  @Post('tipos')
  @Permissions('habitaciones:gestionar_tipos')
  createTipo(@Body() dto: CreateTipoHabitacionDto) {
    return this.service.createTipo(dto);
  }

  @Patch('tipos/:id')
  @Permissions('habitaciones:gestionar_tipos')
  updateTipo(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateTipoHabitacionDto,
  ) {
    return this.service.updateTipo(id, dto);
  }

  @Delete('tipos/:id')
  @Permissions('habitaciones:gestionar_tipos')
  deleteTipo(@Param('id', ParseIntPipe) id: number) {
    return this.service.deleteTipo(id);
  }
}
