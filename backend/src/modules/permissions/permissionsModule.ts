import { Module } from '@nestjs/common';
import { PermissionsService } from './permissionsService';
import { PermissionsController } from './permissionsController';
import { PrismaModule } from '../../prisma/prismaModule';

@Module({
  imports: [PrismaModule],
  controllers: [PermissionsController],
  providers: [PermissionsService],
})
export class PermissionsModule {}
