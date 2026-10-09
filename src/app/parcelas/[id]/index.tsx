import React from 'react';
import { useLocalSearchParams } from 'expo-router';
import { DetalleParcelaContainer } from '@/features/parcelas';

/**
 * @description Ruta dedicada para la ficha técnica agronómica y visualización satelital de una parcela.
 */
export default function DetalleParcelaScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <DetalleParcelaContainer id={id || ''} />;
}
