import { IsString, IsOptional, IsEmail, Matches, Length } from 'class-validator'
import { Transform } from 'class-transformer'

export class UpdateCustomerDto {
  @IsOptional()
  @IsString()
  name?: string

  @IsOptional()
  @IsString()
  @Matches(/^[0-9+\s\-()]+$/, { message: 'El teléfono solo puede contener números, +, espacios o guiones' })
  @Length(7, 15, { message: 'El teléfono debe tener entre 7 y 15 caracteres' })
  phone?: string

  @IsOptional()
  @IsEmail({}, { message: 'El email no tiene un formato válido' })
  @Transform(({ value }) => value === '' ? undefined : value)
  email?: string
}