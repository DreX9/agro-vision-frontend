import React from 'react';
import { useLocalSearchParams } from 'expo-router';
import { DetalleUsuarioContainer } from '@/features/usuarios';

/**
 * @description Ruta dedicada para la ficha técnica y perfil de un usuario del sistema.
 */
export default function DetalleUsuarioScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <DetalleUsuarioContainer id={id || ''} />;
}
