/**
 * Mini-visualizaciones decorativas de las tarjetas Bento.
 * Cada una ilustra una funcionalidad que el sistema ya implementa;
 * son vistas previas estáticas, no datos en vivo (por eso aria-hidden).
 */

import { Video, Mic, PhoneOff } from 'lucide-react';

/* ── Agendamiento: bloques horarios de 60 min, refrigerio 13:00–14:00 ── */
const bloques: { hora: string; estado: 'libre' | 'ocupado' | 'elegido' | 'pausa' }[] = [
  { hora: '09:00', estado: 'libre' },
  { hora: '10:00', estado: 'elegido' },
  { hora: '11:00', estado: 'ocupado' },
  { hora: '12:00', estado: 'libre' },
  { hora: '13:00', estado: 'pausa' },
  { hora: '14:00', estado: 'libre' },
  { hora: '15:00', estado: 'ocupado' },
  { hora: '16:00', estado: 'libre' },
];

const claseBloque = {
  libre: 'border-axioma-200 bg-axioma-50 text-axiomaText-ink group-hover:border-axioma-300',
  elegido: 'border-axioma-600 bg-axioma-600 text-white shadow-card',
  ocupado: 'border-axioma-100 bg-white text-axiomaText-muted line-through decoration-axioma-300',
  pausa: 'border-dashed border-axioma-200 bg-transparent text-axiomaText-muted',
} as const;

export function VisualAgenda() {
  return (
    <div aria-hidden className="rounded-2xl border border-axioma-100 bg-white/70 p-4">
      <div className="mb-3 flex items-center justify-between text-[11px] font-semibold text-axiomaText-soft">
        <span>Jueves</span>
        <span className="flex items-center gap-3">
          <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-axioma-600" />Tu cita</span>
          <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full border border-axioma-300" />Libre</span>
        </span>
      </div>
      <div className="grid grid-cols-4 gap-2">
        {bloques.map((b) => (
          <span
            key={b.hora}
            className={`rounded-xl border px-2 py-2 text-center text-xs font-semibold tabular-nums transition-colors duration-300 ${claseBloque[b.estado]}`}
          >
            {b.estado === 'pausa' ? 'Pausa' : b.hora}
          </span>
        ))}
      </div>
    </div>
  );
}

/* ── Telemedicina: ventana de videollamada con el formato real del enlace ── */
export function VisualVirtual() {
  return (
    <div aria-hidden className="overflow-hidden rounded-2xl border border-white/80 bg-axioma-950 shadow-lift">
      <div className="flex items-center gap-2 border-b border-white/10 px-4 py-2.5">
        <span className="h-2 w-2 rounded-full bg-white/25" />
        <span className="h-2 w-2 rounded-full bg-white/25" />
        <span className="h-2 w-2 rounded-full bg-white/25" />
        <span className="ml-2 truncate rounded-full bg-white/10 px-3 py-0.5 text-[10px] text-axioma-200">
          meet.google.com/axioma-…
        </span>
      </div>
      <div className="relative grid aspect-[16/10] place-items-center bg-[radial-gradient(circle_at_30%_20%,theme(colors.axioma.800),theme(colors.axioma.950)_70%)]">
        <span className="relative flex h-16 w-16 items-center justify-center rounded-full bg-white/10 text-white ring-8 ring-white/5 transition-transform duration-500 group-hover:scale-110">
          <Video className="h-7 w-7" />
        </span>
        <span className="absolute bottom-3 right-3 h-14 w-20 rounded-lg border border-white/15 bg-heather/20" />
      </div>
      <div className="flex items-center justify-center gap-3 py-3">
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-white"><Mic className="h-4 w-4" /></span>
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-white"><Video className="h-4 w-4" /></span>
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-axioma-600 text-white"><PhoneOff className="h-4 w-4" /></span>
      </div>
    </div>
  );
}

/* ── IA: los tres niveles de riesgo que calcula el modelo ── */
export function VisualIA() {
  const niveles = [
    { nombre: 'Bajo', ancho: 'w-[30%]', activo: true },
    { nombre: 'Medio', ancho: 'w-[55%]', activo: false },
    { nombre: 'Alto', ancho: 'w-[80%]', activo: false },
  ];
  return (
    <div aria-hidden className="space-y-2.5 rounded-2xl border border-white/15 bg-white/10 p-4">
      {niveles.map((n) => (
        <div key={n.nombre} className="flex items-center gap-3 text-[11px] font-semibold">
          <span className={`w-11 ${n.activo ? 'text-white' : 'text-axioma-200'}`}>{n.nombre}</span>
          <span className="h-2 flex-1 overflow-hidden rounded-full bg-white/10">
            <span
              className={`block h-full rounded-full transition-all duration-700 ${n.ancho} ${n.activo ? 'bg-white' : 'bg-white/30'}`}
            />
          </span>
        </div>
      ))}
    </div>
  );
}

/* ── Paquetes: saldo de sesiones que se descuenta al asistir ── */
export function VisualPaquetes() {
  const total = 8;
  const consumidas = 3;
  return (
    <div aria-hidden className="rounded-2xl border border-white bg-white/70 p-4">
      <div className="mb-3 flex items-center justify-between text-[11px] font-semibold">
        <span className="text-axiomaText-soft">Paquete 8 sesiones</span>
        <span className="text-axioma-700">{total - consumidas} restantes</span>
      </div>
      <div className="grid grid-cols-8 gap-1.5">
        {Array.from({ length: total }, (_, i) => (
          <span
            key={i}
            className={`aspect-square rounded-full transition-transform duration-300 group-hover:scale-110 ${i < consumidas ? 'bg-axioma-600' : 'border-2 border-axioma-200 bg-white'}`}
            style={{ transitionDelay: `${i * 30}ms` }}
          />
        ))}
      </div>
    </div>
  );
}

/* ── SOAP: estructura real de la nota clínica ── */
export function VisualSoap() {
  const partes = [
    { letra: 'S', nombre: 'Subjetivo' },
    { letra: 'O', nombre: 'Objetivo' },
    { letra: 'A', nombre: 'Apreciación' },
    { letra: 'P', nombre: 'Plan' },
  ];
  return (
    <div aria-hidden className="grid grid-cols-2 gap-2 sm:grid-cols-4">
      {partes.map((p, i) => (
        <div
          key={p.letra}
          className="rounded-2xl border border-axioma-100 bg-axioma-50/80 p-3 transition-colors duration-300 group-hover:border-axioma-200 group-hover:bg-white"
          style={{ transitionDelay: `${i * 40}ms` }}
        >
          <span className="font-display text-2xl font-medium text-axioma-600">{p.letra}</span>
          <p className="mt-0.5 text-[11px] font-semibold text-axiomaText-soft">{p.nombre}</p>
        </div>
      ))}
    </div>
  );
}
