import { PartialType } from '@nestjs/mapped-types';
import { CreateHabitacionDto } from './createHabitacionDto';
export class UpdateHabitacionDto extends PartialType(CreateHabitacionDto) {}
