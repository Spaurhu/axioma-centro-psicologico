import { Controller, Get, Post, Put, Patch, Body, Param, Query, UseGuards } from '@nestjs/common';
import { PsicologosService } from './psicologos.service';
import { CrearPsicologoDto } from './dto/crear-psicologo.dto';
import { ActualizarPsicologoDto } from './dto/actualizar-psicologo.dto';
import { JwtAuthGuard } from '../../comun/jwt-auth.guard';
import { RolesGuard } from '../../comun/roles.guard';
import { Roles } from '../../comun/roles.decorator';
import { Rol } from '@prisma/client';

@Controller('psicologos')
export class PsicologosController {
  constructor(private readonly psicologosService: PsicologosService) {}

  // Público: catálogo de psicólogos para la web
  @Get('publico')
  async listarPublico() {
    return this.psicologosService.listar(true);
  }

  // Protegido: Gestión interna
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Rol.ADMINISTRADOR)
  @Post()
  async crear(@Body() dto: CrearPsicologoDto) {
    return this.psicologosService.crear(dto);
  }

  @UseGuards(JwtAuthGuard)
  @Get()
  async listar(@Query('soloActivos') soloActivos?: string) {
    return this.psicologosService.listar(soloActivos === 'true');
  }

  @Get(':id')
  async buscarPorId(@Param('id') id: string) {
    return this.psicologosService.buscarPorId(id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Rol.ADMINISTRADOR)
  @Put(':id')
  async actualizar(@Param('id') id: string, @Body() dto: ActualizarPsicologoDto) {
    return this.psicologosService.actualizar(id, dto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Rol.ADMINISTRADOR)
  @Patch(':id/estado')
  async cambiarEstado(@Param('id') id: string, @Body('estaActivo') estaActivo: boolean) {
    return this.psicologosService.cambiarEstado(id, estaActivo);
  }
}
