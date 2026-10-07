'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Heart, ArrowRight, AlertCircle, Shield, CheckCircle2 } from 'lucide-react';
import { apiFetch } from '@/lib/api';

export default function PaginaRegistro() {
  const router = useRouter();
  const [form, setForm] = useState({
    dni: '',
    nombres: '',
    apellidos: '',
    correo: '',
    contrasena: '',
    telefono: '',
    genero: 'No especificado',
  });
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState('');

  const manejarCambio = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const manejarEnvio = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setCargando(true);

    try {
      const data = await apiFetch('/auth/registro-paciente', {
        method: 'POST',
        body: JSON.stringify(form),
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
    <div className="flex min-h-screen items-center justify-center bg-sand-light px-4 py-12 font-sans selection:bg-terracotta-soft selection:text-navy-deep">
      <div className="w-full max-w-lg animate-fade-in">
        
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
            Crea tu Cuenta de Paciente
          </h2>
          <p className="mt-2 text-sm text-graphite">
            Registra tus datos para acceder a citas, paquetes de sesiones y seguimiento clínico
          </p>
        </div>

        {/* Card Formulario */}
        <div className="mt-8 rounded-[24px] bg-paper-white p-8 border border-frost/80 shadow-none">
          {error && (
            <div className="mb-6 flex items-center space-x-2 rounded-[16px] bg-terracotta-wash p-3.5 text-xs text-charcoal border border-terracotta/30">
              <AlertCircle className="h-4 w-4 shrink-0 text-terracotta" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={manejarEnvio} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-graphite">
                  DNI (8 dígitos)
                </label>
                <input
                  type="text"
                  name="dni"
                  required
                  maxLength={8}
                  value={form.dni}
                  onChange={manejarCambio}
                  placeholder="74839201"
                  className="mt-1.5 w-full rounded-[16px] border border-frost bg-cloud/50 px-4 py-2.5 text-xs text-ink-black transition focus:border-navy focus:bg-paper-white focus:outline-none focus:ring-1 focus:ring-navy"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-graphite">
                  Teléfono Móvil
                </label>
                <input
                  type="tel"
                  name="telefono"
                  required
                  value={form.telefono}
                  onChange={manejarCambio}
                  placeholder="987654321"
                  className="mt-1.5 w-full rounded-[16px] border border-frost bg-cloud/50 px-4 py-2.5 text-xs text-ink-black transition focus:border-navy focus:bg-paper-white focus:outline-none focus:ring-1 focus:ring-navy"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-graphite">
                  Nombres
                </label>
                <input
                  type="text"
                  name="nombres"
                  required
                  value={form.nombres}
                  onChange={manejarCambio}
                  placeholder="María Lucía"
                  className="mt-1.5 w-full rounded-[16px] border border-frost bg-cloud/50 px-4 py-2.5 text-xs text-ink-black transition focus:border-navy focus:bg-paper-white focus:outline-none focus:ring-1 focus:ring-navy"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-graphite">
                  Apellidos
                </label>
                <input
                  type="text"
                  name="apellidos"
                  required
                  value={form.apellidos}
                  onChange={manejarCambio}
                  placeholder="Vega Paredes"
                  className="mt-1.5 w-full rounded-[16px] border border-frost bg-cloud/50 px-4 py-2.5 text-xs text-ink-black transition focus:border-navy focus:bg-paper-white focus:outline-none focus:ring-1 focus:ring-navy"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-graphite">
                Correo Electrónico
              </label>
              <input
                type="email"
                name="correo"
                required
                value={form.correo}
                onChange={manejarCambio}
                placeholder="maria.vega@gmail.com"
                className="mt-1.5 w-full rounded-[16px] border border-frost bg-cloud/50 px-4 py-2.5 text-xs text-ink-black transition focus:border-navy focus:bg-paper-white focus:outline-none focus:ring-1 focus:ring-navy"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-graphite">
                  Contraseña
                </label>
                <input
                  type="password"
                  name="contrasena"
                  required
                  minLength={6}
                  value={form.contrasena}
                  onChange={manejarCambio}
                  placeholder="Mínimo 6 caracteres"
                  className="mt-1.5 w-full rounded-[16px] border border-frost bg-cloud/50 px-4 py-2.5 text-xs text-ink-black transition focus:border-navy focus:bg-paper-white focus:outline-none focus:ring-1 focus:ring-navy"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-graphite">
                  Género
                </label>
                <select
                  name="genero"
                  value={form.genero}
                  onChange={manejarCambio}
                  className="mt-1.5 w-full rounded-[16px] border border-frost bg-cloud/50 px-4 py-2.5 text-xs text-ink-black transition focus:border-navy focus:bg-paper-white focus:outline-none focus:ring-1 focus:ring-navy"
                >
                  <option value="Femenino">Femenino</option>
                  <option value="Masculino">Masculino</option>
                  <option value="No binario">No binario</option>
                  <option value="No especificado">Prefiero no especificar</option>
                </select>
              </div>
            </div>

            <div className="rounded-[16px] bg-sand p-3.5 text-[11px] text-navy flex items-start gap-2 border border-frost/60">
              <Shield className="h-4 w-4 shrink-0 text-terracotta mt-0.5" />
              <span>
                Tus datos de salud y consultas están protegidos por el secreto profesional y la Ley N° 29733 de Protección de Datos Personales.
              </span>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={cargando}
                className="flex w-full items-center justify-center space-x-2 rounded-[40px] bg-terracotta py-3.5 text-sm font-semibold text-paper-white transition hover:bg-terracotta-hover disabled:opacity-60"
              >
                <span>{cargando ? 'Creando expediente...' : 'Registrarme y Acceder'}</span>
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </form>
        </div>

        <p className="mt-6 text-center text-xs text-graphite">
          ¿Ya tienes cuenta activa?{' '}
          <Link href="/login" className="font-semibold text-navy hover:underline">
            Inicia sesión aquí
          </Link>
        </p>

      </div>
    </div>
  );
}
