import { IsEmail, IsNotEmpty, IsOptional, IsString, Length, MinLength, IsNumber } from 'class-validator';

export class CrearPsicologoDto {
  @IsEmail({}, { message: 'El correo debe ser válido' })
  @IsNotEmpty({ message: 'El correo es requerido' })
  correo: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(6, { message: 'La contraseña temporal debe tener al menos 6 caracteres' })
  contrasena: string;

  @IsString()
  @IsNotEmpty()
  @Length(8, 12, { message: 'El DNI debe tener entre 8 y 12 caracteres' })
  dni: string;

  @IsString()
  @IsNotEmpty()
  nombres: string;

  @IsString()
  @IsNotEmpty()
  apellidos: string;

  @IsOptional()
  @IsString()
  telefono?: string;

  @IsOptional()
  @IsString()
  numeroColegiatura?: string;

  @IsOptional()
  @IsString()
  especialidad?: string;

  @IsOptional()
  @IsNumber()
  tarifaPorSesion?: number;

  @IsOptional()
  @IsString()
  biografia?: string;

  @IsOptional()
  @IsString()
  fotoUrl?: string;
}
