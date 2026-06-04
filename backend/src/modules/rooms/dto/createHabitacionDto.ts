import {
  IsNotEmpty, IsString, IsInt, IsOptional,
  IsEnum, IsArray, IsNumber, Min, IsIn,
} from 'class-validator';
import { Type } from 'class-transformer';
import { EstadoHabitacion } from '@prisma/client';

const VISTAS_VALIDAS = ['mar', 'ciudad', 'jardin', 'piscina', 'montania', 'ninguna'] as const;
const CERCANIAS_VALIDAS = ['piscina', 'restaurante', 'spa', 'gym', 'playa', 'bar'] as const;

export class CreateHabitacionDto {
  @IsNotEmpty({ message: 'El número de habitación es requerido' })
  @IsString()
  numero: string;

  @Type(() => Number)
  @IsInt()
  @Min(1, { message: 'El piso debe ser mayor a 0' })
  piso: number;

  @Type(() => Number)
  @IsInt()
  @Min(1, { message: 'La capacidad debe ser al menos 1' })
  capacidad: number;

  @IsOptional()
  @IsEnum(EstadoHabitacion, { message: 'Estado inválido' })
  estado?: EstadoHabitacion;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  amenidades?: string[];

  @IsOptional()
  @IsString()
  imagenUrl?: string;

  @IsOptional()
  @IsString()
  descripcion?: string;

  @Type(() => Number)
  @IsInt({ message: 'El tipo es requerido' })
  tipoId: number;

  // Campos de ubicación/precio
  @IsOptional()
  @IsString()
  @IsIn(VISTAS_VALIDAS, { message: 'Vista inválida' })
  vista?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  cercaniasStr?: string[];
}
