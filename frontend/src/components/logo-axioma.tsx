import Image from 'next/image';
import Link from 'next/link';
import { foco, focoClaro } from '@/lib/ui';

interface LogoAxiomaProps {
    subtitulo?: string;
    /** true cuando va sobre fondo burdeos */
    oscuro?: boolean;
}

export function LogoAxioma({ subtitulo = 'Centro Psicológico', oscuro = false }: LogoAxiomaProps) {
    return (
        <Link
            href="/"
            className={`group flex items-center gap-3 rounded-card-sm ${oscuro ? focoClaro : foco}`}
        >
            <span className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-white transition-transform group-hover:scale-105">
                <Image
                    src="/icono-axioma.jpg"
                    alt="Cerebro Axioma"
                    width={44}
                    height={44}
                    className="object-contain"
                />
            </span>
            <span className={`border-l-[1.5px] pl-3 ${oscuro ? 'border-white/30' : 'border-axiomaText-muted/30'}`}>
                <span
                    className={`block text-2xl font-extrabold lowercase leading-none tracking-tight ${oscuro ? 'text-white' : 'text-axioma-600'
                        }`}
                >
                    axioma
                </span>
                <span
                    className={`mt-1 block text-[11px] font-bold uppercase leading-tight tracking-wider ${oscuro ? 'text-axioma-200' : 'text-axiomaText'
                        }`}
                >
                    {subtitulo}
                </span>
            </span>
        </Link>
    );
}
