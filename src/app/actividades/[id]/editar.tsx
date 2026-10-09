import React from 'react';
import { useLocalSearchParams } from 'expo-router';
import { EditarActividadContainer } from '@/features/actividades';

/**
 * @description Ruta dedicada para la edición de una actividad agrícola existente.
 */
export default function EditarActividadScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <EditarActividadContainer id={id || ''} />;
}
