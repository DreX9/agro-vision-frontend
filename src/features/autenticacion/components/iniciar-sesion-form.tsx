import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable, TextInput } from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { AlertCircle, Eye, EyeOff, Check, Sprout } from 'lucide-react-native';
import { Palette } from '@/constants/theme';
import { Boton } from '@/shared/components/ui';
import {
  iniciarSesionSchema,
  IniciarSesionFormulario,
} from '../schemas/iniciar-sesion.schema';

export interface IniciarSesionFormProps {
  onEnviar: (datos: IniciarSesionFormulario) => void;
  estaCargando: boolean;
  errorMensaje?: string | null;
}

/**
 * @description Formulario presentacional de inicio de sesión con diseño estilizado, logo superior y opción de recordar sesión.
 */
export const IniciarSesionForm: React.FC<IniciarSesionFormProps> = ({
  onEnviar,
  estaCargando,
  errorMensaje,
}) => {
  const [mostrarPassword, setMostrarPassword] = useState(false);
  const [passwordEnfocado, setPasswordEnfocado] = useState(false);
  const [correoEnfocado, setCorreoEnfocado] = useState(false);

  const {
    control,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<IniciarSesionFormulario>({
    resolver: zodResolver(iniciarSesionSchema),
    defaultValues: {
      correo: '',
      password: '',
      recordarSesion: true,
    },
  });

  const recordarSesionValor = watch('recordarSesion');

  const alternarRecordarSesion = () => {
    setValue('recordarSesion', !recordarSesionValor, { shouldValidate: true });
  };

  const rellenarCredencialesDemo = () => {
    setValue('correo', 'admin@santaelena.pe', { shouldValidate: true });
    setValue('password', '1234', { shouldValidate: true });
  };

  return (
    <View style={styles.contenedor}>
      {/* Isotipo y Encabezado Centrado */}
      <View style={styles.encabezado}>
        <View style={styles.logoContenedor}>
          <View style={styles.logoInsignia}>
            <Sprout size={28} color="#FFFFFF" strokeWidth={2.2} />
          </View>
          <View style={styles.logoPuntoAcento} />
        </View>

        <Text style={styles.titulo}>Iniciar sesión</Text>
        <Text style={styles.subtitulo}>
          Ingresa tus credenciales para acceder al sistema
        </Text>
      </View>

      {/* Alerta de Error si existe */}
      {errorMensaje && (
        <View style={styles.alertaError}>
          <AlertCircle size={18} color={Palette.error} />
          <Text style={styles.alertaErrorTexto}>{errorMensaje}</Text>
        </View>
      )}

      {/* Campos del Formulario */}
      <View style={styles.formulario}>
        {/* Campo Correo */}
        <View style={styles.grupoCampo}>
          <Text style={styles.etiquetaCampo}>Correo electrónico</Text>
          <Controller
            control={control}
            name="correo"
            render={({ field: { onChange, onBlur, value } }) => (
              <View
                style={[
                  styles.inputWrapper,
                  correoEnfocado && styles.inputWrapperEnfocado,
                  !!errors.correo && styles.inputWrapperError,
                ]}
              >
                <TextInput
                  style={styles.input}
                  placeholder="admin@santaelena.pe"
                  placeholderTextColor="#9CA3AF"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  value={value}
                  onChangeText={onChange}
                  onFocus={() => setCorreoEnfocado(true)}
                  onBlur={() => {
                    setCorreoEnfocado(false);
                    onBlur();
                  }}
                />
              </View>
            )}
          />
          {errors.correo && (
            <Text style={styles.errorTexto}>{errors.correo.message}</Text>
          )}
        </View>

        {/* Campo Contraseña */}
        <View style={styles.grupoCampo}>
          <Text style={styles.etiquetaCampo}>Contraseña</Text>
          <Controller
            control={control}
            name="password"
            render={({ field: { onChange, onBlur, value } }) => (
              <View
                style={[
                  styles.inputWrapper,
                  passwordEnfocado && styles.inputWrapperEnfocado,
                  !!errors.password && styles.inputWrapperError,
                ]}
              >
                <TextInput
                  style={styles.input}
                  placeholder="••••••••"
                  placeholderTextColor="#9CA3AF"
                  secureTextEntry={!mostrarPassword}
                  value={value}
                  onChangeText={onChange}
                  onFocus={() => setPasswordEnfocado(true)}
                  onBlur={() => {
                    setPasswordEnfocado(false);
                    onBlur();
                  }}
                />
                <Pressable
                  onPress={() => setMostrarPassword((prev) => !prev)}
                  style={styles.botonOjo}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  {mostrarPassword ? (
                    <EyeOff size={18} color="#6B7280" />
                  ) : (
                    <Eye size={18} color="#6B7280" />
                  )}
                </Pressable>
              </View>
            )}
          />
          {errors.password && (
            <Text style={styles.errorTexto}>{errors.password.message}</Text>
          )}
        </View>

        {/* Fila Recordar Sesión */}
        <View style={styles.filaOpciones}>
          <Pressable
            onPress={alternarRecordarSesion}
            style={styles.checkboxContenedor}
          >
            <View
              style={[
                styles.checkboxCaja,
                recordarSesionValor && styles.checkboxCajaActiva,
              ]}
            >
              {recordarSesionValor && <Check size={14} color="#FFFFFF" strokeWidth={3} />}
            </View>
            <Text style={styles.checkboxTexto}>Recordar mi sesión</Text>
          </Pressable>
        </View>

        {/* Botón Principal Iniciar Sesión */}
        <Boton
          titulo="Iniciar sesión"
          variante="primario"
          cargando={estaCargando}
          onPress={handleSubmit(onEnviar)}
          estilo={styles.botonSubmit}
        />

        {/* Acceso Rápido para Pruebas / Demo */}
        <Pressable
          onPress={rellenarCredencialesDemo}
          style={({ pressed }) => [
            styles.bannerDemo,
            pressed && styles.bannerDemoPresionado,
          ]}
        >
          <Text style={styles.bannerDemoTexto}>
            Demo:{' '}
            <Text style={styles.bannerDemoCode}>admin@santaelena.pe</Text> /{' '}
            <Text style={styles.bannerDemoCode}>1234</Text>
          </Text>
          <Text style={styles.bannerDemoAyuda}>(Toca para autocompletar)</Text>
        </Pressable>
      </View>

      {/* Pie de Página Institucional */}
      <View style={styles.pie}>
        <Text style={styles.pieTexto}>
          Agrícola Santa Elena S.A.C. · Agro Vision
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  contenedor: {
    width: '100%',
    paddingHorizontal: 32,
    paddingVertical: 28,
  },
  encabezado: {
    alignItems: 'center',
    marginBottom: 26,
  },
  logoContenedor: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  logoInsignia: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: Palette.forestGreen,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Palette.forestGreen,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 4,
  },
  logoPuntoAcento: {
    position: 'absolute',
    top: 2,
    right: -4,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: Palette.sageGreen,
    borderWidth: 2.5,
    borderColor: '#FFFFFF',
  },
  titulo: {
    fontSize: 26,
    fontWeight: '700',
    color: Palette.text,
    letterSpacing: -0.3,
    textAlign: 'center',
  },
  subtitulo: {
    fontSize: 14,
    color: Palette.textSecondary,
    marginTop: 6,
    textAlign: 'center',
  },
  alertaError: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FEE2E2',
    borderWidth: 1,
    borderColor: '#FCA5A5',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 10,
    marginBottom: 18,
  },
  alertaErrorTexto: {
    fontSize: 13,
    color: Palette.error,
    fontWeight: '500',
    flex: 1,
  },
  formulario: {
    width: '100%',
  },
  grupoCampo: {
    marginBottom: 16,
  },
  etiquetaCampo: {
    fontSize: 13,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 6,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderWidth: 1.2,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    minHeight: 48,
    paddingHorizontal: 14,
  },
  inputWrapperEnfocado: {
    borderColor: Palette.forestGreen,
    backgroundColor: '#FFFFFF',
  },
  inputWrapperError: {
    borderColor: Palette.error,
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: Palette.text,
    height: '100%',
  },
  botonOjo: {
    padding: 6,
  },
  errorTexto: {
    fontSize: 12,
    color: Palette.error,
    marginTop: 4,
    fontWeight: '500',
  },
  filaOpciones: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    marginTop: 2,
    marginBottom: 20,
  },
  checkboxContenedor: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 4,
  },
  checkboxCaja: {
    width: 20,
    height: 20,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: '#D1D5DB',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxCajaActiva: {
    backgroundColor: Palette.forestGreen,
    borderColor: Palette.forestGreen,
  },
  checkboxTexto: {
    fontSize: 14,
    color: '#4B5563',
    fontWeight: '500',
  },
  botonSubmit: {
    backgroundColor: Palette.forestGreen,
    borderRadius: 12,
    minHeight: 48,
    marginTop: 4,
  },
  bannerDemo: {
    marginTop: 20,
    backgroundColor: '#F3F6F0',
    borderWidth: 1,
    borderColor: '#E0EAD8',
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 14,
    alignItems: 'center',
  },
  bannerDemoPresionado: {
    opacity: 0.8,
  },
  bannerDemoTexto: {
    fontSize: 13,
    color: Palette.text,
    fontWeight: '500',
  },
  bannerDemoCode: {
    fontFamily: 'monospace',
    fontWeight: '700',
    color: Palette.forestGreen,
  },
  bannerDemoAyuda: {
    fontSize: 11,
    color: Palette.textSecondary,
    marginTop: 2,
  },
  pie: {
    marginTop: 24,
    alignItems: 'center',
  },
  pieTexto: {
    fontSize: 12,
    color: '#9CA3AF',
    textAlign: 'center',
  },
});

