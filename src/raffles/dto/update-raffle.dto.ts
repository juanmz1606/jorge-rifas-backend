import { IsString, IsNumber, IsDateString, IsOptional, IsBoolean, IsInt, Max, Min } from 'class-validator'

export class UpdateRaffleDto {
  @IsOptional()
  @IsString()
  title?: string

  @IsOptional()
  @IsString()
  description?: string

  @IsOptional()
  @IsNumber()
  price?: number

  @IsOptional()
  @IsString()
  lotteryName?: string

  @IsOptional()
  @IsString()
  lotteryUrl?: string

  @IsOptional()
  @IsDateString()
  drawDate?: string

  @IsOptional()
  @IsString()
  whatsappNumber?: string

  @IsOptional()
  @IsInt()
  @Min(3)
  @Max(4)
  digitCount?: number

  @IsOptional()
  @IsBoolean()
  featured?: boolean

  @IsOptional()
  @IsString()
  status?: 'ACTIVE' | 'INACTIVE' | 'FINISHED'

  @IsOptional()
  @IsInt()
  winnerNumber?: number | null

  @IsOptional()
  @IsBoolean()
  updateSlug?: boolean
}