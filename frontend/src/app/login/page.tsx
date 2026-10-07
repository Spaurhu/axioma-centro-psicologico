'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Heart, Lock, Mail, ArrowRight, AlertCircle, Shield, UserCheck, User, Sparkles } from 'lucide-react';
import { apiFetch } from '@/lib/api';

export default function PaginaLogin() {
  const router = useRouter();
  const [correo, setCorreo] = useState('');
  const [contrasena, setContrasena] = useState('');
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState('');

  const autenticar = async (emailParam?: string, passParam?: string) => {
    const c = emailParam || correo;
    const p = passParam || contrasena;
    setError('');
    setCargando(true);

    try {
      const data = await apiFetch('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ correo: c, contrasena: p }),
      });

      localStorage.setItem('axioma_token', data.token);
      localStorage.setItem('axioma_usuario', JSON.stringify(data.usuario));

      // Flujo de navegación profesional:
      // - Si es Paciente: redirige a la página principal (Inicio) donde el Header ahora muestra su Avatar y Dropdown
      // - Si es Staff (Admin / Psicólogo): redirige al Dashboard operativo (/panel)
      if (data.usuario.rol === 'PACIENTE') {
        router.push('/');
      } else {
        router.push('/panel');
      }
    } catch (err: any) {
      setError(err.message || 'Credenciales incorrectas o error en el servidor');
    } finally {
      setCargando(false);
    }
  };

  const seleccionarDemo = (email: string, pass: string) => {
    setCorreo(email);
    setContrasena(pass);
    autenticar(email, pass);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-sand-light px-4 py-12 font-sans selection:bg-terracotta-soft selection:text-navy-deep">
      <div className="w-full max-w-md animate-fade-in">
        
        {/* Cabecera */}
        <div className="text-center">
          <Link href="/" className="inline-flex items-center space-x-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-[16px] bg-navy text-paper-white transition-transform hover:scale-105">
              <Heart className="h-6 w-6 fill-terracotta text-terracotta" />
            </div>
            <div className="text-left">
              <span className="text-2xl font-bold tracking-tight text-navy">
                Axioma
              </span>
              <span className="block text-[11px] font-semibold uppercase tracking-widest text-slate">
                Centro Psicológico
              </span>
            </div>
          </Link>
          <h2 className="mt-6 text-3xl font-medium tracking-heading text-navy">
            Ingreso al Sistema
          </h2>
          <p className="mt-2 text-sm text-graphite">
            Accede a tu agenda, historia clínica o citas programadas
          </p>
        </div>

        {/* Tarjeta del Formulario */}
        <div className="mt-8 rounded-[24px] bg-paper-white p-8 border border-frost/80 shadow-none">
          {error && (
            <div className="mb-5 flex items-center space-x-2 rounded-[16px] bg-terracotta-wash p-3.5 text-xs text-charcoal border border-terracotta/30">
              <AlertCircle className="h-4 w-4 shrink-0 text-terracotta" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={(e) => { e.preventDefault(); autenticar(); }} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-graphite">
                Correo Electrónico
              </label>
              <div className="relative mt-1.5">
                <Mail className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate" />
                <input
                  type="email"
                  required
                  value={correo}
                  onChange={(e) => setCorreo(e.target.value)}
                  placeholder="ejemplo@axioma.pe"
                  className="w-full rounded-[16px] border border-frost bg-cloud/50 py-3 pl-10 pr-4 text-xs text-ink-black transition focus:border-navy focus:bg-paper-white focus:outline-none focus:ring-1 focus:ring-navy"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between">
                <label className="block text-xs font-semibold uppercase tracking-wider text-graphite">
                  Contraseña
                </label>
              </div>
              <div className="relative mt-1.5">
                <Lock className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate" />
                <input
                  type="password"
                  required
                  value={contrasena}
                  onChange={(e) => setContrasena(e.target.value)}
                  placeholder="••••••••"
                  className="w-full rounded-[16px] border border-frost bg-cloud/50 py-3 pl-10 pr-4 text-xs text-ink-black transition focus:border-navy focus:bg-paper-white focus:outline-none focus:ring-1 focus:ring-navy"
                />
              </div>
            </div>

            {/* CTA Terracotta */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={cargando}
                className="flex w-full items-center justify-center space-x-2 rounded-[40px] bg-terracotta py-3.5 text-sm font-semibold text-paper-white transition hover:bg-terracotta-hover disabled:opacity-60"
              >
                <span>{cargando ? 'Validando credenciales...' : 'Iniciar Sesión'}</span>
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </form>

          {/* Botones Demo 1 Clic con salas pastel sin verde */}
          <div className="mt-8 border-t border-frost pt-6">
            <div className="flex items-center justify-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-slate">
              <Sparkles className="h-3.5 w-3.5 text-terracotta" />
              <span>Acceso Rápido para Pruebas (1 Clic)</span>
            </div>
            
            <div className="mt-3.5 grid grid-cols-3 gap-2.5">
              <button
                type="button"
                onClick={() => seleccionarDemo('admin@axioma.pe', 'admin123')}
                className="flex flex-col items-center justify-center rounded-[16px] bg-ice p-3 text-center transition hover:scale-[1.02] border border-frost/50"
              >
                <Shield className="h-4 w-4 text-navy mb-1" />
                <span className="text-xs font-bold text-navy">Admin</span>
                <span className="text-[10px] text-graphite">Total</span>
              </button>

              <button
                type="button"
                onClick={() => seleccionarDemo('psicologo@axioma.pe', 'psico123')}
                className="flex flex-col items-center justify-center rounded-[16px] bg-sand p-3 text-center transition hover:scale-[1.02] border border-frost/50"
              >
                <UserCheck className="h-4 w-4 text-navy mb-1" />
                <span className="text-xs font-bold text-navy">Psicólogo</span>
                <span className="text-[10px] text-graphite">Clínico</span>
              </button>

              <button
                type="button"
                onClick={() => seleccionarDemo('cliente@axioma.pe', 'cliente123')}
                className="flex flex-col items-center justify-center rounded-[16px] bg-terracotta-wash p-3 text-center transition hover:scale-[1.02] border border-frost/50"
              >
                <User className="h-4 w-4 text-terracotta mb-1" />
                <span className="text-xs font-bold text-navy">Paciente</span>
                <span className="text-[10px] text-graphite">Portal</span>
              </button>
            </div>
          </div>
        </div>

        {/* Footer link */}
        <p className="mt-6 text-center text-xs text-graphite">
          ¿Aún no tienes cuenta?{' '}
          <Link href="/registro" className="font-semibold text-navy hover:underline">
            Regístrate como nuevo paciente
          </Link>
        </p>

      </div>
    </div>
  );
}
