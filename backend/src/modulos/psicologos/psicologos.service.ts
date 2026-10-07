import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CrearPsicologoDto } from './dto/crear-psicologo.dto';
import { ActualizarPsicologoDto } from './dto/actualizar-psicologo.dto';
import * as bcrypt from 'bcrypt';
import { Rol } from '@prisma/client';

@Injectable()
export class PsicologosService {
  constructor(private readonly prisma: PrismaService) {}

  async crear(dto: CrearPsicologoDto) {
    const existeCorreo = await this.prisma.usuario.findUnique({
      where: { correo: dto.correo },
    });
    if (existeCorreo) {
      throw new BadRequestException('El correo ya está registrado en el sistema');
    }

    const existeDni = await this.prisma.psicologo.findUnique({
      where: { dni: dto.dni },
    });
    if (existeDni) {
      throw new BadRequestException('Ya existe un psicólogo registrado con este DNI');
    }

    const salt = await bcrypt.genSalt(10);
    const contrasenaHash = await bcrypt.hash(dto.contrasena, salt);

    return this.prisma.$transaction(async (tx) => {
      const nuevoUsuario = await tx.usuario.create({
        data: {
          correo: dto.correo,
          contrasenaHash,
          rol: Rol.PSICOLOGO,
        },
      });

      return tx.psicologo.create({
        data: {
          usuarioId: nuevoUsuario.id,
          dni: dto.dni,
          nombres: dto.nombres,
          apellidos: dto.apellidos,
          telefono: dto.telefono,
          numeroColegiatura: dto.numeroColegiatura,
          especialidad: dto.especialidad,
          tarifaPorSesion: dto.tarifaPorSesion,
          biografia: dto.biografia,
          fotoUrl: dto.fotoUrl,
        },
        include: {
          usuario: {
            select: { id: true, correo: true, rol: true, estaActivo: true },
          },
        },
      });
    });
  }

  async listar(soloActivos = false) {
    return this.prisma.psicologo.findMany({
      where: soloActivos ? { estaActivo: true } : undefined,
      include: {
        usuario: {
          select: { id: true, correo: true, rol: true, estaActivo: true },
        },
        disponibilidades: true,
      },
      orderBy: { apellidos: 'asc' },
    });
  }

  async buscarPorId(id: string) {
    const psicologo = await this.prisma.psicologo.findUnique({
      where: { id },
      include: {
        usuario: {
          select: { id: true, correo: true, rol: true, estaActivo: true },
        },
        disponibilidades: true,
      },
    });

    if (!psicologo) {
      throw new NotFoundException('Psicólogo no encontrado');
    }

    return psicologo;
  }

  async actualizar(id: string, dto: ActualizarPsicologoDto) {
    await this.buscarPorId(id);

    return this.prisma.psicologo.update({
      where: { id },
      data: {
        ...dto,
      },
      include: {
        usuario: {
          select: { id: true, correo: true, rol: true, estaActivo: true },
        },
      },
    });
  }

  async cambiarEstado(id: string, estaActivo: boolean) {
    const psicologo = await this.buscarPorId(id);

    return this.prisma.$transaction(async (tx) => {
      await tx.usuario.update({
        where: { id: psicologo.usuarioId },
        data: { estaActivo },
      });

      return tx.psicologo.update({
        where: { id },
        data: { estaActivo },
      });
    });
  }
}
