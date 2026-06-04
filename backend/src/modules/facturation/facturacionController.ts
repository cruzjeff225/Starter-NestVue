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
import { FacturacionService } from './facturacionService';
import { CreateFacturaDto } from './dto/createFacturaDto';
import { AnularFacturaDto } from './dto/anularFacturaDto';
import { JwtAuthGuard } from '../../common/guards/jwtAuthGuard';
import { PermissionsGuard } from '../../common/guards/permissionsGuard';
import { Permissions } from '../../common/decorators/permissionsDecorator';
import { TipoFactura } from '@prisma/client';

@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('facturacion')
export class FacturacionController {
  constructor(private readonly service: FacturacionService) {}

  @Get()
  @Permissions('facturacion:leer')
  findAll(
    @Query('search') search?: string,
    @Query('tipo') tipo?: TipoFactura,
    @Query('estado') estado?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.service.findAll({
      search,
      tipo,
      estado,
      page: page ? Number(page) : 1,
      limit: limit ? Number(limit) : 20,
    });
  }

  @Get('reservacion/:id/items')
  @Permissions('facturacion:crear')
  getItemsDesdeReservacion(@Param('id', ParseIntPipe) id: number) {
    return this.service.getItemsDesdeReservacion(id);
  }

  @Get(':id')
  @Permissions('facturacion:leer')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.service.findOne(id);
  }

  @Post()
  @Permissions('facturacion:crear')
  create(@Body() dto: CreateFacturaDto) {
    return this.service.create(dto);
  }

  @Patch(':id/anular')
  @Permissions('facturacion:anular')
  anular(@Param('id', ParseIntPipe) id: number, @Body() dto: AnularFacturaDto) {
    return this.service.anular(id, dto);
  }
}
