'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import {
  Users, Calendar, PackageCheck, Plus, LogOut,
  RefreshCw, Search, Clock, CheckCircle2, XCircle, CalendarClock
} from 'lucide-react';
import { apiFetch } from '@/lib/api';
import { LogoAxioma } from '@/components/logo-axioma';
import {
  btnPrimary, btnSecondary, btnIcono, tamMd, focoClaro,
  card, label, input, modalOverlay, modalWrap, modalCard,
  thClase, tdClase, pastilla, claseEstadoCita, claseRiesgo,
  fechaCorta, horaCorta, fechaYmdLocal, horaHmLocal,
} from '@/lib/ui';

type Tab = 'agenda' | 'pacientes' | 'paquetes';

const fondosPaquete = [
  'bg-heather border-white/60',
  'bg-axioma-100 border-axioma-200',
  'bg-white border-axioma-200/70',
];

// Generar bloques de horario de consulta (RN-36 domingos cerrados, RN-37 refrigerio 13-14)
const generarHorariosDisponibles = (fechaStr: string) => {
  if (!fechaStr) return [];
  const fecha = new Date(fechaStr + 'T00:00:00');
  const dia = fecha.getDay(); // 0 = Domingo, 6 = Sábado
  if (dia === 0) return []; // Domingos descanso

  const horarios: { inicio: string; fin: string; etiqueta: string }[] = [];
  const horaInicio = 9;
  const horaFin = dia === 6 ? 13 : 18; // Sábados hasta 1pm, Lun-Vie hasta 6pm

  for (let h = horaInicio; h < horaFin; h++) {
    if (dia !== 6 && h === 13) continue; // Refrigerio Lun-Vie 13:00 - 14:00
    const hStr = h.toString().padStart(2, '0');
    horarios.push({
      inicio: `${hStr}:00`,
      fin: `${hStr}:50`,
      etiqueta: `${h % 12 === 0 ? 12 : h % 12}:00 ${h < 12 ? 'AM' : 'PM'} - ${h % 12 === 0 ? 12 : h % 12}:50 ${h < 12 ? 'AM' : 'PM'}`
    });
  }
  return horarios;
};

export default function PanelRecepcion() {
  const router = useRouter();
  const [usuario, setUsuario] = useState<any>(null);
  const [tabActiva, setTabActiva] = useState<Tab>('agenda');

  // Datos
  const [citas, setCitas] = useState<any[]>([]);
  const [todasLasCitas, setTodasLasCitas] = useState<any[]>([]);
  const [psicologos, setPsicologos] = useState<any[]>([]);
  const [pacientes, setPacientes] = useState<any[]>([]);
  const [catalogoPaquetes, setCatalogoPaquetes] = useState<any[]>([]);
  const [cargando, setCargando] = useState(true);

  // Filtros
  const [filtroFechaCitas, setFiltroFechaCitas] = useState<string>('');
  const [filtroDniPaciente, setFiltroDniPaciente] = useState<string>('');

  // Modales
  const [mostrarModalCita, setMostrarModalCita] = useState(false);
  const [mostrarModalReprogramar, setMostrarModalReprogramar] = useState(false);
  const [citaSeleccionadaParaReprog, setCitaSeleccionadaParaReprog] = useState<any>(null);

  const [mostrarModalEditarPaciente, setMostrarModalEditarPaciente] = useState(false);
  const [pacienteSeleccionadoParaEditar, setPacienteSeleccionadoParaEditar] = useState<any>(null);

  const [mostrarModalAsignarPaquete, setMostrarModalAsignarPaquete] = useState(false);
  const [pacienteSeleccionadoParaPaquete, setPacienteSeleccionadoParaPaquete] = useState<any>(null);

  const hoyStr = new Date().toISOString().split('T')[0];

  // Formularios
  const [formCita, setFormCita] = useState({
    pacienteId: '',
    psicologoId: '',
    fecha: hoyStr,
    horarioIndex: '0',
    motivoConsulta: '',
  });

  const [formReprogramar, setFormReprogramar] = useState({
    fecha: hoyStr,
    horarioIndex: '0',
    motivoReprogramacion: '',
  });

  const [formEditarPaciente, setFormEditarPaciente] = useState({
    dni: '',
    nombres: '',
    apellidos: '',
    telefono: '',
    direccion: '',
    fechaNacimiento: '',
  });

  const [formAsignarPaquete, setFormAsignarPaquete] = useState({
    paqueteId: '',
    precioPagado: 280,
    metodoPago: 'Yape / Plin',
  });

  useEffect(() => {
    const usuarioGuardado = localStorage.getItem('axioma_usuario');
    if (!usuarioGuardado) {
      router.push('/login');
      return;
    }
    const u = JSON.parse(usuarioGuardado);
    if (u.rol !== 'RECEPCIONISTA' && u.rol !== 'ADMINISTRADOR') {
      if (u.rol === 'PACIENTE') router.push('/paciente');
      else if (u.rol === 'PSICOLOGO') router.push('/psicologo');
      else router.push('/login');
      return;
    }
    setUsuario(u);
    cargarDatos();
  }, []);

  const cargarDatos = async (fechaFiltro = filtroFechaCitas) => {
    setCargando(true);
    try {
      const urlCitas = fechaFiltro ? `/citas?fecha=${fechaFiltro}` : '/citas';
      const [dataCitas, dataTodasCitas, dataPsicos, dataPacientes, dataPaquetes] = await Promise.all([
        apiFetch(urlCitas),
        apiFetch('/citas'),
        apiFetch('/psicologos'),
        apiFetch('/pacientes'),
        apiFetch('/paquetes/catalogo'),
      ]);
      setCitas(dataCitas || []);
      setTodasLasCitas(dataTodasCitas || []);
      setPsicologos(dataPsicos || []);
      setPacientes(dataPacientes || []);
      setCatalogoPaquetes(dataPaquetes || []);
    } catch (err) {
      console.error('Error al cargar datos en recepción:', err);
    } finally {
      setCargando(false);
    }
  };

  const cerrarSesion = () => {
    localStorage.removeItem('axioma_token');
    localStorage.removeItem('axioma_usuario');
    router.push('/login');
  };

  // Helper: Comprobar si un slot está ocupado por el psicólogo en esa fecha
  const esSlotOcupado = (psicologoId: string, fecha: string, horaInicioStr: string, excludeCitaId?: string) => {
    if (!psicologoId || !fecha || !horaInicioStr) return false;
    const fuenteCitas = todasLasCitas && todasLasCitas.length > 0 ? todasLasCitas : citas;
    return fuenteCitas.some((c) => {
      if (c.estado === 'CANCELADA' || c.estado === 'REPROGRAMADA') return false;
      if (excludeCitaId && c.id === excludeCitaId) return false;
      if (c.psicologoId !== psicologoId) return false;

      const cFechaLocal = fechaYmdLocal(c.fechaHoraInicio);
      const cHoraLocal = horaHmLocal(c.fechaHoraInicio);
      return cFechaLocal === fecha && cHoraLocal === horaInicioStr;
    });
  };

  // --- ACCIONES DE CITAS (RECEPCIÓN) ---
  const handleMarcarAsistencia = async (c: any) => {
    if (!confirm('¿Desea registrar asistencia para esta sesión? Se descontará automáticamente 1 sesión del paquete.')) return;
    try {
      await apiFetch(`/citas/${c.id}/asistencia`, { method: 'PATCH' });
      toast.success('Asistencia registrada y sesión consumida.');
      cargarDatos();
    } catch (err: any) {
      toast.error(err.message || 'Error al marcar asistencia');
    }
  };

  const handleMarcarNoAsistio = async (c: any) => {
    if (!confirm('¿Confirmas que el paciente no asistió a su cita programada?')) return;
    try {
      await apiFetch(`/citas/${c.id}/no-asistio`, { method: 'PATCH' });
      toast.success('Inasistencia (No-Show) registrada.');
      cargarDatos();
    } catch (err: any) {
      toast.error(err.message || 'Error al registrar inasistencia');
    }
  };

  const handleCancelarCita = async (c: any) => {
    const motivo = prompt('Ingrese el motivo de la cancelación de la cita:');
    if (motivo === null) return;
    try {
      await apiFetch(`/citas/${c.id}/cancelar`, {
        method: 'PATCH',
        body: JSON.stringify({ motivo: motivo || 'Cancelada en recepción' }),
      });
      toast.success('Cita cancelada.');
      cargarDatos();
    } catch (err: any) {
      toast.error(err.message || 'Error al cancelar cita');
    }
  };

  const handleCrearCita = async (e: React.FormEvent) => {
    e.preventDefault();
    const bloques = generarHorariosDisponibles(formCita.fecha);
    const bloque = bloques[parseInt(formCita.horarioIndex)] || bloques[0];
    if (!bloque) {
      toast.warning('La fecha seleccionada no tiene horarios hábiles disponibles (clínica cerrada).');
      return;
    }

    const fechaHoraInicio = `${formCita.fecha}T${bloque.inicio}:00`;
    const fechaHoraFin = `${formCita.fecha}T${bloque.fin}:00`;

    if (new Date(fechaHoraInicio) < new Date()) {
      toast.warning('No se puede agendar una cita en una fecha u hora que ya ha pasado.');
      return;
    }

    if (esSlotOcupado(formCita.psicologoId, formCita.fecha, bloque.inicio)) {
      toast.warning('El horario seleccionado ya se encuentra ocupado por otra cita con el terapeuta.');
      return;
    }

    try {
      await apiFetch('/citas', {
        method: 'POST',
        body: JSON.stringify({
          pacienteId: formCita.pacienteId,
          psicologoId: formCita.psicologoId,
          fechaHoraInicio,
          fechaHoraFin,
          motivoConsulta: formCita.motivoConsulta || 'Consulta terapéutica',
        }),
      });
      toast.success('Cita agendada exitosamente.');
      setMostrarModalCita(false);
      setFormCita({
        pacienteId: '',
        psicologoId: '',
        fecha: hoyStr,
        horarioIndex: '0',
        motivoConsulta: '',
      });
      cargarDatos();
    } catch (err: any) {
      toast.error(err.message || 'Error al agendar cita');
    }
  };

  const abrirModalReprogramar = (cita: any) => {
    setCitaSeleccionadaParaReprog(cita);
    const fechaActual = cita.fechaHoraInicio.split('T')[0];
    setFormReprogramar({
      fecha: fechaActual >= hoyStr ? fechaActual : hoyStr,
      horarioIndex: '0',
      motivoReprogramacion: '',
    });
    setMostrarModalReprogramar(true);
  };

  const handleReprogramarCita = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!citaSeleccionadaParaReprog) return;
    const bloques = generarHorariosDisponibles(formReprogramar.fecha);
    const bloque = bloques[parseInt(formReprogramar.horarioIndex)] || bloques[0];
    if (!bloque) {
      toast.warning('La fecha seleccionada no tiene horarios disponibles en la clínica.');
      return;
    }

    const nuevaFechaHoraInicio = `${formReprogramar.fecha}T${bloque.inicio}:00`;
    const nuevaFechaHoraFin = `${formReprogramar.fecha}T${bloque.fin}:00`;

    if (new Date(nuevaFechaHoraInicio) < new Date()) {
      toast.warning('No se puede reprogramar la cita a una fecha u hora pasada.');
      return;
    }

    if (esSlotOcupado(citaSeleccionadaParaReprog.psicologoId, formReprogramar.fecha, bloque.inicio, citaSeleccionadaParaReprog.id)) {
      toast.warning('El horario seleccionado ya está reservado por otra cita.');
      return;
    }

    try {
      await apiFetch(`/citas/${citaSeleccionadaParaReprog.id}/reprogramar`, {
        method: 'PUT',
        body: JSON.stringify({
          nuevaFechaHoraInicio,
          nuevaFechaHoraFin,
          motivoReprogramacion: formReprogramar.motivoReprogramacion || 'Reprogramación en recepción',
        }),
      });
      toast.success('Cita reprogramada exitosamente.');
      setMostrarModalReprogramar(false);
      cargarDatos();
    } catch (err: any) {
      toast.error(err.message || 'Error al reprogramar la cita');
    }
  };

  // --- MODIFICAR DATOS DEL PACIENTE (HU-06) ---
  const abrirModalEditarPaciente = (paciente: any) => {
    setPacienteSeleccionadoParaEditar(paciente);
    setFormEditarPaciente({
      dni: paciente.dni || '',
      nombres: paciente.nombres || '',
      apellidos: paciente.apellidos || '',
      telefono: paciente.telefono || '',
      direccion: paciente.direccion || '',
      fechaNacimiento: paciente.fechaNacimiento ? paciente.fechaNacimiento.split('T')[0] : '',
    });
    setMostrarModalEditarPaciente(true);
  };

  const handleActualizarPaciente = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pacienteSeleccionadoParaEditar) return;
    try {
      await apiFetch(`/pacientes/${pacienteSeleccionadoParaEditar.id}`, {
        method: 'PUT',
        body: JSON.stringify(formEditarPaciente),
      });
      toast.success('Datos del paciente actualizados correctamente.');
      setMostrarModalEditarPaciente(false);
      cargarDatos();
    } catch (err: any) {
      toast.error(err.message || 'Error al actualizar paciente');
    }
  };

  // --- ASIGNAR PAQUETE A PACIENTE (HU-09) ---
  const abrirModalAsignarPaquete = (paciente: any) => {
    setPacienteSeleccionadoParaPaquete(paciente);
    const primerPkg = catalogoPaquetes[0];
    setFormAsignarPaquete({
      paqueteId: primerPkg ? primerPkg.id : '',
      precioPagado: primerPkg ? Number(primerPkg.precio) : 280,
      metodoPago: 'Yape / Plin',
    });
    setMostrarModalAsignarPaquete(true);
  };

  const handleAsignarPaquete = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pacienteSeleccionadoParaPaquete) return;
    try {
      await apiFetch('/paquetes/asignar', {
        method: 'POST',
        body: JSON.stringify({
          pacienteId: pacienteSeleccionadoParaPaquete.id,
          paqueteId: formAsignarPaquete.paqueteId,
          precioPagado: Number(formAsignarPaquete.precioPagado),
          metodoPago: formAsignarPaquete.metodoPago,
        }),
      });
      toast.success('Paquete terapéutico asignado exitosamente al paciente.');
      setMostrarModalAsignarPaquete(false);
      cargarDatos();
    } catch (err: any) {
      toast.error(err.message || 'Error al asignar paquete');
    }
  };

  // Filtros en memoria
  const pacientesFiltrados = pacientes.filter((p) => {
    if (!filtroDniPaciente.trim()) return true;
    return (
      p.dni.toLowerCase().includes(filtroDniPaciente.toLowerCase()) ||
      p.nombres.toLowerCase().includes(filtroDniPaciente.toLowerCase()) ||
      p.apellidos.toLowerCase().includes(filtroDniPaciente.toLowerCase())
    );
  });

  const pestanas: { id: Tab; Icono: typeof Calendar; texto: string }[] = [
    { id: 'agenda', Icono: Calendar, texto: 'Agenda Central & Citas' },
    { id: 'pacientes', Icono: Users, texto: 'Directorio de Pacientes' },
    { id: 'paquetes', Icono: PackageCheck, texto: 'Catálogo de Paquetes' },
  ];

  const citasAtendidas = citas.filter((c) => c.estado === 'ATENDIDA').length;

  return (
    <div className="flex min-h-screen flex-col bg-axioma-50 font-sans text-axiomaText-ink antialiased selection:bg-axioma-200 lg:flex-row">

      {/* SIDEBAR */}
      <aside className="flex shrink-0 flex-col gap-4 bg-axioma-900 p-4 text-white lg:sticky lg:top-0 lg:h-screen lg:w-72 lg:justify-between lg:gap-0 lg:p-6">
        <div>
          <div className="flex items-center justify-between">
            <LogoAxioma oscuro subtitulo="Módulo de Recepción" />
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
            aria-label="Secciones de recepción"
          >
            {pestanas.map(({ id, Icono, texto }) => (
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
                Atención y Recepción
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

          {/* Cabecera */}
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="font-display text-2xl font-medium tracking-heading text-axiomaText-ink sm:text-3xl">
                {tabActiva === 'agenda' && 'Agenda de Recepción & Citas'}
                {tabActiva === 'pacientes' && 'Directorio de Pacientes'}
                {tabActiva === 'paquetes' && 'Catálogo de Paquetes Terapéuticos'}
              </h1>
              <p className="mt-1 text-sm text-axiomaText-soft">
                Gestión operativa diaria: agendamiento de citas, asignación de paquetes y registro de asistencia.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <button onClick={() => cargarDatos()} title="Actualizar datos" aria-label="Actualizar datos" className={btnIcono}>
                <RefreshCw className={`h-4 w-4 ${cargando ? 'animate-spin motion-reduce:animate-none' : ''}`} />
              </button>

              {tabActiva === 'agenda' && (
                <button onClick={() => setMostrarModalCita(true)} className={`${btnPrimary} ${tamMd}`}>
                  <Plus className="h-4 w-4" />
                  <span>Agendar cita</span>
                </button>
              )}
            </div>
          </div>

          {/* ----------------- TAB: AGENDA ----------------- */}
          {tabActiva === 'agenda' && (
            <div className="mt-6 space-y-4">
              {/* Barra de Filtros */}
              <div className="flex flex-col gap-3 rounded-card border border-axioma-200/80 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-xs font-semibold uppercase tracking-wider text-axiomaText-soft">Filtrar fecha:</span>
                  <input
                    type="date"
                    value={filtroFechaCitas}
                    onChange={(e) => {
                      setFiltroFechaCitas(e.target.value);
                      cargarDatos(e.target.value);
                    }}
                    className="rounded-input border border-axioma-200 bg-white px-3 py-1.5 text-xs text-axiomaText-ink shadow-input focus:border-axioma-600 focus:outline-none"
                  />
                  {filtroFechaCitas && (
                    <button
                      onClick={() => {
                        setFiltroFechaCitas('');
                        cargarDatos('');
                      }}
                      className="text-xs font-medium text-axioma-700 hover:underline"
                    >
                      Ver todas
                    </button>
                  )}
                </div>
                <div className="text-xs text-axiomaText-soft">
                  Total citas: <strong className="text-axiomaText-ink">{citas.length}</strong> ({citasAtendidas} atendidas)
                </div>
              </div>

              {/* Tabla de Citas */}
              <div className={`${card} overflow-hidden`}>
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[850px] text-left text-sm text-axiomaText-soft">
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
                            {cargando ? 'Cargando agenda...' : 'No se encontraron citas para la fecha seleccionada.'}
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
                              <div className="flex items-center justify-end gap-1.5">
                                {c.estado === 'PROGRAMADA' && (
                                  <>
                                    <button
                                      onClick={() => handleMarcarAsistencia(c)}
                                      title="Marcar asistencia y consumir sesión"
                                      className={`${btnPrimary} px-2.5 py-1.5 text-xs`}
                                    >
                                      Asistencia
                                    </button>
                                    <button
                                      onClick={() => abrirModalReprogramar(c)}
                                      title="Reprogramar fecha u hora"
                                      className={`${btnSecondary} px-2.5 py-1.5 text-xs`}
                                    >
                                      Reprogramar
                                    </button>
                                    <button
                                      onClick={() => handleMarcarNoAsistio(c)}
                                      title="Registrar inasistencia (No-Show)"
                                      className="rounded-button border border-amber-300 bg-amber-50 px-2 py-1.5 text-xs font-medium text-amber-800 transition hover:bg-amber-100"
                                    >
                                      No asistió
                                    </button>
                                    <button
                                      onClick={() => handleCancelarCita(c)}
                                      title="Cancelar cita"
                                      className="rounded-button border border-rose-200 bg-rose-50 px-2 py-1.5 text-xs font-medium text-rose-700 transition hover:bg-rose-100"
                                    >
                                      Cancelar
                                    </button>
                                  </>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ----------------- TAB: PACIENTES ----------------- */}
          {tabActiva === 'pacientes' && (
            <div className="mt-6 space-y-4">
              <div className={`${card} flex items-center gap-3 p-4`}>
                <Search className="h-5 w-5 text-axiomaText-soft" />
                <input
                  type="text"
                  placeholder="Buscar paciente por DNI o nombres completos..."
                  value={filtroDniPaciente}
                  onChange={(e) => setFiltroDniPaciente(e.target.value)}
                  className="w-full bg-transparent text-sm text-axiomaText-ink outline-none placeholder:text-axiomaText-soft"
                />
                {filtroDniPaciente && (
                  <button onClick={() => setFiltroDniPaciente('')} className="text-xs text-axiomaText-soft hover:text-axiomaText-ink">
                    Limpiar
                  </button>
                )}
              </div>

              <div className={`${card} overflow-hidden`}>
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[850px] text-left text-sm text-axiomaText-soft">
                    <thead className="border-b border-axioma-100 bg-axioma-50">
                      <tr>
                        <th className={thClase}>DNI</th>
                        <th className={thClase}>Nombres y apellidos</th>
                        <th className={thClase}>Contacto</th>
                        <th className={thClase}>Paquete activo</th>
                        <th className={thClase}>Sesiones disponibles</th>
                        <th className={`${thClase} text-right`}>Acciones</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-axioma-100">
                      {pacientesFiltrados.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="px-6 py-12 text-center text-axiomaText-soft">
                            No se encontraron pacientes registrados con ese criterio.
                          </td>
                        </tr>
                      ) : (
                        pacientesFiltrados.map((pac) => {
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
                                  <span className="text-xs text-axiomaText-soft">Sin paquete asignado</span>
                                )}
                              </td>
                              <td className={tdClase}>
                                {paqueteActivo ? (
                                  <span className={`${pastilla} bg-axioma-100 text-axioma-800`}>
                                    {paqueteActivo.sesionesRestantes} sesiones
                                  </span>
                                ) : (
                                  <span className="text-xs">0</span>
                                )}
                              </td>
                              <td className={`${tdClase} text-right`}>
                                <div className="flex items-center justify-end gap-2">
                                  <button
                                    onClick={() => abrirModalEditarPaciente(pac)}
                                    title="Modificar datos del paciente"
                                    className={`${btnSecondary} px-3 py-1.5 text-xs`}
                                  >
                                    Editar
                                  </button>
                                  <button
                                    onClick={() => abrirModalAsignarPaquete(pac)}
                                    title="Asignar paquete prepagado"
                                    className={`${btnPrimary} px-3 py-1.5 text-xs`}
                                  >
                                    + Paquete
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ----------------- TAB: PAQUETES ----------------- */}
          {tabActiva === 'paquetes' && (
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

      {/* ========================================================================= */}
      {/* MODAL 1: AGENDAR CITA */}
      {/* ========================================================================= */}
      {mostrarModalCita && (
        <div className={modalOverlay}>
          <div className={modalWrap}>
            <div className={`${modalCard} max-w-lg`} role="dialog" aria-modal="true">
              <h3 className="font-display text-2xl font-medium tracking-heading text-axiomaText-ink">
                Agendar cita en recepción
              </h3>
              <p className="mt-1 text-sm leading-relaxed text-axiomaText-soft">
                Horario: Lun-Vie (9am-6pm) | Sáb (9am-1pm). Intervalos de 50 minutos.
              </p>

              <form onSubmit={handleCrearCita} className="mt-6 space-y-4">
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
                  <label htmlFor="psicologoId" className={label}>Terapeuta colegiado</label>
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
                    <label htmlFor="horarioSelect" className={label}>Horario de sesión (50 min)</label>
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
                  <label htmlFor="motivo" className={label}>Motivo de consulta</label>
                  <input
                    id="motivo"
                    type="text"
                    placeholder="Ej. Terapia psicológica de seguimiento"
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

      {/* ========================================================================= */}
      {/* MODAL 2: REPROGRAMAR CITA */}
      {/* ========================================================================= */}
      {mostrarModalReprogramar && citaSeleccionadaParaReprog && (
        <div className={modalOverlay}>
          <div className={modalWrap}>
            <div className={`${modalCard} max-w-lg`} role="dialog" aria-modal="true">
              <h3 className="font-display text-2xl font-medium tracking-heading text-axiomaText-ink">
                Reprogramar cita médica
              </h3>
              <p className="mt-1 text-sm leading-relaxed text-axiomaText-soft">
                Paciente: <span className="font-semibold text-axiomaText-ink">{citaSeleccionadaParaReprog.paciente?.nombres} {citaSeleccionadaParaReprog.paciente?.apellidos}</span>
              </p>

              <form onSubmit={handleReprogramarCita} className="mt-5 space-y-4">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label htmlFor="fechaReprog" className={label}>Nueva fecha</label>
                    <input
                      id="fechaReprog"
                      type="date"
                      required
                      min={hoyStr}
                      value={formReprogramar.fecha}
                      onChange={(e) => setFormReprogramar({ ...formReprogramar, fecha: e.target.value, horarioIndex: '0' })}
                      className={input}
                    />
                  </div>
                  <div>
                    <label htmlFor="horarioReprog" className={label}>Nuevo horario (50 min)</label>
                    <select
                      id="horarioReprog"
                      value={formReprogramar.horarioIndex}
                      onChange={(e) => setFormReprogramar({ ...formReprogramar, horarioIndex: e.target.value })}
                      className={input}
                    >
                      {generarHorariosDisponibles(formReprogramar.fecha).map((h, i) => {
                        const ocupado = esSlotOcupado(
                          citaSeleccionadaParaReprog.psicologoId,
                          formReprogramar.fecha,
                          h.inicio,
                          citaSeleccionadaParaReprog.id
                        );
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
                  <label htmlFor="motivoReprog" className={label}>Motivo de reprogramación</label>
                  <input
                    id="motivoReprog"
                    type="text"
                    required
                    placeholder="Ej. Solicitud del paciente por motivos laborales"
                    value={formReprogramar.motivoReprogramacion}
                    onChange={(e) => setFormReprogramar({ ...formReprogramar, motivoReprogramacion: e.target.value })}
                    className={input}
                  />
                </div>

                <div className="flex flex-col-reverse gap-3 border-t border-axioma-100 pt-5 sm:flex-row sm:justify-end">
                  <button type="button" onClick={() => setMostrarModalReprogramar(false)} className={`${btnSecondary} ${tamMd}`}>
                    Cancelar
                  </button>
                  <button type="submit" className={`${btnPrimary} ${tamMd}`}>
                    Confirmar reprogramación
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 3: MODIFICAR DATOS DEL PACIENTE (HU-06) */}
      {/* ========================================================================= */}
      {mostrarModalEditarPaciente && (
        <div className={modalOverlay}>
          <div className={modalWrap}>
            <div className={`${modalCard} max-w-lg`} role="dialog" aria-modal="true">
              <h3 className="font-display text-2xl font-medium tracking-heading text-axiomaText-ink">
                Modificar ficha de paciente
              </h3>
              <p className="mt-1 text-sm text-axiomaText-soft">
                Actualiza los datos personales y de contacto del paciente.
              </p>

              <form onSubmit={handleActualizarPaciente} className="mt-5 space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={label}>DNI (identificador)</label>
                    <input
                      type="text"
                      disabled
                      value={formEditarPaciente.dni}
                      className={`${input} bg-axioma-50 font-mono`}
                    />
                  </div>
                  <div>
                    <label className={label}>Teléfono</label>
                    <input
                      type="text"
                      value={formEditarPaciente.telefono}
                      onChange={(e) => setFormEditarPaciente({ ...formEditarPaciente, telefono: e.target.value })}
                      className={input}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={label}>Nombres</label>
                    <input
                      type="text"
                      required
                      value={formEditarPaciente.nombres}
                      onChange={(e) => setFormEditarPaciente({ ...formEditarPaciente, nombres: e.target.value })}
                      className={input}
                    />
                  </div>
                  <div>
                    <label className={label}>Apellidos</label>
                    <input
                      type="text"
                      required
                      value={formEditarPaciente.apellidos}
                      onChange={(e) => setFormEditarPaciente({ ...formEditarPaciente, apellidos: e.target.value })}
                      className={input}
                    />
                  </div>
                </div>

                <div>
                  <label className={label}>Dirección</label>
                  <input
                    type="text"
                    value={formEditarPaciente.direccion}
                    onChange={(e) => setFormEditarPaciente({ ...formEditarPaciente, direccion: e.target.value })}
                    className={input}
                  />
                </div>

                <div className="flex flex-col-reverse gap-3 border-t border-axioma-100 pt-5 sm:flex-row sm:justify-end">
                  <button type="button" onClick={() => setMostrarModalEditarPaciente(false)} className={`${btnSecondary} ${tamMd}`}>
                    Cancelar
                  </button>
                  <button type="submit" className={`${btnPrimary} ${tamMd}`}>
                    Actualizar paciente
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 4: ASIGNAR PAQUETE A PACIENTE (HU-09) */}
      {/* ========================================================================= */}
      {mostrarModalAsignarPaquete && pacienteSeleccionadoParaPaquete && (
        <div className={modalOverlay}>
          <div className={modalWrap}>
            <div className={`${modalCard} max-w-lg`} role="dialog" aria-modal="true">
              <h3 className="font-display text-2xl font-medium tracking-heading text-axiomaText-ink">
                Asignar paquete terapéutico
              </h3>
              <p className="mt-1 text-sm text-axiomaText-soft">
                Paciente: <span className="font-semibold text-axiomaText-ink">{pacienteSeleccionadoParaPaquete.nombres} {pacienteSeleccionadoParaPaquete.apellidos}</span>
              </p>

              <form onSubmit={handleAsignarPaquete} className="mt-5 space-y-4">
                <div>
                  <label className={label}>Seleccionar paquete</label>
                  <select
                    required
                    value={formAsignarPaquete.paqueteId}
                    onChange={(e) => {
                      const id = e.target.value;
                      const sel = catalogoPaquetes.find((p) => p.id === id);
                      setFormAsignarPaquete({
                        ...formAsignarPaquete,
                        paqueteId: id,
                        precioPagado: sel ? Number(sel.precio) : 0,
                      });
                    }}
                    className={input}
                  >
                    <option value="">Seleccione paquete del catálogo...</option>
                    {catalogoPaquetes.map((p) => (
                      <option key={p.id} value={p.id}>{p.nombre} ({p.cantidadSesiones} sesiones - S/. {p.precio})</option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={label}>Monto pagado (S/.)</label>
                    <input
                      type="number"
                      required
                      value={formAsignarPaquete.precioPagado}
                      onChange={(e) => setFormAsignarPaquete({ ...formAsignarPaquete, precioPagado: Number(e.target.value) })}
                      className={input}
                    />
                  </div>
                  <div>
                    <label className={label}>Método de pago</label>
                    <select
                      value={formAsignarPaquete.metodoPago}
                      onChange={(e) => setFormAsignarPaquete({ ...formAsignarPaquete, metodoPago: e.target.value })}
                      className={input}
                    >
                      <option value="Yape / Plin">Yape / Plin</option>
                      <option value="Transferencia BCP/BBVA">Transferencia BCP/BBVA</option>
                      <option value="Efectivo en recepción">Efectivo en recepción</option>
                      <option value="Tarjeta débito/crédito">Tarjeta débito/crédito</option>
                    </select>
                  </div>
                </div>

                <div className="flex flex-col-reverse gap-3 border-t border-axioma-100 pt-5 sm:flex-row sm:justify-end">
                  <button type="button" onClick={() => setMostrarModalAsignarPaquete(false)} className={`${btnSecondary} ${tamMd}`}>
                    Cancelar
                  </button>
                  <button type="submit" className={`${btnPrimary} ${tamMd}`}>
                    Asignar paquete
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
