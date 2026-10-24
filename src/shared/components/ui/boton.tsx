import React from 'react';
import {
  Pressable,
  Text,
  ActivityIndicator,
  StyleSheet,
  ViewStyle,
  TextStyle,
  PressableProps,
  Platform,
} from 'react-native';
import { Palette } from '@/constants/theme';

export type TamanoBoton = 'sm' | 'md' | 'lg';

export interface BotonProps extends PressableProps {
  titulo: string;
  variante?: 'primario' | 'secundario' | 'outline' | 'fantasma' | 'peligro';
  tamano?: TamanoBoton;
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
  tamano = 'md',
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
      case 'peligro':
        return styles.peligro;
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
      case 'peligro':
        return styles.texto_peligro;
      case 'primario':
      default:
        return styles.texto_primario;
    }
  };

  const obtenerEstiloTamano = (): ViewStyle => {
    switch (tamano) {
      case 'sm':
        return styles.tamano_sm;
      case 'lg':
        return styles.tamano_lg;
      case 'md':
      default:
        return styles.tamano_md;
    }
  };

  const obtenerEstiloTextoTamano = (): TextStyle => {
    switch (tamano) {
      case 'sm':
        return styles.texto_tamano_sm;
      case 'lg':
        return styles.texto_tamano_lg;
      case 'md':
      default:
        return styles.texto_tamano_md;
    }
  };

  return (
    <Pressable
      disabled={estaDeshabilitado}
      style={({ pressed }) => [
        styles.base,
        obtenerEstiloTamano(),
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
              obtenerEstiloTextoTamano(),
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
    cursor: Platform.OS === 'web' ? ('pointer' as const) : undefined,
  },
  tamano_sm: {
    minHeight: 32,
    paddingVertical: 5,
    paddingHorizontal: 12,
    borderRadius: 7,
    gap: 6,
  },
  tamano_md: {
    minHeight: 38,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    gap: 8,
  },
  tamano_lg: {
    minHeight: 46,
    paddingVertical: 11,
    paddingHorizontal: 20,
    borderRadius: 9,
    gap: 10,
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
  peligro: {
    backgroundColor: '#DC2626',
  },
  textoBase: {
    textAlign: 'center',
    letterSpacing: 0.2,
  },
  texto_tamano_sm: {
    fontSize: 12,
    fontWeight: '600',
  },
  texto_tamano_md: {
    fontSize: 13,
    fontWeight: '600',
  },
  texto_tamano_lg: {
    fontSize: 14.5,
    fontWeight: '700',
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
  texto_peligro: {
    color: Palette.white,
  },
});
