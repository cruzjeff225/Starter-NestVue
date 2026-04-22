import { IsNotEmpty, IsString } from 'class-validator';

export class AnularFacturaDto {
  @IsNotEmpty({ message: 'El motivo de anulación es requerido' })
  @IsString()
  motivoAnulacion: string;
}
