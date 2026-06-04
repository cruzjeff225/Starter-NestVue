import {
  IsEmail,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  Min,
  ValidateIf,
} from 'class-validator';
import { Type } from 'class-transformer';
import { MetodoPagoGateway } from '@prisma/client';

export class CreatePagoDto {
  @IsEnum(MetodoPagoGateway, { message: 'Metodo de pago invalido' })
  metodo: MetodoPagoGateway;

  @Type(() => Number)
  @Min(0.01, { message: 'El monto debe ser mayor a 0' })
  monto: number;

  @IsOptional()
  @IsString()
  @MaxLength(3)
  moneda?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  reservacionId?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  facturaId?: number;

  @IsOptional()
  @IsString()
  titular?: string;

  @IsOptional()
  @IsEmail()
  emailPagador?: string;

  @ValidateIf((o: CreatePagoDto) => o.metodo === MetodoPagoGateway.tarjeta)
  @IsString({ message: 'Numero de tarjeta requerido' })
  tarjetaNumero?: string;

  @ValidateIf((o: CreatePagoDto) => o.metodo === MetodoPagoGateway.tarjeta)
  @Matches(/^(0[1-9]|1[0-2])\/\d{2}$/, {
    message: 'Vencimiento invalido. Usa MM/AA',
  })
  vencimiento?: string;

  @ValidateIf((o: CreatePagoDto) => o.metodo === MetodoPagoGateway.tarjeta)
  @Matches(/^\d{3,4}$/, { message: 'CVV invalido' })
  cvv?: string;

  @ValidateIf((o: CreatePagoDto) => o.metodo === MetodoPagoGateway.transferencia)
  @IsString({ message: 'Banco origen requerido' })
  bancoOrigen?: string;

  @ValidateIf((o: CreatePagoDto) => o.metodo === MetodoPagoGateway.transferencia)
  @IsString({ message: 'Referencia bancaria requerida' })
  referenciaBancaria?: string;

  @IsOptional()
  @IsString()
  pasarela?: string;

  @IsOptional()
  @IsString()
  notas?: string;
}
