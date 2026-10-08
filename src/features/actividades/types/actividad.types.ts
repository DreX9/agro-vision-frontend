export type TipoActividadTipo =
  | 'FERTILIZACION'
  | 'CONTROL_PLAGAS'
  | 'RIEGO'
  | 'PODA'
  | 'SIEMBRA'
  | 'COSECHA'
  | 'DESHIERBE'
  | 'MANTENIMIENTO'
  | 'OTRO';

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
  telefono?: string | null;
}

export interface RecursoAsignado {
  id: string;
  insumoId: string;
  nombreInsumo: string;
  categoriaInsumo: string;
  cantidadEstimada: number;
  unidadMedida: string;
  notas?: string | null;
}

export interface ActividadItem {
  id: string;
  codigo: string;
  titulo: string;
  tipo: TipoActividadTipo;
  parcelaId: string;
  parcelaNombre?: string;
  cultivoNombre?: string;
  usuarioResponsableId?: string | null;
  usuarioResponsableNombre?: string | null;
  fechaInicio: string;
  fechaFin?: string | null;
  estado: EstadoActividadTipo;
  cantidadTrabajadores: number;
  cantidadRecursos: number;
  createdAt: string;
}

export interface ActividadDetalle extends ActividadItem {
  descripcion?: string | null;
  observaciones?: string | null;
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

export interface CrearActividadInput {
  codigo?: string;
  titulo: string;
  tipo: TipoActividadTipo;
  parcelaId: string;
  fechaInicio: string;
  fechaFin?: string;
  usuarioResponsableId?: string;
  descripcion?: string;
  observaciones?: string;
  estado?: EstadoActividadTipo;
  trabajadores?: { usuarioId: string; rolEnActividad?: string }[];
  recursos?: { insumoId: string; cantidadEstimada: number; unidadMedida: string; notas?: string }[];
}

export interface ActualizarActividadInput {
  titulo?: string;
  tipo?: TipoActividadTipo;
  parcelaId?: string;
  fechaInicio?: string;
  fechaFin?: string;
  usuarioResponsableId?: string;
  descripcion?: string;
  observaciones?: string;
  estado?: EstadoActividadTipo;
  trabajadores?: { usuarioId: string; rolEnActividad?: string }[];
  recursos?: { insumoId: string; cantidadEstimada: number; unidadMedida: string; notas?: string }[];
}
