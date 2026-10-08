import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/shared/api/api-client';
import { InsumoItem } from '../types/insumo.types';

export const INSUMOS_KEYS = {
  todos: ['insumos'] as const,
  lista: (categoria?: string) => [...INSUMOS_KEYS.todos, 'lista', categoria] as const,
};

/**
 * @description Hook TanStack Query para consultar el catálogo de insumos y recursos agrícolas.
 */
export function useInsumosQuery(categoria?: string) {
  return useQuery({
    queryKey: INSUMOS_KEYS.lista(categoria),
    queryFn: async (): Promise<InsumoItem[]> => {
      const url = categoria ? `/insumos?categoria=${categoria}` : '/insumos';
      const respuesta = await apiClient.get<InsumoItem[]>(url);
      return respuesta.data;
    },
    staleTime: 1000 * 60 * 10,
  });
}
