import { IsDateString, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class ReprogramarCitaDto {
  @IsDateString({}, { message: 'La nueva fecha y hora de inicio debe ser válida' })
  @IsNotEmpty()
  nuevaFechaHoraInicio: string;

  @IsDateString({}, { message: 'La nueva fecha y hora de fin debe ser válida' })
  @IsNotEmpty()
  nuevaFechaHoraFin: string;

  @IsOptional()
  @IsString()
  motivoReprogramacion?: string;
}
