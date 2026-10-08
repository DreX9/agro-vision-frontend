import React from 'react';
import { useLocalSearchParams } from 'expo-router';
import { DetalleActividadContainer } from '@/features/actividades';

/**
 * @description Ruta dedicada para la ficha técnica y visualización de cuadrilla/insumos de una actividad.
 */
export default function DetalleActividadScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <DetalleActividadContainer id={id || ''} />;
}
