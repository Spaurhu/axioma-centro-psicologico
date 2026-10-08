'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Lock, Mail, AlertCircle, Shield, UserCheck, User, Sparkles } from 'lucide-react';
import { apiFetch } from '@/lib/api';
import { AuthShell } from '@/components/auth-shell';
import { btnPrimary, tamLg, card, label, inputIcono, foco } from '@/lib/ui';

const accesosDemo = [
  { rol: 'Admin', detalle: 'Total', Icono: Shield, correo: 'admin@axioma.pe', clave: 'admin123', fondo: 'bg-heather hover:bg-axioma-200/70' },
  { rol: 'Psicólogo', detalle: 'Clínico', Icono: UserCheck, correo: 'psicologo@axioma.pe', clave: 'psico123', fondo: 'bg-axioma-100 hover:bg-axioma-200/70' },
  { rol: 'Paciente', detalle: 'Portal', Icono: User, correo: 'cliente@axioma.pe', clave: 'cliente123', fondo: 'bg-axioma-50 hover:bg-axioma-100' },
];

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
    <AuthShell
      titulo="Ingreso al sistema"
      descripcion="Accede a tu agenda, historia clínica o citas programadas"
      pie={
        <p>
          ¿Aún no tienes cuenta?{' '}
          <Link href="/registro" className={`rounded font-semibold text-axioma-700 hover:underline ${foco}`}>
            Regístrate como nuevo paciente
          </Link>
        </p>
      }
    >
      <div className={`${card} p-6 sm:p-8`}>
        {error && (
          <div
            role="alert"
            className="mb-5 flex items-start gap-2.5 rounded-card-sm border border-red-200 bg-red-50 p-3.5 text-sm text-red-800"
          >
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form
          onSubmit={(e) => {
            e.preventDefault();
            autenticar();
          }}
          className="space-y-5"
        >
          <div>
            <label htmlFor="correo" className={label}>
              Correo electrónico
            </label>
            <div className="relative">
              <Mail className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-axiomaText-soft" />
              <input
                id="correo"
                type="email"
                required
                autoComplete="email"
                value={correo}
                onChange={(e) => setCorreo(e.target.value)}
                placeholder="ejemplo@axioma.pe"
                className={inputIcono}
              />
            </div>
          </div>

          <div>
            <label htmlFor="contrasena" className={label}>
              Contraseña
            </label>
            <div className="relative">
              <Lock className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-axiomaText-soft" />
              <input
                id="contrasena"
                type="password"
                required
                autoComplete="current-password"
                value={contrasena}
                onChange={(e) => setContrasena(e.target.value)}
                placeholder="••••••••"
                className={inputIcono}
              />
            </div>
          </div>

          <button type="submit" disabled={cargando} className={`${btnPrimary} ${tamLg} w-full`}>
            {cargando ? 'Validando credenciales...' : 'Iniciar sesión'}
          </button>
        </form>

        {/* Accesos demo de 1 clic */}
        <div className="mt-8 border-t border-axioma-100 pt-6">
          <div className="flex items-center justify-center gap-1.5 text-xs font-semibold text-axiomaText-soft">
            <Sparkles className="h-3.5 w-3.5 text-axioma-600" />
            <span>Acceso rápido para pruebas (1 clic)</span>
          </div>

          <div className="mt-4 grid grid-cols-3 gap-2.5">
            {accesosDemo.map(({ rol, detalle, Icono, correo: c, clave, fondo }) => (
              <button
                key={rol}
                type="button"
                disabled={cargando}
                onClick={() => seleccionarDemo(c, clave)}
                className={`flex flex-col items-center justify-center rounded-card-sm border border-axioma-200/70 p-3 text-center transition-colors disabled:cursor-not-allowed disabled:opacity-60 ${fondo} ${foco}`}
              >
                <Icono className="mb-1 h-4 w-4 text-axioma-700" />
                <span className="text-sm font-semibold text-axiomaText-ink">{rol}</span>
                <span className="text-xs text-axiomaText-soft">{detalle}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </AuthShell>
  );
}
