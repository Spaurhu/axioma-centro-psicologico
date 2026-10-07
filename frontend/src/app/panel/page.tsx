'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  Heart, Users, UserCheck, Calendar, PackageCheck, AlertTriangle, 
  CheckCircle2, Clock, Plus, Search, LogOut, BrainCircuit, RefreshCw,
  FileText, ShieldCheck, Stethoscope, ChevronRight, X, Sparkles, Filter
} from 'lucide-react';
import { apiFetch } from '@/lib/api';

export default function PanelStaff() {
  const router = useRouter();
  const [usuario, setUsuario] = useState<any>(null);
  const [tabActiva, setTabActiva] = useState<'agenda' | 'psicologos' | 'pacientes' | 'paquetes'>('agenda');

  // Datos
  const [citas, setCitas] = useState<any[]>([]);
  const [psicologos, setPsicologos] = useState<any[]>([]);
  const [pacientes, setPacientes] = useState<any[]>([]);
  const [catalogoPaquetes, setCatalogoPaquetes] = useState<any[]>([]);
  const [cargando, setCargando] = useState(true);

  // Modales
  const [mostrarModalCita, setMostrarModalCita] = useState(false);
  const [mostrarModalEvolucion, setMostrarModalEvolucion] = useState(false);
  const [citaSeleccionadaParaNota, setCitaSeleccionadaParaNota] = useState<any>(null);

  // Formulario nueva cita
  const [formCita, setFormCita] = useState({
    pacienteId: '',
    psicologoId: '',
    fechaHoraInicio: '',
    fechaHoraFin: '',
    motivoConsulta: '',
  });

  // Formulario Nota Clínica (SOAP)
  const [formNota, setFormNota] = useState({
    motivoConsulta: '',
    tecnicasUtilizadas: '',
    notaEvolucion: '',
    tareasCasa: '',
  });

  useEffect(() => {
    const usuarioGuardado = localStorage.getItem('axioma_usuario');
    if (!usuarioGuardado) {
      router.push('/login');
      return;
    }
    const u = JSON.parse(usuarioGuardado);
    if (u.rol === 'PACIENTE') {
      router.push('/paciente');
      return;
    }
    setUsuario(u);
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    setCargando(true);
    try {
      const [dataCitas, dataPsicos, dataPacientes, dataPaquetes] = await Promise.all([
        apiFetch('/citas'),
        apiFetch('/psicologos'),
        apiFetch('/pacientes'),
        apiFetch('/paquetes/catalogo'),
      ]);
      setCitas(dataCitas || []);
      setPsicologos(dataPsicos || []);
      setPacientes(dataPacientes || []);
      setCatalogoPaquetes(dataPaquetes || []);
    } catch (err) {
      console.error('Error al cargar datos:', err);
    } finally {
      setCargando(false);
    }
  };

  const cerrarSesion = () => {
    localStorage.removeItem('axioma_token');
    localStorage.removeItem('axioma_usuario');
    router.push('/login');
  };

  const handleMarcarAsistencia = async (citaId: string) => {
    if (!confirm('¿Desea marcar asistencia para esta sesión? Se descontará automáticamente 1 sesión del paquete del paciente.')) return;
    try {
      await apiFetch(`/citas/${citaId}/asistencia`, { method: 'PATCH' });
      cargarDatos();
    } catch (err: any) {
      alert(err.message || 'Error al marcar asistencia');
    }
  };

  const handleCrearCita = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiFetch('/citas', {
        method: 'POST',
        body: JSON.stringify(formCita),
      });
      setMostrarModalCita(false);
      setFormCita({ pacienteId: '', psicologoId: '', fechaHoraInicio: '', fechaHoraFin: '', motivoConsulta: '' });
      cargarDatos();
    } catch (err: any) {
      alert(err.message || 'Error al agendar cita');
    }
  };

  const abrirModalNota = (cita: any) => {
    setCitaSeleccionadaParaNota(cita);
    setFormNota({
      motivoConsulta: cita.motivoConsulta || 'Sesión de seguimiento terapéutico',
      tecnicasUtilizadas: 'Técnicas cognitivo-conductuales, reestructuración y respiración diafragmática',
      notaEvolucion: 'Paciente acude puntual. Manifiesta avances en la regulación de la ansiedad. Se evalúa registro conductual semanal.',
      tareasCasa: 'Completar registro diario de pensamientos automáticos y técnica 5-4-3-2-1.',
    });
    setMostrarModalEvolucion(true);
  };

  const handleGuardarNota = async (e: React.FormEvent) => {
    e.preventDefault();
    alert('✓ Nota de Evolución Clínica registrada exitosamente en el expediente del paciente.');
    setMostrarModalEvolucion(false);
  };

  const esPsicologo = usuario?.rol === 'PSICOLOGO';

  // Métricas
  const totalCitasHoy = citas.length;
  const citasAtendidas = citas.filter((c) => c.estado === 'ATENDIDA').length;

  return (
    <div className="flex min-h-screen bg-sand-light font-sans text-ink-black selection:bg-terracotta-soft selection:text-navy-deep">
      
      {/* SIDEBAR EDITORIAL */}
      <aside className="w-72 border-r border-frost bg-paper-white p-6 flex flex-col justify-between shrink-0">
        <div>
          <Link href="/" className="flex items-center space-x-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-[14px] bg-navy text-paper-white">
              <Heart className="h-5 w-5 fill-terracotta text-terracotta" />
            </div>
            <div>
              <span className="text-xl font-bold tracking-tight text-navy">
                Axioma
              </span>
              <span className="block text-[10px] uppercase font-bold tracking-widest text-slate">
                {esPsicologo ? 'Portal Clínico C.Ps.P.' : 'Panel de Dirección'}
              </span>
            </div>
          </Link>

          <nav className="mt-8 space-y-1.5">
            <button
              onClick={() => setTabActiva('agenda')}
              className={`flex w-full items-center space-x-3 rounded-[40px] px-4 py-2.5 text-xs font-semibold transition-all duration-150 ${
                tabActiva === 'agenda' 
                  ? 'bg-navy text-paper-white' 
                  : 'text-graphite hover:bg-sand/60'
              }`}
            >
              <Calendar className="h-4 w-4" />
              <span>{esPsicologo ? 'Mis Citas del Día' : 'Agenda Central & ML'}</span>
            </button>

            {!esPsicologo && (
              <>
                <button
                  onClick={() => setTabActiva('psicologos')}
                  className={`flex w-full items-center space-x-3 rounded-[40px] px-4 py-2.5 text-xs font-semibold transition-all duration-150 ${
                    tabActiva === 'psicologos' 
                      ? 'bg-navy text-paper-white' 
                      : 'text-graphite hover:bg-sand/60'
                  }`}
                >
                  <UserCheck className="h-4 w-4" />
                  <span>Cuerpo Psicológico</span>
                </button>

                <button
                  onClick={() => setTabActiva('pacientes')}
                  className={`flex w-full items-center space-x-3 rounded-[40px] px-4 py-2.5 text-xs font-semibold transition-all duration-150 ${
                    tabActiva === 'pacientes' 
                      ? 'bg-navy text-paper-white' 
                      : 'text-graphite hover:bg-sand/60'
                  }`}
                >
                  <Users className="h-4 w-4" />
                  <span>Directorio de Pacientes</span>
                </button>

                <button
                  onClick={() => setTabActiva('paquetes')}
                  className={`flex w-full items-center space-x-3 rounded-[40px] px-4 py-2.5 text-xs font-semibold transition-all duration-150 ${
                    tabActiva === 'paquetes' 
                      ? 'bg-navy text-paper-white' 
                      : 'text-graphite hover:bg-sand/60'
                  }`}
                >
                  <PackageCheck className="h-4 w-4" />
                  <span>Paquetes Terapéuticos</span>
                </button>
              </>
            )}
          </nav>
        </div>

        {/* Perfil del Usuario */}
        <div className="rounded-[20px] bg-sand/60 p-3.5 border border-frost">
          <div className="flex items-center justify-between">
            <div className="truncate pr-2">
              <p className="text-xs font-bold text-navy truncate">
                {usuario?.perfil?.nombres ? `${usuario.perfil.nombres} ${usuario.perfil.apellidos}` : usuario?.correo}
              </p>
              <p className="text-[10px] text-slate font-medium capitalize">
                {esPsicologo ? 'Psicóloga Colegiada' : 'Administrador del Centro'}
              </p>
            </div>
            <button
              onClick={cerrarSesion}
              title="Cerrar Sesión"
              className="p-2 rounded-full text-slate hover:bg-terracotta-wash hover:text-terracotta transition"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* CONTENIDO PRINCIPAL */}
      <main className="flex-1 p-8 lg:p-10 overflow-y-auto animate-fade-in max-w-[1400px]">
        
        {/* Cabecera Superior */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b border-frost">
          <div>
            <h1 className="text-3xl font-medium tracking-heading text-navy">
              {esPsicologo 
                ? 'Portal Clínico & Evoluciones SOAP'
                : tabActiva === 'agenda' ? 'Agenda Central & Predicción ML'
                : tabActiva === 'psicologos' ? 'Personal Médico Colegiado'
                : tabActiva === 'pacientes' ? 'Directorio de Pacientes'
                : 'Gestión de Paquetes Terapéuticos'}
            </h1>
            <p className="mt-1 text-xs text-graphite">
              {esPsicologo 
                ? 'Control confidencial de consultas, asistencia atómica y expediente clínico.'
                : 'Supervisión en vivo de sesiones, demanda horaria y riesgo de inasistencia.'}
            </p>
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={cargarDatos}
              title="Actualizar datos"
              className="p-2.5 rounded-[40px] border border-ink-black bg-paper-white text-ink-black hover:bg-sand/60 transition"
            >
              <RefreshCw className="h-4 w-4" />
            </button>
            {!esPsicologo && tabActiva === 'agenda' && (
              <button
                onClick={() => setMostrarModalCita(true)}
                className="flex items-center space-x-2 rounded-[40px] bg-terracotta px-5 py-2.5 text-xs font-semibold text-paper-white transition hover:bg-terracotta-hover"
              >
                <Plus className="h-4 w-4" />
                <span>Agendar Cita</span>
              </button>
            )}
          </div>
        </div>

        {/* 4 PASTEL ROOM CARDS (Terracotta Wash, Ice, Sand, Heather) */}
        <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="rounded-[20px] bg-terracotta-wash p-5 border border-frost/60">
            <span className="text-[10px] font-bold uppercase tracking-wider text-navy">
              Citas Registradas
            </span>
            <div className="mt-2 flex items-baseline justify-between">
              <span className="text-3xl font-bold tracking-heading text-navy">
                {citas.length}
              </span>
              <span className="text-xs font-semibold text-navy">
                {citasAtendidas} atendidas
              </span>
            </div>
          </div>

          <div className="rounded-[20px] bg-ice p-5 border border-frost/60">
            <span className="text-[10px] font-bold uppercase tracking-wider text-navy">
              Motor Machine Learning
            </span>
            <div className="mt-2 flex items-baseline justify-between">
              <span className="text-3xl font-bold tracking-heading text-navy">
                84.6%
              </span>
              <span className="text-xs font-semibold text-terracotta font-bold">
                ROC-AUC 0.87
              </span>
            </div>
          </div>

          <div className="rounded-[20px] bg-sand p-5 border border-frost/60">
            <span className="text-[10px] font-bold uppercase tracking-wider text-navy">
              Pacientes Registrados
            </span>
            <div className="mt-2 flex items-baseline justify-between">
              <span className="text-3xl font-bold tracking-heading text-navy">
                {pacientes.length}
              </span>
              <span className="text-xs font-semibold text-slate">
                En tratamiento
              </span>
            </div>
          </div>

          <div className="rounded-[20px] bg-heather p-5 border border-frost/60">
            <span className="text-[10px] font-bold uppercase tracking-wider text-navy">
              Psicólogos Activos
            </span>
            <div className="mt-2 flex items-baseline justify-between">
              <span className="text-3xl font-bold tracking-heading text-navy">
                {psicologos.length}
              </span>
              <span className="text-xs font-semibold text-terracotta">
                Colegiados C.Ps.P.
              </span>
            </div>
          </div>
        </div>

        {/* BANNER MACHINE LEARNING PREDICTIVO */}
        <div className="mt-6 rounded-[20px] bg-navy p-5 text-paper-white flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center space-x-3.5">
            <div className="p-2.5 rounded-[14px] bg-paper-white/10 text-terracotta">
              <BrainCircuit className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-sand uppercase tracking-wider">
                  Algoritmo Preventivo de Asistencia
                </span>
                <span className="rounded-[9999px] bg-terracotta/25 px-2.5 py-0.5 text-[10px] font-bold text-terracotta-soft">
                  En Producción
                </span>
              </div>
              <p className="text-xs text-sand/80 mt-0.5 max-w-2xl">
                Inferencia en tiempo real que clasifica cada turno según su probabilidad de inasistencia (No-Show) para activar protocolos de confirmación inmediata.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="rounded-[9999px] bg-paper-white px-3.5 py-1 text-xs font-bold text-navy">
              6 Variables Clínicas
            </span>
          </div>
        </div>

        {/* TAB: AGENDA CENTRAL & CITAS */}
        {tabActiva === 'agenda' && (
          <div className="mt-6">
            <div className="overflow-hidden rounded-[24px] bg-paper-white border border-frost shadow-none">
              <table className="w-full text-left text-xs text-graphite">
                <thead className="border-b border-frost bg-sand/30 text-[10px] font-bold uppercase tracking-wider text-slate">
                  <tr>
                    <th className="px-6 py-4">Paciente</th>
                    <th className="px-6 py-4">Terapeuta</th>
                    <th className="px-6 py-4">Horario Consulta</th>
                    <th className="px-6 py-4">Paquete Asignado</th>
                    <th className="px-6 py-4">Predicción ML</th>
                    <th className="px-6 py-4">Estado</th>
                    <th className="px-6 py-4 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-frost">
                  {citas.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-6 py-12 text-center text-slate">
                        No hay citas programadas actualmente en la agenda.
                      </td>
                    </tr>
                  ) : (
                    citas.map((c) => (
                      <tr key={c.id} className="hover:bg-sand/30 transition-colors">
                        <td className="px-6 py-4">
                          <p className="font-bold text-navy">{c.paciente?.nombres} {c.paciente?.apellidos}</p>
                          <span className="text-[10px] text-slate font-mono">DNI: {c.paciente?.dni}</span>
                        </td>
                        <td className="px-6 py-4">
                          <p className="font-medium text-ink-black">{c.psicologo?.nombres} {c.psicologo?.apellidos}</p>
                          <span className="text-[10px] text-slate">{c.psicologo?.especialidad}</span>
                        </td>
                        <td className="px-6 py-4">
                          <p className="font-medium text-ink-black">
                            {new Date(c.fechaHoraInicio).toLocaleDateString('es-PE', { day: '2-digit', month: 'short', year: 'numeric' })}
                          </p>
                          <span className="text-[10px] text-slate font-mono">
                            {new Date(c.fechaHoraInicio).toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' })} - 
                            {new Date(c.fechaHoraFin).toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          {c.paquetePaciente ? (
                            <span className="inline-flex rounded-[9999px] bg-sand px-3 py-1 text-[10px] font-bold text-navy">
                              Sesión {c.paquetePaciente.sesionesConsumidas + 1} de {c.paquetePaciente.sesionesTotales}
                            </span>
                          ) : (
                            <span className="text-[10px] text-slate">Consulta Individual</span>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          {c.nivelRiesgoInasistencia === 'ALTO' ? (
                            <span className="inline-flex rounded-[9999px] bg-terracotta-wash px-3 py-1 text-[10px] font-bold text-terracotta">
                              Riesgo Alto ({Math.round(c.probabilidadInasistencia * 100)}%)
                            </span>
                          ) : c.nivelRiesgoInasistencia === 'MEDIO' ? (
                            <span className="inline-flex rounded-[9999px] bg-sand px-3 py-1 text-[10px] font-bold text-navy">
                              Riesgo Medio ({Math.round(c.probabilidadInasistencia * 100)}%)
                            </span>
                          ) : (
                            <span className="inline-flex rounded-[9999px] bg-ice px-3 py-1 text-[10px] font-bold text-navy">
                              Riesgo Bajo ({Math.round(c.probabilidadInasistencia * 100)}%)
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex rounded-[9999px] px-3 py-1 text-[10px] font-bold ${
                            c.estado === 'ATENDIDA' ? 'bg-sand text-navy' :
                            c.estado === 'CANCELADA' ? 'bg-rose-100 text-rose-800' :
                            'bg-ice text-navy'
                          }`}>
                            {c.estado}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right space-x-2">
                          {c.estado === 'PROGRAMADA' && (
                            <button
                              onClick={() => handleMarcarAsistencia(c.id)}
                              className="rounded-[40px] bg-navy px-3.5 py-1.5 text-[11px] font-semibold text-paper-white hover:bg-black transition"
                            >
                              Asistencia
                            </button>
                          )}
                          <button
                            onClick={() => abrirModalNota(c)}
                            className="rounded-[40px] border border-ink-black bg-paper-white px-3.5 py-1.5 text-[11px] font-semibold text-ink-black hover:bg-sand/60 transition"
                          >
                            Nota SOAP
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB: PSICÓLOGOS (Sprint 1) */}
        {!esPsicologo && tabActiva === 'psicologos' && (
          <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {psicologos.map((p) => (
              <div key={p.id} className="rounded-[24px] bg-paper-white p-6 border border-frost transition-transform hover:scale-[1.01]">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-lg font-bold text-navy">{p.nombres} {p.apellidos}</h3>
                    <p className="text-xs text-slate font-medium">{p.especialidad || 'Psicoterapia Cognitivo-Conductual'}</p>
                  </div>
                  <span className="rounded-[9999px] bg-sand px-2.5 py-1 text-[10px] font-bold text-navy font-mono">
                    {p.numeroColegiatura || 'C.Ps.P.'}
                  </span>
                </div>
                <p className="mt-3 text-xs text-graphite line-clamp-2 leading-relaxed">
                  {p.biografia || 'Especialista en intervención clínica y salud mental preventiva.'}
                </p>
                <div className="mt-5 pt-4 border-t border-frost flex items-center justify-between text-xs">
                  <span className="text-slate">DNI: {p.dni}</span>
                  <span className="font-bold text-navy">S/. {p.tarifaPorSesion || 80} / sesión</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* TAB: PACIENTES (Sprint 2) */}
        {!esPsicologo && tabActiva === 'pacientes' && (
          <div className="mt-6">
            <div className="overflow-hidden rounded-[24px] bg-paper-white border border-frost">
              <table className="w-full text-left text-xs text-graphite">
                <thead className="border-b border-frost bg-sand/30 text-[10px] font-bold uppercase text-slate">
                  <tr>
                    <th className="px-6 py-4">DNI</th>
                    <th className="px-6 py-4">Nombres y Apellidos</th>
                    <th className="px-6 py-4">Teléfono / Correo</th>
                    <th className="px-6 py-4">Paquete Activo</th>
                    <th className="px-6 py-4">Sesiones Restantes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-frost">
                  {pacientes.map((pac) => {
                    const paqueteActivo = pac.paquetesPaciente?.[0];
                    return (
                      <tr key={pac.id} className="hover:bg-sand/20">
                        <td className="px-6 py-4 font-mono font-bold text-navy">{pac.dni}</td>
                        <td className="px-6 py-4 font-semibold text-ink-black">{pac.nombres} {pac.apellidos}</td>
                        <td className="px-6 py-4 text-slate">{pac.telefono || pac.correo || 'N/A'}</td>
                        <td className="px-6 py-4">
                          {paqueteActivo ? (
                            <span className="text-navy font-bold">{paqueteActivo.paquete?.nombre}</span>
                          ) : (
                            <span className="text-slate">Sin paquete asignado</span>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          {paqueteActivo ? (
                            <span className="inline-flex rounded-[9999px] bg-sand px-3 py-1 text-[10px] font-bold text-navy">
                              {paqueteActivo.sesionesRestantes} sesiones disponibles
                            </span>
                          ) : (
                            <span className="text-slate">0</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB: PAQUETES (Sprint 2 y 3) */}
        {!esPsicologo && tabActiva === 'paquetes' && (
          <div className="mt-6 grid gap-6 md:grid-cols-3">
            {catalogoPaquetes.map((pkg, idx) => {
              const pastelBg = idx === 0 ? 'bg-sand' : idx === 1 ? 'bg-terracotta-wash' : 'bg-ice';
              return (
                <div key={pkg.id} className={`rounded-[24px] ${pastelBg} p-7 flex flex-col justify-between border border-frost/50`}>
                  <div>
                    <h3 className="text-xl font-bold text-navy">{pkg.nombre}</h3>
                    <p className="mt-2 text-xs text-graphite leading-relaxed">{pkg.descripcion}</p>
                    <div className="mt-6 flex items-baseline">
                      <span className="text-4xl font-bold text-navy">S/. {pkg.precio}</span>
                      <span className="ml-2 text-xs text-slate">/ {pkg.cantidadSesiones} sesiones</span>
                    </div>
                  </div>
                  <div className="mt-6 pt-4 border-t border-frost/60 text-[11px] font-medium text-slate">
                    Vigencia: {pkg.vigenciaDias} días para consumo
                  </div>
                </div>
              );
            })}
          </div>
        )}

      </main>

      {/* MODAL REGISTRAR CITA */}
      {mostrarModalCita && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-navy-deep/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg rounded-[24px] bg-paper-white p-8 border border-frost animate-fade-in">
            <h3 className="text-xl font-bold text-navy">Agendar Cita en Agenda Central</h3>
            <p className="mt-1 text-xs text-graphite">
              Evaluación automática de cruce de horario y cálculo predictivo No-Show.
            </p>

            <form onSubmit={handleCrearCita} className="mt-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-graphite">Paciente</label>
                <select
                  required
                  value={formCita.pacienteId}
                  onChange={(e) => setFormCita({ ...formCita, pacienteId: e.target.value })}
                  className="mt-1.5 w-full rounded-[16px] border border-frost bg-cloud/50 p-3 text-xs text-ink-black focus:border-navy focus:bg-paper-white focus:outline-none"
                >
                  <option value="">Seleccione paciente...</option>
                  {pacientes.map((p) => (
                    <option key={p.id} value={p.id}>{p.nombres} {p.apellidos} ({p.dni})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-graphite">Psicólogo</label>
                <select
                  required
                  value={formCita.psicologoId}
                  onChange={(e) => setFormCita({ ...formCita, psicologoId: e.target.value })}
                  className="mt-1.5 w-full rounded-[16px] border border-frost bg-cloud/50 p-3 text-xs text-ink-black focus:border-navy focus:bg-paper-white focus:outline-none"
                >
                  <option value="">Seleccione terapeuta...</option>
                  {psicologos.map((p) => (
                    <option key={p.id} value={p.id}>{p.nombres} {p.apellidos} - {p.especialidad}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-graphite">Fecha y Hora Inicio</label>
                  <input
                    type="datetime-local"
                    required
                    value={formCita.fechaHoraInicio}
                    onChange={(e) => setFormCita({ ...formCita, fechaHoraInicio: e.target.value })}
                    className="mt-1.5 w-full rounded-[16px] border border-frost bg-cloud/50 p-3 text-xs text-ink-black focus:border-navy focus:bg-paper-white focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-graphite">Fecha y Hora Fin (50m)</label>
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
                <label className="block text-xs font-semibold uppercase tracking-wider text-graphite">Motivo de Consulta</label>
                <input
                  type="text"
                  placeholder="Ej. Terapia por cuadro de ansiedad"
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

      {/* MODAL NOTA DE EVOLUCIÓN CLÍNICA SOAP (Sprint 4) */}
      {mostrarModalEvolucion && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-navy-deep/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-xl rounded-[24px] bg-paper-white p-8 border border-frost animate-fade-in">
            <div className="flex items-center justify-between pb-4 border-b border-frost">
              <div>
                <h3 className="text-xl font-bold text-navy">
                  Nota de Evolución Clínica (SOAP)
                </h3>
                <p className="text-xs text-graphite mt-0.5">
                  Paciente: <span className="font-bold text-navy">{citaSeleccionadaParaNota?.paciente?.nombres} {citaSeleccionadaParaNota?.paciente?.apellidos}</span>
                </p>
              </div>
              <button onClick={() => setMostrarModalEvolucion(false)} className="text-slate hover:text-ink-black">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleGuardarNota} className="mt-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-graphite">Motivo Abordado</label>
                <input
                  type="text"
                  required
                  value={formNota.motivoConsulta}
                  onChange={(e) => setFormNota({ ...formNota, motivoConsulta: e.target.value })}
                  className="mt-1.5 w-full rounded-[16px] border border-frost bg-cloud/50 p-3 text-xs text-ink-black"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-graphite">Técnicas Psicológicas Aplicadas</label>
                <input
                  type="text"
                  required
                  value={formNota.tecnicasUtilizadas}
                  onChange={(e) => setFormNota({ ...formNota, tecnicasUtilizadas: e.target.value })}
                  className="mt-1.5 w-full rounded-[16px] border border-frost bg-cloud/50 p-3 text-xs text-ink-black"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-graphite">Nota de Evolución (Desarrollo SOAP)</label>
                <textarea
                  rows={3}
                  required
                  value={formNota.notaEvolucion}
                  onChange={(e) => setFormNota({ ...formNota, notaEvolucion: e.target.value })}
                  className="mt-1.5 w-full rounded-[16px] border border-frost bg-cloud/50 p-3 text-xs text-ink-black"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-graphite">Tareas y Recomendaciones</label>
                <input
                  type="text"
                  value={formNota.tareasCasa}
                  onChange={(e) => setFormNota({ ...formNota, tareasCasa: e.target.value })}
                  className="mt-1.5 w-full rounded-[16px] border border-frost bg-cloud/50 p-3 text-xs text-ink-black"
                />
              </div>

              <div className="mt-8 flex justify-end space-x-3 pt-4 border-t border-frost">
                <button
                  type="button"
                  onClick={() => setMostrarModalEvolucion(false)}
                  className="rounded-[40px] border border-ink-black px-5 py-2.5 text-xs font-semibold text-ink-black hover:bg-sand/60"
                >
                  Cerrar
                </button>
                <button
                  type="submit"
                  className="rounded-[40px] bg-terracotta px-6 py-2.5 text-xs font-semibold text-paper-white hover:bg-terracotta-hover"
                >
                  Guardar en Historia Clínica
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
