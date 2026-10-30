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
