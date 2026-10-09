import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export interface UIState {
  sidebarColapsado: boolean;
  submenuParcelasAbierto: boolean;
  toggleSidebarColapsado: () => void;
  setSidebarColapsado: (colapsado: boolean) => void;
  toggleSubmenuParcelas: () => void;
  setSubmenuParcelasAbierto: (abierto: boolean) => void;
}

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
 * @description Store global de Zustand para el estado de la interfaz de usuario (Sidebar y menús).
 */
export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      sidebarColapsado: false,
      submenuParcelasAbierto: true,

      toggleSidebarColapsado: () =>
        set((state) => ({ sidebarColapsado: !state.sidebarColapsado })),

      setSidebarColapsado: (colapsado: boolean) =>
        set({ sidebarColapsado: colapsado }),

      toggleSubmenuParcelas: () =>
        set((state) => ({ submenuParcelasAbierto: !state.submenuParcelasAbierto })),

      setSubmenuParcelasAbierto: (abierto: boolean) =>
        set({ submenuParcelasAbierto: abierto }),
    }),
    {
      name: 'agro_vision_ui',
      storage: createJSONStorage(() => storageSeguro),
    },
  ),
);
