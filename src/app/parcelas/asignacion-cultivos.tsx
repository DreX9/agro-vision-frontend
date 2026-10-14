import React from 'react';
import { useLocalSearchParams } from 'expo-router';
import { AsignacionCultivosContainer } from '@/features/parcelas';

/**
 * @description Ruta para la asignación y subdivisión satelital de cultivos por sectores dentro de parcelas matrices.
 */
export default function AsignacionCultivosScreen() {
  const { parcelaId } = useLocalSearchParams<{ parcelaId?: string }>();
  return <AsignacionCultivosContainer initialParcelaId={parcelaId} />;
}
