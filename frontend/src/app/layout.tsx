import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Axioma | Centro Psicológico & Bienestar Emocional',
  description: 'Plataforma clínica para gestión psicoterapéutica, agendamiento inteligente y paquetes de salud mental.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body className="min-h-screen bg-sand-light text-ink-black antialiased selection:bg-terracotta-soft selection:text-navy-deep">
        {children}
      </body>
    </html>
  );
}
