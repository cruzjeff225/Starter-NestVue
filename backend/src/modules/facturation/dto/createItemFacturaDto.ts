import { IsNotEmpty, IsString, IsInt, IsNumber, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateItemFacturaDto {
  @IsNotEmpty({ message: 'La descripción es requerida' })
  @IsString()
  descripcion: string;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  cantidad: number;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  precioUnit: number;
}
