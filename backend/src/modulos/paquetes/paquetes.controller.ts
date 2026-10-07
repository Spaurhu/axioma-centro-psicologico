import { Controller, Get, Post, Body, Param, UseGuards } from '@nestjs/common';
import { PaquetesService } from './paquetes.service';
import { CrearPaqueteDto } from './dto/crear-paquete.dto';
import { AsignarPaqueteDto } from './dto/asignar-paquete.dto';
import { JwtAuthGuard } from '../../comun/jwt-auth.guard';
import { RolesGuard } from '../../comun/roles.guard';
import { Roles } from '../../comun/roles.decorator';
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
  @Roles(Rol.ADMINISTRADOR)
  @Post()
  async crear(@Body() dto: CrearPaqueteDto) {
    return this.paquetesService.crear(dto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Rol.ADMINISTRADOR)
  @Post('asignar')
  async asignarAPaciente(@Body() dto: AsignarPaqueteDto) {
    return this.paquetesService.asignarAPaciente(dto);
  }

  @UseGuards(JwtAuthGuard)
  @Get('paciente/:pacienteId')
  async listarPaquetesDePaciente(@Param('pacienteId') pacienteId: string) {
    return this.paquetesService.listarPaquetesDePaciente(pacienteId);
  }
}
