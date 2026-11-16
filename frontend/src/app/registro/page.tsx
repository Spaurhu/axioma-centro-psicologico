'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { AlertCircle, Shield, Eye, EyeOff } from 'lucide-react';
import { apiFetch } from '@/lib/api';
import { AuthShell } from '@/components/auth-shell';
import { btnPrimary, tamLg, card, label, input, foco } from '@/lib/ui';

export default function PaginaRegistro() {
  const router = useRouter();
  const [form, setForm] = useState({
    dni: '',
    nombres: '',
    apellidos: '',
    correo: '',
    contrasena: '',
    confirmarContrasena: '',
    telefono: '',
    genero: 'No especificado',
  });
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState('');
  const [mostrarContrasena, setMostrarContrasena] = useState(false);
  const [mostrarConfirmar, setMostrarConfirmar] = useState(false);

  const manejarCambio = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const dniInvalido = form.dni.length > 0 && !/^[0-9]{8}$/.test(form.dni);
  const telefonoInvalido = form.telefono.length > 0 && !/^[0-9]{9}$/.test(form.telefono);
  const contrasenasNoCoinciden =
    form.confirmarContrasena.length > 0 && form.contrasena !== form.confirmarContrasena;

  const manejarEnvio = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!/^[0-9]{8}$/.test(form.dni)) {
      setError('El DNI debe tener 8 dígitos numéricos');
      return;
    }
    if (!/^[0-9]{9}$/.test(form.telefono)) {
      setError('El teléfono debe tener 9 dígitos');
      return;
    }
    if (form.contrasena !== form.confirmarContrasena) {
      setError('Las contraseñas no coinciden');
      return;
    }
    setError('');
    setCargando(true);

    try {
      const { confirmarContrasena, ...datosRegistro } = form;
      const data = await apiFetch('/auth/registro-paciente', {
        method: 'POST',
        body: JSON.stringify(datosRegistro),
      });

      localStorage.setItem('axioma_token', data.token);
      localStorage.setItem('axioma_usuario', JSON.stringify(data.usuario));
      router.push('/');
    } catch (err: any) {
      setError(err.message || 'Error al completar el registro');
    } finally {
      setCargando(false);
    }
  };

  return (
    <AuthShell
      ancho="lg"
      titulo="Crea tu cuenta de paciente"
      descripcion="Registra tus datos para acceder a citas, paquetes de sesiones y seguimiento clínico"
      pie={
        <p>
          ¿Ya tienes cuenta activa?{' '}
          <Link href="/login" className={`rounded font-semibold text-axioma-700 hover:underline ${foco}`}>
            Inicia sesión aquí
          </Link>
        </p>
      }
    >
      <div className={`${card} p-6 sm:p-8`}>
        {error && (
          <div
            role="alert"
            className="mb-6 flex items-start gap-2.5 rounded-card-sm border border-red-200 bg-red-50 p-3.5 text-sm text-red-800"
          >
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={manejarEnvio} className="space-y-5">
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <div>
              <label htmlFor="dni" className={label}>
                DNI (8 dígitos)
              </label>
              <input
                id="dni"
                type="text"
                name="dni"
                required
                maxLength={8}
                pattern="[0-9]{8}"
                inputMode="numeric"
                autoComplete="off"
                value={form.dni}
                onChange={manejarCambio}
                placeholder="74839201"
                className={input}
              />
              {dniInvalido && (
                <p className="mt-1 text-xs font-medium text-red-600">El DNI debe tener 8 dígitos numéricos</p>
              )}
            </div>
            <div>
              <label htmlFor="telefono" className={label}>
                Teléfono móvil
              </label>
              <input
                id="telefono"
                type="tel"
                name="telefono"
                required
                maxLength={9}
                pattern="[0-9]{9}"
                inputMode="numeric"
                autoComplete="tel"
                value={form.telefono}
                onChange={manejarCambio}
                placeholder="987654321"
                className={input}
              />
              {telefonoInvalido && (
                <p className="mt-1 text-xs font-medium text-red-600">El teléfono debe tener 9 dígitos</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <div>
              <label htmlFor="nombres" className={label}>
                Nombres
              </label>
              <input
                id="nombres"
                type="text"
                name="nombres"
                required
                autoComplete="given-name"
                value={form.nombres}
                onChange={manejarCambio}
                placeholder="María Lucía"
                className={input}
              />
            </div>
            <div>
              <label htmlFor="apellidos" className={label}>
                Apellidos
              </label>
              <input
                id="apellidos"
                type="text"
                name="apellidos"
                required
                autoComplete="family-name"
                value={form.apellidos}
                onChange={manejarCambio}
                placeholder="Vega Paredes"
                className={input}
              />
            </div>
          </div>

          <div>
            <label htmlFor="correo" className={label}>
              Correo electrónico
            </label>
            <input
              id="correo"
              type="email"
              name="correo"
              required
              autoComplete="email"
              value={form.correo}
              onChange={manejarCambio}
              placeholder="maria.vega@gmail.com"
              className={input}
            />
          </div>

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <div>
              <label htmlFor="contrasena" className={label}>
                Contraseña
              </label>
              <div className="relative">
                <input
                  id="contrasena"
                  type={mostrarContrasena ? 'text' : 'password'}
                  name="contrasena"
                  required
                  minLength={6}
                  autoComplete="new-password"
                  value={form.contrasena}
                  onChange={manejarCambio}
                  placeholder="Mínimo 6 caracteres"
                  className={`${input} pr-10`}
                />
                <button
                  type="button"
                  onClick={() => setMostrarContrasena((v) => !v)}
                  aria-label="Mostrar u ocultar contraseña"
                  className="absolute inset-y-0 right-0 flex items-center pr-3 text-axiomaText-soft hover:text-axiomaText-ink"
                >
                  {mostrarContrasena ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            <div>
              <label htmlFor="confirmarContrasena" className={label}>
                Confirmar Contraseña
              </label>
              <div className="relative">
                <input
                  id="confirmarContrasena"
                  type={mostrarConfirmar ? 'text' : 'password'}
                  name="confirmarContrasena"
                  required
                  minLength={6}
                  autoComplete="new-password"
                  value={form.confirmarContrasena}
                  onChange={manejarCambio}
                  placeholder="Repite tu contraseña"
                  className={`${input} pr-10 ${contrasenasNoCoinciden ? 'border-red-400 focus:border-red-500' : ''}`}
                />
                <button
                  type="button"
                  onClick={() => setMostrarConfirmar((v) => !v)}
                  aria-label="Mostrar u ocultar confirmación de contraseña"
                  className="absolute inset-y-0 right-0 flex items-center pr-3 text-axiomaText-soft hover:text-axiomaText-ink"
                >
                  {mostrarConfirmar ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {contrasenasNoCoinciden && (
                <p className="mt-1 text-xs font-medium text-red-600">Las contraseñas no coinciden</p>
              )}
            </div>
          </div>

          <div>
            <label htmlFor="genero" className={label}>
              Género
            </label>
            <select
              id="genero"
              name="genero"
              value={form.genero}
              onChange={manejarCambio}
              className={input}
            >
              <option value="Femenino">Femenino</option>
              <option value="Masculino">Masculino</option>
              <option value="No binario">No binario</option>
              <option value="No especificado">Prefiero no especificar</option>
            </select>
          </div>

          <div className="flex items-start gap-2.5 rounded-card-sm border border-axioma-200 bg-axioma-100 p-4 text-xs leading-relaxed text-axioma-900">
            <Shield className="mt-0.5 h-4 w-4 shrink-0 text-axioma-700" />
            <span>
              Tus datos de salud y consultas están protegidos por el secreto profesional y la Ley N° 29733 de Protección de Datos Personales.
            </span>
          </div>

          <button type="submit" disabled={cargando} className={`${btnPrimary} ${tamLg} w-full`}>
            {cargando ? 'Creando expediente...' : 'Registrarme y acceder'}
          </button>
        </form>
      </div>
    </AuthShell>
  );
}
