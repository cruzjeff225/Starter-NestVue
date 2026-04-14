import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  Query,
  ParseIntPipe,
  UseGuards,
} from '@nestjs/common';
import { ReservacionesService } from './reservacionesService';
import { CreateReservacionDto } from './dto/CreateReservacionDto';
import { UpdateReservacionDto } from './dto/updateReservacionDto';
import { CambiarEstadoReservacionDto } from './dto/cambiarEstadoReservacionDto';
import { JwtAuthGuard } from '../../common/guards/jwtAuthGuard';
import { PermissionsGuard } from '../../common/guards/permissionsGuard';
import { Permissions } from '../../common/decorators/permissionsDecorator';
import { EstadoReservacion } from '@prisma/client';

@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('reservaciones')
export class ReservacionesController {
  constructor(private readonly service: ReservacionesService) {}

  @Get()
  @Permissions('reservaciones:leer')
  findAll(
    @Query('search') search?: string,
    @Query('estado') estado?: EstadoReservacion,
    @Query('clienteId') clienteId?: string,
    @Query('habitacionId') habitacionId?: string,
    @Query('fechaDesde') fechaDesde?: string,
    @Query('fechaHasta') fechaHasta?: string,
  ) {
    return this.service.findAll({
      search,
      estado,
      clienteId: clienteId ? +clienteId : undefined,
      habitacionId: habitacionId ? +habitacionId : undefined,
      fechaDesde,
      fechaHasta,
    });
  }

  @Get(':id')
  @Permissions('reservaciones:leer')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.service.findOne(id);
  }

  @Post()
  @Permissions('reservaciones:crear')
  create(@Body() dto: CreateReservacionDto) {
    return this.service.create(dto);
  }

  @Patch(':id')
  @Permissions('reservaciones:editar')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateReservacionDto,
  ) {
    return this.service.update(id, dto);
  }

  @Patch(':id/estado')
  @Permissions('reservaciones:cambiar_estado')
  cambiarEstado(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: CambiarEstadoReservacionDto,
  ) {
    return this.service.cambiarEstado(id, dto);
  }
}
