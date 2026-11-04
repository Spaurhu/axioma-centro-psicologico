'use client';

/**
 * Primitivos de animación de la landing (Motion para React).
 *
 * - Todas las entradas usan `whileInView` + `viewport.once` → se animan una
 *   sola vez y no vuelven a dispararse al hacer scroll hacia arriba.
 * - La página envuelve todo en <MotionConfig reducedMotion="user">, así que si
 *   el sistema tiene "reducir movimiento" activo se eliminan los desplazamientos
 *   y solo queda el fundido de opacidad.
 * - Los bucles infinitos (elementos flotantes) se desactivan por completo con
 *   `useReducedMotion`.
 */

import type { ReactNode } from 'react';
import { motion, useReducedMotion, type Variants } from 'motion/react';

/** Curva "ease-out-quint": arranque decidido y aterrizaje suave */
export const EASE_SUAVE: [number, number, number, number] = [0.22, 1, 0.36, 1];

const VIEWPORT = { once: true, amount: 0.2 } as const;

/** Variantes compartidas: fundido + desplazamiento vertical corto */
export const variantesAparicion: Variants = {
  oculto: { opacity: 0, y: 22 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.7, ease: EASE_SUAVE } },
};

/** Contenedor que escalona la entrada de sus hijos */
export const variantesContenedor = (escalon = 0.09, retraso = 0): Variants => ({
  oculto: {},
  visible: { transition: { staggerChildren: escalon, delayChildren: retraso } },
});

interface AparecerProps {
  children: ReactNode;
  className?: string;
  retraso?: number;
  /** Distancia vertical inicial en px */
  y?: number;
}

/** Bloque individual que aparece al entrar en el viewport */
export function Aparecer({ children, className, retraso = 0, y = 22 }: AparecerProps) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={VIEWPORT}
      transition={{ duration: 0.7, ease: EASE_SUAVE, delay: retraso }}
    >
      {children}
    </motion.div>
  );
}

interface EscalonadoProps {
  children: ReactNode;
  className?: string;
  escalon?: number;
  retraso?: number;
}

/** Grupo cuyos hijos <ItemEscalonado> aparecen uno tras otro */
export function Escalonado({ children, className, escalon = 0.09, retraso = 0 }: EscalonadoProps) {
  return (
    <motion.div
      className={className}
      initial="oculto"
      whileInView="visible"
      viewport={VIEWPORT}
      variants={variantesContenedor(escalon, retraso)}
    >
      {children}
    </motion.div>
  );
}

export function ItemEscalonado({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <motion.div className={className} variants={variantesAparicion}>
      {children}
    </motion.div>
  );
}

interface FlotanteProps {
  children: ReactNode;
  className?: string;
  /** Recorrido vertical en px */
  amplitud?: number;
  duracion?: number;
  retraso?: number;
}

/** Oscilación vertical muy lenta para tarjetas decorativas del hero */
export function Flotante({ children, className, amplitud = 8, duracion = 7, retraso = 0 }: FlotanteProps) {
  const reducir = useReducedMotion();
  return (
    <motion.div
      className={className}
      animate={reducir ? undefined : { y: [0, -amplitud, 0] }}
      transition={{ duration: duracion, repeat: Infinity, ease: 'easeInOut', delay: retraso }}
    >
      {children}
    </motion.div>
  );
}
