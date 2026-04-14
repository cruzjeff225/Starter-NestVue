import { Module } from '@nestjs/common';
import { ReservacionesController } from './reservacionesController';
import { ReservacionesService } from './reservacionesService';
import { PrismaModule } from '../../prisma/prismaModule';

@Module({
  imports: [PrismaModule],
  controllers: [ReservacionesController],
  providers: [ReservacionesService],
  exports: [ReservacionesService], // lo exportamos para que pueda ser utilizado en el modulo de facturacion
})
export class ReservacionesModule {}
