import { Controller, Get, Post, Body, Param, UseGuards, ForbiddenException } from '@nestjs/common';
import { PaquetesService } from './paquetes.service';
import { CrearPaqueteDto } from './dto/crear-paquete.dto';
import { AsignarPaqueteDto } from './dto/asignar-paquete.dto';
import { JwtAuthGuard } from '../../comun/jwt-auth.guard';
import { RolesGuard } from '../../comun/roles.guard';
import { Roles } from '../../comun/roles.decorator';
import { UsuarioActual } from '../../comun/usuario-actual.decorator';
import { Rol } from '@prisma/client';

@Controller('paquetes')
export class PaquetesController {
  constructor(private readonly paquetesService: PaquetesService) {}

  // Catálogo público accesible para la web pública y pacientes
  @Get('catalogo')
  async listarCatalogo() {
    return this.paquetesService.listarCatalogo(true);
  }

  // Endpoints administrativos
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Rol.ADMINISTRADOR, Rol.RECEPCIONISTA)
  @Post()
  async crear(@Body() dto: CrearPaqueteDto) {
    return this.paquetesService.crear(dto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Rol.ADMINISTRADOR, Rol.RECEPCIONISTA)
  @Post('asignar')
  async asignarAPaciente(@Body() dto: AsignarPaqueteDto) {
    return this.paquetesService.asignarAPaciente(dto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Rol.ADMINISTRADOR, Rol.RECEPCIONISTA, Rol.PSICOLOGO, Rol.PACIENTE)
  @Get('paciente/:pacienteId')
  async listarPaquetesDePaciente(
    @Param('pacienteId') pacienteId: string,
    @UsuarioActual() user: any,
  ) {
    if (user?.rol === Rol.PACIENTE && user?.paciente?.id && user.paciente.id !== pacienteId) {
      throw new ForbiddenException('No tiene permiso para ver los paquetes de otro paciente');
    }
    return this.paquetesService.listarPaquetesDePaciente(pacienteId);
  }
}
