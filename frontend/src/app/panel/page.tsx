'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import {
  Users, UserCheck, Calendar, PackageCheck, Plus, LogOut,
  BrainCircuit, RefreshCw, X, Search, CalendarClock, Clock, Printer
} from 'lucide-react';
import { apiFetch } from '@/lib/api';
import { LogoAxioma } from '@/components/logo-axioma';
import {
  btnPrimary, btnSecondary, btnIcono, tamMd, focoClaro,
  card, label, input, modalOverlay, modalWrap, modalCard,
  thClase, tdClase, pastilla, claseEstadoCita, claseRiesgo, fechaCorta, horaCorta, fechaYmdLocal, horaHmLocal,
} from '@/lib/ui';

type Tab = 'agenda' | 'psicologos' | 'pacientes' | 'paquetes';

const fondosPaquete = [
  'bg-heather border-white/60',
  'bg-axioma-100 border-axioma-200',
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

export default function PanelStaff() {
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

  const [mostrarModalEvolucion, setMostrarModalEvolucion] = useState(false);
  const [citaSeleccionadaParaNota, setCitaSeleccionadaParaNota] = useState<any>(null);

  const [mostrarModalPsicologo, setMostrarModalPsicologo] = useState(false);
  const [mostrarModalEditarPaciente, setMostrarModalEditarPaciente] = useState(false);
  const [pacienteSeleccionadoParaEditar, setPacienteSeleccionadoParaEditar] = useState<any>(null);

  const [mostrarModalAsignarPaquete, setMostrarModalAsignarPaquete] = useState(false);
  const [pacienteSeleccionadoParaPaquete, setPacienteSeleccionadoParaPaquete] = useState<any>(null);

  const [mostrarModalCrearPaquete, setMostrarModalCrearPaquete] = useState(false);

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

  const [formNota, setFormNota] = useState({
    motivoConsulta: '',
    subjetivo: '',
    afecto: 'Eutímico / Ansioso',
    lenguaje: 'Fluido y coherente',
    conductaObservada: 'Colaborador, contacto visual adecuado',
    analisis: '',
    cie10: 'F41.1',
    tecnicasUtilizadas: '',
    tareasCasa: '',
    proximaSesion: 'Semanal - Continuar plan terapéutico',
  });

  const [formPsicologo, setFormPsicologo] = useState({
    dni: '',
    nombres: '',
    apellidos: '',
    correo: '',
    contrasena: '',
    telefono: '',
    numeroColegiatura: '',
    especialidad: 'Psicoterapia Cognitivo-Conductual',
    tarifaPorSesion: 80,
    biografia: '',
    diasAtencion: ['LUNES', 'MARTES', 'MIERCOLES', 'JUEVES', 'VIERNES', 'SABADO'],
    horaInicioLV: '09:00',
    horaFinLV: '18:00',
    horaInicioSabado: '09:00',
    horaFinSabado: '13:00',
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
    precioPagado: 0,
    metodoPago: 'Yape / Plin',
  });

  const [formCrearPaquete, setFormCrearPaquete] = useState({
    nombre: '',
    descripcion: '',
    cantidadSesiones: 4,
    precio: 280,
    vigenciaDias: 60,
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
    if (u.rol === 'PSICOLOGO') {
      router.push('/psicologo');
      return;
    }
    if (u.rol === 'RECEPCIONISTA') {
      router.push('/recepcion');
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

  // --- ACCIONES DE CITAS ---
  const handleMarcarAsistencia = async (c: any) => {
    // Validar en el cliente que no sea fecha futura
    const ahora = new Date();
    const tiempoHastaInicio = new Date(c.fechaHoraInicio).getTime() - ahora.getTime();
    if (tiempoHastaInicio > 30 * 60 * 1000) {
      toast.warning('No se puede marcar asistencia anticipada. La cita está programada para una fecha u hora futura.');
      return;
    }

    if (!confirm('¿Desea marcar asistencia para esta sesión? Se descontará automáticamente 1 sesión del paquete del paciente.')) return;
    try {
      await apiFetch(`/citas/${c.id}/asistencia`, { method: 'PATCH' });
      toast.success('Asistencia registrada y sesión consumida exitosamente.');
      cargarDatos();
    } catch (err: any) {
      toast.error(err.message || 'Error al marcar asistencia');
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
          motivoReprogramacion: formReprogramar.motivoReprogramacion || 'Reprogramación solicitada',
        }),
      });
      toast.success('Cita reprogramada exitosamente.');
      setMostrarModalReprogramar(false);
      cargarDatos();
    } catch (err: any) {
      toast.error(err.message || 'Error al reprogramar la cita');
    }
  };

  // --- NOTA CLÍNICA SOAP (AUDITORÍA & PERSISTENCIA UTF-8) ---
  const parsearObservaciones = (obs: string) => {
    let afecto = 'Eutímico / Ansioso';
    let lenguaje = 'Fluido y coherente';
    let conducta = 'Colaborador, contacto visual adecuado';

    if (obs) {
      const matchAfecto = obs.match(/Afecto:\s*([^|]+)/i);
      const matchLenguaje = obs.match(/Lenguaje:\s*([^|]+)/i);
      const matchConducta = obs.match(/Conducta:\s*(.+)/i);

      if (matchAfecto) afecto = matchAfecto[1].trim();
      if (matchLenguaje) lenguaje = matchLenguaje[1].trim();
      if (matchConducta) conducta = matchConducta[1].trim();
      else if (!matchAfecto && !matchLenguaje) conducta = obs.trim();
    }
    return { afecto, lenguaje, conducta };
  };

  const parsearNotaEvolucion = (nota: string) => {
    let subjetivo = '';
    let analisis = '';
    let cie10 = 'F41.1 (Ansiedad generalizada)';
    let proximaSesion = 'Semanal - Continuar plan terapéutico';

    if (nota) {
      const matchS = nota.match(/(?:^|\n)\s*S:\s*([\s\S]*?)(?=(?:\n\s*A:|\n\s*CIE-10:|\n\s*Plan:|$))/i);
      const matchA = nota.match(/(?:^|\n)\s*A:\s*([\s\S]*?)(?=(?:\n\s*CIE-10:|\n\s*Plan:|$))/i);
      const matchCie = nota.match(/(?:^|\n)\s*CIE-10:\s*([^\n]+)/i);
      const matchPlan = nota.match(/(?:^|\n)\s*(?:Plan|Próxima Sesión):\s*([\s\S]*?)$/i);

      if (matchS) subjetivo = matchS[1].trim();
      else subjetivo = nota.trim();

      if (matchA) analisis = matchA[1].trim();
      if (matchCie) cie10 = matchCie[1].trim();
      if (matchPlan) proximaSesion = matchPlan[1].trim();
    }
    return { subjetivo, analisis, cie10, proximaSesion };
  };

  const abrirModalNota = async (cita: any) => {
    setCitaSeleccionadaParaNota(cita);
    setFormNota({
      motivoConsulta: cita.motivoConsulta || 'Consulta psicoterapéutica',
      subjetivo: '',
      afecto: 'Eutímico / Ansioso',
      lenguaje: 'Fluido y coherente',
      conductaObservada: 'Colaborador, contacto visual adecuado',
      analisis: '',
      cie10: 'F41.1',
      tecnicasUtilizadas: 'Técnicas cognitivo-conductuales, reestructuración y respiración',
      tareasCasa: '',
      proximaSesion: 'Semanal - Continuar plan terapéutico',
    });

    try {
      const evolucion = await apiFetch(`/citas/${cita.id}/evolucion`);
      if (evolucion) {
        const { afecto, lenguaje, conducta } = parsearObservaciones(evolucion.observacionesConductuales || '');
        const { subjetivo, analisis, cie10, proximaSesion } = parsearNotaEvolucion(evolucion.notaEvolucion || '');

        setFormNota({
          motivoConsulta: evolucion.motivoConsulta || cita.motivoConsulta || 'Consulta psicoterapéutica',
          subjetivo: subjetivo || evolucion.notaEvolucion || '',
          afecto,
          lenguaje,
          conductaObservada: conducta,
          analisis: analisis || '',
          cie10: cie10 || 'F41.1',
          tecnicasUtilizadas: evolucion.tecnicasUtilizadas || '',
          tareasCasa: evolucion.tareasCasa || '',
          proximaSesion: proximaSesion || 'Semanal - Continuar plan terapéutico',
        });
      }
    } catch (err: any) {
      console.log('No se pudo cargar la nota previa:', err);
    }
    setMostrarModalEvolucion(true);
  };

  // --- ACCIÓN EXCLUSIVA ADMINISTRADOR: REVERTIR CITA ---
  const handleRevertirCita = async (cita: any) => {
    if (usuario?.rol !== 'ADMINISTRADOR') {
      toast.error('Acción restringida exclusivamente para Administradores.');
      return;
    }
    const nombrePaciente = cita.paciente ? `${cita.paciente.nombres} ${cita.paciente.apellidos}` : 'Paciente';
    if (!confirm(`¿Deseas revertir administrativamente la cita de ${nombrePaciente}? Se reintegrará 1 sesión consumida al paquete y la cita volverá a estado PROGRAMADA.`)) return;
    try {
      await apiFetch(`/citas/${cita.id}/revertir`, { method: 'POST' });
      toast.success('Cita revertida y sesión reintegrada exitosamente.');
      cargarDatos();
    } catch (err: any) {
      toast.error(err.message || 'Error al revertir la cita');
    }
  };

  // Impresión formal de reporte clínico SOAP
  const handleImprimirReporte = () => {
    if (!citaSeleccionadaParaNota) return;
    const pac = citaSeleccionadaParaNota.paciente;
    const psi = citaSeleccionadaParaNota.psicologo;
    const fecha = fechaCorta(citaSeleccionadaParaNota.fechaHoraInicio);
    const hora = `${horaCorta(citaSeleccionadaParaNota.fechaHoraInicio)} - ${horaCorta(citaSeleccionadaParaNota.fechaHoraFin)}`;

    const ventana = window.open('', '_blank', 'width=850,height=950');
    if (!ventana) {
      toast.error('Por favor permite ventanas emergentes para imprimir la nota clínica.');
      return;
    }

    ventana.document.write(`
      <!DOCTYPE html>
      <html lang="es">
      <head>
        <meta charset="utf-8" />
        <title>Nota SOAP - ${pac?.nombres} ${pac?.apellidos}</title>
        <style>
          @page { size: A4; margin: 18mm; }
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; color: #1e293b; line-height: 1.5; font-size: 13px; margin: 0; padding: 20px; }
          .header { border-bottom: 2px solid #0f766e; padding-bottom: 12px; margin-bottom: 16px; display: flex; justify-content: space-between; align-items: flex-start; }
          .logo-title { font-size: 18px; font-weight: bold; color: #0f766e; margin: 0; }
          .logo-sub { font-size: 11px; color: #64748b; margin-top: 2px; }
          .doc-tag { background: #f0fdfa; border: 1px solid #ccfbf1; color: #0f766e; padding: 4px 10px; border-radius: 4px; font-size: 11px; font-weight: 600; }
          .meta-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 8px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 10px 12px; margin-bottom: 16px; font-size: 12px; }
          .meta-label { font-weight: 600; color: #475569; }
          .section { margin-bottom: 14px; border: 1px solid #e2e8f0; border-radius: 6px; overflow: hidden; }
          .section-header { background: #f1f5f9; padding: 6px 12px; font-weight: 700; font-size: 12px; color: #0f766e; border-bottom: 1px solid #e2e8f0; display: flex; align-items: center; gap: 8px; }
          .section-body { padding: 10px 12px; font-size: 12px; }
          .soap-badge { background: #0f766e; color: white; border-radius: 50%; width: 18px; height: 18px; display: inline-flex; align-items: center; justify-content: center; font-size: 10px; font-weight: bold; }
          .tag { display: inline-block; background: #f1f5f9; border: 1px solid #cbd5e1; border-radius: 4px; padding: 2px 6px; font-size: 11px; margin-right: 6px; }
          .signature-area { margin-top: 40px; display: flex; justify-content: flex-end; }
          .signature-box { width: 250px; text-align: center; border-top: 1px solid #334155; padding-top: 8px; font-size: 11px; }
          .confidential { margin-top: 25px; font-size: 10px; color: #94a3b8; text-align: center; border-top: 1px dashed #cbd5e1; padding-top: 10px; }
          @media print { body { padding: 0; } }
        </style>
      </head>
      <body>
        <div class="header">
          <div>
            <h1 class="logo-title">AXIOMA — CENTRO PSICOLÓGICO</h1>
            <p class="logo-sub">Historia Clínica Psicológica & Evolución Terapéutica Especializada</p>
          </div>
          <div class="doc-tag">Nota Clínica SOAP (Auditoría)</div>
        </div>
        <div class="meta-grid">
          <div><span class="meta-label">Paciente:</span> ${pac?.nombres || ''} ${pac?.apellidos || ''} (DNI: ${pac?.dni || 'N/A'})</div>
          <div><span class="meta-label">Terapeuta:</span> ${psi?.nombres || ''} ${psi?.apellidos || ''} (${psi?.numeroColegiatura || 'C.Ps.P.'})</div>
          <div><span class="meta-label">Fecha de Sesión:</span> ${fecha} | ${hora}</div>
          <div><span class="meta-label">Motivo Principal:</span> ${formNota.motivoConsulta || 'Consulta psicoterapéutica'}</div>
        </div>
        <div class="section">
          <div class="section-header"><span class="soap-badge">S</span><span>SUBJETIVO — Relato del Paciente</span></div>
          <div class="section-body">${formNota.subjetivo || 'Sin registro subjetivo específico.'}</div>
        </div>
        <div class="section">
          <div class="section-header"><span class="soap-badge">O</span><span>OBJETIVO — Examen Mental & Conducta Observada</span></div>
          <div class="section-body">
            <p style="margin: 0 0 6px 0;"><span class="tag"><strong>Afecto:</strong> ${formNota.afecto || 'Modulado'}</span><span class="tag"><strong>Lenguaje:</strong> ${formNota.lenguaje || 'Fluido y coherente'}</span></p>
            <p style="margin: 0;"><strong>Conducta Observada:</strong> ${formNota.conductaObservada || 'Colaborador y orientado.'}</p>
          </div>
        </div>
        <div class="section">
          <div class="section-header"><span class="soap-badge">A</span><span>ANÁLISIS — Interpretación Clínica & Diagnóstico</span></div>
          <div class="section-body">
            <p style="margin: 0 0 6px 0;"><strong>Juicio Clínico:</strong> ${formNota.analisis || 'Evolución favorable.'}</p>
            <p style="margin: 0 0 6px 0;"><strong>Código CIE-10:</strong> <span class="tag">${formNota.cie10 || 'No especificado'}</span></p>
            <p style="margin: 0;"><strong>Técnicas:</strong> ${formNota.tecnicasUtilizadas || 'Técnicas cognitivo-conductuales.'}</p>
          </div>
        </div>
        <div class="section">
          <div class="section-header"><span class="soap-badge">P</span><span>PLAN — Prescripción & Seguimiento Intersesión</span></div>
          <div class="section-body">
            <p style="margin: 0 0 6px 0;"><strong>Tareas para Casa:</strong> ${formNota.tareasCasa || 'Registro de pensamientos.'}</p>
            <p style="margin: 0;"><strong>Próxima Sesión:</strong> ${formNota.proximaSesion || 'Semanal.'}</p>
          </div>
        </div>
        <div class="signature-area">
          <div class="signature-box"><strong>Ps. ${psi?.nombres || ''} ${psi?.apellidos || ''}</strong><br/>${psi?.numeroColegiatura || 'Colegio de Psicólogos del Perú'}<br/>Firma y Sello Profesional</div>
        </div>
        <div class="confidential">DOCUMENTO CONFIDENCIAL — Conforme a la Ley General de Salud N° 26842 y el Código de Ética Profesional del C.Ps.P.</div>
        <script>window.onload = function() { setTimeout(function() { window.print(); }, 250); };</script>
      </body>
      </html>
    `);
    ventana.document.close();
  };

  // --- REGISTRO DE PSICÓLOGO (HU-02) ---
  const handleCrearPsicologo = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiFetch('/psicologos', {
        method: 'POST',
        body: JSON.stringify({
          ...formPsicologo,
          tarifaPorSesion: Number(formPsicologo.tarifaPorSesion),
        }),
      });
      toast.success('Psicólogo registrado exitosamente con su horario de disponibilidad.');
      setMostrarModalPsicologo(false);
      setFormPsicologo({
        dni: '',
        nombres: '',
        apellidos: '',
        correo: '',
        contrasena: '',
        telefono: '',
        numeroColegiatura: '',
        especialidad: 'Psicoterapia Cognitivo-Conductual',
        tarifaPorSesion: 80,
        biografia: '',
        diasAtencion: ['LUNES', 'MARTES', 'MIERCOLES', 'JUEVES', 'VIERNES', 'SABADO'],
        horaInicioLV: '09:00',
        horaFinLV: '18:00',
        horaInicioSabado: '09:00',
        horaFinSabado: '13:00',
      });
      cargarDatos();
    } catch (err: any) {
      toast.error(err.message || 'Error al registrar psicólogo');
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

  // --- CREAR NUEVO PAQUETE (HU-08) ---
  const handleCrearPaquete = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiFetch('/paquetes', {
        method: 'POST',
        body: JSON.stringify({
          ...formCrearPaquete,
          cantidadSesiones: Number(formCrearPaquete.cantidadSesiones),
          precio: Number(formCrearPaquete.precio),
          vigenciaDias: Number(formCrearPaquete.vigenciaDias),
        }),
      });
      toast.success('Nuevo paquete registrado en el catálogo.');
      setMostrarModalCrearPaquete(false);
      setFormCrearPaquete({
        nombre: '',
        descripcion: '',
        cantidadSesiones: 4,
        precio: 280,
        vigenciaDias: 60,
      });
      cargarDatos();
    } catch (err: any) {
      toast.error(err.message || 'Error al crear paquete');
    }
  };

  const esPsicologo = usuario?.rol === 'PSICOLOGO';

  // Filtros en memoria
  const pacientesFiltrados = pacientes.filter((p) => {
    if (!filtroDniPaciente.trim()) return true;
    return (
      p.dni.toLowerCase().includes(filtroDniPaciente.toLowerCase()) ||
      p.nombres.toLowerCase().includes(filtroDniPaciente.toLowerCase()) ||
      p.apellidos.toLowerCase().includes(filtroDniPaciente.toLowerCase())
    );
  });

  const citasFiltradas = esPsicologo
    ? citas.filter((c) => c.psicologo?.usuarioId === usuario?.id || c.psicologoId === usuario?.perfil?.id)
    : citas;

  const citasAtendidas = citasFiltradas.filter((c) => c.estado === 'ATENDIDA').length;

  const pestanas: { id: Tab; Icono: typeof Calendar; texto: string; soloAdmin: boolean }[] = [
    { id: 'agenda', Icono: Calendar, texto: esPsicologo ? 'Mis Citas & Pacientes' : 'Agenda Central & ML', soloAdmin: false },
    { id: 'psicologos', Icono: UserCheck, texto: 'Cuerpo Psicológico', soloAdmin: true },
    { id: 'pacientes', Icono: Users, texto: 'Directorio de Pacientes', soloAdmin: true },
    { id: 'paquetes', Icono: PackageCheck, texto: 'Paquetes Terapéuticos', soloAdmin: true },
  ];

  const metricas = [
    { etiqueta: 'Citas registradas', valor: citasFiltradas.length, nota: `${citasAtendidas} atendidas`, fondo: 'bg-axioma-100 border-axioma-200', notaClase: 'text-axioma-700' },
    { etiqueta: 'Modelo Machine Learning', valor: '84.6%', nota: 'ROC-AUC 0.87', fondo: 'bg-heather border-white/60', notaClase: 'text-axioma-700' },
    { etiqueta: 'Pacientes en el centro', valor: pacientes.length, nota: 'Tratamiento activo', fondo: 'bg-white border-axioma-200/70', notaClase: 'text-axiomaText-soft' },
    { etiqueta: 'Psicólogos activos', valor: psicologos.length, nota: 'Colegiados C.Ps.P.', fondo: 'bg-axioma-100 border-axioma-200', notaClase: 'text-axioma-700' },
  ];

  const tituloVista = esPsicologo
    ? 'Portal Clínico & Seguimiento Terapéutico'
    : tabActiva === 'agenda' ? 'Agenda Central & Predicción ML'
      : tabActiva === 'psicologos' ? 'Personal Médico Colegiado'
        : tabActiva === 'pacientes' ? 'Directorio de Pacientes'
          : 'Catálogo de Paquetes Terapéuticos';

  return (
    <div className="flex min-h-screen flex-col bg-axioma-50 font-sans text-axiomaText-ink antialiased selection:bg-axioma-200 lg:flex-row">

      {/* SIDEBAR */}
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
                {esPsicologo ? 'Psicólogo(a) Colegiado(a)' : 'Administrador del Centro'}
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
                  ? 'Control confidencial de consultas, asistencia, notas SOAP y reprogramación.'
                  : 'Supervisión en vivo de sesiones, psicólogos, pacientes y paquetes terapéuticos.'}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <button onClick={() => cargarDatos()} title="Actualizar datos" aria-label="Actualizar datos" className={btnIcono}>
                <RefreshCw className={`h-4 w-4 ${cargando ? 'animate-spin motion-reduce:animate-none' : ''}`} />
              </button>

              {/* Botón Agendar Cita */}
              {tabActiva === 'agenda' && (
                <button onClick={() => setMostrarModalCita(true)} className={`${btnPrimary} ${tamMd}`}>
                  <Plus className="h-4 w-4" />
                  <span>Agendar cita</span>
                </button>
              )}

              {/* Botón Nuevo Psicólogo */}
              {!esPsicologo && tabActiva === 'psicologos' && (
                <button onClick={() => setMostrarModalPsicologo(true)} className={`${btnPrimary} ${tamMd}`}>
                  <Plus className="h-4 w-4" />
                  <span>Registrar psicólogo</span>
                </button>
              )}

              {/* Botón Crear Paquete */}
              {!esPsicologo && tabActiva === 'paquetes' && (
                <button onClick={() => setMostrarModalCrearPaquete(true)} className={`${btnPrimary} ${tamMd}`}>
                  <Plus className="h-4 w-4" />
                  <span>Crear paquete</span>
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
                  <span className="text-sm font-semibold">Algoritmo predictivo de inasistencia (No-Show)</span>
                  <span className="rounded-tag bg-axioma-300 px-2.5 py-0.5 text-[11px] font-bold text-axioma-950">
                    En producción
                  </span>
                </div>
                <p className="mt-1 max-w-2xl text-sm leading-relaxed text-axioma-100">
                  Inferencia matemática en tiempo real que calcula la probabilidad de inasistencia del paciente basándose en 6 variables clínicas y de comportamiento previo.
                </p>
              </div>
            </div>
            <span className="shrink-0 rounded-tag bg-white px-3.5 py-1.5 text-xs font-bold text-axioma-900">
              Precisión 84.6%
            </span>
          </div>

          {/* ----------------- TAB: AGENDA CENTRAL & CITAS ----------------- */}
          {tabActiva === 'agenda' && (
            <div className="mt-6 space-y-4">
              {/* Barra de Filtro de Fecha */}
              <div className={`${card} flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between`}>
                <div className="flex items-center gap-3">
                  <CalendarClock className="h-5 w-5 text-axioma-700" />
                  <span className="text-sm font-semibold text-axiomaText-ink">Filtrar citas por día:</span>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="date"
                    value={filtroFechaCitas}
                    onChange={(e) => {
                      setFiltroFechaCitas(e.target.value);
                      cargarDatos(e.target.value);
                    }}
                    className={`${input} py-1.5 text-xs sm:w-48`}
                  />
                  {filtroFechaCitas && (
                    <button
                      onClick={() => {
                        setFiltroFechaCitas('');
                        cargarDatos('');
                      }}
                      className={`${btnSecondary} px-3 py-1.5 text-xs`}
                    >
                      Ver todas
                    </button>
                  )}
                  <button
                    onClick={() => {
                      setFiltroFechaCitas(hoyStr);
                      cargarDatos(hoyStr);
                    }}
                    className={`${btnSecondary} px-3 py-1.5 text-xs`}
                  >
                    Hoy
                  </button>
                </div>
              </div>

              {/* Tabla de Citas */}
              <div className={`${card} overflow-hidden`}>
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[1050px] text-left text-sm text-axiomaText-soft">
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
                      {citasFiltradas.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="px-6 py-12 text-center text-axiomaText-soft">
                            {cargando ? 'Cargando agenda...' : 'No se encontraron citas para el criterio seleccionado.'}
                          </td>
                        </tr>
                      ) : (
                        citasFiltradas.map((c) => (
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
                                      className={`${btnPrimary} px-3 py-1.5 text-xs`}
                                    >
                                      Asistencia
                                    </button>
                                    <button
                                      onClick={() => abrirModalReprogramar(c)}
                                      title="Reprogramar fecha/hora"
                                      className={`${btnSecondary} px-2.5 py-1.5 text-xs`}
                                    >
                                      Reprogramar
                                    </button>
                                  </>
                                )}
                                {usuario?.rol === 'ADMINISTRADOR' && (c.estado === 'ATENDIDA' || c.estado === 'NO_ASISTIO' || c.estado === 'CANCELADA') && (
                                  <button
                                    onClick={() => handleRevertirCita(c)}
                                    title="Revertir cita y restituir 1 sesión al paquete del paciente"
                                    className="rounded-button border border-purple-200 bg-purple-50 px-2.5 py-1.5 text-xs font-semibold text-purple-700 transition-colors hover:bg-purple-100"
                                  >
                                    Revertir
                                  </button>
                                )}
                                <button
                                  onClick={() => abrirModalNota(c)}
                                  className={`${btnSecondary} whitespace-nowrap px-3 py-1.5 text-xs`}
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
            </div>
          )}

          {/* ----------------- TAB: PSICÓLOGOS ----------------- */}
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
                  <div className="mt-3 flex items-center gap-1.5 rounded bg-axioma-50 px-2.5 py-1 text-xs text-axioma-800">
                    <Clock className="h-3.5 w-3.5 shrink-0 text-axioma-600" />
                    <span>
                      {p.disponibilidades && p.disponibilidades.length > 0
                        ? `Atención: ${p.disponibilidades.length} días activos (Lun-Vie ${p.disponibilidades[0]?.horaInicio || '09:00'} a ${p.disponibilidades[0]?.horaFin || '18:00'})`
                        : 'Horario: Lun-Vie 09:00 - 18:00 | Sáb 09:00 - 13:00'}
                    </span>
                  </div>
                  <div className="mt-5 flex items-center justify-between border-t border-axioma-100 pt-4 text-sm">
                    <span className="tabular-nums text-axiomaText-soft">DNI: {p.dni}</span>
                    <span className="font-semibold text-axioma-700">S/. {p.tarifaPorSesion || 80} / sesión</span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* ----------------- TAB: PACIENTES ----------------- */}
          {!esPsicologo && tabActiva === 'pacientes' && (
            <div className="mt-6 space-y-4">
              {/* Buscador de Pacientes por DNI / Nombre (HU-07) */}
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

              {/* Tabla Directorio Pacientes */}
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

      {/* ========================================================================= */}
      {/* MODAL 1: AGENDAR CITA CON FILTRADO EN TIEMPO REAL DE HORARIOS OCUPADOS */}
      {/* ========================================================================= */}
      {mostrarModalCita && (
        <div className={modalOverlay}>
          <div className={modalWrap}>
            <div className={`${modalCard} max-w-lg`} role="dialog" aria-modal="true">
              <h3 className="font-display text-2xl font-medium tracking-heading text-axiomaText-ink">
                Agendar cita en agenda central
              </h3>
              <p className="mt-1 text-sm leading-relaxed text-axiomaText-soft">
                Horario hábil: Lun-Vie (9am-6pm) | Sáb (9am-1pm). Intervalos de 50 minutos.
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
                    placeholder="Ej. Terapia por cuadro de ansiedad generalizada"
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
      {/* MODAL 2: REPROGRAMAR CITA CON FILTRADO EN TIEMPO REAL */}
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
                    Guardar reprogramación
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 3: NOTA DE EVOLUCIÓN CLÍNICA SOAP (MODO AUDITORÍA / SOLO LECTURA) */}
      {/* ========================================================================= */}
      {mostrarModalEvolucion && (
        <div className={modalOverlay}>
          <div className={modalWrap}>
            <div className={`${modalCard} max-w-3xl max-h-[92vh] overflow-y-auto`} role="dialog" aria-modal="true">
              {/* BANNER AUDITORÍA */}
              <div className="mb-4 flex items-center gap-2 rounded-card-sm border border-amber-300 bg-amber-50 p-3 text-xs font-medium text-amber-900">
                <span className="text-base">🔒</span>
                <div>
                  <strong>Modo Auditoría: Solo lectura.</strong> Las notas clínicas no pueden ser modificadas por el administrador.
                </div>
              </div>

              <div className="flex items-start justify-between border-b border-axioma-100 pb-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="rounded bg-teal-100 px-2 py-0.5 text-xs font-bold uppercase tracking-wider text-teal-800">
                      Registro SOAP
                    </span>
                    <h3 className="font-display text-xl font-medium tracking-heading text-axiomaText-ink">
                      Evolución Psicoterapéutica
                    </h3>
                  </div>
                  <p className="mt-1 text-xs text-axiomaText-soft">
                    Paciente: <strong className="text-axiomaText-ink">{citaSeleccionadaParaNota?.paciente?.nombres} {citaSeleccionadaParaNota?.paciente?.apellidos}</strong> • DNI: {citaSeleccionadaParaNota?.paciente?.dni || 'N/A'} • Sesión: {fechaCorta(citaSeleccionadaParaNota?.fechaHoraInicio)} ({horaCorta(citaSeleccionadaParaNota?.fechaHoraInicio)})
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleImprimirReporte}
                  className="inline-flex items-center gap-1.5 rounded-button border border-teal-200 bg-teal-50 px-3 py-1.5 text-xs font-semibold text-teal-800 transition-colors hover:bg-teal-100"
                  title="Imprimir o exportar ficha clínica a formato físico A4"
                >
                  <Printer className="h-3.5 w-3.5" />
                  <span>Imprimir Ficha</span>
                </button>
              </div>

              <div className="mt-4 space-y-4 text-left text-sm">
                <div>
                  <label className={label}>Motivo de consulta / Foco de sesión</label>
                  <input
                    type="text"
                    readOnly
                    value={formNota.motivoConsulta}
                    className={`${input} bg-slate-50 cursor-not-allowed text-axiomaText-ink`}
                  />
                </div>

                {/* SECCIÓN S: SUBJETIVO */}
                <div className="rounded-card border border-teal-200 bg-teal-50/40 p-3.5">
                  <div className="mb-1.5 flex items-center gap-2">
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-teal-700 text-xs font-bold text-white">
                      S
                    </span>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-teal-900">
                      Subjetivo — Relato y Vivencia del Consultante
                    </h4>
                  </div>
                  <p className="mb-2 text-[11px] text-teal-800/80">
                    Discurso verbal del paciente, motivo manifiesto, quejas principales y nivel autoreportado de malestar.
                  </p>
                  <textarea
                    rows={3}
                    readOnly
                    value={formNota.subjetivo || 'Sin registro subjetivo específico.'}
                    className={`${input} bg-slate-50 cursor-not-allowed resize-none text-axiomaText-ink`}
                  />
                </div>

                {/* SECCIÓN O: OBJETIVO */}
                <div className="rounded-card border border-slate-200 bg-slate-50/70 p-3.5">
                  <div className="mb-1.5 flex items-center gap-2">
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-slate-700 text-xs font-bold text-white">
                      O
                    </span>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900">
                      Objetivo — Examen Mental & Conducta Observada
                    </h4>
                  </div>
                  <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-3">
                    <div>
                      <label className="mb-1 block text-xs font-semibold text-slate-700">Afecto</label>
                      <input
                        type="text"
                        readOnly
                        value={formNota.afecto}
                        className={`${input} bg-white cursor-not-allowed text-axiomaText-ink`}
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-xs font-semibold text-slate-700">Lenguaje / Discurso</label>
                      <input
                        type="text"
                        readOnly
                        value={formNota.lenguaje}
                        className={`${input} bg-white cursor-not-allowed text-axiomaText-ink`}
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-xs font-semibold text-slate-700">Conducta y Actitud</label>
                      <input
                        type="text"
                        readOnly
                        value={formNota.conductaObservada}
                        className={`${input} bg-white cursor-not-allowed text-axiomaText-ink`}
                      />
                    </div>
                  </div>
                </div>

                {/* SECCIÓN A: ANÁLISIS */}
                <div className="rounded-card border border-amber-200 bg-amber-50/30 p-3.5">
                  <div className="mb-1.5 flex items-center gap-2">
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-amber-700 text-xs font-bold text-white">
                      A
                    </span>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-amber-900">
                      Análisis — Interpretación Psicológica & Técnicas
                    </h4>
                  </div>
                  <div className="space-y-2.5">
                    <div>
                      <label className="mb-1 block text-xs font-semibold text-amber-900">
                        Interpretación clínica & respuesta a la intervención
                      </label>
                      <textarea
                        rows={2}
                        readOnly
                        value={formNota.analisis || 'Sin análisis clínico registrado.'}
                        className={`${input} bg-white cursor-not-allowed resize-none text-axiomaText-ink`}
                      />
                    </div>
                    <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                      <div>
                        <label className="mb-1 block text-xs font-semibold text-amber-900">Código CIE-10 / Diagnóstico</label>
                        <input
                          type="text"
                          readOnly
                          value={formNota.cie10}
                          className={`${input} bg-white cursor-not-allowed text-axiomaText-ink`}
                        />
                      </div>
                      <div>
                        <label className="mb-1 block text-xs font-semibold text-amber-900">Técnicas psicoterapéuticas</label>
                        <input
                          type="text"
                          readOnly
                          value={formNota.tecnicasUtilizadas}
                          className={`${input} bg-white cursor-not-allowed text-axiomaText-ink`}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* SECCIÓN P: PLAN */}
                <div className="rounded-card border border-emerald-200 bg-emerald-50/30 p-3.5">
                  <div className="mb-1.5 flex items-center gap-2">
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-700 text-xs font-bold text-white">
                      P
                    </span>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-900">
                      Plan — Tareas para Casa & Frecuencia
                    </h4>
                  </div>
                  <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                    <div>
                      <label className="mb-1 block text-xs font-semibold text-emerald-900">Tareas asignadas para casa</label>
                      <input
                        type="text"
                        readOnly
                        value={formNota.tareasCasa || 'Sin tareas asignadas'}
                        className={`${input} bg-white cursor-not-allowed text-axiomaText-ink`}
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-xs font-semibold text-emerald-900">Frecuencia / Próxima sesión</label>
                      <input
                        type="text"
                        readOnly
                        value={formNota.proximaSesion}
                        className={`${input} bg-white cursor-not-allowed text-axiomaText-ink`}
                      />
                    </div>
                  </div>
                </div>

                {/* FOOTER */}
                <div className="flex flex-col gap-2.5 border-t border-axioma-100 pt-3 sm:flex-row sm:items-center sm:justify-between">
                  <button
                    type="button"
                    onClick={handleImprimirReporte}
                    className="inline-flex items-center justify-center gap-1.5 rounded-button border border-axioma-300 bg-white px-3 py-2 text-xs font-semibold text-axiomaText-ink transition-colors hover:bg-axioma-50"
                  >
                    <Printer className="h-4 w-4 text-axioma-700" />
                    <span>Imprimir Ficha SOAP (A4)</span>
                  </button>

                  <div className="flex items-center justify-end">
                    <button
                      type="button"
                      onClick={() => setMostrarModalEvolucion(false)}
                      className={`${btnSecondary} ${tamMd}`}
                    >
                      Cerrar
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 4: REGISTRAR PSICÓLOGO (HU-02) */}
      {/* ========================================================================= */}
      {mostrarModalPsicologo && (
        <div className={modalOverlay}>
          <div className={modalWrap}>
            <div className={`${modalCard} max-w-lg`} role="dialog" aria-modal="true">
              <h3 className="font-display text-2xl font-medium tracking-heading text-axiomaText-ink">
                Registrar nuevo psicólogo
              </h3>
              <p className="mt-1 text-sm text-axiomaText-soft">
                Crea el perfil profesional y su cuenta de acceso al portal clínico.
              </p>

              <form onSubmit={handleCrearPsicologo} className="mt-5 space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={label}>DNI</label>
                    <input
                      type="text"
                      required
                      maxLength={8}
                      value={formPsicologo.dni}
                      onChange={(e) => setFormPsicologo({ ...formPsicologo, dni: e.target.value })}
                      className={input}
                    />
                  </div>
                  <div>
                    <label className={label}>N° Colegiatura (C.Ps.P.)</label>
                    <input
                      type="text"
                      required
                      placeholder="C.Ps.P. 12345"
                      value={formPsicologo.numeroColegiatura}
                      onChange={(e) => setFormPsicologo({ ...formPsicologo, numeroColegiatura: e.target.value })}
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
                      value={formPsicologo.nombres}
                      onChange={(e) => setFormPsicologo({ ...formPsicologo, nombres: e.target.value })}
                      className={input}
                    />
                  </div>
                  <div>
                    <label className={label}>Apellidos</label>
                    <input
                      type="text"
                      required
                      value={formPsicologo.apellidos}
                      onChange={(e) => setFormPsicologo({ ...formPsicologo, apellidos: e.target.value })}
                      className={input}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={label}>Correo electrónico</label>
                    <input
                      type="email"
                      required
                      value={formPsicologo.correo}
                      onChange={(e) => setFormPsicologo({ ...formPsicologo, correo: e.target.value })}
                      className={input}
                    />
                  </div>
                  <div>
                    <label className={label}>Contraseña temporal</label>
                    <input
                      type="password"
                      required
                      value={formPsicologo.contrasena}
                      onChange={(e) => setFormPsicologo({ ...formPsicologo, contrasena: e.target.value })}
                      className={input}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={label}>Especialidad</label>
                    <input
                      type="text"
                      value={formPsicologo.especialidad}
                      onChange={(e) => setFormPsicologo({ ...formPsicologo, especialidad: e.target.value })}
                      className={input}
                    />
                  </div>
                  <div>
                    <label className={label}>Tarifa por sesión (S/.)</label>
                    <input
                      type="number"
                      value={formPsicologo.tarifaPorSesion}
                      onChange={(e) => setFormPsicologo({ ...formPsicologo, tarifaPorSesion: Number(e.target.value) })}
                      className={input}
                    />
                  </div>
                </div>

                {/* Sección Disponibilidad Horaria de Atención */}
                <div className="rounded-card-sm border border-axioma-200 bg-axioma-50 p-4">
                  <h4 className="text-sm font-semibold text-axiomaText-ink">Disponibilidad Horaria de Atención</h4>
                  <p className="mt-0.5 text-xs text-axiomaText-soft">Configura el rango de turnos que el psicólogo atenderá en el centro.</p>
                  
                  <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <div>
                      <label className="text-xs font-medium text-axiomaText-ink">Lunes a Viernes</label>
                      <div className="mt-1 flex items-center gap-1.5 text-xs">
                        <input
                          type="text"
                          value={formPsicologo.horaInicioLV}
                          onChange={(e) => setFormPsicologo({ ...formPsicologo, horaInicioLV: e.target.value })}
                          className="w-16 rounded border border-axioma-200 bg-white px-2 py-1 text-center font-medium"
                          placeholder="09:00"
                        />
                        <span className="text-axiomaText-soft">a</span>
                        <input
                          type="text"
                          value={formPsicologo.horaFinLV}
                          onChange={(e) => setFormPsicologo({ ...formPsicologo, horaFinLV: e.target.value })}
                          className="w-16 rounded border border-axioma-200 bg-white px-2 py-1 text-center font-medium"
                          placeholder="18:00"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-xs font-medium text-axiomaText-ink">Sábados</label>
                      <div className="mt-1 flex items-center gap-1.5 text-xs">
                        <input
                          type="text"
                          value={formPsicologo.horaInicioSabado}
                          onChange={(e) => setFormPsicologo({ ...formPsicologo, horaInicioSabado: e.target.value })}
                          className="w-16 rounded border border-axioma-200 bg-white px-2 py-1 text-center font-medium"
                          placeholder="09:00"
                        />
                        <span className="text-axiomaText-soft">a</span>
                        <input
                          type="text"
                          value={formPsicologo.horaFinSabado}
                          onChange={(e) => setFormPsicologo({ ...formPsicologo, horaFinSabado: e.target.value })}
                          className="w-16 rounded border border-axioma-200 bg-white px-2 py-1 text-center font-medium"
                          placeholder="13:00"
                        />
                      </div>
                    </div>
                  </div>

                  <p className="mt-2.5 text-[11px] text-axioma-700">
                    ✓ Receso de refrigerio (13:00 - 14:00 L-V) y domingos cerrados protegidos automáticamente por las reglas del centro.
                  </p>
                </div>

                <div className="flex flex-col-reverse gap-3 border-t border-axioma-100 pt-5 sm:flex-row sm:justify-end">
                  <button type="button" onClick={() => setMostrarModalPsicologo(false)} className={`${btnSecondary} ${tamMd}`}>
                    Cancelar
                  </button>
                  <button type="submit" className={`${btnPrimary} ${tamMd}`}>
                    Guardar psicólogo
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 5: MODIFICAR DATOS DEL PACIENTE (HU-06) */}
      {/* ========================================================================= */}
      {mostrarModalEditarPaciente && (
        <div className={modalOverlay}>
          <div className={modalWrap}>
            <div className={`${modalCard} max-w-lg`} role="dialog" aria-modal="true">
              <h3 className="font-display text-2xl font-medium tracking-heading text-axiomaText-ink">
                Modificar datos del paciente
              </h3>
              <p className="mt-1 text-sm text-axiomaText-soft">
                Actualizar información de contacto y datos personales.
              </p>

              <form onSubmit={handleActualizarPaciente} className="mt-5 space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={label}>DNI</label>
                    <input
                      type="text"
                      required
                      value={formEditarPaciente.dni}
                      onChange={(e) => setFormEditarPaciente({ ...formEditarPaciente, dni: e.target.value })}
                      className={input}
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
      {/* MODAL 6: ASIGNAR PAQUETE A PACIENTE (HU-09) */}
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
      {/* MODAL 7: CREAR PAQUETE TERAPÉUTICO (HU-08) */}
      {/* ========================================================================= */}
      {mostrarModalCrearPaquete && (
        <div className={modalOverlay}>
          <div className={modalWrap}>
            <div className={`${modalCard} max-w-lg`} role="dialog" aria-modal="true">
              <h3 className="font-display text-2xl font-medium tracking-heading text-axiomaText-ink">
                Crear nuevo paquete terapéutico
              </h3>
              <p className="mt-1 text-sm text-axiomaText-soft">
                Define el número de sesiones, tarifa especial y vigencia en días.
              </p>

              <form onSubmit={handleCrearPaquete} className="mt-5 space-y-4">
                <div>
                  <label className={label}>Nombre del paquete</label>
                  <input
                    type="text"
                    required
                    placeholder="Ej. Plan Bienestar Integral (6 Sesiones)"
                    value={formCrearPaquete.nombre}
                    onChange={(e) => setFormCrearPaquete({ ...formCrearPaquete, nombre: e.target.value })}
                    className={input}
                  />
                </div>

                <div>
                  <label className={label}>Descripción breve</label>
                  <input
                    type="text"
                    placeholder="Ej. Dirigido a intervención continua de manejo de estrés y ansiedad"
                    value={formCrearPaquete.descripcion}
                    onChange={(e) => setFormCrearPaquete({ ...formCrearPaquete, descripcion: e.target.value })}
                    className={input}
                  />
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className={label}>Sesiones</label>
                    <input
                      type="number"
                      required
                      min={1}
                      value={formCrearPaquete.cantidadSesiones}
                      onChange={(e) => setFormCrearPaquete({ ...formCrearPaquete, cantidadSesiones: Number(e.target.value) })}
                      className={input}
                    />
                  </div>
                  <div>
                    <label className={label}>Precio (S/.)</label>
                    <input
                      type="number"
                      required
                      min={1}
                      value={formCrearPaquete.precio}
                      onChange={(e) => setFormCrearPaquete({ ...formCrearPaquete, precio: Number(e.target.value) })}
                      className={input}
                    />
                  </div>
                  <div>
                    <label className={label}>Vigencia (días)</label>
                    <input
                      type="number"
                      required
                      min={1}
                      value={formCrearPaquete.vigenciaDias}
                      onChange={(e) => setFormCrearPaquete({ ...formCrearPaquete, vigenciaDias: Number(e.target.value) })}
                      className={input}
                    />
                  </div>
                </div>

                <div className="flex flex-col-reverse gap-3 border-t border-axioma-100 pt-5 sm:flex-row sm:justify-end">
                  <button type="button" onClick={() => setMostrarModalCrearPaquete(false)} className={`${btnSecondary} ${tamMd}`}>
                    Cancelar
                  </button>
                  <button type="submit" className={`${btnPrimary} ${tamMd}`}>
                    Guardar paquete
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
