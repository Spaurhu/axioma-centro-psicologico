'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { toast } from 'sonner';
import { Calendar, PackageCheck, Video, LogOut, Plus, CheckCircle2, ArrowLeft, AlertCircle } from 'lucide-react';
import { apiFetch } from '@/lib/api';
import { LogoAxioma } from '@/components/logo-axioma';
import {
  contenedor, btnPrimary, btnSecondary, btnOnDark, btnGhost, tamSm, tamMd,
  card, label, input, modalOverlay, modalWrap, modalCard,
  thClase, tdClase, pastilla, claseEstadoCita, fechaCorta, horaCorta, fechaYmdLocal, horaHmLocal,
} from '@/lib/ui';

// Superficies de las cards de paquetes
const fondosPaquete = [
  'bg-axioma-100 border-axioma-200',
  'bg-heather border-white/60',
  'bg-white border-axioma-200/70',
];

const MOTIVOS_CONSULTA = [
  { valor: 'Ansiedad y manejo de estrés', especialidadSugerida: 'Psicoterapia Cognitivo-Conductual' },
  { valor: 'Depresión y estado de ánimo', especialidadSugerida: 'Psicoterapia Cognitivo-Conductual' },
  { valor: 'Terapia de Pareja', especialidadSugerida: 'Terapia Familiar y de Pareja' },
  { valor: 'Terapia Infantil y Adolescente', especialidadSugerida: 'Terapia Infantil y Adolescente' },
  { valor: 'Dinámica y conflictos familiares', especialidadSugerida: 'Terapia Sistémica' },
  { valor: 'Evaluación Psicológica integral', especialidadSugerida: 'Evaluación Psicológica' },
  { valor: 'Orientación y bienestar emocional', especialidadSugerida: 'Psicología Clínica General' },
];

// Generar bloques de horario de consulta
const generarHorariosDisponibles = (fechaStr: string) => {
  if (!fechaStr) return [];
  const fecha = new Date(fechaStr + 'T00:00:00');
  const dia = fecha.getDay(); // 0 = Domingo, 6 = Sábado
  if (dia === 0) return []; // Domingos descanso

  const horarios: { inicio: string; fin: string; etiqueta: string }[] = [];
  const horaInicio = 9;
  const horaFin = dia === 6 ? 13 : 18; // Sábados hasta 1pm, Lun-Vie hasta 6pm

  for (let h = horaInicio; h < horaFin; h++) {
    // Omitir receso de refrigerio L-V (13:00 a 14:00)
    if (dia !== 6 && h === 13) continue;

    const hStr = h.toString().padStart(2, '0');
    horarios.push({
      inicio: `${hStr}:00`,
      fin: `${hStr}:50`,
      etiqueta: `${h % 12 === 0 ? 12 : h % 12}:00 ${h < 12 ? 'AM' : 'PM'} - ${h % 12 === 0 ? 12 : h % 12}:50 ${h < 12 ? 'AM' : 'PM'}`
    });
  }
  return horarios;
};

export default function PortalPaciente() {
  const router = useRouter();
  const [usuario, setUsuario] = useState<any>(null);
  const [pacienteInfo, setPacienteInfo] = useState<any>(null);
  const [psicologos, setPsicologos] = useState<any[]>([]);
  const [citasExistentes, setCitasExistentes] = useState<any[]>([]);
  const [cargando, setCargando] = useState(true);
  const [errorAcceso, setErrorAcceso] = useState<string | null>(null);
  const [mostrarModalCita, setMostrarModalCita] = useState(false);
  const [procesando, setProcesando] = useState(false);

  const hoyStr = new Date().toISOString().split('T')[0];

  const [formCita, setFormCita] = useState({
    psicologoId: '',
    fecha: hoyStr,
    horarioIndex: '0',
    motivoConsulta: MOTIVOS_CONSULTA[0].valor,
    modalidad: 'PRESENCIAL' as 'PRESENCIAL' | 'VIRTUAL',
  });

  useEffect(() => {
    const usuarioGuardado = localStorage.getItem('axioma_usuario');
    if (!usuarioGuardado) {
      router.push('/login');
      return;
    }
    const u = JSON.parse(usuarioGuardado);
    if (u.rol !== 'PACIENTE') {
      if (u.rol === 'ADMINISTRADOR') router.push('/panel');
      else if (u.rol === 'PSICOLOGO') router.push('/psicologo');
      else if (u.rol === 'RECEPCIONISTA') router.push('/recepcion');
      else router.push('/login');
      return;
    }
    setUsuario(u);
    cargarDatosPaciente(u);
  }, []);

  const cargarDatosPaciente = async (u: any) => {
    setCargando(true);
    setErrorAcceso(null);
    try {
      const promesas: Promise<any>[] = [
        apiFetch('/psicologos/publico'),
        apiFetch('/citas'),
      ];

      if (u.perfil?.id) {
        promesas.push(apiFetch(`/paquetes/paciente/${u.perfil.id}`).catch(() => []));
      }

      const [dataPsicos, dataCitas, dataPaquetes] = await Promise.all(promesas);
      setPsicologos(dataPsicos || []);
      setCitasExistentes(dataCitas || []);

      setPacienteInfo({
        ...(u.perfil || {}),
        correo: u.correo,
        paquetesPaciente: dataPaquetes || [],
        citas: dataCitas || [],
      });
    } catch (err: any) {
      console.error('Error cargando portal paciente:', err);
      if (err.status === 403 || err.message?.includes('denegado')) {
        setErrorAcceso('Algunos datos clínicos requieren permisos específicos. Mostrando la información disponible.');
      } else {
        setErrorAcceso('No se pudieron sincronizar todos los datos.');
      }
    } finally {
      setCargando(false);
    }
  };

  const cerrarSesion = () => {
    localStorage.removeItem('axioma_token');
    localStorage.removeItem('axioma_usuario');
    router.push('/');
  };

  // Helper: Comprobar si un slot está ocupado por el psicólogo en esa fecha
  const esSlotOcupado = (psicologoId: string, fecha: string, horaInicioStr: string) => {
    if (!psicologoId || !fecha || !horaInicioStr) return false;
    return citasExistentes.some((c) => {
      if (c.estado === 'CANCELADA' || c.estado === 'REPROGRAMADA') return false;
      if (c.psicologoId !== psicologoId) return false;
      const cFechaLocal = fechaYmdLocal(c.fechaHoraInicio);
      const cHoraLocal = horaHmLocal(c.fechaHoraInicio);
      return cFechaLocal === fecha && cHoraLocal === horaInicioStr;
    });
  };

  const handleAgendar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pacienteInfo?.id || procesando) return;

    const bloques = generarHorariosDisponibles(formCita.fecha);
    const bloque = bloques[parseInt(formCita.horarioIndex)] || bloques[0];
    if (!bloque) {
      toast.warning('La fecha seleccionada no tiene horarios de atención en la clínica (domingos descanso).');
      return;
    }

    const fechaHoraInicio = `${formCita.fecha}T${bloque.inicio}:00`;
    const fechaHoraFin = `${formCita.fecha}T${bloque.fin}:00`;

    if (new Date(fechaHoraInicio) < new Date()) {
      toast.warning('No se puede agendar una cita en una fecha u hora pasada.');
      return;
    }

    const psicologoFinalId = psicologoVinculadoId || formCita.psicologoId;

    if (esSlotOcupado(psicologoFinalId, formCita.fecha, bloque.inicio)) {
      toast.warning('El horario seleccionado ya se encuentra ocupado con ese psicólogo.');
      return;
    }

    setProcesando(true);
    try {
      await apiFetch('/citas', {
        method: 'POST',
        body: JSON.stringify({
          pacienteId: pacienteInfo.id,
          psicologoId: psicologoFinalId,
          fechaHoraInicio,
          fechaHoraFin,
          motivoConsulta: formCita.motivoConsulta || 'Consulta terapéutica',
          tipoCita: tienePaqueteActivo ? 'TERAPIA' : 'EVALUACION',
          modalidad: formCita.modalidad,
        }),
      });
      toast.success('¡Cita agendada con éxito en el sistema!');
      setMostrarModalCita(false);
      setFormCita({
        psicologoId: '',
        fecha: hoyStr,
        horarioIndex: '0',
        motivoConsulta: MOTIVOS_CONSULTA[0].valor,
        modalidad: 'PRESENCIAL',
      });
      cargarDatosPaciente(usuario);
    } catch (err: any) {
      toast.error(err.message || 'Error al agendar cita');
    } finally {
      setProcesando(false);
    }
  };

  const paquetes: any[] = pacienteInfo?.paquetesPaciente ?? [];
  const citas: any[] = pacienteInfo?.citas ?? [];

  const paqueteActivo = paquetes.find(
    (p) =>
      p.estado === 'ACTIVO' &&
      p.sesionesRestantes > 0 &&
      (!p.fechaExpiracion || new Date(p.fechaExpiracion) >= new Date()),
  );
  const tienePaqueteActivo = Boolean(paqueteActivo);
  const psicologoVinculadoId = paqueteActivo?.psicologoId || '';

  return (
    <div className="min-h-screen bg-axioma-50 font-sans text-axiomaText-ink antialiased selection:bg-axioma-200">

      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-axioma-200/80 bg-axioma-50/90 backdrop-blur-md">
        <div className={`${contenedor} flex items-center justify-between py-3.5`}>
          <div className="flex items-center gap-4">
            <LogoAxioma subtitulo="Portal del paciente" />
            <Link href="/" className={`${btnGhost} ${tamSm} hidden sm:inline-flex`}>
              <ArrowLeft className="h-4 w-4" />
              <span>Volver al inicio</span>
            </Link>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden text-right sm:block">
              <span className="block text-sm font-semibold text-axiomaText-ink">
                {pacienteInfo?.nombres || usuario?.correo}
              </span>
              <span className="text-xs text-axiomaText-soft">Paciente activo</span>
            </div>
            <button onClick={cerrarSesion} className={`${btnSecondary} ${tamSm}`}>
              <LogOut className="h-4 w-4" />
              <span>Cerrar sesión</span>
            </button>
          </div>
        </div>
      </header>

      <main className={`${contenedor} animate-fade-in space-y-10 py-8 motion-reduce:animate-none lg:py-10`}>
        {errorAcceso && (
          <div className="flex items-center gap-3 rounded-card border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
            <AlertCircle className="h-5 w-5 shrink-0 text-amber-600" />
            <span>{errorAcceso}</span>
          </div>
        )}

        {/* Bienvenida y acción principal */}
        <section className="rounded-card bg-axioma-900 p-6 text-white shadow-panel sm:p-8">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="font-display text-3xl font-medium tracking-heading sm:text-4xl">
                Hola, {pacienteInfo?.nombres || 'Paciente'}
              </h1>
              <p className="mt-2 max-w-xl text-sm leading-relaxed text-axioma-100">
                Control de sesiones, paquete terapéutico y citas agendadas
              </p>
              {pacienteInfo?.dni && (
                <p className="mt-1 text-xs tabular-nums text-axioma-200">DNI: {pacienteInfo.dni}</p>
              )}
            </div>

            <div className="flex flex-col items-start sm:items-end gap-1.5">
              <button
                onClick={() => {
                  if (usuario?.rol !== 'PACIENTE') {
                    toast.error('Solo pacientes pueden agendar consultas desde este portal.');
                    return;
                  }
                  setFormCita((prev) => ({
                    ...prev,
                    psicologoId: paqueteActivo?.psicologoId || prev.psicologoId,
                    modalidad: 'PRESENCIAL',
                  }));
                  setMostrarModalCita(true);
                }}
                disabled={usuario?.rol !== 'PACIENTE'}
                title="Reservar nueva cita"
                className={`${btnOnDark} ${tamMd} self-start sm:self-auto disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                <Plus className="h-4 w-4" />
                <span>Reservar nueva cita</span>
              </button>
              {!tienePaqueteActivo && (
                <span className="text-xs text-amber-200 font-medium">
                  {paquetes.some((p) => p.estado === 'VENCIDO' || (p.fechaExpiracion && new Date(p.fechaExpiracion) < new Date()))
                    ? 'Tu paquete ha expirado. Comunícate con recepción para renovar.'
                    : 'Disponible para agendar tu sesión de EVALUACIÓN inicial'}
                </span>
              )}
            </div>
          </div>
        </section>

        {/* Sección: Mis Paquetes de Sesiones */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-xl font-medium tracking-heading text-axiomaText-ink sm:text-2xl">
              Mis paquetes terapéuticos
            </h2>
            <span className="text-xs font-semibold text-axioma-700">
              {paquetes.filter((p) => p.estado === 'ACTIVO').length} activo(s)
            </span>
          </div>

          {paquetes.length === 0 ? (
            <div className={`${card} p-8 text-center text-axiomaText-soft`}>
              No cuentas con paquetes de sesiones activos actualmente.
            </div>
          ) : (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {paquetes.map((p, idx) => {
                const esVencido =
                  p.estado === 'VENCIDO' ||
                  (p.estado === 'ACTIVO' && p.fechaExpiracion && new Date(p.fechaExpiracion) < new Date());

                return (
                  <div
                    key={p.id}
                    className={`rounded-card border p-6 shadow-card transition-shadow hover:shadow-cardHover ${fondosPaquete[idx % fondosPaquete.length]}`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h3 className="font-display text-lg font-medium tracking-heading text-axiomaText-ink">
                          {p.paquete?.nombre || 'Paquete Terapéutico'}
                        </h3>
                        <p className="mt-0.5 text-xs text-axiomaText-soft">
                          Comprado el {fechaCorta(p.fechaCompra)}
                          {p.fechaExpiracion && ` • Vence el ${fechaCorta(p.fechaExpiracion)}`}
                        </p>
                      </div>
                      <span
                        className={`${pastilla} ${
                          esVencido
                            ? 'bg-rose-100 text-rose-800 border border-rose-300 font-semibold'
                            : p.estado === 'ACTIVO'
                            ? 'bg-axioma-700 text-white'
                            : p.estado === 'PENDIENTE_PAGO'
                            ? 'bg-amber-100 text-amber-900 border border-amber-300 font-semibold'
                            : 'bg-axioma-200 text-axioma-800'
                        }`}
                      >
                        {esVencido ? 'VENCIDO' : p.estado === 'PENDIENTE_PAGO' ? 'PENDIENTE DE PAGO' : p.estado}
                      </span>
                    </div>

                    {esVencido && (
                      <div className="mt-4 flex items-start gap-2.5 rounded-xl bg-rose-50 p-3 ring-1 ring-rose-200 text-xs text-rose-900">
                        <AlertCircle className="h-4 w-4 shrink-0 text-rose-600 mt-0.5" />
                        <div>
                          <p className="font-semibold text-rose-950">Paquete Expirado</p>
                          <p className="mt-0.5 text-rose-800">
                            La vigencia de este paquete ha vencido. Por favor, adquiera o renueve un paquete para continuar sus sesiones.
                          </p>
                        </div>
                      </div>
                    )}

                    {p.estado === 'PENDIENTE_PAGO' && (
                      <div className="mt-4 flex items-start gap-2.5 rounded-xl bg-amber-50 p-3 ring-1 ring-amber-300 text-xs text-amber-900">
                        <AlertCircle className="h-4 w-4 shrink-0 text-amber-600 mt-0.5" />
                        <div>
                          <p className="font-semibold text-amber-950">Confirmación de Pago Requerida</p>
                          <p className="mt-0.5 text-amber-800">Tu paquete está pendiente de confirmación de pago. Por favor, acércate a recepción.</p>
                        </div>
                      </div>
                    )}

                  <div className="mt-6 flex items-baseline justify-between">
                    <div>
                      <span className="font-display text-4xl font-medium tracking-heading text-axiomaText-ink">
                        {p.sesionesRestantes}
                      </span>
                      <span className="ml-1 text-sm text-axiomaText-soft">
                        / {p.sesionesTotales} restantes
                      </span>
                    </div>
                    <span className="text-xs tabular-nums text-axiomaText-soft">
                      {p.sesionesConsumidas} consumidas
                    </span>
                  </div>

                  {/* Barra de progreso */}
                  <div className="mt-4 h-2 w-full overflow-hidden rounded-full bg-axioma-900/10">
                    <div
                      className="h-full rounded-full bg-axioma-700 transition-all duration-300"
                      style={{
                        width: `${Math.round((p.sesionesConsumidas / p.sesionesTotales) * 100)}%`,
                      }}
                    />
                  </div>
                </div>
              );
            })}
            </div>
          )}
        </section>

        {/* Sección: Mis Citas Programadas e Historial */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-xl font-medium tracking-heading text-axiomaText-ink sm:text-2xl">
              Historial y próximas consultas
            </h2>
            <span className="text-xs text-axiomaText-soft">{citas.length} registradas</span>
          </div>

          <div className={`${card} overflow-hidden`}>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[680px] text-left text-sm text-axiomaText-soft">
                <thead className="border-b border-axioma-100 bg-axioma-50">
                  <tr>
                    <th className={thClase}>Fecha y hora</th>
                    <th className={thClase}>Terapeuta</th>
                    <th className={thClase}>Especialidad</th>
                    <th className={thClase}>Motivo</th>
                    <th className={`${thClase} text-right`}>Estado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-axioma-100">
                  {citas.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-12 text-center text-axiomaText-soft">
                        {cargando ? 'Cargando información...' : 'No tienes citas registradas en tu historial.'}
                      </td>
                    </tr>
                  ) : (
                    citas.map((c) => (
                      <tr key={c.id} className="transition-colors hover:bg-axioma-50">
                        <td className={tdClase}>
                          <p className="font-medium text-axiomaText-ink">{fechaCorta(c.fechaHoraInicio)}</p>
                          <span className="text-xs tabular-nums text-axiomaText-soft">
                            {horaCorta(c.fechaHoraInicio)} - {horaCorta(c.fechaHoraFin)}
                          </span>
                        </td>
                        <td className={`${tdClase} font-semibold text-axiomaText-ink`}>
                          {c.psicologo?.nombres} {c.psicologo?.apellidos}
                        </td>
                        <td className={tdClase}>
                          {c.psicologo?.especialidad || 'Psicología Clínica'}
                        </td>
                        <td className={tdClase}>
                          <span className="line-clamp-1">{c.motivoConsulta || 'Consulta general'}</span>
                        </td>
                        <td className={`${tdClase} text-right`}>
                          <span className={`${pastilla} ${claseEstadoCita(c.estado)}`}>
                            {c.estado}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      </main>

      {/* Modal: Reservar Cita en Bloques Predefinidos Clínicos */}
      {mostrarModalCita && (
        <div className={modalOverlay}>
          <div className={modalWrap}>
            <div className={`${modalCard} max-w-lg`} role="dialog" aria-modal="true" aria-labelledby="titulo-modal">
              <h3 id="titulo-modal" className="font-display text-2xl font-medium tracking-heading text-axiomaText-ink">
                Reservar consulta psicológica
              </h3>
              <p className="mt-1 text-sm leading-relaxed text-axiomaText-soft">
                Horario de atención: Lun-Vie (9am a 6pm) y Sáb (9am a 1pm). Sesiones de 50 minutos.
              </p>

              {paqueteActivo ? (
                <div className="mt-3 rounded-card-sm border border-emerald-300 bg-emerald-50 p-3 text-xs font-medium leading-relaxed text-emerald-900">
                  🎟️ Tienes un paquete activo: {paqueteActivo.paquete?.nombre || 'Paquete terapéutico'} - {paqueteActivo.sesionesRestantes} sesiones restantes. Al agendar esta cita, se consumirá 1 sesión al momento de la atención.
                </div>
              ) : (
                <div className="mt-3 rounded-card-sm border border-amber-300 bg-amber-50 p-3 text-xs font-medium leading-relaxed text-amber-900">
                  📋 Esta será tu sesión de EVALUACIÓN inicial. El costo es de S/ 80 y se paga en recepción. El psicólogo definirá tu plan de tratamiento.
                </div>
              )}

              <form onSubmit={handleAgendar} className="mt-5 space-y-4">
                <div>
                  <label htmlFor="motivo" className={label}>
                    1. ¿Cuál es tu motivo principal de consulta?
                  </label>
                  <select
                    id="motivo"
                    required
                    value={formCita.motivoConsulta}
                    onChange={(e) => {
                      const nuevoMotivo = e.target.value;
                      const configMotivo = MOTIVOS_CONSULTA.find((m) => m.valor === nuevoMotivo);
                      const psicologoSugerido = configMotivo
                        ? psicologos.find((p) =>
                            p.especialidad?.toLowerCase().includes(configMotivo.especialidadSugerida.toLowerCase())
                          )
                        : null;
                      setFormCita({
                        ...formCita,
                        motivoConsulta: nuevoMotivo,
                        psicologoId: psicologoVinculadoId
                          ? psicologoVinculadoId
                          : psicologoSugerido
                            ? psicologoSugerido.id
                            : formCita.psicologoId,
                      });
                    }}
                    className={input}
                  >
                    {MOTIVOS_CONSULTA.map((m) => (
                      <option key={m.valor} value={m.valor}>
                        {m.valor}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="psicologoId" className={label}>
                    2. Psicólogo especialista
                  </label>
                  <select
                    id="psicologoId"
                    required
                    disabled={Boolean(psicologoVinculadoId)}
                    value={psicologoVinculadoId || formCita.psicologoId}
                    onChange={(e) => setFormCita({ ...formCita, psicologoId: e.target.value })}
                    className={`${input} ${psicologoVinculadoId ? 'bg-axioma-50 cursor-not-allowed opacity-90' : ''}`}
                  >
                    <option value="">Seleccione terapeuta...</option>
                    {psicologos.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.nombres} {p.apellidos} - {p.especialidad} (S/. {p.tarifaPorSesion})
                      </option>
                    ))}
                  </select>

                  {psicologoVinculadoId && (
                    <p className="mt-1.5 text-xs font-medium text-emerald-700">
                      Tu paquete está vinculado a este terapeuta. Para cambiar, contacta a recepción
                    </p>
                  )}
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label htmlFor="fechaCita" className={label}>Fecha</label>
                    <input
                      id="fechaCita"
                      type="date"
                      required
                      min={hoyStr}
                      value={formCita.fecha}
                      onChange={(e) => setFormCita({ ...formCita, fecha: e.target.value, horarioIndex: '0' })}
                      className={input}
                    />
                  </div>
                  <div>
                    <label htmlFor="horarioSelect" className={label}>Horario (50 min)</label>
                    <select
                      id="horarioSelect"
                      value={formCita.horarioIndex}
                      onChange={(e) => setFormCita({ ...formCita, horarioIndex: e.target.value })}
                      className={input}
                    >
                      {generarHorariosDisponibles(formCita.fecha).map((h, i) => {
                        const ocupado = esSlotOcupado(psicologoVinculadoId || formCita.psicologoId, formCita.fecha, h.inicio);
                        return (
                          <option key={i} value={i} disabled={ocupado}>
                            {h.etiqueta} {ocupado ? '— [OCUPADO]' : ''}
                          </option>
                        );
                      })}
                    </select>
                  </div>
                </div>

                <div>
                  <span className={label}>3. Modalidad de atención</span>
                  <div className="mt-1.5 grid grid-cols-2 gap-3">
                    <label
                      className={`flex cursor-pointer items-center justify-center gap-2 rounded-xl border px-3 py-2.5 text-sm font-semibold transition-all ${
                        formCita.modalidad === 'PRESENCIAL'
                          ? 'border-axioma-600 bg-axioma-50 text-axioma-800 ring-1 ring-axioma-600'
                          : 'border-axioma-200 bg-white text-axioma-600 hover:bg-axioma-50'
                      }`}
                    >
                      <input
                        type="radio"
                        name="modalidadCitaPaciente"
                        value="PRESENCIAL"
                        checked={formCita.modalidad === 'PRESENCIAL'}
                        onChange={() => setFormCita({ ...formCita, modalidad: 'PRESENCIAL' })}
                        className="sr-only"
                      />
                      🏢 Presencial
                    </label>
                    <label
                      className={`flex cursor-pointer items-center justify-center gap-2 rounded-xl border px-3 py-2.5 text-sm font-semibold transition-all ${
                        formCita.modalidad === 'VIRTUAL'
                          ? 'border-indigo-600 bg-indigo-50 text-indigo-800 ring-1 ring-indigo-600'
                          : 'border-axioma-200 bg-white text-axioma-600 hover:bg-axioma-50'
                      }`}
                    >
                      <input
                        type="radio"
                        name="modalidadCitaPaciente"
                        value="VIRTUAL"
                        checked={formCita.modalidad === 'VIRTUAL'}
                        onChange={() => setFormCita({ ...formCita, modalidad: 'VIRTUAL' })}
                        className="sr-only"
                      />
                      📹 Virtual (Google Meet)
                    </label>
                  </div>
                </div>

                <div className="flex flex-col-reverse gap-3 border-t border-axioma-100 pt-5 sm:flex-row sm:justify-end">
                  <button
                    type="button"
                    disabled={procesando}
                    onClick={() => setMostrarModalCita(false)}
                    className={`${btnSecondary} ${tamMd} disabled:opacity-50 disabled:cursor-not-allowed`}
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={procesando}
                    className={`${btnPrimary} ${tamMd} disabled:opacity-50 disabled:cursor-not-allowed`}
                  >
                    {procesando ? 'Procesando...' : 'Confirmar reserva'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
