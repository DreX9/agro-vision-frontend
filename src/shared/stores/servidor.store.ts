import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = 'agro_vision_server_host';

// Cache síncrono en memoria para que los interceptores de Axios lean el valor sin retraso
let hostEnMemoria: string | null = null;

// Cargar valor persistente de forma asíncrona al iniciar
AsyncStorage.getItem(STORAGE_KEY)
  .then((val) => {
    if (val && val.trim()) {
      hostEnMemoria = val.trim();
      useServidorStore.setState({ hostPersonalizado: hostEnMemoria });
    }
  })
  .catch(() => {});

export interface ServidorState {
  hostPersonalizado: string | null;
  establecerHostPersonalizado: (host: string | null) => Promise<void>;
}

export const useServidorStore = create<ServidorState>((set) => ({
  hostPersonalizado: hostEnMemoria,
  establecerHostPersonalizado: async (host: string | null) => {
    const limpio = host && host.trim().length > 0 ? host.trim() : null;
    hostEnMemoria = limpio;
    if (limpio) {
      await AsyncStorage.setItem(STORAGE_KEY, limpio);
    } else {
      await AsyncStorage.removeItem(STORAGE_KEY);
    }
    set({ hostPersonalizado: limpio });
  },
}));

/**
 * @description Obtiene de forma síncrona la IP o host del backend configurada por el usuario.
 */
export const obtenerHostPersonalizado = (): string | null => {
  return hostEnMemoria || useServidorStore.getState().hostPersonalizado;
};

/**
 * @description Normaliza la IP o dominio introducido por el usuario para construir la URL base de NestJS.
 */
export const formatearBaseUrlBackend = (host: string | null): string | null => {
  if (!host || !host.trim()) return null;
  const h = host.trim().replace(/\/+$/, '');
  if (h.startsWith('http://') || h.startsWith('https://')) {
    return h.endsWith('/api/v1') ? h : `${h}/api/v1`;
  }
  if (h.includes(':')) {
    return `http://${h}/api/v1`;
  }
  return `http://${h}:3001/api/v1`;
};

/**
 * @description Normaliza la IP o dominio introducido por el usuario para construir la URL base de la IA FastAPI.
 */
export const formatearBaseUrlAI = (host: string | null): string | null => {
  if (!host || !host.trim()) return null;
  const h = host.trim().replace(/\/+$/, '');
  if (h.startsWith('http://') || h.startsWith('https://')) {
    return h.endsWith('/api/v1') ? h : `${h}/api/v1`;
  }
  if (h.includes(':')) {
    return `http://${h}/api/v1`;
  }
  return `http://${h}:8000/api/v1`;
};
