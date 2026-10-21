import { RolUsuarioTipo } from '@/features/usuarios/types/usuario.types';

export type RolSistema = RolUsuarioTipo;

export interface DefinicionRol {
  rol: RolSistema;
  etiqueta: string;
  descripcion: string;
  responsabilidades: string[];
  rutasPermitidas: string[];
}

/**
 * @description Matriz oficial de responsabilidades y accesos según directiva de roles.
 * - ADMINISTRADOR: Acceso irrestricto a todas las opciones actuales y futuras.
 * - AGRONOMO: Dashboard, Parcelas (registro y asignación), Cultivos y Diagnósticos.
 * - SUPERVISOR: Dashboard y Diagnósticos (funciones adicionales en preparación).
 * - OPERADOR: Dashboard (preparado para futuras tareas operativas).
 */
export const MATRIZ_ROLES: Record<RolSistema, DefinicionRol> = {
  ADMINISTRADOR: {
    rol: 'ADMINISTRADOR',
    etiqueta: 'Administrador del Sistema',
    descripcion:
      'Control total de la plataforma, mantenimiento de usuarios, trazabilidad, parámetros y catálogos globales.',
    responsabilidades: [
      'Gestión integral de usuarios, altas, bajas y asignación de roles.',
      'Control total de parcelas, cultivos y actividades agrícolas.',
      'Acceso a auditoría, monitoreo de sensores y diagnósticos fitosanitarios con IA.',
      'Acceso habilitado por defecto a todas las nuevas opciones que se incorporen.',
    ],
    rutasPermitidas: ['*'],
  },
  AGRONOMO: {
    rol: 'AGRONOMO',
    etiqueta: 'Ingeniero Agrónomo',
    descripcion:
      'Gestión agronómica del fundo, prescripción técnica de labores y evaluación fitosanitaria.',
    responsabilidades: [
      'Consulta y monitoreo de parcelas y lotes en el mapa satelital.',
      'Asignación y zonificación de cultivos y variedades por sector.',
      'Planificación y prescripción técnica de actividades agrícolas asignando al Supervisor a cargo.',
      'Monitoreo fitosanitario y análisis de diagnósticos con visión computacional.',
      'Seguimiento de indicadores agronómicos en el Dashboard.',
    ],
    rutasPermitidas: [
      '/',
      '/parcelas',
      '/parcelas/asignacion-cultivos',
      '/cultivos',
      '/cultivos/nuevo',
      '/actividades',
      '/actividades/nuevo',
      '/diagnostico',
      '/diagnosticos',
    ],
  },
  SUPERVISOR: {
    rol: 'SUPERVISOR',
    etiqueta: 'Supervisor de Campo',
    descripcion:
      'Conformación de cuadrillas de operarios, asignación de trabajadores y control de labores en terreno.',
    responsabilidades: [
      'Conformación de cuadrillas y asignación de operarios a labores programadas.',
      'Supervisión en campo del cumplimiento de labores y registro de horas trabajadas.',
      'Actualización del estado de actividades (En Progreso / Completada) y reporte de incidencias.',
      'Monitoreo del estado general del fundo desde el Dashboard.',
      'Consulta y registro de diagnósticos fitosanitarios de campo.',
    ],
    rutasPermitidas: ['/', '/actividades', '/diagnostico', '/diagnosticos'],
  },
  OPERADOR: {
    rol: 'OPERADOR',
    etiqueta: 'Operador de Campo / Jornalero',
    descripcion:
      'Ejecutor directo de actividades agronómicas en terreno (riego, poda, aplicación, maquinaria).',
    responsabilidades: [
      'Visualización de indicadores generales de la operación en el Dashboard.',
      'A futuro: panel simplificado de labores asignadas del día y reporte de actividades.',
    ],
    rutasPermitidas: ['/'],
  },
};

/**
 * @description Verifica si un rol determinado tiene permiso para acceder a una ruta específica.
 */
export function tienePermisoRuta(rol: string | undefined | null, ruta: string): boolean {
  const rolNormalizado = (rol || 'OPERADOR') as RolSistema;
  const defRol = MATRIZ_ROLES[rolNormalizado] || MATRIZ_ROLES.OPERADOR;

  // El administrador tiene comodín para todo
  if (defRol.rutasPermitidas.includes('*')) {
    return true;
  }

  // Normalizar la ruta eliminando query params y barras finales redundantes
  const rutaLimpia = (ruta.split('?')[0] || '/').replace(/\/+$/, '') || '/';

  // Restricción explícita: El registro de nuevas parcelas es exclusivo del Administrador
  if (rutaLimpia === '/parcelas/nuevo' && rolNormalizado !== 'ADMINISTRADOR') {
    return false;
  }

  // Restricción explícita: La creación de nuevas actividades está reservada para Administrador y Agrónomo
  if (
    rutaLimpia === '/actividades/nuevo' &&
    rolNormalizado !== 'ADMINISTRADOR' &&
    rolNormalizado !== 'AGRONOMO'
  ) {
    return false;
  }

  // Comprobar coincidencia exacta o jerárquica
  return defRol.rutasPermitidas.some((permitida) => {
    if (permitida === '/') {
      return rutaLimpia === '/' || rutaLimpia === '/index';
    }
    return rutaLimpia === permitida || rutaLimpia.startsWith(`${permitida}/`);
  });
}

/**
 * @description Retorna la lista de roles del sistema con autorización para acceder a una ruta.
 */
export function obtenerRolesPermitidosParaRuta(ruta: string): RolSistema[] {
  const todosLosRoles: RolSistema[] = ['ADMINISTRADOR', 'AGRONOMO', 'SUPERVISOR', 'OPERADOR'];
  return todosLosRoles.filter((rol) => tienePermisoRuta(rol, ruta));
}

/**
 * @description Comprueba si un usuario puede ver un elemento del menú según sus roles permitidos.
 */
export function puedeVerItemMenu(
  rol: string | undefined | null,
  rolesPermitidos?: RolSistema[],
): boolean {
  if (!rolesPermitidos || rolesPermitidos.length === 0) {
    return true;
  }
  const rolNormalizado = (rol || 'OPERADOR') as RolSistema;
  return rolesPermitidos.includes(rolNormalizado);
}
