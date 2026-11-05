import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/shared/api/api-client';
import {
  SectorParcelaItem,
  ResumenSectoresParcela,
  CrearSectorParcelaInput,
  ActualizarSectorParcelaInput,
} from '../types/sector-parcela.types';
import { PARCELAS_KEYS } from './parcelas.api';

export const SECTORES_KEYS = {
  todos: ['sectores'] as const,
  resumenPorParcela: (parcelaId?: string) =>
    [...SECTORES_KEYS.todos, 'parcela', parcelaId || ''] as const,
};

/**
 * @description Hook para consultar el balance agronómico y lista de sectores de una parcela.
 */
export function useSectoresPorParcelaQuery(parcelaId?: string) {
  return useQuery({
    queryKey: SECTORES_KEYS.resumenPorParcela(parcelaId),
    queryFn: async (): Promise<ResumenSectoresParcela> => {
      if (!parcelaId) {
        throw new Error('Debe proporcionar un ID de parcela válido');
      }
      const respuesta = await apiClient.get<ResumenSectoresParcela>(
        `/parcelas/${parcelaId}/sectores`,
      );
      return respuesta.data;
    },
    enabled: Boolean(parcelaId),
  });
}

/**
 * @description Hook de mutación para registrar y delimitar un nuevo sector de cultivo.
 */
export function useCrearSectorParcelaMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      parcelaId,
      datos,
    }: {
      parcelaId: string;
      datos: CrearSectorParcelaInput;
    }): Promise<SectorParcelaItem> => {
      const respuesta = await apiClient.post<SectorParcelaItem>(
        `/parcelas/${parcelaId}/sectores`,
        datos,
      );
      return respuesta.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: SECTORES_KEYS.resumenPorParcela(variables.parcelaId),
      });
      queryClient.invalidateQueries({
        queryKey: PARCELAS_KEYS.todas,
      });
    },
  });
}

/**
 * @description Hook de mutación para actualizar las especificaciones o trazado de un sector.
 */
export function useActualizarSectorParcelaMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      parcelaId,
      sectorId,
      datos,
    }: {
      parcelaId: string;
      sectorId: string;
      datos: ActualizarSectorParcelaInput;
    }): Promise<SectorParcelaItem> => {
      const respuesta = await apiClient.put<SectorParcelaItem>(
        `/parcelas/${parcelaId}/sectores/${sectorId}`,
        datos,
      );
      return respuesta.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: SECTORES_KEYS.resumenPorParcela(variables.parcelaId),
      });
    },
  });
}

/**
 * @description Hook de mutación para dar de baja un sector y liberar su superficie.
 */
export function useEliminarSectorParcelaMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      parcelaId,
      sectorId,
    }: {
      parcelaId: string;
      sectorId: string;
    }): Promise<void> => {
      await apiClient.delete(`/parcelas/${parcelaId}/sectores/${sectorId}`);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: SECTORES_KEYS.resumenPorParcela(variables.parcelaId),
      });
      queryClient.invalidateQueries({
        queryKey: PARCELAS_KEYS.todas,
      });
    },
  });
}
