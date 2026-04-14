import { PartialType } from '@nestjs/mapped-types';
import { CreateReservacionDto } from './CreateReservacionDto';
export class UpdateReservacionDto extends PartialType(CreateReservacionDto) {}
