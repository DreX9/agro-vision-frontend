export interface CultivoItem {
  id: string;
  nombre: string;
  nombreCientifico?: string | null;
  variedadesDefault: string[];
  colorHex?: string | null;
  activo: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CrearCultivoInput {
  nombre: string;
  nombreCientifico?: string;
  variedadesDefault?: string[];
  colorHex?: string;
}

export interface ActualizarCultivoInput {
  id: string;
  nombre?: string;
  nombreCientifico?: string;
  variedadesDefault?: string[];
  colorHex?: string;
  activo?: boolean;
}
