import { IsEmail, IsOptional, IsString, IsBoolean } from 'class-validator';

export class ActualizarPacienteDto {
  @IsOptional()
  @IsString()
  dni?: string;

  @IsOptional()
  @IsString()
  nombres?: string;

  @IsOptional()
  @IsString()
  apellidos?: string;

  @IsOptional()
  @IsString()
  telefono?: string;

  @IsOptional()
  @IsEmail()
  correo?: string;

  @IsOptional()
  @IsString()
  fechaNacimiento?: string;

  @IsOptional()
  @IsString()
  genero?: string;

  @IsOptional()
  @IsString()
  direccion?: string;

  @IsOptional()
  @IsString()
  nombreApoderado?: string;

  @IsOptional()
  @IsString()
  dniApoderado?: string;

  @IsOptional()
  @IsString()
  telefonoApoderado?: string;

  @IsOptional()
  @IsBoolean()
  estaActivo?: boolean;
}
