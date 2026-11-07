import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { MlService } from './ml.service';
import { JwtAuthGuard } from '../../comun/jwt-auth.guard';
import { RolesGuard } from '../../comun/roles.guard';
import { Roles } from '../../comun/roles.decorator';
import { UsuarioActual } from '../../comun/usuario-actual.decorator';
import { Rol } from '@prisma/client';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('ml')
export class MlController {
  constructor(private readonly mlService: MlService) {}

  @Roles(Rol.ADMINISTRADOR, Rol.PSICOLOGO, Rol.RECEPCIONISTA)
  @Get('predicciones-resumen')
  async obtenerResumenPredicciones(
    @UsuarioActual() user?: any,
    @Query('psicologoId') psicologoId?: string,
  ) {
    return this.mlService.obtenerResumenPredicciones(user, psicologoId);
  }
}
