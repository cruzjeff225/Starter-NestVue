import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { EstadoPago } from '@prisma/client';
import { Permissions } from '../../common/decorators/permissionsDecorator';
import { JwtAuthGuard } from '../../common/guards/jwtAuthGuard';
import { PermissionsGuard } from '../../common/guards/permissionsGuard';
import { CreatePagoDto } from './dto/createPagoDto';
import { UpdateEstadoPagoDto } from './dto/updateEstadoPagoDto';
import { PagosService } from './pagosService';

@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('pagos')
export class PagosController {
  constructor(private readonly service: PagosService) {}

  @Get()
  @Permissions('pagos:leer')
  findAll(
    @Query('search') search?: string,
    @Query('estado') estado?: EstadoPago,
    @Query('reservacionId') reservacionId?: string,
    @Query('facturaId') facturaId?: string,
  ) {
    return this.service.findAll({
      search,
      estado,
      reservacionId: reservacionId ? +reservacionId : undefined,
      facturaId: facturaId ? +facturaId : undefined,
    });
  }

  @Get(':id')
  @Permissions('pagos:leer')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.service.findOne(id);
  }

  @Post()
  @Permissions('pagos:crear')
  create(@Body() dto: CreatePagoDto) {
    return this.service.create(dto);
  }

  @Patch(':id/estado')
  @Permissions('pagos:cambiar_estado')
  cambiarEstado(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateEstadoPagoDto,
  ) {
    return this.service.cambiarEstado(id, dto);
  }

  @Patch(':id/reembolsar')
  @Permissions('pagos:reembolsar')
  reembolsar(@Param('id', ParseIntPipe) id: number) {
    return this.service.reembolsar(id);
  }
}
