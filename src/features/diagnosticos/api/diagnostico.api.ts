import axios from 'axios';
import { useMutation, UseMutationResult } from '@tanstack/react-query';
import { Platform } from 'react-native';
import { DiagnosticoRespuesta } from '../types/diagnostico.types';

/**
 * @description Obtiene la URL del microservicio de Visión Computacional (FastAPI) según la plataforma.
 */
const getAiBaseUrl = (): string => {
  if (Platform.OS === 'android') {
    return process.env.EXPO_PUBLIC_AI_API_URL_ANDROID || 'http://192.168.100.134:8000/api/v1';
  }
  return process.env.EXPO_PUBLIC_AI_API_URL || 'http://127.0.0.1:8000/api/v1';
};

const aiApiClient = axios.create({
  baseURL: getAiBaseUrl(),
  timeout: 30000,
});

/**
 * @description Envía una imagen (Blob o FormData) al motor de inferencia de Agro Vision AI.
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
 * @description Hook de mutación TanStack Query para ejecutar el escaneo de imagen en tiempo real.
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
