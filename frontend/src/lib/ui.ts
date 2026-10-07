/**
 * Sistema de diseño de Axioma: una sola fuente de verdad para clases repetidas.
 * Tailwind escanea ./src/**, así que las clases escritas aquí sí se generan.
 *
 * Radios:  rounded-button (botones) · rounded-card (bloques) ·
 *          rounded-card-sm (inputs y cards internas) · rounded-tag (pastillas)
 */

export const contenedor = 'mx-auto w-full max-w-[1280px] px-6 lg:px-12';

/* ── Foco visible (accesibilidad por teclado) ─────────────────── */
export const foco =
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-axioma-600 focus-visible:ring-offset-2';
// Para elementos sobre fondo burdeos
export const focoClaro =
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-axioma-900';

/* ── Botones: primary > secondary > onDark > ghost ────────────── */
const btnLayout =
    'inline-flex items-center justify-center gap-2 rounded-button font-semibold transition-colors duration-200';

export const btnPrimary = `${btnLayout} ${foco} bg-axioma-600 text-white shadow-subtle hover:bg-axioma-700 active:bg-axioma-800 disabled:cursor-not-allowed disabled:bg-axioma-200 disabled:text-axioma-400 disabled:shadow-none`;

export const btnSecondary = `${btnLayout} ${foco} border border-axioma-700 bg-transparent text-axioma-700 hover:bg-axioma-700 hover:text-white disabled:cursor-not-allowed disabled:border-axioma-200 disabled:text-axioma-300 disabled:hover:bg-transparent`;

export const btnOnDark = `${btnLayout} ${focoClaro} bg-white text-axioma-900 hover:bg-axioma-100 disabled:cursor-not-allowed disabled:opacity-60`;

export const btnGhost = `${btnLayout} ${foco} text-axiomaText-soft hover:bg-axioma-100 hover:text-axioma-700`;

export const btnIcono = `inline-flex h-10 w-10 items-center justify-center rounded-full border border-axioma-300 bg-white text-axioma-700 transition-colors hover:bg-axioma-100 ${foco}`;

export const tamSm = 'px-4 py-2 text-sm';
export const tamMd = 'px-6 py-3 text-sm';
export const tamLg = 'px-7 py-3.5 text-base';

/* ── Formularios ─────────────────────────────────────────────── */
export const label = 'mb-1.5 block text-sm font-medium text-axiomaText-ink';

// text-base en móvil evita el zoom automático de iOS al enfocar un campo
const inputBase =
    'w-full rounded-card-sm border border-axioma-200 bg-axioma-50/60 py-3 text-base text-axiomaText-ink placeholder:text-axiomaText-muted transition focus:border-axioma-600 focus:bg-white focus:outline-none focus:ring-2 focus:ring-axioma-600/25 sm:text-sm';
export const input = `${inputBase} px-4`;
export const inputIcono = `${inputBase} pl-11 pr-4`;

/* ── Superficies ─────────────────────────────────────────────── */
export const card = 'rounded-card border border-axioma-200/70 bg-white shadow-card';

/* ── Modales ─────────────────────────────────────────────────── */
export const modalOverlay =
    'fixed inset-0 z-50 overflow-y-auto bg-axioma-950/60 backdrop-blur-sm';
export const modalWrap = 'flex min-h-full items-center justify-center p-4';
export const modalCard =
    'w-full animate-fade-in rounded-card border border-axioma-200 bg-white p-6 shadow-panel motion-reduce:animate-none sm:p-8';

/* ── Tablas ──────────────────────────────────────────────────── */
export const thClase = 'px-5 py-3.5 text-xs font-semibold text-axiomaText-soft';
export const tdClase = 'px-5 py-4 align-middle';

/* ── Pastillas de estado (semánticas: éxito / aviso / error / neutro) ── */
export const pastilla = 'inline-flex whitespace-nowrap rounded-tag px-3 py-1 text-xs font-semibold';

export function claseEstadoCita(estado?: string) {
    if (estado === 'ATENDIDA') return 'bg-emerald-100 text-emerald-800';
    if (estado === 'CANCELADA') return 'bg-red-100 text-red-800';
    return 'bg-heather text-axiomaText-ink'; // PROGRAMADA y otros
}

export function claseRiesgo(nivel?: string) {
    if (nivel === 'ALTO') return 'bg-red-100 text-red-800';
    if (nivel === 'MEDIO') return 'bg-amber-100 text-amber-800';
    return 'bg-emerald-100 text-emerald-800'; // BAJO
}

/* ── Formato de fechas (es-PE) ───────────────────────────────── */
export const fechaCorta = (iso: string) =>
    new Date(iso).toLocaleDateString('es-PE', { day: '2-digit', month: 'short', year: 'numeric' });

export const horaCorta = (iso: string) =>
    new Date(iso).toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' });