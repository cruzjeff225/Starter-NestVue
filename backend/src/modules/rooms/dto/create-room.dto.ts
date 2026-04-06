import {
  IsString,
  IsNumber,
  IsEnum,
  IsPositive,
} from 'class-validator'
import { RoomStatus } from '@prisma/client'

export class CreateRoomDto {
  @IsString()
  number: string

  @IsNumber()
  @IsPositive()
  floor: number

  @IsNumber()
  @IsPositive()
  price: number

  @IsEnum(RoomStatus)
  status: RoomStatus

  @IsString()
  typeId: string
}