'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  Heart, ArrowRight, Check, Calendar, Shield, Sparkles, BrainCircuit,
  Clock, Award, Users, CheckCircle2, ChevronDown, LogOut, User,
  Phone, X, LayoutDashboard, BookmarkCheck
} from 'lucide-react';

export default function PaginaPrincipal() {
  const router = useRouter();
  const [usuario, setUsuario] = useState<any>(null);
  const [menuAbierto, setMenuAbierto] = useState(false);
  const [mostrarNotificacion, setMostrarNotificacion] = useState(true);
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

  return (
    <div className="flex min-h-screen flex-col bg-sand-light font-sans text-ink-black antialiased selection:bg-terracotta-soft selection:text-navy-deep">
      
      {/* 1. TOP NAVIGATION BAR con Estado Autenticado & Dropdown UX */}
      <header className="sticky top-0 z-50 bg-paper-white border-b border-frost/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-[1280px] items-center justify-between px-6 py-4 lg:px-12">
          
          {/* Logo */}
          <Link href="/" className="group flex items-center space-x-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-[12px] bg-navy text-paper-white transition-transform group-hover:scale-105">
              <Heart className="h-5 w-5 fill-terracotta text-terracotta" />
            </div>
            <div>
              <span className="text-xl font-bold tracking-tight text-navy">
                Axioma
              </span>
              <span className="block text-[11px] font-semibold uppercase tracking-widest text-slate">
                Centro Psicológico
              </span>
            </div>
          </Link>

          {/* Links Navegación */}
          <nav className="hidden items-center space-x-8 md:flex">
            <a href="#enfoque" className="text-sm font-medium text-graphite hover:text-navy transition">
              Enfoque Clínico
            </a>
            <a href="#espacios" className="text-sm font-medium text-graphite hover:text-navy transition">
              Espacios Terapéuticos
            </a>
            <a href="#paquetes" className="text-sm font-medium text-graphite hover:text-navy transition">
              Planes & Sesiones
            </a>
            <a href="#innovacion" className="text-sm font-medium text-graphite hover:text-navy transition">
              IA Predictiva
            </a>
          </nav>

          {/* Zona de Acceso: Dinámica según Estado de Autenticación */}
          <div className="flex items-center space-x-3">
            {usuario ? (
              // ESTADO AUTENTICADO: Avatar con Dropdown
              <div className="relative" ref={menuRef}>
                <button
                  onClick={() => setMenuAbierto(!menuAbierto)}
                  className="flex items-center space-x-2.5 rounded-[40px] border border-frost bg-sand/60 px-3.5 py-1.5 transition hover:bg-sand focus:outline-none"
                  aria-expanded={menuAbierto}
                >
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-navy text-xs font-bold text-paper-white">
                    {obtenerIniciales(usuario.perfil?.nombres || usuario.correo)}
                  </div>
                  <span className="text-xs font-semibold text-navy max-w-[120px] truncate">
                    {usuario.perfil?.nombres || usuario.correo.split('@')[0]}
                  </span>
                  <ChevronDown className={`h-3.5 w-3.5 text-slate transition-transform ${menuAbierto ? 'rotate-180' : ''}`} />
                </button>

                {/* MENÚ DESPLEGABLE (DROPDOWN) */}
                {menuAbierto && (
                  <div className="absolute right-0 mt-2 w-64 rounded-[20px] bg-paper-white p-2 shadow-dropdown border border-frost animate-fade-in z-50">
                    <div className="p-3 border-b border-frost/80">
                      <p className="text-xs font-bold text-navy truncate">
                        {usuario.perfil?.nombres ? `${usuario.perfil.nombres} ${usuario.perfil.apellidos || ''}` : usuario.correo}
                      </p>
                      <p className="text-[11px] text-slate font-medium truncate mt-0.5">
                        {usuario.correo}
                      </p>
                      <span className="mt-2 inline-block rounded-[9999px] bg-terracotta-wash px-2.5 py-0.5 text-[10px] font-bold text-terracotta capitalize">
                        {usuario.rol.toLowerCase()}
                      </span>
                    </div>

                    <div className="py-1">
                      {usuario.rol === 'PACIENTE' ? (
                        <>
                          <Link
                            href="/paciente"
                            onClick={() => setMenuAbierto(false)}
                            className="flex items-center space-x-2.5 rounded-[12px] px-3 py-2 text-xs font-medium text-graphite hover:bg-sand/60 hover:text-navy transition"
                          >
                            <BookmarkCheck className="h-4 w-4 text-terracotta" />
                            <span>Mi Portal & Paquetes</span>
                          </Link>
                          <Link
                            href="/paciente"
                            onClick={() => setMenuAbierto(false)}
                            className="flex items-center space-x-2.5 rounded-[12px] px-3 py-2 text-xs font-medium text-graphite hover:bg-sand/60 hover:text-navy transition"
                          >
                            <Calendar className="h-4 w-4 text-navy" />
                            <span>Agendar Cita en Vivo</span>
                          </Link>
                        </>
                      ) : (
                        <Link
                          href="/panel"
                          onClick={() => setMenuAbierto(false)}
                          className="flex items-center space-x-2.5 rounded-[12px] px-3 py-2 text-xs font-medium text-graphite hover:bg-sand/60 hover:text-navy transition"
                        >
                          <LayoutDashboard className="h-4 w-4 text-navy" />
                          <span>Panel de Control Clínico</span>
                        </Link>
                      )}
                    </div>

                    <div className="border-t border-frost/80 pt-1 mt-1">
                      <button
                        onClick={cerrarSesion}
                        className="flex w-full items-center space-x-2.5 rounded-[12px] px-3 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 transition"
                      >
                        <LogOut className="h-4 w-4" />
                        <span>Cerrar Sesión</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              // ESTADO PÚBLICO: Iniciar Sesión + Reservar
              <>
                <Link
                  href="/login"
                  className="rounded-[40px] border border-ink-black bg-paper-white px-5 py-2 text-sm font-medium text-ink-black transition hover:bg-sand/60"
                >
                  Iniciar Sesión
                </Link>
                <Link
                  href="/registro"
                  className="hidden sm:inline-flex rounded-[40px] bg-terracotta px-5 py-2 text-sm font-semibold text-paper-white transition hover:bg-terracotta-hover"
                >
                  Reservar Cita
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* 2. FULL-BLEED HERO (Deep Slate Navy #1c2d42 background, Terracotta Sand accents) */}
      <section className="relative overflow-hidden bg-navy px-6 py-20 lg:px-12 lg:py-28 text-paper-white">
        <div className="mx-auto max-w-[1280px]">
          <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-12 lg:gap-8">
            
            {/* Lado Izquierdo: Copywriting & CTAs */}
            <div className="lg:col-span-7 space-y-6">
              <div className="inline-flex items-center space-x-2 rounded-[9999px] bg-paper-white/10 px-4 py-1.5 text-xs font-semibold text-sand-dark backdrop-blur-sm">
                <span className="h-2 w-2 rounded-full bg-terracotta animate-pulse" />
                <span>Salud Mental Basada en Evidencia · C.Ps.P.</span>
              </div>

              <h1 className="text-5xl font-medium sm:text-6xl lg:text-[76px] lg:leading-[1.04] tracking-display">
                Transforma tu bienestar con psicoterapia{' '}
                <span className="font-semibold text-terracotta">cálida y precisa</span>.
              </h1>

              <p className="max-w-xl text-lg text-sand/90 leading-relaxed font-normal">
                Sesiones individuales y familiares con psicólogos colegiados. Agenda tus horarios en tiempo real, adquiere paquetes con descuento y monitorea tu progreso clínico en una plataforma segura.
              </p>

              {/* Botón Terracotta + Ghost Outline Button */}
              <div className="flex flex-wrap items-center gap-4 pt-4">
                <Link
                  href={usuario?.rol === 'PACIENTE' ? '/paciente' : '/registro'}
                  className="rounded-[40px] bg-terracotta px-7 py-3.5 text-base font-semibold text-paper-white transition hover:bg-terracotta-hover hover:scale-[1.01]"
                >
                  {usuario?.rol === 'PACIENTE' ? 'Ir a Mi Portal de Citas' : 'Agendar Mi Primera Sesión'}
                </Link>
                <a
                  href="#espacios"
                  className="rounded-[40px] border border-paper-white bg-transparent px-7 py-3.5 text-base font-medium text-paper-white transition hover:bg-paper-white/10"
                >
                  Conocer Espacios
                </a>
              </div>

              {/* Indicadores clave */}
              <div className="grid grid-cols-3 gap-6 pt-10 border-t border-paper-white/15">
                <div>
                  <div className="text-3xl font-bold tracking-heading text-paper-white">100%</div>
                  <div className="text-xs text-sand/80 mt-1">Colegiados C.Ps.P.</div>
                </div>
                <div>
                  <div className="text-3xl font-bold tracking-heading text-terracotta">0 Cruces</div>
                  <div className="text-xs text-sand/80 mt-1">Disponibilidad en Vivo</div>
                </div>
                <div>
                  <div className="text-3xl font-bold tracking-heading text-paper-white">IA SOAP</div>
                  <div className="text-xs text-sand/80 mt-1">Prevención No-Show</div>
                </div>
              </div>
            </div>

            {/* Lado Derecho: WhatsApp & Interactive Health Mockup */}
            <div className="lg:col-span-5 flex justify-center">
              <div className="w-full max-w-[360px] rounded-[32px] bg-paper-white p-3 shadow-none border border-paper-white/20">
                {/* Marco de Dispositivo */}
                <div className="overflow-hidden rounded-[24px] bg-paper-white border border-frost">
                  {/* Status Bar */}
                  <div className="bg-navy-mid px-4 py-3 text-paper-white flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div className="h-8 w-8 rounded-full bg-sand flex items-center justify-center text-navy font-bold text-xs">
                        Ax
                      </div>
                      <div>
                        <p className="text-xs font-semibold leading-tight">Dra. Camila Morales</p>
                        <p className="text-[10px] text-sand flex items-center gap-1">
                          <span className="h-1.5 w-1.5 rounded-full bg-terracotta"></span> C.Ps.P. 45892 · En línea
                        </p>
                      </div>
                    </div>
                    <Phone className="h-4 w-4 text-sand" />
                  </div>

                  {/* Chat Area */}
                  <div className="bg-sand-light p-4 space-y-3 min-h-[300px] text-xs">
                    <div className="max-w-[85%] rounded-[16px] bg-paper-white p-3 border border-frost text-graphite">
                      <p className="font-semibold text-navy text-[11px] mb-0.5">Centro Axioma</p>
                      Hola Joao, tu próxima sesión terapéutica ha sido confirmada para este jueves a las 10:00 AM.
                    </div>

                    <div className="ml-auto max-w-[85%] rounded-[16px] bg-terracotta-wash p-3 text-graphite text-right border border-terracotta/20">
                      <p>Muchas gracias, doctora. Ya completé mi registro de síntomas previo.</p>
                      <span className="text-[9px] text-slate mt-1 block">10:02 AM · ✓✓</span>
                    </div>

                    <div className="rounded-[16px] bg-paper-white p-3 border border-frost">
                      <div className="flex items-center justify-between border-b border-frost pb-2 mb-2">
                        <span className="text-[11px] font-bold text-navy">Paquete Activo</span>
                        <span className="rounded-[9999px] bg-ice px-2 py-0.5 text-[10px] font-bold text-navy">
                          3/4 Restantes
                        </span>
                      </div>
                      <p className="text-[11px] text-graphite">
                        Terapia Cognitivo-Conductual · Sesión 2 de 4
                      </p>
                    </div>

                    <div className="rounded-[16px] bg-ice/70 p-2.5 text-center text-[11px] text-navy font-semibold">
                      🎯 Asistencia predictiva: Riesgo Bajo (7.5%)
                    </div>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* 3. LOGO STRIP / ALIANZAS */}
      <div className="border-b border-frost bg-paper-white py-6">
        <div className="mx-auto max-w-[1280px] px-6 lg:px-12 text-center">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate">
            Estandares de Confidencialidad Médica & Normativa en Salud
          </p>
          <div className="mt-4 flex flex-wrap items-center justify-center gap-8 sm:gap-14 text-sm font-semibold text-graphite">
            <span className="flex items-center gap-2">
              <Award className="h-4 w-4 text-terracotta" /> Colegio de Psicólogos del Perú (C.Ps.P.)
            </span>
            <span className="flex items-center gap-2">
              <Shield className="h-4 w-4 text-navy" /> Ley N° 29733 de Datos Personales
            </span>
            <span className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-navy-light" /> Historias Clínicas Formato SOAP
            </span>
          </div>
        </div>
      </div>

      {/* 4. PASTEL ROOMS FEATURE GRID (Terracotta Wash, Ice, Sand, Heather) */}
      <section id="espacios" className="px-6 py-20 lg:px-12 max-w-[1280px] mx-auto w-full">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center space-x-2 rounded-[9999px] bg-terracotta-wash px-4 py-1 text-xs font-semibold text-navy">
            <span>Espacios Diseñados para Sanar</span>
          </div>
          <h2 className="mt-4 text-3xl sm:text-5xl font-medium tracking-heading text-navy">
            Una clínica digital estructurada en{' '}
            <span className="font-semibold text-terracotta">salas de bienestar</span>.
          </h2>
          <p className="mt-4 text-base text-graphite">
            Cada módulo de nuestra plataforma está pensado con calidez y rigor clínico para eliminar la fricción entre tú y tu terapeuta.
          </p>
        </div>

        {/* Grid de Cards Pastel */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* Card 1: Terracotta Wash */}
          <div className="rounded-[24px] bg-terracotta-wash p-8 sm:p-10 transition-transform duration-200 hover:scale-[1.008]">
            <div className="inline-flex rounded-[9999px] bg-paper-white px-3.5 py-1 text-xs font-bold text-navy mb-6">
              Agendamiento Dinámico
            </div>
            <h3 className="text-2xl sm:text-3xl font-bold tracking-heading text-navy mb-3">
              Cero cruces de horario en tiempo real.
            </h3>
            <p className="text-graphite text-base leading-relaxed mb-6">
              El motor de disponibilidad valida los bloques de 45 a 60 minutos con descanso preventivo entre pacientes, impidiendo cualquier sobreposición de turnos.
            </p>
            <div className="rounded-[16px] bg-paper-white p-5 border border-frost/60">
              <div className="flex items-center justify-between text-xs font-semibold text-navy">
                <span className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-terracotta" /> Bloques de 60 min
                </span>
                <span className="text-slate">Lunes a Sábado</span>
              </div>
            </div>
          </div>

          {/* Card 2: Ice Calm */}
          <div className="rounded-[24px] bg-ice p-8 sm:p-10 transition-transform duration-200 hover:scale-[1.008]">
            <div className="inline-flex rounded-[9999px] bg-paper-white px-3.5 py-1 text-xs font-bold text-navy mb-6">
              Inteligencia Artificial
            </div>
            <h3 className="text-2xl sm:text-3xl font-bold tracking-heading text-navy mb-3">
              Predicción de inasistencias (No-Show).
            </h3>
            <p className="text-graphite text-base leading-relaxed mb-6">
              Algoritmo de regresión logística entrenado que calcula la probabilidad de asistencia del paciente según su historial y horario para activar recordatorios tempranos.
            </p>
            <div className="rounded-[16px] bg-paper-white p-5 border border-frost/60">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-navy flex items-center gap-1.5">
                  <BrainCircuit className="h-4 w-4 text-navy-light" /> Modelo de 6 Factores
                </span>
                <span className="font-semibold text-terracotta font-bold">84.6% Precisión</span>
              </div>
            </div>
          </div>

          {/* Card 3: Warm Sand */}
          <div className="rounded-[24px] bg-sand p-8 sm:p-10 transition-transform duration-200 hover:scale-[1.008]">
            <div className="inline-flex rounded-[9999px] bg-paper-white px-3.5 py-1 text-xs font-bold text-navy mb-6">
              Economía Terapéutica
            </div>
            <h3 className="text-2xl sm:text-3xl font-bold tracking-heading text-navy mb-3">
              Paquetes con deducción atómica.
            </h3>
            <p className="text-graphite text-base leading-relaxed mb-6">
              Adquiere bonos de 4 u 8 sesiones con descuentos significativos. Cada vez que asistes a consulta, el sistema descuenta tu saldo de forma transparente.
            </p>
            <div className="rounded-[16px] bg-paper-white p-5 border border-frost/60">
              <div className="flex items-center justify-between text-xs font-semibold text-charcoal">
                <span>Desde S/. 65 por sesión en paquete</span>
                <span className="text-terracotta font-bold">Ahorro hasta S/. 120</span>
              </div>
            </div>
          </div>

          {/* Card 4: Soft Heather */}
          <div className="rounded-[24px] bg-heather p-8 sm:p-10 transition-transform duration-200 hover:scale-[1.008]">
            <div className="inline-flex rounded-[9999px] bg-paper-white px-3.5 py-1 text-xs font-bold text-navy mb-6">
              Historial Clínico SOAP
            </div>
            <h3 className="text-2xl sm:text-3xl font-bold tracking-heading text-navy mb-3">
              Evolución confidencial del paciente.
            </h3>
            <p className="text-graphite text-base leading-relaxed mb-6">
              Notas clínicas estructuradas por sesión: Subjetivo, Objetivo, Apreciación y Plan. Tu psicólogo cuenta con el expediente completo en cada consulta.
            </p>
            <div className="rounded-[16px] bg-paper-white p-5 border border-frost/60">
              <div className="flex items-center justify-between text-xs font-semibold text-navy">
                <span>Cifrado de grado médico</span>
                <span className="text-slate">Acceso exclusivo profesional</span>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* 5. SECCIÓN DE PAQUETES TERAPÉUTICOS */}
      <section id="paquetes" className="bg-paper-white py-20 px-6 lg:px-12 border-y border-frost">
        <div className="max-w-[1280px] mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <span className="rounded-[9999px] bg-ice px-4 py-1 text-xs font-bold text-navy uppercase tracking-wider">
              Inversión en tu Salud
            </span>
            <h2 className="mt-4 text-3xl sm:text-5xl font-medium tracking-heading text-navy">
              Paquetes terapéuticos accesibles
            </h2>
            <p className="mt-3 text-base text-graphite">
              Elige la modalidad que mejor se adapte a tus objetivos terapéuticos.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* Paquete 1: Sesión Individual */}
            <div className="rounded-[24px] bg-sand/60 p-8 flex flex-col justify-between transition-transform duration-200 hover:scale-[1.01]">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-graphite">
                  Evaluación Inicial
                </span>
                <h3 className="mt-2 text-2xl font-bold text-navy">Sesión Única</h3>
                <p className="mt-2 text-xs text-graphite">
                  Ideal para primera consulta de diagnóstico, orientación puntual o crisis momentánea.
                </p>
                <div className="mt-6 flex items-baseline">
                  <span className="text-4xl font-bold text-navy">S/. 80</span>
                  <span className="ml-2 text-xs text-slate">/ 1 sesión de 50m</span>
                </div>
                <ul className="mt-6 space-y-3 text-xs text-graphite">
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-terracotta" /> Entrevista diagnóstica completa
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-terracotta" /> Elección de horario libre
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-terracotta" /> Apertura de historia clínica
                  </li>
                </ul>
              </div>

              <div className="mt-8 pt-6 border-t border-frost">
                <Link
                  href={usuario ? '/paciente' : '/registro'}
                  className="block text-center rounded-[40px] border border-ink-black bg-paper-white py-3 text-xs font-semibold text-ink-black hover:bg-sand/50 transition"
                >
                  Agendar Sesión
                </Link>
              </div>
            </div>

            {/* Paquete 2: Proceso 4 Sesiones - RECOMENDADO con CTA Terracotta */}
            <div className="rounded-[24px] bg-terracotta-wash p-8 flex flex-col justify-between border-2 border-navy relative transition-transform duration-200 hover:scale-[1.01]">
              <div className="absolute -top-3.5 right-6 rounded-[9999px] bg-terracotta px-3.5 py-1 text-[11px] font-bold text-paper-white uppercase tracking-wider">
                Recomendado
              </div>
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-terracotta font-bold">
                  Tratamiento Focalizado
                </span>
                <h3 className="mt-2 text-2xl font-bold text-navy">Paquete 4 Sesiones</h3>
                <p className="mt-2 text-xs text-graphite">
                  Estructura quincenal o semanal para manejo de ansiedad, depresión leve o metas específicas.
                </p>
                <div className="mt-6 flex items-baseline">
                  <span className="text-4xl font-bold text-navy">S/. 280</span>
                  <span className="ml-2 text-xs text-slate">/ S/. 70 por sesión</span>
                </div>
                <div className="mt-1 text-[11px] font-bold text-terracotta">
                  Ahorras S/. 40 respecto a tarifa individual
                </div>
                <ul className="mt-6 space-y-3 text-xs text-graphite">
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-terracotta" /> Plan de intervención terapéutico
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-terracotta" /> Tareas intercesión guiadas
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-terracotta" /> Control de saldo automático
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-terracotta" /> Reprogramación con 24h previas
                  </li>
                </ul>
              </div>

              <div className="mt-8 pt-6 border-t border-frost">
                <Link
                  href={usuario ? '/paciente' : '/registro'}
                  className="block text-center rounded-[40px] bg-terracotta py-3 text-xs font-semibold text-paper-white hover:bg-terracotta-hover transition"
                >
                  Comenzar Proceso
                </Link>
              </div>
            </div>

            {/* Paquete 3: Proceso 8 Sesiones */}
            <div className="rounded-[24px] bg-ice/60 p-8 flex flex-col justify-between transition-transform duration-200 hover:scale-[1.01]">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-navy">
                  Transformación Profunda
                </span>
                <h3 className="mt-2 text-2xl font-bold text-navy">Paquete 8 Sesiones</h3>
                <p className="mt-2 text-xs text-graphite">
                  Acompañamiento psicoterapéutico integral para cambios conductuales y emocionales de largo plazo.
                </p>
                <div className="mt-6 flex items-baseline">
                  <span className="text-4xl font-bold text-navy">S/. 520</span>
                  <span className="ml-2 text-xs text-slate">/ S/. 65 por sesión</span>
                </div>
                <div className="mt-1 text-[11px] font-bold text-navy">
                  Ahorras S/. 120 (Máximo beneficio)
                </div>
                <ul className="mt-6 space-y-3 text-xs text-graphite">
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-terracotta" /> Evaluación psicométrica incluida
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-terracotta" /> Reporte de evolución clínica
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-terracotta" /> Prioridad en horarios de agenda
                  </li>
                </ul>
              </div>

              <div className="mt-8 pt-6 border-t border-frost">
                <Link
                  href={usuario ? '/paciente' : '/registro'}
                  className="block text-center rounded-[40px] border border-ink-black bg-paper-white py-3 text-xs font-semibold text-ink-black hover:bg-sand/50 transition"
                >
                  Elegir Paquete Integral
                </Link>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* 6. TOOLKIT CLINIC BAND */}
      <section id="innovacion" className="px-6 py-20 lg:px-12 bg-sand-light">
        <div className="max-w-[1280px] mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <span className="rounded-[9999px] bg-paper-white px-4 py-1 text-xs font-bold text-navy uppercase tracking-wider border border-frost">
                Protocolo Profesional
              </span>
              <h2 className="mt-4 text-3xl sm:text-4xl font-bold text-navy tracking-heading">
                Tu viaje de sanación respaldado por un equipo integral.
              </h2>
              <p className="mt-4 text-graphite leading-relaxed text-base">
                No dejamos tu proceso al azar. Cada terapeuta de Axioma sigue un código de ética riguroso, respaldado por herramientas digitales que optimizan cada minuto de tu tiempo de consulta.
              </p>

              <div className="mt-8 space-y-4">
                <div className="flex items-start gap-3 rounded-[16px] bg-paper-white p-4 border border-frost">
                  <div className="h-6 w-6 rounded-full bg-terracotta flex items-center justify-center text-paper-white font-bold text-xs shrink-0 mt-0.5">
                    ✓
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-navy">Confidencialidad Absoluta</h4>
                    <p className="text-xs text-slate mt-0.5">
                      Tus notas de evolución y diagnósticos están protegidos con estrictos permisos por rol.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 rounded-[16px] bg-paper-white p-4 border border-frost">
                  <div className="h-6 w-6 rounded-full bg-navy-mid flex items-center justify-center text-paper-white font-bold text-xs shrink-0 mt-0.5">
                    ✓
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-navy">Transparencia en Sesiones</h4>
                    <p className="text-xs text-slate mt-0.5">
                      Visualiza en tu portal exactamente cuántas sesiones has tomado y cuántas te quedan activas.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 rounded-[16px] bg-paper-white p-4 border border-frost">
                  <div className="h-6 w-6 rounded-full bg-terracotta-dark flex items-center justify-center text-paper-white font-bold text-xs shrink-0 mt-0.5">
                    ✓
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-navy">Flexibilidad de Reprogramación</h4>
                    <p className="text-xs text-slate mt-0.5">
                      Si surge un imprevisto, cambia tu fecha u horario con antelación sin perder tu cupo.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Tarjeta de Resumen Editorial */}
            <div className="rounded-[24px] bg-paper-white p-8 sm:p-10 border border-frost">
              <h3 className="text-xl font-bold text-navy mb-6">
                Comienza hoy en 3 simples pasos
              </h3>
              <div className="space-y-6">
                <div className="flex gap-4">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-navy text-paper-white font-bold text-xs">
                    1
                  </span>
                  <div>
                    <p className="text-sm font-bold text-charcoal">Crea tu cuenta de paciente</p>
                    <p className="text-xs text-slate mt-1">
                      Solo necesitas tus datos básicos para acceder a la agenda en vivo.
                    </p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-terracotta text-paper-white font-bold text-xs">
                    2
                  </span>
                  <div>
                    <p className="text-sm font-bold text-charcoal">Selecciona tu psicólogo y horario</p>
                    <p className="text-xs text-slate mt-1">
                      Elige el día y bloque que mejor se ajuste a tu rutina diaria.
                    </p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-navy-mid text-paper-white font-bold text-xs">
                    3
                  </span>
                  <div>
                    <p className="text-sm font-bold text-charcoal">Inicia tu proceso terapéutico</p>
                    <p className="text-xs text-slate mt-1">
                      Conéctate o asiste a consulta con el respaldo de un profesional de salud mental.
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-8 pt-6 border-t border-frost">
                <Link
                  href={usuario?.rol === 'PACIENTE' ? '/paciente' : '/registro'}
                  className="block text-center rounded-[40px] bg-terracotta py-3.5 text-sm font-semibold text-paper-white hover:bg-terracotta-hover transition"
                >
                  {usuario?.rol === 'PACIENTE' ? 'Entrar a Mi Portal' : 'Registrarme Ahora'}
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 7. FOOTER */}
      <footer className="bg-navy-deep text-paper-white py-12 px-6 lg:px-12 mt-auto">
        <div className="max-w-[1280px] mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center space-x-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-[10px] bg-paper-white/10 text-terracotta">
              <Heart className="h-5 w-5 fill-terracotta" />
            </div>
            <div>
              <p className="text-base font-bold text-paper-white">Centro Psicológico Axioma</p>
              <p className="text-xs text-sand/70">
                Universidad Tecnológica del Perú · Curso Integrador II
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-6 text-xs text-sand/80">
            <Link href="/login" className="hover:text-paper-white transition">Acceso Personal Médico</Link>
            <Link href="/registro" className="hover:text-paper-white transition">Portal Pacientes</Link>
            <span>© 2026 Axioma. Todos los derechos reservados.</span>
          </div>
        </div>
      </footer>

      {/* 8. STICKY BOTTOM NOTIFICATION */}
      {mostrarNotificacion && (
        <div className="fixed bottom-6 right-6 z-40 max-w-[340px] rounded-[16px] bg-navy p-4 text-paper-white border border-paper-white/10 shadow-none animate-fade-in">
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-2">
              <span className="h-2 w-2 rounded-full bg-terracotta animate-ping" />
              <span className="text-xs font-bold text-paper-white">Turnos Disponibles Hoy</span>
            </div>
            <button
              onClick={() => setMostrarNotificacion(false)}
              className="text-ash hover:text-paper-white transition"
              aria-label="Cerrar notificación"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          <p className="mt-2 text-xs text-sand/90">
            Agenda abierta para consultas presenciales y virtuales con la Dra. Camila Morales.
          </p>
          <div className="mt-3 flex items-center justify-between">
            <span className="text-[11px] font-mono text-ash">3 cupos libres</span>
            <Link
              href={usuario ? '/paciente' : '/registro'}
              className="rounded-[40px] bg-terracotta px-3.5 py-1 text-xs font-semibold text-paper-white hover:bg-terracotta-hover transition"
            >
              Agendar Cupo
            </Link>
          </div>
        </div>
      )}

    </div>
  );
}
