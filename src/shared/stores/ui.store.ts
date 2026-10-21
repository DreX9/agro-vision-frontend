import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export interface UIState {
  sidebarColapsado: boolean;
  submenuParcelasAbierto: boolean;
  submenusAbiertos: Record<string, boolean>;
  toggleSidebarColapsado: () => void;
  setSidebarColapsado: (colapsado: boolean) => void;
  toggleSubmenuParcelas: () => void;
  setSubmenuParcelasAbierto: (abierto: boolean) => void;
  toggleSubmenu: (ruta: string) => void;
  setSubmenuAbierto: (ruta: string, abierto: boolean) => void;
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
      submenusAbiertos: {
        '/parcelas': true,
        '/cultivos': true,
      },

      toggleSidebarColapsado: () =>
        set((state) => ({ sidebarColapsado: !state.sidebarColapsado })),

      setSidebarColapsado: (colapsado: boolean) =>
        set({ sidebarColapsado: colapsado }),

      toggleSubmenuParcelas: () =>
        set((state) => {
          const nuevo = !state.submenuParcelasAbierto;
          return {
            submenuParcelasAbierto: nuevo,
            submenusAbiertos: { ...state.submenusAbiertos, '/parcelas': nuevo },
          };
        }),

      setSubmenuParcelasAbierto: (abierto: boolean) =>
        set((state) => ({
          submenuParcelasAbierto: abierto,
          submenusAbiertos: { ...state.submenusAbiertos, '/parcelas': abierto },
        })),

      toggleSubmenu: (ruta: string) =>
        set((state) => {
          const actual = state.submenusAbiertos[ruta] ?? true;
          const nuevo = !actual;
          return {
            submenusAbiertos: { ...state.submenusAbiertos, [ruta]: nuevo },
            ...(ruta === '/parcelas' ? { submenuParcelasAbierto: nuevo } : {}),
          };
        }),

      setSubmenuAbierto: (ruta: string, abierto: boolean) =>
        set((state) => ({
          submenusAbiertos: { ...state.submenusAbiertos, [ruta]: abierto },
          ...(ruta === '/parcelas' ? { submenuParcelasAbierto: abierto } : {}),
        })),
    }),
    {
      name: 'agro_vision_ui',
      storage: createJSONStorage(() => storageSeguro),
    },
  ),
);
