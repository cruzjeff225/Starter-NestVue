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
import { PermissionsService } from './permissionsService';
import { CreatePermissionDto } from './dto/createPermissionDto';
import { UpdatePermissionDto } from './dto/updatePermissionDto';
import { JwtAuthGuard } from 'src/common/guards/jwtAuthGuard';
import { PermissionsGuard } from 'src/common/guards/permissionsGuard';
import { Permissions } from 'src/common/decorators/permissionsDecorator';

@Controller('permissions')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Permissions('superadmin:todo')
export class PermissionsController {
  constructor(private permissionsService: PermissionsService) {}

  @Get()
  findAll() {
    return this.permissionsService.findAll();
  }

  @Post()
  create(@Body() dto: CreatePermissionDto) {
    return this.permissionsService.create(dto);
  }

  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdatePermissionDto,
  ) {
    return this.permissionsService.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.permissionsService.remove(id);
  }
}
