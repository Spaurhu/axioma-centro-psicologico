'use client';

import Image from 'next/image';
import { motion } from 'motion/react';
import { CalendarCheck, Video, BrainCircuit } from 'lucide-react';
import { EASE_SUAVE, Flotante } from './animaciones';

/**
 * Composición visual del hero:
 * fotografía en marco de arco + bloque burdeos desplazado detrás +
 * tarjetas flotantes con vistas reales del sistema (cita, paquete, Meet).
 *
 * Las tarjetas reutilizan el contenido de ejemplo que ya mostraba el mockup
 * anterior; son una vista previa de la interfaz, no datos en vivo.
 */

/** Aparición de cada tarjeta flotante, escalonada tras la foto */
function entrada(retraso: number) {
  return {
    initial: { opacity: 0, y: 16, scale: 0.96 },
    animate: { opacity: 1, y: 0, scale: 1 },
    transition: { duration: 0.7, ease: EASE_SUAVE, delay: retraso },
  };
}

const tarjeta =
  'rounded-2xl border border-white/70 bg-white/90 shadow-lift backdrop-blur-md';

export function HeroVisual() {
  return (
    <div className="relative mx-auto w-full max-w-[460px] lg:max-w-none">
      {/* Bloque de color desplazado: da profundidad y ancla la foto a la marca */}
      <motion.div
        aria-hidden
        initial={{ opacity: 0, x: 24, y: 24 }}
        animate={{ opacity: 1, x: 0, y: 0 }}
        transition={{ duration: 1, ease: EASE_SUAVE, delay: 0.15 }}
        className="absolute -bottom-4 -right-4 left-4 top-4 rounded-b-[32px] rounded-t-[999px] bg-gradient-to-br from-axioma-600 to-axioma-900 sm:-bottom-6 sm:-right-6 sm:left-6 sm:top-6"
      />

      {/* Trama de puntos decorativa */}
      <div
        aria-hidden
        className="absolute -left-6 top-10 h-28 w-28 opacity-60 [background-image:radial-gradient(theme(colors.axioma.300)_1.5px,transparent_1.5px)] [background-size:14px_14px] sm:-left-10"
      />

      {/* Fotografía en arco */}
      <motion.div
        initial={{ opacity: 0, y: 28 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.9, ease: EASE_SUAVE, delay: 0.1 }}
        className="relative aspect-[4/5] overflow-hidden rounded-b-[32px] rounded-t-[999px] border-[6px] border-white bg-axioma-100 shadow-panel"
      >
        <motion.div
          className="absolute inset-0"
          initial={{ scale: 1.08 }}
          animate={{ scale: 1 }}
          transition={{ duration: 1.6, ease: EASE_SUAVE, delay: 0.1 }}
        >
          <Image
            src="/landing/consulta-psicologica.jpg"
            alt="Psicóloga conversando con una paciente en un consultorio luminoso"
            fill
            priority
            sizes="(min-width: 1024px) 460px, (min-width: 640px) 460px, 90vw"
            className="object-cover object-[36%_center]"
          />
        </motion.div>
        {/* Velo cálido inferior para integrar la foto con la paleta */}
        <div
          aria-hidden
          className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-axioma-950/45 via-axioma-900/10 to-transparent"
        />
      </motion.div>

      {/* Tarjeta: cita confirmada (arriba a la izquierda) */}
      <motion.div {...entrada(0.65)} className="absolute -left-3 top-[18%] w-[210px] sm:-left-12 sm:w-[230px]">
        <Flotante amplitud={7} duracion={7}>
          <div className={`${tarjeta} p-3.5`}>
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-axioma-600 text-white">
                <CalendarCheck className="h-5 w-5" />
              </span>
              <div className="min-w-0">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-axioma-600">Cita confirmada</p>
                <p className="truncate text-sm font-bold text-axiomaText-ink">Jueves · 10:00 AM</p>
              </div>
            </div>
            <div className="mt-3 flex items-center gap-2 border-t border-axioma-100 pt-2.5 text-[11px] text-axiomaText-soft">
              <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-500" />
              <span className="truncate">Dra. Camila Morales · C.Ps.P.</span>
            </div>
          </div>
        </Flotante>
      </motion.div>

      {/* Pastilla: sesión virtual (derecha) */}
      <motion.div {...entrada(0.85)} className="absolute -right-2 top-[46%] hidden sm:block sm:-right-8">
        <Flotante amplitud={6} duracion={8} retraso={1}>
          <div className={`${tarjeta} flex items-center gap-2.5 py-2.5 pl-2.5 pr-4`}>
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-heather text-axioma-700">
              <Video className="h-4 w-4" />
            </span>
            <div>
              <p className="text-xs font-bold text-axiomaText-ink">Sesión virtual</p>
              <p className="text-[11px] text-axiomaText-soft">Enlace de Meet en tu correo</p>
            </div>
          </div>
        </Flotante>
      </motion.div>

      {/* Tarjeta: paquete activo (abajo) */}
      <motion.div {...entrada(1.05)} className="absolute -bottom-6 left-4 w-[230px] sm:-bottom-8 sm:left-auto sm:right-10 sm:w-[250px]">
        <Flotante amplitud={8} duracion={9} retraso={0.5}>
          <div className={`${tarjeta} p-4`}>
            <div className="flex items-center justify-between">
              <p className="text-xs font-bold text-axiomaText-ink">Paquete activo</p>
              <span className="rounded-tag bg-axioma-100 px-2 py-0.5 text-[10px] font-bold text-axioma-700">
                Sesión 2 de 4
              </span>
            </div>
            <div className="mt-3 grid grid-cols-4 gap-1.5" aria-hidden>
              {[0, 1, 2, 3].map((i) => (
                <span key={i} className={`h-1.5 rounded-full ${i < 2 ? 'bg-axioma-600' : 'bg-axioma-100'}`} />
              ))}
            </div>
            <div className="mt-3 flex items-center gap-1.5 text-[11px] text-axiomaText-soft">
              <BrainCircuit className="h-3.5 w-3.5 text-axioma-500" />
              <span>Riesgo de inasistencia: bajo</span>
            </div>
          </div>
        </Flotante>
      </motion.div>
    </div>
  );
}