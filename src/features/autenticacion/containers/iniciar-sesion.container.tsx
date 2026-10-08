import React, { useState } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  useWindowDimensions,
  SafeAreaView,
  ImageBackground,
} from 'react-native';
import { useRouter } from 'expo-router';
import axios from 'axios';
import { Palette } from '@/constants/theme';
import { IniciarSesionHero } from '../components/iniciar-sesion-hero';
import { IniciarSesionForm } from '../components/iniciar-sesion-form';
import { IniciarSesionFormulario } from '../schemas/iniciar-sesion.schema';
import { useIniciarSesionMutation } from '../api/autenticacion.api';

/**
 * @description Contenedor orquestador del flujo de inicio de sesión con tarjeta central flotante y diseño multiplataforma.
 */
export const IniciarSesionContainer: React.FC = () => {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const [errorMensaje, setErrorMensaje] = useState<string | null>(null);

  const mutation = useIniciarSesionMutation();

  const esPantallaAmplia = width >= 880;

  const handleIniciarSesion = (datos: IniciarSesionFormulario) => {
    setErrorMensaje(null);

    mutation.mutate(datos, {
      onSuccess: () => {
        router.replace('/');
      },
      onError: (error: unknown) => {
        if (axios.isAxiosError(error) && error.response?.data?.message) {
          setErrorMensaje(String(error.response.data.message));
        } else {
          setErrorMensaje('No se pudo conectar con el servidor. Revisa tu conexión.');
        }
      },
    });
  };

  return (
    <SafeAreaView style={styles.pantalla}>
      <ImageBackground
        source={require('@/assets/images/login-hero.jpg')}
        style={styles.fondoEscenico}
        resizeMode="cover"
      >
        <View style={styles.overlayOscuro}>
          {esPantallaAmplia ? (
            /* Vista Desktop / Tablet amplia: Tarjeta unificada de 2 columnas */
            <View style={styles.contenedorCentroWeb}>
              <View style={styles.tarjetaModal}>
                {/* Columna Izquierda: Formulario de inicio de sesión */}
                <View style={styles.columnaFormulario}>
                  <ScrollView
                    contentContainerStyle={styles.scrollFormulario}
                    showsVerticalScrollIndicator={false}
                    keyboardShouldPersistTaps="handled"
                  >
                    <IniciarSesionForm
                      onEnviar={handleIniciarSesion}
                      estaCargando={mutation.isPending}
                      errorMensaje={errorMensaje}
                    />
                  </ScrollView>
                </View>

                {/* Columna Derecha: Panel gráfico moderno (Hero) */}
                <View style={styles.columnaHero}>
                  <IniciarSesionHero />
                </View>
              </View>
            </View>
          ) : (
            /* Vista Móvil: Tarjeta única centrada y limpia */
            <ScrollView
              style={styles.scrollMobile}
              contentContainerStyle={styles.scrollContentMobile}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
              <View style={styles.tarjetaModalMobile}>
                <IniciarSesionForm
                  onEnviar={handleIniciarSesion}
                  estaCargando={mutation.isPending}
                  errorMensaje={errorMensaje}
                />
              </View>
            </ScrollView>
          )}
        </View>
      </ImageBackground>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  pantalla: {
    flex: 1,
    backgroundColor: '#1E2819',
  },
  fondoEscenico: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  overlayOscuro: {
    flex: 1,
    backgroundColor: 'rgba(25, 34, 20, 0.58)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  contenedorCentroWeb: {
    width: '100%',
    maxWidth: 980,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tarjetaModal: {
    width: '100%',
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    overflow: 'hidden',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.22,
    shadowRadius: 36,
    elevation: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.4)',
    maxHeight: 650,
  },
  columnaFormulario: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
  },
  scrollFormulario: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  columnaHero: {
    flex: 1.15,
    backgroundColor: '#FFFFFF',
    borderLeftWidth: 1,
    borderLeftColor: '#F3F4F6',
  },
  scrollMobile: {
    flex: 1,
    width: '100%',
  },
  scrollContentMobile: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 24,
  },
  tarjetaModalMobile: {
    width: '100%',
    maxWidth: 440,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.4)',
    overflow: 'hidden',
  },
});

