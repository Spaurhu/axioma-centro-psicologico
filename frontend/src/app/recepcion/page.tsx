'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import {
  Users, Calendar, Video, List, CalendarDays, ChevronLeft, ChevronRight, PackageCheck, Plus, LogOut,
  RefreshCw, Search, Clock, CheckCircle2, XCircle, CalendarClock, CreditCard, X, Bell
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
  const [citaParaRecordatorio, setCitaParaRecordatorio] = useState<any>(null);
  const [enviandoRecordatorio, setEnviandoRecordatorio] = useState(false);

  const [mostrarModalNuevoPaciente, setMostrarModalNuevoPaciente] = useState(false);
  const [mostrarModalEditarPaciente, setMostrarModalEditarPaciente] = useState(false);
  const [formNuevoPaciente, setFormNuevoPaciente] = useState({
    dni: '',
    nombres: '',
    apellidos: '',
    telefono: '',
    correo: '',
    direccion: '',
  });
  const [pacienteSeleccionadoParaEditar, setPacienteSeleccionadoParaEditar] = useState<any>(null);

  const [mostrarModalAsignarPaquete, setMostrarModalAsignarPaquete] = useState(false);
  const [pacienteSeleccionadoParaPaquete, setPacienteSeleccionadoParaPaquete] = useState<any>(null);

  const [mostrarModalPago, setMostrarModalPago] = useState(false);
  const [paqueteSeleccionadoParaPago, setPaqueteSeleccionadoParaPago] = useState<any>(null);
  const [pacienteSeleccionadoParaPago, setPacienteSeleccionadoParaPago] = useState<any>(null);
  const [guardandoPago, setGuardandoPago] = useState(false);
  const [formPago, setFormPago] = useState({
    monto: 0,
    metodoPago: 'Efectivo en recepción',
    notas: '',
  });

  const hoyStr = new Date().toISOString().split('T')[0];

  // Vista Agenda: Lista vs Calendario
  const [vistaAgenda, setVistaAgenda] = useState<'lista' | 'calendario'>('lista');
  const [fechaSemanaCalendario, setFechaSemanaCalendario] = useState<Date>(() => {
    const d = new Date();
    const dia = d.getDay();
    const diff = d.getDate() - dia + (dia === 0 ? -6 : 1);
    const lunes = new Date(d.setDate(diff));
    lunes.setHours(0, 0, 0, 0);
    return lunes;
  });
  const diasSemanaCalendario = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(fechaSemanaCalendario);
    d.setDate(d.getDate() + i);
    return d;
  });
  const horasJornada = ['09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00'];
  const navegarSemana = (delta: number) => {
    setFechaSemanaCalendario((prev) => {
      const d = new Date(prev);
      d.setDate(d.getDate() + delta);
      return d;
    });
  };
  const irSemanaActual = () => {
    const d = new Date();
    const dia = d.getDay();
    const diff = d.getDate() - dia + (dia === 0 ? -6 : 1);
    const lunes = new Date(d.setDate(diff));
    lunes.setHours(0, 0, 0, 0);
    setFechaSemanaCalendario(lunes);
  };
  const [mostrarModalDetalle, setMostrarModalDetalle] = useState(false);
  const [citaSeleccionadaParaDetalle, setCitaSeleccionadaParaDetalle] = useState<any>(null);
  const abrirDetalleCita = (cita: any) => {
    setCitaSeleccionadaParaDetalle(cita);
    setMostrarModalDetalle(true);
  };

  // Formularios
  const [errorModalCita, setErrorModalCita] = useState<string | null>(null);
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

  const handleEnviarRecordatorio = async () => {
    if (!citaParaRecordatorio) return;
    setEnviandoRecordatorio(true);
    try {
      await apiFetch(`/citas/${citaParaRecordatorio.id}/recordatorio`, {
        method: 'POST',
      });
      toast.success('Recordatorio de confirmación enviado al paciente.');
      setCitaParaRecordatorio(null);
    } catch (err: any) {
      toast.error(err.message || 'Error al enviar recordatorio');
    } finally {
      setEnviandoRecordatorio(false);
    }
  };

  const handleCrearCita = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorModalCita(null);
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
      setErrorModalCita(null);
      setFormCita({
        pacienteId: '',
        psicologoId: '',
        fecha: hoyStr,
        horarioIndex: '0',
        motivoConsulta: '',
      });
      cargarDatos();
    } catch (err: any) {
      const msg = err.message || 'Error al agendar cita';
      setErrorModalCita(msg);
      toast.error(msg);
    }
  };

  const pacienteSeleccionadoCita = pacientes.find((p) => p.id === formCita.pacienteId);
  const paqueteActivoCita = pacienteSeleccionadoCita?.paquetesPaciente?.find(
    (pk: any) => pk.estado === 'ACTIVO' && pk.sesionesRestantes > 0
  );
  const paquetePendienteCita = !paqueteActivoCita
    ? pacienteSeleccionadoCita?.paquetesPaciente?.find((pk: any) => pk.estado === 'PENDIENTE_PAGO')
    : null;
  const psicologoVinculadoId = paqueteActivoCita?.psicologoId || '';
  const psicologoVinculadoObj = psicologoVinculadoId
    ? paqueteActivoCita?.psicologo || psicologos.find((ps) => ps.id === psicologoVinculadoId)
    : null;
  const nombrePsicologoVinculado = psicologoVinculadoObj
    ? `${psicologoVinculadoObj.nombres} ${psicologoVinculadoObj.apellidos || ''}`.trim()
    : 'asignado';

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

  // --- REGISTRAR NUEVO PACIENTE ---
  const handleCrearPaciente = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!/^[0-9]{8}$/.test(formNuevoPaciente.dni)) {
      toast.error('El DNI debe tener 8 dígitos numéricos');
      return;
    }
    if (!/^[0-9]{9}$/.test(formNuevoPaciente.telefono)) {
      toast.error('El teléfono debe tener 9 dígitos');
      return;
    }
    try {
      await apiFetch('/pacientes', {
        method: 'POST',
        body: JSON.stringify(formNuevoPaciente),
      });
      toast.success('Paciente registrado exitosamente.');
      setMostrarModalNuevoPaciente(false);
      setFormNuevoPaciente({
        dni: '',
        nombres: '',
        apellidos: '',
        telefono: '',
        correo: '',
        direccion: '',
      });
      cargarDatos();
    } catch (err: any) {
      toast.error(err.message || 'Error al registrar paciente');
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
      toast.success('Paquete asignado en estado PENDIENTE DE PAGO. Registra el pago para activarlo.');
      setMostrarModalAsignarPaquete(false);
      cargarDatos();
    } catch (err: any) {
      toast.error(err.message || 'Error al asignar paquete');
    }
  };

  // --- REGISTRAR PAGO DE PAQUETE (ACTIVACIÓN) ---
  const abrirModalRegistrarPago = (paquete: any, paciente: any) => {
    setPaqueteSeleccionadoParaPago(paquete);
    setPacienteSeleccionadoParaPago(paciente);
    setFormPago({
      monto: Number(paquete.paquete?.precio || 0),
      metodoPago: 'Efectivo en recepción',
      notas: '',
    });
    setMostrarModalPago(true);
  };

  const handleRegistrarPago = async (e: React.FormEvent) => {
    e.preventDefault();
    if (usuario?.rol !== 'RECEPCIONISTA' && usuario?.rol !== 'ADMINISTRADOR') {
      toast.error('Acción restringida al personal autorizado de recepción o administración.');
      return;
    }
    if (!paqueteSeleccionadoParaPago) return;
    setGuardandoPago(true);
    try {
      await apiFetch(`/paquetes/${paqueteSeleccionadoParaPago.id}/registrar-pago`, {
        method: 'PATCH',
        body: JSON.stringify({
          monto: Number(formPago.monto),
          metodoPago: formPago.metodoPago,
          notas: formPago.notas,
        }),
      });
      toast.success('Pago registrado exitosamente. El paquete ahora está ACTIVO.');
      setMostrarModalPago(false);
      cargarDatos();
    } catch (err: any) {
      toast.error(err.message || 'Error al registrar pago');
    } finally {
      setGuardandoPago(false);
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

              {tabActiva === 'pacientes' && (
                <button onClick={() => setMostrarModalNuevoPaciente(true)} className={`${btnPrimary} ${tamMd}`}>
                  <Plus className="h-4 w-4" />
                  <span>Nuevo paciente</span>
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
                {/* Selector Vista Lista vs Vista Calendario */}
                <div className="flex items-center gap-3">
                  <div className="text-xs text-axiomaText-soft hidden sm:block">
                    Total: <strong className="text-axiomaText-ink">{citas.length}</strong> ({citasAtendidas} atendidas)
                  </div>
                  <div className="flex items-center rounded-lg border border-axioma-200 bg-axioma-50/70 p-1">
                    <button
                      type="button"
                      onClick={() => setVistaAgenda('lista')}
                      className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold transition ${vistaAgenda === 'lista' ? 'bg-white text-axiomaText-ink shadow-sm' : 'text-axiomaText-soft hover:text-axiomaText-ink'}`}
                    >
                      <List className="h-3.5 w-3.5" />
                      <span>Vista Lista</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setVistaAgenda('calendario')}
                      className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold transition ${vistaAgenda === 'calendario' ? 'bg-white text-axiomaText-ink shadow-sm' : 'text-axiomaText-soft hover:text-axiomaText-ink'}`}
                    >
                      <CalendarDays className="h-3.5 w-3.5" />
                      <span>Vista Calendario</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* VISTA LISTA */}
              {vistaAgenda === 'lista' && (
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
                              <div className="flex flex-wrap items-center justify-end gap-1.5">
                                {c.nivelRiesgoInasistencia === 'ALTO' && (
                                  <button
                                    type="button"
                                    onClick={() => setCitaParaRecordatorio(c)}
                                    title="Alto riesgo de inasistencia: enviar recordatorio manual"
                                    className="inline-flex items-center gap-1 rounded-button border border-amber-300 bg-amber-100 px-2.5 py-1.5 text-xs font-medium text-amber-800 transition hover:bg-amber-200/80"
                                  >
                                    <Bell className="h-3.5 w-3.5" />
                                    <span>Recordar</span>
                                  </button>
                                )}
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
            )}

              {/* VISTA CALENDARIO SEMANAL */}
              {vistaAgenda === 'calendario' && (
                <div className={`${card} p-5 space-y-4`}>
                  {/* Cabecera de Navegación de Semana */}
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-axioma-100 pb-4">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => navegarSemana(-7)}
                        className={`${btnSecondary} p-2 text-xs`}
                        title="Semana anterior"
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => irSemanaActual()}
                        className={`${btnSecondary} px-3 py-1.5 text-xs font-semibold`}
                      >
                        Semana actual
                      </button>
                      <button
                        type="button"
                        onClick={() => navegarSemana(7)}
                        className={`${btnSecondary} p-2 text-xs`}
                        title="Semana siguiente"
                      >
                        <ChevronRight className="h-4 w-4" />
                      </button>
                      <span className="font-display text-sm font-semibold text-axiomaText-ink ml-2">
                        {diasSemanaCalendario[0].toLocaleDateString('es-PE', { day: 'numeric', month: 'short' })} — {diasSemanaCalendario[6].toLocaleDateString('es-PE', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </span>
                    </div>

                    {/* Leyenda de Colores */}
                    <div className="flex flex-wrap items-center gap-3 text-xs">
                      <span className="flex items-center gap-1.5 text-axiomaText-soft">
                        <span className="h-3 w-3 rounded-sm border border-emerald-400 bg-emerald-100" />
                        <span>Atendida</span>
                      </span>
                      <span className="flex items-center gap-1.5 text-axiomaText-soft">
                        <span className="h-3 w-3 rounded-sm border border-blue-400 bg-blue-100" />
                        <span>Programada Presencial</span>
                      </span>
                      <span className="flex items-center gap-1.5 text-axiomaText-soft">
                        <span className="h-3 w-3 rounded-sm border border-sky-400 bg-sky-100 ring-1 ring-sky-300" />
                        <span>Programada Virtual</span>
                      </span>
                      <span className="flex items-center gap-1.5 text-axiomaText-soft">
                        <span className="h-3 w-3 rounded-sm border border-rose-400 bg-rose-100" />
                        <span>Cancelada / No asistió</span>
                      </span>
                    </div>
                  </div>

                  {/* Grilla Semanal */}
                  <div className="overflow-x-auto">
                    <div className="min-w-[900px]">
                      {/* Cabecera de Días (7 columnas) */}
                      <div className="grid grid-cols-8 border-b border-axioma-200 text-center text-xs font-semibold">
                        <div className="p-2.5 text-axiomaText-soft border-r border-axioma-100 bg-slate-50/70">Hora</div>
                        {diasSemanaCalendario.map((dia, idx) => {
                          const esHoy = fechaYmdLocal(dia.toISOString()) === hoyStr;
                          const nombresDias = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
                          return (
                            <div
                              key={idx}
                              className={`p-2.5 border-r border-axioma-100 last:border-r-0 ${
                                esHoy ? 'bg-axioma-100/70 text-axioma-900 font-bold' : 'text-axiomaText-ink bg-slate-50/40'
                              }`}
                            >
                              <div>{nombresDias[idx]}</div>
                              <div className={`mt-0.5 text-[11px] font-normal ${esHoy ? 'text-axioma-800 font-bold' : 'text-axiomaText-soft'}`}>
                                {dia.toLocaleDateString('es-PE', { day: 'numeric', month: 'short' })}
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      {/* Filas de Horas */}
                      {horasJornada.map((horaStr) => (
                        <div key={horaStr} className="grid grid-cols-8 border-b border-axioma-100 min-h-[82px]">
                          {/* Etiqueta de Hora */}
                          <div className="p-2 border-r border-axioma-100 text-[11px] font-medium text-axiomaText-soft flex items-start justify-center bg-slate-50/50">
                            {horaStr}
                          </div>

                          {/* Celdas de cada día */}
                          {diasSemanaCalendario.map((diaDate, colIdx) => {
                            const diaYmd = fechaYmdLocal(diaDate.toISOString());
                            const fuente = todasLasCitas && todasLasCitas.length > 0 ? todasLasCitas : citas;
                            const citasEnSlot = fuente.filter((c) => {
                              const cYmd = fechaYmdLocal(c.fechaHoraInicio);
                              const cHor = horaHmLocal(c.fechaHoraInicio);
                              return cYmd === diaYmd && cHor.startsWith(horaStr.slice(0, 2));
                            });

                            return (
                              <div
                                key={colIdx}
                                className="p-1 border-r border-axioma-100 last:border-r-0 space-y-1 bg-white hover:bg-slate-50/40 transition-colors"
                              >
                                {citasEnSlot.map((c) => {
                                  const esAtendida = c.estado === 'ATENDIDA';
                                  const esCancelada = c.estado === 'CANCELADA' || c.estado === 'NO_ASISTIO';
                                  const esVirtual = c.modalidad === 'VIRTUAL';

                                  let colorClase = 'border-blue-300 bg-blue-100/90 text-blue-950 hover:bg-blue-200';
                                  if (esAtendida) {
                                    colorClase = 'border-emerald-300 bg-emerald-100/90 text-emerald-950 hover:bg-emerald-200';
                                  } else if (esCancelada) {
                                    colorClase = 'border-rose-300 bg-rose-100/90 text-rose-950 hover:bg-rose-200';
                                  } else if (esVirtual) {
                                    colorClase = 'border-sky-300 bg-sky-100/90 text-sky-950 hover:bg-sky-200 ring-1 ring-sky-300';
                                  }

                                  return (
                                    <button
                                      key={c.id}
                                      type="button"
                                      onClick={() => abrirDetalleCita(c)}
                                      className={`w-full text-left p-1.5 rounded-lg border text-xs shadow-sm transition-transform hover:scale-[1.02] cursor-pointer ${colorClase}`}
                                    >
                                      <div className="font-bold truncate text-[11px] leading-tight">
                                        {c.paciente ? `${c.paciente.nombres} ${c.paciente.apellidos?.split(' ')[0]}` : 'Paciente'}
                                      </div>
                                      <div className="text-[10px] opacity-80 truncate">
                                        {c.psicologo?.nombres?.split(' ')[0]}
                                      </div>
                                      <div className="mt-1 flex items-center justify-between text-[9px] font-semibold opacity-90">
                                        <span>{horaCorta(c.fechaHoraInicio)}</span>
                                        {esVirtual ? <span className="text-sky-700 font-bold">Virtual</span> : <span>Presencial</span>}
                                      </div>
                                    </button>
                                  );
                                })}
                              </div>
                            );
                          })}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
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
                          const paquetes = pac.paquetesPaciente || [];
                          const paquetePendiente = paquetes.find((p: any) => p.estado === 'PENDIENTE_PAGO');
                          const paqueteActivo = paquetes.find((p: any) => p.estado === 'ACTIVO');
                          const paquetePrincipal = paquetePendiente || paqueteActivo || paquetes[0];

                          return (
                            <tr key={pac.id} className="transition-colors hover:bg-axioma-50">
                              <td className={`${tdClase} font-semibold tabular-nums text-axioma-700`}>{pac.dni}</td>
                              <td className={`${tdClase} font-semibold text-axiomaText-ink`}>{pac.nombres} {pac.apellidos}</td>
                              <td className={tdClase}>{pac.telefono || pac.correo || 'N/A'}</td>
                              <td className={tdClase}>
                                {paquetePrincipal ? (
                                  <div className="space-y-1">
                                    <span className="font-semibold text-axiomaText-ink block">
                                      {paquetePrincipal.paquete?.nombre}
                                    </span>
                                    {paquetePrincipal.estado === 'PENDIENTE_PAGO' && (
                                      <span className="inline-flex items-center gap-1 rounded-tag border border-amber-300 bg-amber-100 px-2 py-0.5 text-xs font-bold text-amber-900">
                                        <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse"></span>
                                        PENDIENTE PAGO
                                      </span>
                                    )}
                                    {paquetePrincipal.estado === 'ACTIVO' && (
                                      <span className="inline-flex items-center rounded-tag border border-emerald-300 bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-800">
                                        ACTIVO
                                      </span>
                                    )}
                                    {paquetePrincipal.estado === 'VENCIDO' && (
                                      <span className="inline-flex items-center rounded-tag border border-rose-300 bg-rose-50 px-2 py-0.5 text-xs font-semibold text-rose-800">
                                        VENCIDO
                                      </span>
                                    )}
                                  </div>
                                ) : (
                                  <span className="text-xs text-axiomaText-soft">Sin paquete asignado</span>
                                )}
                              </td>
                              <td className={tdClase}>
                                {paquetePrincipal?.estado === 'PENDIENTE_PAGO' ? (
                                  <span className="text-xs font-medium text-amber-800">
                                    Bloqueado ({paquetePrincipal.sesionesTotales} ses.)
                                  </span>
                                ) : paquetePrincipal?.estado === 'ACTIVO' ? (
                                  <span className={`${pastilla} bg-axioma-100 text-axioma-800`}>
                                    {paquetePrincipal.sesionesRestantes} sesiones
                                  </span>
                                ) : (
                                  <span className="text-xs">0</span>
                                )}
                              </td>
                              <td className={`${tdClase} text-right`}>
                                <div className="flex items-center justify-end gap-2">
                                  {(usuario?.rol === 'RECEPCIONISTA' || usuario?.rol === 'ADMINISTRADOR') && paquetePendiente && (
                                    <button
                                      onClick={() => abrirModalRegistrarPago(paquetePendiente, pac)}
                                      title="Registrar pago y activar paquete"
                                      className="flex items-center gap-1 rounded-button bg-amber-600 px-2.5 py-1.5 text-xs font-semibold text-white shadow-sm transition hover:bg-amber-700"
                                    >
                                      <CreditCard className="h-3.5 w-3.5" />
                                      <span>Registrar Pago</span>
                                    </button>
                                  )}
                                  <button
                                    onClick={() => abrirModalEditarPaciente(pac)}
                                    title="Modificar datos del paciente"
                                    className={`${btnSecondary} px-3 py-1.5 text-xs`}
                                  >
                                    Editar
                                  </button>
                                  <button
                                    onClick={() => abrirModalAsignarPaquete(pac)}
                                    title="Asignar paquete"
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
      {/* MODAL DETALLES DE CITA DESDE EL CALENDARIO (RECEPCIÓN) */}
      {/* ========================================================================= */}
      {mostrarModalDetalle && citaSeleccionadaParaDetalle && (
        <div className={modalOverlay}>
          <div className={modalWrap}>
            <div className={`${modalCard} max-w-lg`} role="dialog" aria-modal="true">
              <div className="flex items-start justify-between border-b border-axioma-100 pb-3">
                <div>
                  <span className={`inline-block mb-1 ${pastilla} ${claseEstadoCita(citaSeleccionadaParaDetalle.estado)}`}>
                    {citaSeleccionadaParaDetalle.estado}
                  </span>
                  <h3 className="font-display text-xl font-medium tracking-heading text-axiomaText-ink">
                    Ficha de Consulta Médica
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setMostrarModalDetalle(false)}
                  className="rounded-full p-1 text-axiomaText-soft hover:bg-slate-100"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="mt-4 space-y-3 text-sm">
                <div className="rounded-card-sm bg-slate-50 p-3.5 border border-slate-200 space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-axiomaText-soft font-semibold">Paciente:</span>
                    <span className="font-bold text-axiomaText-ink text-sm">
                      {citaSeleccionadaParaDetalle.paciente ? `${citaSeleccionadaParaDetalle.paciente.nombres} ${citaSeleccionadaParaDetalle.paciente.apellidos}` : 'Paciente'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-axiomaText-soft font-semibold">DNI:</span>
                    <span className="text-axiomaText-ink text-xs">{citaSeleccionadaParaDetalle.paciente?.dni || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-axiomaText-soft font-semibold">Terapeuta tratante:</span>
                    <span className="font-semibold text-axiomaText-ink text-xs">
                      {citaSeleccionadaParaDetalle.psicologo ? `${citaSeleccionadaParaDetalle.psicologo.nombres} ${citaSeleccionadaParaDetalle.psicologo.apellidos}` : 'Terapeuta'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-axiomaText-soft font-semibold">Fecha y Horario:</span>
                    <span className="font-semibold text-axioma-800 text-xs">
                      {fechaCorta(citaSeleccionadaParaDetalle.fechaHoraInicio)} ({horaCorta(citaSeleccionadaParaDetalle.fechaHoraInicio)} - {horaCorta(citaSeleccionadaParaDetalle.fechaHoraFin)})
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-axiomaText-soft font-semibold">Modalidad:</span>
                    <span className={`inline-flex items-center gap-1 rounded px-2 py-0.5 text-xs font-bold ${citaSeleccionadaParaDetalle.modalidad === 'VIRTUAL' ? 'bg-sky-100 text-sky-800' : 'bg-slate-100 text-slate-800'}`}>
                      {citaSeleccionadaParaDetalle.modalidad === 'VIRTUAL' ? 'Virtual (Meet)' : 'Presencial'}
                    </span>
                  </div>
                  {citaSeleccionadaParaDetalle.enlaceVideo && (
                    <div className="pt-2 border-t border-slate-200">
                      <a
                        href={citaSeleccionadaParaDetalle.enlaceVideo}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-full inline-flex items-center justify-center gap-1.5 rounded-button bg-sky-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-sky-700 shadow-sm"
                      >
                        <Video className="h-4 w-4" />
                        <span>Unirse a Videollamada (Google Meet)</span>
                      </a>
                    </div>
                  )}
                </div>

                <div>
                  <span className="text-xs font-semibold text-axiomaText-soft">Motivo de consulta:</span>
                  <p className="mt-1 text-xs text-axiomaText-ink bg-white p-2.5 rounded border border-axioma-100">
                    {citaSeleccionadaParaDetalle.motivoConsulta || 'Consulta terapéutica regular'}
                  </p>
                </div>
              </div>

              {/* Acciones */}
              <div className="mt-5 flex flex-wrap items-center justify-end gap-2 border-t border-axioma-100 pt-4">
                {citaSeleccionadaParaDetalle.estado === 'PROGRAMADA' && (
                  <>
                    <button
                      type="button"
                      onClick={() => {
                        const c = citaSeleccionadaParaDetalle;
                        setMostrarModalDetalle(false);
                        handleMarcarAsistencia(c);
                      }}
                      className={`${btnPrimary} px-3 py-1.5 text-xs`}
                    >
                      Asistencia
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const c = citaSeleccionadaParaDetalle;
                        setMostrarModalDetalle(false);
                        abrirModalReprogramar(c);
                      }}
                      className={`${btnSecondary} px-3 py-1.5 text-xs`}
                    >
                      Reprogramar
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const c = citaSeleccionadaParaDetalle;
                        setMostrarModalDetalle(false);
                        handleMarcarNoAsistio(c);
                      }}
                      className="rounded-button border border-amber-300 bg-amber-50 px-2.5 py-1.5 text-xs font-medium text-amber-800 transition hover:bg-amber-100"
                    >
                      No asistió
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const c = citaSeleccionadaParaDetalle;
                        setMostrarModalDetalle(false);
                        handleCancelarCita(c);
                      }}
                      className="rounded-button border border-rose-200 bg-rose-50 px-2.5 py-1.5 text-xs font-medium text-rose-700 transition hover:bg-rose-100"
                    >
                      Cancelar
                    </button>
                  </>
                )}

                <button
                  type="button"
                  onClick={() => setMostrarModalDetalle(false)}
                  className={`${btnSecondary} px-3 py-1.5 text-xs`}
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

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
                {errorModalCita && (
                  <div className="rounded-card-sm border border-red-300 bg-red-50 p-3 text-xs font-medium text-red-700">
                    {errorModalCita}
                  </div>
                )}

                <div>
                  <label htmlFor="pacienteId" className={label}>Paciente</label>
                  <select
                    id="pacienteId"
                    required
                    value={formCita.pacienteId}
                    onChange={(e) => {
                      const nuevoPacienteId = e.target.value;
                      const pac = pacientes.find((p) => p.id === nuevoPacienteId);
                      const pkActivo = pac?.paquetesPaciente?.find(
                        (pk: any) => pk.estado === 'ACTIVO' && pk.sesionesRestantes > 0
                      );
                      setErrorModalCita(null);
                      setFormCita({
                        ...formCita,
                        pacienteId: nuevoPacienteId,
                        psicologoId: pkActivo?.psicologoId ? pkActivo.psicologoId : formCita.psicologoId,
                      });
                    }}
                    className={input}
                  >
                    <option value="">Seleccione paciente...</option>
                    {pacientes.map((p) => (
                      <option key={p.id} value={p.id}>{p.nombres} {p.apellidos} ({p.dni})</option>
                    ))}
                  </select>

                  {formCita.pacienteId && (
                    <>
                      {paqueteActivoCita ? (
                        <div className="mt-2 rounded-card-sm border border-emerald-300 bg-emerald-50 px-3 py-2 text-xs font-medium text-emerald-900">
                          🎟️ Paquete activo: {paqueteActivoCita.paquete?.nombre || 'Paquete terapéutico'} - {paqueteActivoCita.sesionesRestantes} sesiones restantes
                        </div>
                      ) : paquetePendienteCita ? (
                        <div className="mt-2 rounded-card-sm border border-amber-300 bg-amber-50 px-3 py-2 text-xs font-medium text-amber-900">
                          ⚠️ Paquete pendiente de pago (No se podrá agendar hasta confirmar el pago)
                        </div>
                      ) : (
                        <p className="mt-1.5 text-xs text-axiomaText-soft">
                          Sin paquete activo. Se agendará como sesión individual
                        </p>
                      )}
                    </>
                  )}
                </div>

                <div>
                  <label htmlFor="psicologoId" className={label}>Terapeuta colegiado</label>
                  <select
                    id="psicologoId"
                    required
                    value={formCita.psicologoId}
                    onChange={(e) => {
                      setErrorModalCita(null);
                      setFormCita({ ...formCita, psicologoId: e.target.value });
                    }}
                    className={input}
                  >
                    <option value="">Seleccione terapeuta...</option>
                    {psicologos.map((p) => (
                      <option key={p.id} value={p.id}>{p.nombres} {p.apellidos} - {p.especialidad}</option>
                    ))}
                  </select>

                  {psicologoVinculadoId && formCita.psicologoId === psicologoVinculadoId && (
                    <p className="mt-1.5 text-xs font-medium text-emerald-700">
                      El paquete está vinculado a este terapeuta
                    </p>
                  )}
                  {psicologoVinculadoId && formCita.psicologoId && formCita.psicologoId !== psicologoVinculadoId && (
                    <div className="mt-2 rounded-card-sm border border-red-300 bg-red-50 px-3 py-2 text-xs font-medium text-red-700">
                      El paquete de este paciente está vinculado al Dr(a). {nombrePsicologoVinculado}. Para cambiar de terapeuta, solicite una transferencia de caso
                    </div>
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
      {/* MODAL 2B: NUEVO PACIENTE */}
      {/* ========================================================================= */}
      {mostrarModalNuevoPaciente && (
        <div className={modalOverlay}>
          <div className={modalWrap}>
            <div className={`${modalCard} max-w-lg`} role="dialog" aria-modal="true">
              <h3 className="font-display text-2xl font-medium tracking-heading text-axiomaText-ink">
                Registrar nuevo paciente
              </h3>
              <p className="mt-1 text-sm text-axiomaText-soft">
                Ingresa los datos personales y de contacto del paciente.
              </p>

              <form onSubmit={handleCrearPaciente} className="mt-5 space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={label}>DNI (8 dígitos)</label>
                    <input
                      type="text"
                      required
                      maxLength={8}
                      pattern="[0-9]{8}"
                      inputMode="numeric"
                      placeholder="74839201"
                      value={formNuevoPaciente.dni}
                      onChange={(e) => setFormNuevoPaciente({ ...formNuevoPaciente, dni: e.target.value })}
                      className={input}
                    />
                    {formNuevoPaciente.dni.length > 0 && !/^[0-9]{8}$/.test(formNuevoPaciente.dni) && (
                      <p className="mt-1 text-xs font-medium text-red-600">El DNI debe tener 8 dígitos numéricos</p>
                    )}
                  </div>
                  <div>
                    <label className={label}>Teléfono (9 dígitos)</label>
                    <input
                      type="tel"
                      required
                      maxLength={9}
                      pattern="[0-9]{9}"
                      inputMode="numeric"
                      placeholder="987654321"
                      value={formNuevoPaciente.telefono}
                      onChange={(e) => setFormNuevoPaciente({ ...formNuevoPaciente, telefono: e.target.value })}
                      className={input}
                    />
                    {formNuevoPaciente.telefono.length > 0 && !/^[0-9]{9}$/.test(formNuevoPaciente.telefono) && (
                      <p className="mt-1 text-xs font-medium text-red-600">El teléfono debe tener 9 dígitos</p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={label}>Nombres</label>
                    <input
                      type="text"
                      required
                      value={formNuevoPaciente.nombres}
                      onChange={(e) => setFormNuevoPaciente({ ...formNuevoPaciente, nombres: e.target.value })}
                      className={input}
                    />
                  </div>
                  <div>
                    <label className={label}>Apellidos</label>
                    <input
                      type="text"
                      required
                      value={formNuevoPaciente.apellidos}
                      onChange={(e) => setFormNuevoPaciente({ ...formNuevoPaciente, apellidos: e.target.value })}
                      className={input}
                    />
                  </div>
                </div>

                <div>
                  <label className={label}>Correo electrónico</label>
                  <input
                    type="email"
                    required
                    placeholder="paciente@correo.com"
                    value={formNuevoPaciente.correo}
                    onChange={(e) => setFormNuevoPaciente({ ...formNuevoPaciente, correo: e.target.value })}
                    className={input}
                  />
                </div>

                <div>
                  <label className={label}>Dirección</label>
                  <input
                    type="text"
                    value={formNuevoPaciente.direccion}
                    onChange={(e) => setFormNuevoPaciente({ ...formNuevoPaciente, direccion: e.target.value })}
                    className={input}
                  />
                </div>

                <div className="flex flex-col-reverse gap-3 border-t border-axioma-100 pt-5 sm:flex-row sm:justify-end">
                  <button type="button" onClick={() => setMostrarModalNuevoPaciente(false)} className={`${btnSecondary} ${tamMd}`}>
                    Cancelar
                  </button>
                  <button type="submit" className={`${btnPrimary} ${tamMd}`}>
                    Guardar paciente
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
                      maxLength={8}
                      pattern="[0-9]{8}"
                      value={formEditarPaciente.dni}
                      className={`${input} bg-axioma-50 font-mono`}
                    />
                  </div>
                  <div>
                    <label className={label}>Teléfono</label>
                    <input
                      type="tel"
                      maxLength={9}
                      pattern="[0-9]{9}"
                      inputMode="numeric"
                      value={formEditarPaciente.telefono}
                      onChange={(e) => setFormEditarPaciente({ ...formEditarPaciente, telefono: e.target.value })}
                      className={input}
                    />
                    {formEditarPaciente.telefono.length > 0 && !/^[0-9]{9}$/.test(formEditarPaciente.telefono) && (
                      <p className="mt-1 text-xs font-medium text-red-600">El teléfono debe tener 9 dígitos</p>
                    )}
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

      {/* ========================================================================= */}
      {/* MODAL 5: REGISTRAR PAGO DE PAQUETE */}
      {/* ========================================================================= */}
      {mostrarModalPago && paqueteSeleccionadoParaPago && (
        <div className={modalOverlay}>
          <div className={modalWrap}>
            <div className={`${modalCard} max-w-lg`} role="dialog" aria-modal="true">
              <div className="flex items-center gap-2">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200">
                  <CreditCard className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-display text-2xl font-medium tracking-heading text-axiomaText-ink">
                    Registrar Pago de Paquete
                  </h3>
                  <p className="text-xs text-axiomaText-soft">
                    Paciente: <span className="font-semibold text-axiomaText-ink">{pacienteSeleccionadoParaPago?.nombres} {pacienteSeleccionadoParaPago?.apellidos}</span>
                  </p>
                </div>
              </div>

              <div className="mt-4 rounded-xl bg-slate-50 p-3 ring-1 ring-slate-200 text-sm">
                <div className="flex justify-between items-center text-axiomaText-ink font-medium">
                  <span>Paquete: {paqueteSeleccionadoParaPago?.paquete?.nombre || 'Paquete'}</span>
                  <span className="text-emerald-700 font-semibold">{paqueteSeleccionadoParaPago?.paquete?.cantidadSesiones} sesiones</span>
                </div>
                <p className="text-xs text-axiomaText-muted mt-1">
                  Al confirmar el pago, el paquete pasará de <span className="font-semibold text-amber-700">PENDIENTE DE PAGO</span> a <span className="font-semibold text-emerald-700">ACTIVO</span> y las sesiones se cargarán al Kardex para su consumo.
                </p>
              </div>

              <form onSubmit={handleRegistrarPago} className="mt-5 space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={label}>Monto a cobrar (S/.)</label>
                    <input
                      type="number"
                      step="0.01"
                      min="1"
                      required
                      value={formPago.monto}
                      onChange={(e) => setFormPago({ ...formPago, monto: Number(e.target.value) })}
                      className={input}
                    />
                  </div>
                  <div>
                    <label className={label}>Método de pago</label>
                    <select
                      value={formPago.metodoPago}
                      onChange={(e) => setFormPago({ ...formPago, metodoPago: e.target.value })}
                      className={input}
                    >
                      <option value="Efectivo en recepción">Efectivo en recepción</option>
                      <option value="Yape / Plin">Yape / Plin</option>
                      <option value="Transferencia BCP/BBVA">Transferencia BCP/BBVA</option>
                      <option value="Tarjeta débito/crédito">Tarjeta débito/crédito</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className={label}>Notas / Nro. Operación (opcional)</label>
                  <input
                    type="text"
                    placeholder="Ej. Op. 128492 / Recibo N° 045"
                    value={formPago.notas}
                    onChange={(e) => setFormPago({ ...formPago, notas: e.target.value })}
                    className={input}
                  />
                </div>

                <div className="flex flex-col-reverse gap-3 border-t border-axioma-100 pt-5 sm:flex-row sm:justify-end">
                  <button
                    type="button"
                    onClick={() => setMostrarModalPago(false)}
                    disabled={guardandoPago}
                    className={`${btnSecondary} ${tamMd}`}
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={guardandoPago}
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:opacity-50"
                  >
                    {guardandoPago ? 'Procesando...' : 'Confirmar Pago y Activar'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: RECORDATORIO MANUAL (RIESGO ALTO DE NO-SHOW) */}
      {citaParaRecordatorio && (
        <div className={modalOverlay}>
          <div className={modalWrap}>
            <div className={`${modalCard} max-w-md`} role="dialog" aria-modal="true">
              <h3 className="font-display text-xl font-medium tracking-heading text-axiomaText-ink">
                Confirmación de asistencia (Riesgo Alto)
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-axiomaText-body">
                El sistema ha detectado un alto riesgo de inasistencia. ¿Deseas enviar un recordatorio manual?
              </p>
              <div className="mt-3 rounded-card-sm border border-axioma-100 bg-axioma-50 p-3 text-xs text-axiomaText-soft">
                Paciente: <strong className="text-axiomaText-ink">{citaParaRecordatorio.paciente?.nombres} {citaParaRecordatorio.paciente?.apellidos}</strong> ({fechaCorta(citaParaRecordatorio.fechaHoraInicio)} - {horaCorta(citaParaRecordatorio.fechaHoraInicio)})
              </div>
              <div className="mt-5 flex justify-end gap-2 border-t border-axioma-100 pt-4">
                <button
                  type="button"
                  onClick={() => setCitaParaRecordatorio(null)}
                  className={`${btnSecondary} ${tamMd}`}
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  disabled={enviandoRecordatorio}
                  onClick={handleEnviarRecordatorio}
                  className={`${btnPrimary} ${tamMd}`}
                >
                  {enviandoRecordatorio ? 'Enviando...' : 'Enviar recordatorio'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
