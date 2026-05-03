import { ArrayMaxSize, IsArray, IsUUID } from 'class-validator';

export class ReserveTicketsBatchDto {
  @IsArray()
  @ArrayMaxSize(20)
  @IsUUID('4', { each: true })
  ticketIds!: string[];
}
