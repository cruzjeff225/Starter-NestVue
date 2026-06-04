import {
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsString,
  Matches,
  MaxLength,
  ValidateIf,
} from 'class-validator';
import { TipoCliente } from '@prisma/client';

export class CreateClienteDto {
  @IsNotEmpty({ message: 'El nombre es requerido' })
  @IsString()
  @MaxLength(100)
  nombre: string;

  @IsNotEmpty({ message: 'El apellido es requerido' })
  @IsString()
  @MaxLength(100)
  apellido: string;

  @IsEmail({}, { message: 'Email invalido' })
  email: string;

  @IsNotEmpty({ message: 'El telefono es requerido' })
  @IsString()
  telefono: string;

  @IsNotEmpty({ message: 'La direccion es requerida' })
  @IsString()
  direccion: string;

  @IsEnum(TipoCliente, { message: 'Tipo de cliente invalido' })
  tipoCliente: TipoCliente;

  @ValidateIf((o: CreateClienteDto) => o.tipoCliente === TipoCliente.extranjero)
  @IsNotEmpty({ message: 'El pais es requerido para clientes extranjeros' })
  @IsString()
  pais?: string;

  @ValidateIf((o: CreateClienteDto) => o.tipoCliente === TipoCliente.nacional)
  @IsNotEmpty({ message: 'El departamento es requerido para clientes nacionales' })
  @IsString()
  departamento?: string;

  @ValidateIf((o: CreateClienteDto) => o.tipoCliente === TipoCliente.nacional)
  @IsNotEmpty({ message: 'El municipio es requerido para clientes nacionales' })
  @IsString()
  municipio?: string;

  @ValidateIf((o: CreateClienteDto) => o.tipoCliente === TipoCliente.nacional)
  @IsNotEmpty({ message: 'El distrito es requerido para clientes nacionales' })
  @IsString()
  distrito?: string;

  @ValidateIf((o: CreateClienteDto) => o.tipoCliente === TipoCliente.nacional)
  @IsNotEmpty({ message: 'El DUI es requerido para clientes nacionales' })
  @Matches(/^\d{9}$/, { message: 'El DUI debe tener exactamente 9 digitos' })
  @IsString()
  dui?: string;

  @ValidateIf((o: CreateClienteDto) => o.tipoCliente === TipoCliente.extranjero)
  @IsNotEmpty({ message: 'El documento es requerido para clientes extranjeros' })
  @IsString()
  documento?: string;
}
