import { Injectable, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../../prisma/prisma.service';
import { LoginDto } from './dto/login.dto';
import { RegistroPacienteDto } from './dto/registro-paciente.dto';
import { Rol } from '@prisma/client';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  async login(loginDto: LoginDto) {
    const { correo, contrasena } = loginDto;

    const usuario = await this.prisma.usuario.findUnique({
      where: { correo },
      include: {
        psicologo: true,
        paciente: true,
      },
    });

    if (!usuario) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    if (!usuario.estaActivo) {
      throw new UnauthorizedException('Su cuenta se encuentra inactiva');
    }

    const contrasenaValida = await bcrypt.compare(contrasena, usuario.contrasenaHash);
    if (!contrasenaValida) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    const payload = {
      sub: usuario.id,
      correo: usuario.correo,
      rol: usuario.rol,
    };

    const token = this.jwtService.sign(payload);

    return {
      token,
      usuario: {
        id: usuario.id,
        correo: usuario.correo,
        rol: usuario.rol,
        perfil: usuario.psicologo || usuario.paciente || null,
      },
    };
  }

  async registrarPaciente(dto: RegistroPacienteDto) {
    // 1. Verificar si el correo o DNI ya existen
    const existeCorreo = await this.prisma.usuario.findUnique({
      where: { correo: dto.correo },
    });
    if (existeCorreo) {
      throw new BadRequestException('El correo ya se encuentra registrado');
    }

    const existeDni = await this.prisma.paciente.findUnique({
      where: { dni: dto.dni },
    });
    if (existeDni) {
      throw new BadRequestException('Ya existe un paciente registrado con este DNI');
    }

    // 2. Hashear contraseña
    const salt = await bcrypt.genSalt(10);
    const contrasenaHash = await bcrypt.hash(dto.contrasena, salt);

    // 3. Crear usuario y paciente en una sola transacción
    return this.prisma.$transaction(async (tx) => {
      const nuevoUsuario = await tx.usuario.create({
        data: {
          correo: dto.correo,
          contrasenaHash,
          rol: Rol.PACIENTE,
        },
      });

      const nuevoPaciente = await tx.paciente.create({
        data: {
          usuarioId: nuevoUsuario.id,
          dni: dto.dni,
          nombres: dto.nombres,
          apellidos: dto.apellidos,
          telefono: dto.telefono,
          correo: dto.correo,
          fechaNacimiento: dto.fechaNacimiento ? new Date(dto.fechaNacimiento) : null,
          genero: dto.genero,
          direccion: dto.direccion,
        },
      });

      const payload = {
        sub: nuevoUsuario.id,
        correo: nuevoUsuario.correo,
        rol: nuevoUsuario.rol,
      };

      const token = this.jwtService.sign(payload);

      return {
        token,
        usuario: {
          id: nuevoUsuario.id,
          correo: nuevoUsuario.correo,
          rol: nuevoUsuario.rol,
          perfil: nuevoPaciente,
        },
      };
    });
  }
}
