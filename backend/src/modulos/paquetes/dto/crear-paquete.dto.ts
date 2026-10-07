import { IsInt, IsNotEmpty, IsNumber, IsOptional, IsPositive, IsString, Min } from 'class-validator';

export class CrearPaqueteDto {
  @IsString()
  @IsNotEmpty({ message: 'El nombre del paquete es obligatorio' })
  nombre: string;

  @IsInt({ message: 'La cantidad de sesiones debe ser un entero' })
  @Min(1, { message: 'Debe incluir al menos 1 sesión' })
  cantidadSesiones: number;

  @IsNumber({}, { message: 'El precio debe ser un número válido' })
  @IsPositive({ message: 'El precio debe ser positivo' })
  precio: number;

  @IsOptional()
  @IsString()
  descripcion?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  vigenciaDias?: number;
}
