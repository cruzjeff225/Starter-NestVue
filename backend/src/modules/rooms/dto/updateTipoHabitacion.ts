import { PartialType } from '@nestjs/mapped-types';
import { CreateTipoHabitacionDto } from './createTipoHabitacionDto';
export class UpdateTipoHabitacionDto extends PartialType(
  CreateTipoHabitacionDto,
) {}
