import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/shared/api/api-client';
import {
  Usuario,
  CrearUsuarioPeticion,
  ActualizarUsuarioPeticion,
  FiltroUsuariosPeticion,
  ListaPaginadaUsuarios,
} from '../types/usuario.types';

export const USUARIOS_QUERY_KEY = ['usuarios'] as const;

/**
 * @description Petición HTTP para listar usuarios con filtros.
 */
export const obtenerUsuariosApi = async (
  filtros?: FiltroUsuariosPeticion,
): Promise<ListaPaginadaUsuarios> => {
  const respuesta = await apiClient.get<ListaPaginadaUsuarios>('/usuarios', {
    params: filtros,
  });
  return respuesta.data;
};

/**
 * @description Petición HTTP para obtener un usuario por ID.
 */
export const obtenerUsuarioPorIdApi = async (id: string): Promise<Usuario> => {
  const respuesta = await apiClient.get<Usuario>(`/usuarios/${id}`);
  return respuesta.data;
};

/**
 * @description Petición HTTP para registrar un nuevo usuario.
 */
export const crearUsuarioApi = async (
  datos: CrearUsuarioPeticion,
): Promise<Usuario> => {
  const respuesta = await apiClient.post<Usuario>('/usuarios', datos);
  return respuesta.data;
};

/**
 * @description Petición HTTP para actualizar datos de un usuario existente.
 */
export const actualizarUsuarioApi = async ({
  id,
  datos,
}: {
  id: string;
  datos: ActualizarUsuarioPeticion;
}): Promise<Usuario> => {
  const respuesta = await apiClient.put<Usuario>(`/usuarios/${id}`, datos);
  return respuesta.data;
};

/**
 * @description Petición HTTP para cambiar estado activo/inactivo.
 */
export const cambiarEstadoUsuarioApi = async ({
  id,
  activo,
}: {
  id: string;
  activo: boolean;
}): Promise<Usuario> => {
  const respuesta = await apiClient.patch<Usuario>(`/usuarios/${id}/estado`, {
    activo,
  });
  return respuesta.data;
};

/**
 * @description Petición HTTP para dar de baja lógica a un usuario.
 */
export const eliminarUsuarioApi = async (id: string): Promise<boolean> => {
  const respuesta = await apiClient.delete<{ exito: boolean }>(`/usuarios/${id}`);
  return respuesta.data.exito;
};

/**
 * @description Hook de consulta paginada de usuarios con TanStack Query v5.
 */
export const useUsuariosQuery = (filtros?: FiltroUsuariosPeticion) => {
  return useQuery({
    queryKey: [...USUARIOS_QUERY_KEY, filtros],
    queryFn: () => obtenerUsuariosApi(filtros),
  });
};

/**
 * @description Hook de consulta para obtener un usuario específico por su ID.
 */
export const useUsuarioPorIdQuery = (id?: string) => {
  return useQuery({
    queryKey: [...USUARIOS_QUERY_KEY, id],
    queryFn: () => obtenerUsuarioPorIdApi(id!),
    enabled: Boolean(id),
  });
};

/**
 * @description Hook de mutación para registrar un usuario e invalidar caché.
 */
export const useCrearUsuarioMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (datos: CrearUsuarioPeticion) => crearUsuarioApi(datos),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: USUARIOS_QUERY_KEY });
    },
  });
};

/**
 * @description Hook de mutación para actualizar un usuario existente.
 */
export const useActualizarUsuarioMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, datos }: { id: string; datos: ActualizarUsuarioPeticion }) =>
      actualizarUsuarioApi({ id, datos }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: USUARIOS_QUERY_KEY });
    },
  });
};

/**
 * @description Hook de mutación para activar/desactivar usuario con actualización reactiva.
 */
export const useCambiarEstadoUsuarioMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, activo }: { id: string; activo: boolean }) =>
      cambiarEstadoUsuarioApi({ id, activo }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: USUARIOS_QUERY_KEY });
    },
  });
};

/**
 * @description Hook de mutación para eliminar usuario e invalidar caché.
 */
export const useEliminarUsuarioMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => eliminarUsuarioApi(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: USUARIOS_QUERY_KEY });
    },
  });
};

