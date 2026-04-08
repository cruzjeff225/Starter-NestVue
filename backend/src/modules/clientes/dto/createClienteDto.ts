import {
  IsEmail,
  IsNotEmpty,
  IsString,
  MaxLength,
} from 'class-validator';

export class CreateClienteDto {
  @IsNotEmpty({ message: 'El nombre es requerido' })
  @IsString()
  @MaxLength(100)
  nombre: string;

  @IsNotEmpty({ message: 'El apellido es requerido' })
  @IsString()
  @MaxLength(100)
  apellido: string;

  @IsEmail({}, { message: 'Email inválido' })
  email: string;

  @IsNotEmpty({ message: 'El teléfono es requerido' })
  @IsString()
  telefono: string;

  @IsNotEmpty({ message: 'La dirección es requerida' })
  @IsString()
  direccion: string;

  @IsNotEmpty({ message: 'El departamento es requerido' })
  @IsString()
  departamento: string;

  @IsNotEmpty({ message: 'El municipio es requerido' })
  @IsString()
  municipio: string;

  @IsNotEmpty({ message: 'El distrito es requerido' })
  @IsString()
  distrito: string;

  @IsNotEmpty({ message: 'El DUI es requerido' })
  @IsString()
  dui: string;
}
