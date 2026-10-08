import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/shared/api/api-client';
import {
  ParcelaItem,
  FiltrosParcelasParams,
  RespuestaPaginadaParcelas,
  CrearParcelaInput,
  ActualizarParcelaInput,
  EstadoParcelaTipo,
} from '../types/parcela.types';

export const PARCELAS_KEYS = {
  todas: ['parcelas'] as const,
  listas: () => [...PARCELAS_KEYS.todas, 'lista'] as const,
  lista: (filtros: FiltrosParcelasParams) => [...PARCELAS_KEYS.listas(), filtros] as const,
  detalles: () => [...PARCELAS_KEYS.todas, 'detalle'] as const,
  detalle: (id: string) => [...PARCELAS_KEYS.detalles(), id] as const,
};

/**
 * @description Hook para listar parcelas con soporte de filtros y paginación.
 */
export function useParcelasQuery(filtros: FiltrosParcelasParams = {}) {
  return useQuery({
    queryKey: PARCELAS_KEYS.lista(filtros),
    queryFn: async (): Promise<RespuestaPaginadaParcelas> => {
      const params = new URLSearchParams();
      if (filtros.busqueda) params.append('busqueda', filtros.busqueda);
      if (filtros.cultivoId) params.append('cultivoId', filtros.cultivoId);
      if (filtros.estado) params.append('estado', filtros.estado);
      if (filtros.usuarioResponsableId) params.append('usuarioResponsableId', filtros.usuarioResponsableId);
      if (filtros.pagina) params.append('pagina', String(filtros.pagina));
      if (filtros.limite) params.append('limite', String(filtros.limite));

      const respuesta = await apiClient.get<RespuestaPaginadaParcelas>(`/parcelas?${params.toString()}`);
      return respuesta.data;
    },
  });
}

/**
 * @description Hook para obtener una parcela específica por ID.
 */
export function useParcelaPorIdQuery(id: string) {
  return useQuery({
    queryKey: PARCELAS_KEYS.detalle(id),
    queryFn: async (): Promise<ParcelaItem> => {
      const respuesta = await apiClient.get<ParcelaItem>(`/parcelas/${id}`);
      return respuesta.data;
    },
    enabled: Boolean(id),
  });
}

/**
 * @description Hook para registrar una nueva parcela.
 */
export function useCrearParcelaMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (datos: CrearParcelaInput): Promise<ParcelaItem> => {
      const respuesta = await apiClient.post<ParcelaItem>('/parcelas', datos);
      return respuesta.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PARCELAS_KEYS.todas });
    },
  });
}

/**
 * @description Hook para actualizar una parcela existente.
 */
export function useActualizarParcelaMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, datos }: { id: string; datos: ActualizarParcelaInput }): Promise<ParcelaItem> => {
      const respuesta = await apiClient.put<ParcelaItem>(`/parcelas/${id}`, datos);
      return respuesta.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: PARCELAS_KEYS.detalle(variables.id) });
      queryClient.invalidateQueries({ queryKey: PARCELAS_KEYS.listas() });
    },
  });
}

/**
 * @description Hook para cambiar el estado de una parcela.
 */
export function useCambiarEstadoParcelaMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, estado }: { id: string; estado: EstadoParcelaTipo }): Promise<ParcelaItem> => {
      const respuesta = await apiClient.patch<ParcelaItem>(`/parcelas/${id}/estado`, { estado });
      return respuesta.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PARCELAS_KEYS.todas });
    },
  });
}

/**
 * @description Hook para eliminar lógicamente una parcela.
 */
export function useEliminarParcelaMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string): Promise<void> => {
      await apiClient.delete(`/parcelas/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PARCELAS_KEYS.todas });
    },
  });
}
