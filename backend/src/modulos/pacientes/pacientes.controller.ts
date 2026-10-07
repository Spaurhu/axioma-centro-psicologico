import { Controller, Get, Post, Put, Body, Param, Query, UseGuards } from '@nestjs/common';
import { PacientesService } from './pacientes.service';
import { CrearPacienteDto } from './dto/crear-paciente.dto';
import { ActualizarPacienteDto } from './dto/actualizar-paciente.dto';
import { JwtAuthGuard } from '../../comun/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('pacientes')
export class PacientesController {
  constructor(private readonly pacientesService: PacientesService) {}

  @Post()
  async crear(@Body() dto: CrearPacienteDto) {
    return this.pacientesService.crear(dto);
  }

  @Get()
  async listar(@Query('termino') termino?: string) {
    return this.pacientesService.listar(termino);
  }

  @Get('dni/:dni')
  async buscarPorDni(@Param('dni') dni: string) {
    return this.pacientesService.buscarPorDni(dni);
  }

  @Get(':id')
  async buscarPorId(@Param('id') id: string) {
    return this.pacientesService.buscarPorId(id);
  }

  @Put(':id')
  async actualizar(@Param('id') id: string, @Body() dto: ActualizarPacienteDto) {
    return this.pacientesService.actualizar(id, dto);
  }
}
