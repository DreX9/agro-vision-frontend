import { EstadoParcelaTipo } from './parcela.types';

export interface SectorParcelaItem {
  id: string;
  codigo: string;
  nombre: string;
  areaHectareas: number;
  colorHex?: string | null;
  parcelaId: string;
  parcelaCodigo?: string | null;
  parcelaNombre?: string | null;
  cultivoId: string;
  cultivoNombre?: string | null;
  cultivoColorHex?: string | null;
  variedad?: string | null;
  delimitacionGeoJson?: unknown;
  latitudCentro?: number | null;
  longitudCentro?: number | null;
  fechaSiembra?: string | null;
  fechaCosechaEstimada?: string | null;
  estado: EstadoParcelaTipo;
  createdAt: string;
  updatedAt: string;
}

export interface ResumenSectoresParcela {
  parcelaId: string;
  parcelaCodigo: string;
  parcelaNombre: string;
  areaTotalHectareas: number;
  areaAsignadaHectareas: number;
  areaDisponibleHectareas: number;
  porcentajeOcupado: number;
  delimitacionParcelaGeoJson?: unknown;
  latitudCentro?: number | null;
  longitudCentro?: number | null;
  sectores: SectorParcelaItem[];
}

export interface CrearSectorParcelaInput {
  codigo?: string;
  nombre: string;
  cultivoId: string;
  variedad?: string;
  areaHectareas: number;
  colorHex?: string;
  delimitacionGeoJson: unknown;
  latitudCentro?: number;
  longitudCentro?: number;
  fechaSiembra?: string;
  fechaCosechaEstimada?: string;
}

export interface ActualizarSectorParcelaInput {
  nombre?: string;
  cultivoId?: string;
  variedad?: string;
  areaHectareas?: number;
  colorHex?: string;
  delimitacionGeoJson?: unknown;
  latitudCentro?: number;
  longitudCentro?: number;
  fechaSiembra?: string;
  fechaCosechaEstimada?: string;
  estado?: EstadoParcelaTipo;
}
