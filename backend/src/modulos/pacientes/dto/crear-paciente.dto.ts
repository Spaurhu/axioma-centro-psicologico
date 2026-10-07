import { IsEmail, IsNotEmpty, IsOptional, IsString, Length } from 'class-validator';

export class CrearPacienteDto {
  @IsString()
  @IsNotEmpty({ message: 'El DNI es obligatorio' })
  @Length(8, 12, { message: 'El DNI debe tener entre 8 y 12 caracteres' })
  dni: string;

  @IsString()
  @IsNotEmpty({ message: 'Los nombres son obligatorios' })
  nombres: string;

  @IsString()
  @IsNotEmpty({ message: 'Los apellidos son obligatorios' })
  apellidos: string;

  @IsOptional()
  @IsString()
  telefono?: string;

  @IsOptional()
  @IsEmail({}, { message: 'El correo debe ser válido' })
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
}
