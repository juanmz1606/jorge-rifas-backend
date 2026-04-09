import { IsString, IsNumber, IsDateString, IsOptional, IsBoolean, IsInt, Min, IsArray } from 'class-validator';

export class CreateRaffleDto {
  @IsString()
  title!: string;

  @IsString()
  description!: string;

  @IsNumber()
  price!: number;

  @IsString()
  lotteryName!: string;

  @IsOptional()
  @IsString()
  lotteryUrl?: string;

  @IsDateString()
  drawDate!: string;

  @IsString()
  whatsappNumber!: string;

  @IsInt()
  @Min(1)
  totalNumbers!: number;

  @IsOptional()
  @IsBoolean()
  featured?: boolean;

  @IsOptional()
  @IsArray()
  @IsInt({ each: true })
  @Min(1, { each: true })
  numbers?: number[]
}