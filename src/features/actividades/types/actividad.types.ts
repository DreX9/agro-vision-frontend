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

export interface InfoTipoLabor {
  tipo: TipoActividadTipo;
  label: string;
  icono: string;
  descripcion: string;
  tema: {
    bg: string;
    border: string;
    text: string;
    badgeBg: string;
    badgeText: string;
  };
}

export const CATALOGO_TIPOS_LABOR: Record<string, InfoTipoLabor> = {
  FERTILIZACION: {
    tipo: 'FERTILIZACION',
    label: 'Fertilización',
    icono: '🧪',
    descripcion: 'Nutrición foliar / edáfica',
    tema: {
      bg: '#F0FDF4',
      border: '#BBF7D0',
      text: '#166534',
      badgeBg: '#DCFCE7',
      badgeText: '#15803D',
    },
  },
  RIEGO: {
    tipo: 'RIEGO',
    label: 'Riego',
    icono: '💧',
    descripcion: 'Lámina de agua por goteo/aspersión',
    tema: {
      bg: '#F0F9FF',
      border: '#BAE6FD',
      text: '#075985',
      badgeBg: '#E0F2FE',
      badgeText: '#0369A1',
    },
  },
  PODA: {
    tipo: 'PODA',
    label: 'Poda',
    icono: '✂️',
    descripcion: 'Formación, producción o sanitaria',
    tema: {
      bg: '#FFFBEB',
      border: '#FDE68A',
      text: '#92400E',
      badgeBg: '#FEF3C7',
      badgeText: '#B45309',
    },
  },
  COSECHA: {
    tipo: 'COSECHA',
    label: 'Cosecha',
    icono: '🧺',
    descripcion: 'Recolección y selección de fruta',
    tema: {
      bg: '#FAF5FF',
      border: '#E9D5FF',
      text: '#6B21A8',
      badgeBg: '#F3E8FF',
      badgeText: '#7E22CE',
    },
  },
  SIEMBRA: {
    tipo: 'SIEMBRA',
    label: 'Siembra',
    icono: '🌱',
    descripcion: 'Plantación o trasplante de plantones',
    tema: {
      bg: '#FEFCE8',
      border: '#FEF08A',
      text: '#854D0E',
      badgeBg: '#FEF9C3',
      badgeText: '#A16207',
    },
  },
  CONTROL_PLAGAS: {
    tipo: 'CONTROL_PLAGAS',
    label: 'Control Plagas',
    icono: '🛡️',
    descripcion: 'Sanidad y fitoprotección',
    tema: {
      bg: '#EFF6FF',
      border: '#BFDBFE',
      text: '#1E40AF',
      badgeBg: '#DBEAFE',
      badgeText: '#1D4ED8',
    },
  },
  DESHIERBE: {
    tipo: 'DESHIERBE',
    label: 'Deshierbe',
    icono: '🌿',
    descripcion: 'Control manual o mecánico de malezas',
    tema: {
      bg: '#F2FBF4',
      border: '#C7EED0',
      text: '#14532D',
      badgeBg: '#D1FAE5',
      badgeText: '#065F46',
    },
  },
  MANTENIMIENTO: {
    tipo: 'MANTENIMIENTO',
    label: 'Mantenimiento',
    icono: '🔧',
    descripcion: 'Infraestructura, cercos y riego',
    tema: {
      bg: '#F8FAFC',
      border: '#CBD5E1',
      text: '#334155',
      badgeBg: '#F1F5F9',
      badgeText: '#475569',
    },
  },
  MONITOREO_FITOSANITARIO: {
    tipo: 'MONITOREO_FITOSANITARIO',
    label: 'Monitoreo Fitosanitario',
    icono: '🔬',
    descripcion: 'Evaluación de plagas y anomalías',
    tema: {
      bg: '#FEF2F2',
      border: '#FECACA',
      text: '#991B1B',
      badgeBg: '#FEE2E2',
      badgeText: '#B91C1C',
    },
  },
  AUDITORIA_CALIDAD: {
    tipo: 'AUDITORIA_CALIDAD',
    label: 'Auditoría Calidad',
    icono: '📋',
    descripcion: 'Control de calidad y estándares',
    tema: {
      bg: '#F5F3FF',
      border: '#DDD6FE',
      text: '#5B21B6',
      badgeBg: '#EDE9FE',
      badgeText: '#6D28D9',
    },
  },
  SUPERVISION_TECNICA: {
    tipo: 'SUPERVISION_TECNICA',
    label: 'Supervisión Técnica',
    icono: '🔍',
    descripcion: 'Inspección agronómica en terreno',
    tema: {
      bg: '#F0FDFA',
      border: '#99F6E4',
      text: '#115E59',
      badgeBg: '#CCFBF1',
      badgeText: '#0F766E',
    },
  },
  GESTION_ADMINISTRATIVA: {
    tipo: 'GESTION_ADMINISTRATIVA',
    label: 'Gestión Administrativa',
    icono: '📁',
    descripcion: 'Planificación y reportes',
    tema: {
      bg: '#F8FAFC',
      border: '#E2E8F0',
      text: '#475569',
      badgeBg: '#F1F5F9',
      badgeText: '#334155',
    },
  },
};

export const obtenerInfoTipoLabor = (tipo: string): InfoTipoLabor => {
  const clave = (tipo || '').toUpperCase().trim();
  if (CATALOGO_TIPOS_LABOR[clave]) {
    return CATALOGO_TIPOS_LABOR[clave];
  }
  for (const [k, v] of Object.entries(CATALOGO_TIPOS_LABOR)) {
    if (clave.includes(k) || k.includes(clave)) {
      return v;
    }
  }
  return {
    tipo: 'OTRO',
    label: tipo ? tipo.replace(/_/g, ' ') : 'Labor Agrícola',
    icono: '🌾',
    descripcion: 'Labor asignada en terreno',
    tema: {
      bg: '#F8FAFC',
      border: '#E2E8F0',
      text: '#475569',
      badgeBg: '#F1F5F9',
      badgeText: '#334155',
    },
  };
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
