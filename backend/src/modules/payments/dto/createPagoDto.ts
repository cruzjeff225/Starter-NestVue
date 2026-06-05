import {
  IsEmail,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength,
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
  @Matches(/^[A-Z]{3}$/, { message: 'Moneda invalida. Usa codigo ISO de 3 letras' })
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
  @MinLength(3, { message: 'Titular demasiado corto' })
  @MaxLength(120, { message: 'Titular demasiado largo' })
  titular?: string;

  @IsOptional()
  @IsEmail()
  emailPagador?: string;

  @ValidateIf((o: CreatePagoDto) => o.metodo === MetodoPagoGateway.tarjeta)
  @IsString({ message: 'Numero de tarjeta requerido' })
  @Matches(/^\d{13,19}$/, { message: 'Numero de tarjeta invalido' })
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
  @MinLength(3, { message: 'Banco origen invalido' })
  @MaxLength(80, { message: 'Banco origen demasiado largo' })
  bancoOrigen?: string;

  @ValidateIf((o: CreatePagoDto) => o.metodo === MetodoPagoGateway.transferencia)
  @IsString({ message: 'Referencia bancaria requerida' })
  @Matches(/^[A-Z0-9-]{6,40}$/i, {
    message: 'Referencia bancaria invalida',
  })
  referenciaBancaria?: string;

  @IsOptional()
  @IsString()
  @Matches(/^(n1co|wompi|stripe|bizz)$/i, { message: 'Pasarela no soportada' })
  pasarela?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500, { message: 'Notas demasiado largas' })
  notas?: string;
}
