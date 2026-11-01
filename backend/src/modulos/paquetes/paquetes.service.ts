import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CrearPaqueteDto } from './dto/crear-paquete.dto';
import { AsignarPaqueteDto } from './dto/asignar-paquete.dto';
import { EstadoPaquete, TipoMovimientoSesion } from '@prisma/client';

@Injectable()
export class PaquetesService {
  constructor(private readonly prisma: PrismaService) {}

  async crear(dto: CrearPaqueteDto) {
    return this.prisma.paquete.create({
      data: {
        nombre: dto.nombre,
        cantidadSesiones: dto.cantidadSesiones,
        precio: dto.precio,
        descripcion: dto.descripcion,
        vigenciaDias: dto.vigenciaDias || 90,
      },
    });
  }

  async listarCatalogo(soloActivos = true) {
    return this.prisma.paquete.findMany({
      where: soloActivos ? { estaActivo: true } : undefined,
      orderBy: { cantidadSesiones: 'asc' },
    });
  }

  async asignarAPaciente(dto: AsignarPaqueteDto) {
    const paquete = await this.prisma.paquete.findUnique({
      where: { id: dto.paqueteId },
    });
    if (!paquete) {
      throw new NotFoundException('Paquete no encontrado');
    }

    const paciente = await this.prisma.paciente.findUnique({
      where: { id: dto.pacienteId },
    });
    if (!paciente) {
      throw new NotFoundException('Paciente no encontrado');
    }

    const fechaCompra = new Date();
    const fechaExpiracion = new Date();
    fechaExpiracion.setDate(fechaCompra.getDate() + paquete.vigenciaDias);

    // El paquete se crea en PENDIENTE_PAGO. No genera movimiento en Kardex hasta registrar el pago.
    return this.prisma.paquetePaciente.create({
      data: {
        pacienteId: dto.pacienteId,
        paqueteId: dto.paqueteId,
        psicologoId: dto.psicologoId || null,
        sesionesTotales: paquete.cantidadSesiones,
        sesionesConsumidas: 0,
        sesionesRestantes: paquete.cantidadSesiones,
        estado: EstadoPaquete.PENDIENTE_PAGO,
        fechaCompra,
        fechaExpiracion,
      },
      include: {
        paquete: true,
        paciente: true,
      },
    });
  }

  async registrarPago(
    paquetePacienteId: string,
    monto: number,
    metodoPago: string,
    usuarioId?: string,
    notas?: string,
  ) {
    const paquetePaciente = await this.prisma.paquetePaciente.findUnique({
      where: { id: paquetePacienteId },
      include: { paquete: true, paciente: true },
    });

    if (!paquetePaciente) {
      throw new NotFoundException('Paquete del paciente no encontrado');
    }

    if (paquetePaciente.estado !== EstadoPaquete.PENDIENTE_PAGO) {
      throw new BadRequestException(
        `El paquete no está pendiente de pago (estado actual: ${paquetePaciente.estado})`,
      );
    }

    return this.prisma.$transaction(async (tx) => {
      // 1. Crear el registro en Pago
      const pago = await tx.pago.create({
        data: {
          paquetePacienteId,
          monto,
          metodoPago,
          usuarioId: usuarioId || null,
          notas: notas || `Pago de ${paquetePaciente.paquete.nombre}`,
        },
      });

      // 2. Actualizar PaquetePaciente a ACTIVO
      const paqueteActualizado = await tx.paquetePaciente.update({
        where: { id: paquetePacienteId },
        data: {
          estado: EstadoPaquete.ACTIVO,
          fechaCompra: new Date(),
        },
        include: { paquete: true, paciente: true, pagos: true },
      });

      // 3. Crear MovimientoSesion tipo COMPRA con la cantidad de sesiones
      await tx.movimientoSesion.create({
        data: {
          paquetePacienteId,
          tipo: TipoMovimientoSesion.COMPRA,
          cantidad: paquetePaciente.sesionesTotales,
          motivo: `Activación por pago (${metodoPago} - S/. ${monto}): ${paquetePaciente.paquete.nombre}`,
        },
      });

      return {
        mensaje: 'Pago registrado exitosamente. El paquete ahora está ACTIVO.',
        pago,
        paquetePaciente: paqueteActualizado,
      };
    });
  }

  async listarPaquetesDePaciente(pacienteId: string) {
    const ahora = new Date();
    await this.prisma.paquetePaciente.updateMany({
      where: {
        pacienteId,
        estado: EstadoPaquete.ACTIVO,
        fechaExpiracion: { lt: ahora },
      },
      data: {
        estado: EstadoPaquete.VENCIDO,
      },
    });

    return this.prisma.paquetePaciente.findMany({
      where: { pacienteId },
      include: { paquete: true, pagos: true },
      orderBy: { fechaCompra: 'desc' },
    });
  }
}
