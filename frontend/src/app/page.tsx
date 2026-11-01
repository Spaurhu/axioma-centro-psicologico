'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import {
  Check, Calendar, Shield, BrainCircuit, Clock, Award,
  CheckCircle2, ChevronDown, LogOut, Phone, X, LayoutDashboard,
  BookmarkCheck, Menu, Video, Facebook, Instagram, Linkedin, MapPin, Mail,
} from 'lucide-react';
import { LogoAxioma } from '@/components/logo-axioma';
import {
  contenedor, foco, btnPrimary, btnSecondary, btnGhost, btnOnDark, tamSm, tamMd, tamLg,
} from '@/lib/ui';

/* ══════════════════════════════════════════════════════════════
   DATOS DE PRESENTACIÓN
   ══════════════════════════════════════════════════════════════ */

// Orden = orden en que aparecen en la página. Etiquetas cortas para que
// quepan en una sola línea en laptop.
const enlacesNav = [
  { href: '#espacios', texto: 'Espacios' },
  { href: '#innovacion', texto: 'IA predictiva' },
  { href: '#paquetes', texto: 'Planes' },
  { href: '#enfoque', texto: 'Enfoque' },
  { href: '#faqs', texto: 'Preguntas' },
];

// Menú del usuario autenticado según rol (antes eran 4 bloques JSX repetidos)
type ItemMenu = { href: string; texto: string; Icono: typeof Calendar };

const menuPorRol: Record<string, ItemMenu[]> = {
  PACIENTE: [
    { href: '/paciente', texto: 'Mi Portal & Paquetes', Icono: BookmarkCheck },
    { href: '/paciente', texto: 'Agendar Cita en Vivo', Icono: Calendar },
  ],
  PSICOLOGO: [{ href: '/psicologo', texto: 'Portal Clínico & Notas SOAP', Icono: Award }],
  RECEPCIONISTA: [{ href: '/recepcion', texto: 'Módulo de Recepción & Citas', Icono: Calendar }],
};
const menuAdmin: ItemMenu[] = [
  { href: '/panel', texto: 'Panel de Dirección Central', Icono: LayoutDashboard },
];

type Variante = 'claro' | 'rosa' | 'suave' | 'lavanda';

const estilosSala: Record<
  Variante,
  { card: string; titulo: string; texto: string; icono: string; pastilla: string; pie: string; pieSec: string; icoPie: string }
> = {
  claro: {
    card: 'bg-white border-axioma-200/70',
    titulo: 'text-axiomaText-ink',
    texto: 'text-axiomaText-soft',
    icono: 'bg-axioma-100 text-axioma-700',
    pastilla: 'bg-axioma-50 text-axioma-700 border-axioma-200',
    pie: 'bg-axioma-50 border-axioma-200/70 text-axiomaText-ink',
    pieSec: 'text-axiomaText-soft',
    icoPie: 'text-axioma-600',
  },
  rosa: {
    card: 'bg-axioma-600 border-axioma-700',
    titulo: 'text-white',
    texto: 'text-white',
    icono: 'bg-white/15 text-white',
    pastilla: 'bg-white/15 text-white border-white/25',
    pie: 'bg-white/10 border-white/20 text-white',
    pieSec: 'text-axioma-50',
    icoPie: 'text-axioma-100',
  },
  suave: {
    card: 'bg-axioma-100 border-axioma-200',
    titulo: 'text-axiomaText-ink',
    texto: 'text-axiomaText-soft',
    icono: 'bg-white text-axioma-700',
    pastilla: 'bg-white/70 text-axioma-700 border-axioma-200',
    pie: 'bg-white/70 border-white text-axiomaText-ink',
    pieSec: 'text-axiomaText-soft',
    icoPie: 'text-axioma-600',
  },
  lavanda: {
    card: 'bg-heather border-white/60',
    titulo: 'text-axiomaText-ink',
    texto: 'text-axiomaText-soft',
    icono: 'bg-white text-axioma-700',
    pastilla: 'bg-white/70 text-axioma-700 border-white',
    pie: 'bg-white/70 border-white text-axiomaText-ink',
    pieSec: 'text-axiomaText-soft',
    icoPie: 'text-axioma-600',
  },
};

/*
  Bento responsive:
  - móvil: 1 columna
  - tablet (md): 2 columnas; la última card ocupa el ancho completo
  - laptop/desktop (lg): 12 columnas → fila 1 = 7/5, fila 2 = 4/4/4
  Las variantes se alternan para que dos cards del mismo color nunca se toquen.
*/
const salas = [
  {
    clave: 'agenda',
    variante: 'claro' as Variante,
    span: 'lg:col-span-7',
    Icono: Calendar,
    etiqueta: 'Agendamiento dinámico',
    titulo: 'Cero cruces de horario en tiempo real.',
    texto:
      'El motor de disponibilidad valida los bloques de 45 a 60 minutos con descanso preventivo entre pacientes, impidiendo cualquier sobreposición de turnos.',
    PieIcono: Clock,
    pieIzq: 'Bloques de 60 min',
    pieDer: 'Lunes a sábado',
  },
  {
    clave: 'virtual',
    variante: 'lavanda' as Variante,
    span: 'lg:col-span-5',
    Icono: Video,
    etiqueta: 'Telemedicina nacional',
    titulo: 'Sesiones virtuales por Google Meet.',
    texto:
      'Atención psicológica especializada desde cualquier parte del Perú. Al agendar en modalidad virtual, recibes automáticamente tu enlace protegido de Google Meet en tu correo registrado.',
    PieIcono: Video,
    pieIzq: 'Enlace por correo seguro',
    pieDer: 'Cobertura nacional',
  },
  {
    clave: 'ia',
    id: 'innovacion',
    variante: 'rosa' as Variante,
    span: 'lg:col-span-4',
    Icono: BrainCircuit,
    etiqueta: 'Inteligencia artificial',
    titulo: 'Predicción de inasistencias.',
    texto:
      'Algoritmo de regresión logística entrenado que calcula la probabilidad de asistencia del paciente según su historial y horario para activar recordatorios tempranos.',
    PieIcono: BrainCircuit,
    pieIzq: 'Modelo de 6 factores',
    pieDer: '84.6% precisión',
  },
  {
    clave: 'paquetes',
    variante: 'suave' as Variante,
    span: 'lg:col-span-4',
    Icono: BookmarkCheck,
    etiqueta: 'Economía terapéutica',
    titulo: 'Paquetes con deducción atómica.',
    texto:
      'Adquiere bonos de 4 u 8 sesiones con descuentos significativos. Cada vez que asistes a consulta, el sistema descuenta tu saldo de forma transparente.',
    pieIzq: 'Desde S/. 65 por sesión',
    pieDer: 'Ahorro hasta S/. 120',
  },
  {
    clave: 'soap',
    variante: 'claro' as Variante,
    span: 'md:col-span-2 lg:col-span-4',
    Icono: Shield,
    etiqueta: 'Historial clínico SOAP',
    titulo: 'Evolución confidencial del paciente.',
    texto:
      'Notas clínicas estructuradas por sesión: Subjetivo, Objetivo, Apreciación y Plan. Tu psicólogo cuenta con el expediente completo en cada consulta.',
    pieIzq: 'Cifrado de grado médico',
    pieDer: 'Acceso exclusivo profesional',
  },
];

const paquetes = [
  {
    clave: 'unica',
    etiqueta: 'Evaluación inicial',
    nombre: 'Sesión única',
    descripcion:
      'Ideal para primera consulta de diagnóstico, orientación puntual o crisis momentánea.',
    precio: 'S/. 80',
    detalle: '/ 1 sesión de 50m',
    ahorro: null as string | null,
    items: [
      'Entrevista diagnóstica completa',
      'Elección de horario libre',
      'Apertura de historia clínica',
    ],
    cta: 'Agendar sesión',
    destacado: false,
  },
  {
    clave: 'cuatro',
    etiqueta: 'Tratamiento focalizado',
    nombre: 'Paquete 4 sesiones',
    descripcion:
      'Estructura quincenal o semanal para manejo de ansiedad, depresión leve o metas específicas.',
    precio: 'S/. 280',
    detalle: '/ S/. 70 por sesión',
    ahorro: 'Ahorras S/. 40 respecto a tarifa individual',
    items: [
      'Plan de intervención terapéutico',
      'Tareas intersesión guiadas',
      'Control de saldo automático',
      'Reprogramación con 24h previas',
    ],
    cta: 'Comenzar proceso',
    destacado: true,
  },
  {
    clave: 'ocho',
    etiqueta: 'Transformación profunda',
    nombre: 'Paquete 8 sesiones',
    descripcion:
      'Acompañamiento psicoterapéutico integral para cambios conductuales y emocionales de largo plazo.',
    precio: 'S/. 520',
    detalle: '/ S/. 65 por sesión',
    ahorro: 'Ahorras S/. 120 (máximo beneficio)',
    items: [
      'Evaluación psicométrica incluida',
      'Reporte de evolución clínica',
      'Prioridad en horarios de agenda',
    ],
    cta: 'Elegir paquete integral',
    destacado: false,
  },
];

const garantias = [
  {
    Icono: Shield,
    titulo: 'Confidencialidad absoluta',
    texto: 'Tus notas de evolución y diagnósticos están protegidos con estrictos permisos por rol.',
  },
  {
    Icono: BookmarkCheck,
    titulo: 'Transparencia en sesiones',
    texto: 'Visualiza en tu portal exactamente cuántas sesiones has tomado y cuántas te quedan activas.',
  },
  {
    Icono: Calendar,
    titulo: 'Flexibilidad de reprogramación',
    texto: 'Si surge un imprevisto, cambia tu fecha u horario con antelación sin perder tu cupo.',
  },
];

const pasos = [
  {
    titulo: 'Crea tu cuenta de paciente',
    texto: 'Solo necesitas tus datos básicos para acceder a la agenda en vivo.',
  },
  {
    titulo: 'Selecciona tu psicólogo y horario',
    texto: 'Elige el día y bloque que mejor se ajuste a tu rutina diaria.',
  },
  {
    titulo: 'Inicia tu proceso terapéutico',
    texto: 'Conéctate o asiste a consulta con el respaldo de un profesional de salud mental.',
  },
];

const faqs = [
  {
    pregunta: '¿Puedo atenderme de forma virtual?',
    respuesta:
      'Sí, todas nuestras terapias y evaluaciones están disponibles en modalidad virtual. Recibirás el enlace de Google Meet en tu correo al confirmar tu cita.',
  },
  {
    pregunta: '¿Cómo funcionan los paquetes terapéuticos?',
    respuesta:
      'Puedes adquirir paquetes de 4 u 8 sesiones con descuento preferencial. Cada vez que asistes a una sesión, el sistema descuenta automáticamente tu saldo y te muestra las citas restantes en tu portal de paciente.',
  },
  {
    pregunta: '¿Cómo puedo reprogramar una cita?',
    respuesta:
      'Puedes reprogramar tu fecha y horario directamente desde tu portal de paciente con un mínimo de 24 horas de anticipación sin costo adicional.',
  },
  {
    pregunta: '¿Los psicólogos están colegiados y habilitados?',
    respuesta:
      'Sí, el 100% de nuestro equipo cuenta con colegiatura activa en el Colegio de Psicólogos del Perú (C.Ps.P.) y formación especializada en psicoterapia basada en evidencia.',
  },
];

// Footer
const enlacesRapidos = [
  { href: '#', texto: 'Inicio' },
  { href: '#espacios', texto: 'Espacios terapéuticos' },
  { href: '#innovacion', texto: 'IA predictiva' },
  { href: '#paquetes', texto: 'Planes y sesiones' },
  { href: '#enfoque', texto: 'Enfoque clínico' },
  { href: '#faqs', texto: 'Preguntas frecuentes' },
];

const servicios = ['Terapia individual', 'Terapia de pareja', 'Terapia infantil', 'Evaluación psicológica'];

const redes = [
  { href: 'https://facebook.com', etiqueta: 'Facebook Axioma', Icono: Facebook },
  { href: 'https://instagram.com', etiqueta: 'Instagram Axioma', Icono: Instagram },
  { href: 'https://linkedin.com', etiqueta: 'LinkedIn Axioma', Icono: Linkedin },
];

const enlaceFooter =
  'rounded transition-colors hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white';

/* ══════════════════════════════════════════════════════════════
   COMPONENTES LOCALES
   ══════════════════════════════════════════════════════════════ */

function EncabezadoSeccion({ titulo, texto }: { titulo: string; texto: string }) {
  return (
    <div className="mb-10 grid gap-4 lg:mb-14 lg:grid-cols-2 lg:items-end lg:gap-12">
      <h2 className="font-display text-3xl font-medium leading-[1.12] tracking-heading text-axiomaText-ink sm:text-4xl">
        {titulo}
      </h2>
      <p className="max-w-xl text-base leading-relaxed text-axiomaText-soft lg:justify-self-end">
        {texto}
      </p>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   PÁGINA
   ══════════════════════════════════════════════════════════════ */

export default function PaginaPrincipal() {
  const [usuario, setUsuario] = useState<any>(null);
  const [menuAbierto, setMenuAbierto] = useState(false);
  const [navMovil, setNavMovil] = useState(false);
  const [mostrarNotificacion, setMostrarNotificacion] = useState(true);
  const [faqAbierta, setFaqAbierta] = useState<number | null>(0);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Detectar si el usuario está logueado
    try {
      const uGuardado = localStorage.getItem('axioma_usuario');
      if (uGuardado) {
        setUsuario(JSON.parse(uGuardado));
      }
    } catch (e) {
      console.error(e);
    }
  }, []);

  // Cerrar dropdown al hacer click afuera
  useEffect(() => {
    function handleClickAfuera(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuAbierto(false);
      }
    }
    document.addEventListener('mousedown', handleClickAfuera);
    return () => document.removeEventListener('mousedown', handleClickAfuera);
  }, []);

  const cerrarSesion = () => {
    localStorage.removeItem('axioma_token');
    localStorage.removeItem('axioma_usuario');
    setUsuario(null);
    setMenuAbierto(false);
  };

  // Obtener iniciales del usuario (ej: Joao Moises -> JM)
  const obtenerIniciales = (nombre?: string) => {
    if (!nombre) return 'P';
    const partes = nombre.trim().split(' ');
    if (partes.length >= 2) {
      return `${partes[0][0]}${partes[1][0]}`.toUpperCase();
    }
    return partes[0][0].toUpperCase();
  };

  const esPaciente = usuario?.rol === 'PACIENTE';
  const destinoCta = usuario ? '/paciente' : '/registro';
  const itemsMenu: ItemMenu[] = menuPorRol[usuario?.rol] ?? menuAdmin;

  return (
    <div className="flex min-h-screen flex-col bg-axioma-50 font-sans text-axiomaText-ink antialiased selection:bg-axioma-200 selection:text-axiomaText-ink">

      {/* 1. NAVBAR — nav completa desde lg; por debajo, menú hamburguesa */}
      <header className="sticky top-0 z-50 border-b border-axioma-200/80 bg-axioma-50/90 backdrop-blur-md">
        <div className={`${contenedor} flex items-center justify-between gap-4 py-3.5 lg:py-4`}>

          <LogoAxioma subtitulo={<>Centro<br />Psicológico</>} />

          {/* Links navegación (laptop y desktop) */}
          <nav className="hidden items-center gap-1 lg:flex" aria-label="Secciones">
            {enlacesNav.map((e) => (
              <a
                key={e.href}
                href={e.href}
                className={`rounded-button px-3.5 py-2 text-sm font-medium text-axiomaText-soft transition-colors hover:bg-axioma-100 hover:text-axioma-700 xl:px-4 ${foco}`}
              >
                {e.texto}
              </a>
            ))}
          </nav>

          {/* Zona de acceso */}
          <div className="flex items-center gap-2 sm:gap-3">
            {usuario ? (
              // ESTADO AUTENTICADO
              <div className="relative" ref={menuRef}>
                <button
                  onClick={() => setMenuAbierto(!menuAbierto)}
                  className={`flex items-center space-x-2.5 rounded-button border border-axioma-200 bg-white px-3 py-1.5 shadow-subtle transition hover:bg-axioma-50 ${foco}`}
                  aria-expanded={menuAbierto}
                  aria-haspopup="menu"
                >
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-axioma-600 text-xs font-bold text-white">
                    {obtenerIniciales(usuario.perfil?.nombres || usuario.correo)}
                  </div>
                  <span className="hidden max-w-[120px] truncate text-xs font-semibold text-axiomaText-ink sm:block">
                    {usuario.perfil?.nombres || usuario.correo.split('@')[0]}
                  </span>
                  <ChevronDown className={`h-3.5 w-3.5 text-axiomaText-soft transition-transform ${menuAbierto ? 'rotate-180' : ''}`} />
                </button>

                {/* MENÚ DESPLEGABLE */}
                {menuAbierto && (
                  <div className="absolute right-0 z-50 mt-2 w-64 animate-fade-in rounded-card-sm border border-axioma-200 bg-white p-2 shadow-lift motion-reduce:animate-none">
                    <div className="rounded-xl bg-axioma-50 p-3">
                      <p className="truncate text-xs font-bold text-axiomaText-ink">
                        {usuario.perfil?.nombres ? `${usuario.perfil.nombres} ${usuario.perfil.apellidos || ''}` : usuario.correo}
                      </p>
                      <p className="mt-0.5 truncate text-[11px] font-medium text-axiomaText-soft">
                        {usuario.correo}
                      </p>
                      <span className="mt-2 inline-block rounded-tag bg-axioma-600 px-2.5 py-0.5 text-[10px] font-bold capitalize text-white">
                        {usuario.rol.toLowerCase()}
                      </span>
                    </div>

                    <div className="py-1.5">
                      {itemsMenu.map(({ href, texto, Icono }) => (
                        <Link
                          key={texto}
                          href={href}
                          onClick={() => setMenuAbierto(false)}
                          className="flex items-center space-x-2.5 rounded-xl px-3 py-2.5 text-xs font-medium text-axiomaText-soft transition hover:bg-axioma-50 hover:text-axioma-700"
                        >
                          <Icono className="h-4 w-4 text-axioma-500" />
                          <span>{texto}</span>
                        </Link>
                      ))}
                    </div>

                    <div className="border-t border-axioma-100 pt-1.5">
                      <button
                        onClick={cerrarSesion}
                        className="flex w-full items-center space-x-2.5 rounded-xl px-3 py-2.5 text-xs font-semibold text-rose-700 transition hover:bg-rose-50"
                      >
                        <LogOut className="h-4 w-4" />
                        <span>Cerrar Sesión</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              // ESTADO PÚBLICO
              <>
                <Link href="/login" className={`${btnSecondary} ${tamSm} sm:px-5`}>
                  Iniciar Sesión
                </Link>
                <Link href="/registro" className={`${btnPrimary} ${tamSm} hidden sm:inline-flex sm:px-5`}>
                  Reservar Cita
                </Link>
              </>
            )}

            {/* Botón menú móvil / tablet */}
            <button
              onClick={() => setNavMovil(!navMovil)}
              className={`flex h-10 w-10 items-center justify-center rounded-full border border-axioma-200 bg-white text-axioma-700 transition hover:bg-axioma-100 lg:hidden ${foco}`}
              aria-label={navMovil ? 'Cerrar menú' : 'Abrir menú'}
              aria-expanded={navMovil}
            >
              {navMovil ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {/* Navegación móvil / tablet */}
        {navMovil && (
          <nav className="animate-fade-in border-t border-axioma-200 bg-axioma-50 px-6 py-4 motion-reduce:animate-none lg:hidden" aria-label="Secciones">
            <div className="grid gap-1 sm:grid-cols-2">
              {enlacesNav.map((e) => (
                <a
                  key={e.href}
                  href={e.href}
                  onClick={() => setNavMovil(false)}
                  className="rounded-xl px-3 py-3 text-sm font-medium text-axiomaText-soft transition hover:bg-axioma-100 hover:text-axioma-700"
                >
                  {e.texto}
                </a>
              ))}
            </div>
            {!usuario && (
              <Link
                href="/registro"
                onClick={() => setNavMovil(false)}
                className={`${btnPrimary} ${tamMd} mt-3 w-full sm:hidden`}
              >
                Reservar Cita
              </Link>
            )}
          </nav>
        )}
      </header>

      {/* 2. HERO */}
      <section className="relative overflow-hidden bg-gradient-to-br from-axioma-100 via-axioma-50 to-heather-soft">
        <div className={`${contenedor} grid items-center gap-12 py-14 lg:grid-cols-12 lg:gap-8 lg:py-24`}>

          {/* Lado izquierdo */}
          <div className="space-y-6 lg:col-span-7">
            <div className="inline-flex items-center gap-2 rounded-tag border border-axioma-300 bg-axioma-100/90 px-3.5 py-1.5 text-xs font-bold text-axioma-800">
              <Video className="h-3.5 w-3.5" />
              <span>Nueva modalidad: terapia presencial y virtual</span>
            </div>

            <h1 className="font-display text-4xl font-medium leading-[1.08] tracking-display text-axiomaText-ink sm:text-5xl lg:text-6xl">
              Transforma tu bienestar con psicoterapia cálida y precisa.
            </h1>

            <p className="max-w-xl text-lg leading-relaxed text-axiomaText-soft">
              Sesiones individuales y familiares con psicólogos colegiados. Agenda tus horarios en tiempo real, adquiere paquetes con descuento y monitorea tu progreso clínico en una plataforma segura.
            </p>

            {/* Botones */}
            <div className="flex flex-col gap-3 pt-2 sm:flex-row sm:flex-wrap sm:items-center">
              <Link href={esPaciente ? '/paciente' : '/registro'} className={`${btnPrimary} ${tamLg}`}>
                {esPaciente ? 'Ir a Mi Portal de Citas' : 'Agendar Mi Primera Sesión'}
              </Link>
              <a href="#espacios" className={`${btnSecondary} ${tamLg}`}>
                Conocer Espacios
              </a>
            </div>

            {/* Indicadores clave */}
            <div className="grid grid-cols-1 gap-3 pt-6 sm:grid-cols-3">
              {[
                { Icono: Award, valor: '100%', etiqueta: 'Colegiados C.Ps.P.' },
                { Icono: Clock, valor: '0 Cruces', etiqueta: 'Disponibilidad en vivo' },
                { Icono: BrainCircuit, valor: 'IA SOAP', etiqueta: 'Prevención No-Show' },
              ].map(({ Icono, valor, etiqueta }) => (
                <div
                  key={valor}
                  className="flex items-center gap-3 rounded-card-sm border border-axioma-200 bg-white/70 p-4"
                >
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-axioma-100 text-axioma-700">
                    <Icono className="h-5 w-5" />
                  </span>
                  <div>
                    <div className="text-lg font-bold leading-tight tracking-heading text-axiomaText-ink">{valor}</div>
                    <div className="text-xs text-axiomaText-soft">{etiqueta}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Lado derecho: mockup celular sobre panel de color */}
          <div className="mx-auto w-full max-w-[420px] lg:col-span-5 lg:max-w-none lg:pl-6">
            <div className="rounded-card bg-axioma-600 p-5 shadow-panel sm:p-8">
              <div className="mx-auto w-full max-w-[320px] rounded-[28px] bg-white p-2.5 shadow-lift">
                <div className="overflow-hidden rounded-[20px] border border-axioma-100">
                  {/* Cabecera */}
                  <div className="flex items-center justify-between border-b border-axioma-100 bg-axioma-50 px-4 py-3 text-axiomaText-ink">
                    <div className="flex items-center space-x-2">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-axioma-600 text-xs font-bold text-white">
                        Ax
                      </div>
                      <div>
                        <p className="text-xs font-semibold leading-tight">Dra. Camila Morales</p>
                        <p className="mt-0.5 flex items-center gap-1 text-[10px] text-axiomaText-soft">
                          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> C.Ps.P. 45892, en línea
                        </p>
                      </div>
                    </div>
                    <Phone className="h-4 w-4 text-axioma-600" />
                  </div>

                  {/* Chat */}
                  <div className="min-h-[290px] space-y-3 bg-heather-soft p-4 text-xs">
                    <div className="max-w-[85%] rounded-card-sm rounded-tl-sm border border-axioma-100 bg-white p-3 text-axiomaText-ink">
                      <p className="mb-0.5 text-[11px] font-semibold text-axioma-700">Centro Axioma</p>
                      Hola Joao, tu próxima sesión terapéutica ha sido confirmada para este jueves a las 10:00 AM.
                    </div>

                    <div className="ml-auto max-w-[85%] rounded-card-sm rounded-tr-sm bg-axioma-600 p-3 text-right text-white">
                      <p>Muchas gracias, doctora. Ya completé mi registro de síntomas previo.</p>
                      <span className="mt-1 block text-[9px] text-axioma-100">10:02 AM · ✓✓</span>
                    </div>

                    <div className="rounded-card-sm border border-axioma-100 bg-white p-3 shadow-subtle">
                      <div className="mb-2 flex items-center justify-between border-b border-axioma-100 pb-2">
                        <span className="text-[11px] font-bold text-axiomaText-ink">Paquete Activo</span>
                        <span className="rounded-tag bg-axioma-100 px-2 py-0.5 text-[10px] font-bold text-axioma-700">
                          3/4 Restantes
                        </span>
                      </div>
                      <p className="text-[11px] text-axiomaText-soft">
                        Terapia Cognitivo-Conductual · Sesión 2 de 4
                      </p>
                    </div>

                    <div className="rounded-card-sm bg-axioma-100 p-2.5 text-center text-[11px] font-semibold text-axioma-800">
                      🎯 Asistencia predictiva: Riesgo Bajo (7.5%)
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* 3. BANDA DE RESPALDO */}
      <section className="bg-axioma-900 text-white">
        <div className={`${contenedor} flex flex-col gap-5 py-6 lg:flex-row lg:items-center lg:justify-between`}>
          <p className="max-w-[16rem] text-sm font-medium leading-snug text-axioma-200">
            Estándares de confidencialidad médica y normativa en salud
          </p>
          <ul className="grid gap-4 sm:grid-cols-3 lg:gap-10">
            {[
              { Icono: Award, texto: 'Colegio de Psicólogos del Perú (C.Ps.P.)' },
              { Icono: Shield, texto: 'Ley N° 29733 de Datos Personales' },
              { Icono: CheckCircle2, texto: 'Historias clínicas formato SOAP' },
            ].map(({ Icono, texto }) => (
              <li key={texto} className="flex items-center gap-3 text-sm font-semibold">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/10 text-axioma-300">
                  <Icono className="h-4 w-4" />
                </span>
                {texto}
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* 4. ESPACIOS (bento responsive sobre lavanda) */}
      <section id="espacios" className="scroll-mt-20 bg-heather-soft">
        <div className={`${contenedor} py-16 lg:py-20`}>
          <EncabezadoSeccion
            titulo="Una clínica digital estructurada en salas de bienestar."
            texto="Cada módulo de nuestra plataforma está pensado con calidez y rigor clínico para eliminar la fricción entre tú y tu terapeuta."
          />

          <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-12">
            {salas.map((s) => {
              const e = estilosSala[s.variante];
              const PieIcono = s.PieIcono;
              return (
                <article
                  key={s.clave}
                  id={s.id}
                  className={`flex scroll-mt-24 flex-col rounded-card border p-6 shadow-card sm:p-8 ${s.span} ${e.card}`}
                >
                  <div className="mb-5 flex flex-wrap items-center gap-3">
                    <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${e.icono}`}>
                      <s.Icono className="h-5 w-5" />
                    </span>
                    <span className={`rounded-tag border px-3 py-1 text-xs font-semibold ${e.pastilla}`}>
                      {s.etiqueta}
                    </span>
                  </div>
                  <h3 className={`mb-3 font-display text-2xl font-medium leading-tight tracking-heading ${e.titulo}`}>
                    {s.titulo}
                  </h3>
                  <p className={`mb-6 text-base leading-relaxed ${e.texto}`}>{s.texto}</p>
                  <div className={`mt-auto flex flex-wrap items-center justify-between gap-x-4 gap-y-1.5 rounded-card-sm border p-4 text-xs font-semibold ${e.pie}`}>
                    <span className="flex items-center gap-2">
                      {PieIcono && <PieIcono className={`h-4 w-4 shrink-0 ${e.icoPie}`} />}
                      {s.pieIzq}
                    </span>
                    <span className={e.pieSec}>{s.pieDer}</span>
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      {/* 5. PAQUETES */}
      <section id="paquetes" className="scroll-mt-20 border-y border-axioma-200 bg-axioma-50">
        <div className={`${contenedor} py-16 lg:py-20`}>
          <EncabezadoSeccion
            titulo="Paquetes terapéuticos accesibles"
            texto="Elige la modalidad que mejor se adapte a tus objetivos terapéuticos. Mientras más sesiones, menor el costo por sesión."
          />

          <div className="grid grid-cols-1 gap-6 pt-3 md:grid-cols-3 md:items-stretch md:pt-0">
            {paquetes.map((p) => (
              <div
                key={p.clave}
                className={
                  p.destacado
                    ? 'relative flex flex-col justify-between rounded-card border border-axioma-800 bg-axioma-900 p-7 text-white shadow-lift transition-shadow duration-200 hover:shadow-panel md:-my-4 lg:p-8'
                    : 'flex flex-col justify-between rounded-card border border-axioma-200 bg-white p-7 shadow-card transition-shadow duration-200 hover:shadow-lift lg:p-8'
                }
              >
                {p.destacado && (
                  <div className="absolute -top-3.5 right-6 rounded-tag bg-axioma-300 px-3.5 py-1 text-[11px] font-bold text-axioma-950">
                    Recomendado
                  </div>
                )}
                <div>
                  <span className={`text-xs font-semibold ${p.destacado ? 'text-axioma-300' : 'text-axioma-700'}`}>
                    {p.etiqueta}
                  </span>
                  <h3 className={`mt-1.5 font-display text-2xl font-medium tracking-heading ${p.destacado ? 'text-white' : 'text-axiomaText-ink'}`}>
                    {p.nombre}
                  </h3>
                  <p className={`mt-2 text-sm leading-relaxed ${p.destacado ? 'text-axioma-100' : 'text-axiomaText-soft'}`}>
                    {p.descripcion}
                  </p>

                  <div className="mt-6 flex flex-wrap items-baseline gap-x-2">
                    <span className={`text-4xl font-bold tracking-heading ${p.destacado ? 'text-white' : 'text-axiomaText-ink'}`}>
                      {p.precio}
                    </span>
                    <span className={`text-xs ${p.destacado ? 'text-axioma-200' : 'text-axiomaText-soft'}`}>
                      {p.detalle}
                    </span>
                  </div>
                  {p.ahorro && (
                    <div className={`mt-2 inline-block rounded-tag px-3 py-1 text-[11px] font-bold ${p.destacado ? 'bg-white/10 text-axioma-100' : 'bg-axioma-100 text-axioma-700'}`}>
                      {p.ahorro}
                    </div>
                  )}

                  <ul className="mt-6 space-y-3 text-sm">
                    {p.items.map((item) => (
                      <li key={item} className={`flex items-start gap-2.5 ${p.destacado ? 'text-axioma-50' : 'text-axiomaText-soft'}`}>
                        <span className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full ${p.destacado ? 'bg-white/10 text-axioma-300' : 'bg-axioma-100 text-axioma-700'}`}>
                          <Check className="h-3 w-3" strokeWidth={3} />
                        </span>
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>

                <div className={`mt-8 border-t pt-6 ${p.destacado ? 'border-white/15' : 'border-axioma-100'}`}>
                  <Link
                    href={destinoCta}
                    className={`${p.destacado ? btnOnDark : btnSecondary} ${tamMd} w-full`}
                  >
                    {p.cta}
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 6. ENFOQUE CLÍNICO */}
      <section id="enfoque" className="scroll-mt-20 bg-axioma-100">
        <div className={`${contenedor} py-16 lg:py-20`}>
          <div className="grid grid-cols-1 items-start gap-10 lg:grid-cols-2 lg:gap-14">
            <div>
              <h2 className="font-display text-3xl font-medium leading-[1.12] tracking-heading text-axiomaText-ink sm:text-4xl">
                Tu viaje de sanación respaldado por un equipo integral.
              </h2>
              <p className="mt-4 max-w-xl text-base leading-relaxed text-axiomaText-soft">
                No dejamos tu proceso al azar. Cada terapeuta de Axioma sigue un código de ética riguroso, respaldado por herramientas digitales que optimizan cada minuto de tu tiempo de consulta.
              </p>

              <div className="mt-8 space-y-3">
                {garantias.map(({ Icono, titulo, texto }) => (
                  <div
                    key={titulo}
                    className="flex items-start gap-4 rounded-card-sm border border-axioma-200/70 bg-white p-5 shadow-card"
                  >
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-axioma-100 text-axioma-700">
                      <Icono className="h-5 w-5" />
                    </span>
                    <div>
                      <h4 className="text-sm font-bold text-axiomaText-ink">{titulo}</h4>
                      <p className="mt-1 text-sm leading-relaxed text-axiomaText-soft">{texto}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Pasos: es una secuencia real, por eso va numerada */}
            <div className="rounded-card bg-axioma-900 p-7 text-white shadow-panel sm:p-10">
              <h3 className="mb-8 font-display text-2xl font-medium tracking-heading">
                Comienza hoy en 3 simples pasos
              </h3>
              <ol className="relative space-y-7 border-l border-white/20 pl-8">
                {pasos.map((paso, i) => (
                  <li key={paso.titulo} className="relative">
                    <span className="absolute -left-12 flex h-8 w-8 items-center justify-center rounded-full bg-axioma-300 text-xs font-bold text-axioma-950">
                      {i + 1}
                    </span>
                    <p className="text-sm font-bold">{paso.titulo}</p>
                    <p className="mt-1 text-sm leading-relaxed text-axioma-200">{paso.texto}</p>
                  </li>
                ))}
              </ol>

              <div className="mt-9 border-t border-white/15 pt-7">
                <Link
                  href={esPaciente ? '/paciente' : '/registro'}
                  className={`${btnOnDark} ${tamLg} w-full`}
                >
                  {esPaciente ? 'Entrar a Mi Portal' : 'Registrarme Ahora'}
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 7. PREGUNTAS FRECUENTES — título a la izquierda, acordeón a la derecha */}
      <section id="faqs" className="scroll-mt-20 border-t border-axioma-200 bg-heather-soft">
        <div className={`${contenedor} grid gap-10 py-16 lg:grid-cols-12 lg:gap-14 lg:py-20`}>

          <div className="lg:col-span-5">
            <div className="lg:sticky lg:top-28">
              <h2 className="font-display text-3xl font-medium leading-[1.12] tracking-heading text-axiomaText-ink sm:text-4xl">
                Preguntas frecuentes sobre la atención.
              </h2>
              <p className="mt-4 max-w-md text-base leading-relaxed text-axiomaText-soft">
                Resolvemos tus dudas sobre modalidades presencial y virtual, paquetes terapéuticos y agendamiento.
              </p>

              <div className="mt-8 rounded-card-sm border border-axioma-200 bg-white p-5 shadow-card">
                <p className="text-sm font-semibold text-axiomaText-ink">¿No encuentras tu respuesta?</p>
                <p className="mt-1 text-sm leading-relaxed text-axiomaText-soft">
                  Escríbenos o llámanos y te ayudamos a elegir la modalidad que mejor se adapte a ti.
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                  <a href="mailto:contacto@axioma.pe" className={`${btnSecondary} ${tamSm}`}>
                    <Mail className="h-4 w-4" />
                    <span>Escribir</span>
                  </a>
                  <a href="tel:+5114567890" className={`${btnGhost} ${tamSm}`}>
                    <Phone className="h-4 w-4" />
                    <span>(01) 456-7890</span>
                  </a>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-3 lg:col-span-7">
            {faqs.map((faq, index) => {
              const estaAbierta = faqAbierta === index;
              return (
                <div
                  key={faq.pregunta}
                  className={`overflow-hidden rounded-card-sm border bg-white transition-colors ${estaAbierta ? 'border-axioma-300 shadow-card' : 'border-axioma-200 hover:border-axioma-300'
                    }`}
                >
                  <h3>
                    <button
                      type="button"
                      id={`faq-boton-${index}`}
                      aria-controls={`faq-panel-${index}`}
                      aria-expanded={estaAbierta}
                      onClick={() => setFaqAbierta(estaAbierta ? null : index)}
                      className="flex w-full items-center justify-between gap-4 p-5 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-axioma-600"
                    >
                      <span className="font-display text-base font-medium text-axiomaText-ink sm:text-lg">
                        {faq.pregunta}
                      </span>
                      <ChevronDown
                        className={`h-5 w-5 shrink-0 text-axioma-600 transition-transform duration-200 ${estaAbierta ? 'rotate-180' : ''
                          }`}
                      />
                    </button>
                  </h3>
                  {estaAbierta && (
                    <div
                      id={`faq-panel-${index}`}
                      role="region"
                      aria-labelledby={`faq-boton-${index}`}
                      className="border-t border-axioma-100 px-5 py-4 text-sm leading-relaxed text-axiomaText-soft"
                    >
                      {faq.respuesta}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 8. FOOTER */}
      <footer className="mt-auto bg-axioma-950 text-white">
        <div className={`${contenedor} py-12 lg:py-16`}>
          <div className="grid grid-cols-1 gap-10 md:grid-cols-2 lg:grid-cols-12 lg:gap-8">

            {/* Marca y redes */}
            <div className="space-y-4 md:col-span-2 lg:col-span-4">
              <LogoAxioma oscuro />
              <p className="max-w-sm text-sm leading-relaxed text-axioma-200">
                Centro de salud mental especializado en psicoterapia basada en evidencia con atención presencial y virtual en todo el Perú. Cuidado clínico confidencial, ético y humano.
              </p>
              <div className="flex items-center gap-3 pt-1">
                {redes.map(({ href, etiqueta, Icono }) => (
                  <a
                    key={etiqueta}
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={etiqueta}
                    className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 text-axioma-200 transition-colors hover:bg-white/20 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
                  >
                    <Icono className="h-4 w-4" />
                  </a>
                ))}
              </div>
            </div>

            {/* Enlaces y servicios: en móvil van lado a lado */}
            <div className="grid grid-cols-2 gap-8 lg:col-span-5 lg:grid-cols-5">
              <div className="lg:col-span-2">
                <h3 className="text-sm font-semibold text-white">Enlaces rápidos</h3>
                <ul className="mt-4 space-y-2.5 text-sm text-axioma-200">
                  {enlacesRapidos.map((e) => (
                    <li key={e.texto}>
                      <a href={e.href} className={enlaceFooter}>{e.texto}</a>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="lg:col-span-3">
                <h3 className="text-sm font-semibold text-white">Servicios</h3>
                <ul className="mt-4 space-y-2.5 text-sm text-axioma-200">
                  {servicios.map((s) => (
                    <li key={s} className="flex items-center gap-2">
                      <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-axioma-400" />
                      <span>{s}</span>
                    </li>
                  ))}
                  <li className="flex items-center gap-2 font-semibold text-white">
                    <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-400" />
                    <span>Telemedicina (sesión virtual)</span>
                  </li>
                </ul>
              </div>
            </div>

            {/* Contacto */}
            <div className="lg:col-span-3">
              <h3 className="text-sm font-semibold text-white">Contacto</h3>
              <ul className="mt-4 space-y-3 text-sm text-axioma-200">
                <li className="flex items-start gap-2.5">
                  <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-axioma-400" />
                  <span>Av. Arequipa 2450, Lince, Lima</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <Phone className="h-4 w-4 shrink-0 text-axioma-400" />
                  <a href="tel:+5114567890" className={enlaceFooter}>(01) 456-7890</a>
                </li>
                <li className="flex items-center gap-2.5">
                  <Mail className="h-4 w-4 shrink-0 text-axioma-400" />
                  <a href="mailto:contacto@axioma.pe" className={enlaceFooter}>contacto@axioma.pe</a>
                </li>
              </ul>
              <Link
                href="/login"
                className={`${enlaceFooter} mt-5 inline-block text-xs text-axioma-300 underline underline-offset-4`}
              >
                Acceso Personal Médico
              </Link>
            </div>
          </div>

          {/* Línea legal */}
          <div className="mt-10 flex flex-col gap-3 border-t border-white/10 pt-6 text-xs text-axioma-300 lg:mt-12 lg:flex-row lg:items-center lg:justify-between">
            <p>© 2026 Centro Psicológico Axioma. Todos los derechos reservados.</p>
            <p className="flex flex-col gap-1 sm:flex-row sm:flex-wrap sm:gap-x-5">
              <span>Ley N° 26842 - Ley General de Salud</span>
              <span>Ley N° 29733 - Protección de Datos Personales</span>
            </p>
          </div>
        </div>
      </footer>

      {/* 9. NOTIFICACIÓN FLOTANTE */}
      {mostrarNotificacion && (
        <div className="fixed bottom-4 left-4 right-4 z-40 animate-fade-in rounded-card-sm border border-axioma-200 bg-white p-4 text-axiomaText-ink shadow-lift motion-reduce:animate-none sm:bottom-6 sm:left-auto sm:right-6 sm:max-w-[340px]">
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-2">
              <span className="h-2 w-2 animate-ping rounded-full bg-axioma-500 motion-reduce:animate-none" />
              <span className="text-xs font-bold text-axiomaText-ink">Turnos Disponibles Hoy</span>
            </div>
            <button
              onClick={() => setMostrarNotificacion(false)}
              className={`rounded-full p-0.5 text-axiomaText-soft transition hover:text-axiomaText-ink ${foco}`}
              aria-label="Cerrar notificación"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          <p className="mt-2 text-xs leading-relaxed text-axiomaText-soft">
            Agenda abierta para consultas presenciales y virtuales con la Dra. Camila Morales.
          </p>
          <div className="mt-3 flex items-center justify-between">
            <span className="rounded-tag bg-axioma-100 px-2.5 py-1 text-[11px] font-semibold text-axioma-700">
              3 cupos libres
            </span>
            <Link href={destinoCta} className={`${btnPrimary} px-4 py-1.5 text-xs`}>
              Agendar Cupo
            </Link>
          </div>
        </div>
      )}

    </div>
  );
}