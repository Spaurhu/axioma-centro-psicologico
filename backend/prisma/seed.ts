import { PrismaClient, Rol, DiaSemana, EstadoPaquete, TipoMovimientoSesion, EstadoCita, TipoCita, NivelRiesgo } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Sembrando datos maestros para Axioma - Centro Psicológico...\n');

  // =========================================================================
  // 1. USUARIOS DEL SISTEMA (ADMINISTRADOR, PSICÓLOGO, PACIENTE Y RECEPCIÓN)
  // =========================================================================
  const passwordAdmin = await bcrypt.hash('admin123', 10);
  const passwordPsico = await bcrypt.hash('psico123', 10);
  const passwordCliente = await bcrypt.hash('cliente123', 10);
  const passwordRecepcion = await bcrypt.hash('recepcion123', 10);

  // 1.1 Administrador (Existente)
  const admin = await prisma.usuario.upsert({
    where: { correo: 'admin@axioma.pe' },
    update: { contrasenaHash: passwordAdmin, estaActivo: true, rol: Rol.ADMINISTRADOR },
    create: {
      correo: 'admin@axioma.pe',
      contrasenaHash: passwordAdmin,
      rol: Rol.ADMINISTRADOR,
      estaActivo: true,
    },
  });
  console.log('✓ Usuario Admin listo: admin@axioma.pe');

  // 1.2 Psicólogo (Existente)
  const userPsico = await prisma.usuario.upsert({
    where: { correo: 'psicologo@axioma.pe' },
    update: { contrasenaHash: passwordPsico, estaActivo: true, rol: Rol.PSICOLOGO },
    create: {
      correo: 'psicologo@axioma.pe',
      contrasenaHash: passwordPsico,
      rol: Rol.PSICOLOGO,
      estaActivo: true,
    },
  });

  const psicologo = await prisma.psicologo.upsert({
    where: { dni: '44556677' },
    update: { usuarioId: userPsico.id, estaActivo: true },
    create: {
      usuarioId: userPsico.id,
      dni: '44556677',
      nombres: 'Diana Elizabeth',
      apellidos: 'Valdez Mendoza',
      telefono: '987654321',
      numeroColegiatura: 'C.Ps.P. 28419',
      especialidad: 'Terapia Cognitivo-Conductual y Ansiedad',
      tarifaPorSesion: 80.0,
      biografia: 'Especialista en trastornos del estado de ánimo, manejo del estrés y terapia para adultos.',
    },
  });
  console.log('✓ Usuario Psicólogo listo: psicologo@axioma.pe');

  // Disponibilidad laboral de la psicóloga (L-V 09:00-18:00, Sáb 09:00-13:00, Domingo no atiende)
  const disponibilidadesPsico = [
    { diaSemana: DiaSemana.LUNES, horaInicio: '09:00', horaFin: '18:00' },
    { diaSemana: DiaSemana.MARTES, horaInicio: '09:00', horaFin: '18:00' },
    { diaSemana: DiaSemana.MIERCOLES, horaInicio: '09:00', horaFin: '18:00' },
    { diaSemana: DiaSemana.JUEVES, horaInicio: '09:00', horaFin: '18:00' },
    { diaSemana: DiaSemana.VIERNES, horaInicio: '09:00', horaFin: '18:00' },
    { diaSemana: DiaSemana.SABADO, horaInicio: '09:00', horaFin: '13:00' },
  ];

  for (const disp of disponibilidadesPsico) {
    const existente = await prisma.disponibilidadPsicologo.findFirst({
      where: {
        psicologoId: psicologo.id,
        diaSemana: disp.diaSemana,
      },
    });

    if (existente) {
      await prisma.disponibilidadPsicologo.update({
        where: { id: existente.id },
        data: {
          horaInicio: disp.horaInicio,
          horaFin: disp.horaFin,
          estaActivo: true,
        },
      });
    } else {
      await prisma.disponibilidadPsicologo.create({
        data: {
          psicologoId: psicologo.id,
          diaSemana: disp.diaSemana,
          horaInicio: disp.horaInicio,
          horaFin: disp.horaFin,
          estaActivo: true,
        },
      });
    }
  }

  const conteoDisponibilidad = await prisma.disponibilidadPsicologo.count({
    where: { psicologoId: psicologo.id },
  });
  console.log(`✓ Disponibilidad de psicóloga registrada: ${conteoDisponibilidad} registros (L-V 09:00-18:00, Sáb 09:00-13:00)`);

  // 1.3 Paciente (Existente)
  const userCliente = await prisma.usuario.upsert({
    where: { correo: 'cliente@axioma.pe' },
    update: { contrasenaHash: passwordCliente, estaActivo: true, rol: Rol.PACIENTE },
    create: {
      correo: 'cliente@axioma.pe',
      contrasenaHash: passwordCliente,
      rol: Rol.PACIENTE,
      estaActivo: true,
    },
  });

  const paciente = await prisma.paciente.upsert({
    where: { dni: '72345678' },
    update: { usuarioId: userCliente.id, estaActivo: true },
    create: {
      usuarioId: userCliente.id,
      dni: '72345678',
      nombres: 'Carlos Alberto',
      apellidos: 'Ramírez Soto',
      telefono: '912345678',
      correo: 'cliente@axioma.pe',
      fechaNacimiento: new Date('1998-05-15'),
      genero: 'Masculino',
      direccion: 'Av. Arequipa 2450, Lince',
    },
  });
  console.log('✓ Usuario Paciente listo: cliente@axioma.pe');

  // Paquete para paciente de prueba con vigencia de 90 días (RN-07)
  const paqueteEsencial = await prisma.paquete.findFirst({
    where: { cantidadSesiones: 4 },
  });

  let paquetePacienteId: string | undefined;

  if (paqueteEsencial) {
    const paqueteExistente = await prisma.paquetePaciente.findFirst({
      where: { pacienteId: paciente.id, estado: EstadoPaquete.ACTIVO },
    });

    if (!paqueteExistente) {
      const nuevoPaquete = await prisma.paquetePaciente.create({
        data: {
          pacienteId: paciente.id,
          paqueteId: paqueteEsencial.id,
          sesionesTotales: 4,
          sesionesConsumidas: 2,
          sesionesRestantes: 2,
          estado: EstadoPaquete.ACTIVO,
          fechaCompra: new Date(Date.now() - 14 * 24 * 3600 * 1000), // Comprado hace 14 días
          fechaExpiracion: new Date(Date.now() + 76 * 24 * 3600 * 1000), // 90 días de vigencia
        },
      });
      paquetePacienteId = nuevoPaquete.id;
      console.log('✓ Paquete de 4 sesiones asignado a cliente@axioma.pe (2 consumidas, 2 restantes)');
    } else {
      await prisma.paquetePaciente.update({
        where: { id: paqueteExistente.id },
        data: {
          sesionesTotales: 4,
          sesionesConsumidas: 2,
          sesionesRestantes: 2,
          estado: EstadoPaquete.ACTIVO,
        },
      });
      paquetePacienteId = paqueteExistente.id;
      console.log('✓ Paquete actualizado a 2 consumidas y 2 restantes para cliente@axioma.pe');
    }

    // Registrar MovimientoSesion de tipo COMPRA si no existe
    if (paquetePacienteId) {
      const movimientoExistente = await prisma.movimientoSesion.findFirst({
        where: {
          paquetePacienteId,
          tipo: TipoMovimientoSesion.COMPRA,
        },
      });

      if (!movimientoExistente) {
        await prisma.movimientoSesion.create({
          data: {
            paquetePacienteId,
            tipo: TipoMovimientoSesion.COMPRA,
            cantidad: 4,
            motivo: 'Compra de paquete de 4 sesiones (seed)',
            fecha: new Date(Date.now() - 14 * 24 * 3600 * 1000),
          },
        });
        console.log('✓ Movimiento COMPRA (+4) registrado para el paquete de cliente@axioma.pe');
      }

      // =========================================================================
      // CITAS PASADAS ATENDIDAS Y MOVIMIENTOS DE CONSUMO (Demostración de Kardex)
      // =========================================================================
      let citasAtendidas = await prisma.cita.findMany({
        where: { pacienteId: paciente.id, estado: EstadoCita.ATENDIDA },
        orderBy: { fechaHoraInicio: 'desc' },
      });

      // Si faltan citas pasadas atendidas, creamos hasta tener al menos 2
      if (citasAtendidas.length < 2) {
        const haceSieteDias = new Date();
        haceSieteDias.setDate(haceSieteDias.getDate() - 7);
        haceSieteDias.setHours(10, 0, 0, 0);
        const haceSieteDiasFin = new Date(haceSieteDias);
        haceSieteDiasFin.setMinutes(50);

        const nueva = await prisma.cita.create({
          data: {
            pacienteId: paciente.id,
            psicologoId: psicologo.id,
            paquetePacienteId,
            tipoCita: TipoCita.TERAPIA,
            fechaHoraInicio: haceSieteDias,
            fechaHoraFin: haceSieteDiasFin,
            estado: EstadoCita.ATENDIDA,
            motivoConsulta: 'Sesión de psicoterapia - Ansiedad y manejo del estrés',
            probabilidadInasistencia: 0.10,
            nivelRiesgoInasistencia: NivelRiesgo.BAJO,
          },
        });
        citasAtendidas.push(nueva);
      }

      // Tomamos las 2 citas atendidas más recientes y garantizamos sus movimientos de CONSUMO y notas SOAP
      const citasDemostracion = citasAtendidas.slice(0, 2);
      for (let i = 0; i < citasDemostracion.length; i++) {
        const c = citasDemostracion[i];

        // 1. Movimiento de CONSUMO
        const movExistente = await prisma.movimientoSesion.findFirst({
          where: { citaId: c.id, tipo: TipoMovimientoSesion.CONSUMO },
        });

        if (!movExistente) {
          await prisma.movimientoSesion.create({
            data: {
              paquetePacienteId,
              citaId: c.id,
              tipo: TipoMovimientoSesion.CONSUMO,
              cantidad: -1,
              motivo: `Asistencia a sesión terapéutica #${i + 1} (seed)`,
              fecha: c.fechaHoraInicio,
            },
          });
        }

        // 2. Nota de Evolución Clínica SOAP
        const evolExistente = await prisma.evolucionClinica.findUnique({
          where: { citaId: c.id },
        });

        if (!evolExistente) {
          await prisma.evolucionClinica.create({
            data: {
              citaId: c.id,
              pacienteId: paciente.id,
              psicologoId: psicologo.id,
              fechaSesion: c.fechaHoraInicio,
              motivoConsulta: i === 0 ? 'Evaluación y encuadre psicoterapéutico' : 'Reestructuración cognitiva y respiración diafragmática',
              tecnicasUtilizadas: i === 0 ? 'Psicoeducación, formulación de caso y registro ABC' : 'Reestructuración cognitiva y respiración diafragmática guiada',
              observacionesConductuales: i === 0 ? 'Paciente orientado, colaborador y con buena disposición al diálogo.' : 'Paciente puntual, con menor tensión muscular observable.',
              notaEvolucion: i === 0
                ? 'S: Refiere haber experimentado episodios de angustia laboral. O: Lúcido, orientado en espacio y tiempo. A: Trastorno adaptativo con síntomas ansiosos leves. P: Se acuerda iniciar técnica de registro ABC.'
                : 'S: Reporta mejoría en la conciliación del sueño tras aplicar la respiración guiada. O: Afecto modulado, discurso coherente. A: Avance favorable en la reducción de síntomas ansiosos somáticos. P: Profundizar en cuestionamiento socrático.',
              tareasCasa: i === 0
                ? 'Completar autoregistro de pensamientos disfuncionales en situaciones de estrés laboral.'
                : 'Practicar 10 minutos diarios de respiración diafragmática antes de dormir.',
            },
          });
        }
      }

      console.log('✓ 2 Citas atendidas configuradas con movimientos de CONSUMO (-1 cada una) y notas clínicas SOAP');
    }
  }


  // 1.4 Usuario Recepcionista (NUEVO)
  const recepcionista = await prisma.usuario.upsert({
    where: { correo: 'recepcion@axioma.pe' },
    update: {
      contrasenaHash: passwordRecepcion,
      estaActivo: true,
      rol: Rol.RECEPCIONISTA,
    },
    create: {
      correo: 'recepcion@axioma.pe',
      contrasenaHash: passwordRecepcion,
      rol: Rol.RECEPCIONISTA,
      estaActivo: true,
    },
  });
  console.log('✓ Usuario Recepcionista listo: recepcion@axioma.pe / recepcion123');

  // =========================================================================
  // 2. CONFIGURACIÓN DE HORARIOS DEL CENTRO (RN-34, RN-35, RN-37)
  // =========================================================================
  console.log('\n📅 Configurando horarios del centro...');
  const horariosSemana = [
    { dia: DiaSemana.LUNES, inicio: '09:00', fin: '18:00', refrig: true, refrigInicio: '13:00', refrigFin: '14:00', activo: true },
    { dia: DiaSemana.MARTES, inicio: '09:00', fin: '18:00', refrig: true, refrigInicio: '13:00', refrigFin: '14:00', activo: true },
    { dia: DiaSemana.MIERCOLES, inicio: '09:00', fin: '18:00', refrig: true, refrigInicio: '13:00', refrigFin: '14:00', activo: true },
    { dia: DiaSemana.JUEVES, inicio: '09:00', fin: '18:00', refrig: true, refrigInicio: '13:00', refrigFin: '14:00', activo: true },
    { dia: DiaSemana.VIERNES, inicio: '09:00', fin: '18:00', refrig: true, refrigInicio: '13:00', refrigFin: '14:00', activo: true },
    { dia: DiaSemana.SABADO, inicio: '09:00', fin: '13:00', refrig: false, refrigInicio: null, refrigFin: null, activo: true },
    { dia: DiaSemana.DOMINGO, inicio: null, fin: null, refrig: false, refrigInicio: null, refrigFin: null, activo: false },
  ];

  for (const h of horariosSemana) {
    await prisma.configuracionHorario.upsert({
      where: { diaSemana: h.dia },
      update: {
        horaInicio: h.inicio,
        horaFin: h.fin,
        tieneRefrigerio: h.refrig,
        horaInicioRefrigerio: h.refrigInicio,
        horaFinRefrigerio: h.refrigFin,
        activo: h.activo,
      },
      create: {
        diaSemana: h.dia,
        horaInicio: h.inicio,
        horaFin: h.fin,
        tieneRefrigerio: h.refrig,
        horaInicioRefrigerio: h.refrigInicio,
        horaFinRefrigerio: h.refrigFin,
        activo: h.activo,
      },
    });
  }
  console.log('✓ Configuración de 7 días registrada con éxito.');

  // =========================================================================
  // 3. FERIADOS NACIONALES PERUANOS (2026) (RN-36, RN-40, RN-42)
  // =========================================================================
  console.log('\n🇵🇪 Registrando feriados nacionales (2026)...');
  const feriados2026 = [
    { fecha: '2026-01-01', descripcion: 'Año Nuevo' },
    { fecha: '2026-04-02', descripcion: 'Jueves Santo (Semana Santa)' },
    { fecha: '2026-04-03', descripcion: 'Viernes Santo (Semana Santa)' },
    { fecha: '2026-05-01', descripcion: 'Día del Trabajo' },
    { fecha: '2026-06-07', descripcion: 'Batalla de Arica y Día de la Bandera' },
    { fecha: '2026-06-29', descripcion: 'San Pedro y San Pablo' },
    { fecha: '2026-07-23', descripcion: 'Día de la Fuerza Aérea del Perú' },
    { fecha: '2026-07-28', descripcion: 'Fiestas Patrias - Independencia Nacional' },
    { fecha: '2026-07-29', descripcion: 'Fiestas Patrias - Gran Parada Militar' },
    { fecha: '2026-08-06', descripcion: 'Batalla de Junín' },
    { fecha: '2026-08-30', descripcion: 'Santa Rosa de Lima' },
    { fecha: '2026-10-08', descripcion: 'Combate de Angamos' },
    { fecha: '2026-11-01', descripcion: 'Día de Todos los Santos' },
    { fecha: '2026-12-08', descripcion: 'Inmaculada Concepción' },
    { fecha: '2026-12-09', descripcion: 'Batalla de Ayacucho' },
    { fecha: '2026-12-25', descripcion: 'Navidad' },
  ];

  for (const f of feriados2026) {
    // Zona horaria Lima (UTC-5): T05:00:00.000Z equivale a medianoche 00:00:00 en Lima
    const fechaDate = new Date(`${f.fecha}T05:00:00.000Z`);
    await prisma.feriado.upsert({
      where: { fecha: fechaDate },
      update: {
        descripcion: f.descripcion,
        activo: true,
      },
      create: {
        fecha: fechaDate,
        descripcion: f.descripcion,
        activo: true,
      },
    });
  }
  console.log(`✓ ${feriados2026.length} feriados nacionales registrados.`);

  console.log('\n✨ Seed de datos maestros completado con éxito.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
