import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Platform,
  useWindowDimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AlertTriangle, ShieldAlert } from 'lucide-react-native';
import { useAuthStore } from '@/features/autenticacion';
import { ModalAlertaRapidaOperador } from './ModalAlertaRapidaOperador';

export function BotonAlertaOperadorFlotante() {
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const usuario = useAuthStore((s) => s.usuario);
  const [modalAbierto, setModalAbierto] = useState(false);

  // Mostrar para el rol OPERADOR (y ADMINISTRADOR para supervisión y pruebas)
  const esOperadorOAdmin =
    usuario?.rol === 'OPERADOR' || usuario?.rol === 'ADMINISTRADOR';

  if (!esOperadorOAdmin) {
    return null;
  }

  const esMovil = width < 600;

  // Calculamos la distancia inferior respetando los insets nativos del celular (Android / iOS).
  // insets.bottom mide la barra de botones nativos de Android (48-56px). Sumamos un margen para que
  // el botón flote holgadamente arriba sin tocar ni tapar la barra de navegación del sistema.
  const bottomOffset = Math.max(insets.bottom, 12) + (esMovil ? 28 : 24);
  const rightOffset = Math.max(insets.right, 0) + (esMovil ? 18 : 24);

  return (
    <>
      <View
        style={[
          styles.contenedorFlotante,
          {
            position: Platform.OS === 'web' ? ('fixed' as any) : 'absolute',
            bottom: bottomOffset,
            right: rightOffset,
            width: esMovil ? 52 : undefined,
            height: esMovil ? 52 : undefined,
          },
        ]}
        pointerEvents="box-none"
      >
        <Pressable
          onPress={() => setModalAbierto(true)}
          style={({ pressed }) => [
            styles.botonFab,
            esMovil && styles.botonFabMovil,
            pressed && styles.botonFabPresionado,
          ]}
          accessibilityRole="button"
          accessibilityLabel="Emitir alerta fitosanitaria o reporte de campo"
        >
          <View style={styles.iconoWrapper}>
            <AlertTriangle size={esMovil ? 22 : 20} color="#FFFFFF" />
          </View>

          {!esMovil && (
            <View style={styles.textosBoton}>
              <Text style={styles.textoPrincipal}>¡Alerta en Campo!</Text>
              <Text style={styles.textoSecundario}>Cámara IA &gt; Supervisor</Text>
            </View>
          )}

          {/* Indicador de pulso de alerta */}
          <View style={styles.puntoPulso} />
        </Pressable>
      </View>

      {/* Modal de Alerta Rápida con GPS y Reconocimiento Geográfico (solo en el árbol cuando se abre) */}
      {modalAbierto && (
        <ModalAlertaRapidaOperador
          visible={modalAbierto}
          onCerrar={() => setModalAbierto(false)}
        />
      )}
    </>
  );
}

const styles = StyleSheet.create({
  contenedorFlotante: {
    zIndex: 9999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  botonFab: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#DC2626',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 32,
    shadowColor: '#DC2626',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.45,
    shadowRadius: 10,
    elevation: 8,
    borderWidth: 2,
    borderColor: '#FEE2E2',
    position: 'relative',
  },
  botonFabMovil: {
    width: 52,
    height: 52,
    paddingVertical: 0,
    paddingHorizontal: 0,
    borderRadius: 26,
    justifyContent: 'center',
    alignItems: 'center',
  },
  botonFabPresionado: {
    opacity: 0.85,
    transform: [{ scale: 0.96 }],
  },
  iconoWrapper: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  textosBoton: {
    flexDirection: 'column',
  },
  textoPrincipal: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 13,
    letterSpacing: 0.3,
  },
  textoSecundario: {
    color: '#FEE2E2',
    fontSize: 10,
    fontWeight: '600',
  },
  puntoPulso: {
    position: 'absolute',
    top: -3,
    right: -3,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#FEF08A',
    borderWidth: 2,
    borderColor: '#DC2626',
  },
});

