import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  ParseIntPipe,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ClientesService } from './clientesService';
import { CreateClienteDto } from './dto/createClienteDto';
import { UpdateClienteDto } from './dto/updateClienteDto';
import { JwtAuthGuard } from '../../common/guards/jwtAuthGuard';
import { PermissionsGuard } from '../../common/guards/permissionsGuard';
import { Permissions } from '../../common/decorators/permissionsDecorator';

@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('clientes')
export class ClientesController {
  constructor(private readonly clientesService: ClientesService) {}

  @Get()
  @Permissions('clientes:leer')
  findAll(@Query('search') search?: string) {
    return this.clientesService.findAll(search);
  }

  @Get(':id')
  @Permissions('clientes:leer')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.clientesService.findOne(id);
  }

  @Post()
  @Permissions('clientes:crear')
  create(@Body() dto: CreateClienteDto) {
    return this.clientesService.create(dto);
  }

  @Patch(':id')
  @Permissions('clientes:editar')
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateClienteDto) {
    return this.clientesService.update(id, dto);
  }

  @Patch(':id/toggle-activo')
  @Permissions('clientes:toggle_activo')
  toggleActivo(@Param('id', ParseIntPipe) id: number) {
    return this.clientesService.toggleActivo(id);
  }
}
