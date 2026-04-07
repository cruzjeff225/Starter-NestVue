import { PartialType } from '@nestjs/mapped-types';
import { CreateClienteDto } from './createClienteDto';

export class UpdateClienteDto extends PartialType(CreateClienteDto) {}
