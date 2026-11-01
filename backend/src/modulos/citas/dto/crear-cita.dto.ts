import { IsDateString, IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { ModalidadCita } from '@prisma/client';

export class CrearCitaDto {
  @IsString()
  @IsNotEmpty({ message: 'El paciente es requerido' })
  pacienteId: string;

  @IsString()
  @IsNotEmpty({ message: 'El psicólogo es requerido' })
  psicologoId: string;

  @IsOptional()
  @IsString()
  paquetePacienteId?: string;

  @IsDateString({}, { message: 'La fecha y hora de inicio debe ser válida ISO8601' })
  @IsNotEmpty()
  fechaHoraInicio: string;

  @IsDateString({}, { message: 'La fecha y hora de fin debe ser válida ISO8601' })
  @IsNotEmpty()
  fechaHoraFin: string;

  @IsOptional()
  @IsString()
  motivoConsulta?: string;

  @IsOptional()
  @IsEnum(ModalidadCita, { message: 'La modalidad debe ser PRESENCIAL o VIRTUAL' })
  modalidad?: ModalidadCita;
}
