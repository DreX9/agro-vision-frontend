import axios from 'axios';
import { useMutation, useQuery, useQueryClient, UseMutationResult } from '@tanstack/react-query';
import { Platform } from 'react-native';
import { apiClient, getDynamicHost } from '@/shared/api/api-client';
import {
  DiagnosticoRespuesta,
  DiagnosticoCampoItem,
  CrearDiagnosticoPayload,
  FiltrosDiagnosticosParams,
  RespuestaPaginadaDiagnosticos,
} from '../types/diagnostico.types';

export const DIAGNOSTICOS_KEYS = {
  todos: ['diagnosticos'] as const,
  listas: () => [...DIAGNOSTICOS_KEYS.todos, 'lista'] as const,
  lista: (filtros: FiltrosDiagnosticosParams) => [...DIAGNOSTICOS_KEYS.listas(), filtros] as const,
};

/**
 * @description Obtiene la URL del microservicio de Visión Computacional (FastAPI) según la plataforma.
 */
const getAiBaseUrl = (): string => {
  if (Platform.OS === 'web') {
    return process.env.EXPO_PUBLIC_AI_API_URL || 'http://127.0.0.1:8000/api/v1';
  }

  if (process.env.EXPO_PUBLIC_AI_API_URL_ANDROID?.startsWith('https://')) {
    return process.env.EXPO_PUBLIC_AI_API_URL_ANDROID;
  }

  const dynamicHost = getDynamicHost();
  if (dynamicHost) {
    return `http://${dynamicHost}:8000/api/v1`;
  }

  if (process.env.EXPO_PUBLIC_AI_API_URL_ANDROID) {
    return process.env.EXPO_PUBLIC_AI_API_URL_ANDROID;
  }

  if (Platform.OS === 'android') {
    return 'http://10.0.2.2:8000/api/v1';
  }

  return process.env.EXPO_PUBLIC_AI_API_URL || 'http://127.0.0.1:8000/api/v1';
};

const resolvedAiBaseUrl = getAiBaseUrl();
if (__DEV__) {
  console.log(`[AgroVision AI] URL Base conectada: ${resolvedAiBaseUrl}`);
}

const aiApiClient = axios.create({
  baseURL: resolvedAiBaseUrl,
  timeout: 30000,
});

/**
 * @description Envía una imagen (Blob o FormData) al motor de inferencia de Agro Vision AI en el puerto 8000.
 * @param archivoFormData Datos del archivo empaquetados en FormData.
 * @returns Diagnóstico fitosanitario estructurado con detecciones y recomendaciones.
 */
export const analizarImagenPlanta = async (
  archivoFormData: FormData,
): Promise<DiagnosticoRespuesta> => {
  const respuesta = await aiApiClient.post<DiagnosticoRespuesta>(
    '/diagnosticos/analizar-imagen',
    archivoFormData,
    {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    },
  );
  return respuesta.data;
};

/**
 * @description Hook de mutación TanStack Query para ejecutar el escaneo de imagen en tiempo real con IA.
 */
export const useEscanearImagenMutation = (): UseMutationResult<
  DiagnosticoRespuesta,
  Error,
  FormData
> => {
  return useMutation({
    mutationFn: analizarImagenPlanta,
  });
};

/**
 * @description Guarda en PostgreSQL el diagnóstico fitosanitario con coordenadas del dron, parcela y sector.
 */
export const guardarDiagnosticoCampo = async (
  payload: CrearDiagnosticoPayload,
): Promise<DiagnosticoCampoItem> => {
  const respuesta = await apiClient.post<DiagnosticoCampoItem>('/diagnosticos', payload);
  return respuesta.data;
};

/**
 * @description Hook de mutación para persistir el diagnóstico fitosanitario en base de datos.
 */
export const useGuardarDiagnosticoMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: guardarDiagnosticoCampo,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: DIAGNOSTICOS_KEYS.todos });
    },
  });
};

/**
 * @description Hook para consultar el historial de diagnósticos fitosanitarios georreferenciados.
 */
export const useDiagnosticosQuery = (filtros: FiltrosDiagnosticosParams = {}) => {
  return useQuery({
    queryKey: DIAGNOSTICOS_KEYS.lista(filtros),
    queryFn: async (): Promise<RespuestaPaginadaDiagnosticos> => {
      const params = new URLSearchParams();
      if (filtros.parcelaId) params.append('parcelaId', filtros.parcelaId);
      if (filtros.sectorId) params.append('sectorId', filtros.sectorId);
      if (filtros.estadoGeneral) params.append('estadoGeneral', filtros.estadoGeneral);
      if (filtros.pagina) params.append('pagina', String(filtros.pagina));
      if (filtros.limite) params.append('limite', String(filtros.limite));

      const respuesta = await apiClient.get<RespuestaPaginadaDiagnosticos>(
        `/diagnosticos?${params.toString()}`,
      );
      return respuesta.data;
    },
  });
};
