import { Module } from '@nestjs/common';
import { ClientesController } from './clientesController';
import { ClientesService } from './clientesService';
import { PrismaModule } from '../../prisma/prismaModule';

@Module({
  imports: [PrismaModule],
  controllers: [ClientesController],
  providers: [ClientesService],
})
export class ClientesModule {}
