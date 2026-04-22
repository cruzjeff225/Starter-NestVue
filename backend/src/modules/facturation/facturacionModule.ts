import { Module } from '@nestjs/common';
import { FacturacionController } from './facturacionController';
import { FacturacionService } from './facturacionService';
import { PrismaModule } from '../../prisma/prismaModule';

@Module({
  imports: [PrismaModule],
  controllers: [FacturacionController],
  providers: [FacturacionService],
})
export class FacturacionModule {}
