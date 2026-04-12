import {
  IsNotEmpty,
  IsString,
  IsInt,
  IsOptional,
  IsEnum,
  IsArray,
  IsUrl,
  Min,
  IsBoolean,
} from 'class-validator';
import { Type } from 'class-transformer';
import { EstadoHabitacion } from '@prisma/client';

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
}
