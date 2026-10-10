import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { MlService } from '../ml/ml.service';
import { CrearCitaDto } from './dto/crear-cita.dto';
import { ReprogramarCitaDto } from './dto/reprogramar-cita.dto';
import { EstadoCita, EstadoPaquete } from '@prisma/client';

@Injectable()
export class CitasService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly mlService: MlService,
  ) {}

  async crear(dto: CrearCitaDto) {
    const inicio = new Date(dto.fechaHoraInicio);
    const fin = new Date(dto.fechaHoraFin);
    const ahora = new Date();

    if (inicio < ahora) {
      throw new BadRequestException('No se puede registrar una cita en una fecha u hora pasada');
    }

    if (fin <= inicio) {
      throw new BadRequestException('La hora de fin debe ser posterior a la hora de inicio');
    }

    // 1. Validar que el psicólogo exista y esté activo
    const psicologo = await this.prisma.psicologo.findUnique({
      where: { id: dto.psicologoId },
    });
    if (!psicologo || !psicologo.estaActivo) {
      throw new BadRequestException('Psicólogo no disponible o inactivo');
    }

    // 2. Validar que el paciente exista
    const paciente = await this.prisma.paciente.findUnique({
      where: { id: dto.pacienteId },
      include: {
        citas: {
          select: { estado: true },
        },
      },
    });
    if (!paciente) {
      throw new NotFoundException('Paciente no encontrado');
    }

    // 3. Validar solapamiento de horario para el psicólogo
    const cruceCita = await this.prisma.cita.findFirst({
      where: {
        psicologoId: dto.psicologoId,
        estado: { notIn: [EstadoCita.CANCELADA, EstadoCita.REPROGRAMADA] },
        AND: [
          { fechaHoraInicio: { lt: fin } },
          { fechaHoraFin: { gt: inicio } },
        ],
      },
    });

    if (cruceCita) {
      throw new BadRequestException('El psicólogo ya cuenta con una cita programada en ese rango horario');
    }

    // 4. Verificar si tiene paquete y saldo disponible
    let paquetePacienteId = dto.paquetePacienteId;
    let tienePaqueteActivo = false;

    if (paquetePacienteId) {
      const paquete = await this.prisma.paquetePaciente.findUnique({
        where: { id: paquetePacienteId },
      });
      if (!paquete || paquete.pacienteId !== dto.pacienteId || paquete.estado !== EstadoPaquete.ACTIVO || paquete.sesionesRestantes <= 0) {
        throw new BadRequestException('El paquete seleccionado no es válido o no cuenta con sesiones disponibles');
      }
      tienePaqueteActivo = true;
    } else {
      // Buscar si el paciente tiene algún paquete activo disponible
      const paqueteDisponible = await this.prisma.paquetePaciente.findFirst({
        where: {
          pacienteId: dto.pacienteId,
          estado: EstadoPaquete.ACTIVO,
          sesionesRestantes: { gt: 0 },
        },
        orderBy: { fechaCompra: 'asc' },
      });

      if (paqueteDisponible) {
        paquetePacienteId = paqueteDisponible.id;
        tienePaqueteActivo = true;
      }
    }

    // 5. Inferencia de Machine Learning (No-Show Prediction)
    const hoy = new Date();
    const diffDias = Math.max(0, Math.ceil((inicio.getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24)));
    const diaSemanaIndex = (inicio.getDay() + 6) % 7; // 0: Lunes, 6: Domingo
    const hora = inicio.getHours();
    const turno = hora < 13 ? 0 : hora < 18 ? 1 : 2;

    const inasistenciasPrevias = paciente.citas.filter((c) => c.estado === EstadoCita.NO_ASISTIO).length;
    const citasPrevias = paciente.citas.filter((c) => c.estado === EstadoCita.ATENDIDA).length;

    const prediccionMl = this.mlService.predecirInasistencia({
      diasAnticipacion: diffDias,
      tienePaquete: tienePaqueteActivo,
      inasistenciasPrevias,
      citasPrevias,
      diaSemana: diaSemanaIndex,
      turno,
    });

    // 6. Guardar la cita con la predicción ML
    return this.prisma.cita.create({
      data: {
        pacienteId: dto.pacienteId,
        psicologoId: dto.psicologoId,
        paquetePacienteId: paquetePacienteId || null,
        fechaHoraInicio: inicio,
        fechaHoraFin: fin,
        estado: EstadoCita.PROGRAMADA,
        motivoConsulta: dto.motivoConsulta,
        probabilidadInasistencia: prediccionMl.probabilidad,
        nivelRiesgoInasistencia: prediccionMl.nivelRiesgo,
      },
      include: {
        paciente: true,
        psicologo: true,
        paquetePaciente: { include: { paquete: true } },
      },
    });
  }

  async listarPorFecha(fechaStr?: string, psicologoId?: string) {
    let whereClause: any = {};

    if (fechaStr) {
      const inicioDia = new Date(fechaStr);
      inicioDia.setHours(0, 0, 0, 0);

      const finDia = new Date(fechaStr);
      finDia.setHours(23, 59, 59, 999);

      whereClause.fechaHoraInicio = {
        gte: inicioDia,
        lte: finDia,
      };
    }

    if (psicologoId) {
      whereClause.psicologoId = psicologoId;
    }

    return this.prisma.cita.findMany({
      where: whereClause,
      include: {
        paciente: true,
        psicologo: true,
        paquetePaciente: { include: { paquete: true } },
      },
      orderBy: { fechaHoraInicio: 'asc' },
    });
  }

  async reprogramar(id: string, dto: ReprogramarCitaDto) {
    const cita = await this.prisma.cita.findUnique({ where: { id } });
    if (!cita) {
      throw new NotFoundException('Cita no encontrada');
    }

    const nuevaInicio = new Date(dto.nuevaFechaHoraInicio);
    const nuevaFin = new Date(dto.nuevaFechaHoraFin);
    const ahora = new Date();

    if (nuevaInicio < ahora) {
      throw new BadRequestException('No se puede reprogramar una cita a una fecha u hora pasada');
    }

    if (nuevaFin <= nuevaInicio) {
      throw new BadRequestException('La nueva hora de fin debe ser posterior a la de inicio');
    }

    // Validar solapamiento para la nueva fecha
    const cruce = await this.prisma.cita.findFirst({
      where: {
        id: { not: id },
        psicologoId: cita.psicologoId,
        estado: { notIn: [EstadoCita.CANCELADA, EstadoCita.REPROGRAMADA] },
        AND: [
          { fechaHoraInicio: { lt: nuevaFin } },
          { fechaHoraFin: { gt: nuevaInicio } },
        ],
      },
    });

    if (cruce) {
      throw new BadRequestException('El psicólogo ya tiene otra cita en el nuevo horario seleccionado');
    }

    return this.prisma.cita.update({
      where: { id },
      data: {
        fechaHoraInicio: nuevaInicio,
        fechaHoraFin: nuevaFin,
        estado: EstadoCita.PROGRAMADA,
        notaCancelacion: dto.motivoReprogramacion
          ? `Reprogramada: ${dto.motivoReprogramacion}`
          : cita.notaCancelacion,
      },
      include: {
        paciente: true,
        psicologo: true,
      },
    });
  }

  async cancelar(id: string, motivo: string) {
    const cita = await this.prisma.cita.findUnique({ where: { id } });
    if (!cita) {
      throw new NotFoundException('Cita no encontrada');
    }

    return this.prisma.cita.update({
      where: { id },
      data: {
        estado: EstadoCita.CANCELADA,
        notaCancelacion: motivo,
      },
    });
  }

  async marcarAsistencia(id: string) {
    const cita = await this.prisma.cita.findUnique({
      where: { id },
      include: { paquetePaciente: true },
    });

    if (!cita) {
      throw new NotFoundException('Cita no encontrada');
    }

    if (cita.estado === EstadoCita.ATENDIDA) {
      throw new BadRequestException('La cita ya fue marcada como atendida');
    }

    // Regla de Negocio Clínica: No se puede marcar asistencia de una cita antes de su fecha/hora (máx 30 min de margen previo)
    const ahora = new Date();
    const tiempoHastaInicio = new Date(cita.fechaHoraInicio).getTime() - ahora.getTime();
    const margenPermitidoMs = 30 * 60 * 1000; // 30 minutos

    if (tiempoHastaInicio > margenPermitidoMs) {
      throw new BadRequestException(
        'No se puede marcar asistencia anticipada. La cita está programada para una fecha u hora futura.',
      );
    }

    return this.prisma.$transaction(async (tx) => {
      // 1. Si la cita estaba vinculada a un paquete de sesiones, descontar 1 sesión
      if (cita.paquetePacienteId && cita.paquetePaciente) {
        const consumidas = cita.paquetePaciente.sesionesConsumidas + 1;
        const restantes = Math.max(0, cita.paquetePaciente.sesionesTotales - consumidas);
        const estado = restantes === 0 ? EstadoPaquete.AGOTADO : EstadoPaquete.ACTIVO;

        await tx.paquetePaciente.update({
          where: { id: cita.paquetePacienteId },
          data: {
            sesionesConsumidas: consumidas,
            sesionesRestantes: restantes,
            estado,
          },
        });
      }

      // 2. Marcar la cita como ATENDIDA
      return tx.cita.update({
        where: { id },
        data: {
          estado: EstadoCita.ATENDIDA,
        },
        include: {
          paciente: true,
          psicologo: true,
          paquetePaciente: true,
        },
      });
    });
  }

  async guardarEvolucion(citaId: string, dto: any) {
    const cita = await this.prisma.cita.findUnique({
      where: { id: citaId },
      include: { evolucionClinica: true },
    });

    if (!cita) {
      throw new NotFoundException('Cita no encontrada');
    }

    if (cita.evolucionClinica) {
      return this.prisma.evolucionClinica.update({
        where: { id: cita.evolucionClinica.id },
        data: {
          motivoConsulta: dto.motivoConsulta,
          tecnicasUtilizadas: dto.tecnicasUtilizadas,
          observacionesConductuales: dto.observacionesConductuales,
          notaEvolucion: dto.notaEvolucion,
          tareasCasa: dto.tareasCasa,
        },
      });
    }

    return this.prisma.evolucionClinica.create({
      data: {
        citaId,
        pacienteId: cita.pacienteId,
        psicologoId: cita.psicologoId,
        motivoConsulta: dto.motivoConsulta,
        tecnicasUtilizadas: dto.tecnicasUtilizadas,
        observacionesConductuales: dto.observacionesConductuales,
        notaEvolucion: dto.notaEvolucion,
        tareasCasa: dto.tareasCasa,
      },
    });
  }

  async obtenerEvolucion(citaId: string) {
    return this.prisma.evolucionClinica.findUnique({
      where: { citaId },
    });
  }
}
