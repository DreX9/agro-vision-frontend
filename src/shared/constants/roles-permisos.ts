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
      'Gestión agronómica del fundo, asignación técnica de cultivos y evaluación fitosanitaria.',
    responsabilidades: [
      'Consulta y monitoreo de parcelas y lotes en el mapa satelital.',
      'Asignación y zonificación de cultivos y variedades por sector.',
      'Monitoreo fitosanitario y análisis de diagnósticos con visión computacional.',
      'Seguimiento de indicadores agronómicos en el Dashboard.',
    ],
    rutasPermitidas: [
      '/',
      '/parcelas',
      '/parcelas/asignacion-cultivos',
      '/cultivos',
      '/cultivos/nuevo',
      '/diagnostico',
      '/diagnosticos',
    ],
  },
  SUPERVISOR: {
    rol: 'SUPERVISOR',
    etiqueta: 'Supervisor de Campo',
    descripcion:
      'Supervisión de labores y detección fitosanitaria (funciones operativas de cuadrilla en proceso de separación).',
    responsabilidades: [
      'Monitoreo del estado general del fundo desde el Dashboard.',
      'Consulta y registro de diagnósticos fitosanitarios de campo.',
      'En espera de la habilitación de módulos específicos de asignación de cuadrillas.',
    ],
    rutasPermitidas: ['/', '/diagnostico', '/diagnosticos'],
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

  // Restricción explícita: El registro de nuevas parcelas es exclusivo del Administrador
  if (ruta === '/parcelas/nuevo' && rolNormalizado !== 'ADMINISTRADOR') {
    return false;
  }

  // Comprobar coincidencia exacta o jerárquica
  return defRol.rutasPermitidas.some((permitida) => {
    if (permitida === '/') {
      return ruta === '/' || ruta === '/index';
    }
    return ruta === permitida || ruta.startsWith(`${permitida}/`);
  });
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
