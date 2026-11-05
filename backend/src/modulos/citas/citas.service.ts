import { Injectable, BadRequestException, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { MlService } from '../ml/ml.service';
import { NotificacionesService } from '../../comun/notificaciones.service';
import { CrearCitaDto } from './dto/crear-cita.dto';
import { ReprogramarCitaDto } from './dto/reprogramar-cita.dto';
import { EstadoCita, EstadoPaquete, DiaSemana, TipoCita, TipoMovimientoSesion, Rol, ModalidadCita, NivelRiesgo } from '@prisma/client';
import { randomUUID } from 'crypto';

interface ValidarHorarioYCrucesParams {
  psicologoId: string;
  pacienteId: string;
  fechaHoraInicio: Date;
  fechaHoraFin: Date;
  citaIdExcluir?: string;
}

@Injectable()
export class CitasService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly mlService: MlService,
    private readonly notificacionesService: NotificacionesService,
  ) {}

  async crear(dto: CrearCitaDto) {
    const inicio = this.parsearFechaLima(dto.fechaHoraInicio);
    const fin = this.parsearFechaLima(dto.fechaHoraFin);
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

    // 3. Validar horarios del centro, refrigerio, feriados, disponibilidad y cruces
    await this.validarHorarioYCruces({
      psicologoId: dto.psicologoId,
      pacienteId: dto.pacienteId,
      fechaHoraInicio: inicio,
      fechaHoraFin: fin,
    });

    // 4. Verificar si tiene paquete y saldo disponible
    let paquetePacienteId = dto.paquetePacienteId;
    let tienePaqueteActivo = false;

    if (paquetePacienteId) {
      const paquete = await this.prisma.paquetePaciente.findUnique({
        where: { id: paquetePacienteId },
      });
      if (paquete && paquete.estado === EstadoPaquete.PENDIENTE_PAGO) {
        throw new BadRequestException(
          'El paquete del paciente está pendiente de pago. No se pueden agendar sesiones hasta confirmar el pago',
        );
      }
      if (paquete && paquete.fechaExpiracion && paquete.fechaExpiracion < new Date()) {
        await this.prisma.paquetePaciente.update({
          where: { id: paquete.id },
          data: { estado: EstadoPaquete.VENCIDO },
        });
        throw new BadRequestException('El paquete del paciente ha expirado. Por favor, adquiera uno nuevo.');
      }
      if (paquete && paquete.estado === EstadoPaquete.VENCIDO) {
        throw new BadRequestException('El paquete del paciente ha expirado. Por favor, adquiera uno nuevo.');
      }
      if (!paquete || paquete.pacienteId !== dto.pacienteId || paquete.estado !== EstadoPaquete.ACTIVO || paquete.sesionesRestantes <= 0) {
        throw new BadRequestException('El paquete seleccionado no es válido o no cuenta con sesiones disponibles');
      }
      if (paquete.psicologoId && paquete.psicologoId !== dto.psicologoId) {
        throw new BadRequestException(
          'El paquete de sesiones está vinculado al psicólogo tratante original. Para cambiar de terapeuta, solicite una transferencia de caso en recepción.',
        );
      }
      if (!paquete.psicologoId) {
        await this.prisma.paquetePaciente.update({
          where: { id: paquete.id },
          data: { psicologoId: dto.psicologoId },
        });
      }
      tienePaqueteActivo = true;
    } else {
      const paquetePendiente = await this.prisma.paquetePaciente.findFirst({
        where: {
          pacienteId: dto.pacienteId,
          estado: EstadoPaquete.PENDIENTE_PAGO,
        },
      });

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
        if (paqueteDisponible.fechaExpiracion && paqueteDisponible.fechaExpiracion < new Date()) {
          await this.prisma.paquetePaciente.update({
            where: { id: paqueteDisponible.id },
            data: { estado: EstadoPaquete.VENCIDO },
          });
          throw new BadRequestException('El paquete del paciente ha expirado. Por favor, adquiera uno nuevo.');
        }
        if (paqueteDisponible.psicologoId && paqueteDisponible.psicologoId !== dto.psicologoId) {
          throw new BadRequestException(
            'El paquete de sesiones está vinculado al psicólogo tratante original. Para cambiar de terapeuta, solicite una transferencia de caso en recepción.',
          );
        }
        if (!paqueteDisponible.psicologoId) {
          await this.prisma.paquetePaciente.update({
            where: { id: paqueteDisponible.id },
            data: { psicologoId: dto.psicologoId },
          });
        }
        paquetePacienteId = paqueteDisponible.id;
        tienePaqueteActivo = true;
      } else if (paquetePendiente) {
        throw new BadRequestException(
          'El paquete del paciente está pendiente de pago. No se pueden agendar sesiones hasta confirmar el pago',
        );
      } else {
        const paqueteVencido = await this.prisma.paquetePaciente.findFirst({
          where: {
            pacienteId: dto.pacienteId,
            OR: [
              { estado: EstadoPaquete.VENCIDO },
              { estado: EstadoPaquete.ACTIVO, fechaExpiracion: { lt: new Date() } },
            ],
          },
        });
        if (paqueteVencido) {
          if (paqueteVencido.estado !== EstadoPaquete.VENCIDO) {
            await this.prisma.paquetePaciente.update({
              where: { id: paqueteVencido.id },
              data: { estado: EstadoPaquete.VENCIDO },
            });
          }
          throw new BadRequestException('El paquete del paciente ha expirado. Por favor, adquiera uno nuevo.');
        }
      }
    }

    // 5. Inferencia de Machine Learning (No-Show Prediction)
    const hoy = new Date();
    const diffDias = Math.max(0, Math.ceil((inicio.getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24)));
    const fechaLimaMl = new Date(inicio.toLocaleString('en-US', { timeZone: 'America/Lima' }));
    const diaSemanaIndex = (fechaLimaMl.getDay() + 6) % 7; // 0: Lunes, 6: Domingo
    const hora = fechaLimaMl.getHours();
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
    const modalidad = dto.modalidad === ModalidadCita.VIRTUAL ? ModalidadCita.VIRTUAL : ModalidadCita.PRESENCIAL;
    const citaId = randomUUID();
    const enlaceVideo = modalidad === ModalidadCita.VIRTUAL
      ? `https://meet.google.com/axioma-${citaId.slice(0, 8)}-${Date.now()}`
      : null;

    const citaCreada = await this.prisma.cita.create({
      data: {
        id: citaId,
        modalidad,
        enlaceVideo,
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

    // Notificación inmediata al paciente (Consola + Telegram)
    this.notificacionesService.enviarConfirmacion(paciente, citaCreada);

    // Acción automática ML: Si el riesgo de inasistencia es ALTO (o probabilidad > 0.60), enviar correo de confirmación obligatoria
    if (
      prediccionMl.nivelRiesgo === NivelRiesgo.ALTO ||
      Number(prediccionMl.probabilidad) > 0.6
    ) {
      this.notificacionesService.enviarConfirmacionObligatoria(paciente, citaCreada);
    }

    return citaCreada;
  }

  async enviarRecordatorioManual(id: string) {
    const cita = await this.prisma.cita.findUnique({
      where: { id },
      include: {
        paciente: true,
        psicologo: true,
        paquetePaciente: { include: { paquete: true } },
      },
    });

    if (!cita) {
      throw new NotFoundException('Cita no encontrada');
    }

    await this.notificacionesService.enviarConfirmacionObligatoria(cita.paciente, cita);

    return {
      mensaje: 'Recordatorio de confirmación obligatoria enviado exitosamente.',
      citaId: cita.id,
    };
  }

  async listarPorFecha(fechaStr?: string, psicologoId?: string, user?: any) {
    let whereClause: any = {};

    if (fechaStr) {
      const fechaBase = fechaStr.split('T')[0];
      const inicioDia = new Date(`${fechaBase}T00:00:00.000-05:00`);
      const finDia = new Date(`${fechaBase}T23:59:59.999-05:00`);

      whereClause.fechaHoraInicio = {
        gte: inicioDia,
        lte: finDia,
      };
    }

    if (user?.rol === Rol.PSICOLOGO && user?.psicologo?.id) {
      whereClause.psicologoId = user.psicologo.id;
    } else if (user?.rol === Rol.PACIENTE && user?.paciente?.id) {
      whereClause.pacienteId = user.paciente.id;
    } else if (psicologoId) {
      whereClause.psicologoId = psicologoId;
    }

    return this.prisma.cita.findMany({
      where: whereClause,
      include: {
        paciente: true,
        psicologo: true,
        paquetePaciente: { include: { paquete: true } },
        evolucionClinica: true,
      },
      orderBy: { fechaHoraInicio: 'asc' },
    });
  }

  async obtenerEstadisticasPsicologo(user?: any, psicologoIdQuery?: string) {
    const targetPsicologoId =
      user?.rol === Rol.PSICOLOGO && user?.psicologo?.id
        ? user.psicologo.id
        : psicologoIdQuery || undefined;

    const whereClause = targetPsicologoId ? { psicologoId: targetPsicologoId } : {};

    const todasCitas = await this.prisma.cita.findMany({
      where: whereClause,
      include: {
        paciente: true,
        psicologo: true,
        paquetePaciente: { include: { paquete: true } },
        evolucionClinica: true,
      },
      orderBy: { fechaHoraInicio: 'desc' },
    });

    const ahora = new Date();
    const inicioMes = new Date(ahora.getFullYear(), ahora.getMonth(), 1, 0, 0, 0, 0);
    const finMes = new Date(ahora.getFullYear(), ahora.getMonth() + 1, 0, 23, 59, 59, 999);

    const sesionesAtendidasMes = todasCitas.filter((c) => {
      const f = new Date(c.fechaHoraInicio);
      return c.estado === EstadoCita.ATENDIDA && f >= inicioMes && f <= finMes;
    }).length;

    const pacientesUnicosMap = new Map<string, any>();
    for (const c of todasCitas) {
      if (!c.paciente) continue;
      if (!pacientesUnicosMap.has(c.pacienteId)) {
        pacientesUnicosMap.set(c.pacienteId, {
          paciente: c.paciente,
          totalCitas: 0,
          citasAtendidas: 0,
          inasistencias: 0,
          ultimaCita: c.fechaHoraInicio,
          citas: [],
          notasSoap: [],
        });
      }
      const item = pacientesUnicosMap.get(c.pacienteId);
      item.totalCitas += 1;
      if (c.estado === EstadoCita.ATENDIDA) item.citasAtendidas += 1;
      if (c.estado === EstadoCita.NO_ASISTIO) item.inasistencias += 1;
      item.citas.push(c);
      if (c.evolucionClinica) {
        item.notasSoap.push({
          ...c.evolucionClinica,
          cita: c,
          fechaHoraInicio: c.fechaHoraInicio,
          fechaHoraFin: c.fechaHoraFin,
          tipoCita: c.tipoCita,
        });
      }
    }

    const pacientesActivos = pacientesUnicosMap.size;
    const totalInasistencias = todasCitas.filter((c) => c.estado === EstadoCita.NO_ASISTIO).length;
    const totalAtendidas = todasCitas.filter((c) => c.estado === EstadoCita.ATENDIDA).length;
    const baseTasa = totalAtendidas + totalInasistencias;
    const tasaInasistencia = baseTasa > 0 ? Math.round((totalInasistencias / baseTasa) * 100) : 0;

    const sesionesPorSemana: {
      etiqueta: string;
      rango: string;
      atendidas: number;
      programadas: number;
      noAsistio: number;
      total: number;
    }[] = [];

    const diaActual = ahora.getDay();
    const diffLunes = ahora.getDate() - diaActual + (diaActual === 0 ? -6 : 1);
    const lunesActual = new Date(ahora.getFullYear(), ahora.getMonth(), diffLunes, 0, 0, 0, 0);

    for (let i = 3; i >= 0; i--) {
      const inicioSem = new Date(lunesActual);
      inicioSem.setDate(inicioSem.getDate() - i * 7);
      const finSem = new Date(inicioSem);
      finSem.setDate(finSem.getDate() + 6);
      finSem.setHours(23, 59, 59, 999);

      const citasSem = todasCitas.filter((c) => {
        const f = new Date(c.fechaHoraInicio);
        return f >= inicioSem && f <= finSem;
      });

      const atendidasSem = citasSem.filter((c) => c.estado === EstadoCita.ATENDIDA).length;
      const programadasSem = citasSem.filter(
        (c) => c.estado === EstadoCita.PROGRAMADA || c.estado === EstadoCita.CONFIRMADA,
      ).length;
      const noAsistioSem = citasSem.filter((c) => c.estado === EstadoCita.NO_ASISTIO).length;
      const rangoStr = `${inicioSem.toLocaleDateString('es-PE', { day: '2-digit', month: 'short' })} - ${finSem.toLocaleDateString('es-PE', { day: '2-digit', month: 'short' })}`;

      sesionesPorSemana.push({
        etiqueta: i === 0 ? 'Esta semana' : `Hace ${i} sem.`,
        rango: rangoStr,
        atendidas: atendidasSem,
        programadas: programadasSem,
        noAsistio: noAsistioSem,
        total: atendidasSem + programadasSem + noAsistioSem,
      });
    }

    return {
      sesionesAtendidasMes,
      pacientesActivos,
      tasaInasistencia,
      totalInasistencias,
      totalAtendidas,
      totalCitas: todasCitas.length,
      sesionesPorSemana,
      pacientes: Array.from(pacientesUnicosMap.values()),
    };
  }

  async obtenerPorId(id: string, user?: any) {
    const cita = await this.prisma.cita.findUnique({
      where: { id },
      include: {
        paciente: true,
        psicologo: true,
        paquetePaciente: { include: { paquete: true } },
        movimientosSesion: true,
      },
    });

    if (!cita) {
      throw new NotFoundException('Cita no encontrada');
    }

    if (user?.rol === Rol.PSICOLOGO && user?.psicologo?.id && cita.psicologoId !== user.psicologo.id) {
      throw new ForbiddenException('No tiene permiso para ver esta cita');
    }

    if (user?.rol === Rol.PACIENTE && user?.paciente?.id && cita.pacienteId !== user.paciente.id) {
      throw new ForbiddenException('No tiene permiso para ver esta cita');
    }

    return cita;
  }

  async reprogramar(id: string, dto: ReprogramarCitaDto) {
    const cita = await this.prisma.cita.findUnique({ where: { id } });
    if (!cita) {
      throw new NotFoundException('Cita no encontrada');
    }

    const nuevaInicio = this.parsearFechaLima(dto.nuevaFechaHoraInicio);
    const nuevaFin = this.parsearFechaLima(dto.nuevaFechaHoraFin);
    const ahora = new Date();

    if (nuevaInicio < ahora) {
      throw new BadRequestException('No se puede reprogramar una cita a una fecha u hora pasada');
    }

    if (nuevaFin <= nuevaInicio) {
      throw new BadRequestException('La nueva hora de fin debe ser posterior a la de inicio');
    }

    // Validar horarios del centro, refrigerio, feriados, disponibilidad y cruces (excluyendo cita actual)
    await this.validarHorarioYCruces({
      psicologoId: cita.psicologoId,
      pacienteId: cita.pacienteId,
      fechaHoraInicio: nuevaInicio,
      fechaHoraFin: nuevaFin,
      citaIdExcluir: id,
    });

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

  async cancelar(id: string, motivo: string, usuarioId?: string) {
    const cita = await this.prisma.cita.findUnique({
      where: { id },
      include: {
        paquetePaciente: true,
        movimientosSesion: true,
      },
    });
    if (!cita) {
      throw new NotFoundException('Cita no encontrada');
    }
    if (cita.estado === EstadoCita.CANCELADA) {
      throw new BadRequestException('La cita ya se encuentra cancelada');
    }

    const ahora = Date.now();
    const tiempoHastaInicio = new Date(cita.fechaHoraInicio).getTime() - ahora;
    const esCancelacionTardia = tiempoHastaInicio < 24 * 60 * 60 * 1000;

    const yaPenalizadaOConsumida = cita.movimientosSesion.some(
      (m) => m.tipo === TipoMovimientoSesion.PENALIZACION || m.tipo === TipoMovimientoSesion.CONSUMO,
    );

    // RN-22b & RN-23: Si cancela con menos de 24 horas y es terapia con paquete, aplica penalización
    if (esCancelacionTardia && cita.tipoCita === TipoCita.TERAPIA && cita.paquetePacienteId && cita.paquetePaciente) {
      return this.prisma.$transaction(async (tx) => {
        if (!yaPenalizadaOConsumida && cita.paquetePaciente!.sesionesRestantes > 0) {
          await tx.movimientoSesion.create({
            data: {
              paquetePacienteId: cita.paquetePacienteId!,
              citaId: id,
              tipo: TipoMovimientoSesion.PENALIZACION,
              cantidad: -1,
              motivo: 'Cancelación tardía (<24h)',
            },
          });

          const consumidas = cita.paquetePaciente!.sesionesConsumidas + 1;
          const restantes = Math.max(0, cita.paquetePaciente!.sesionesRestantes - 1);
          const estado = restantes === 0 ? EstadoPaquete.AGOTADO : EstadoPaquete.ACTIVO;

          await tx.paquetePaciente.update({
            where: { id: cita.paquetePacienteId! },
            data: {
              sesionesConsumidas: consumidas,
              sesionesRestantes: restantes,
              estado,
            },
          });
        }

        return tx.cita.update({
          where: { id },
          data: {
            estado: EstadoCita.CANCELADA,
            notaCancelacion: motivo ? `Cancelación tardía (<24h): ${motivo}` : 'Cancelación tardía (<24h)',
          },
          include: { paciente: true, psicologo: true, paquetePaciente: true },
        });
      });
    }

    return this.prisma.cita.update({
      where: { id },
      data: {
        estado: EstadoCita.CANCELADA,
        notaCancelacion: motivo,
      },
      include: { paciente: true, psicologo: true, paquetePaciente: true },
    });
  }

  async marcarAsistencia(id: string, usuarioId?: string) {
    const cita = await this.prisma.cita.findUnique({
      where: { id },
      include: {
        paquetePaciente: true,
        movimientosSesion: true,
      },
    });

    if (!cita) {
      throw new NotFoundException('Cita no encontrada');
    }

    if (cita.estado === EstadoCita.ATENDIDA) {
      throw new BadRequestException('La cita ya fue marcada como atendida');
    }
    if (cita.estado !== EstadoCita.PROGRAMADA && cita.estado !== EstadoCita.CONFIRMADA) {
      throw new BadRequestException('Solo se puede marcar asistencia en citas programadas o confirmadas');
    }

    const ahora = new Date();
    const tiempoHastaInicio = new Date(cita.fechaHoraInicio).getTime() - ahora.getTime();
    const margenPermitidoMs = 30 * 60 * 1000; // 30 minutos

    if (tiempoHastaInicio > margenPermitidoMs) {
      throw new BadRequestException(
        'No se puede marcar asistencia anticipada. La cita está programada para una fecha u hora futura.',
      );
    }

    // RN-02: La sesión de evaluación NO descuenta sesiones de paquete
    if (cita.tipoCita === TipoCita.EVALUACION) {
      return this.prisma.cita.update({
        where: { id },
        data: { estado: EstadoCita.ATENDIDA },
        include: { paciente: true, psicologo: true, paquetePaciente: true },
      });
    }

    // RN-46: Anti-doble descuento para citas de TERAPIA
    const movimientoPrevio = cita.movimientosSesion.find(
      (m) => m.tipo === TipoMovimientoSesion.CONSUMO || m.tipo === TipoMovimientoSesion.PENALIZACION,
    );

    if (cita.paquetePacienteId && cita.paquetePaciente) {
      if (cita.paquetePaciente.estado === EstadoPaquete.PENDIENTE_PAGO) {
        throw new BadRequestException('El paquete del paciente está pendiente de pago. No se pueden procesar asistencias hasta confirmar el pago');
      }
      if (cita.paquetePaciente.fechaExpiracion && cita.paquetePaciente.fechaExpiracion < new Date()) {
        await this.prisma.paquetePaciente.update({
          where: { id: cita.paquetePaciente.id },
          data: { estado: EstadoPaquete.VENCIDO },
        });
        throw new BadRequestException('El paquete del paciente ha expirado. Por favor, adquiera uno nuevo.');
      }
      if (cita.paquetePaciente.estado === EstadoPaquete.VENCIDO) {
        throw new BadRequestException('El paquete del paciente ha expirado. Por favor, adquiera uno nuevo.');
      }
      if (!movimientoPrevio && cita.paquetePaciente.sesionesRestantes <= 0) {
        throw new BadRequestException('El paquete de sesiones no cuenta con saldo disponible');
      }

      return this.prisma.$transaction(async (tx) => {
        if (!movimientoPrevio) {
          await tx.movimientoSesion.create({
            data: {
              paquetePacienteId: cita.paquetePacienteId!,
              citaId: id,
              tipo: TipoMovimientoSesion.CONSUMO,
              cantidad: -1,
              motivo: 'Asistencia a terapia',
            },
          });

          const consumidas = cita.paquetePaciente!.sesionesConsumidas + 1;
          const restantes = Math.max(0, cita.paquetePaciente!.sesionesRestantes - 1);
          const estado = restantes === 0 ? EstadoPaquete.AGOTADO : EstadoPaquete.ACTIVO;

          await tx.paquetePaciente.update({
            where: { id: cita.paquetePacienteId! },
            data: {
              sesionesConsumidas: consumidas,
              sesionesRestantes: restantes,
              estado,
            },
          });
        }

        return tx.cita.update({
          where: { id },
          data: { estado: EstadoCita.ATENDIDA },
          include: { paciente: true, psicologo: true, paquetePaciente: true },
        });
      });
    }

    // Si es terapia sin paquete (pago individual / pendiente)
    return this.prisma.cita.update({
      where: { id },
      data: { estado: EstadoCita.ATENDIDA },
      include: { paciente: true, psicologo: true, paquetePaciente: true },
    });
  }

  async marcarNoAsistio(id: string, usuarioId?: string) {
    const cita = await this.prisma.cita.findUnique({
      where: { id },
      include: {
        paquetePaciente: true,
        movimientosSesion: true,
      },
    });

    if (!cita) {
      throw new NotFoundException('Cita no encontrada');
    }
    if (cita.estado === EstadoCita.NO_ASISTIO) {
      throw new BadRequestException('La cita ya fue marcada como no asistida');
    }
    if (cita.estado !== EstadoCita.PROGRAMADA && cita.estado !== EstadoCita.CONFIRMADA) {
      throw new BadRequestException('Solo se puede marcar inasistencia en citas programadas o confirmadas');
    }

    const tienePenalizacion = cita.movimientosSesion.some(
      (m) => m.tipo === TipoMovimientoSesion.PENALIZACION || m.tipo === TipoMovimientoSesion.CONSUMO,
    );

    if (cita.tipoCita === TipoCita.TERAPIA && cita.paquetePacienteId && cita.paquetePaciente) {
      return this.prisma.$transaction(async (tx) => {
        if (!tienePenalizacion && cita.paquetePaciente!.sesionesRestantes > 0) {
          await tx.movimientoSesion.create({
            data: {
              paquetePacienteId: cita.paquetePacienteId!,
              citaId: id,
              tipo: TipoMovimientoSesion.PENALIZACION,
              cantidad: -1,
              motivo: 'Inasistencia a terapia',
            },
          });

          const consumidas = cita.paquetePaciente!.sesionesConsumidas + 1;
          const restantes = Math.max(0, cita.paquetePaciente!.sesionesRestantes - 1);
          const estado = restantes === 0 ? EstadoPaquete.AGOTADO : EstadoPaquete.ACTIVO;

          await tx.paquetePaciente.update({
            where: { id: cita.paquetePacienteId! },
            data: {
              sesionesConsumidas: consumidas,
              sesionesRestantes: restantes,
              estado,
            },
          });
        }

        return tx.cita.update({
          where: { id },
          data: { estado: EstadoCita.NO_ASISTIO },
          include: { paciente: true, psicologo: true, paquetePaciente: true },
        });
      });
    }

    return this.prisma.cita.update({
      where: { id },
      data: { estado: EstadoCita.NO_ASISTIO },
      include: { paciente: true, psicologo: true, paquetePaciente: true },
    });
  }

  async revertirCita(id: string, usuarioId?: string) {
    const cita = await this.prisma.cita.findUnique({
      where: { id },
      include: {
        paquetePaciente: true,
        movimientosSesion: true,
      },
    });

    if (!cita) {
      throw new NotFoundException('Cita no encontrada');
    }

    const movimientoConsumoOPenalizacion = cita.movimientosSesion.find(
      (m) => m.tipo === TipoMovimientoSesion.CONSUMO || m.tipo === TipoMovimientoSesion.PENALIZACION,
    );

    if (!movimientoConsumoOPenalizacion) {
      throw new BadRequestException('La cita no tiene movimientos de consumo o penalización para revertir');
    }

    const yaRevertida = cita.movimientosSesion.some(
      (m) => m.tipo === TipoMovimientoSesion.REVERSION,
    );

    if (yaRevertida) {
      throw new BadRequestException('La cita ya fue revertida anteriormente');
    }

    if (!cita.paquetePacienteId || !cita.paquetePaciente) {
      throw new BadRequestException('La cita no cuenta con un paquete de sesiones asociado');
    }

    return this.prisma.$transaction(async (tx) => {
      await tx.movimientoSesion.create({
        data: {
          paquetePacienteId: cita.paquetePacienteId!,
          citaId: id,
          tipo: TipoMovimientoSesion.REVERSION,
          cantidad: 1,
          motivo: 'Reversión administrativa',
        },
      });

      const consumidas = Math.max(0, cita.paquetePaciente!.sesionesConsumidas - 1);
      const restantes = cita.paquetePaciente!.sesionesRestantes + 1;

      await tx.paquetePaciente.update({
        where: { id: cita.paquetePacienteId! },
        data: {
          sesionesConsumidas: consumidas,
          sesionesRestantes: restantes,
          estado: EstadoPaquete.ACTIVO,
        },
      });

      const citaActualizada = await tx.cita.update({
        where: { id },
        data: { estado: EstadoCita.PROGRAMADA },
        include: { paciente: true, psicologo: true, paquetePaciente: true },
      });

      if (usuarioId) {
        await tx.logAuditoria.create({
          data: {
            usuarioId,
            accion: 'REVERTIR_CITA',
            entidadAfectada: 'Cita',
            entidadId: id,
            detalles: `Reversión administrativa de cita ${id}: restituida 1 sesión al paquete ${cita.paquetePacienteId}`,
          },
        });
      }

      return citaActualizada;
    });
  }

  async guardarEvolucion(citaId: string, dto: any, user?: any) {
    const cita = await this.prisma.cita.findUnique({
      where: { id: citaId },
      include: { evolucionClinica: true },
    });

    if (!cita) {
      throw new NotFoundException('Cita no encontrada');
    }

    if (user && user.rol === Rol.PSICOLOGO && (!user.psicologo || cita.psicologoId !== user.psicologo.id)) {
      throw new ForbiddenException('Solo el psicólogo tratante puede acceder a esta nota');
    }

    if (cita.evolucionClinica) {
      const evolucion = await this.prisma.evolucionClinica.update({
        where: { id: cita.evolucionClinica.id },
        data: {
          motivoConsulta: dto.motivoConsulta,
          tecnicasUtilizadas: dto.tecnicasUtilizadas,
          observacionesConductuales: dto.observacionesConductuales,
          notaEvolucion: dto.notaEvolucion,
          tareasCasa: dto.tareasCasa,
        },
      });

      if (user?.id) {
        await this.prisma.logAuditoria.create({
          data: {
            usuarioId: user.id,
            accion: 'MODIFICAR_EVOLUCION',
            entidadAfectada: 'EvolucionClinica',
            entidadId: evolucion.id,
            detalles: `Modificación de nota clínica SOAP para cita ${citaId}`,
          },
        });
      }

      return evolucion;
    }

    const evolucion = await this.prisma.evolucionClinica.create({
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

    if (user?.id) {
      await this.prisma.logAuditoria.create({
        data: {
          usuarioId: user.id,
          accion: 'CREAR_EVOLUCION',
          entidadAfectada: 'EvolucionClinica',
          entidadId: evolucion.id,
          detalles: `Creación de nota clínica SOAP para cita ${citaId}`,
        },
      });
    }

    return evolucion;
  }

  async obtenerEvolucion(citaId: string, user?: any) {
    const cita = await this.prisma.cita.findUnique({
      where: { id: citaId },
      include: { evolucionClinica: true },
    });

    if (!cita) {
      throw new NotFoundException('Cita no encontrada');
    }

    if (user && user.rol === Rol.PSICOLOGO && (!user.psicologo || cita.psicologoId !== user.psicologo.id)) {
      throw new ForbiddenException('Solo el psicólogo tratante puede acceder a esta nota');
    }

    if (user?.id && cita.evolucionClinica) {
      await this.prisma.logAuditoria.create({
        data: {
          usuarioId: user.id,
          accion: 'LEER_EVOLUCION',
          entidadAfectada: 'EvolucionClinica',
          entidadId: cita.evolucionClinica.id,
          detalles: `Lectura de nota clínica SOAP para cita ${citaId}`,
        },
      });
    }

    return cita.evolucionClinica;
  }

  private parsearFechaLima(fechaStr: string): Date {
    const limpio = String(fechaStr || '').trim();
    const tieneZona = /(?:Z|[+-]\d{2}:?\d{2})$/i.test(limpio);
    return new Date(tieneZona ? limpio : `${limpio}-05:00`);
  }

  private normalizarHoraConfig(horaStr: string): string {
    const partes = String(horaStr || '').trim().split(':');
    const hh = (partes[0] || '00').padStart(2, '0');
    const mm = (partes[1] || '00').padStart(2, '0');
    return `${hh}:${mm}`;
  }

  private extraerHoraString(fecha: Date): string {
    const formatter = new Intl.DateTimeFormat('es-PE', {
      timeZone: 'America/Lima',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
      hourCycle: 'h23',
    });
    const partes = formatter.formatToParts(fecha);
    const hh = (partes.find((p) => p.type === 'hour')?.value || '00').padStart(2, '0');
    const mm = (partes.find((p) => p.type === 'minute')?.value || '00').padStart(2, '0');
    return `${hh === '24' ? '00' : hh}:${mm}`;
  }

  private async validarHorarioYCruces(params: ValidarHorarioYCrucesParams) {
    const { psicologoId, pacienteId, fechaHoraInicio: inicio, fechaHoraFin: fin, citaIdExcluir } = params;

    // Convertir a zona horaria de Lima para todas las validaciones
    const fechaLima = new Date(inicio.toLocaleString('en-US', { timeZone: 'America/Lima' }));

    // 1. VALIDACIÓN DE DOMINGOS (RN-36)
    if (fechaLima.getDay() === 0) {
      throw new BadRequestException('El centro psicológico no atiende los domingos');
    }

    // 2. VALIDACIÓN DE FERIADOS (RN-40, RN-42)
    const year = fechaLima.getFullYear();
    const month = String(fechaLima.getMonth() + 1).padStart(2, '0');
    const day = String(fechaLima.getDate()).padStart(2, '0');
    const feriado = await this.prisma.feriado.findFirst({
      where: {
        activo: true,
        fecha: new Date(`${year}-${month}-${day}T05:00:00.000Z`),
      },
    });

    if (feriado) {
      throw new BadRequestException(`La fecha seleccionada corresponde al feriado: ${feriado.descripcion}`);
    }

    // 3. VALIDACIÓN DE HORARIO DEL CENTRO (RN-34, RN-35, RN-38)
    const diaSemanaMap: Record<number, DiaSemana> = {
      0: DiaSemana.DOMINGO,
      1: DiaSemana.LUNES,
      2: DiaSemana.MARTES,
      3: DiaSemana.MIERCOLES,
      4: DiaSemana.JUEVES,
      5: DiaSemana.VIERNES,
      6: DiaSemana.SABADO,
    };
    const diaSemana = diaSemanaMap[fechaLima.getDay()];

    const configHorario = await this.prisma.configuracionHorario.findUnique({
      where: { diaSemana },
    });

    if (!configHorario || !configHorario.activo) {
      throw new BadRequestException('El centro no atiende ese día');
    }

    const horaInicioCita = this.extraerHoraString(inicio);
    const horaFinCita = this.extraerHoraString(fin);

    if (
      configHorario.horaInicio &&
      configHorario.horaFin &&
      (
        horaInicioCita < this.normalizarHoraConfig(configHorario.horaInicio) ||
        horaFinCita > this.normalizarHoraConfig(configHorario.horaFin)
      )
    ) {
      throw new BadRequestException(
        `La cita debe estar dentro del horario de atención: ${configHorario.horaInicio} - ${configHorario.horaFin}`,
      );
    }

    // 4. VALIDACIÓN DE REFRIGERIO (RN-37, RN-39)
    if (
      configHorario.tieneRefrigerio &&
      configHorario.horaInicioRefrigerio &&
      configHorario.horaFinRefrigerio
    ) {
      const refrigInicio = this.normalizarHoraConfig(configHorario.horaInicioRefrigerio);
      const refrigFin = this.normalizarHoraConfig(configHorario.horaFinRefrigerio);

      if (horaInicioCita < refrigFin && horaFinCita > refrigInicio) {
        throw new BadRequestException('El horario seleccionado coincide con el receso de refrigerio (13:00 - 14:00)');
      }
    }

    // 5. VALIDACIÓN DE DISPONIBILIDAD DEL PSICÓLOGO (RN-12)
    const disponibilidad = await this.prisma.disponibilidadPsicologo.findFirst({
      where: {
        psicologoId,
        diaSemana,
        estaActivo: true,
      },
    });

    if (!disponibilidad) {
      throw new BadRequestException('El psicólogo no tiene disponibilidad para ese día');
    }

    const dispInicio = this.normalizarHoraConfig(disponibilidad.horaInicio);
    const dispFin = this.normalizarHoraConfig(disponibilidad.horaFin);

    if (horaInicioCita < dispInicio || horaFinCita > dispFin) {
      throw new BadRequestException(
        `El psicólogo solo atiende de ${disponibilidad.horaInicio} a ${disponibilidad.horaFin}`,
      );
    }

    // 6. VALIDACIÓN DE CRUCE CON EL PSICÓLOGO (RN-11)
    const crucePsicologo = await this.prisma.cita.findFirst({
      where: {
        id: citaIdExcluir ? { not: citaIdExcluir } : undefined,
        psicologoId,
        estado: { notIn: [EstadoCita.CANCELADA, EstadoCita.REPROGRAMADA] },
        AND: [
          { fechaHoraInicio: { lt: fin } },
          { fechaHoraFin: { gt: inicio } },
        ],
      },
    });

    if (crucePsicologo) {
      throw new BadRequestException('El psicólogo ya tiene una cita en ese horario');
    }

    // 7. VALIDACIÓN DE CRUCE CON EL PACIENTE
    const crucePaciente = await this.prisma.cita.findFirst({
      where: {
        id: citaIdExcluir ? { not: citaIdExcluir } : undefined,
        pacienteId,
        estado: { notIn: [EstadoCita.CANCELADA, EstadoCita.REPROGRAMADA] },
        AND: [
          { fechaHoraInicio: { lt: fin } },
          { fechaHoraFin: { gt: inicio } },
        ],
      },
    });

    if (crucePaciente) {
      throw new BadRequestException('El paciente ya tiene una cita en ese horario');
    }
  }
}
