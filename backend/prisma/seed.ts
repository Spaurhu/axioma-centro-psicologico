import { PrismaClient, Rol, DiaSemana, EstadoPaquete } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Actualizando usuarios maestros para Axioma...');

  const passwordAdmin = await bcrypt.hash('admin123', 10);
  const passwordPsico = await bcrypt.hash('psico123', 10);
  const passwordCliente = await bcrypt.hash('cliente123', 10);

  // 1. USUARIO ADMINISTRADOR
  const admin = await prisma.usuario.upsert({
    where: { correo: 'admin@axioma.pe' },
    update: { contrasenaHash: passwordAdmin, estaActivo: true, rol: Rol.ADMINISTRADOR },
    create: {
      correo: 'admin@axioma.pe',
      contrasenaHash: passwordAdmin,
      rol: Rol.ADMINISTRADOR,
    },
  });
  console.log('✓ Usuario Admin listo: admin@axioma.pe / admin123');

  // 2. USUARIO PSICÓLOGO
  const userPsico = await prisma.usuario.upsert({
    where: { correo: 'psicologo@axioma.pe' },
    update: { contrasenaHash: passwordPsico, estaActivo: true, rol: Rol.PSICOLOGO },
    create: {
      correo: 'psicologo@axioma.pe',
      contrasenaHash: passwordPsico,
      rol: Rol.PSICOLOGO,
    },
  });

  const psicologo = await prisma.psicologo.upsert({
    where: { dni: '44556677' },
    update: { usuarioId: userPsico.id, estaActivo: true },
    create: {
      usuarioId: userPsico.id,
      dni: '44556677',
      nombres: 'Diana Elizabeth',
      apellidos: 'Valdez Mendoza',
      telefono: '987654321',
      numeroColegiatura: 'C.Ps.P. 28419',
      especialidad: 'Terapia Cognitivo-Conductual y Ansiedad',
      tarifaPorSesion: 80.0,
      biografia: 'Especialista en trastornos del estado de ánimo, manejo del estrés y terapia para adultos.',
    },
  });
  console.log('✓ Usuario Psicólogo listo: psicologo@axioma.pe / psico123');

  // 3. USUARIO CLIENTE / PACIENTE
  const userCliente = await prisma.usuario.upsert({
    where: { correo: 'cliente@axioma.pe' },
    update: { contrasenaHash: passwordCliente, estaActivo: true, rol: Rol.PACIENTE },
    create: {
      correo: 'cliente@axioma.pe',
      contrasenaHash: passwordCliente,
      rol: Rol.PACIENTE,
    },
  });

  const paciente = await prisma.paciente.upsert({
    where: { dni: '72345678' },
    update: { usuarioId: userCliente.id, estaActivo: true },
    create: {
      usuarioId: userCliente.id,
      dni: '72345678',
      nombres: 'Carlos Alberto',
      apellidos: 'Ramírez Soto',
      telefono: '912345678',
      correo: 'cliente@axioma.pe',
      fechaNacimiento: new Date('1998-05-15'),
      genero: 'Masculino',
      direccion: 'Av. Arequipa 2450, Lince',
    },
  });
  console.log('✓ Usuario Cliente/Paciente listo: cliente@axioma.pe / cliente123');

  // Asegurar que el paciente tenga un paquete activo con 4 sesiones para sus pruebas
  const paqueteEsencial = await prisma.paquete.findFirst({
    where: { cantidadSesiones: 4 },
  });

  if (paqueteEsencial) {
    const paqueteExistente = await prisma.paquetePaciente.findFirst({
      where: { pacienteId: paciente.id, estado: EstadoPaquete.ACTIVO },
    });

    if (!paqueteExistente) {
      await prisma.paquetePaciente.create({
        data: {
          pacienteId: paciente.id,
          paqueteId: paqueteEsencial.id,
          sesionesTotales: 4,
          sesionesConsumidas: 0,
          sesionesRestantes: 4,
          estado: EstadoPaquete.ACTIVO,
          fechaCompra: new Date(),
          fechaExpiracion: new Date(Date.now() + 60 * 24 * 3600 * 1000),
        },
      });
      console.log('✓ Paquete de 4 sesiones asignado a cliente@axioma.pe');
    }
  }

  console.log('✨ Usuarios maestros configurados con éxito.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
