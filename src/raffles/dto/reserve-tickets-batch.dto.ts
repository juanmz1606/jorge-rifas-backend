import { ArrayMaxSize, IsArray, IsUUID } from 'class-validator';

export class ReserveTicketsBatchDto {
  @IsArray()
  @ArrayMaxSize(40)
  @IsUUID('4', { each: true })
  ticketIds: string[];
}
