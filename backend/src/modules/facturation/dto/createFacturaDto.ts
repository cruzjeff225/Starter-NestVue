import {
  IsEnum,
  IsNotEmpty,
  IsString,
  IsOptional,
  IsInt,
  IsArray,
  ValidateNested,
  IsEmail,
} from 'class-validator';
import { Type } from 'class-transformer';
import { TipoFactura } from '@prisma/client';
import { CreateItemFacturaDto } from './createItemFacturaDto';

export class CreateFacturaDto {
  @IsEnum(TipoFactura, { message: 'Tipo de factura inválido' })
  tipo: TipoFactura;

  @IsInt({ message: 'Cliente requerido' })
  @Type(() => Number)
  clienteId: number;

  @IsOptional()
  @IsInt()
  @Type(() => Number)
  reservacionId?: number;

  // Datos fiscales para crédito fiscal
  @IsOptional()
  @IsString()
  clienteNit?: string;

  @IsOptional()
  @IsString()
  clienteNrc?: string;

  @IsOptional()
  @IsString()
  clienteGiro?: string;

  @IsOptional()
  @IsString()
  clienteDireccion?: string;

  @IsOptional()
  @IsString()
  notas?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateItemFacturaDto)
  items: CreateItemFacturaDto[];
}
