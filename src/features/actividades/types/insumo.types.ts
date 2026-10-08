export type CategoriaInsumoTipo =
  | 'FERTILIZANTE'
  | 'FITOSANITARIO'
  | 'MAQUINARIA_EQUIPO'
  | 'HERRAMIENTA'
  | 'OTRO';

export interface InsumoItem {
  id: string;
  codigo: string;
  nombre: string;
  categoria: CategoriaInsumoTipo;
  unidadMedida: string;
  descripcion?: string | null;
  activo: boolean;
}
