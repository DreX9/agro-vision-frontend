import React from 'react';
import { View, Text, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import { Palette } from '@/constants/theme';

export type VarianteBadge = 'exito' | 'alerta' | 'peligro' | 'info' | 'neutro';

export interface BadgeProps {
  texto: string;
  variante?: VarianteBadge;
  estilo?: ViewStyle;
  estiloTexto?: TextStyle;
  icono?: React.ReactNode;
}

/**
 * @description Indicador visual de estado agronómico con contraste y jerarquía de color.
 */
export const Badge: React.FC<BadgeProps> = ({
  texto,
  variante = 'neutro',
  estilo,
  estiloTexto,
  icono,
}) => {
  return (
    <View style={[styles.base, styles[variante], estilo]}>
      {icono}
      <Text style={[styles.textoBase, styles[`texto_${variante}` as keyof typeof styles], estiloTexto]}>
        {texto}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  textoBase: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  exito: {
    backgroundColor: '#E8F5E9',
  },
  texto_exito: {
    color: Palette.success,
  },
  alerta: {
    backgroundColor: '#FFF8E1',
  },
  texto_alerta: {
    color: Palette.warning,
  },
  peligro: {
    backgroundColor: '#FFEBEE',
  },
  texto_peligro: {
    color: Palette.error,
  },
  info: {
    backgroundColor: '#E1F5FE',
  },
  texto_info: {
    color: Palette.info,
  },
  neutro: {
    backgroundColor: '#F3F4F6',
  },
  texto_neutro: {
    color: '#4B5563',
  },
});
