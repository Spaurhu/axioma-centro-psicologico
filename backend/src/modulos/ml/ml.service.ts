import { Injectable } from '@nestjs/common';
import { NivelRiesgo } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

export interface ParametrosPrediccion {
  diasAnticipacion: number;
  tienePaquete: boolean;
  inasistenciasPrevias: number;
  citasPrevias: number;
  diaSemana: number; // 0: Lunes, ..., 6: Domingo
  turno: number;     // 0: Mañana, 1: Tarde, 2: Noche
}

export interface ResultadoPrediccion {
  probabilidad: number;
  nivelRiesgo: NivelRiesgo;
  factoresClave: string[];
}

@Injectable()
export class MlService {
  private coeficientes: any;

  constructor() {
    this.cargarCoeficientes();
  }

  private cargarCoeficientes() {
    try {
      const ruta = path.resolve(process.cwd(), '../ml/modelo_coeficientes.json');
      if (fs.existsSync(ruta)) {
        this.coeficientes = JSON.parse(fs.readFileSync(ruta, 'utf-8'));
      } else {
        // Coeficientes predeterminados por si no encuentra el archivo
        this.coeficientes = {
          intercepto: -1.85,
          peso_dias_anticipacion: 0.078,
          peso_tiene_paquete: -1.55,
          peso_inasistencias_previas: 0.92,
          peso_citas_previas: -0.18,
          peso_lunes: 0.32,
          peso_turno_noche: 0.41,
        };
      }
    } catch (e) {
      this.coeficientes = {
        intercepto: -1.85,
        peso_dias_anticipacion: 0.078,
        peso_tiene_paquete: -1.55,
        peso_inasistencias_previas: 0.92,
        peso_citas_previas: -0.18,
        peso_lunes: 0.32,
        peso_turno_noche: 0.41,
      };
    }
  }

  predecirInasistencia(params: ParametrosPrediccion): ResultadoPrediccion {
    const c = this.coeficientes;
    let z = c.intercepto;

    z += params.diasAnticipacion * c.peso_dias_anticipacion;
    z += (params.tienePaquete ? 1 : 0) * c.peso_tiene_paquete;
    z += params.inasistenciasPrevias * c.peso_inasistencias_previas;
    z += Math.min(params.citasPrevias, 5) * c.peso_citas_previas;

    if (params.diaSemana === 0) {
      z += c.peso_lunes;
    }
    if (params.turno === 2) {
      z += c.peso_turno_noche;
    }

    const prob = 1 / (1 + Math.exp(-z));
    const probabilidadRedondeada = Math.round(prob * 10000) / 10000;

    let nivelRiesgo: NivelRiesgo = NivelRiesgo.BAJO;
    if (probabilidadRedondeada > 0.65) {
      nivelRiesgo = NivelRiesgo.ALTO;
    } else if (probabilidadRedondeada >= 0.30) {
      nivelRiesgo = NivelRiesgo.MEDIO;
    }

    const factoresClave: string[] = [];
    if (params.diasAnticipacion >= 10) factoresClave.push('Alta anticipación de reserva');
    if (!params.tienePaquete) factoresClave.push('Sin paquete prepagado activo');
    if (params.inasistenciasPrevias > 0) factoresClave.push(`Historial de ${params.inasistenciasPrevias} inasistencia(s)`);
    if (params.citasPrevias >= 3) factoresClave.push('Paciente recurrente fidelizado');

    return {
      probabilidad: probabilidadRedondeada,
      nivelRiesgo,
      factoresClave,
    };
  }
}
