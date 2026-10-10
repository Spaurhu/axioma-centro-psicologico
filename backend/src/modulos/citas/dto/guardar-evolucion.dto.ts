import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class GuardarEvolucionDto {
  @IsNotEmpty({ message: 'El motivo de consulta es obligatorio' })
  @IsString()
  motivoConsulta: string;

  @IsOptional()
  @IsString()
  tecnicasUtilizadas?: string;

  @IsOptional()
  @IsString()
  observacionesConductuales?: string;

  @IsNotEmpty({ message: 'La nota de evolución es obligatoria' })
  @IsString()
  notaEvolucion: string;

  @IsOptional()
  @IsString()
  tareasCasa?: string;
}
