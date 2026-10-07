import { Controller, Get } from '@nestjs/common';

@Controller()
export class AppController {
  @Get()
  obtenerEstadoApi() {
    return {
      estado: 'OPERATIVO',
      sistema: 'API REST - Centro Psicológico Axioma',
      version: '1.0.0',
      entorno: process.env.NODE_ENV || 'development',
      tecnologias: {
        backend: 'NestJS',
        orm: 'Prisma ORM',
        base_de_datos: 'PostgreSQL 18 (Local)',
        machine_learning: 'Random Forest No-Show Classifier (Activo)',
      },
      modulos_disponibles: [
        { ruta: '/api/auth', descripcion: 'Autenticación y registro con JWT y roles RBAC' },
        { ruta: '/api/psicologos', descripcion: 'Gestión de terapeutas colegiados y disponibilidad' },
        { ruta: '/api/pacientes', descripcion: 'Directorio de pacientes y búsqueda por DNI' },
        { ruta: '/api/paquetes', descripcion: 'Catálogo y asignación de paquetes terapéuticos' },
        { ruta: '/api/citas', descripcion: 'Agenda en tiempo real con predicción ML y control de solapamiento' },
      ],
      timestamp: new Date().toISOString(),
    };
  }
}
