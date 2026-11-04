import { IsEmail, IsNotEmpty, IsOptional, IsString, Length, Matches } from 'class-validator';

export class CrearPacienteDto {
  @IsString()
  @IsNotEmpty({ message: 'El DNI es obligatorio' })
  @Length(8, 8, { message: 'El DNI debe tener 8 dígitos numéricos' })
  @Matches(/^\d{8}$/, { message: 'El DNI debe tener 8 dígitos numéricos' })
  dni: string;

  @IsString()
  @IsNotEmpty({ message: 'Los nombres son obligatorios' })
  nombres: string;

  @IsString()
  @IsNotEmpty({ message: 'Los apellidos son obligatorios' })
  apellidos: string;

  @IsOptional()
  @IsString()
  @Length(9, 9, { message: 'El teléfono debe tener 9 dígitos' })
  @Matches(/^\d{9}$/, { message: 'El teléfono debe tener 9 dígitos' })
  telefono?: string;

  @IsNotEmpty({ message: 'El correo electrónico es obligatorio' })
  @IsEmail({}, { message: 'El correo debe ser válido' })
  correo: string;

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
