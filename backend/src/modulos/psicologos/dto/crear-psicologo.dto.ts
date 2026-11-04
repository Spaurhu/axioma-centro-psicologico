import { IsEmail, IsNotEmpty, IsOptional, IsString, Length, Matches, MinLength, IsNumber, IsArray } from 'class-validator';

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
  @Length(8, 8, { message: 'El DNI debe tener 8 dígitos numéricos' })
  @Matches(/^\d{8}$/, { message: 'El DNI debe tener 8 dígitos numéricos' })
  dni: string;

  @IsString()
  @IsNotEmpty()
  nombres: string;

  @IsString()
  @IsNotEmpty()
  apellidos: string;

  @IsOptional()
  @IsString()
  @Length(9, 9, { message: 'El teléfono debe tener 9 dígitos' })
  @Matches(/^\d{9}$/, { message: 'El teléfono debe tener 9 dígitos' })
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

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  diasAtencion?: string[];

  @IsOptional()
  @IsString()
  horaInicioLV?: string;

  @IsOptional()
  @IsString()
  horaFinLV?: string;

  @IsOptional()
  @IsString()
  horaInicioSabado?: string;

  @IsOptional()
  @IsString()
  horaFinSabado?: string;
}
