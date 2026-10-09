export type EstadoParcelaTipo =
  | 'ACTIVA'
  | 'EN_PREPARACION'
  | 'EN_DESCANSO'
  | 'COSECHADA'
  | 'INACTIVA';

export interface ParcelaItem {
  id: string;
  codigo: string;
  nombre: string;
  areaHectareas: number;
  cultivoId: string;
  cultivoNombre?: string;
  cultivoColorHex?: string | null;
  variedad?: string | null;
  usuarioResponsableId?: string | null;
  usuarioResponsableNombre?: string | null;
  ubicacion?: string | null;
  departamento?: string | null;
  provincia?: string | null;
  distrito?: string | null;
  estado: EstadoParcelaTipo;
  delimitacionGeoJson?: unknown;
  latitudCentro?: number | null;
  longitudCentro?: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface FiltrosParcelasParams {
  busqueda?: string;
  cultivoId?: string;
  estado?: string;
  usuarioResponsableId?: string;
  pagina?: number;
  limite?: number;
}

export interface RespuestaPaginadaParcelas {
  items: ParcelaItem[];
  total: number;
  pagina: number;
  limite: number;
  totalPaginas: number;
}

export interface CrearParcelaInput {
  codigo?: string;
  nombre: string;
  areaHectareas: number;
  cultivoId: string;
  variedad?: string;
  usuarioResponsableId?: string;
  ubicacion?: string;
  departamento?: string;
  provincia?: string;
  distrito?: string;
  estado?: EstadoParcelaTipo;
  delimitacionGeoJson?: unknown;
  latitudCentro?: number;
  longitudCentro?: number;
}

export interface ActualizarParcelaInput {
  nombre?: string;
  areaHectareas?: number;
  cultivoId?: string;
  variedad?: string;
  usuarioResponsableId?: string;
  ubicacion?: string;
  departamento?: string;
  provincia?: string;
  distrito?: string;
  estado?: EstadoParcelaTipo;
  delimitacionGeoJson?: unknown;
  latitudCentro?: number;
  longitudCentro?: number;
}
