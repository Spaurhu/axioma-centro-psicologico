import { Injectable, NotFoundException } from '@nestjs/common';
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

    return this.prisma.$transaction(async (tx) => {
      const nuevoPaquete = await tx.paquetePaciente.create({
        data: {
          pacienteId: dto.pacienteId,
          paqueteId: dto.paqueteId,
          sesionesTotales: paquete.cantidadSesiones,
          sesionesConsumidas: 0,
          sesionesRestantes: paquete.cantidadSesiones,
          estado: EstadoPaquete.ACTIVO,
          fechaCompra,
          fechaExpiracion,
        },
        include: {
          paquete: true,
        },
      });

      await tx.movimientoSesion.create({
        data: {
          paquetePacienteId: nuevoPaquete.id,
          tipo: TipoMovimientoSesion.COMPRA,
          cantidad: paquete.cantidadSesiones,
          motivo: `Compra y asignación de ${paquete.nombre}`,
        },
      });

      return nuevoPaquete;
    });
  }

  async listarPaquetesDePaciente(pacienteId: string) {
    return this.prisma.paquetePaciente.findMany({
      where: { pacienteId },
      include: { paquete: true },
      orderBy: { fechaCompra: 'desc' },
    });
  }
}
