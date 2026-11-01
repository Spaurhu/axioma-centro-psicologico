import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class PagosService {
  constructor(private readonly prisma: PrismaService) {}

  async obtenerIngresosDelMes() {
    const ahora = new Date();
    const inicioMes = new Date(ahora.getFullYear(), ahora.getMonth(), 1, 0, 0, 0, 0);
    const finMes = new Date(ahora.getFullYear(), ahora.getMonth() + 1, 0, 23, 59, 59, 999);

    const pagos = await this.prisma.pago.findMany({
      where: {
        fechaPago: {
          gte: inicioMes,
          lte: finMes,
        },
      },
      include: {
        usuario: true,
        paquetePaciente: {
          include: {
            paciente: true,
            paquete: true,
          },
        },
      },
      orderBy: { fechaPago: 'desc' },
    });

    const totalMes = pagos.reduce((acc, p) => acc + Number(p.monto), 0);

    return {
      totalMes,
      conteo: pagos.length,
      inicioMes,
      finMes,
      pagos,
    };
  }
}
