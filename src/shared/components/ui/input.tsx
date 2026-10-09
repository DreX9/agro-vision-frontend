import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  Pressable,
  TextInputProps,
  ViewStyle,
} from 'react-native';
import { Eye, EyeOff } from 'lucide-react-native';
import { Palette } from '@/constants/theme';

export interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  esPassword?: boolean;
  iconoIzquierda?: React.ReactNode;
  contenedorEstilo?: ViewStyle;
}

/**
 * @description Campo de texto estandarizado con etiqueta, soporte para contraseñas y mensajes de error.
 */
export const Input: React.FC<InputProps> = ({
  label,
  error,
  esPassword = false,
  iconoIzquierda,
  contenedorEstilo,
  style,
  ...props
}) => {
  const [mostrarPassword, setMostrarPassword] = useState(!esPassword);
  const [estaEnfocado, setEstaEnfocado] = useState(false);

  return (
    <View style={[styles.contenedor, contenedorEstilo]}>
      {label && <Text style={styles.label}>{label}</Text>}

      <View
        style={[
          styles.inputWrapper,
          estaEnfocado && styles.inputWrapperEnfocado,
          !!error && styles.inputWrapperError,
        ]}
      >
        {iconoIzquierda && <View style={styles.iconoIzquierda}>{iconoIzquierda}</View>}

        <TextInput
          style={[styles.input, style]}
          placeholderTextColor="#9CA3AF"
          secureTextEntry={esPassword && !mostrarPassword}
          onFocus={() => setEstaEnfocado(true)}
          onBlur={() => setEstaEnfocado(false)}
          {...props}
        />

        {esPassword && (
          <Pressable
            onPress={() => setMostrarPassword(!mostrarPassword)}
            style={styles.iconoPassword}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            {mostrarPassword ? (
              <EyeOff size={18} color="#6B7280" />
            ) : (
              <Eye size={18} color="#6B7280" />
            )}
          </Pressable>
        )}
      </View>

      {error && <Text style={styles.errorTexto}>{error}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  contenedor: {
    width: '100%',
    marginBottom: 18,
  },
  label: {
    fontSize: 13,
    fontWeight: '700',
    color: '#374151',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: 8,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Palette.white,
    borderWidth: 1.2,
    borderColor: Palette.border,
    borderRadius: 10,
    minHeight: 52,
    paddingHorizontal: 14,
  },
  inputWrapperEnfocado: {
    borderColor: Palette.forestGreen,
    borderWidth: 1.8,
  },
  inputWrapperError: {
    borderColor: Palette.error,
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: Palette.text,
    paddingVertical: 12,
    backgroundColor: 'transparent',
    borderWidth: 0,
  },
  iconoIzquierda: {
    marginRight: 10,
  },
  iconoPassword: {
    padding: 6,
  },
  errorTexto: {
    fontSize: 12,
    color: Palette.error,
    marginTop: 6,
    fontWeight: '500',
  },
});
