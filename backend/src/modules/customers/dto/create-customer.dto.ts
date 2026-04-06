import {
  IsString,
  IsEmail,
  Length,
  Matches,
} from 'class-validator'

export class CreateCustomerDto {
  @IsString()
  @Length(3, 100)
  nombre: string

  @IsEmail()
  email: string

  @IsString()
  @Length(8, 20)
  telefono: string

  // 📍 Dirección estructurada
  @IsString()
  @Length(2, 100)
  departamento: string

  @IsString()
  @Length(2, 100)
  municipio: string

  @IsString()
  @Length(2, 100)
  distrito: string

  @IsString()
  @Length(5, 255)
  direccion: string
}