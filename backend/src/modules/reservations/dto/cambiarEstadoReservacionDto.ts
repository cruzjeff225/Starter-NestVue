import { IsEnum, IsOptional, IsString } from 'class-validator';
import { EstadoReservacion } from '@prisma/client';

export class CambiarEstadoReservacionDto {
  @IsEnum(EstadoReservacion, { message: 'Estado inválido' })
  estado: EstadoReservacion;

  @IsOptional()
  @IsString()
  motivoCancelacion?: string;
}
