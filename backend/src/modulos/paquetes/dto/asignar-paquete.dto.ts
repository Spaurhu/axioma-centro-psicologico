import { IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';

export class AsignarPaqueteDto {
  @IsString()
  @IsNotEmpty({ message: 'El ID del paciente es obligatorio' })
  pacienteId: string;

  @IsString()
  @IsNotEmpty({ message: 'El ID del paquete es obligatorio' })
  paqueteId: string;

  @IsOptional()
  @IsNumber()
  precioPagado?: number;

  @IsOptional()
  @IsString()
  metodoPago?: string;
}
