import React from 'react';
import { useLocalSearchParams } from 'expo-router';
import { EditarParcelaContainer } from '@/features/parcelas';

/**
 * @description Ruta dedicada para la edición de una parcela existente.
 */
export default function EditarParcelaScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <EditarParcelaContainer id={id || ''} />;
}
