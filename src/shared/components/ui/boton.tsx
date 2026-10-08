import React from 'react';
import {
  Pressable,
  Text,
  ActivityIndicator,
  StyleSheet,
  ViewStyle,
  TextStyle,
  PressableProps,
} from 'react-native';
import { Palette } from '@/constants/theme';

export interface BotonProps extends PressableProps {
  titulo: string;
  variante?: 'primario' | 'secundario' | 'outline' | 'fantasma';
  cargando?: boolean;
  estilo?: ViewStyle;
  estiloTexto?: TextStyle;
  iconoIzquierda?: React.ReactNode;
  iconoDerecha?: React.ReactNode;
}

/**
 * @description Botón principal con variantes agronómicas, feedback táctil y estado de carga.
 */
export const Boton: React.FC<BotonProps> = ({
  titulo,
  variante = 'primario',
  cargando = false,
  disabled = false,
  estilo,
  estiloTexto,
  iconoIzquierda,
  iconoDerecha,
  ...props
}) => {
  const estaDeshabilitado = disabled || cargando;

  const obtenerEstiloVariante = (): ViewStyle => {
    switch (variante) {
      case 'secundario':
        return styles.secundario;
      case 'outline':
        return styles.outline;
      case 'fantasma':
        return styles.fantasma;
      case 'primario':
      default:
        return styles.primario;
    }
  };

  const obtenerEstiloTextoVariante = (): TextStyle => {
    switch (variante) {
      case 'secundario':
        return styles.texto_secundario;
      case 'outline':
        return styles.texto_outline;
      case 'fantasma':
        return styles.texto_fantasma;
      case 'primario':
      default:
        return styles.texto_primario;
    }
  };

  return (
    <Pressable
      disabled={estaDeshabilitado}
      style={({ pressed }) => [
        styles.base,
        obtenerEstiloVariante(),
        pressed && !estaDeshabilitado && styles.presionado,
        estaDeshabilitado && styles.deshabilitado,
        estilo,
      ]}
      {...props}
    >
      {cargando ? (
        <ActivityIndicator
          size="small"
          color={variante === 'outline' || variante === 'fantasma' ? Palette.forestGreen : Palette.white}
        />
      ) : (
        <>
          {iconoIzquierda}
          <Text
            style={[
              styles.textoBase,
              obtenerEstiloTextoVariante(),
              estiloTexto,
            ]}
          >
            {titulo}
          </Text>
          {iconoDerecha}
        </>
      )}
    </Pressable>
  );
};

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    minHeight: 52,
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 10,
  },
  presionado: {
    opacity: 0.85,
    transform: [{ scale: 0.99 }],
  },
  deshabilitado: {
    opacity: 0.6,
  },
  primario: {
    backgroundColor: Palette.forestGreen,
  },
  secundario: {
    backgroundColor: Palette.sageGreen,
  },
  outline: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: Palette.forestGreen,
  },
  fantasma: {
    backgroundColor: 'transparent',
  },
  textoBase: {
    fontSize: 16,
    fontWeight: '700',
    textAlign: 'center',
    letterSpacing: 0.2,
  },
  texto_primario: {
    color: Palette.white,
  },
  texto_secundario: {
    color: Palette.text,
  },
  texto_outline: {
    color: Palette.forestGreen,
  },
  texto_fantasma: {
    color: Palette.forestGreen,
  },
});
