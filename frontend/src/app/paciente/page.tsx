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
  thClase, tdClase, pastilla, claseEstadoCita, fechaCorta, horaCorta,
} from '@/lib/ui';

// Superficies de las cards de paquetes (se alternan para dar ritmo sin saturar)
const fondosPaquete = [
  'bg-axioma-100 border-axioma-200',
  'bg-heather border-white/60',
  'bg-white border-axioma-200/70',
];

export default function PortalPaciente() {
  const router = useRouter();
  const [usuario, setUsuario] = useState<any>(null);
  const [pacienteInfo, setPacienteInfo] = useState<any>(null);
  const [psicologos, setPsicologos] = useState<any[]>([]);
  const [cargando, setCargando] = useState(true);
  const [mostrarModalCita, setMostrarModalCita] = useState(false);

  const [formCita, setFormCita] = useState({
    psicologoId: '',
    fechaHoraInicio: '',
    fechaHoraFin: '',
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
      const dataPsicos = await apiFetch('/psicologos/publico');
      setPsicologos(dataPsicos || []);

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

  const handleAgendar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pacienteInfo?.id) return;

    try {
      await apiFetch('/citas', {
        method: 'POST',
        body: JSON.stringify({
          ...formCita,
          pacienteId: pacienteInfo.id,
        }),
      });
      alert('✓ ¡Cita agendada con éxito en el sistema!');
      setMostrarModalCita(false);
      setFormCita({ psicologoId: '', fechaHoraInicio: '', fechaHoraFin: '', motivoConsulta: '' });
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

        {/* Paquetes activos */}
        <section>
          <h2 className="text-lg font-semibold tracking-heading text-axiomaText-ink">
            Balance de paquetes terapéuticos
          </h2>

          <div className="mt-4 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {cargando ? (
              <div className={`${card} h-44 animate-pulse bg-axioma-100 motion-reduce:animate-none`} aria-hidden />
            ) : paquetes.length > 0 ? (
              paquetes.map((pp: any, idx: number) => {
                const avance = pp.sesionesTotales ? (pp.sesionesConsumidas / pp.sesionesTotales) * 100 : 0;
                return (
                  <div
                    key={pp.id}
                    className={`rounded-card border p-6 shadow-card ${fondosPaquete[idx % fondosPaquete.length]}`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <span className="text-sm font-semibold text-axiomaText-ink">{pp.paquete?.nombre}</span>
                      <span className={`${pastilla} border border-axioma-200 bg-white text-axioma-700`}>
                        {pp.estado}
                      </span>
                    </div>

                    <div className="mt-5">
                      <div className="flex items-baseline gap-2">
                        <span className="font-display text-5xl font-medium tracking-heading text-axiomaText-ink">
                          {pp.sesionesRestantes}
                        </span>
                        <span className="text-sm text-axiomaText-soft">
                          sesiones restantes de {pp.sesionesTotales}
                        </span>
                      </div>

                      <div
                        className="mt-4 h-2.5 w-full overflow-hidden rounded-full bg-axioma-900/10"
                        role="progressbar"
                        aria-valuenow={Math.round(avance)}
                        aria-valuemin={0}
                        aria-valuemax={100}
                        aria-label="Sesiones consumidas"
                      >
                        <div
                          className="h-full rounded-full bg-axioma-600 transition-all duration-300"
                          style={{ width: `${avance}%` }}
                        />
                      </div>

                      <p className="mt-3 flex items-center gap-1.5 text-xs font-medium text-axiomaText-soft">
                        <CheckCircle2 className="h-3.5 w-3.5 text-axioma-600" />
                        <span>{pp.sesionesConsumidas} sesión(es) completadas y deducidas</span>
                      </p>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className={`${card} p-8 text-center sm:col-span-2`}>
                <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-axioma-100 text-axioma-700">
                  <PackageCheck className="h-6 w-6" />
                </span>
                <p className="mt-3 text-base font-semibold text-axiomaText-ink">
                  No cuentas con un paquete activo actualmente
                </p>
                <p className="mx-auto mt-1 max-w-sm text-sm text-axiomaText-soft">
                  Puedes reservar citas individuales o consultar los paquetes con descuento.
                </p>
                <button
                  onClick={() => setMostrarModalCita(true)}
                  className={`${btnPrimary} ${tamSm} mt-5`}
                >
                  <Calendar className="h-4 w-4" />
                  <span>Reservar una cita</span>
                </button>
              </div>
            )}

            {/* Garantía de atención */}
            <div className="flex flex-col justify-between rounded-card border border-axioma-900/10 bg-axioma-900 p-6 text-white shadow-card">
              <div>
                <span className="text-xs font-semibold text-axioma-300">Garantía de atención</span>
                <h3 className="mt-2 font-display text-xl font-medium tracking-heading">
                  Confirmación inmediata de turno
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-axioma-100">
                  Tus reservas bloquean en tiempo real la agenda del psicólogo para garantizar puntualidad sin esperas en sala.
                </p>
              </div>
              <div className="mt-5 border-t border-white/15 pt-3 text-xs font-semibold text-axioma-200">
                Duración: 50 minutos por consulta
              </div>
            </div>
          </div>
        </section>

        {/* Historial de citas */}
        <section>
          <h2 className="text-lg font-semibold tracking-heading text-axiomaText-ink">
            Historial de consultas
          </h2>

          <div className="mt-4">
            {citas.length === 0 ? (
              <div className={`${card} px-6 py-10 text-center text-sm text-axiomaText-soft`}>
                {cargando
                  ? 'Cargando tus citas...'
                  : 'No tienes citas registradas aún. ¡Haz clic en "Reservar nueva cita" para comenzar!'}
              </div>
            ) : (
              <>
                {/* Móvil: tarjetas */}
                <div className="space-y-3 md:hidden">
                  {citas.map((c: any) => (
                    <div key={c.id} className={`${card} p-4`}>
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-sm font-semibold text-axiomaText-ink">
                            {c.psicologo?.nombres} {c.psicologo?.apellidos}
                          </p>
                          <span className="text-xs text-axiomaText-soft">{c.psicologo?.especialidad}</span>
                        </div>
                        <span className={`${pastilla} ${claseEstadoCita(c.estado)}`}>{c.estado}</span>
                      </div>
                      <div className="mt-3 flex items-center gap-2 text-sm text-axiomaText-ink">
                        <Calendar className="h-4 w-4 text-axioma-600" />
                        <span className="font-medium">{fechaCorta(c.fechaHoraInicio)}</span>
                        <span className="tabular-nums text-axiomaText-soft">{horaCorta(c.fechaHoraInicio)}</span>
                      </div>
                      <p className="mt-2 text-sm text-axiomaText-soft">{c.motivoConsulta || 'Consulta regular'}</p>
                    </div>
                  ))}
                </div>

                {/* Tablet y desktop: tabla */}
                <div className={`${card} hidden overflow-hidden md:block`}>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm text-axiomaText-soft">
                      <thead className="border-b border-axioma-100 bg-axioma-50">
                        <tr>
                          <th className={thClase}>Terapeuta</th>
                          <th className={thClase}>Fecha y horario</th>
                          <th className={thClase}>Motivo de sesión</th>
                          <th className={thClase}>Estado</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-axioma-100">
                        {citas.map((c: any) => (
                          <tr key={c.id} className="transition-colors hover:bg-axioma-50">
                            <td className={tdClase}>
                              <p className="font-semibold text-axiomaText-ink">
                                {c.psicologo?.nombres} {c.psicologo?.apellidos}
                              </p>
                              <span className="text-xs text-axiomaText-soft">{c.psicologo?.especialidad}</span>
                            </td>
                            <td className={tdClase}>
                              <p className="font-medium text-axiomaText-ink">{fechaCorta(c.fechaHoraInicio)}</p>
                              <span className="text-xs tabular-nums text-axiomaText-soft">
                                {horaCorta(c.fechaHoraInicio)}
                              </span>
                            </td>
                            <td className={tdClase}>{c.motivoConsulta || 'Consulta regular'}</td>
                            <td className={tdClase}>
                              <span className={`${pastilla} ${claseEstadoCita(c.estado)}`}>{c.estado}</span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </>
            )}
          </div>
        </section>
      </main>

      {/* Modal: reservar cita */}
      {mostrarModalCita && (
        <div className={modalOverlay}>
          <div className={modalWrap}>
            <div className={`${modalCard} max-w-lg`} role="dialog" aria-modal="true" aria-labelledby="titulo-modal-cita">
              <h3 id="titulo-modal-cita" className="font-display text-2xl font-medium tracking-heading text-axiomaText-ink">
                Reservar cita psicológica
              </h3>
              <p className="mt-1 text-sm leading-relaxed text-axiomaText-soft">
                Selecciona tu terapeuta y horario preferido. Si tienes paquete activo, se vinculará automáticamente.
              </p>

              <form onSubmit={handleAgendar} className="mt-6 space-y-5">
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

                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                  <div>
                    <label htmlFor="fechaInicio" className={label}>
                      Fecha y hora de inicio
                    </label>
                    <input
                      id="fechaInicio"
                      type="datetime-local"
                      required
                      value={formCita.fechaHoraInicio}
                      onChange={(e) => setFormCita({ ...formCita, fechaHoraInicio: e.target.value })}
                      className={input}
                    />
                  </div>
                  <div>
                    <label htmlFor="fechaFin" className={label}>
                      Fecha y hora de fin (50 min)
                    </label>
                    <input
                      id="fechaFin"
                      type="datetime-local"
                      required
                      value={formCita.fechaHoraFin}
                      onChange={(e) => setFormCita({ ...formCita, fechaHoraFin: e.target.value })}
                      className={input}
                    />
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
