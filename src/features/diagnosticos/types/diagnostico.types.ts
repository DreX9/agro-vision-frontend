/**
 * @description Tipos de dominio para el módulo de diagnóstico fitosanitario por visión computacional.
 */

export interface CoordenadasCaja {
  x_min: number;
  y_min: number;
  x_max: number;
  y_max: number;
}

export interface DeteccionPlaga {
  clase: string;
  confianza: number;
  caja: CoordenadasCaja;
}

export type EstadoSaludFoliar = 'OPTIMO' | 'ALERTA' | 'CRITICO' | 'SIN_DETECCION';

export interface DiagnosticoRespuesta {
  estado_general: EstadoSaludFoliar;
  salud_porcentaje: number;
  total_plagas_detectadas: number;
  detecciones: DeteccionPlaga[];
  recomendaciones: string[];
  tiempo_procesamiento_ms: number;
}

export interface EscaneoCamaraEstado {
  estaActivo: boolean;
  modoPantallaCompleta: boolean;
  escaneando: boolean;
  error?: string | null;
}
