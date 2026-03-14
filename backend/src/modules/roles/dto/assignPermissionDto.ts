import { IsInt } from 'class-validator';

export class AsignarPermisoDto {
  @IsInt({ message: 'El ID del permiso debe ser un número entero' })
  permisoId: number;
}
