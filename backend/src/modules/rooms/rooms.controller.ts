import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  UseGuards,
} from '@nestjs/common'

import { RoomsService } from './rooms.service'
import { CreateRoomDto } from './dto/create-room.dto'
import { UpdateRoomDto } from './dto/update-room.dto'
import { RoomStatus } from '@prisma/client'

import { JwtAuthGuard } from '../../common/guards/jwtAuthGuard'
import { PermissionsGuard } from '../../common/guards/permissionsGuard'
import { Permissions } from '../../common/decorators/permissionsDecorator'

@Controller('rooms')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Permissions('rooms:manage')
export class RoomsController {
  constructor(private roomsService: RoomsService) {}

  @Get()
  findAll() {
    return this.roomsService.findAll()
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.roomsService.findOne(id)
  }

  @Post()
  create(@Body() dto: CreateRoomDto) {
    return this.roomsService.create(dto)
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateRoomDto) {
    return this.roomsService.update(id, dto)
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.roomsService.remove(id)
  }

  // 🔥 endpoint profesional
  @Patch(':id/status')
  changeStatus(
    @Param('id') id: string,
    @Body('status') status: RoomStatus,
  ) {
    return this.roomsService.changeStatus(id, status)
  }
}