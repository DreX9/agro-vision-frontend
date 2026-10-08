import React from 'react';
import { View, StyleSheet, ViewProps, ViewStyle } from 'react-native';
import { Palette } from '@/constants/theme';

export interface CardProps extends ViewProps {
  estilo?: ViewStyle;
}

/**
 * @description Contenedor de tarjeta blanco con borde suave y sombra sutil.
 */
export const Card: React.FC<CardProps> = ({ children, estilo, style, ...props }) => {
  return (
    <View style={[styles.card, estilo, style]} {...props}>
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: Palette.white,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Palette.border,
    padding: 20,
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)',
    elevation: 2,
  },
});
