import { IsEnum, IsOptional, IsString } from 'class-validator';
import { EstadoPago } from '@prisma/client';

export class UpdateEstadoPagoDto {
  @IsEnum(EstadoPago)
  estado: EstadoPago;

  @IsOptional()
  @IsString()
  motivoRechazo?: string;
}
