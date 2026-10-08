import axios from 'axios';
import { Platform } from 'react-native';

/**
 * @description Obtiene la URL base adecuada según la plataforma (Web, Emulador Android, Dispositivo físico).
 */
const getBaseUrl = (): string => {
  if (Platform.OS === 'android') {
    // En emulador Android 10.0.2.2 es el host localhost
    return process.env.EXPO_PUBLIC_API_URL_ANDROID || 'http://10.0.2.2:3001/api/v1';
  }
  return process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3001/api/v1';
};

export const apiClient = axios.create({
  baseURL: getBaseUrl(),
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 15000,
});

/**
 * @description Interceptor para inyectar token JWT de sesión activa en cada petición.
 */
apiClient.interceptors.request.use((config) => {
  try {
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

