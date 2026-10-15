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

export interface DespliegueDronConfig {
  parcelaId: string;
  parcelaNombre: string;
  parcelaCodigo?: string;
  sectorId?: string;
  sectorNombre?: string;
  sectorCodigo?: string;
  cultivoNombre?: string;
  cultivoVariedad?: string;
  latitud: number;
  longitud: number;
}

export interface DiagnosticoCampoItem {
  id: string;
  codigo: string;
  parcelaId: string;
  parcelaNombre?: string | null;
  parcelaCodigo?: string | null;
  sectorId?: string | null;
  sectorNombre?: string | null;
  sectorCodigo?: string | null;
  cultivoNombre?: string | null;
  cultivoVariedad?: string | null;
  usuarioId?: string | null;
  usuarioNombre?: string | null;
  latitud: number;
  longitud: number;
  estadoGeneral: EstadoSaludFoliar;
  saludPorcentaje: number;
  totalPlagasDetectadas: number;
  detecciones: DeteccionPlaga[];
  recomendaciones: string[];
  tiempoProcesamientoMs?: number | null;
  imagenUrl?: string | null;
  origenCaptura?: string | null;
  observaciones?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CrearDiagnosticoPayload {
  parcelaId: string;
  sectorId?: string;
  usuarioId?: string;
  latitud: number;
  longitud: number;
  estadoGeneral: EstadoSaludFoliar;
  saludPorcentaje: number;
  totalPlagasDetectadas: number;
  detecciones?: DeteccionPlaga[];
  recomendaciones?: string[];
  tiempoProcesamientoMs?: number;
  imagenUrl?: string;
  origenCaptura?: string;
  observaciones?: string;
}

export interface FiltrosDiagnosticosParams {
  parcelaId?: string;
  sectorId?: string;
  estadoGeneral?: string;
  pagina?: number;
  limite?: number;
}

export interface RespuestaPaginadaDiagnosticos {
  items: DiagnosticoCampoItem[];
  total: number;
  pagina: number;
  limite: number;
  totalPaginas: number;
}

