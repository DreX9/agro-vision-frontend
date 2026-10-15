import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Card } from '@/shared/components/ui/card';

/**
 * @description Skeleton de carga para el módulo de diagnóstico por visión computacional.
 */
export const DiagnosticoSkeleton: React.FC = () => {
  return (
    <Card estilo={styles.contenedor}>
      <View style={styles.filaCabecera}>
        <View style={styles.cajaTextoTitulo} />
        <View style={styles.cajaBadge} />
      </View>
      <View style={styles.cajaSaludSkeleton} />
      <View style={styles.cajaLineaCorta} />
      <View style={styles.filaChipsSkeleton}>
        <View style={styles.chipSkeleton} />
        <View style={styles.chipSkeleton} />
      </View>
      <View style={styles.cajaRecomendacionSkeleton} />
      <View style={styles.cajaRecomendacionSkeleton} />
    </Card>
  );
};

const styles = StyleSheet.create({
  contenedor: {
    padding: 22,
    gap: 16,
  },
  filaCabecera: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cajaTextoTitulo: {
    width: 140,
    height: 18,
    borderRadius: 6,
    backgroundColor: '#E2E8F0',
  },
  cajaBadge: {
    width: 90,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#E2E8F0',
  },
  cajaSaludSkeleton: {
    width: '100%',
    height: 60,
    borderRadius: 10,
    backgroundColor: '#F1F5F9',
  },
  cajaLineaCorta: {
    width: 180,
    height: 16,
    borderRadius: 6,
    backgroundColor: '#E2E8F0',
  },
  filaChipsSkeleton: {
    flexDirection: 'row',
    gap: 8,
  },
  chipSkeleton: {
    width: 110,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#E2E8F0',
  },
  cajaRecomendacionSkeleton: {
    width: '100%',
    height: 38,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
  },
});
