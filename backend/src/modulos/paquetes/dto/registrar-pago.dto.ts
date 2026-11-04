import { IsNotEmpty, IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class RegistrarPagoDto {
  @IsNumber()
  @Min(0.01, { message: 'El monto debe ser mayor a 0' })
  @IsNotEmpty({ message: 'El monto es obligatorio' })
  monto: number;

  @IsString()
  @IsNotEmpty({ message: 'El método de pago es obligatorio' })
  metodoPago: string;

  @IsOptional()
  @IsString()
  notas?: string;
}
