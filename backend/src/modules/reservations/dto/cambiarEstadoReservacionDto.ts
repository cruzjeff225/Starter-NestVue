import { IsEnum, IsOptional, IsString, ValidateIf } from 'class-validator';
import { EstadoReservacion } from '@prisma/client';

export class CambiarEstadoReservacionDto {
  @IsEnum(EstadoReservacion, { message: 'Estado inválido' })
  estado: EstadoReservacion;

  @ValidateIf((o) => o.estado === 'cancelada' || o.estado === 'no_show')
  @IsString({ message: 'El motivo de cancelación es requerido' })
  motivoCancelacion?: string;
}
