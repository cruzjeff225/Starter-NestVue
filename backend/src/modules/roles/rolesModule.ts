import { Module } from '@nestjs/common';
import { RolesService } from './rolesService';
import { RolesController } from './rolesController';
import { PrismaModule } from '../../prisma/prismaModule';

@Module({
  imports: [PrismaModule],
  controllers: [RolesController],
  providers: [RolesService],
})
export class RolesModule {}
