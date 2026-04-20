import { IsString, IsNumber, IsDateString, IsOptional, IsBoolean, IsInt, Min, IsArray, Max } from 'class-validator';

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
  @IsInt()
  @Min(3)
  @Max(4)
  digitCount?: number

  @IsOptional()
  @IsBoolean()
  featured?: boolean;

  @IsOptional()
  @IsArray()
  @IsInt({ each: true })
  @Min(1, { each: true })
  numbers?: number[]
}