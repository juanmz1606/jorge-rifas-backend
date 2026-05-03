// create-raffle.dto.ts
import { IsString, IsDateString, IsOptional, IsBoolean, IsInt, Min, IsArray, Max, Matches } from 'class-validator';
import { Transform } from 'class-transformer';

export class CreateRaffleDto {
  @IsString()
  title!: string;

  @IsString()
  description!: string;

  @Transform(({ value }) => Number(value))
  @IsInt()
  @Min(0)
  price!: number;

  @IsString()
  lotteryName!: string;

  @IsOptional()
  @IsString()
  lotteryUrl?: string;

  @IsDateString()
  drawDate!: string;

  @Matches(/^\d{7,15}$/, { message: 'whatsappNumber debe tener entre 7 y 15 dígitos' })
  whatsappNumber!: string;

  @IsInt()
  @Min(1)
  totalNumbers!: number;

  @IsOptional()
  @IsInt()
  @Min(3)
  @Max(4)
  digitCount?: number;

  @IsOptional()
  @IsBoolean()
  featured?: boolean;

  @IsOptional()
  @IsArray()
  @IsInt({ each: true })
  @Min(0, { each: true })
  numbers?: number[];
}