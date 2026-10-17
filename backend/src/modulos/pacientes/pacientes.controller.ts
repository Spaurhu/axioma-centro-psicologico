import { Controller, Get, Post, Put, Body, Param, Query, UseGuards } from '@nestjs/common';
import { PacientesService } from './pacientes.service';
import { CrearPacienteDto } from './dto/crear-paciente.dto';
import { ActualizarPacienteDto } from './dto/actualizar-paciente.dto';
import { JwtAuthGuard } from '../../comun/jwt-auth.guard';
import { RolesGuard } from '../../comun/roles.guard';
import { Roles } from '../../comun/roles.decorator';
import { Rol } from '@prisma/client';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('pacientes')
export class PacientesController {
  constructor(private readonly pacientesService: PacientesService) {}

  @Roles(Rol.ADMINISTRADOR, Rol.RECEPCIONISTA)
  @Post()
  async crear(@Body() dto: CrearPacienteDto) {
    return this.pacientesService.crear(dto);
  }

  @Roles(Rol.ADMINISTRADOR, Rol.RECEPCIONISTA, Rol.PSICOLOGO)
  @Get()
  async listar(@Query('termino') termino?: string) {
    return this.pacientesService.listar(termino);
  }

  @Roles(Rol.ADMINISTRADOR, Rol.RECEPCIONISTA, Rol.PSICOLOGO)
  @Get('dni/:dni')
  async buscarPorDni(@Param('dni') dni: string) {
    return this.pacientesService.buscarPorDni(dni);
  }

  @Roles(Rol.ADMINISTRADOR, Rol.RECEPCIONISTA, Rol.PSICOLOGO)
  @Get(':id')
  async buscarPorId(@Param('id') id: string) {
    return this.pacientesService.buscarPorId(id);
  }

  @Roles(Rol.ADMINISTRADOR, Rol.RECEPCIONISTA)
  @Put(':id')
  async actualizar(@Param('id') id: string, @Body() dto: ActualizarPacienteDto) {
    return this.pacientesService.actualizar(id, dto);
  }
}
