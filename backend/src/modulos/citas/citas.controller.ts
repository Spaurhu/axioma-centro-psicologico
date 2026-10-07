import { Controller, Get, Post, Put, Patch, Body, Param, Query, UseGuards } from '@nestjs/common';
import { CitasService } from './citas.service';
import { CrearCitaDto } from './dto/crear-cita.dto';
import { ReprogramarCitaDto } from './dto/reprogramar-cita.dto';
import { JwtAuthGuard } from '../../comun/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('citas')
export class CitasController {
  constructor(private readonly citasService: CitasService) {}

  @Post()
  async crear(@Body() dto: CrearCitaDto) {
    return this.citasService.crear(dto);
  }

  @Get()
  async listar(
    @Query('fecha') fecha?: string,
    @Query('psicologoId') psicologoId?: string,
  ) {
    return this.citasService.listarPorFecha(fecha, psicologoId);
  }

  @Put(':id/reprogramar')
  async reprogramar(@Param('id') id: string, @Body() dto: ReprogramarCitaDto) {
    return this.citasService.reprogramar(id, dto);
  }

  @Patch(':id/cancelar')
  async cancelar(@Param('id') id: string, @Body('motivo') motivo: string) {
    return this.citasService.cancelar(id, motivo);
  }

  @Patch(':id/asistencia')
  async marcarAsistencia(@Param('id') id: string) {
    return this.citasService.marcarAsistencia(id);
  }
}
