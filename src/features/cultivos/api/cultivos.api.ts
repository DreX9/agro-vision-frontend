import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/shared/api/api-client';
import { CultivoItem, CrearCultivoInput, ActualizarCultivoInput } from '../types/cultivo.types';

export const CULTIVOS_KEYS = {
  todos: ['cultivos'] as const,
  lista: () => [...CULTIVOS_KEYS.todos, 'lista'] as const,
  detalle: (id: string) => [...CULTIVOS_KEYS.todos, 'detalle', id] as const,
};

/**
 * @description Hook TanStack Query para consultar el catálogo de cultivos activos.
 */
export function useCultivosQuery() {
  return useQuery({
    queryKey: CULTIVOS_KEYS.lista(),
    queryFn: async (): Promise<CultivoItem[]> => {
      const respuesta = await apiClient.get<CultivoItem[]>('/cultivos');
      return respuesta.data;
    },
    staleTime: 1000 * 60 * 5,
  });
}

/**
 * @description Hook para registrar un nuevo cultivo en el catálogo.
 */
export function useCrearCultivoMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (datos: CrearCultivoInput): Promise<CultivoItem> => {
      const respuesta = await apiClient.post<CultivoItem>('/cultivos', datos);
      return respuesta.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CULTIVOS_KEYS.todos });
    },
  });
}

/**
 * @description Hook para actualizar un cultivo existente.
 */
export function useActualizarCultivoMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...datos }: ActualizarCultivoInput): Promise<CultivoItem> => {
      const respuesta = await apiClient.put<CultivoItem>(`/cultivos/${id}`, datos);
      return respuesta.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CULTIVOS_KEYS.todos });
    },
  });
}

/**
 * @description Hook para alternar el estado activo/inactivo de un cultivo.
 */
export function useCambiarEstadoCultivoMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, activo }: { id: string; activo: boolean }): Promise<CultivoItem> => {
      const respuesta = await apiClient.patch<CultivoItem>(`/cultivos/${id}/estado`, { activo });
      return respuesta.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CULTIVOS_KEYS.todos });
    },
  });
}

/**
 * @description Hook para eliminar un cultivo si no tiene dependencias.
 */
export function useEliminarCultivoMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string): Promise<void> => {
      await apiClient.delete(`/cultivos/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CULTIVOS_KEYS.todos });
    },
  });
}
