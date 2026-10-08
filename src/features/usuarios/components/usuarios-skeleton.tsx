import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Palette } from '@/constants/theme';

/**
 * @description Esqueleto de carga visual para la tabla de usuarios.
 */
export const UsuariosSkeleton: React.FC = () => {
  return (
    <View style={styles.contenedor}>
      {/* Encabezado falso */}
      <View style={styles.filaEncabezado}>
        <View style={[styles.bloque, { width: 140, height: 16 }]} />
        <View style={[styles.bloque, { width: 180, height: 16 }]} />
        <View style={[styles.bloque, { width: 100, height: 16 }]} />
        <View style={[styles.bloque, { width: 90, height: 16 }]} />
        <View style={[styles.bloque, { width: 80, height: 16 }]} />
        <View style={[styles.bloque, { width: 90, height: 16 }]} />
      </View>

      {/* Filas falsas */}
      {[1, 2, 3, 4, 5].map((i) => (
        <View key={i} style={styles.fila}>
          <View style={[styles.bloque, { width: 150, height: 20 }]} />
          <View style={[styles.bloque, { width: 200, height: 16 }]} />
          <View style={[styles.bloque, { width: 90, height: 22, borderRadius: 6 }]} />
          <View style={[styles.bloque, { width: 80, height: 16 }]} />
          <View style={[styles.bloque, { width: 60, height: 22, borderRadius: 6 }]} />
          <View style={[styles.bloque, { width: 70, height: 28, borderRadius: 6 }]} />
        </View>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  contenedor: {
    backgroundColor: Palette.white,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Palette.border,
    overflow: 'hidden',
  },
  filaEncabezado: {
    flexDirection: 'row',
    backgroundColor: '#F3EFE6',
    paddingVertical: 14,
    paddingHorizontal: 20,
    gap: 24,
    borderBottomWidth: 1,
    borderBottomColor: Palette.border,
  },
  fila: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    gap: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#F5EFE0',
  },
  bloque: {
    backgroundColor: '#EAE4D4',
    borderRadius: 4,
  },
});
