import type { ReactNode } from 'react';
import { Calendar, BookmarkCheck, Shield } from 'lucide-react';
import { LogoAxioma } from '@/components/logo-axioma';

interface AuthShellProps {
    titulo: string;
    descripcion: string;
    children: ReactNode;
    pie?: ReactNode;
    /** ancho del formulario: 'md' (login) o 'lg' (registro, más campos) */
    ancho?: 'md' | 'lg';
}

const puntos = [
    { Icono: Calendar, texto: 'Agenda en tiempo real, sin cruces de horario' },
    { Icono: BookmarkCheck, texto: 'Paquetes de sesiones con control de saldo automático' },
    { Icono: Shield, texto: 'Historia clínica confidencial en formato SOAP' },
];

export function AuthShell({ titulo, descripcion, children, pie, ancho = 'md' }: AuthShellProps) {
    return (
        <div className="grid min-h-screen bg-axioma-50 font-sans text-axiomaText-ink antialiased selection:bg-axioma-200 lg:grid-cols-[5fr_6fr]">
            {/* Panel de marca (solo desktop) */}
            <aside className="hidden flex-col justify-between bg-axioma-900 p-12 text-white lg:flex xl:p-14">
                <LogoAxioma oscuro />

                <div className="max-w-md">
                    <h2 className="font-display text-4xl font-medium leading-[1.1] tracking-display">
                        Psicoterapia cálida y precisa, en una plataforma segura.
                    </h2>
                    <ul className="mt-10 space-y-4">
                        {puntos.map(({ Icono, texto }) => (
                            <li key={texto} className="flex items-center gap-3.5 text-sm font-medium text-axioma-100">
                                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/10 text-axioma-300">
                                    <Icono className="h-5 w-5" />
                                </span>
                                {texto}
                            </li>
                        ))}
                    </ul>
                </div>

                <p className="max-w-sm text-xs leading-relaxed text-axioma-200">
                    Tus datos de salud están protegidos por el secreto profesional y la Ley N° 29733 de Protección de Datos Personales.
                </p>
            </aside>

            {/* Formulario */}
            <main className="flex items-center justify-center px-4 py-10 sm:px-8">
                <div className={`w-full animate-fade-in motion-reduce:animate-none ${ancho === 'lg' ? 'max-w-lg' : 'max-w-md'}`}>
                    <div className="mb-8 flex justify-center lg:hidden">
                        <LogoAxioma />
                    </div>

                    <h1 className="font-display text-3xl font-medium tracking-heading text-axiomaText-ink sm:text-4xl">
                        {titulo}
                    </h1>
                    <p className="mb-7 mt-2 text-sm leading-relaxed text-axiomaText-soft">{descripcion}</p>

                    {children}

                    {pie && <div className="mt-6 text-center text-sm text-axiomaText-soft">{pie}</div>}
                </div>
            </main>
        </div>
    );
}
