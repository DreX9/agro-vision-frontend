import React from 'react';
import { View, StyleSheet } from 'react-native';

/**
 * @description Skeleton de carga para la tabla y fichas de actividades agrícolas.
 */
export const ActividadesSkeleton: React.FC = () => {
  return (
    <View style={styles.contenedor}>
      <View style={styles.encabezadoSkeleton}>
        <View style={styles.buscadorSkeleton} />
        <View style={styles.botonSkeleton} />
      </View>

      <View style={styles.cuerpoTabla}>
        {[1, 2, 3, 4, 5].map((item) => (
          <View key={item} style={styles.fila}>
            <View style={[styles.celda, { width: 85 }]} />
            <View style={[styles.celda, { width: 160 }]} />
            <View style={[styles.celda, { width: 120 }]} />
            <View style={[styles.celda, { width: 100 }]} />
            <View style={[styles.celda, { width: 110 }]} />
            <View style={[styles.celda, { width: 80 }]} />
            <View style={[styles.celda, { width: 30 }]} />
          </View>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  contenedor: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2EBDC',
    padding: 16,
    gap: 16,
  },
  encabezadoSkeleton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
  },
  buscadorSkeleton: {
    height: 40,
    flex: 1,
    maxWidth: 320,
    backgroundColor: '#EAEFE7',
    borderRadius: 8,
  },
  botonSkeleton: {
    width: 140,
    height: 40,
    backgroundColor: '#EAEFE7',
    borderRadius: 8,
  },
  cuerpoTabla: { gap: 12 },
  fila: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F4EC',
  },
  celda: { height: 18, backgroundColor: '#EAEFE7', borderRadius: 4 },
});
