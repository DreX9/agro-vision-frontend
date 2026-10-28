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

export const esLaborCampo = (tipo: TipoActividadTipo): boolean => {
  return LABORES_CAMPO.includes(tipo);
};

export const esLaborAdministrativaOTecnica = (tipo: TipoActividadTipo): boolean => {
  return LABORES_ADMINISTRATIVAS_TECNICAS.includes(tipo);
};

export type EstadoActividadTipo =
  | 'PENDIENTE'
  | 'EN_PROGRESO'
  | 'COMPLETADA'
  | 'CANCELADA';

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

export interface ActividadItem {
  id: string;
  codigo: string;
  titulo: string;
  tipo: TipoActividadTipo;
  descripcion?: string | null;
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
