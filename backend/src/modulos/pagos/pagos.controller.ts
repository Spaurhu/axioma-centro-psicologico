import { Controller, Get, UseGuards } from '@nestjs/common';
import { PagosService } from './pagos.service';
import { JwtAuthGuard } from '../../comun/jwt-auth.guard';
import { RolesGuard } from '../../comun/roles.guard';
import { Roles } from '../../comun/roles.decorator';
import { Rol } from '@prisma/client';

@Controller('pagos')
@UseGuards(JwtAuthGuard, RolesGuard)
export class PagosController {
  constructor(private readonly pagosService: PagosService) {}

  @Get()
  @Roles(Rol.ADMINISTRADOR)
  obtenerIngresosDelMes() {
    return this.pagosService.obtenerIngresosDelMes();
  }
}
