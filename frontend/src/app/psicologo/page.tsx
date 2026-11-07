'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { toast } from 'sonner';
import {
  Calendar, LogOut, Video, RefreshCw, Plus, BrainCircuit, Printer,
  FileText, CheckCircle2, XCircle, CalendarClock, AlertCircle, ArrowLeft,
  Users, BarChart3, Search, ChevronRight, ClipboardList, UserCheck, TrendingUp, Bell
} from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { apiFetch } from '@/lib/api';
import { LogoAxioma } from '@/components/logo-axioma';
import {
  btnPrimary, btnSecondary, btnIcono, tamSm, tamMd, focoClaro,
  card, label, input, modalOverlay, modalWrap, modalCard,
  thClase, tdClase, pastilla, claseEstadoCita, claseRiesgo,
  fechaCorta, horaCorta, fechaYmdLocal, horaHmLocal, foco,
} from '@/lib/ui';

type TabPsicologo = 'agenda' | 'pacientes' | 'estadisticas';

export default function PortalPsicologo() {
  const router = useRouter();
  const [usuario, setUsuario] = useState<any>(null);
  const [tabActiva, setTabActiva] = useState<TabPsicologo>('agenda');
  const [citas, setCitas] = useState<any[]>([]);
  const [estadisticas, setEstadisticas] = useState<any>(null);
  const [resumenMl, setResumenMl] = useState<any>(null);
  const [cargando, setCargando] = useState(true);
  const [filtroFecha, setFiltroFecha] = useState<string>('');
  const [busquedaPaciente, setBusquedaPaciente] = useState<string>('');
  const [pacienteSeleccionadoId, setPacienteSeleccionadoId] = useState<string | null>(null);
  const [errorAcceso, setErrorAcceso] = useState<string | null>(null);

  // Modal Nota SOAP
  const [mostrarModalNota, setMostrarModalNota] = useState(false);
  const [citaSeleccionadaNota, setCitaSeleccionadaNota] = useState<any>(null);
  const [guardandoNota, setGuardandoNota] = useState(false);
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

  // Modal Reprogramar
  const [mostrarModalReprog, setMostrarModalReprog] = useState(false);
  const [citaSeleccionadaReprog, setCitaSeleccionadaReprog] = useState<any>(null);
  const [citaParaRecordatorio, setCitaParaRecordatorio] = useState<any>(null);
  const [enviandoRecordatorio, setEnviandoRecordatorio] = useState(false);
  const [procesando, setProcesando] = useState(false);
  const [formReprog, setFormReprog] = useState({
    fecha: new Date().toISOString().split('T')[0],
    horaInicio: '09:00',
    horaFin: '09:50',
    motivo: '',
  });

  useEffect(() => {
    const usuarioGuardado = localStorage.getItem('axioma_usuario');
    if (!usuarioGuardado) {
      router.push('/login');
      return;
    }
    const u = JSON.parse(usuarioGuardado);
    if (u.rol !== 'PSICOLOGO' && u.rol !== 'ADMINISTRADOR') {
      if (u.rol === 'PACIENTE') router.push('/paciente');
      else if (u.rol === 'RECEPCIONISTA') router.push('/recepcion');
      else router.push('/login');
      return;
    }
    setUsuario(u);
    cargarCitas();
  }, []);

  const cargarCitas = async (fecha = filtroFecha) => {
    setCargando(true);
    setErrorAcceso(null);
    try {
      const url = fecha ? `/citas?fecha=${fecha}` : '/citas';
      const [data, dataStats, dataMl] = await Promise.all([
        apiFetch(url),
        apiFetch('/citas/estadisticas-psicologo').catch(() => null),
        apiFetch('/ml/predicciones-resumen').catch(() => null),
      ]);
      setCitas(data || []);
      if (dataStats) setEstadisticas(dataStats);
      if (dataMl) setResumenMl(dataMl);
    } catch (err: any) {
      console.error('Error al cargar citas de psicólogo:', err);
      if (err.status === 403) {
        setErrorAcceso('No tienes permiso para ver ciertas consultas clínicas.');
      } else {
        setErrorAcceso(err.message || 'Error al conectar con la agenda clínica');
      }
    } finally {
      setCargando(false);
    }
  };

  const cerrarSesion = () => {
    localStorage.removeItem('axioma_token');
    localStorage.removeItem('axioma_usuario');
    router.push('/login');
  };

  // Acciones sobre citas
  const handleMarcarAsistencia = async (cita: any) => {
    if (procesando) return;
    setProcesando(true);
    try {
      await apiFetch(`/citas/${cita.id}/asistencia`, { method: 'PATCH' });
      toast.success('Asistencia registrada. Sesión contabilizada en el historial clínico.');
      cargarCitas();
      abrirModalNota(cita);
    } catch (err: any) {
      toast.error(err.message || 'Error al registrar asistencia');
    } finally {
      setProcesando(false);
    }
  };

  const handleMarcarNoAsistio = async (cita: any) => {
    if (procesando) return;
    if (!confirm('¿Confirmas que el paciente no acudió a la sesión?')) return;
    setProcesando(true);
    try {
      await apiFetch(`/citas/${cita.id}/no-asistio`, { method: 'PATCH' });
      toast.success('Inasistencia (No-Show) registrada.');
      cargarCitas();
    } catch (err: any) {
      toast.error(err.message || 'Error al registrar inasistencia');
    } finally {
      setProcesando(false);
    }
  };

  const handleCancelar = async (cita: any) => {
    if (procesando) return;
    const motivo = prompt('Motivo de cancelación:');
    if (motivo === null) return;
    setProcesando(true);
    try {
      await apiFetch(`/citas/${cita.id}/cancelar`, {
        method: 'PATCH',
        body: JSON.stringify({ motivo: motivo || 'Cancelada por el terapeuta' }),
      });
      toast.success('Cita cancelada.');
      cargarCitas();
    } catch (err: any) {
      toast.error(err.message || 'Error al cancelar cita');
    } finally {
      setProcesando(false);
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

  // Parser de observaciones conductuales (Afecto | Lenguaje | Conducta)
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

  // Parser de nota estructurada SOAP
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
    setCitaSeleccionadaNota(cita);
    setFormNota({
      motivoConsulta: cita.motivoConsulta || '',
      subjetivo: '',
      afecto: 'Eutímico / Ansioso',
      lenguaje: 'Fluido y coherente',
      conductaObservada: 'Colaborador, contacto visual adecuado',
      analisis: '',
      cie10: 'F41.1',
      tecnicasUtilizadas: 'Reestructuración cognitiva, respiración diafragmática',
      tareasCasa: '',
      proximaSesion: 'Semanal - Continuar plan terapéutico',
    });

    try {
      const evolucionExistente = await apiFetch(`/citas/${cita.id}/evolucion`);
      if (evolucionExistente) {
        const { afecto, lenguaje, conducta } = parsearObservaciones(evolucionExistente.observacionesConductuales || '');
        const { subjetivo, analisis, cie10, proximaSesion } = parsearNotaEvolucion(evolucionExistente.notaEvolucion || '');

        setFormNota({
          motivoConsulta: evolucionExistente.motivoConsulta || cita.motivoConsulta || '',
          subjetivo: subjetivo || evolucionExistente.notaEvolucion || '',
          afecto,
          lenguaje,
          conductaObservada: conducta,
          analisis: analisis || '',
          cie10: cie10 || 'F41.1',
          tecnicasUtilizadas: evolucionExistente.tecnicasUtilizadas || '',
          tareasCasa: evolucionExistente.tareasCasa || '',
          proximaSesion: proximaSesion || 'Semanal - Continuar plan terapéutico',
        });
      }
    } catch (e) {
      // Si no existe nota previa o hay 404, se mantiene el formulario inicial limpio
    }
    setMostrarModalNota(true);
  };

  const handleGuardarNota = async (e: React.FormEvent) => {
    e.preventDefault();
    if (usuario?.rol !== 'PSICOLOGO' && usuario?.rol !== 'ADMINISTRADOR') {
      toast.error('Solo los psicólogos colegiados o administradores pueden guardar notas SOAP.');
      return;
    }
    if (!citaSeleccionadaNota) return;
    setGuardandoNota(true);

    const observacionesConductuales = `Afecto: ${formNota.afecto} | Lenguaje: ${formNota.lenguaje} | Conducta: ${formNota.conductaObservada}`;
    const notaEvolucion = `S: ${formNota.subjetivo}\n\nA: ${formNota.analisis}\n\nCIE-10: ${formNota.cie10}\n\nPlan: ${formNota.proximaSesion}`;

    try {
      await apiFetch(`/citas/${citaSeleccionadaNota.id}/evolucion`, {
        method: 'POST',
        body: JSON.stringify({
          motivoConsulta: formNota.motivoConsulta,
          tecnicasUtilizadas: formNota.tecnicasUtilizadas,
          observacionesConductuales,
          notaEvolucion,
          tareasCasa: formNota.tareasCasa,
        }),
      });
      toast.success('Nota de Evolución Clínica SOAP guardada exitosamente.');
      setMostrarModalNota(false);
      cargarCitas();
    } catch (err: any) {
      toast.error(err.message || 'Error al guardar la nota clínica');
    } finally {
      setGuardandoNota(false);
    }
  };

  // Impresión formal de reporte clínico SOAP
  const handleImprimirReporte = () => {
    if (!citaSeleccionadaNota) return;
    const pac = citaSeleccionadaNota.paciente;
    const psi = citaSeleccionadaNota.psicologo || usuario?.perfil;
    const fecha = fechaCorta(citaSeleccionadaNota.fechaHoraInicio);
    const hora = `${horaCorta(citaSeleccionadaNota.fechaHoraInicio)} - ${horaCorta(citaSeleccionadaNota.fechaHoraFin)}`;

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
          <div class="doc-tag">Nota Clínica SOAP</div>
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

  const abrirModalReprogramar = (cita: any) => {
    setCitaSeleccionadaReprog(cita);
    const fechaHora = new Date(cita.fechaHoraInicio);
    setFormReprog({
      fecha: fechaYmdLocal(fechaHora),
      horaInicio: horaHmLocal(fechaHora),
      horaFin: horaHmLocal(new Date(cita.fechaHoraFin)),
      motivo: '',
    });
    setMostrarModalReprog(true);
  };

  const handleReprogramar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!citaSeleccionadaReprog || procesando) return;
    setProcesando(true);
    try {
      const nuevaInicio = `${formReprog.fecha}T${formReprog.horaInicio}:00`;
      const nuevaFin = `${formReprog.fecha}T${formReprog.horaFin}:00`;

      await apiFetch(`/citas/${citaSeleccionadaReprog.id}/reprogramar`, {
        method: 'PUT',
        body: JSON.stringify({
          nuevaFechaHoraInicio: nuevaInicio,
          nuevaFechaHoraFin: nuevaFin,
          motivoReprogramacion: formReprog.motivo || 'Reprogramación por terapeuta',
        }),
      });
      toast.success('Cita reprogramada exitosamente.');
      setMostrarModalReprog(false);
      cargarCitas();
    } catch (err: any) {
      toast.error(err.message || 'Error al reprogramar cita');
    } finally {
      setProcesando(false);
    }
  };

  // Métricas de agenda
  const totalCitas = citas.length;
  const atendidas = citas.filter((c) => c.estado === 'ATENDIDA').length;
  const pendientes = citas.filter((c) => c.estado === 'PROGRAMADA' || c.estado === 'CONFIRMADA').length;

  // Construcción de lista de pacientes únicos (desde endpoint o fallback desde citas)
  const listaPacientes: any[] = estadisticas?.pacientes ?? (() => {
    const mapa = new Map<string, any>();
    citas.forEach((c) => {
      if (!c.paciente) return;
      if (!mapa.has(c.pacienteId)) {
        mapa.set(c.pacienteId, {
          paciente: c.paciente,
          totalCitas: 0,
          citasAtendidas: 0,
          inasistencias: 0,
          ultimaCita: c.fechaHoraInicio,
          citas: [],
          notasSoap: [],
        });
      }
      const item = mapa.get(c.pacienteId);
      item.totalCitas += 1;
      if (c.estado === 'ATENDIDA') item.citasAtendidas += 1;
      if (c.estado === 'NO_ASISTIO') item.inasistencias += 1;
      item.citas.push(c);
      if (c.evolucionClinica) {
        item.notasSoap.push({
          ...c.evolucionClinica,
          cita: c,
          fechaHoraInicio: c.fechaHoraInicio,
          fechaHoraFin: c.fechaHoraFin,
          tipoCita: c.tipoCita,
        });
      }
    });
    return Array.from(mapa.values());
  })();

  const pacientesFiltrados = listaPacientes.filter((item) => {
    if (!busquedaPaciente.trim()) return true;
    const q = busquedaPaciente.toLowerCase();
    const p = item.paciente;
    return (
      p?.dni?.toLowerCase().includes(q) ||
      p?.nombres?.toLowerCase().includes(q) ||
      p?.apellidos?.toLowerCase().includes(q)
    );
  });

  const pacienteDetalleActivo =
    pacientesFiltrados.find((p) => p.paciente?.id === pacienteSeleccionadoId) ||
    pacientesFiltrados[0] ||
    null;

  // Métricas de Mis Estadísticas
  const ahoraMes = new Date();
  const sesionesAtendidasMes =
    estadisticas?.sesionesAtendidasMes ??
    citas.filter((c) => {
      const f = new Date(c.fechaHoraInicio);
      return (
        c.estado === 'ATENDIDA' &&
        f.getMonth() === ahoraMes.getMonth() &&
        f.getFullYear() === ahoraMes.getFullYear()
      );
    }).length;
  const pacientesActivosCount = estadisticas?.pacientesActivos ?? listaPacientes.length;
  const totalNoAsistio =
    estadisticas?.totalInasistencias ?? citas.filter((c) => c.estado === 'NO_ASISTIO').length;
  const tasaInasistencia =
    estadisticas?.tasaInasistencia ??
    (atendidas + totalNoAsistio > 0
      ? Math.round((totalNoAsistio / (atendidas + totalNoAsistio)) * 100)
      : 0);
  const sesionesPorSemana: any[] = estadisticas?.sesionesPorSemana ?? [];
  const maxSesionesSemana = Math.max(
    1,
    ...sesionesPorSemana.map((s: any) => Math.max(s.total || 0, s.atendidas || 0))
  );

  const citasActivasPsico = citas.filter((c) => c.estado !== 'CANCELADA');
  const riesgoBajoCount = resumenMl?.distribucionRiesgo?.bajo ?? citasActivasPsico.filter((c) => !c.nivelRiesgoInasistencia || c.nivelRiesgoInasistencia === 'BAJO').length;
  const riesgoMedioCount = resumenMl?.distribucionRiesgo?.medio ?? citasActivasPsico.filter((c) => c.nivelRiesgoInasistencia === 'MEDIO').length;
  const riesgoAltoCount = resumenMl?.distribucionRiesgo?.alto ?? citasActivasPsico.filter((c) => c.nivelRiesgoInasistencia === 'ALTO').length;
  const totalRiesgoCount = Math.max(1, riesgoBajoCount + riesgoMedioCount + riesgoAltoCount);
  const datosPastelRiesgo = [
    { name: 'Riesgo Bajo', value: riesgoBajoCount, color: '#10b981' },
    { name: 'Riesgo Medio', value: riesgoMedioCount, color: '#f59e0b' },
    { name: 'Riesgo Alto', value: riesgoAltoCount, color: '#f43f5e' },
  ];
  const citasRiesgoAlto = citasActivasPsico.filter((c) => c.nivelRiesgoInasistencia === 'ALTO');

  const pestanas: { id: TabPsicologo; Icono: typeof Calendar; texto: string }[] = [
    { id: 'agenda', Icono: Calendar, texto: 'Mi Agenda' },
    { id: 'pacientes', Icono: Users, texto: 'Mis Pacientes' },
    { id: 'estadisticas', Icono: BarChart3, texto: 'Mis Estadísticas' },
  ];

  return (
    <div className="flex min-h-screen flex-col bg-axioma-50 font-sans text-axiomaText-ink antialiased selection:bg-axioma-200 lg:flex-row">

      {/* SIDEBAR */}
      <aside className="flex shrink-0 flex-col gap-4 bg-axioma-900 p-4 text-white lg:sticky lg:top-0 lg:h-screen lg:w-72 lg:justify-between lg:gap-0 lg:p-6">
        <div>
          <div className="flex items-center justify-between">
            <LogoAxioma oscuro subtitulo="Portal Clínico • C.Ps.P." />
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
            aria-label="Secciones del portal del psicólogo"
          >
            {pestanas.map(({ id, Icono, texto }) => (
              <button
                key={id}
                onClick={() => setTabActiva(id)}
                aria-current={tabActiva === id ? 'page' : undefined}
                className={`flex shrink-0 items-center gap-3 whitespace-nowrap rounded-button px-4 py-2.5 text-sm font-medium transition-colors duration-150 lg:w-full ${focoClaro} ${
                  tabActiva === id
                    ? 'bg-axioma-600 text-white shadow-sm'
                    : 'text-axioma-100 hover:bg-white/10 hover:text-white'
                }`}
              >
                <Icono className="h-4 w-4" />
                <span>{texto}</span>
              </button>
            ))}
          </nav>
        </div>

        {/* Perfil del psicólogo (desktop) */}
        <div className="hidden space-y-3 lg:block">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs text-axioma-200 transition hover:text-white"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Volver al sitio público</span>
          </Link>
          <div className="rounded-card-sm bg-white/10 p-3.5">
            <div className="flex items-center justify-between gap-2">
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-white">
                  {usuario?.perfil?.nombres
                    ? `Lic. ${usuario.perfil.nombres} ${usuario.perfil.apellidos}`
                    : usuario?.correo}
                </p>
                <p className="truncate text-xs font-medium text-axioma-200">
                  {usuario?.perfil?.numeroColegiatura
                    ? `Colegiatura: ${usuario.perfil.numeroColegiatura}`
                    : 'Terapeuta Colegiado'}
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
        </div>
      </aside>

      {/* CONTENIDO PRINCIPAL */}
      <main className="min-w-0 flex-1 animate-fade-in p-4 motion-reduce:animate-none sm:p-6 lg:p-10">
        <div className="mx-auto max-w-[1400px] space-y-6">

          {errorAcceso && (
            <div className="flex items-center gap-3 rounded-card border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
              <AlertCircle className="h-5 w-5 shrink-0 text-amber-600" />
              <span>{errorAcceso}</span>
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 1: MI AGENDA ("Agenda & Seguimiento Clínico")                         */}
          {/* ========================================================================= */}
          {tabActiva === 'agenda' && (
            <div className="space-y-6">
              {/* Título y Filtros */}
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h1 className="font-display text-2xl font-medium tracking-heading text-axiomaText-ink sm:text-3xl">
                    Agenda & Seguimiento Clínico
                  </h1>
                  <p className="mt-1 text-sm text-axiomaText-soft">
                    Supervisa tus consultas del día, registra la evolución en notas SOAP y controla la asistencia.
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <input
                    type="date"
                    value={filtroFecha}
                    onChange={(e) => {
                      setFiltroFecha(e.target.value);
                      cargarCitas(e.target.value);
                    }}
                    className="rounded-button border border-axioma-200 bg-white px-3 py-2 text-xs font-medium text-axiomaText-ink shadow-sm"
                  />
                  {filtroFecha && (
                    <button
                      onClick={() => {
                        setFiltroFecha('');
                        cargarCitas('');
                      }}
                      className="text-xs text-axiomaText-soft hover:text-axioma-700"
                    >
                      Todas las fechas
                    </button>
                  )}
                  <button onClick={() => cargarCitas()} className={btnIcono} title="Actualizar agenda">
                    <RefreshCw className={`h-4 w-4 ${cargando ? 'animate-spin' : ''}`} />
                  </button>
                </div>
              </div>

              {/* Métricas rápidas */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div className="rounded-card border border-axioma-200 bg-white p-5 shadow-card">
                  <span className="text-xs font-medium text-axiomaText-soft">Consultas en Agenda</span>
                  <p className="mt-2 text-3xl font-bold tracking-heading text-axiomaText-ink">{totalCitas}</p>
                </div>
                <div className="rounded-card border border-axioma-200 bg-axioma-100 p-5 shadow-card">
                  <span className="text-xs font-medium text-axioma-800">Sesiones Atendidas</span>
                  <p className="mt-2 text-3xl font-bold tracking-heading text-axioma-900">{atendidas}</p>
                </div>
                <div className="rounded-card border border-white/60 bg-heather p-5 shadow-card">
                  <span className="text-xs font-medium text-axiomaText-soft">Consultas Pendientes</span>
                  <p className="mt-2 text-3xl font-bold tracking-heading text-axiomaText-ink">{pendientes}</p>
                </div>
              </div>

              {/* Tabla de Citas */}
              <div className={`${card} overflow-hidden`}>
                <div className="border-b border-axioma-100 bg-axioma-50/60 px-6 py-4">
                  <h2 className="font-display text-lg font-medium tracking-heading text-axiomaText-ink">
                    Pacientes citados ({citas.length})
                  </h2>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full min-w-[850px] text-left text-sm text-axiomaText-soft">
                    <thead className="border-b border-axioma-100 bg-axioma-50">
                      <tr>
                        <th className={thClase}>Paciente</th>
                        <th className={thClase}>Fecha y Turno</th>
                        <th className={thClase}>Tipo Cita</th>
                        <th className={thClase}>Riesgo No-Show (ML)</th>
                        <th className={thClase}>Estado</th>
                        <th className={`${thClase} text-right`}>Acción Clínica</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-axioma-100">
                      {citas.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="px-6 py-12 text-center text-axiomaText-soft">
                            No tienes citas programadas para el criterio seleccionado.
                          </td>
                        </tr>
                      ) : (
                        citas.map((c) => (
                          <tr key={c.id} className="transition-colors hover:bg-axioma-50">
                            <td className={tdClase}>
                              <div className="font-semibold text-axiomaText-ink">
                                {c.paciente ? `${c.paciente.nombres} ${c.paciente.apellidos}` : 'Paciente'}
                              </div>
                              <div className="text-xs text-axiomaText-soft">DNI: {c.paciente?.dni || 'N/A'}</div>
                            </td>
                            <td className={tdClase}>
                              <div className="font-medium text-axiomaText-ink">{fechaCorta(c.fechaHoraInicio)}</div>
                              <div className="text-xs tabular-nums text-axioma-700">
                                {horaCorta(c.fechaHoraInicio)} - {horaCorta(c.fechaHoraFin)}
                              </div>
                            </td>
                            <td className={tdClase}>
                              <span className="rounded-tag bg-axioma-100 px-2 py-0.5 text-xs font-semibold text-axioma-800">
                                {c.tipoCita || 'TERAPIA'}
                              </span>
                            </td>
                            <td className={tdClase}>
                              {c.nivelRiesgoInasistencia ? (
                                <span className={`${pastilla} ${claseRiesgo(c.nivelRiesgoInasistencia)}`}>
                                  {c.nivelRiesgoInasistencia} ({Math.round(Number(c.probabilidadInasistencia || 0) * 100)}%)
                                </span>
                              ) : (
                                <span className="text-xs text-axiomaText-soft">Normal</span>
                              )}
                            </td>
                            <td className={tdClase}>
                              <span className={`${pastilla} ${claseEstadoCita(c.estado)}`}>
                                {c.estado}
                              </span>
                            </td>
                            <td className={`${tdClase} text-right`}>
                              <div className="flex flex-wrap items-center justify-end gap-1.5">
                                {c.nivelRiesgoInasistencia === 'ALTO' && (
                                  <button
                                    type="button"
                                    onClick={() => setCitaParaRecordatorio(c)}
                                    title="Alto riesgo de inasistencia: enviar recordatorio manual"
                                    className="inline-flex items-center gap-1 rounded-button border border-amber-300 bg-amber-100 px-2.5 py-1 text-xs font-medium text-amber-800 transition hover:bg-amber-200/80"
                                  >
                                    <Bell className="h-3.5 w-3.5" />
                                    <span>Recordar</span>
                                  </button>
                                )}
                                {c.estado === 'PROGRAMADA' && (
                                  <>
                                    <button
                                      disabled={procesando}
                                      onClick={() => handleMarcarAsistencia(c)}
                                      className={`${btnPrimary} px-2.5 py-1 text-xs disabled:opacity-50 disabled:cursor-not-allowed`}
                                    >
                                      Asistencia
                                    </button>
                                    <button
                                      disabled={procesando}
                                      onClick={() => handleMarcarNoAsistio(c)}
                                      className="rounded-button border border-rose-200 bg-rose-50 px-2 py-1 text-xs font-medium text-rose-700 hover:bg-rose-100 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                      No asistió
                                    </button>
                                    <button
                                      disabled={procesando}
                                      onClick={() => abrirModalReprogramar(c)}
                                      className={`${btnSecondary} px-2 py-1 text-xs disabled:opacity-50 disabled:cursor-not-allowed`}
                                    >
                                      Reprogramar
                                    </button>
                                    <button
                                      disabled={procesando}
                                      onClick={() => handleCancelar(c)}
                                      className="rounded p-1 text-axiomaText-soft hover:text-rose-700 disabled:opacity-50 disabled:cursor-not-allowed"
                                      title="Cancelar cita"
                                    >
                                      <XCircle className="h-4 w-4" />
                                    </button>
                                  </>
                                )}
                                <button
                                  onClick={() => abrirModalNota(c)}
                                  className="inline-flex items-center gap-1 rounded-button bg-axioma-100 px-2.5 py-1 text-xs font-semibold text-axioma-800 hover:bg-axioma-200"
                                >
                                  <FileText className="h-3.5 w-3.5" />
                                  <span>Nota SOAP</span>
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

          {/* ========================================================================= */}
          {/* TAB 2: MIS PACIENTES (Pacientes únicos + Historial completo SOAP)         */}
          {/* ========================================================================= */}
          {tabActiva === 'pacientes' && (
            <div className="space-y-6">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h1 className="font-display text-2xl font-medium tracking-heading text-axiomaText-ink sm:text-3xl">
                    Mis Pacientes & Expediente Clínico
                  </h1>
                  <p className="mt-1 text-sm text-axiomaText-soft">
                    Selecciona un paciente de tu cartera para revisar su historial completo de evoluciones SOAP.
                  </p>
                </div>
                <button onClick={() => cargarCitas()} className={btnIcono} title="Sincronizar expedientes">
                  <RefreshCw className={`h-4 w-4 ${cargando ? 'animate-spin' : ''}`} />
                </button>
              </div>

              {/* Buscador */}
              <div className={`${card} flex items-center gap-3 p-4`}>
                <Search className="h-5 w-5 text-axiomaText-soft" />
                <input
                  type="text"
                  placeholder="Buscar paciente por DNI, nombres o apellidos..."
                  value={busquedaPaciente}
                  onChange={(e) => setBusquedaPaciente(e.target.value)}
                  className="w-full bg-transparent text-sm text-axiomaText-ink outline-none placeholder:text-axiomaText-soft"
                />
                {busquedaPaciente && (
                  <button
                    onClick={() => setBusquedaPaciente('')}
                    className="text-xs font-medium text-axiomaText-soft hover:text-axiomaText-ink"
                  >
                    Limpiar
                  </button>
                )}
              </div>

              {/* Grid Maestro-Detalle: Lista de pacientes únicos (izq) + Historial SOAP completo (der) */}
              <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
                {/* Columna Izquierda: Lista de Pacientes Únicos */}
                <div className="lg:col-span-5 space-y-3">
                  <div className={`${card} overflow-hidden`}>
                    <div className="border-b border-axioma-100 bg-axioma-50/70 px-5 py-3.5">
                      <h2 className="font-display text-base font-medium text-axiomaText-ink">
                        Pacientes asignados ({pacientesFiltrados.length})
                      </h2>
                    </div>

                    {pacientesFiltrados.length === 0 ? (
                      <div className="p-8 text-center text-sm text-axiomaText-soft">
                        No se encontraron pacientes registrados en tu historial de citas.
                      </div>
                    ) : (
                      <div className="divide-y divide-axioma-100 max-h-[620px] overflow-y-auto">
                        {pacientesFiltrados.map((item) => {
                          const p = item.paciente;
                          const seleccionado = pacienteDetalleActivo?.paciente?.id === p?.id;
                          return (
                            <button
                              key={p?.id}
                              type="button"
                              onClick={() => setPacienteSeleccionadoId(p?.id)}
                              className={`w-full text-left px-5 py-4 transition-colors flex items-center justify-between gap-3 ${
                                seleccionado
                                  ? 'bg-axioma-100/80 border-l-4 border-axioma-700'
                                  : 'hover:bg-axioma-50/70'
                              }`}
                            >
                              <div className="min-w-0">
                                <p className="font-semibold text-sm text-axiomaText-ink truncate">
                                  {p?.nombres} {p?.apellidos}
                                </p>
                                <p className="mt-0.5 text-xs text-axiomaText-soft">
                                  DNI: <span className="font-mono">{p?.dni}</span>
                                  {p?.telefono ? ` • Tel: ${p.telefono}` : ''}
                                </p>
                                <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px]">
                                  <span className="rounded-tag bg-white border border-axioma-200 px-2 py-0.5 font-medium text-axioma-800">
                                    {item.citasAtendidas} {item.citasAtendidas === 1 ? 'sesión atendida' : 'sesiones atendidas'}
                                  </span>
                                  <span className="rounded-tag bg-heather px-2 py-0.5 font-medium text-axiomaText-ink">
                                    {item.notasSoap?.length || 0} {item.notasSoap?.length === 1 ? 'nota SOAP' : 'notas SOAP'}
                                  </span>
                                </div>
                              </div>
                              <ChevronRight
                                className={`h-4 w-4 shrink-0 transition-transform ${
                                  seleccionado ? 'text-axioma-800 translate-x-0.5' : 'text-axiomaText-soft'
                                }`}
                              />
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>

                {/* Columna Derecha: Historial Completo de Notas SOAP del Paciente Seleccionado */}
                <div className="lg:col-span-7">
                  {!pacienteDetalleActivo ? (
                    <div className={`${card} p-10 text-center text-sm text-axiomaText-soft`}>
                      Selecciona un paciente de la lista para visualizar su historial clínico de notas SOAP.
                    </div>
                  ) : (
                    <div className={`${card} overflow-hidden`}>
                      {/* Cabecera del expediente del paciente */}
                      <div className="border-b border-axioma-200/80 bg-heather/60 px-6 py-5">
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                          <div>
                            <span className="inline-block rounded-tag bg-axioma-800 px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wider text-white">
                              Expediente Clínico
                            </span>
                            <h2 className="mt-1.5 font-display text-xl font-medium text-axiomaText-ink">
                              {pacienteDetalleActivo.paciente?.nombres} {pacienteDetalleActivo.paciente?.apellidos}
                            </h2>
                            <p className="text-xs text-axiomaText-soft">
                              DNI: {pacienteDetalleActivo.paciente?.dni} • Correo: {pacienteDetalleActivo.paciente?.correo || 'No registrado'} • Teléfono: {pacienteDetalleActivo.paciente?.telefono || 'No registrado'}
                            </p>
                          </div>
                          <div className="text-left sm:text-right">
                            <span className="text-xs font-medium text-axiomaText-soft">Total evoluciones registradas</span>
                            <p className="font-display text-2xl font-bold text-axioma-900">
                              {pacienteDetalleActivo.notasSoap?.length || 0}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Cuerpo: Lista cronológica de todas las notas SOAP */}
                      <div className="p-6 space-y-5 max-h-[680px] overflow-y-auto">
                        {(!pacienteDetalleActivo.notasSoap || pacienteDetalleActivo.notasSoap.length === 0) ? (
                          <div className="rounded-card-sm border border-dashed border-axioma-200 bg-axioma-50/50 p-8 text-center">
                            <ClipboardList className="mx-auto h-8 w-8 text-axioma-600/70" />
                            <p className="mt-2 text-sm font-medium text-axiomaText-ink">
                              Este paciente aún no cuenta con notas SOAP registradas.
                            </p>
                            <p className="mt-1 text-xs text-axiomaText-soft">
                              Puedes registrar la evolución desde su cita correspondiente.
                            </p>
                            {pacienteDetalleActivo.citas?.[0] && (
                              <button
                                type="button"
                                onClick={() => abrirModalNota(pacienteDetalleActivo.citas[0])}
                                className={`${btnPrimary} ${tamSm} mt-4`}
                              >
                                <FileText className="h-3.5 w-3.5" />
                                <span>Registrar Nota SOAP de última cita</span>
                              </button>
                            )}
                          </div>
                        ) : (
                          pacienteDetalleActivo.notasSoap.map((ev: any, idx: number) => {
                            const obs = parsearObservaciones(ev.observacionesConductuales || '');
                            const soap = parsearNotaEvolucion(ev.notaEvolucion || '');
                            const numSesion = pacienteDetalleActivo.notasSoap.length - idx;
                            return (
                              <div
                                key={ev.id || idx}
                                className="rounded-card border border-axioma-200 bg-white shadow-sm overflow-hidden"
                              >
                                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-axioma-100 bg-axioma-50 px-4 py-3">
                                  <div className="flex items-center gap-2">
                                    <span className="rounded bg-axioma-800 px-2 py-0.5 text-[11px] font-bold text-white">
                                      Evolución #{numSesion}
                                    </span>
                                    <span className="text-xs font-semibold text-axiomaText-ink">
                                      {fechaCorta(ev.fechaHoraInicio || ev.fechaSesion)} • {horaCorta(ev.fechaHoraInicio || ev.fechaSesion)}
                                    </span>
                                    <span className="rounded-tag bg-axioma-100 px-2 py-0.5 text-[11px] font-semibold text-axioma-800">
                                      CIE-10: {soap.cie10}
                                    </span>
                                  </div>
                                  {ev.cita && (
                                    <button
                                      type="button"
                                      onClick={() => abrirModalNota(ev.cita)}
                                      className="inline-flex items-center gap-1 rounded-button border border-axioma-200 bg-white px-2.5 py-1 text-xs font-semibold text-axioma-800 hover:bg-axioma-100"
                                    >
                                      <FileText className="h-3.5 w-3.5" />
                                      <span>Ver / Imprimir A4</span>
                                    </button>
                                  )}
                                </div>

                                <div className="p-4 space-y-3 text-xs">
                                  <div>
                                    <span className="font-semibold text-axiomaText-soft">Motivo / Foco de sesión: </span>
                                    <span className="font-medium text-axiomaText-ink">
                                      {ev.motivoConsulta || 'Consulta psicoterapéutica'}
                                    </span>
                                  </div>

                                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                                    <div className="rounded-card-sm border border-axioma-100 bg-axioma-50/40 p-3">
                                      <p className="font-bold uppercase tracking-wider text-axioma-800 text-[11px]">
                                        S — Subjetivo
                                      </p>
                                      <p className="mt-1 text-axiomaText-body leading-relaxed">
                                        {soap.subjetivo || ev.notaEvolucion || 'Sin registro subjetivo.'}
                                      </p>
                                    </div>

                                    <div className="rounded-card-sm border border-axioma-100 bg-axioma-50/40 p-3">
                                      <p className="font-bold uppercase tracking-wider text-axioma-800 text-[11px]">
                                        O — Objetivo (Examen Mental)
                                      </p>
                                      <p className="mt-1 text-axiomaText-body">
                                        <strong>Afecto:</strong> {obs.afecto} | <strong>Lenguaje:</strong> {obs.lenguaje}
                                      </p>
                                      <p className="mt-0.5 text-axiomaText-body">
                                        <strong>Conducta:</strong> {obs.conducta}
                                      </p>
                                    </div>

                                    <div className="rounded-card-sm border border-axioma-100 bg-heather/30 p-3">
                                      <p className="font-bold uppercase tracking-wider text-axioma-900 text-[11px]">
                                        A — Análisis & Técnicas
                                      </p>
                                      <p className="mt-1 text-axiomaText-body leading-relaxed">
                                        {soap.analisis || 'Evolución clínica en curso.'}
                                      </p>
                                      {ev.tecnicasUtilizadas && (
                                        <p className="mt-1 text-[11px] text-axiomaText-soft">
                                          <strong>Técnicas:</strong> {ev.tecnicasUtilizadas}
                                        </p>
                                      )}
                                    </div>

                                    <div className="rounded-card-sm border border-axioma-100 bg-heather/30 p-3">
                                      <p className="font-bold uppercase tracking-wider text-axioma-900 text-[11px]">
                                        P — Plan & Tareas
                                      </p>
                                      <p className="mt-1 text-axiomaText-body">
                                        <strong>Tareas:</strong> {ev.tareasCasa || 'Continuar autorregistros.'}
                                      </p>
                                      <p className="mt-0.5 text-axiomaText-body">
                                        <strong>Seguimiento:</strong> {soap.proximaSesion}
                                      </p>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            );
                          })
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 3: MIS ESTADÍSTICAS (Resumen mensual + Gráfico de barras semanal)     */}
          {/* ========================================================================= */}
          {tabActiva === 'estadisticas' && (
            <div className="space-y-6">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h1 className="font-display text-2xl font-medium tracking-heading text-axiomaText-ink sm:text-3xl">
                    Mis Estadísticas Clínicas
                  </h1>
                  <p className="mt-1 text-sm text-axiomaText-soft">
                    Indicadores de desempeño terapéutico, adherencia de pacientes y evolución semanal de sesiones.
                  </p>
                </div>
                <button onClick={() => cargarCitas()} className={btnIcono} title="Actualizar estadísticas">
                  <RefreshCw className={`h-4 w-4 ${cargando ? 'animate-spin' : ''}`} />
                </button>
              </div>

              {/* 3 Tarjetas de Resumen solicitadas */}
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
                <div className="rounded-card border border-axioma-200 bg-white p-6 shadow-card">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold uppercase tracking-wider text-axiomaText-soft">
                      Sesiones Atendidas (Mes)
                    </span>
                    <span className="flex h-9 w-9 items-center justify-center rounded-full bg-axioma-100 text-axioma-800">
                      <CheckCircle2 className="h-5 w-5" />
                    </span>
                  </div>
                  <p className="mt-3 font-display text-4xl font-bold tracking-heading text-axiomaText-ink">
                    {sesionesAtendidasMes}
                  </p>
                  <p className="mt-1 text-xs text-axiomaText-soft">
                    Total histórico acumulado: <strong className="text-axiomaText-ink">{estadisticas?.totalAtendidas ?? atendidas}</strong> sesiones
                  </p>
                </div>

                <div className="rounded-card border border-axioma-200 bg-axioma-100 p-6 shadow-card">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold uppercase tracking-wider text-axioma-800">
                      Pacientes Activos
                    </span>
                    <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white/80 text-axioma-900">
                      <UserCheck className="h-5 w-5" />
                    </span>
                  </div>
                  <p className="mt-3 font-display text-4xl font-bold tracking-heading text-axioma-900">
                    {pacientesActivosCount}
                  </p>
                  <p className="mt-1 text-xs text-axioma-800">
                    Consultantes únicos asignados a tu cartera clínica
                  </p>
                </div>

                <div className="rounded-card border border-white/60 bg-heather p-6 shadow-card">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold uppercase tracking-wider text-axiomaText-soft">
                      Tasa de Inasistencia
                    </span>
                    <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white/80 text-rose-700">
                      <TrendingUp className="h-5 w-5" />
                    </span>
                  </div>
                  <p className="mt-3 font-display text-4xl font-bold tracking-heading text-axiomaText-ink">
                    {tasaInasistencia}%
                  </p>
                  <p className="mt-1 text-xs text-axiomaText-soft">
                    {totalNoAsistio} {totalNoAsistio === 1 ? 'inasistencia registrada' : 'inasistencias registradas'} (No-Show)
                  </p>
                </div>
              </div>

              {/* Gráfico de barras de Sesiones por Semana */}
              <div className={`${card} p-6`}>
                <div className="flex flex-col gap-3 border-b border-axioma-100 pb-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h2 className="font-display text-lg font-medium tracking-heading text-axiomaText-ink">
                      Evolución de Sesiones por Semana (Últimas 4 semanas)
                    </h2>
                    <p className="text-xs text-axiomaText-soft">
                      Comparativa semanal entre sesiones efectivamente atendidas, programadas e inasistencias.
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-4 text-xs">
                    <span className="flex items-center gap-1.5 text-axiomaText-soft">
                      <span className="h-3 w-3 rounded-sm bg-axioma-700" />
                      <span>Atendidas</span>
                    </span>
                    <span className="flex items-center gap-1.5 text-axiomaText-soft">
                      <span className="h-3 w-3 rounded-sm bg-axioma-300" />
                      <span>Programadas</span>
                    </span>
                    <span className="flex items-center gap-1.5 text-axiomaText-soft">
                      <span className="h-3 w-3 rounded-sm bg-rose-400" />
                      <span>No asistió</span>
                    </span>
                  </div>
                </div>

                {sesionesPorSemana.length === 0 ? (
                  <div className="py-12 text-center text-sm text-axiomaText-soft">
                    Aún no hay suficientes registros semanales para graficar.
                  </div>
                ) : (
                  <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-4">
                    {sesionesPorSemana.map((sem: any, idx: number) => {
                      const pctAtendidas = Math.round(((sem.atendidas || 0) / maxSesionesSemana) * 100);
                      const pctProgramadas = Math.round(((sem.programadas || 0) / maxSesionesSemana) * 100);
                      const pctNoAsistio = Math.round(((sem.noAsistio || 0) / maxSesionesSemana) * 100);

                      return (
                        <div
                          key={idx}
                          className="flex flex-col justify-between rounded-card-sm border border-axioma-100 bg-axioma-50/40 p-4"
                        >
                          <div>
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-bold text-axiomaText-ink">{sem.etiqueta}</span>
                              <span className="rounded-tag bg-white px-2 py-0.5 text-[11px] font-semibold text-axioma-800 border border-axioma-200">
                                {sem.total} {sem.total === 1 ? 'cita' : 'citas'}
                              </span>
                            </div>
                            <p className="mt-0.5 text-[11px] text-axiomaText-soft">{sem.rango}</p>
                          </div>

                          {/* Barras verticales proporcionales */}
                          <div className="my-5 flex h-36 items-end justify-center gap-3 border-b border-axioma-200/80 px-3 pb-2">
                            <div className="flex h-full flex-col items-center justify-end gap-1 w-8">
                              <span className="text-[11px] font-bold text-axioma-800">{sem.atendidas}</span>
                              <div
                                className="w-full rounded-t bg-axioma-700 transition-all duration-300"
                                style={{ height: `${Math.max(pctAtendidas, sem.atendidas > 0 ? 14 : 4)}%` }}
                                title={`Atendidas: ${sem.atendidas}`}
                              />
                            </div>
                            <div className="flex h-full flex-col items-center justify-end gap-1 w-8">
                              <span className="text-[11px] font-semibold text-axiomaText-soft">{sem.programadas}</span>
                              <div
                                className="w-full rounded-t bg-axioma-300 transition-all duration-300"
                                style={{ height: `${Math.max(pctProgramadas, sem.programadas > 0 ? 14 : 4)}%` }}
                                title={`Programadas: ${sem.programadas}`}
                              />
                            </div>
                            <div className="flex h-full flex-col items-center justify-end gap-1 w-8">
                              <span className="text-[11px] font-semibold text-rose-700">{sem.noAsistio}</span>
                              <div
                                className="w-full rounded-t bg-rose-400 transition-all duration-300"
                                style={{ height: `${Math.max(pctNoAsistio, sem.noAsistio > 0 ? 14 : 4)}%` }}
                                title={`No asistió: ${sem.noAsistio}`}
                              />
                            </div>
                          </div>

                          <div className="flex items-center justify-between text-[11px] text-axiomaText-soft">
                            <span>Efectividad:</span>
                            <strong className="text-axiomaText-ink">
                              {sem.atendidas + sem.noAsistio > 0
                                ? `${Math.round((sem.atendidas / (sem.atendidas + sem.noAsistio)) * 100)}%`
                                : '100%'}
                            </strong>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Sección: Predicción de Inasistencia (Machine Learning) */}
              <div className={`${card} p-6`}>
                <div className="flex flex-col gap-2 border-b border-axioma-100 pb-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-center gap-2.5">
                    <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-axioma-900 text-axioma-300">
                      <BrainCircuit className="h-5 w-5" />
                    </span>
                    <div>
                      <h2 className="font-display text-lg font-medium tracking-heading text-axiomaText-ink">
                        Predicción de Inasistencia (Machine Learning)
                      </h2>
                      <p className="text-xs text-axiomaText-soft">
                        Distribución de niveles de riesgo No-Show en tu cartera y alertas preventivas (Precisión 84.6% • ROC-AUC 0.87).
                      </p>
                    </div>
                  </div>
                </div>

                <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-12">
                  {/* Gráfico de Pastel con Distribución de Riesgo */}
                  <div className="flex flex-col items-center justify-center rounded-card-sm border border-axioma-100 bg-axioma-50/40 p-5 lg:col-span-5">
                    <div className="h-48 w-48">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={datosPastelRiesgo}
                            dataKey="value"
                            nameKey="name"
                            cx="50%"
                            cy="50%"
                            innerRadius={42}
                            outerRadius={76}
                            paddingAngle={3}
                          >
                            {datosPastelRiesgo.map((entry, idx) => (
                              <Cell key={`riesgo-cell-${idx}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip formatter={(value: any) => `${value} cita(s)`} />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>

                    <div className="mt-3 grid w-full grid-cols-3 gap-2 text-center text-xs">
                      <div className="rounded-lg border border-emerald-200 bg-emerald-50/70 p-2">
                        <span className="block font-bold text-emerald-900">{riesgoBajoCount} ({Math.round((riesgoBajoCount / totalRiesgoCount) * 100)}%)</span>
                        <span className="text-[11px] text-emerald-700">Riesgo Bajo</span>
                      </div>
                      <div className="rounded-lg border border-amber-200 bg-amber-50/70 p-2">
                        <span className="block font-bold text-amber-900">{riesgoMedioCount} ({Math.round((riesgoMedioCount / totalRiesgoCount) * 100)}%)</span>
                        <span className="text-[11px] text-amber-700">Riesgo Medio</span>
                      </div>
                      <div className="rounded-lg border border-rose-200 bg-rose-50/70 p-2">
                        <span className="block font-bold text-rose-900">{riesgoAltoCount} ({Math.round((riesgoAltoCount / totalRiesgoCount) * 100)}%)</span>
                        <span className="text-[11px] text-rose-700">Riesgo Alto</span>
                      </div>
                    </div>
                  </div>

                  {/* Lista de Pacientes con Riesgo Alto + Botón Enviar Recordatorio */}
                  <div className="flex flex-col justify-between rounded-card-sm border border-axioma-100 bg-white p-5 lg:col-span-7">
                    <div>
                      <div className="mb-3 flex items-center justify-between">
                        <h3 className="text-sm font-bold text-axiomaText-ink">
                          Pacientes con Riesgo Alto de Inasistencia ({citasRiesgoAlto.length})
                        </h3>
                        <span className="rounded-tag bg-rose-100 px-2.5 py-0.5 text-[11px] font-semibold text-rose-800">
                          Probabilidad &gt; 65%
                        </span>
                      </div>

                      {citasRiesgoAlto.length === 0 ? (
                        <div className="rounded-lg border border-dashed border-axioma-200 bg-axioma-50/50 p-8 text-center text-xs text-axiomaText-soft">
                          Actualmente no tienes citas con alerta de Riesgo Alto en tu agenda.
                        </div>
                      ) : (
                        <div className="max-h-64 divide-y divide-axioma-100 overflow-y-auto">
                          {citasRiesgoAlto.map((c) => (
                            <div key={c.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
                              <div>
                                <p className="text-sm font-semibold text-axiomaText-ink">
                                  {c.paciente ? `${c.paciente.nombres} ${c.paciente.apellidos}` : 'Paciente'}
                                </p>
                                <p className="text-xs text-axiomaText-soft">
                                  {fechaCorta(c.fechaHoraInicio)} • {horaCorta(c.fechaHoraInicio)} — Riesgo:{' '}
                                  <strong className="text-rose-700">
                                    {Math.round(Number(c.probabilidadInasistencia || 0.72) * 100)}%
                                  </strong>
                                </p>
                              </div>
                              <button
                                type="button"
                                onClick={() => setCitaParaRecordatorio(c)}
                                className="inline-flex items-center gap-1.5 rounded-button border border-amber-300 bg-amber-100 px-3 py-1.5 text-xs font-semibold text-amber-900 transition hover:bg-amber-200"
                              >
                                <Bell className="h-3.5 w-3.5" />
                                <span>Enviar Recordatorio</span>
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

        </div>
      </main>

      {/* MODAL: NOTA DE EVOLUCIÓN CLÍNICA (SOAP) */}
      {mostrarModalNota && (
        <div className={modalOverlay}>
          <div className={modalWrap}>
            <div className={`${modalCard} max-w-3xl max-h-[92vh] overflow-y-auto`} role="dialog" aria-modal="true">
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
                    Paciente: <strong className="text-axiomaText-ink">{citaSeleccionadaNota?.paciente?.nombres} {citaSeleccionadaNota?.paciente?.apellidos}</strong> • DNI: {citaSeleccionadaNota?.paciente?.dni || 'N/A'} • Sesión: {fechaCorta(citaSeleccionadaNota?.fechaHoraInicio)} ({horaCorta(citaSeleccionadaNota?.fechaHoraInicio)})
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

              <form onSubmit={handleGuardarNota} className="mt-4 space-y-4 text-left text-sm">
                <div>
                  <label className={label}>Motivo de consulta / Foco de sesión</label>
                  <input
                    type="text"
                    required
                    value={formNota.motivoConsulta}
                    onChange={(e) => setFormNota({ ...formNota, motivoConsulta: e.target.value })}
                    className={input}
                    placeholder="Ej. Cuadro de ansiedad laboral recurrente con sintomatología somática"
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
                    Discurso verbal del paciente, motivo manifiesto, quejas principales, nivel subjetivo de malestar y vivencias autoreportadas.
                  </p>
                  <textarea
                    rows={3}
                    required
                    value={formNota.subjetivo}
                    onChange={(e) => setFormNota({ ...formNota, subjetivo: e.target.value })}
                    className={input}
                    placeholder="El paciente refiere sentirse sobrepasado por la carga laboral. Manifiesta problemas de conciliación de sueño, rumiaciones nocturnas y opresión precordial..."
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
                        value={formNota.afecto}
                        onChange={(e) => setFormNota({ ...formNota, afecto: e.target.value })}
                        className={input}
                        placeholder="Eutímico / Ansioso / Lábil"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-xs font-semibold text-slate-700">Lenguaje / Discurso</label>
                      <input
                        type="text"
                        value={formNota.lenguaje}
                        onChange={(e) => setFormNota({ ...formNota, lenguaje: e.target.value })}
                        className={input}
                        placeholder="Fluido, coherente, espontáneo"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-xs font-semibold text-slate-700">Conducta y Actitud</label>
                      <input
                        type="text"
                        value={formNota.conductaObservada}
                        onChange={(e) => setFormNota({ ...formNota, conductaObservada: e.target.value })}
                        className={input}
                        placeholder="Colaborador, contacto visual normal"
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
                        required
                        value={formNota.analisis}
                        onChange={(e) => setFormNota({ ...formNota, analisis: e.target.value })}
                        className={input}
                        placeholder="Se identifican distorsiones cognitivas de catastrofización y sobregeneralización. Buena respuesta a la reestructuración..."
                      />
                    </div>
                    <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                      <div>
                        <label className="mb-1 block text-xs font-semibold text-amber-900">Código CIE-10 / Diagnóstico</label>
                        <input
                          type="text"
                          value={formNota.cie10}
                          onChange={(e) => setFormNota({ ...formNota, cie10: e.target.value })}
                          className={input}
                          placeholder="F41.1 (Ansiedad generalizada)"
                        />
                      </div>
                      <div>
                        <label className="mb-1 block text-xs font-semibold text-amber-900">Técnicas psicoterapéuticas</label>
                        <input
                          type="text"
                          value={formNota.tecnicasUtilizadas}
                          onChange={(e) => setFormNota({ ...formNota, tecnicasUtilizadas: e.target.value })}
                          className={input}
                          placeholder="Reestructuración cognitiva, respiración"
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
                        value={formNota.tareasCasa}
                        onChange={(e) => setFormNota({ ...formNota, tareasCasa: e.target.value })}
                        className={input}
                        placeholder="Registro de pensamientos automáticos 1x día"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-xs font-semibold text-emerald-900">Frecuencia / Próxima sesión</label>
                      <input
                        type="text"
                        value={formNota.proximaSesion}
                        onChange={(e) => setFormNota({ ...formNota, proximaSesion: e.target.value })}
                        className={input}
                        placeholder="Semanal - Continuar plan terapéutico"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex flex-col gap-2.5 border-t border-axioma-100 pt-3 sm:flex-row sm:items-center sm:justify-between">
                  <button
                    type="button"
                    onClick={handleImprimirReporte}
                    className="inline-flex items-center justify-center gap-1.5 rounded-button border border-axioma-300 bg-white px-3 py-2 text-xs font-semibold text-axiomaText-ink transition-colors hover:bg-axioma-50"
                  >
                    <Printer className="h-4 w-4 text-axioma-700" />
                    <span>Imprimir Ficha SOAP (A4)</span>
                  </button>

                  <div className="flex items-center justify-end gap-2">
                    <button
                      type="button"
                      disabled={guardandoNota}
                      onClick={() => setMostrarModalNota(false)}
                      className={`${btnSecondary} ${tamMd}`}
                    >
                      Cerrar
                    </button>
                    {(usuario?.rol === 'PSICOLOGO' || usuario?.rol === 'ADMINISTRADOR') && (
                      <button
                        type="submit"
                        disabled={guardandoNota}
                        className={`${btnPrimary} ${tamMd}`}
                      >
                        {guardandoNota ? 'Guardando...' : 'Guardar nota SOAP'}
                      </button>
                    )}
                  </div>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: REPROGRAMAR CITA */}
      {mostrarModalReprog && (
        <div className={modalOverlay}>
          <div className={modalWrap}>
            <div className={`${modalCard} max-w-md`} role="dialog" aria-modal="true">
              <h3 className="font-display text-xl font-medium tracking-heading text-axiomaText-ink">
                Reprogramar cita
              </h3>
              <p className="mt-1 text-xs text-axiomaText-soft">
                Paciente: {citaSeleccionadaReprog?.paciente?.nombres} {citaSeleccionadaReprog?.paciente?.apellidos}
              </p>

              <form onSubmit={handleReprogramar} className="mt-4 space-y-3 text-sm">
                <div>
                  <label className={label}>Nueva fecha</label>
                  <input
                    type="date"
                    required
                    value={formReprog.fecha}
                    onChange={(e) => setFormReprog({ ...formReprog, fecha: e.target.value })}
                    className={input}
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={label}>Hora inicio</label>
                    <input
                      type="text"
                      required
                      value={formReprog.horaInicio}
                      onChange={(e) => setFormReprog({ ...formReprog, horaInicio: e.target.value })}
                      className={input}
                      placeholder="09:00"
                    />
                  </div>
                  <div>
                    <label className={label}>Hora fin</label>
                    <input
                      type="text"
                      required
                      value={formReprog.horaFin}
                      onChange={(e) => setFormReprog({ ...formReprog, horaFin: e.target.value })}
                      className={input}
                      placeholder="09:50"
                    />
                  </div>
                </div>
                <div>
                  <label className={label}>Motivo de reprogramación</label>
                  <input
                    type="text"
                    value={formReprog.motivo}
                    onChange={(e) => setFormReprog({ ...formReprog, motivo: e.target.value })}
                    className={input}
                    placeholder="Ej. Solicitud de cambio de horario"
                  />
                </div>
                <div className="flex justify-end gap-2 border-t border-axioma-100 pt-3">
                  <button
                    type="button"
                    disabled={procesando}
                    onClick={() => setMostrarModalReprog(false)}
                    className={`${btnSecondary} ${tamMd} disabled:opacity-50 disabled:cursor-not-allowed`}
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={procesando}
                    className={`${btnPrimary} ${tamMd} disabled:opacity-50 disabled:cursor-not-allowed`}
                  >
                    {procesando ? 'Procesando...' : 'Guardar cambio'}
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
                  disabled={enviandoRecordatorio}
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
