import {
  IsNotEmpty,
  IsInt,
  IsOptional,
  IsString,
  IsEnum,
  IsDateString,
  Min,
  Max,
  IsNumber,
} from 'class-validator';
import { Type } from 'class-transformer';
import { EstadoReservacion, MetodoPago } from '@prisma/client';

export class CreateReservacionDto {
  @IsDateString({}, { message: 'Fecha de entrada inválida' })
  fechaEntrada: string;

  @IsDateString({}, { message: 'Fecha de salida inválida' })
  fechaSalida: string;

  @Type(() => Number)
  @IsInt()
  @Min(1, { message: 'Debe haber al menos 1 huésped' })
  numHuespedes: number;

  @IsOptional()
  @IsEnum(EstadoReservacion)
  estado?: EstadoReservacion;

  @IsEnum(MetodoPago, { message: 'Método de pago inválido' })
  metodoPago: MetodoPago;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(100, { message: 'El descuento no puede superar 100%' })
  descuento: number;

  @IsOptional()
  @IsString()
  notas?: string;

  @IsOptional()
  @IsString()
  motivoCancelacion?: string;

  @Type(() => Number)
  @IsInt({ message: 'Cliente requerido' })
  clienteId: number;

  @Type(() => Number)
  @IsInt({ message: 'Habitación requerida' })
  habitacionId: number;
}
