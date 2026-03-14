import { IsString, MinLength } from 'class-validator';

export class UpdateRolDto {
  @IsString({ message: 'El nombre es requerido' })
  @MinLength(3, { message: 'El nombre debe tener al menos 3 caracteres' })
  nombre: string;
}
