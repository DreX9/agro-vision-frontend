import React from 'react';
import { useLocalSearchParams } from 'expo-router';
import { DetalleCultivoContainer } from '@/features/cultivos';

/**
 * @description Ruta dedicada para la ficha técnica botánica de un cultivo.
 */
export default function DetalleCultivoScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <DetalleCultivoContainer id={id || ''} />;
}
