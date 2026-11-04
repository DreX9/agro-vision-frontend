import axios from 'axios';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { obtenerHostPersonalizado, formatearBaseUrlBackend } from '../stores/servidor.store';

/**
 * @description Obtiene el host dinámico asignado por Metro / Expo bundler (IP local o localhost)
 */
export const getDynamicHost = (): string | null => {
  const hostUri =
    Constants.expoConfig?.hostUri ??
    (Constants as any).manifest2?.extra?.expoGo?.debuggerHost ??
    (Constants as any).manifest?.debuggerHost;

  if (hostUri) {
    const host = hostUri.split(':')[0];
    if (host) return host;
  }
  return null;
};

/**
 * @description Obtiene la URL base adecuada según la plataforma (Web, Emulador Android, Dispositivo físico).
 */
export const getBaseUrl = (): string => {
  // 0. Si el usuario configuró una IP manual de servidor en la pantalla de inicio
  const hostPersonalizado = obtenerHostPersonalizado();
  const urlPersonalizada = formatearBaseUrlBackend(hostPersonalizado);
  if (urlPersonalizada) {
    return urlPersonalizada;
  }

  if (Platform.OS === 'web') {
    return process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3001/api/v1';
  }

  // Si hay una URL HTTPS configurada explícitamente (ej. tunnel ngrok o producción)
  if (process.env.EXPO_PUBLIC_API_URL_ANDROID?.startsWith('https://')) {
    return process.env.EXPO_PUBLIC_API_URL_ANDROID;
  }

  // 1. Detección automática en desarrollo: IP del servidor Metro donde corre Expo Go
  const dynamicHost = getDynamicHost();
  if (dynamicHost) {
    return `http://${dynamicHost}:3001/api/v1`;
  }

  // 2. Si hay variable de entorno configurada
  if (process.env.EXPO_PUBLIC_API_URL_ANDROID) {
    return process.env.EXPO_PUBLIC_API_URL_ANDROID;
  }

  // 3. Fallback: Emulador Android usa 10.0.2.2 para acceder al localhost del host
  if (Platform.OS === 'android') {
    return 'http://10.0.2.2:3001/api/v1';
  }

  return process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3001/api/v1';
};

const resolvedBaseUrl = getBaseUrl();
if (__DEV__) {
  console.log(`[AgroVision Backend] URL Base conectada: ${resolvedBaseUrl}`);
}

export const apiClient = axios.create({
  baseURL: resolvedBaseUrl,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 15000,
});

/**
 * @description Interceptor para inyectar dinámicamente el host del servidor y el token JWT de sesión.
 */
apiClient.interceptors.request.use((config) => {
  try {
    const hostPersonalizado = obtenerHostPersonalizado();
    const urlPersonalizada = formatearBaseUrlBackend(hostPersonalizado);
    if (urlPersonalizada) {
      config.baseURL = urlPersonalizada;
    }

    // Importación dinámica o acceso seguro al store sin dependencias circulares
    const authStoreData =
      typeof window !== 'undefined' && window.localStorage
        ? window.localStorage.getItem('agro_vision_auth')
        : null;

    if (authStoreData) {
      const parsed = JSON.parse(authStoreData);
      const token = parsed?.state?.accessToken;
      if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
  } catch {
    // Si no se puede parsear, continuar sin cabecera Authorization
  }
  return config;
});

/**
 * @description Interceptor de respuesta para manejar tokens vencidos o accesos no autorizados.
 */
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.removeItem('agro_vision_auth');
      }
    }
    return Promise.reject(error);
  },
);
