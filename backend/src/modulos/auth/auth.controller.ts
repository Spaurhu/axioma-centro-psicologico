import { Controller, Post, Body, Get, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegistroPacienteDto } from './dto/registro-paciente.dto';
import { JwtAuthGuard } from '../../comun/jwt-auth.guard';
import { UsuarioActual } from '../../comun/usuario-actual.decorator';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  async login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  @Post('registro-paciente')
  async registrarPaciente(@Body() dto: RegistroPacienteDto) {
    return this.authService.registrarPaciente(dto);
  }

  @UseGuards(JwtAuthGuard)
  @Get('perfil')
  async obtenerPerfil(@UsuarioActual() usuario: any) {
    return {
      id: usuario.id,
      correo: usuario.correo,
      rol: usuario.rol,
      perfil: usuario.psicologo || usuario.paciente || null,
    };
  }
}
