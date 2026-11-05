import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { TipoActividadTipo } from '../types/actividad.types';

export type EstadoTareaOperador = 'PENDIENTE' | 'EN_PROGRESO' | 'COMPLETADA';

export interface SubtareaOperador {
  id: string;
  actividadId: string;
  titulo: string;
  descripcion?: string;
  zonaTrabajo?: string;
  responsableId?: string; // ID del operario asignado por el supervisor
  responsableNombre?: string; // Nombre del operario asignado
  estado?: EstadoTareaOperador;
  completada: boolean;
  completadaPor?: string;
  completadaEn?: string; // ISO date
  iniciadaEn?: string; // ISO date
  creadaPor?: string; // Nombre del supervisor que creó la tarea
  creadaEn?: string; // ISO date
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

export type EstadoZonaOperador = 'PENDIENTE' | 'EN_PROGRESO' | 'COMPLETADA';

export interface AsignacionZonaTrabajador {
  actividadId: string;
  usuarioId: string;
  usuarioNombre: string;
  zonaTrabajo: string;
  rolEnActividad?: string;
  estado: EstadoZonaOperador;
  iniciadoEn?: string;
  completadoEn?: string;
}

export interface OperadorJornadaState {
  // Diccionario de subtareas / tareas por actividadId
  subtareasPorActividad: Record<string, SubtareaOperador[]>;
  // Lista de hallazgos por actividadId
  hallazgosPorActividad: Record<string, HallazgoJornada[]>;
  // Último punto de corte/avance por actividadId
  puntosAvancePorActividad: Record<string, PuntoAvanceJornada>;
  // Zonas de trabajo asignadas a cada operador por actividadId
  zonasTrabajadoresPorActividad: Record<string, AsignacionZonaTrabajador[]>;

  // Métodos de tareas
  obtenerSubtareas: (actividadId: string, tipo?: TipoActividadTipo) => SubtareaOperador[];
  obtenerTareasOperador: (actividadId: string, usuarioId: string) => SubtareaOperador[];
  obtenerSugerenciasTareas: (tipo?: TipoActividadTipo) => string[];
  crearTareaSupervisor: (
    actividadId: string,
    tarea: {
      titulo: string;
      descripcion?: string;
      zonaTrabajo?: string;
      responsableId?: string;
      responsableNombre?: string;
      creadaPor?: string;
    },
  ) => SubtareaOperador;
  iniciarTareaOperador: (actividadId: string, tareaId: string) => void;
  completarTareaOperador: (
    actividadId: string,
    tareaId: string,
    usuarioNombre: string,
  ) => { todasCompletadas: boolean; tareasCompletadas: number; totalTareas: number };
  toggleSubtarea: (
    actividadId: string,
    subtareaId: string,
    usuarioNombre: string,
  ) => { todasCompletadas: boolean; tareasCompletadas: number; totalTareas: number };
  agregarSubtarea: (actividadId: string, titulo: string) => void;
  eliminarSubtarea: (actividadId: string, subtareaId: string) => void;
  obtenerProgresoTareas: (
    actividadId: string,
  ) => { totalTareas: number; tareasCompletadas: number; porcentaje: number; todasCompletadas: boolean };

  agregarHallazgo: (
    actividadId: string,
    hallazgo: Omit<HallazgoJornada, 'id' | 'actividadId' | 'reportadoEn'>,
  ) => HallazgoJornada;
  eliminarHallazgo: (actividadId: string, hallazgoId: string) => void;

  guardarPuntoAvance: (
    actividadId: string,
    punto: Omit<PuntoAvanceJornada, 'actividadId' | 'guardadoEn'>,
  ) => void;

  // Gestión de zonas de trabajo y avance de cuadrilla
  sincronizarZonasDesdeTrabajadores: (
    actividadId: string,
    trabajadores: {
      usuarioId: string;
      nombres: string;
      apellidos: string;
      rolEnActividad?: string | null;
      zonaTrabajo?: string;
    }[],
  ) => AsignacionZonaTrabajador[];

  obtenerEstadoZonaOperador: (
    actividadId: string,
    usuarioId: string,
  ) => AsignacionZonaTrabajador | undefined;

  iniciarZonaOperador: (actividadId: string, usuarioId: string) => void;

  completarZonaOperador: (
    actividadId: string,
    usuarioId: string,
  ) => { todasCompletadas: boolean; zonasCompletadas: number; totalZonas: number };

  obtenerProgresoActividad: (
    actividadId: string,
    totalTrabajadoresFallback?: number,
  ) => { totalZonas: number; zonasCompletadas: number; porcentaje: number; todasCompletadas: boolean };
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
      zonasTrabajadoresPorActividad: {},

      obtenerSubtareas: (actividadId: string, _tipo?: TipoActividadTipo) => {
        const estado = get();
        const existentes = estado.subtareasPorActividad[actividadId];
        if (existentes && existentes.length > 0) {
          return existentes;
        }
        return [];
      },

      obtenerTareasOperador: (actividadId: string, usuarioId: string) => {
        const estado = get();
        const tareas = estado.subtareasPorActividad[actividadId] || [];
        return tareas.filter((t) => t.responsableId === usuarioId);
      },

      obtenerSugerenciasTareas: (tipo?: TipoActividadTipo) => {
        if (!tipo) return SUBTAREAS_PREDETERMINADAS.DEFAULT;
        const clave = String(tipo).toUpperCase();
        return SUBTAREAS_PREDETERMINADAS[clave] || SUBTAREAS_PREDETERMINADAS.DEFAULT;
      },

      crearTareaSupervisor: (actividadId, datos) => {
        const nuevaTarea: SubtareaOperador = {
          id: `tarea-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
          actividadId,
          titulo: datos.titulo.trim(),
          descripcion: datos.descripcion?.trim() || undefined,
          zonaTrabajo: datos.zonaTrabajo?.trim() || undefined,
          responsableId: datos.responsableId || undefined,
          responsableNombre: datos.responsableNombre || undefined,
          estado: 'PENDIENTE',
          completada: false,
          creadaPor: datos.creadaPor || undefined,
          creadaEn: new Date().toISOString(),
        };

        set((state) => {
          const actuales = state.subtareasPorActividad[actividadId] || [];
          return {
            subtareasPorActividad: {
              ...state.subtareasPorActividad,
              [actividadId]: [...actuales, nuevaTarea],
            },
          };
        });

        return nuevaTarea;
      },

      iniciarTareaOperador: (actividadId, tareaId) => {
        set((state) => {
          const actuales = state.subtareasPorActividad[actividadId] || [];
          const actualizadas = actuales.map((t) => {
            if (t.id !== tareaId) return t;
            return {
              ...t,
              estado: 'EN_PROGRESO' as const,
              iniciadaEn: t.iniciadaEn || new Date().toISOString(),
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

      completarTareaOperador: (actividadId, tareaId, usuarioNombre) => {
        let todasCompletadas = false;
        let tareasCompletadas = 0;
        let totalTareas = 0;

        set((state) => {
          const actuales = state.subtareasPorActividad[actividadId] || [];
          const actualizadas = actuales.map((t) => {
            if (t.id !== tareaId) return t;
            return {
              ...t,
              completada: true,
              estado: 'COMPLETADA' as const,
              completadaPor: usuarioNombre,
              completadaEn: new Date().toISOString(),
            };
          });

          totalTareas = actualizadas.length;
          tareasCompletadas = actualizadas.filter((t) => t.completada || t.estado === 'COMPLETADA').length;
          todasCompletadas = totalTareas > 0 && tareasCompletadas === totalTareas;

          return {
            subtareasPorActividad: {
              ...state.subtareasPorActividad,
              [actividadId]: actualizadas,
            },
          };
        });

        return { todasCompletadas, tareasCompletadas, totalTareas };
      },

      toggleSubtarea: (actividadId: string, subtareaId: string, usuarioNombre: string) => {
        let todasCompletadas = false;
        let tareasCompletadas = 0;
        let totalTareas = 0;

        set((state) => {
          const actuales = state.subtareasPorActividad[actividadId] || [];
          const actualizadas = actuales.map((sub) => {
            if (sub.id !== subtareaId) return sub;
            const nuevoEstado = !sub.completada;
            return {
              ...sub,
              completada: nuevoEstado,
              estado: (nuevoEstado ? 'COMPLETADA' : 'PENDIENTE') as EstadoTareaOperador,
              completadaPor: nuevoEstado ? usuarioNombre : undefined,
              completadaEn: nuevoEstado ? new Date().toISOString() : undefined,
            };
          });

          totalTareas = actualizadas.length;
          tareasCompletadas = actualizadas.filter((t) => t.completada || t.estado === 'COMPLETADA').length;
          todasCompletadas = totalTareas > 0 && tareasCompletadas === totalTareas;

          return {
            subtareasPorActividad: {
              ...state.subtareasPorActividad,
              [actividadId]: actualizadas,
            },
          };
        });

        return { todasCompletadas, tareasCompletadas, totalTareas };
      },

      obtenerProgresoTareas: (actividadId: string) => {
        const tareas = get().subtareasPorActividad[actividadId] || [];
        const total = tareas.length;
        const completadas = tareas.filter((t) => t.completada || t.estado === 'COMPLETADA').length;
        const porcentaje = total > 0 ? Math.round((completadas / total) * 100) : 0;
        const todasCompletadas = total > 0 && completadas === total;

        return { totalTareas: total, tareasCompletadas: completadas, porcentaje, todasCompletadas };
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

      sincronizarZonasDesdeTrabajadores: (actividadId, trabajadores) => {
        const estado = get();
        const existentes = estado.zonasTrabajadoresPorActividad[actividadId] || [];
        const mapaExistentes = new Map(existentes.map((z) => [z.usuarioId, z]));

        const actualizadas: AsignacionZonaTrabajador[] = trabajadores.map((t, idx) => {
          const prev = mapaExistentes.get(t.usuarioId);
          // Parsear rol y zona si rolEnActividad contiene ' • '
          const partes = (t.rolEnActividad || '').split(' • ');
          const rol = partes[0] || 'Operador de campo';
          const zonaParseada = partes.length > 1 ? partes.slice(1).join(' • ') : undefined;
          const zonaDefinitiva =
            t.zonaTrabajo?.trim() ||
            zonaParseada ||
            prev?.zonaTrabajo ||
            `Zona Operativa ${idx + 1}`;

          const nombreCompleto = `${t.nombres} ${t.apellidos}`.trim();

          if (prev) {
            return {
              ...prev,
              usuarioNombre: nombreCompleto,
              zonaTrabajo: zonaDefinitiva,
              rolEnActividad: rol,
            };
          }

          return {
            actividadId,
            usuarioId: t.usuarioId,
            usuarioNombre: nombreCompleto,
            zonaTrabajo: zonaDefinitiva,
            rolEnActividad: rol,
            estado: 'PENDIENTE',
          };
        });

        set((state) => ({
          zonasTrabajadoresPorActividad: {
            ...state.zonasTrabajadoresPorActividad,
            [actividadId]: actualizadas,
          },
        }));

        return actualizadas;
      },

      obtenerEstadoZonaOperador: (actividadId, usuarioId) => {
        const zonas = get().zonasTrabajadoresPorActividad[actividadId] || [];
        return zonas.find((z) => z.usuarioId === usuarioId);
      },

      iniciarZonaOperador: (actividadId, usuarioId) => {
        set((state) => {
          const actuales = state.zonasTrabajadoresPorActividad[actividadId] || [];
          const actualizadas = actuales.map((z) => {
            if (z.usuarioId !== usuarioId) return z;
            return {
              ...z,
              estado: 'EN_PROGRESO' as const,
              iniciadoEn: z.iniciadoEn || new Date().toISOString(),
            };
          });

          return {
            zonasTrabajadoresPorActividad: {
              ...state.zonasTrabajadoresPorActividad,
              [actividadId]: actualizadas,
            },
          };
        });
      },

      completarZonaOperador: (actividadId, usuarioId) => {
        let todasCompletadas = false;
        let zonasCompletadas = 0;
        let totalZonas = 0;

        set((state) => {
          const actuales = state.zonasTrabajadoresPorActividad[actividadId] || [];
          const actualizadas = actuales.map((z) => {
            if (z.usuarioId !== usuarioId) return z;
            return {
              ...z,
              estado: 'COMPLETADA' as const,
              completadoEn: new Date().toISOString(),
            };
          });

          totalZonas = actualizadas.length;
          zonasCompletadas = actualizadas.filter((z) => z.estado === 'COMPLETADA').length;
          todasCompletadas = totalZonas > 0 && zonasCompletadas === totalZonas;

          return {
            zonasTrabajadoresPorActividad: {
              ...state.zonasTrabajadoresPorActividad,
              [actividadId]: actualizadas,
            },
          };
        });

        return { todasCompletadas, zonasCompletadas, totalZonas };
      },

      obtenerProgresoActividad: (actividadId, totalTrabajadoresFallback) => {
        const zonas = get().zonasTrabajadoresPorActividad[actividadId] || [];
        const total = zonas.length > 0 ? zonas.length : totalTrabajadoresFallback || 0;
        const completadas = zonas.filter((z) => z.estado === 'COMPLETADA').length;
        const porcentaje = total > 0 ? Math.round((completadas / total) * 100) : 0;
        const todasCompletadas = total > 0 && completadas === total;

        return {
          totalZonas: total,
          zonasCompletadas: completadas,
          porcentaje,
          todasCompletadas,
        };
      },
    }),
    {
      name: 'agro_vision_operador_jornada',
      storage: createJSONStorage(() => storageSeguro),
    },
  ),
);
