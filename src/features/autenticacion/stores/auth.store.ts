import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { UsuarioSesion } from '../types/autenticacion.types';

export interface AuthState {
  usuario: UsuarioSesion | null;
  accessToken: string | null;
  refreshToken: string | null;
  estaAutenticado: boolean;
  recordarSesion: boolean;
  establecerSesion: (sesion: UsuarioSesion, recordar?: boolean) => void;
  cerrarSesion: () => void;
}

/**
 * @description Storage multiplataforma seguro para persistencia en Web y Native.
 */
const storageSeguro = {
  getItem: (name: string): string | null => {
    if (typeof window !== 'undefined' && window.localStorage) {
      return window.localStorage.getItem(name);
    }
    return null;
  },
  setItem: (name: string, value: string): void => {
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.setItem(name, value);
    }
  },
  removeItem: (name: string): void => {
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.removeItem(name);
    }
  },
};

/**
 * @description Store global de Zustand para gestionar la sesión activa con opción de persistencia.
 */
export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      usuario: null,
      accessToken: null,
      refreshToken: null,
      estaAutenticado: false,
      recordarSesion: true,

      establecerSesion: (sesion: UsuarioSesion, recordar = true) =>
        set({
          usuario: sesion,
          accessToken: sesion.accessToken,
          refreshToken: sesion.refreshToken,
          estaAutenticado: true,
          recordarSesion: recordar,
        }),

      cerrarSesion: () =>
        set({
          usuario: null,
          accessToken: null,
          refreshToken: null,
          estaAutenticado: false,
        }),
    }),
    {
      name: 'agro_vision_auth',
      storage: createJSONStorage(() => storageSeguro),
      partialize: (state) =>
        state.recordarSesion
          ? {
              usuario: state.usuario,
              accessToken: state.accessToken,
              refreshToken: state.refreshToken,
              estaAutenticado: state.estaAutenticado,
              recordarSesion: state.recordarSesion,
            }
          : {
              recordarSesion: false,
            },
    },
  ),
);

