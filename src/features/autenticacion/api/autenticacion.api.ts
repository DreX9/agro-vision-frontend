import { useMutation } from '@tanstack/react-query';
import { apiClient } from '@/shared/api/api-client';
import { IniciarSesionPeticion, UsuarioSesion } from '../types/autenticacion.types';
import { useAuthStore } from '../stores/auth.store';

/**
 * @description Petición HTTP para iniciar sesión en la API de Agro Vision.
 */
export const iniciarSesionApi = async (
  credenciales: IniciarSesionPeticion,
): Promise<UsuarioSesion> => {
  const respuesta = await apiClient.post<UsuarioSesion>(
    '/autenticacion/iniciar-sesion',
    credenciales,
  );
  return respuesta.data;
};

/**
 * @description Hook de mutación con TanStack Query v5 para autenticación.
 */
export const useIniciarSesionMutation = () => {
  const establecerSesion = useAuthStore((state) => state.establecerSesion);

  return useMutation({
    mutationFn: (credenciales: IniciarSesionPeticion & { recordarSesion?: boolean }) => {
      const { correo, password } = credenciales;
      return iniciarSesionApi({ correo, password });
    },
    onSuccess: (data, variables) => {
      establecerSesion(data, variables.recordarSesion ?? true);
    },
  });
};
