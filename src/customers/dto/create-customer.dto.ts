import { IsString, IsNotEmpty, Matches, Length } from 'class-validator'

export class CreateCustomerDto {
  @IsString()
  name!: string

  @IsString()
  @Matches(/^[0-9+\s\-()]+$/, { message: 'El teléfono solo puede contener números, +, espacios o guiones' })
  @Length(7, 15, { message: 'El teléfono debe tener entre 7 y 15 caracteres' })
  phone!: string

  @IsString()
  @IsNotEmpty({ message: 'El lugar es obligatorio' })
  lugar!: string
}