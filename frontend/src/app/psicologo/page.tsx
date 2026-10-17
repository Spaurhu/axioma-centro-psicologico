'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { toast } from 'sonner';
import {
  Calendar, LogOut, RefreshCw, Plus, BrainCircuit, Printer,
  FileText, CheckCircle2, XCircle, CalendarClock, AlertCircle, ArrowLeft
} from 'lucide-react';
import { apiFetch } from '@/lib/api';
import { LogoAxioma } from '@/components/logo-axioma';
import {
  btnPrimary, btnSecondary, btnIcono, tamSm, tamMd, focoClaro,
  card, label, input, modalOverlay, modalWrap, modalCard,
  thClase, tdClase, pastilla, claseEstadoCita, claseRiesgo,
  fechaCorta, horaCorta, fechaYmdLocal, horaHmLocal, foco,
} from '@/lib/ui';

export default function PortalPsicologo() {
  const router = useRouter();
  const [usuario, setUsuario] = useState<any>(null);
  const [citas, setCitas] = useState<any[]>([]);
  const [cargando, setCargando] = useState(true);
  const [filtroFecha, setFiltroFecha] = useState<string>('');
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
      const data = await apiFetch(url);
      setCitas(data || []);
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
    try {
      await apiFetch(`/citas/${cita.id}/asistencia`, { method: 'PATCH' });
      toast.success('Asistencia registrada. Sesión contabilizada en el historial clínico.');
      cargarCitas();
      abrirModalNota(cita);
    } catch (err: any) {
      toast.error(err.message || 'Error al registrar asistencia');
    }
  };

  const handleMarcarNoAsistio = async (cita: any) => {
    if (!confirm('¿Confirmas que el paciente no acudió a la sesión?')) return;
    try {
      await apiFetch(`/citas/${cita.id}/no-asistio`, { method: 'PATCH' });
      toast.success('Inasistencia (No-Show) registrada.');
      cargarCitas();
    } catch (err: any) {
      toast.error(err.message || 'Error al registrar inasistencia');
    }
  };

  const handleCancelar = async (cita: any) => {
    const motivo = prompt('Motivo de cancelación:');
    if (motivo === null) return;
    try {
      await apiFetch(`/citas/${cita.id}/cancelar`, {
        method: 'PATCH',
        body: JSON.stringify({ motivo: motivo || 'Cancelada por el terapeuta' }),
      });
      toast.success('Cita cancelada.');
      cargarCitas();
    } catch (err: any) {
      toast.error(err.message || 'Error al cancelar cita');
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
    if (!citaSeleccionadaReprog) return;
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
    }
  };

  // Métricas
  const totalCitas = citas.length;
  const atendidas = citas.filter((c) => c.estado === 'ATENDIDA').length;
  const pendientes = citas.filter((c) => c.estado === 'PROGRAMADA' || c.estado === 'CONFIRMADA').length;

  return (
    <div className="min-h-screen bg-axioma-50 font-sans text-axiomaText-ink antialiased selection:bg-axioma-200">
      
      {/* HEADER */}
      <header className="sticky top-0 z-40 border-b border-axioma-200/80 bg-axioma-900 text-white shadow-panel">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3.5 sm:px-6">
          <div className="flex items-center gap-4">
            <LogoAxioma oscuro subtitulo="Portal Clínico • C.Ps.P." />
            <Link href="/" className="hidden text-xs text-axioma-200 hover:text-white sm:inline-flex items-center gap-1">
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>Inicio</span>
            </Link>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden text-right sm:block">
              <span className="block text-sm font-semibold text-white">
                {usuario?.perfil?.nombres ? `Lic. ${usuario.perfil.nombres} ${usuario.perfil.apellidos}` : usuario?.correo}
              </span>
              <span className="text-xs text-axioma-200">
                {usuario?.perfil?.numeroColegiatura ? `Colegiatura: ${usuario.perfil.numeroColegiatura}` : 'Terapeuta Colegiado'}
              </span>
            </div>
            <button
              onClick={cerrarSesion}
              className="flex items-center gap-1.5 rounded-button bg-white/10 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-white/20"
            >
              <LogOut className="h-4 w-4" />
              <span>Cerrar sesión</span>
            </button>
          </div>
        </div>
      </header>

      {/* CONTENIDO PRINCIPAL */}
      <main className="mx-auto max-w-7xl p-4 sm:p-6 lg:p-8 space-y-6">

        {errorAcceso && (
          <div className="flex items-center gap-3 rounded-card border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
            <AlertCircle className="h-5 w-5 shrink-0 text-amber-600" />
            <span>{errorAcceso}</span>
          </div>
        )}

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
                        <div className="flex items-center justify-end gap-1.5">
                          {c.estado === 'PROGRAMADA' && (
                            <>
                              <button
                                onClick={() => handleMarcarAsistencia(c)}
                                className={`${btnPrimary} px-2.5 py-1 text-xs`}
                              >
                                Asistencia
                              </button>
                              <button
                                onClick={() => handleMarcarNoAsistio(c)}
                                className="rounded-button border border-rose-200 bg-rose-50 px-2 py-1 text-xs font-medium text-rose-700 hover:bg-rose-100"
                              >
                                No asistió
                              </button>
                              <button
                                onClick={() => abrirModalReprogramar(c)}
                                className={`${btnSecondary} px-2 py-1 text-xs`}
                              >
                                Reprogramar
                              </button>
                              <button
                                onClick={() => handleCancelar(c)}
                                className="rounded p-1 text-axiomaText-soft hover:text-rose-700"
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
                      onClick={() => setMostrarModalNota(false)}
                      className={`${btnSecondary} ${tamMd}`}
                    >
                      Cerrar
                    </button>
                    <button
                      type="submit"
                      disabled={guardandoNota}
                      className={`${btnPrimary} ${tamMd}`}
                    >
                      {guardandoNota ? 'Guardando...' : 'Guardar nota SOAP'}
                    </button>
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
                  <button type="button" onClick={() => setMostrarModalReprog(false)} className={`${btnSecondary} ${tamMd}`}>
                    Cancelar
                  </button>
                  <button type="submit" className={`${btnPrimary} ${tamMd}`}>
                    Guardar cambio
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
