import React from 'react';
import { View, Text, StyleSheet, Pressable, Platform } from 'react-native';
import { Camera, Maximize2, Minimize2, Video as VideoIcon } from 'lucide-react-native';

export interface VisorControlesSuperioresProps {
  camaraActiva: boolean;
  esPantallaCompleta: boolean;
  onToggleCamara: () => void;
  onTogglePantallaCompleta: () => void;
}

/**
 * @description Barra superior de controles del visor multimedia (cámara web, video de muestra, pantalla completa).
 */
export const VisorControlesSuperiores: React.FC<VisorControlesSuperioresProps> = ({
  camaraActiva,
  esPantallaCompleta,
  onToggleCamara,
  onTogglePantallaCompleta,
}) => {
  return (
    <View style={styles.barraSuperior}>
      <View style={styles.badgeEnVivo}>
        <View style={[styles.puntoGrabando, camaraActiva && styles.puntoActivo]} />
        <Text style={styles.textoEnVivo}>
          {camaraActiva ? 'CÁMARA WEB EN VIVO' : 'VIDEO DE MUESTRA'}
        </Text>
      </View>

      <View style={styles.filaAccionesSuperiores}>
        {Platform.OS === 'web' && (
          <Pressable
            onPress={onToggleCamara}
            style={({ pressed }) => [
              styles.botonCamaraToggle,
              camaraActiva && styles.botonCamaraActiva,
              pressed && styles.presionado,
            ]}
          >
            {camaraActiva ? (
              <>
                <VideoIcon size={16} color="#FFFFFF" />
                <Text style={styles.textoBotonCamara}>Ver Video Muestra</Text>
              </>
            ) : (
              <>
                <Camera size={16} color="#FFFFFF" />
                <Text style={styles.textoBotonCamara}>Activar Cámara</Text>
              </>
            )}
          </Pressable>
        )}

        <Pressable
          onPress={onTogglePantallaCompleta}
          style={({ pressed }) => [styles.botonIcono, pressed && styles.presionado]}
        >
          {esPantallaCompleta ? (
            <Minimize2 size={18} color="#FFFFFF" />
          ) : (
            <Maximize2 size={18} color="#FFFFFF" />
          )}
        </Pressable>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  barraSuperior: {
    position: 'absolute',
    top: 14,
    left: 14,
    right: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    zIndex: 25,
  },
  badgeEnVivo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(15, 23, 42, 0.85)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
  },
  puntoGrabando: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#EAB308',
  },
  puntoActivo: {
    backgroundColor: '#22C55E',
  },
  textoEnVivo: {
    color: '#F8FAFC',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  filaAccionesSuperiores: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  botonCamaraToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(30, 41, 59, 0.85)',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  botonCamaraActiva: {
    backgroundColor: '#059669',
    borderColor: '#10B981',
  },
  textoBotonCamara: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  botonIcono: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(15, 23, 42, 0.85)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  presionado: {
    opacity: 0.8,
    transform: [{ scale: 0.97 }],
  },
});
