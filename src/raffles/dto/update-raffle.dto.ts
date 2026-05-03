// update-raffle.dto.ts
import { IsString, IsDateString, IsOptional, IsBoolean, IsInt, Min, Max, IsEnum, Matches, IsNumber } from 'class-validator';
import { Transform } from 'class-transformer';
import { RaffleStatus } from '@prisma/client';

export class UpdateRaffleDto {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @Transform(({ value }) => Number(value))
  @IsNumber()
  @Min(0)
  price?: number;

  @IsOptional()
  @IsString()
  lotteryName?: string;

  @IsOptional()
  @IsString()
  lotteryUrl?: string;

  @IsOptional()
  @IsDateString()
  drawDate?: string;

  @IsOptional()
  @Matches(/^\d{7,15}$/, { message: 'whatsappNumber debe tener entre 7 y 15 dígitos' })
  whatsappNumber?: string;

  @IsOptional()
  @IsInt()
  @Min(3)
  @Max(4)
  digitCount?: number;

  @IsOptional()
  @IsBoolean()
  featured?: boolean;

  @IsOptional()
  @IsEnum(RaffleStatus)
  status?: RaffleStatus;

  @IsOptional()
  @IsInt()
  winnerNumber?: number | null;

  @IsOptional()
  @IsBoolean()
  updateSlug?: boolean;
}