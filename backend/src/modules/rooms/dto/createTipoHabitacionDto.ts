import {
  IsNotEmpty,
  IsString,
  IsNumber,
  IsOptional,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateTipoHabitacionDto {
  @IsNotEmpty({ message: 'El nombre es requerido' })
  @IsString()
  nombre: string;

  @Type(() => Number)
  @IsNumber({}, { message: 'El precio base debe ser un número' })
  @Min(0)
  precioBase: number;

  @IsOptional()
  @IsString()
  descripcion?: string;
}
