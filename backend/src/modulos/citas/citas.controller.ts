import { Controller, Get, Post, Put, Patch, Body, Param, Query, UseGuards, ForbiddenException } from '@nestjs/common';
import { CitasService } from './citas.service';
import { CrearCitaDto } from './dto/crear-cita.dto';
import { ReprogramarCitaDto } from './dto/reprogramar-cita.dto';
import { JwtAuthGuard } from '../../comun/jwt-auth.guard';
import { RolesGuard } from '../../comun/roles.guard';
import { Roles } from '../../comun/roles.decorator';
import { UsuarioActual } from '../../comun/usuario-actual.decorator';
import { Rol } from '@prisma/client';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('citas')
export class CitasController {
  constructor(private readonly citasService: CitasService) {}

  @Roles(Rol.ADMINISTRADOR, Rol.RECEPCIONISTA, Rol.PACIENTE)
  @Post()
  async crear(@Body() dto: CrearCitaDto) {
    return this.citasService.crear(dto);
  }

  @Roles(Rol.ADMINISTRADOR, Rol.RECEPCIONISTA, Rol.PSICOLOGO, Rol.PACIENTE)
  @Get()
  async listar(
    @Query('fecha') fecha?: string,
    @Query('psicologoId') psicologoId?: string,
    @UsuarioActual() user?: any,
  ) {
    return this.citasService.listarPorFecha(fecha, psicologoId, user);
  }

  @Roles(Rol.ADMINISTRADOR, Rol.RECEPCIONISTA, Rol.PSICOLOGO, Rol.PACIENTE)
  @Get(':id')
  async obtenerPorId(@Param('id') id: string, @UsuarioActual() user?: any) {
    return this.citasService.obtenerPorId(id, user);
  }

  @Roles(Rol.ADMINISTRADOR, Rol.RECEPCIONISTA, Rol.PACIENTE)
  @Put(':id/reprogramar')
  async reprogramar(@Param('id') id: string, @Body() dto: ReprogramarCitaDto) {
    return this.citasService.reprogramar(id, dto);
  }

  @Roles(Rol.ADMINISTRADOR, Rol.RECEPCIONISTA, Rol.PSICOLOGO, Rol.PACIENTE)
  @Patch(':id/cancelar')
  async cancelar(
    @Param('id') id: string,
    @Body('motivo') motivo: string,
    @UsuarioActual() user: any,
  ) {
    return this.citasService.cancelar(id, motivo, user?.id);
  }

  @Roles(Rol.PSICOLOGO, Rol.ADMINISTRADOR, Rol.RECEPCIONISTA)
  @Patch(':id/asistencia')
  async marcarAsistencia(@Param('id') id: string, @UsuarioActual() user: any) {
    return this.citasService.marcarAsistencia(id, user?.id);
  }

  @Roles(Rol.PSICOLOGO, Rol.ADMINISTRADOR, Rol.RECEPCIONISTA)
  @Patch(':id/no-asistio')
  async marcarNoAsistio(@Param('id') id: string, @UsuarioActual() user: any) {
    return this.citasService.marcarNoAsistio(id, user?.id);
  }

  @Roles(Rol.ADMINISTRADOR)
  @Post(':id/revertir')
  async revertirCita(@Param('id') id: string, @UsuarioActual() user: any) {
    if (user?.rol !== 'ADMINISTRADOR') {
      throw new ForbiddenException('Solo el administrador puede revertir citas');
    }
    return this.citasService.revertirCita(id, user?.id);
  }

  @Roles(Rol.PSICOLOGO, Rol.ADMINISTRADOR)
  @Get(':id/evolucion')
  async obtenerEvolucion(@Param('id') id: string, @UsuarioActual() user?: any) {
    return this.citasService.obtenerEvolucion(id, user);
  }

  @Roles(Rol.PSICOLOGO)
  @Post(':id/evolucion')
  async guardarEvolucion(@Param('id') id: string, @Body() dto: any, @UsuarioActual() user?: any) {
    return this.citasService.guardarEvolucion(id, dto, user);
  }
}
