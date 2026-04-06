import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Patch,
  Delete,
} from '@nestjs/common'

import { ReservationsService } from './reservations.service'
import { CreateReservationDto } from './dto/create-reservation.dto'
import { UpdateReservationDto } from './dto/update-reservation.dto'

@Controller('reservations')
export class ReservationsController {
  constructor(private readonly service: ReservationsService) {}

  @Post()
  create(@Body() dto: CreateReservationDto) {
    return this.service.create(dto)
  }

  @Get()
  findAll() {
    return this.service.findAll()
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.service.findOne(id)
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateReservationDto) {
    return this.service.update(id, dto)
  }

  @Delete(':id')
  cancel(@Param('id') id: string) {
    return this.service.remove(id)
  }

  // 🔥 acciones reales hotel
  @Patch(':id/checkin')
  checkIn(@Param('id') id: string) {
    return this.service.checkIn(id)
  }

  @Patch(':id/checkout')
  checkOut(@Param('id') id: string) {
    return this.service.checkOut(id)
  }
}