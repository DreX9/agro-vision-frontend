import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Platform,
  useWindowDimensions,
} from 'react-native';
import { AlertTriangle, ShieldAlert } from 'lucide-react-native';
import { useAuthStore } from '@/features/autenticacion';
import { ModalAlertaRapidaOperador } from './ModalAlertaRapidaOperador';

export function BotonAlertaOperadorFlotante() {
  const { width } = useWindowDimensions();
  const usuario = useAuthStore((s) => s.usuario);
  const [modalAbierto, setModalAbierto] = useState(false);

  // Mostrar para el rol OPERADOR (y ADMINISTRADOR para supervisión y pruebas)
  const esOperadorOAdmin =
    usuario?.rol === 'OPERADOR' || usuario?.rol === 'ADMINISTRADOR';

  if (!esOperadorOAdmin) {
    return null;
  }

  const esMovil = width < 600;

  return (
    <>
      <View
        style={[
          styles.contenedorFlotante,
          Platform.OS === 'web' ? ({ position: 'fixed' } as any) : { position: 'absolute' },
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
              <Text style={styles.textoSecundario}>Avisar a Supervisor</Text>
            </View>
          )}

          {/* Indicador de pulso de alerta */}
          <View style={styles.puntoPulso} />
        </Pressable>
      </View>

      {/* Modal de Alerta Rápida con GPS y Reconocimiento Geográfico */}
      <ModalAlertaRapidaOperador
        visible={modalAbierto}
        onCerrar={() => setModalAbierto(false)}
      />
    </>
  );
}

const styles = StyleSheet.create({
  contenedorFlotante: {
    bottom: 24,
    right: 24,
    zIndex: 9999,
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
    paddingVertical: 14,
    paddingHorizontal: 14,
    borderRadius: 28,
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
