import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/shared/api/api-client';
import {
  ActividadItem,
  ActividadDetalle,
  FiltrosActividadesParams,
  RespuestaPaginadaActividades,
  CrearActividadInput,
  ActualizarActividadInput,
  EstadoActividadTipo,
} from '../types/actividad.types';

export const ACTIVIDADES_KEYS = {
  todas: ['actividades'] as const,
  listas: () => [...ACTIVIDADES_KEYS.todas, 'lista'] as const,
  lista: (filtros: FiltrosActividadesParams) => [...ACTIVIDADES_KEYS.listas(), filtros] as const,
  detalles: () => [...ACTIVIDADES_KEYS.todas, 'detalle'] as const,
  detalle: (id: string) => [...ACTIVIDADES_KEYS.detalles(), id] as const,
};

/**
 * @description Hook para listar actividades agrícolas con filtros y paginación.
 */
export function useActividadesQuery(filtros: FiltrosActividadesParams = {}) {
  return useQuery({
    queryKey: ACTIVIDADES_KEYS.lista(filtros),
    queryFn: async (): Promise<RespuestaPaginadaActividades> => {
      const params = new URLSearchParams();
      if (filtros.busqueda) params.append('busqueda', filtros.busqueda);
      if (filtros.parcelaId) params.append('parcelaId', filtros.parcelaId);
      if (filtros.tipo) params.append('tipo', filtros.tipo);
      if (filtros.estado) params.append('estado', filtros.estado);
      if (filtros.usuarioResponsableId) params.append('usuarioResponsableId', filtros.usuarioResponsableId);
      if (filtros.fechaDesde) params.append('fechaDesde', filtros.fechaDesde);
      if (filtros.fechaHasta) params.append('fechaHasta', filtros.fechaHasta);
      if (filtros.pagina) params.append('pagina', String(filtros.pagina));
      if (filtros.limite) params.append('limite', String(filtros.limite));

      const respuesta = await apiClient.get<RespuestaPaginadaActividades>(`/actividades?${params.toString()}`);
      return respuesta.data;
    },
  });
}

/**
 * @description Hook para consultar el detalle completo de una actividad con cuadrilla e insumos.
 */
export function useActividadPorIdQuery(id: string) {
  return useQuery({
    queryKey: ACTIVIDADES_KEYS.detalle(id),
    queryFn: async (): Promise<ActividadDetalle> => {
      const respuesta = await apiClient.get<ActividadDetalle>(`/actividades/${id}`);
      return respuesta.data;
    },
    enabled: Boolean(id),
  });
}

/**
 * @description Hook para registrar una nueva actividad agrícola.
 */
export function useCrearActividadMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (datos: CrearActividadInput): Promise<ActividadDetalle> => {
      const respuesta = await apiClient.post<ActividadDetalle>('/actividades', datos);
      return respuesta.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ACTIVIDADES_KEYS.todas });
    },
  });
}

/**
 * @description Hook para actualizar una actividad agrícola existente.
 */
export function useActualizarActividadMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, datos }: { id: string; datos: ActualizarActividadInput }): Promise<ActividadDetalle> => {
      const respuesta = await apiClient.put<ActividadDetalle>(`/actividades/${id}`, datos);
      return respuesta.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ACTIVIDADES_KEYS.detalle(variables.id) });
      queryClient.invalidateQueries({ queryKey: ACTIVIDADES_KEYS.listas() });
    },
  });
}

/**
 * @description Hook para cambiar el estado de una labor de campo.
 */
export function useCambiarEstadoActividadMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, estado }: { id: string; estado: EstadoActividadTipo }): Promise<ActividadDetalle> => {
      const respuesta = await apiClient.patch<ActividadDetalle>(`/actividades/${id}/estado`, { estado });
      return respuesta.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ACTIVIDADES_KEYS.todas });
    },
  });
}

/**
 * @description Hook para eliminar lógicamente una actividad agrícola.
 */
export function useEliminarActividadMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string): Promise<void> => {
      await apiClient.delete(`/actividades/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ACTIVIDADES_KEYS.todas });
    },
  });
}
