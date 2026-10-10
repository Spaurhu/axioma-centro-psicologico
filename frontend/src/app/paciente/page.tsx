'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Calendar, PackageCheck, LogOut, Plus, CheckCircle2, ArrowLeft } from 'lucide-react';
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
  const [mostrarModalCita, setMostrarModalCita] = useState(false);

  const hoyStr = new Date().toISOString().split('T')[0];

  const [formCita, setFormCita] = useState({
    psicologoId: '',
    fecha: hoyStr,
    horarioIndex: '0',
    motivoConsulta: '',
  });

  useEffect(() => {
    const usuarioGuardado = localStorage.getItem('axioma_usuario');
    if (!usuarioGuardado) {
      router.push('/login');
      return;
    }
    const u = JSON.parse(usuarioGuardado);
    setUsuario(u);
    cargarDatosPaciente(u);
  }, []);

  const cargarDatosPaciente = async (u: any) => {
    setCargando(true);
    try {
      const [dataPsicos, dataCitas] = await Promise.all([
        apiFetch('/psicologos/publico'),
        apiFetch('/citas'),
      ]);
      setPsicologos(dataPsicos || []);
      setCitasExistentes(dataCitas || []);

      if (u.perfil?.id) {
        const info = await apiFetch(`/pacientes/${u.perfil.id}`);
        setPacienteInfo(info);
      }
    } catch (err) {
      console.error(err);
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
    const targetIsoPrefix = `${fecha}T${horaInicioStr}`;
    return citasExistentes.some((c) => {
      if (c.estado === 'CANCELADA' || c.estado === 'REPROGRAMADA') return false;
      if (c.psicologoId !== psicologoId) return false;
      return c.fechaHoraInicio.startsWith(targetIsoPrefix);
    });
  };

  const handleAgendar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pacienteInfo?.id) return;

    const bloques = generarHorariosDisponibles(formCita.fecha);
    const bloque = bloques[parseInt(formCita.horarioIndex)] || bloques[0];
    if (!bloque) {
      alert('La fecha seleccionada no tiene horarios de atención en la clínica (domingos descanso).');
      return;
    }

    const fechaHoraInicio = `${formCita.fecha}T${bloque.inicio}:00`;
    const fechaHoraFin = `${formCita.fecha}T${bloque.fin}:00`;

    if (new Date(fechaHoraInicio) < new Date()) {
      alert('No se puede agendar una cita en una fecha u hora pasada.');
      return;
    }

    if (esSlotOcupado(formCita.psicologoId, formCita.fecha, bloque.inicio)) {
      alert('El horario seleccionado ya se encuentra ocupado con ese psicólogo.');
      return;
    }

    try {
      await apiFetch('/citas', {
        method: 'POST',
        body: JSON.stringify({
          pacienteId: pacienteInfo.id,
          psicologoId: formCita.psicologoId,
          fechaHoraInicio,
          fechaHoraFin,
          motivoConsulta: formCita.motivoConsulta || 'Consulta terapéutica',
        }),
      });
      alert('✓ ¡Cita agendada con éxito en el sistema!');
      setMostrarModalCita(false);
      setFormCita({ psicologoId: '', fecha: hoyStr, horarioIndex: '0', motivoConsulta: '' });
      cargarDatosPaciente(usuario);
    } catch (err: any) {
      alert(err.message || 'Error al agendar cita');
    }
  };

  const paquetes: any[] = pacienteInfo?.paquetesPaciente ?? [];
  const citas: any[] = pacienteInfo?.citas ?? [];

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

            <button
              onClick={() => setMostrarModalCita(true)}
              className={`${btnOnDark} ${tamMd} self-start sm:self-auto`}
            >
              <Plus className="h-4 w-4" />
              <span>Reservar nueva cita</span>
            </button>
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
              {paquetes.map((p, idx) => (
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
                      </p>
                    </div>
                    <span
                      className={`${pastilla} ${p.estado === 'ACTIVO' ? 'bg-axioma-700 text-white' : 'bg-axioma-200 text-axioma-800'}`}
                    >
                      {p.estado}
                    </span>
                  </div>

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
              ))}
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

              <form onSubmit={handleAgendar} className="mt-6 space-y-4">
                <div>
                  <label htmlFor="psicologoId" className={label}>
                    Psicólogo especialista
                  </label>
                  <select
                    id="psicologoId"
                    required
                    value={formCita.psicologoId}
                    onChange={(e) => setFormCita({ ...formCita, psicologoId: e.target.value })}
                    className={input}
                  >
                    <option value="">Seleccione terapeuta...</option>
                    {psicologos.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.nombres} {p.apellidos} - {p.especialidad} (S/. {p.tarifaPorSesion})
                      </option>
                    ))}
                  </select>
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
                        const ocupado = esSlotOcupado(formCita.psicologoId, formCita.fecha, h.inicio);
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
                  <label htmlFor="motivo" className={label}>
                    Motivo de consulta (opcional)
                  </label>
                  <input
                    id="motivo"
                    type="text"
                    placeholder="Ej. Manejo de estrés, ansiedad o temas personales"
                    value={formCita.motivoConsulta}
                    onChange={(e) => setFormCita({ ...formCita, motivoConsulta: e.target.value })}
                    className={input}
                  />
                </div>

                <div className="flex flex-col-reverse gap-3 border-t border-axioma-100 pt-5 sm:flex-row sm:justify-end">
                  <button type="button" onClick={() => setMostrarModalCita(false)} className={`${btnSecondary} ${tamMd}`}>
                    Cancelar
                  </button>
                  <button type="submit" className={`${btnPrimary} ${tamMd}`}>
                    Confirmar reserva
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
