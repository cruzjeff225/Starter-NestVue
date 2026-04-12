import { IsEnum } from 'class-validator';
import { EstadoHabitacion } from '@prisma/client';

export class CambiarEstadoDto {
  @IsEnum(EstadoHabitacion, { message: 'Estado inválido' })
  estado: EstadoHabitacion;
}
