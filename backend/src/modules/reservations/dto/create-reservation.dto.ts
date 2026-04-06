import { IsDateString, IsInt, IsString } from 'class-validator'

export class CreateReservationDto {
  @IsInt()
  customerId: number

  @IsString()
  roomId: string

  @IsDateString()
  checkIn: string

  @IsDateString()
  checkOut: string
}