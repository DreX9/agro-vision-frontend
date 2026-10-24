import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { TipoActividadTipo } from '../types/actividad.types';

export interface SubtareaOperador {
  id: string;
  actividadId: string;
  titulo: string;
  completada: boolean;
  completadaPor?: string;
  completadaEn?: string; // ISO date
}

export type TipoHallazgoJornada =
  | 'PLAGA'
  | 'RIEGO'
  | 'MALEZA'
  | 'HERRAMIENTA'
  | 'SEGURIDAD'
  | 'OTRO';

export type SeveridadHallazgo = 'BAJA' | 'MEDIA' | 'ALTA';

export interface HallazgoJornada {
  id: string;
  actividadId: string;
  tipo: TipoHallazgoJornada;
  severidad: SeveridadHallazgo;
  descripcion: string;
  referenciaCampo?: string;
  latitud?: number;
  longitud?: number;
  reportadoPor: string;
  reportadoEn: string; // ISO date
}

export interface PuntoAvanceJornada {
  actividadId: string;
  latitud: number;
  longitud: number;
  referencia: string;
  observacion?: string;
  guardadoPor: string;
  guardadoEn: string; // ISO date
}

export interface OperadorJornadaState {
  // Diccionario de subtareas por actividadId
  subtareasPorActividad: Record<string, SubtareaOperador[]>;
  // Lista de hallazgos por actividadId
  hallazgosPorActividad: Record<string, HallazgoJornada[]>;
  // Último punto de corte/avance por actividadId
  puntosAvancePorActividad: Record<string, PuntoAvanceJornada>;

  // Métodos
  obtenerSubtareas: (actividadId: string, tipo: TipoActividadTipo) => SubtareaOperador[];
  toggleSubtarea: (actividadId: string, subtareaId: string, usuarioNombre: string) => void;
  agregarSubtarea: (actividadId: string, titulo: string) => void;
  eliminarSubtarea: (actividadId: string, subtareaId: string) => void;

  agregarHallazgo: (
    actividadId: string,
    hallazgo: Omit<HallazgoJornada, 'id' | 'actividadId' | 'reportadoEn'>,
  ) => HallazgoJornada;
  eliminarHallazgo: (actividadId: string, hallazgoId: string) => void;

  guardarPuntoAvance: (
    actividadId: string,
    punto: Omit<PuntoAvanceJornada, 'actividadId' | 'guardadoEn'>,
  ) => void;
}

const SUBTAREAS_PREDETERMINADAS: Record<string, string[]> = {
  PODA: [
    'Desinfección de herramientas (tijeras, serrucho con solución fungicida)',
    'Eliminación de ramas secas, chupones y ramas cruzadas',
    'Sellado de cortes principales con pasta cicatrizante',
    'Recojo y acopio de restos vegetales fuera del área de cultivo',
  ],
  FERTILIZACION: [
    'Verificación de insumos, dosis y calibración de balanzas / equipos',
    'Distribución y aplicación homogénea en el sector programado',
    'Incorporación / tapado del fertilizante si aplica',
    'Lavado de equipos de aplicación y resguardo en almacén',
  ],
  RIEGO: [
    'Apertura e inspección de válvulas en cabezal de riego',
    'Medición de presiones operativas en línea y cola',
    'Detección y reparación de fugas o goteros obstruidos',
    'Cierre y purga del sector al completar la lámina programada',
  ],
  FITOSANIDAD: [
    'Colocación obligatoria de EPP completo (mameluco, máscara, guantes)',
    'Calibración de boquillas y preparación del caldo fitosanitario',
    'Aplicación foliar uniforme según dirección del viento',
    'Triple lavado de envases vacíos e inutilización',
  ],
  COSECHA: [
    'Verificación de criterios de madurez y descarte de frutos con daño',
    'Corte cuidadoso preservando el pedúnculo',
    'Acomodo en jabas / bines sin sobrellenado para evitar magulladuras',
    'Conteo de jabas y traslado a punto de acopio techado',
  ],
  DESHIERBE: [
    'Extracción de malezas en la hilera del cultivo',
    'Cuidado estricto de mangueras de goteo y raíces superficiales',
    'Retiro y amontonamiento de maleza fuera del lote',
  ],
  DEFAULT: [
    'Inspección inicial y delimitación del sector de trabajo',
    'Ejecución de la labor agronómica según prescripción',
    'Verificación de orden, limpieza y calidad de la tarea',
    'Cierre de jornada y reporte de novedades al supervisor',
  ],
};

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
 * @description Store global persistente para la bitácora operativa de la jornada del operador.
 * Gestiona checklist de subtareas, hallazgos de campo y puntos GPS de avance de turno.
 */
export const useOperadorJornadaStore = create<OperadorJornadaState>()(
  persist(
    (set, get) => ({
      subtareasPorActividad: {},
      hallazgosPorActividad: {},
      puntosAvancePorActividad: {},

      obtenerSubtareas: (actividadId: string, tipo: TipoActividadTipo) => {
        const estado = get();
        const existentes = estado.subtareasPorActividad[actividadId];
        if (existentes && existentes.length > 0) {
          return existentes;
        }

        // Inicializar con la plantilla correspondiente
        const tipoClave = String(tipo).toUpperCase();
        const titulos =
          SUBTAREAS_PREDETERMINADAS[tipoClave] || SUBTAREAS_PREDETERMINADAS.DEFAULT;

        const nuevas: SubtareaOperador[] = titulos.map((titulo, idx) => ({
          id: `${actividadId}-sub-${idx}-${Date.now()}`,
          actividadId,
          titulo,
          completada: false,
        }));

        set((state) => ({
          subtareasPorActividad: {
            ...state.subtareasPorActividad,
            [actividadId]: nuevas,
          },
        }));

        return nuevas;
      },

      toggleSubtarea: (actividadId: string, subtareaId: string, usuarioNombre: string) => {
        set((state) => {
          const actuales = state.subtareasPorActividad[actividadId] || [];
          const actualizadas = actuales.map((sub) => {
            if (sub.id !== subtareaId) return sub;
            const nuevoEstado = !sub.completada;
            return {
              ...sub,
              completada: nuevoEstado,
              completadaPor: nuevoEstado ? usuarioNombre : undefined,
              completadaEn: nuevoEstado ? new Date().toISOString() : undefined,
            };
          });

          return {
            subtareasPorActividad: {
              ...state.subtareasPorActividad,
              [actividadId]: actualizadas,
            },
          };
        });
      },

      agregarSubtarea: (actividadId: string, titulo: string) => {
        if (!titulo.trim()) return;

        set((state) => {
          const actuales = state.subtareasPorActividad[actividadId] || [];
          const nueva: SubtareaOperador = {
            id: `custom-${Date.now()}`,
            actividadId,
            titulo: titulo.trim(),
            completada: false,
          };

          return {
            subtareasPorActividad: {
              ...state.subtareasPorActividad,
              [actividadId]: [...actuales, nueva],
            },
          };
        });
      },

      eliminarSubtarea: (actividadId: string, subtareaId: string) => {
        set((state) => {
          const actuales = state.subtareasPorActividad[actividadId] || [];
          return {
            subtareasPorActividad: {
              ...state.subtareasPorActividad,
              [actividadId]: actuales.filter((s) => s.id !== subtareaId),
            },
          };
        });
      },

      agregarHallazgo: (actividadId, datos) => {
        const nuevo: HallazgoJornada = {
          ...datos,
          id: `hallazgo-${Date.now()}`,
          actividadId,
          reportadoEn: new Date().toISOString(),
        };

        set((state) => {
          const actuales = state.hallazgosPorActividad[actividadId] || [];
          return {
            hallazgosPorActividad: {
              ...state.hallazgosPorActividad,
              [actividadId]: [nuevo, ...actuales],
            },
          };
        });

        return nuevo;
      },

      eliminarHallazgo: (actividadId: string, hallazgoId: string) => {
        set((state) => {
          const actuales = state.hallazgosPorActividad[actividadId] || [];
          return {
            hallazgosPorActividad: {
              ...state.hallazgosPorActividad,
              [actividadId]: actuales.filter((h) => h.id !== hallazgoId),
            },
          };
        });
      },

      guardarPuntoAvance: (actividadId, punto) => {
        const nuevo: PuntoAvanceJornada = {
          ...punto,
          actividadId,
          guardadoEn: new Date().toISOString(),
        };

        set((state) => ({
          puntosAvancePorActividad: {
            ...state.puntosAvancePorActividad,
            [actividadId]: nuevo,
          },
        }));
      },
    }),
    {
      name: 'agro_vision_operador_jornada',
      storage: createJSONStorage(() => storageSeguro),
    },
  ),
);
