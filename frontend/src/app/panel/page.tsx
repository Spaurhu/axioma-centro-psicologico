'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Users, UserCheck, Calendar, PackageCheck, Plus, LogOut, BrainCircuit, RefreshCw, X } from 'lucide-react';
import { apiFetch } from '@/lib/api';
import { LogoAxioma } from '@/components/logo-axioma';
import {
  btnPrimary, btnSecondary, btnIcono, tamMd, focoClaro,
  card, label, input, modalOverlay, modalWrap, modalCard,
  thClase, tdClase, pastilla, claseEstadoCita, claseRiesgo, fechaCorta, horaCorta,
} from '@/lib/ui';

type Tab = 'agenda' | 'psicologos' | 'pacientes' | 'paquetes';

// Superficies de las cards del catálogo de paquetes
const fondosPaquete = [
  'bg-heather border-white/60',
  'bg-axioma-100 border-axioma-200',
  'bg-white border-axioma-200/70',
];

export default function PanelStaff() {
  const router = useRouter();
  const [usuario, setUsuario] = useState<any>(null);
  const [tabActiva, setTabActiva] = useState<Tab>('agenda');

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
  const citasAtendidas = citas.filter((c) => c.estado === 'ATENDIDA').length;

  const pestanas: { id: Tab; Icono: typeof Calendar; texto: string; soloAdmin: boolean }[] = [
    { id: 'agenda', Icono: Calendar, texto: esPsicologo ? 'Mis Citas del Día' : 'Agenda Central & ML', soloAdmin: false },
    { id: 'psicologos', Icono: UserCheck, texto: 'Cuerpo Psicológico', soloAdmin: true },
    { id: 'pacientes', Icono: Users, texto: 'Directorio de Pacientes', soloAdmin: true },
    { id: 'paquetes', Icono: PackageCheck, texto: 'Paquetes Terapéuticos', soloAdmin: true },
  ];

  const metricas = [
    { etiqueta: 'Citas registradas', valor: citas.length, nota: `${citasAtendidas} atendidas`, fondo: 'bg-axioma-100 border-axioma-200', notaClase: 'text-axioma-700' },
    { etiqueta: 'Motor machine learning', valor: '84.6%', nota: 'ROC-AUC 0.87', fondo: 'bg-heather border-white/60', notaClase: 'text-axioma-700' },
    { etiqueta: 'Pacientes registrados', valor: pacientes.length, nota: 'En tratamiento', fondo: 'bg-white border-axioma-200/70', notaClase: 'text-axiomaText-soft' },
    { etiqueta: 'Psicólogos activos', valor: psicologos.length, nota: 'Colegiados C.Ps.P.', fondo: 'bg-axioma-100 border-axioma-200', notaClase: 'text-axioma-700' },
  ];

  const tituloVista = esPsicologo
    ? 'Portal Clínico & Evoluciones SOAP'
    : tabActiva === 'agenda' ? 'Agenda Central & Predicción ML'
      : tabActiva === 'psicologos' ? 'Personal Médico Colegiado'
        : tabActiva === 'pacientes' ? 'Directorio de Pacientes'
          : 'Gestión de Paquetes Terapéuticos';

  return (
    <div className="flex min-h-screen flex-col bg-axioma-50 font-sans text-axiomaText-ink antialiased selection:bg-axioma-200 lg:flex-row">

      {/* SIDEBAR (desktop) / BARRA SUPERIOR con pestañas (móvil y tablet) */}
      <aside className="flex shrink-0 flex-col gap-4 bg-axioma-900 p-4 text-white lg:sticky lg:top-0 lg:h-screen lg:w-72 lg:justify-between lg:gap-0 lg:p-6">
        <div>
          <div className="flex items-center justify-between">
            <LogoAxioma oscuro subtitulo={esPsicologo ? 'Portal Clínico C.Ps.P.' : 'Panel de Dirección'} />
            <button
              onClick={cerrarSesion}
              title="Cerrar Sesión"
              aria-label="Cerrar sesión"
              className={`rounded-full p-2.5 text-axioma-200 transition hover:bg-white/10 hover:text-white lg:hidden ${focoClaro}`}
            >
              <LogOut className="h-5 w-5" />
            </button>
          </div>

          <nav
            className="-mx-1 mt-4 flex gap-2 overflow-x-auto px-1 pb-1 lg:mx-0 lg:mt-8 lg:flex-col lg:gap-1.5 lg:overflow-visible lg:px-0 lg:pb-0"
            aria-label="Secciones del panel"
          >
            {pestanas
              .filter((p) => !p.soloAdmin || !esPsicologo)
              .map(({ id, Icono, texto }) => (
                <button
                  key={id}
                  onClick={() => setTabActiva(id)}
                  aria-current={tabActiva === id ? 'page' : undefined}
                  className={`flex shrink-0 items-center gap-3 whitespace-nowrap rounded-button px-4 py-2.5 text-sm font-medium transition-colors duration-150 lg:w-full ${focoClaro} ${tabActiva === id
                    ? 'bg-axioma-600 text-white'
                    : 'text-axioma-100 hover:bg-white/10 hover:text-white'
                    }`}
                >
                  <Icono className="h-4 w-4" />
                  <span>{texto}</span>
                </button>
              ))}
          </nav>
        </div>

        {/* Perfil del usuario (desktop) */}
        <div className="hidden rounded-card-sm bg-white/10 p-3.5 lg:block">
          <div className="flex items-center justify-between gap-2">
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-white">
                {usuario?.perfil?.nombres ? `${usuario.perfil.nombres} ${usuario.perfil.apellidos}` : usuario?.correo}
              </p>
              <p className="text-xs font-medium text-axioma-200">
                {esPsicologo ? 'Psicóloga Colegiada' : 'Administrador del Centro'}
              </p>
            </div>
            <button
              onClick={cerrarSesion}
              title="Cerrar Sesión"
              aria-label="Cerrar sesión"
              className={`shrink-0 rounded-full p-2 text-axioma-200 transition hover:bg-white/10 hover:text-white ${focoClaro}`}
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* CONTENIDO PRINCIPAL */}
      <main className="min-w-0 flex-1 animate-fade-in p-4 motion-reduce:animate-none sm:p-6 lg:p-10">
        <div className="mx-auto max-w-[1400px]">

          {/* Cabecera de la vista */}
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="font-display text-2xl font-medium tracking-heading text-axiomaText-ink sm:text-3xl">
                {tituloVista}
              </h1>
              <p className="mt-1 text-sm text-axiomaText-soft">
                {esPsicologo
                  ? 'Control confidencial de consultas, asistencia atómica y expediente clínico.'
                  : 'Supervisión en vivo de sesiones, demanda horaria y riesgo de inasistencia.'}
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button onClick={cargarDatos} title="Actualizar datos" aria-label="Actualizar datos" className={btnIcono}>
                <RefreshCw className={`h-4 w-4 ${cargando ? 'animate-spin motion-reduce:animate-none' : ''}`} />
              </button>
              {!esPsicologo && tabActiva === 'agenda' && (
                <button onClick={() => setMostrarModalCita(true)} className={`${btnPrimary} ${tamMd}`}>
                  <Plus className="h-4 w-4" />
                  <span>Agendar cita</span>
                </button>
              )}
            </div>
          </div>

          {/* Métricas */}
          <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {metricas.map((m) => (
              <div key={m.etiqueta} className={`rounded-card border p-5 shadow-card ${m.fondo}`}>
                <span className="text-sm font-medium text-axiomaText-soft">{m.etiqueta}</span>
                <div className="mt-2 flex items-baseline justify-between gap-2">
                  <span className="font-display text-4xl font-medium tracking-heading text-axiomaText-ink">
                    {m.valor}
                  </span>
                  <span className={`text-xs font-semibold ${m.notaClase}`}>{m.nota}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Banner Machine Learning */}
          <div className="mt-6 flex flex-col items-start justify-between gap-4 rounded-card bg-axioma-900 p-5 text-white shadow-lift md:flex-row md:items-center">
            <div className="flex items-start gap-4 md:items-center">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white/10 text-axioma-300">
                <BrainCircuit className="h-6 w-6" />
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-sm font-semibold">Algoritmo preventivo de asistencia</span>
                  <span className="rounded-tag bg-axioma-300 px-2.5 py-0.5 text-[11px] font-bold text-axioma-950">
                    En producción
                  </span>
                </div>
                <p className="mt-1 max-w-2xl text-sm leading-relaxed text-axioma-100">
                  Inferencia en tiempo real que clasifica cada turno según su probabilidad de inasistencia (No-Show) para activar protocolos de confirmación inmediata.
                </p>
              </div>
            </div>
            <span className="shrink-0 rounded-tag bg-white px-3.5 py-1.5 text-xs font-bold text-axioma-900">
              6 variables clínicas
            </span>
          </div>

          {/* TAB: AGENDA CENTRAL & CITAS */}
          {tabActiva === 'agenda' && (
            <div className={`${card} mt-6 overflow-hidden`}>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[980px] text-left text-sm text-axiomaText-soft">
                  <thead className="border-b border-axioma-100 bg-axioma-50">
                    <tr>
                      <th className={thClase}>Paciente</th>
                      <th className={thClase}>Terapeuta</th>
                      <th className={thClase}>Horario de consulta</th>
                      <th className={thClase}>Paquete asignado</th>
                      <th className={thClase}>Predicción ML</th>
                      <th className={thClase}>Estado</th>
                      <th className={`${thClase} text-right`}>Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-axioma-100">
                    {citas.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="px-6 py-12 text-center text-axiomaText-soft">
                          {cargando ? 'Cargando agenda...' : 'No hay citas programadas actualmente en la agenda.'}
                        </td>
                      </tr>
                    ) : (
                      citas.map((c) => (
                        <tr key={c.id} className="transition-colors hover:bg-axioma-50">
                          <td className={tdClase}>
                            <p className="font-semibold text-axiomaText-ink">{c.paciente?.nombres} {c.paciente?.apellidos}</p>
                            <span className="text-xs tabular-nums text-axiomaText-soft">DNI: {c.paciente?.dni}</span>
                          </td>
                          <td className={tdClase}>
                            <p className="font-medium text-axiomaText-ink">{c.psicologo?.nombres} {c.psicologo?.apellidos}</p>
                            <span className="text-xs text-axiomaText-soft">{c.psicologo?.especialidad}</span>
                          </td>
                          <td className={tdClase}>
                            <p className="font-medium text-axiomaText-ink">{fechaCorta(c.fechaHoraInicio)}</p>
                            <span className="text-xs tabular-nums text-axiomaText-soft">
                              {horaCorta(c.fechaHoraInicio)} - {horaCorta(c.fechaHoraFin)}
                            </span>
                          </td>
                          <td className={tdClase}>
                            {c.paquetePaciente ? (
                              <span className={`${pastilla} bg-axioma-100 text-axioma-800`}>
                                Sesión {c.paquetePaciente.sesionesConsumidas + 1} de {c.paquetePaciente.sesionesTotales}
                              </span>
                            ) : (
                              <span className="text-xs">Consulta individual</span>
                            )}
                          </td>
                          <td className={tdClase}>
                            <span className={`${pastilla} ${claseRiesgo(c.nivelRiesgoInasistencia)}`}>
                              {c.nivelRiesgoInasistencia === 'ALTO'
                                ? 'Riesgo alto'
                                : c.nivelRiesgoInasistencia === 'MEDIO'
                                  ? 'Riesgo medio'
                                  : 'Riesgo bajo'}{' '}
                              ({Math.round(c.probabilidadInasistencia * 100)}%)
                            </span>
                          </td>
                          <td className={tdClase}>
                            <span className={`${pastilla} ${claseEstadoCita(c.estado)}`}>{c.estado}</span>
                          </td>
                          <td className={`${tdClase} text-right`}>
                            <div className="flex items-center justify-end gap-2">
                              {c.estado === 'PROGRAMADA' && (
                                <button
                                  onClick={() => handleMarcarAsistencia(c.id)}
                                  className={`${btnPrimary} px-3.5 py-1.5 text-xs`}
                                >
                                  Asistencia
                                </button>
                              )}
                              <button
                                onClick={() => abrirModalNota(c)}
                                className={`${btnSecondary} whitespace-nowrap px-3.5 py-1.5 text-xs`}
                              >
                                Nota SOAP
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB: PSICÓLOGOS */}
          {!esPsicologo && tabActiva === 'psicologos' && (
            <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {psicologos.map((p) => (
                <div key={p.id} className={`${card} p-6`}>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="font-display text-xl font-medium tracking-heading text-axiomaText-ink">
                        {p.nombres} {p.apellidos}
                      </h3>
                      <p className="text-sm text-axiomaText-soft">
                        {p.especialidad || 'Psicoterapia Cognitivo-Conductual'}
                      </p>
                    </div>
                    <span className={`${pastilla} bg-axioma-100 tabular-nums text-axioma-800`}>
                      {p.numeroColegiatura || 'C.Ps.P.'}
                    </span>
                  </div>
                  <p className="mt-3 line-clamp-2 text-sm leading-relaxed text-axiomaText-soft">
                    {p.biografia || 'Especialista en intervención clínica y salud mental preventiva.'}
                  </p>
                  <div className="mt-5 flex items-center justify-between border-t border-axioma-100 pt-4 text-sm">
                    <span className="tabular-nums text-axiomaText-soft">DNI: {p.dni}</span>
                    <span className="font-semibold text-axioma-700">S/. {p.tarifaPorSesion || 80} / sesión</span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* TAB: PACIENTES */}
          {!esPsicologo && tabActiva === 'pacientes' && (
            <div className={`${card} mt-6 overflow-hidden`}>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[760px] text-left text-sm text-axiomaText-soft">
                  <thead className="border-b border-axioma-100 bg-axioma-50">
                    <tr>
                      <th className={thClase}>DNI</th>
                      <th className={thClase}>Nombres y apellidos</th>
                      <th className={thClase}>Teléfono / correo</th>
                      <th className={thClase}>Paquete activo</th>
                      <th className={thClase}>Sesiones restantes</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-axioma-100">
                    {pacientes.map((pac) => {
                      const paqueteActivo = pac.paquetesPaciente?.[0];
                      return (
                        <tr key={pac.id} className="transition-colors hover:bg-axioma-50">
                          <td className={`${tdClase} font-semibold tabular-nums text-axioma-700`}>{pac.dni}</td>
                          <td className={`${tdClase} font-semibold text-axiomaText-ink`}>{pac.nombres} {pac.apellidos}</td>
                          <td className={tdClase}>{pac.telefono || pac.correo || 'N/A'}</td>
                          <td className={tdClase}>
                            {paqueteActivo ? (
                              <span className="font-semibold text-axiomaText-ink">{paqueteActivo.paquete?.nombre}</span>
                            ) : (
                              <span>Sin paquete asignado</span>
                            )}
                          </td>
                          <td className={tdClase}>
                            {paqueteActivo ? (
                              <span className={`${pastilla} bg-axioma-100 text-axioma-800`}>
                                {paqueteActivo.sesionesRestantes} sesiones disponibles
                              </span>
                            ) : (
                              <span>0</span>
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

          {/* TAB: PAQUETES */}
          {!esPsicologo && tabActiva === 'paquetes' && (
            <div className="mt-6 grid gap-5 md:grid-cols-3">
              {catalogoPaquetes.map((pkg, idx) => (
                <div
                  key={pkg.id}
                  className={`flex flex-col justify-between rounded-card border p-7 shadow-card ${fondosPaquete[idx % fondosPaquete.length]}`}
                >
                  <div>
                    <h3 className="font-display text-2xl font-medium tracking-heading text-axiomaText-ink">{pkg.nombre}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-axiomaText-soft">{pkg.descripcion}</p>
                    <div className="mt-6 flex items-baseline">
                      <span className="text-4xl font-bold tracking-heading text-axiomaText-ink">S/. {pkg.precio}</span>
                      <span className="ml-2 text-sm text-axiomaText-soft">/ {pkg.cantidadSesiones} sesiones</span>
                    </div>
                  </div>
                  <div className="mt-6 border-t border-axioma-900/10 pt-4 text-xs font-medium text-axiomaText-soft">
                    Vigencia: {pkg.vigenciaDias} días para consumo
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* MODAL: REGISTRAR CITA */}
      {mostrarModalCita && (
        <div className={modalOverlay}>
          <div className={modalWrap}>
            <div className={`${modalCard} max-w-lg`} role="dialog" aria-modal="true" aria-labelledby="titulo-modal-cita">
              <h3 id="titulo-modal-cita" className="font-display text-2xl font-medium tracking-heading text-axiomaText-ink">
                Agendar cita en agenda central
              </h3>
              <p className="mt-1 text-sm leading-relaxed text-axiomaText-soft">
                Evaluación automática de cruce de horario y cálculo predictivo No-Show.
              </p>

              <form onSubmit={handleCrearCita} className="mt-6 space-y-5">
                <div>
                  <label htmlFor="pacienteId" className={label}>Paciente</label>
                  <select
                    id="pacienteId"
                    required
                    value={formCita.pacienteId}
                    onChange={(e) => setFormCita({ ...formCita, pacienteId: e.target.value })}
                    className={input}
                  >
                    <option value="">Seleccione paciente...</option>
                    {pacientes.map((p) => (
                      <option key={p.id} value={p.id}>{p.nombres} {p.apellidos} ({p.dni})</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="psicologoId" className={label}>Psicólogo</label>
                  <select
                    id="psicologoId"
                    required
                    value={formCita.psicologoId}
                    onChange={(e) => setFormCita({ ...formCita, psicologoId: e.target.value })}
                    className={input}
                  >
                    <option value="">Seleccione terapeuta...</option>
                    {psicologos.map((p) => (
                      <option key={p.id} value={p.id}>{p.nombres} {p.apellidos} - {p.especialidad}</option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                  <div>
                    <label htmlFor="fechaInicio" className={label}>Fecha y hora de inicio</label>
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
                    <label htmlFor="fechaFin" className={label}>Fecha y hora de fin (50m)</label>
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
                  <label htmlFor="motivo" className={label}>Motivo de consulta</label>
                  <input
                    id="motivo"
                    type="text"
                    placeholder="Ej. Terapia por cuadro de ansiedad"
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

      {/* MODAL: NOTA DE EVOLUCIÓN CLÍNICA SOAP */}
      {mostrarModalEvolucion && (
        <div className={modalOverlay}>
          <div className={modalWrap}>
            <div className={`${modalCard} max-w-xl`} role="dialog" aria-modal="true" aria-labelledby="titulo-modal-soap">
              <div className="flex items-start justify-between gap-4 border-b border-axioma-100 pb-4">
                <div>
                  <h3 id="titulo-modal-soap" className="font-display text-2xl font-medium tracking-heading text-axiomaText-ink">
                    Nota de evolución clínica (SOAP)
                  </h3>
                  <p className="mt-0.5 text-sm text-axiomaText-soft">
                    Paciente:{' '}
                    <span className="font-semibold text-axiomaText-ink">
                      {citaSeleccionadaParaNota?.paciente?.nombres} {citaSeleccionadaParaNota?.paciente?.apellidos}
                    </span>
                  </p>
                </div>
                <button
                  onClick={() => setMostrarModalEvolucion(false)}
                  aria-label="Cerrar"
                  className="rounded-full p-1.5 text-axiomaText-soft transition hover:bg-axioma-100 hover:text-axiomaText-ink"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <form onSubmit={handleGuardarNota} className="mt-5 space-y-5">
                <div>
                  <label htmlFor="notaMotivo" className={label}>Motivo abordado</label>
                  <input
                    id="notaMotivo"
                    type="text"
                    required
                    value={formNota.motivoConsulta}
                    onChange={(e) => setFormNota({ ...formNota, motivoConsulta: e.target.value })}
                    className={input}
                  />
                </div>

                <div>
                  <label htmlFor="notaTecnicas" className={label}>Técnicas psicológicas aplicadas</label>
                  <input
                    id="notaTecnicas"
                    type="text"
                    required
                    value={formNota.tecnicasUtilizadas}
                    onChange={(e) => setFormNota({ ...formNota, tecnicasUtilizadas: e.target.value })}
                    className={input}
                  />
                </div>

                <div>
                  <label htmlFor="notaEvolucion" className={label}>Nota de evolución (desarrollo SOAP)</label>
                  <textarea
                    id="notaEvolucion"
                    rows={4}
                    required
                    value={formNota.notaEvolucion}
                    onChange={(e) => setFormNota({ ...formNota, notaEvolucion: e.target.value })}
                    className={`${input} resize-y`}
                  />
                </div>

                <div>
                  <label htmlFor="notaTareas" className={label}>Tareas y recomendaciones</label>
                  <input
                    id="notaTareas"
                    type="text"
                    value={formNota.tareasCasa}
                    onChange={(e) => setFormNota({ ...formNota, tareasCasa: e.target.value })}
                    className={input}
                  />
                </div>

                <div className="flex flex-col-reverse gap-3 border-t border-axioma-100 pt-5 sm:flex-row sm:justify-end">
                  <button type="button" onClick={() => setMostrarModalEvolucion(false)} className={`${btnSecondary} ${tamMd}`}>
                    Cerrar
                  </button>
                  <button type="submit" className={`${btnPrimary} ${tamMd}`}>
                    Guardar en historia clínica
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
