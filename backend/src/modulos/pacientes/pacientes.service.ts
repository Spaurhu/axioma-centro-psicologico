import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CrearPacienteDto } from './dto/crear-paciente.dto';
import { ActualizarPacienteDto } from './dto/actualizar-paciente.dto';

@Injectable()
export class PacientesService {
  constructor(private readonly prisma: PrismaService) {}

  async crear(dto: CrearPacienteDto) {
    const existeDni = await this.prisma.paciente.findUnique({
      where: { dni: dto.dni },
    });
    if (existeDni) {
      throw new BadRequestException('Ya existe un paciente con este DNI');
    }

    return this.prisma.paciente.create({
      data: {
        dni: dto.dni,
        nombres: dto.nombres,
        apellidos: dto.apellidos,
        telefono: dto.telefono,
        correo: dto.correo,
        fechaNacimiento: dto.fechaNacimiento ? new Date(dto.fechaNacimiento) : null,
        genero: dto.genero,
        direccion: dto.direccion,
        nombreApoderado: dto.nombreApoderado,
        dniApoderado: dto.dniApoderado,
        telefonoApoderado: dto.telefonoApoderado,
      },
    });
  }

  async listar(termino?: string) {
    return this.prisma.paciente.findMany({
      where: termino
        ? {
            OR: [
              { dni: { contains: termino, mode: 'insensitive' } },
              { nombres: { contains: termino, mode: 'insensitive' } },
              { apellidos: { contains: termino, mode: 'insensitive' } },
            ],
          }
        : undefined,
      include: {
        paquetesPaciente: {
          include: { paquete: true },
          where: { estado: 'ACTIVO' },
        },
      },
      orderBy: { apellidos: 'asc' },
    });
  }

  async buscarPorDni(dni: string) {
    const paciente = await this.prisma.paciente.findUnique({
      where: { dni },
      include: {
        paquetesPaciente: {
          include: { paquete: true },
        },
        citas: {
          include: { psicologo: true },
          orderBy: { fechaHoraInicio: 'desc' },
          take: 5,
        },
      },
    });

    if (!paciente) {
      throw new NotFoundException(`No se encontró paciente con DNI: ${dni}`);
    }

    return paciente;
  }

  async buscarPorId(id: string) {
    const paciente = await this.prisma.paciente.findUnique({
      where: { id },
      include: {
        paquetesPaciente: {
          include: { paquete: true },
        },
        citas: {
          include: { psicologo: true },
          orderBy: { fechaHoraInicio: 'desc' },
        },
        evolucionesClinicas: {
          include: { psicologo: true },
          orderBy: { fechaSesion: 'desc' },
        },
      },
    });

    if (!paciente) {
      throw new NotFoundException('Paciente no encontrado');
    }

    return paciente;
  }

  async actualizar(id: string, dto: ActualizarPacienteDto) {
    await this.buscarPorId(id);

    return this.prisma.paciente.update({
      where: { id },
      data: {
        ...dto,
        fechaNacimiento: dto.fechaNacimiento ? new Date(dto.fechaNacimiento) : undefined,
      },
    });
  }
}
