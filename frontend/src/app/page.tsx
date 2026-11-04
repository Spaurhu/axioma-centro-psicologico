'use client';

import { useState, useEffect, useRef, type ReactNode } from 'react';
import Link from 'next/link';
import { AnimatePresence, MotionConfig, motion, useReducedMotion } from 'motion/react';
import {
  Check, Calendar, CalendarCheck, Shield, BrainCircuit, Clock, Award,
  CheckCircle2, ChevronDown, LogOut, Phone, X, LayoutDashboard,
  BookmarkCheck, Menu, Video, Facebook, Instagram, Linkedin, MapPin, Mail,
  ArrowRight, ArrowUpRight, Plus, UserPlus, HeartHandshake, Sparkles,
  type LucideIcon,
} from 'lucide-react';
import { LogoAxioma } from '@/components/logo-axioma';
import {
  Aparecer, Escalonado, ItemEscalonado, EASE_SUAVE,
  variantesAparicion, variantesContenedor,
} from '@/components/landing/animaciones';
import { HeroVisual } from '@/components/landing/hero-visual';
import {
  VisualAgenda, VisualVirtual, VisualIA, VisualPaquetes, VisualSoap,
} from '@/components/landing/bento-visuales';
import {
  contenedor, foco, focoClaro, btnPrimary, btnSecondary, btnGhost, btnOnDark, tamSm, tamMd, tamLg,
} from '@/lib/ui';

/* ══════════════════════════════════════════════════════════════
   TIPOS
   ══════════════════════════════════════════════════════════════ */

/** Forma mínima del usuario guardado en localStorage ('axioma_usuario') */
interface UsuarioSesion {
  rol: string;
  correo: string;
  perfil?: { nombres?: string; apellidos?: string } | null;
}

type ItemMenu = { href: string; texto: string; Icono: LucideIcon };

/* ══════════════════════════════════════════════════════════════
   DATOS DE PRESENTACIÓN
   ══════════════════════════════════════════════════════════════ */

// Orden = orden en que aparecen en la página.
const enlacesNav = [
  { href: '#espacios', texto: 'Espacios' },
  { href: '#innovacion', texto: 'IA predictiva' },
  { href: '#paquetes', texto: 'Planes' },
  { href: '#enfoque', texto: 'Enfoque' },
  { href: '#faqs', texto: 'Preguntas' },
];

// Menú del usuario autenticado según rol
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

/* Indicadores y respaldo (misma información que antes) */
const indicadores = [
  { Icono: Award, valor: '100%', etiqueta: 'Colegiados C.Ps.P.' },
  { Icono: Clock, valor: '0 cruces', etiqueta: 'Disponibilidad en vivo' },
  { Icono: BrainCircuit, valor: 'IA SOAP', etiqueta: 'Prevención No-Show' },
];

const respaldos = [
  { Icono: Award, texto: 'Colegio de Psicólogos del Perú (C.Ps.P.)' },
  { Icono: Shield, texto: 'Ley N° 29733 de Datos Personales' },
  { Icono: CheckCircle2, texto: 'Historias clínicas formato SOAP' },
];

/* Bento */
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
    pie: 'border-axioma-100 text-axiomaText-ink',
    pieSec: 'text-axiomaText-soft',
    icoPie: 'text-axioma-600',
  },
  rosa: {
    card: 'bg-gradient-to-br from-axioma-600 via-axioma-700 to-axioma-800 border-axioma-700',
    titulo: 'text-white',
    texto: 'text-axioma-50',
    icono: 'bg-white/15 text-white',
    pastilla: 'bg-white/15 text-white border-white/25',
    pie: 'border-white/15 text-white',
    pieSec: 'text-axioma-100',
    icoPie: 'text-axioma-100',
  },
  suave: {
    card: 'bg-axioma-100 border-axioma-200',
    titulo: 'text-axiomaText-ink',
    texto: 'text-axiomaText-soft',
    icono: 'bg-white text-axioma-700',
    pastilla: 'bg-white/70 text-axioma-700 border-axioma-200',
    pie: 'border-axioma-200 text-axiomaText-ink',
    pieSec: 'text-axiomaText-soft',
    icoPie: 'text-axioma-600',
  },
  lavanda: {
    card: 'bg-heather border-white/70',
    titulo: 'text-axiomaText-ink',
    texto: 'text-axiomaText-soft',
    icono: 'bg-white text-axioma-700',
    pastilla: 'bg-white/70 text-axioma-700 border-white',
    pie: 'border-white text-axiomaText-ink',
    pieSec: 'text-axiomaText-soft',
    icoPie: 'text-axioma-600',
  },
};

/*
  Bento responsive:
  - móvil: 1 columna
  - tablet (md): 2 columnas (agenda a lo ancho)
  - desktop (lg): 12 columnas, composición asimétrica:
      [ agenda 7 ][ virtual 5 (alto) ]
      [ IA 7     ][                  ]
      [ paquetes 5 ][ SOAP 7         ]
*/
const salas: {
  clave: string;
  id?: string;
  variante: Variante;
  span: string;
  Icono: LucideIcon;
  etiqueta: string;
  titulo: string;
  texto: string;
  PieIcono?: LucideIcon;
  pieIzq: string;
  pieDer: string;
  Visual: () => ReactNode;
}[] = [
    {
      clave: 'agenda',
      variante: 'claro',
      span: 'md:col-span-2 lg:col-span-7',
      Icono: Calendar,
      etiqueta: 'Agendamiento dinámico',
      titulo: 'Cero cruces de horario en tiempo real.',
      texto:
        'El motor de disponibilidad valida los bloques de 45 a 60 minutos con descanso preventivo entre pacientes, impidiendo cualquier sobreposición de turnos.',
      PieIcono: Clock,
      pieIzq: 'Bloques de 60 min',
      pieDer: 'Lunes a sábado',
      Visual: VisualAgenda,
    },
    {
      clave: 'virtual',
      variante: 'lavanda',
      span: 'lg:col-span-5 lg:row-span-2',
      Icono: Video,
      etiqueta: 'Telemedicina nacional',
      titulo: 'Sesiones virtuales por Google Meet.',
      texto:
        'Atención psicológica especializada desde cualquier parte del Perú. Al agendar en modalidad virtual, recibes automáticamente tu enlace protegido de Google Meet en tu correo registrado.',
      PieIcono: Video,
      pieIzq: 'Enlace por correo seguro',
      pieDer: 'Cobertura nacional',
      Visual: VisualVirtual,
    },
    {
      clave: 'ia',
      id: 'innovacion',
      variante: 'rosa',
      span: 'lg:col-span-7',
      Icono: BrainCircuit,
      etiqueta: 'Inteligencia artificial',
      titulo: 'Predicción de inasistencias.',
      texto:
        'Algoritmo de regresión logística entrenado que calcula la probabilidad de asistencia del paciente según su historial y horario para activar recordatorios tempranos.',
      PieIcono: BrainCircuit,
      pieIzq: 'Modelo de 6 factores',
      pieDer: '84.6% precisión',
      Visual: VisualIA,
    },
    {
      clave: 'paquetes',
      variante: 'suave',
      span: 'lg:col-span-5',
      Icono: BookmarkCheck,
      etiqueta: 'Economía terapéutica',
      titulo: 'Paquetes con deducción atómica.',
      texto:
        'Adquiere bonos de 4 u 8 sesiones con descuentos significativos. Cada vez que asistes a consulta, el sistema descuenta tu saldo de forma transparente.',
      pieIzq: 'Desde S/. 65 por sesión',
      pieDer: 'Ahorro hasta S/. 120',
      Visual: VisualPaquetes,
    },
    {
      clave: 'soap',
      variante: 'claro',
      span: 'lg:col-span-7',
      Icono: Shield,
      etiqueta: 'Historial clínico SOAP',
      titulo: 'Evolución confidencial del paciente.',
      texto:
        'Notas clínicas estructuradas por sesión: Subjetivo, Objetivo, Apreciación y Plan. Tu psicólogo cuenta con el expediente completo en cada consulta.',
      pieIzq: 'Cifrado de grado médico',
      pieDer: 'Acceso exclusivo profesional',
      Visual: VisualSoap,
    },
  ];

/* Paquetes: mismos precios, textos y beneficios que antes */
const paquetes = [
  {
    clave: 'unica',
    etiqueta: 'Evaluación inicial',
    nombre: 'Sesión única',
    descripcion:
      'Ideal para primera consulta de diagnóstico, orientación puntual o crisis momentánea.',
    monto: '80',
    detalle: '/ 1 sesión de 50m',
    sesiones: 1,
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
    monto: '280',
    detalle: '/ S/. 70 por sesión',
    sesiones: 4,
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
    monto: '520',
    detalle: '/ S/. 65 por sesión',
    sesiones: 8,
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
    Icono: UserPlus,
    titulo: 'Crea tu cuenta de paciente',
    texto: 'Solo necesitas tus datos básicos para acceder a la agenda en vivo.',
  },
  {
    Icono: CalendarCheck,
    titulo: 'Selecciona tu psicólogo y horario',
    texto: 'Elige el día y bloque que mejor se ajuste a tu rutina diaria.',
  },
  {
    Icono: HeartHandshake,
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

/** Antetítulo con línea: "— Espacios terapéuticos" */
function Antetitulo({ children, oscuro = false }: { children: ReactNode; oscuro?: boolean }) {
  return (
    <span
      className={`inline-flex items-center gap-3 text-xs font-semibold uppercase tracking-[0.18em] ${oscuro ? 'text-axioma-300' : 'text-axioma-600'}`}
    >
      <span className={`h-px w-8 ${oscuro ? 'bg-axioma-400' : 'bg-axioma-400'}`} />
      {children}
    </span>
  );
}

function EncabezadoSeccion({
  antetitulo, titulo, texto, centrado = false,
}: { antetitulo: string; titulo: string; texto: string; centrado?: boolean }) {
  if (centrado) {
    return (
      <Aparecer className="mx-auto mb-8 max-w-2xl text-center sm:mb-10 lg:mb-12">
        <Antetitulo>{antetitulo}</Antetitulo>
        <h2 className="mt-4 font-display text-3xl font-medium leading-[1.1] tracking-heading text-axiomaText-ink sm:text-4xl lg:text-[2.75rem]">
          {titulo}
        </h2>
        <p className="mt-4 text-base leading-relaxed text-axiomaText-soft sm:text-lg">{texto}</p>
      </Aparecer>
    );
  }
  return (
    <Aparecer className="mb-8 grid gap-4 sm:mb-10 lg:mb-12 lg:grid-cols-12 lg:items-end lg:gap-12">
      <div className="lg:col-span-7">
        <Antetitulo>{antetitulo}</Antetitulo>
        <h2 className="mt-4 font-display text-3xl font-medium leading-[1.1] tracking-heading text-axiomaText-ink sm:text-4xl lg:text-[2.75rem]">
          {titulo}
        </h2>
      </div>
      <p className="max-w-md text-base leading-relaxed text-axiomaText-soft lg:col-span-5 lg:justify-self-end">
        {texto}
      </p>
    </Aparecer>
  );
}

/** Palabra resaltada del título principal con subrayado que se "dibuja" */
function Destacado({ children, retraso }: { children: ReactNode; retraso: number }) {
  return (
    <span className="relative inline-block whitespace-nowrap italic text-axioma-600">
      {children}
      <svg
        aria-hidden
        viewBox="0 0 200 12"
        preserveAspectRatio="none"
        className="absolute -bottom-[0.08em] left-0 h-[0.2em] w-full overflow-visible text-axioma-300"
      >
        <motion.path
          d="M3 8 C 55 2, 140 2, 197 7"
          fill="none"
          stroke="currentColor"
          strokeWidth="5"
          strokeLinecap="round"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 0.9, ease: EASE_SUAVE, delay: retraso }}
        />
      </svg>
    </span>
  );
}

/** Flecha que se desplaza al pasar el cursor por el botón (requiere `group`) */
function FlechaCta({ className = 'h-4 w-4' }: { className?: string }) {
  return <ArrowRight className={`${className} transition-transform duration-300 group-hover:translate-x-1`} />;
}

/* ══════════════════════════════════════════════════════════════
   PÁGINA
   ══════════════════════════════════════════════════════════════ */

export default function PaginaPrincipal() {
  const [usuario, setUsuario] = useState<UsuarioSesion | null>(null);
  const [menuAbierto, setMenuAbierto] = useState(false);
  const [navMovil, setNavMovil] = useState(false);
  const [conScroll, setConScroll] = useState(false);
  const [mostrarNotificacion, setMostrarNotificacion] = useState(false);
  const [faqAbierta, setFaqAbierta] = useState<number | null>(0);
  const menuRef = useRef<HTMLDivElement>(null);
  const reducirMovimiento = useReducedMotion();

  useEffect(() => {
    // Detectar si el usuario está logueado
    try {
      const uGuardado = localStorage.getItem('axioma_usuario');
      if (uGuardado) {
        setUsuario(JSON.parse(uGuardado) as UsuarioSesion);
      }
    } catch (e) {
      console.error(e);
    }
  }, []);

  // Navbar translúcida al desplazarse
  useEffect(() => {
    const alDesplazar = () => setConScroll(window.scrollY > 24);
    alDesplazar();
    window.addEventListener('scroll', alDesplazar, { passive: true });
    return () => window.removeEventListener('scroll', alDesplazar);
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

  // Escape cierra menús abiertos
  useEffect(() => {
    function alPresionar(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        setMenuAbierto(false);
        setNavMovil(false);
      }
    }
    document.addEventListener('keydown', alPresionar);
    return () => document.removeEventListener('keydown', alPresionar);
  }, []);

  // El aviso de agenda aparece unos segundos después, sin competir con el hero
  useEffect(() => {
    const t = window.setTimeout(() => setMostrarNotificacion(true), 2500);
    return () => window.clearTimeout(t);
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
  const destinoHero = esPaciente ? '/paciente' : '/registro';
  const itemsMenu: ItemMenu[] = usuario ? menuPorRol[usuario.rol] ?? menuAdmin : menuAdmin;
  const barraSolida = conScroll || navMovil;

  return (
    <MotionConfig reducedMotion="user">
      <div className="relative flex min-h-screen flex-col overflow-x-clip bg-axioma-50 font-sans text-axiomaText-ink antialiased selection:bg-axioma-200 selection:text-axiomaText-ink">

        {/* ═══ 1. NAVBAR flotante: transparente arriba, cristal al desplazarse ═══ */}
        <header className="fixed inset-x-0 top-0 z-50 px-3 pt-3 sm:px-5 sm:pt-4">
          <div
            className={`mx-auto max-w-[1280px] rounded-[28px] border transition-[background-color,box-shadow,border-color] duration-500 ${barraSolida
              ? 'border-white/80 bg-white/80 shadow-card backdrop-blur-xl'
              : 'border-transparent bg-transparent'
              }`}
          >
            <div className="flex items-center justify-between gap-4 px-3 py-2.5 sm:px-5 lg:py-3">

              <LogoAxioma subtitulo={<>Centro<br />Psicológico</>} />

              {/* Links navegación (laptop y desktop) */}
              <nav
                className={`hidden items-center gap-0.5 rounded-full p-1 transition-colors duration-500 lg:flex ${barraSolida ? 'bg-transparent' : 'border border-white/80 bg-white/55 backdrop-blur-md'
                  }`}
                aria-label="Secciones"
              >
                {enlacesNav.map((e) => (
                  <a
                    key={e.href}
                    href={e.href}
                    className={`rounded-full px-4 py-2 text-sm font-medium text-axiomaText-soft transition-colors hover:bg-axioma-100 hover:text-axioma-700 ${foco}`}
                  >
                    {e.texto}
                  </a>
                ))}
              </nav>

              {/* Zona de acceso */}
              <div className="flex items-center gap-2">
                {usuario ? (
                  // ESTADO AUTENTICADO
                  <div className="relative" ref={menuRef}>
                    <button
                      onClick={() => setMenuAbierto(!menuAbierto)}
                      className={`flex items-center gap-2.5 rounded-full border border-axioma-200 bg-white py-1 pl-1 pr-3 shadow-subtle transition hover:border-axioma-300 hover:shadow-card ${foco}`}
                      aria-expanded={menuAbierto}
                      aria-haspopup="menu"
                    >
                      <span className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-axioma-500 to-axioma-700 text-xs font-bold text-white">
                        {obtenerIniciales(usuario.perfil?.nombres || usuario.correo)}
                      </span>
                      <span className="hidden max-w-[120px] truncate text-xs font-semibold text-axiomaText-ink sm:block">
                        {usuario.perfil?.nombres || usuario.correo.split('@')[0]}
                      </span>
                      <ChevronDown className={`h-3.5 w-3.5 text-axiomaText-soft transition-transform duration-300 ${menuAbierto ? 'rotate-180' : ''}`} />
                    </button>

                    {/* MENÚ DESPLEGABLE */}
                    <AnimatePresence>
                      {menuAbierto && (
                        <motion.div
                          initial={{ opacity: 0, y: -6, scale: 0.97 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: -6, scale: 0.97 }}
                          transition={{ duration: 0.2, ease: EASE_SUAVE }}
                          className="absolute right-0 z-50 mt-2 w-64 origin-top-right rounded-2xl border border-axioma-200 bg-white p-2 shadow-lift"
                        >
                          <div className="rounded-xl bg-gradient-to-br from-axioma-50 to-heather-soft p-3">
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
                                className="flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-xs font-medium text-axiomaText-soft transition hover:bg-axioma-50 hover:text-axioma-700"
                              >
                                <Icono className="h-4 w-4 text-axioma-500" />
                                <span>{texto}</span>
                              </Link>
                            ))}
                          </div>

                          <div className="border-t border-axioma-100 pt-1.5">
                            <button
                              onClick={cerrarSesion}
                              className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-xs font-semibold text-rose-700 transition hover:bg-rose-50"
                            >
                              <LogOut className="h-4 w-4" />
                              <span>Cerrar Sesión</span>
                            </button>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                ) : (
                  // ESTADO PÚBLICO
                  <>
                    <Link
                      href="/login"
                      className={`${btnGhost} ${tamSm} hidden sm:inline-flex`}
                    >
                      Iniciar Sesión
                    </Link>
                    <Link
                      href="/login"
                      className={`${btnSecondary} px-4 py-2 text-xs sm:hidden`}
                    >
                      Ingresar
                    </Link>
                    <Link
                      href="/registro"
                      className={`group ${btnPrimary} ${tamSm} hidden shadow-card hover:shadow-lift sm:inline-flex sm:px-5`}
                    >
                      Reservar Cita
                      <ArrowUpRight className="h-4 w-4 transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
                    </Link>
                  </>
                )}

                {/* Botón menú móvil / tablet */}
                <button
                  onClick={() => setNavMovil(!navMovil)}
                  className={`flex h-10 w-10 items-center justify-center rounded-full border border-axioma-200 bg-white text-axioma-700 transition hover:bg-axioma-100 lg:hidden ${foco}`}
                  aria-label={navMovil ? 'Cerrar menú' : 'Abrir menú'}
                  aria-expanded={navMovil}
                  aria-controls="nav-movil"
                >
                  {navMovil ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
                </button>
              </div>
            </div>

            {/* Navegación móvil / tablet */}
            <AnimatePresence initial={false}>
              {navMovil && (
                <motion.nav
                  id="nav-movil"
                  key="nav-movil"
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: reducirMovimiento ? 0 : 0.3, ease: EASE_SUAVE }}
                  className="overflow-hidden lg:hidden"
                  aria-label="Secciones"
                >
                  <div className="border-t border-axioma-100 px-3 pb-4 pt-3 sm:px-5">
                    <div className="grid gap-1 sm:grid-cols-2">
                      {enlacesNav.map((e) => (
                        <a
                          key={e.href}
                          href={e.href}
                          onClick={() => setNavMovil(false)}
                          className="flex items-center justify-between rounded-xl px-3 py-3 text-sm font-medium text-axiomaText-soft transition hover:bg-axioma-50 hover:text-axioma-700"
                        >
                          {e.texto}
                          <ArrowRight className="h-4 w-4 text-axioma-300" />
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
                  </div>
                </motion.nav>
              )}
            </AnimatePresence>
          </div>
        </header>

        <main>
          {/* ═══ 2. HERO ═══ */}
          <section className="relative overflow-hidden pb-14 pt-24 sm:pt-28 lg:pb-24 lg:pt-32">
            {/* Fondo: degradado + halos de luz (gradientes, sin filtros costosos) */}
            <div aria-hidden className="absolute inset-0 -z-10 bg-gradient-to-b from-axioma-100 via-axioma-50 to-axioma-50" />
            <div aria-hidden className="absolute -right-40 -top-40 -z-10 h-[620px] w-[620px] rounded-full bg-[radial-gradient(circle,theme(colors.heather.DEFAULT)_0%,transparent_65%)]" />
            <div aria-hidden className="absolute -left-48 top-1/3 -z-10 h-[520px] w-[520px] rounded-full bg-[radial-gradient(circle,theme(colors.axioma.200/70%)_0%,transparent_65%)]" />

            <div className={`${contenedor} grid items-center gap-12 lg:grid-cols-12 lg:gap-10`}>

              {/* Texto */}
              <motion.div
                className="lg:col-span-6"
                initial="oculto"
                animate="visible"
                variants={variantesContenedor(0.12, 0.05)}
              >
                <motion.div variants={variantesAparicion}>
                  <span className="inline-flex items-center gap-2 rounded-full border border-axioma-200 bg-white/80 py-1 pl-1 pr-4 text-xs font-semibold text-axioma-800 shadow-subtle backdrop-blur">
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-axioma-600 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-white">
                      <Video className="h-3 w-3" />
                      Nueva modalidad
                    </span>
                    Terapia presencial y virtual
                  </span>
                </motion.div>

                <motion.h1
                  variants={variantesAparicion}
                  className="mt-7 font-display text-[2.6rem] font-medium leading-[1.05] tracking-display text-axiomaText-ink sm:text-6xl lg:text-[4rem] xl:text-[4.5rem]"
                >
                  Transforma tu bienestar con psicoterapia{' '}
                  <Destacado retraso={0.9}>cálida</Destacado> y{' '}
                  <Destacado retraso={1.15}>precisa</Destacado>.
                </motion.h1>

                <motion.p
                  variants={variantesAparicion}
                  className="mt-6 max-w-xl text-lg leading-relaxed text-axiomaText-soft"
                >
                  Sesiones individuales y familiares con psicólogos colegiados, en una plataforma segura pensada para acompañarte.
                </motion.p>

                <motion.ul variants={variantesAparicion} className="mt-5 grid gap-2.5 text-[15px] text-axiomaText-ink sm:grid-cols-1">
                  {[
                    'Agenda tus horarios en tiempo real',
                    'Adquiere paquetes de sesiones con descuento',
                    'Monitorea tu progreso clínico',
                  ].map((t) => (
                    <li key={t} className="flex items-center gap-3">
                      <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-axioma-600 text-white">
                        <Check className="h-3 w-3" strokeWidth={3} />
                      </span>
                      {t}
                    </li>
                  ))}
                </motion.ul>

                <motion.div variants={variantesAparicion} className="mt-9 flex flex-col gap-3 sm:flex-row sm:items-center">
                  <Link
                    href={destinoHero}
                    className={`group ${btnPrimary} ${tamLg} shadow-lift hover:shadow-panel`}
                  >
                    {esPaciente ? 'Ir a Mi Portal de Citas' : 'Agendar Mi Primera Sesión'}
                    <FlechaCta />
                  </Link>
                  <a
                    href="#espacios"
                    className={`${btnGhost} ${tamLg} border border-axioma-200 bg-white/70 backdrop-blur hover:border-axioma-300 hover:bg-white`}
                  >
                    Conocer Espacios
                  </a>
                </motion.div>

                <motion.div
                  variants={variantesAparicion}
                  className="mt-9 flex flex-wrap items-center gap-x-6 gap-y-2 border-t border-axioma-200/80 pt-6 text-sm text-axiomaText-soft"
                >
                  <span className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-axioma-500" />
                    Presencial en Lince, Lima
                  </span>
                  <span className="flex items-center gap-2">
                    <Video className="h-4 w-4 text-axioma-500" />
                    Virtual en todo el Perú
                  </span>
                </motion.div>
              </motion.div>

              {/* Fotografía + tarjetas flotantes */}
              <div className="px-4 sm:px-10 lg:col-span-6 lg:pl-14 lg:pr-6 xl:pl-20">
                <HeroVisual />
              </div>
            </div>
          </section>

          {/* ═══ 3. CONFIANZA Y CREDIBILIDAD — panel burdeos que se superpone al hero ═══ */}
          <section aria-label="Respaldo profesional" className="relative z-10 -mt-6 lg:-mt-10">
            <div className={contenedor}>
              <Aparecer>
                <div className="relative overflow-hidden rounded-[32px] bg-axioma-950 px-6 py-9 text-white shadow-panel sm:px-10 lg:px-12 lg:py-11">
                  <div aria-hidden className="absolute -right-24 -top-24 h-72 w-72 rounded-full bg-[radial-gradient(circle,theme(colors.axioma.700/60%)_0%,transparent_70%)]" />
                  <div aria-hidden className="absolute -bottom-32 left-1/3 h-72 w-72 rounded-full bg-[radial-gradient(circle,theme(colors.axioma.800/50%)_0%,transparent_70%)]" />

                  <div className="relative grid gap-10 lg:grid-cols-12 lg:items-center lg:gap-12">
                    <div className="lg:col-span-5">
                      <Antetitulo oscuro>Respaldo profesional</Antetitulo>
                      <p className="mt-4 font-display text-2xl font-medium leading-snug sm:text-[1.7rem]">
                        Estándares de confidencialidad médica y normativa en salud
                      </p>
                      <ul className="mt-6 space-y-3">
                        {respaldos.map(({ Icono, texto }) => (
                          <li key={texto} className="flex items-center gap-3 text-sm text-axioma-100">
                            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/10 text-axioma-300">
                              <Icono className="h-4 w-4" />
                            </span>
                            {texto}
                          </li>
                        ))}
                      </ul>
                    </div>

                    <Escalonado className="grid gap-4 sm:grid-cols-3 lg:col-span-7" escalon={0.12}>
                      {indicadores.map(({ Icono, valor, etiqueta }) => (
                        <ItemEscalonado key={valor}>
                          <div className="group h-full rounded-2xl border border-white/10 bg-white/[0.04] p-5 transition-colors duration-300 hover:border-white/20 hover:bg-white/[0.08]">
                            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-axioma-600/90 text-white transition-transform duration-300 group-hover:-rotate-6 group-hover:scale-110">
                              <Icono className="h-5 w-5" />
                            </span>
                            <p className="mt-5 font-display text-3xl font-medium tracking-heading text-white">{valor}</p>
                            <p className="mt-1 text-sm text-axioma-200">{etiqueta}</p>
                          </div>
                        </ItemEscalonado>
                      ))}
                    </Escalonado>
                  </div>
                </div>
              </Aparecer>
            </div>
          </section>

          {/* ═══ 4. ESPACIOS — Bento Grid asimétrico ═══ */}
          <section id="espacios" className="relative scroll-mt-24 pb-12 pt-14 sm:pt-16 lg:pb-14 lg:pt-20">
            <div aria-hidden className="absolute inset-0 -z-10 bg-gradient-to-b from-axioma-50 via-heather-soft to-heather-soft" />
            <div className={contenedor}>
              <EncabezadoSeccion
                antetitulo="Espacios terapéuticos"
                titulo="Una clínica digital estructurada en salas de bienestar."
                texto="Cada módulo de nuestra plataforma está pensado con calidez y rigor clínico para eliminar la fricción entre tú y tu terapeuta."
              />

              <Escalonado className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-12 lg:gap-5" escalon={0.1}>
                {salas.map((s) => {
                  const e = estilosSala[s.variante];
                  const PieIcono = s.PieIcono;
                  const Visual = s.Visual;
                  return (
                    <ItemEscalonado key={s.clave} className={s.span}>
                      <article
                        id={s.id}
                        className={`group relative flex h-full scroll-mt-28 flex-col overflow-hidden rounded-[28px] border p-6 shadow-card transition-[transform,box-shadow] duration-500 ease-out hover:-translate-y-1 hover:shadow-lift sm:p-8 ${e.card}`}
                      >
                        <div className="mb-6 flex flex-wrap items-center gap-3">
                          <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl transition-transform duration-500 group-hover:-rotate-6 group-hover:scale-110 ${e.icono}`}>
                            <s.Icono className="h-5 w-5" />
                          </span>
                          <span className={`rounded-tag border px-3 py-1 text-xs font-semibold ${e.pastilla}`}>
                            {s.etiqueta}
                          </span>
                        </div>

                        <h3 className={`font-display text-2xl font-medium leading-tight tracking-heading sm:text-[1.7rem] ${e.titulo}`}>
                          {s.titulo}
                        </h3>
                        <p className={`mt-3 max-w-xl text-[15px] leading-relaxed ${e.texto}`}>{s.texto}</p>

                        <div className={`mt-6 ${s.clave === 'virtual' ? 'lg:mt-auto lg:pt-6' : ''}`}>
                          <Visual />
                        </div>

                        <div className={`mt-auto pt-5 ${s.clave === 'virtual' ? 'lg:mt-0' : ''}`}>
                          <div className={`flex flex-wrap items-center justify-between gap-x-4 gap-y-1.5 border-t pt-4 text-xs font-semibold ${e.pie}`}>
                            <span className="flex items-center gap-2">
                              {PieIcono && <PieIcono className={`h-4 w-4 shrink-0 ${e.icoPie}`} />}
                              {s.pieIzq}
                            </span>
                            <span className={e.pieSec}>{s.pieDer}</span>
                          </div>
                        </div>
                      </article>
                    </ItemEscalonado>
                  );
                })}
              </Escalonado>
            </div>
          </section>

          {/* ═══ 5. PAQUETES ═══ */}
          <section id="paquetes" className="relative scroll-mt-24 overflow-hidden bg-axioma-50 pb-14 pt-10 sm:pb-16 sm:pt-12 lg:pb-20 lg:pt-14">
            <div aria-hidden className="absolute left-1/2 top-24 -z-0 h-[480px] w-[900px] -translate-x-1/2 rounded-full bg-[radial-gradient(ellipse,theme(colors.axioma.100)_0%,transparent_70%)]" />
            <div className={`${contenedor} relative`}>
              <EncabezadoSeccion
                centrado
                antetitulo="Planes y sesiones"
                titulo="Paquetes terapéuticos accesibles"
                texto="Elige la modalidad que mejor se adapte a tus objetivos terapéuticos. Mientras más sesiones, menor el costo por sesión."
              />

              <Escalonado className="grid grid-cols-1 gap-5 md:grid-cols-3 md:items-stretch lg:gap-6" escalon={0.12}>
                {paquetes.map((p) => (
                  <ItemEscalonado key={p.clave} className="h-full">
                    <div
                      className={
                        p.destacado
                          ? 'group relative flex h-full flex-col overflow-hidden rounded-[30px] border border-axioma-800 bg-axioma-900 p-7 text-white shadow-lift transition-[transform,box-shadow] duration-500 hover:-translate-y-1.5 hover:shadow-panel md:z-10 md:scale-[1.03] lg:p-9'
                          : 'group relative flex h-full flex-col rounded-[30px] border border-axioma-200 bg-white p-7 shadow-card transition-[transform,box-shadow,border-color] duration-500 hover:-translate-y-1.5 hover:border-axioma-300 hover:shadow-lift lg:p-9'
                      }
                    >
                      {p.destacado && (
                        <>
                          <div aria-hidden className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-[radial-gradient(circle,theme(colors.axioma.600/55%)_0%,transparent_70%)]" />
                          <span className="absolute right-6 top-6 inline-flex items-center gap-1.5 rounded-tag bg-axioma-300 px-3 py-1 text-[11px] font-bold text-axioma-950">
                            <Sparkles className="h-3 w-3" />
                            Recomendado
                          </span>
                        </>
                      )}

                      <div className="relative">
                        <span className={`text-xs font-semibold uppercase tracking-[0.14em] ${p.destacado ? 'text-axioma-300' : 'text-axioma-600'}`}>
                          {p.etiqueta}
                        </span>
                        <h3 className={`mt-2 font-display text-2xl font-medium tracking-heading ${p.destacado ? 'text-white' : 'text-axiomaText-ink'}`}>
                          {p.nombre}
                        </h3>
                        <p className={`mt-2 text-sm leading-relaxed ${p.destacado ? 'text-axioma-100' : 'text-axiomaText-soft'}`}>
                          {p.descripcion}
                        </p>

                        {/* Precio */}
                        <div className="mt-7 flex flex-wrap items-end gap-x-2">
                          <span className={`mb-2 text-lg font-semibold ${p.destacado ? 'text-axioma-200' : 'text-axiomaText-soft'}`}>S/.</span>
                          <span className={`font-display text-6xl font-medium leading-none tracking-display ${p.destacado ? 'text-white' : 'text-axiomaText-ink'}`}>
                            {p.monto}
                          </span>
                          <span className={`mb-1.5 text-xs ${p.destacado ? 'text-axioma-200' : 'text-axiomaText-soft'}`}>
                            {p.detalle}
                          </span>
                        </div>

                        {/* Cantidad de sesiones */}
                        <div className="mt-4 flex items-center gap-3">
                          <div className="flex gap-1" aria-hidden>
                            {Array.from({ length: p.sesiones }, (_, i) => (
                              <span key={i} className={`h-2 w-2 rounded-full ${p.destacado ? 'bg-axioma-300' : 'bg-axioma-500'}`} />
                            ))}
                          </div>
                          <span className={`text-xs font-semibold ${p.destacado ? 'text-axioma-100' : 'text-axiomaText-soft'}`}>
                            {p.sesiones === 1 ? '1 sesión' : `${p.sesiones} sesiones`}
                          </span>
                        </div>

                        {p.ahorro && (
                          <div className={`mt-4 inline-block rounded-tag px-3 py-1 text-[11px] font-bold ${p.destacado ? 'bg-white/10 text-axioma-100' : 'bg-axioma-100 text-axioma-700'}`}>
                            {p.ahorro}
                          </div>
                        )}

                        <ul className={`mt-7 space-y-3 border-t pt-6 text-sm ${p.destacado ? 'border-white/15' : 'border-axioma-100'}`}>
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

                      <div className="relative mt-auto pt-8">
                        <Link
                          href={destinoCta}
                          className={`group/btn ${p.destacado ? btnOnDark : btnSecondary} ${tamMd} w-full`}
                        >
                          {p.cta}
                          <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover/btn:translate-x-1" />
                        </Link>
                      </div>
                    </div>
                  </ItemEscalonado>
                ))}
              </Escalonado>
            </div>
          </section>

          {/* ═══ 6. ENFOQUE CLÍNICO — garantías + línea de tiempo ═══ */}
          <section id="enfoque" className="relative scroll-mt-24 bg-axioma-100/70 py-14 sm:py-16 lg:py-20">
            <div className={`${contenedor} grid grid-cols-1 items-center gap-10 lg:grid-cols-12 lg:gap-12`}>

              <div className="lg:col-span-6">
                <Aparecer>
                  <Antetitulo>Enfoque clínico</Antetitulo>
                  <h2 className="mt-4 font-display text-3xl font-medium leading-[1.1] tracking-heading text-axiomaText-ink sm:text-4xl lg:text-[2.75rem]">
                    Tu viaje de sanación respaldado por un equipo integral.
                  </h2>
                  <p className="mt-5 max-w-xl text-base leading-relaxed text-axiomaText-soft sm:text-lg">
                    No dejamos tu proceso al azar. Cada terapeuta de Axioma sigue un código de ética riguroso, respaldado por herramientas digitales que optimizan cada minuto de tu tiempo de consulta.
                  </p>
                </Aparecer>

                <Escalonado className="mt-8 divide-y divide-axioma-200/80 border-y border-axioma-200/80" escalon={0.12}>
                  {garantias.map(({ Icono, titulo, texto }) => (
                    <ItemEscalonado key={titulo}>
                      <div className="group flex items-start gap-5 py-5">
                        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-axioma-200 bg-white text-axioma-700 shadow-subtle transition-colors duration-300 group-hover:border-axioma-600 group-hover:bg-axioma-600 group-hover:text-white">
                          <Icono className="h-5 w-5" />
                        </span>
                        <div>
                          <h3 className="text-base font-semibold text-axiomaText-ink">{titulo}</h3>
                          <p className="mt-1 text-sm leading-relaxed text-axiomaText-soft">{texto}</p>
                        </div>
                      </div>
                    </ItemEscalonado>
                  ))}
                </Escalonado>
              </div>

              {/* Pasos: secuencia real, como línea de tiempo */}
              <Aparecer className="lg:col-span-6" retraso={0.1}>
                <div className="relative overflow-hidden rounded-[32px] bg-axioma-900 p-7 text-white shadow-panel sm:p-10">
                  <div aria-hidden className="absolute -right-24 -top-24 h-72 w-72 rounded-full bg-[radial-gradient(circle,theme(colors.axioma.600/45%)_0%,transparent_70%)]" />

                  <div className="relative">
                    <Antetitulo oscuro>Cómo empezar</Antetitulo>
                    <h3 className="mt-4 font-display text-2xl font-medium tracking-heading sm:text-3xl">
                      Comienza hoy en 3 simples pasos
                    </h3>

                    <ol className="relative mt-9">
                      {/* Línea que se dibuja al entrar en pantalla */}
                      <motion.span
                        aria-hidden
                        className="absolute bottom-6 left-[21px] top-6 w-px origin-top bg-gradient-to-b from-axioma-300 via-axioma-400/60 to-axioma-600/20"
                        initial={{ scaleY: 0 }}
                        whileInView={{ scaleY: 1 }}
                        viewport={{ once: true, amount: 0.5 }}
                        transition={{ duration: 1.2, ease: EASE_SUAVE, delay: 0.2 }}
                      />
                      {pasos.map((paso, i) => (
                        <motion.li
                          key={paso.titulo}
                          className="relative flex gap-5 pb-8 last:pb-0"
                          initial={{ opacity: 0, x: 16 }}
                          whileInView={{ opacity: 1, x: 0 }}
                          viewport={{ once: true, amount: 0.6 }}
                          transition={{ duration: 0.6, ease: EASE_SUAVE, delay: 0.3 + i * 0.18 }}
                        >
                          <span className="relative z-10 flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-axioma-300 text-axioma-950 ring-4 ring-axioma-900">
                            <paso.Icono className="h-5 w-5" />
                          </span>
                          <div className="pt-0.5">
                            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-axioma-300">
                              Paso {String(i + 1).padStart(2, '0')}
                            </p>
                            <p className="mt-1 text-base font-semibold">{paso.titulo}</p>
                            <p className="mt-1 text-sm leading-relaxed text-axioma-200">{paso.texto}</p>
                          </div>
                        </motion.li>
                      ))}
                    </ol>

                    <div className="mt-9 border-t border-white/15 pt-7">
                      <Link
                        href={destinoHero}
                        className={`group ${btnOnDark} ${tamLg} w-full`}
                      >
                        {esPaciente ? 'Entrar a Mi Portal' : 'Registrarme Ahora'}
                        <FlechaCta />
                      </Link>
                    </div>
                  </div>
                </div>
              </Aparecer>
            </div>
          </section>

          {/* ═══ 7. PREGUNTAS FRECUENTES ═══ */}
          <section id="faqs" className="scroll-mt-24 bg-heather-soft py-14 sm:py-16 lg:py-20">
            <div className={`${contenedor} grid gap-10 lg:grid-cols-12 lg:gap-12`}>

              <div className="lg:col-span-5">
                <Aparecer className="lg:sticky lg:top-32">
                  <Antetitulo>Preguntas frecuentes</Antetitulo>
                  <h2 className="mt-4 font-display text-3xl font-medium leading-[1.1] tracking-heading text-axiomaText-ink sm:text-4xl lg:text-[2.75rem]">
                    Preguntas frecuentes sobre la atención.
                  </h2>
                  <p className="mt-5 max-w-md text-base leading-relaxed text-axiomaText-soft">
                    Resolvemos tus dudas sobre modalidades presencial y virtual, paquetes terapéuticos y agendamiento.
                  </p>

                  <div className="mt-8 rounded-[24px] border border-white bg-white/80 p-6 shadow-card backdrop-blur">
                    <p className="font-display text-lg font-medium text-axiomaText-ink">¿No encuentras tu respuesta?</p>
                    <p className="mt-1.5 text-sm leading-relaxed text-axiomaText-soft">
                      Escríbenos o llámanos y te ayudamos a elegir la modalidad que mejor se adapte a ti.
                    </p>
                    <div className="mt-5 flex flex-wrap gap-2">
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
                </Aparecer>
              </div>

              <Escalonado className="space-y-3 lg:col-span-7" escalon={0.08}>
                {faqs.map((faq, index) => {
                  const estaAbierta = faqAbierta === index;
                  return (
                    <ItemEscalonado key={faq.pregunta}>
                      <div
                        className={`overflow-hidden rounded-[22px] border transition-[background-color,border-color,box-shadow] duration-300 ${estaAbierta
                          ? 'border-axioma-200 bg-white shadow-card'
                          : 'border-white/80 bg-white/60 hover:border-axioma-200 hover:bg-white'
                          }`}
                      >
                        <h3>
                          <button
                            type="button"
                            id={`faq-boton-${index}`}
                            aria-controls={`faq-panel-${index}`}
                            aria-expanded={estaAbierta}
                            onClick={() => setFaqAbierta(estaAbierta ? null : index)}
                            className="flex w-full items-center gap-4 p-5 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-axioma-600 sm:p-6"
                          >
                            <span className={`font-display text-sm tabular-nums transition-colors ${estaAbierta ? 'text-axioma-600' : 'text-axioma-300'}`}>
                              {String(index + 1).padStart(2, '0')}
                            </span>
                            <span className="flex-1 font-display text-base font-medium text-axiomaText-ink sm:text-lg">
                              {faq.pregunta}
                            </span>
                            <span
                              className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full transition-colors duration-300 ${estaAbierta ? 'bg-axioma-600 text-white' : 'bg-axioma-50 text-axioma-600'
                                }`}
                            >
                              <Plus className={`h-4 w-4 transition-transform duration-300 ${estaAbierta ? 'rotate-45' : ''}`} />
                            </span>
                          </button>
                        </h3>
                        <AnimatePresence initial={false}>
                          {estaAbierta && (
                            <motion.div
                              key="panel"
                              id={`faq-panel-${index}`}
                              role="region"
                              aria-labelledby={`faq-boton-${index}`}
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: 'auto', opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              transition={{ duration: reducirMovimiento ? 0 : 0.35, ease: EASE_SUAVE }}
                              className="overflow-hidden"
                            >
                              <p className="px-5 pb-6 pl-[3.25rem] text-[15px] leading-relaxed text-axiomaText-soft sm:px-6 sm:pl-[3.6rem]">
                                {faq.respuesta}
                              </p>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    </ItemEscalonado>
                  );
                })}
              </Escalonado>
            </div>
          </section>
        </main>

        {/* ═══ 8. FOOTER ═══ */}
        <footer className="relative mt-auto overflow-hidden bg-axioma-950 text-white">
          <div aria-hidden className="absolute -left-40 -top-40 h-96 w-96 rounded-full bg-[radial-gradient(circle,theme(colors.axioma.800/60%)_0%,transparent_70%)]" />

          <div className={`${contenedor} relative pt-12 lg:pt-16`}>
            {/* Llamada final a la acción */}
            <Aparecer>
              <div className="flex flex-col gap-6 rounded-[28px] border border-white/10 bg-gradient-to-br from-axioma-800/80 to-axioma-900/80 p-7 sm:p-10 lg:flex-row lg:items-center lg:justify-between">
                <div className="max-w-xl">
                  <p className="font-display text-2xl font-medium leading-snug sm:text-3xl">
                    Da el primer paso hacia tu bienestar.
                  </p>
                  <p className="mt-2 text-sm leading-relaxed text-axioma-200 sm:text-base">
                    Agenda tu sesión presencial o virtual con un psicólogo colegiado.
                  </p>
                </div>
                <div className="flex flex-col gap-3 sm:flex-row">
                  <Link href={destinoHero} className={`group ${btnOnDark} ${tamLg}`}>
                    {esPaciente ? 'Ir a Mi Portal' : 'Reservar Cita'}
                    <FlechaCta />
                  </Link>
                  <a
                    href="tel:+5114567890"
                    className={`inline-flex items-center justify-center gap-2 rounded-button border border-white/25 ${tamLg} font-semibold text-white transition-colors hover:bg-white/10 ${focoClaro}`}
                  >
                    <Phone className="h-4 w-4" />
                    (01) 456-7890
                  </a>
                </div>
              </div>
            </Aparecer>

            <div className="mt-10 grid grid-cols-1 gap-8 md:grid-cols-2 lg:mt-12 lg:grid-cols-12 lg:gap-8">

              {/* Marca y redes */}
              <div className="space-y-5 md:col-span-2 lg:col-span-4">
                <LogoAxioma oscuro />
                <p className="max-w-sm text-sm leading-relaxed text-axioma-200">
                  Centro de salud mental especializado en psicoterapia basada en evidencia con atención presencial y virtual en todo el Perú. Cuidado clínico confidencial, ético y humano.
                </p>
                <div className="flex items-center gap-3">
                  {redes.map(({ href, etiqueta, Icono }) => (
                    <a
                      key={etiqueta}
                      href={href}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={etiqueta}
                      className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/5 text-axioma-200 transition-all duration-300 hover:-translate-y-0.5 hover:border-axioma-400 hover:bg-axioma-600 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
                    >
                      <Icono className="h-4 w-4" />
                    </a>
                  ))}
                </div>
              </div>

              {/* Enlaces y servicios: en móvil van lado a lado */}
              <div className="grid grid-cols-2 gap-8 lg:col-span-5 lg:grid-cols-5">
                <div className="lg:col-span-2">
                  <h3 className="text-xs font-semibold uppercase tracking-[0.16em] text-axioma-300">Enlaces rápidos</h3>
                  <ul className="mt-5 space-y-3 text-sm text-axioma-200">
                    {enlacesRapidos.map((e) => (
                      <li key={e.texto}>
                        <a href={e.href} className={enlaceFooter}>{e.texto}</a>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="lg:col-span-3">
                  <h3 className="text-xs font-semibold uppercase tracking-[0.16em] text-axioma-300">Servicios</h3>
                  <ul className="mt-5 space-y-3 text-sm text-axioma-200">
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
                <h3 className="text-xs font-semibold uppercase tracking-[0.16em] text-axioma-300">Contacto</h3>
                <ul className="mt-5 space-y-3.5 text-sm text-axioma-200">
                  <li className="flex items-start gap-3">
                    <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-axioma-400" />
                    <span>Av. Arequipa 2450, Lince, Lima</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <Phone className="h-4 w-4 shrink-0 text-axioma-400" />
                    <a href="tel:+5114567890" className={enlaceFooter}>(01) 456-7890</a>
                  </li>
                  <li className="flex items-center gap-3">
                    <Mail className="h-4 w-4 shrink-0 text-axioma-400" />
                    <a href="mailto:contacto@axioma.pe" className={enlaceFooter}>contacto@axioma.pe</a>
                  </li>
                </ul>
                <Link
                  href="/login"
                  className={`${enlaceFooter} mt-6 inline-flex items-center gap-1.5 text-xs text-axioma-300 underline underline-offset-4`}
                >
                  Acceso Personal Médico
                  <ArrowUpRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </div>

            {/* Línea legal */}
            <div className="mt-10 flex flex-col gap-3 border-t border-white/10 py-6 text-xs text-axioma-300 lg:mt-12 lg:flex-row lg:items-center lg:justify-between">
              <p>© 2026 Centro Psicológico Axioma. Todos los derechos reservados.</p>
              <p className="flex flex-col gap-1 sm:flex-row sm:flex-wrap sm:gap-x-5">
                <span>Ley N° 26842 - Ley General de Salud</span>
                <span>Ley N° 29733 - Protección de Datos Personales</span>
              </p>
            </div>
          </div>

          {/* Marca de agua tipográfica */}
          <p
            aria-hidden
            className="pointer-events-none select-none text-center text-[22vw] font-extrabold lowercase leading-[0.75] tracking-tighter text-white/[0.035] lg:text-[16rem]"
          >
            axioma
          </p>
        </footer>

        {/* ═══ 9. AVISO FLOTANTE — informativo, sin cifras de cupos inventadas ═══ */}
        <AnimatePresence>
          {mostrarNotificacion && !navMovil && (
            <motion.aside
              role="status"
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 24 }}
              transition={{ duration: 0.5, ease: EASE_SUAVE }}
              className="fixed bottom-4 left-4 right-4 z-40 rounded-[22px] border border-axioma-200 bg-white/95 p-4 text-axiomaText-ink shadow-lift backdrop-blur-md sm:bottom-6 sm:left-auto sm:right-6 sm:max-w-[340px]"
            >
              <div className="flex items-start gap-3">
                <span className="relative mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-axioma-100 text-axioma-700">
                  <CalendarCheck className="h-4 w-4" />
                  <span className="absolute right-0 top-0 h-2.5 w-2.5 rounded-full border-2 border-white bg-emerald-500" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-bold text-axiomaText-ink">Agenda abierta</p>
                  <p className="mt-0.5 text-xs leading-relaxed text-axiomaText-soft">
                    Consultas presenciales y virtuales. Revisa los horarios disponibles en tiempo real al reservar.
                  </p>
                  <Link
                    href={destinoCta}
                    className="group mt-2.5 inline-flex items-center gap-1 text-xs font-semibold text-axioma-700 hover:text-axioma-800"
                  >
                    Ver horarios
                    <ArrowRight className="h-3.5 w-3.5 transition-transform duration-300 group-hover:translate-x-0.5" />
                  </Link>
                </div>
                <button
                  onClick={() => setMostrarNotificacion(false)}
                  className={`rounded-full p-1 text-axiomaText-soft transition hover:bg-axioma-50 hover:text-axiomaText-ink ${foco}`}
                  aria-label="Cerrar aviso"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </motion.aside>
          )}
        </AnimatePresence>

      </div>
    </MotionConfig>
  );
}