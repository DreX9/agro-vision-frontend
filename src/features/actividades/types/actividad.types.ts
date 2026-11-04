export type TipoActividadTipo =
  | 'FERTILIZACION'
  | 'CONTROL_PLAGAS'
  | 'RIEGO'
  | 'PODA'
  | 'SIEMBRA'
  | 'COSECHA'
  | 'DESHIERBE'
  | 'MANTENIMIENTO'
  | 'MONITOREO_FITOSANITARIO'
  | 'AUDITORIA_CALIDAD'
  | 'SUPERVISION_TECNICA'
  | 'GESTION_ADMINISTRATIVA'
  | 'OTRO';

export type CategoriaLaborTipo = 'CAMPO_OPERATIVA' | 'ADMINISTRATIVA_TECNICA';

export const LABORES_CAMPO: TipoActividadTipo[] = [
  'RIEGO',
  'PODA',
  'COSECHA',
  'SIEMBRA',
  'FERTILIZACION',
  'CONTROL_PLAGAS',
  'DESHIERBE',
  'MANTENIMIENTO',
];

export const LABORES_ADMINISTRATIVAS_TECNICAS: TipoActividadTipo[] = [
  'MONITOREO_FITOSANITARIO',
  'AUDITORIA_CALIDAD',
  'SUPERVISION_TECNICA',
  'GESTION_ADMINISTRATIVA',
];

export const LABORES_CON_INSUMOS: TipoActividadTipo[] = [
  'FERTILIZACION',
  'CONTROL_PLAGAS',
  'SIEMBRA',
];

export const esLaborCampo = (tipo: TipoActividadTipo): boolean => {
  return LABORES_CAMPO.includes(tipo);
};

export const esLaborAdministrativaOTecnica = (tipo: TipoActividadTipo): boolean => {
  return LABORES_ADMINISTRATIVAS_TECNICAS.includes(tipo);
};

export const laborRequiereInsumos = (tipo: TipoActividadTipo): boolean => {
  return LABORES_CON_INSUMOS.includes(tipo);
};

export type EstadoActividadTipo =
  | 'PENDIENTE'
  | 'EN_PROGRESO'
  | 'COMPLETADA'
  | 'CANCELADA';

export type TipoTurnoLabor =
  | 'MANANA'
  | 'TARDE'
  | 'JORNADA_COMPLETA'
  | 'PERSONALIZADO';

/**
 * @description Genera automáticamente el código/título formal de la actividad con formato:
 * {TIPO_LABOR}-{CODIGO_SECTOR}-{FECHA_INICIO} (ej. FERT-P011-S01-20261019)
 */
export const generarCodigoActividad = (
  tipo: TipoActividadTipo,
  codigoSector?: string | null,
  fechaInicio?: string | null,
): string => {
  const prefijos: Record<TipoActividadTipo, string> = {
    FERTILIZACION: 'FERT',
    CONTROL_PLAGAS: 'PLAG',
    RIEGO: 'RIEG',
    PODA: 'PODA',
    SIEMBRA: 'SIEM',
    COSECHA: 'COSE',
    DESHIERBE: 'DESH',
    MANTENIMIENTO: 'MANT',
    MONITOREO_FITOSANITARIO: 'MONI',
    AUDITORIA_CALIDAD: 'AUDI',
    SUPERVISION_TECNICA: 'SUPV',
    GESTION_ADMINISTRATIVA: 'GEST',
    OTRO: 'ACT',
  };

  const prefijo = prefijos[tipo] || 'ACT';
  const sectorLimpio = codigoSector
    ? codigoSector.replace(/[^A-Za-z0-9]/g, '').toUpperCase()
    : 'SEC';

  const fechaStr = fechaInicio ? fechaInicio.split('T')[0] : new Date().toISOString().split('T')[0];
  const fechaCompacta = fechaStr.replace(/-/g, '');

  return `${prefijo}-${sectorLimpio}-${fechaCompacta}`;
};

/**
 * @description Extrae de forma segura la cantidad de jornales / operarios requeridos planificados
 * desde observaciones o metadata de la labor.
 */
export const extraerJornalesRequeridos = (actividad: {
  observaciones?: string | null;
  descripcion?: string | null;
  cantidadTrabajadores?: number;
}): number => {
  if (actividad.observaciones) {
    const match = actividad.observaciones.match(/\[JORNALES_REQUERIDOS:(\d+)\]/i);
    if (match && match[1]) {
      return parseInt(match[1], 10);
    }
  }
  if (actividad.descripcion) {
    const match = actividad.descripcion.match(/(\d+)\s*operarios?\s*requeridos?/i);
    if (match && match[1]) {
      return parseInt(match[1], 10);
    }
  }
  return Math.max(actividad.cantidadTrabajadores || 0, 4);
};

export interface TrabajadorAsignado {
  id: string;
  usuarioId: string;
  nombres: string;
  apellidos: string;
  rolEnActividad?: string | null;
  zonaTrabajo?: string | null;
  telefono?: string | null;
  horaInicio?: string | null;
  horaFin?: string | null;
  horasAsignadas?: number | null;
}

/**
 * @description Extrae de forma limpia el rol operativo y la zona de trabajo asignada (ej. 'Aplicador • Hilera 1-10').
 */
export const extraerRolYZona = (
  rolEnActividad?: string | null,
): { rol: string; zona?: string } => {
  if (!rolEnActividad) return { rol: 'Operador' };
  const partes = rolEnActividad.split(' • ');
  return {
    rol: partes[0] || 'Operador',
    zona: partes.length > 1 ? partes.slice(1).join(' • ') : undefined,
  };
};

export interface RecursoAsignado {
  id: string;
  insumoId: string;
  nombreInsumo: string;
  categoriaInsumo: string;
  cantidadEstimada: number;
  unidadMedida: string;
  dosis?: string | null;
  cantidadReal?: number | null;
  notas?: string | null;
}

export interface InsumoPlanificadoItem {
  insumoId: string;
  nombreInsumo: string;
  categoria: string;
  dosisPorHa: number;
  unidadMedida: string;
  totalCalculado: number;
  diasCarencia?: number | null;
  horasReingreso?: number | null;
  notas?: string | null;
}

export interface MaquinariaPlanificadaItem {
  insumoId: string;
  nombreEquipo: string;
  cantidad: number;
  unidadMedida: string;
  notas?: string | null;
}

/**
 * @description Entidad desacoplada de Planificación Técnica de Actividades Agrícolas.
 */
export interface ActividadPlanificacion {
  id: string;
  codigo: string;
  titulo: string;
  tipo: TipoActividadTipo;
  parcelaId: string;
  parcelaNombre?: string;
  sectorId: string;
  sectorCodigo?: string | null;
  sectorNombre?: string | null;
  cultivoNombre?: string;
  variedad?: string | null;
  areaHectareas?: number;
  fechaInicio: string;
  fechaFin?: string | null;
  turno: TipoTurnoLabor;
  horasEstimadas: number;
  supervisorId: string;
  supervisorNombre?: string | null;
  jornalesRequeridos: number;
  jornalesAsignados: number;
  notasPlanificacion?: string | null;
  insumosPlanificados: InsumoPlanificadoItem[];
  maquinariaPlanificada: MaquinariaPlanificadaItem[];
  estado: EstadoActividadTipo;
}

/**
 * @description Entidad desacoplada para el registro y confirmación de cuadrillas operativas en campo.
 */
export interface RegistroCuadrilla {
  actividadId: string;
  supervisorId: string;
  fechaAsignacion: string;
  jornalesRequeridos: number;
  operariosAsignados: TrabajadorAsignado[];
  estadoCuadrilla: 'PENDIENTE' | 'CONFIRMADA';
}

/**
 * @description Entidad desacoplada para el reporte diario de ejecución de labores de campo.
 */
export interface ReporteEjecucion {
  actividadId: string;
  fechaReporte: string;
  horasTrabajadasReales: number;
  avancePorcentaje: number;
  novedadesCampo: string;
  latitudAvance?: number | null;
  longitudAvance?: number | null;
  insumosConsumidos?: { insumoId: string; cantidadReal: number }[];
}

export interface ActividadItem {
  id: string;
  codigo: string;
  titulo: string;
  tipo: TipoActividadTipo;
  descripcion?: string | null;
  observaciones?: string | null;
  blancoBiologico?: string | null;
  metodoAplicacion?: string | null;
  parcelaId: string;
  parcelaNombre?: string;
  sectorId?: string | null;
  sectorNombre?: string | null;
  sectorCodigo?: string | null;
  cultivoNombre?: string;
  usuarioResponsableId?: string | null;
  usuarioResponsableNombre?: string | null;
  fechaInicio: string;
  fechaFin?: string | null;
  estado: EstadoActividadTipo;
  cantidadTrabajadores: number;
  trabajadores?: TrabajadorAsignado[];
  cantidadRecursos: number;
  createdAt: string;
}

export interface ActividadDetalle extends ActividadItem {
  descripcion?: string | null;
  observaciones?: string | null;
  blancoBiologico?: string | null;
  metodoAplicacion?: string | null;
  diasCarencia?: number | null;
  horasReingreso?: number | null;
  trabajadores: TrabajadorAsignado[];
  recursos: RecursoAsignado[];
  updatedAt: string;
}

export interface FiltrosActividadesParams {
  busqueda?: string;
  parcelaId?: string;
  tipo?: string;
  estado?: string;
  usuarioResponsableId?: string;
  fechaDesde?: string;
  fechaHasta?: string;
  pagina?: number;
  limite?: number;
}

export interface RespuestaPaginadaActividades {
  items: ActividadItem[];
  total: number;
  pagina: number;
  limite: number;
  totalPaginas: number;
}

export interface RecursoInput {
  insumoId: string;
  cantidadEstimada: number;
  unidadMedida: string;
  dosis?: string;
  cantidadReal?: number;
  notas?: string;
}

export interface TrabajadorInput {
  usuarioId: string;
  rolEnActividad?: string;
  horaInicio?: string;
  horaFin?: string;
  horasAsignadas?: number;
}

export interface CrearActividadInput {
  codigo?: string;
  titulo: string;
  tipo: TipoActividadTipo;
  parcelaId: string;
  sectorId?: string;
  fechaInicio: string;
  fechaFin?: string;
  usuarioResponsableId?: string;
  descripcion?: string;
  observaciones?: string;
  blancoBiologico?: string;
  metodoAplicacion?: string;
  diasCarencia?: number;
  horasReingreso?: number;
  estado?: EstadoActividadTipo;
  trabajadores?: TrabajadorInput[];
  recursos?: RecursoInput[];
}

export interface ActualizarActividadInput {
  titulo?: string;
  tipo?: TipoActividadTipo;
  parcelaId?: string;
  sectorId?: string;
  fechaInicio?: string;
  fechaFin?: string;
  usuarioResponsableId?: string;
  descripcion?: string;
  observaciones?: string;
  blancoBiologico?: string;
  metodoAplicacion?: string;
  diasCarencia?: number;
  horasReingreso?: number;
  estado?: EstadoActividadTipo;
  trabajadores?: TrabajadorInput[];
  recursos?: RecursoInput[];
}

export interface ConflictoDisponibilidad {
  usuarioId: string;
  trabajadorNombre: string;
  actividadId: string;
  actividadTitulo: string;
  parcelaOrigen: string;
  parcelaDestino: string;
  distanciaKm?: number;
  minutosRequeridos: number;
  minutosDisponibles: number;
  tipoConflicto: 'SOLAPAMIENTO_HORARIO' | 'TIEMPO_TRASLADO_INSUFICIENTE';
  mensaje: string;
}

export interface ValidacionDisponibilidadResultado {
  esValido: boolean;
  conflictos: ConflictoDisponibilidad[];
}
