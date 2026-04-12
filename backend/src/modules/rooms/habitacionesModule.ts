import { Module } from '@nestjs/common';
import { HabitacionesController } from './habitacionesController';
import { HabitacionesService } from './habitacionesService';
import { PrismaModule } from '../../prisma/prismaModule';

@Module({
  imports: [PrismaModule],
  controllers: [HabitacionesController],
  providers: [HabitacionesService],
  exports: [HabitacionesService], // Exportamos el servicio para que pueda ser utilizado en Reservaciones
})
export class HabitacionesModule {}
