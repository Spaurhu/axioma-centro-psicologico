'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Heart, Calendar, PackageCheck, Clock, User, LogOut, Plus, CheckCircle2, AlertCircle, Sparkles, ArrowLeft } from 'lucide-react';
import { apiFetch } from '@/lib/api';

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

  return (
    <div className="min-h-screen bg-sand-light font-sans text-ink-black selection:bg-terracotta-soft selection:text-navy-deep">
      
      {/* Header Sticky */}
      <header className="sticky top-0 z-40 border-b border-frost bg-paper-white/95 backdrop-blur-md">
        <div className="mx-auto flex max-w-[1280px] items-center justify-between px-6 py-4 lg:px-12">
          <div className="flex items-center space-x-4">
            <Link href="/" className="flex items-center space-x-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-[14px] bg-navy text-paper-white">
                <Heart className="h-5 w-5 fill-terracotta text-terracotta" />
              </div>
              <div>
                <span className="text-xl font-bold tracking-tight text-navy">Axioma</span>
                <span className="block text-[10px] font-bold uppercase tracking-widest text-slate">Portal del Paciente</span>
              </div>
            </Link>

            <Link 
              href="/"
              className="hidden sm:inline-flex items-center space-x-1.5 text-xs font-semibold text-slate hover:text-navy transition ml-4 pl-4 border-l border-frost"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>Volver al Inicio</span>
            </Link>
          </div>

          <div className="flex items-center space-x-4">
            <div className="hidden sm:block text-right">
              <span className="text-xs font-bold text-navy block">
                {pacienteInfo?.nombres || usuario?.correo}
              </span>
              <span className="text-[10px] text-slate">
                Paciente Activo
              </span>
            </div>
            <button
              onClick={cerrarSesion}
              className="flex items-center space-x-1.5 rounded-[40px] border border-ink-black bg-paper-white px-4 py-1.5 text-xs font-semibold text-ink-black hover:bg-sand/60 transition"
            >
              <LogOut className="h-3.5 w-3.5" />
              <span>Cerrar Sesión</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-[1280px] px-6 py-10 lg:px-12 animate-fade-in">
        
        {/* Banner de Bienvenida y Acción Principal */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-8 border-b border-frost gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 rounded-[9999px] bg-sand px-3 py-1 text-[11px] font-bold text-navy mb-2">
              <Sparkles className="h-3.5 w-3.5 text-terracotta" />
              <span>Expediente de Atención Personal</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-medium tracking-heading text-navy">
              Hola, {pacienteInfo?.nombres || 'Paciente'}
            </h1>
            <p className="mt-1 text-xs text-graphite font-mono">
              DNI: {pacienteInfo?.dni} · Control de sesiones, paquete terapéutico y citas agendadas
            </p>
          </div>

          <button
            onClick={() => setMostrarModalCita(true)}
            className="inline-flex items-center space-x-2 rounded-[40px] bg-terracotta px-6 py-3 text-xs font-semibold text-paper-white hover:bg-terracotta-hover transition self-start sm:self-auto hover:scale-[1.01]"
          >
            <Plus className="h-4 w-4" />
            <span>Reservar Nueva Cita</span>
          </button>
        </div>

        {/* 1. SECCIÓN DE PAQUETES ACTIVOS (Pastel Rooms Style) */}
        <section className="mt-8">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate">
            Balance de Paquetes Terapéuticos
          </h2>

          <div className="mt-4 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {pacienteInfo?.paquetesPaciente && pacienteInfo.paquetesPaciente.length > 0 ? (
              pacienteInfo.paquetesPaciente.map((pp: any) => (
                <div key={pp.id} className="rounded-[24px] bg-sand p-6 border border-frost transition-transform hover:scale-[1.01]">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-navy">
                      {pp.paquete?.nombre}
                    </span>
                    <span className="rounded-[9999px] bg-paper-white px-3 py-0.5 text-[10px] font-bold text-navy border border-frost">
                      {pp.estado}
                    </span>
                  </div>
                  
                  <div className="mt-5">
                    <div className="flex items-baseline gap-2">
                      <span className="text-4xl font-bold tracking-heading text-navy">
                        {pp.sesionesRestantes}
                      </span>
                      <span className="text-xs text-graphite font-medium">
                        sesiones restantes de {pp.sesionesTotales}
                      </span>
                    </div>

                    <div className="mt-4 w-full bg-sand-dark/60 rounded-full h-2.5 overflow-hidden">
                      <div 
                        className="bg-terracotta h-2.5 rounded-full transition-all duration-300" 
                        style={{ width: `${(pp.sesionesConsumidas / pp.sesionesTotales) * 100}%` }}
                      />
                    </div>

                    <p className="text-[11px] text-graphite mt-3 font-medium flex items-center gap-1.5">
                      <CheckCircle2 className="h-3.5 w-3.5 text-terracotta" />
                      <span>{pp.sesionesConsumidas} sesión(es) completadas y deducidas</span>
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <div className="rounded-[24px] bg-paper-white p-8 text-center sm:col-span-2 border border-frost">
                <PackageCheck className="mx-auto h-8 w-8 text-slate" />
                <p className="mt-2 text-sm font-bold text-navy">No cuentas con un paquete activo actualmente</p>
                <p className="text-xs text-graphite mt-1">Puedes reservar citas individuales o consultar los paquetes con descuento.</p>
              </div>
            )}

            {/* Tarjeta de recordatorio / Info */}
            <div className="rounded-[24px] bg-ice p-6 border border-frost flex flex-col justify-between">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-navy">
                  Garantía de Atención
                </span>
                <h3 className="mt-2 text-base font-bold text-navy">
                  Confirmación Inmediata de Turno
                </h3>
                <p className="mt-2 text-xs text-graphite leading-relaxed">
                  Tus reservas bloquean en tiempo real la agenda del psicólogo para garantizar puntualidad sin esperas en sala.
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-frost/60 text-[11px] font-semibold text-navy">
                Duración: 50 minutos por consulta
              </div>
            </div>
          </div>
        </section>

        {/* 2. HISTORIAL DE CITAS MÉDICAS */}
        <section className="mt-12">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate">
            Historial de Consultas Médicas
          </h2>

          <div className="mt-4 overflow-hidden rounded-[24px] bg-paper-white border border-frost">
            <table className="w-full text-left text-xs text-graphite">
              <thead className="border-b border-frost bg-sand/30 text-[10px] font-bold uppercase text-slate tracking-wider">
                <tr>
                  <th className="px-6 py-4">Terapeuta</th>
                  <th className="px-6 py-4">Fecha y Horario</th>
                  <th className="px-6 py-4">Motivo de Sesión</th>
                  <th className="px-6 py-4">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-frost">
                {pacienteInfo?.citas && pacienteInfo.citas.length > 0 ? (
                  pacienteInfo.citas.map((c: any) => (
                    <tr key={c.id} className="hover:bg-sand/30 transition-colors">
                      <td className="px-6 py-4">
                        <p className="font-bold text-navy">{c.psicologo?.nombres} {c.psicologo?.apellidos}</p>
                        <span className="text-[10px] text-slate">{c.psicologo?.especialidad}</span>
                      </td>
                      <td className="px-6 py-4">
                        <p className="font-semibold text-ink-black">
                          {new Date(c.fechaHoraInicio).toLocaleDateString('es-PE', { day: '2-digit', month: 'short', year: 'numeric' })}
                        </p>
                        <span className="text-[10px] text-slate font-mono">
                          {new Date(c.fechaHoraInicio).toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-graphite">{c.motivoConsulta || 'Consulta regular'}</td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex rounded-[9999px] px-3 py-1 text-[10px] font-bold ${
                          c.estado === 'ATENDIDA' ? 'bg-sand text-navy' :
                          c.estado === 'CANCELADA' ? 'bg-rose-100 text-rose-800' :
                          'bg-ice text-navy'
                        }`}>
                          {c.estado}
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="px-6 py-10 text-center text-slate">
                      No tienes citas registradas aún. ¡Haz clic en "Reservar Nueva Cita" para comenzar!
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

      </main>

      {/* MODAL RESERVAR CITA (Patient Booking) */}
      {mostrarModalCita && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-navy-deep/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg rounded-[24px] bg-paper-white p-8 border border-frost animate-fade-in">
            <h3 className="text-xl font-bold text-navy">Reservar Cita Psicológica</h3>
            <p className="mt-1 text-xs text-graphite">
              Selecciona tu terapeuta y horario preferido. Si tienes paquete activo, se vinculará automáticamente.
            </p>

            <form onSubmit={handleAgendar} className="mt-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-graphite">
                  Psicólogo Especialista
                </label>
                <select
                  required
                  value={formCita.psicologoId}
                  onChange={(e) => setFormCita({ ...formCita, psicologoId: e.target.value })}
                  className="mt-1.5 w-full rounded-[16px] border border-frost bg-cloud/50 p-3 text-xs text-ink-black focus:border-navy focus:bg-paper-white focus:outline-none"
                >
                  <option value="">Seleccione terapeuta...</option>
                  {psicologos.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.nombres} {p.apellidos} - {p.especialidad} (S/. {p.tarifaPorSesion})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-graphite">
                    Fecha y Hora Inicio
                  </label>
                  <input
                    type="datetime-local"
                    required
                    value={formCita.fechaHoraInicio}
                    onChange={(e) => setFormCita({ ...formCita, fechaHoraInicio: e.target.value })}
                    className="mt-1.5 w-full rounded-[16px] border border-frost bg-cloud/50 p-3 text-xs text-ink-black focus:border-navy focus:bg-paper-white focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-graphite">
                    Fecha y Hora Fin (50 min)
                  </label>
                  <input
                    type="datetime-local"
                    required
                    value={formCita.fechaHoraFin}
                    onChange={(e) => setFormCita({ ...formCita, fechaHoraFin: e.target.value })}
                    className="mt-1.5 w-full rounded-[16px] border border-frost bg-cloud/50 p-3 text-xs text-ink-black focus:border-navy focus:bg-paper-white focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-graphite">
                  Motivo de Consulta (Opcional)
                </label>
                <input
                  type="text"
                  placeholder="Ej. Manejo de estrés, ansiedad o temas personales"
                  value={formCita.motivoConsulta}
                  onChange={(e) => setFormCita({ ...formCita, motivoConsulta: e.target.value })}
                  className="mt-1.5 w-full rounded-[16px] border border-frost bg-cloud/50 p-3 text-xs text-ink-black focus:border-navy focus:bg-paper-white focus:outline-none"
                />
              </div>

              <div className="mt-8 flex justify-end space-x-3 pt-4 border-t border-frost">
                <button
                  type="button"
                  onClick={() => setMostrarModalCita(false)}
                  className="rounded-[40px] border border-ink-black px-5 py-2.5 text-xs font-semibold text-ink-black hover:bg-sand/60"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="rounded-[40px] bg-terracotta px-6 py-2.5 text-xs font-semibold text-paper-white hover:bg-terracotta-hover"
                >
                  Confirmar Reserva
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
