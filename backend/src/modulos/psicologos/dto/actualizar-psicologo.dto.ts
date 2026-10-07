import { IsOptional, IsString, IsNumber, IsBoolean } from 'class-validator';

export class ActualizarPsicologoDto {
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
  @IsBoolean()
  estaActivo?: boolean;
}
