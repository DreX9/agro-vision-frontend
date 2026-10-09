import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Palette } from '@/constants/theme';

/**
 * @description Panel visual moderno (Hero) con formas geométricas orgánicas y frase de impacto para autenticación.
 */
export const IniciarSesionHero: React.FC = () => {
  return (
    <View style={styles.contenedor}>
      {/* Forma 1: Semicírculo superior derecho */}
      <View style={styles.semicirculoSuperior} />

      {/* Forma 2: Círculo pastel lavanda / menta suave en esquina superior */}
      <View style={styles.circuloMenta} />

      {/* Forma 3: Cápsula orgánica alargada vertical */}
      <View style={styles.capsulaVertical} />

      {/* Matriz de puntos decorativos tipo cuadrícula */}
      <View style={styles.matrizPuntos}>
        <View style={styles.filaPuntos}>
          <View style={styles.punto} />
          <View style={styles.punto} />
          <View style={styles.punto} />
          <View style={styles.punto} />
        </View>
        <View style={styles.filaPuntos}>
          <View style={styles.punto} />
          <View style={styles.punto} />
          <View style={styles.punto} />
          <View style={styles.punto} />
        </View>
        <View style={styles.filaPuntos}>
          <View style={styles.punto} />
          <View style={styles.punto} />
          <View style={styles.punto} />
          <View style={styles.punto} />
        </View>
        <View style={styles.filaPuntos}>
          <View style={styles.punto} />
          <View style={styles.punto} />
          <View style={styles.punto} />
          <View style={styles.punto} />
        </View>
      </View>

      {/* Frase Central de Alto Impacto */}
      <View style={styles.centroTexto}>
        <Text style={styles.frasePrincipal}>
          Transformando el monitoreo agrícola con visión e inteligencia
        </Text>
      </View>

      {/* Forma 4: Media luna / semicírculo cálido al costado del texto */}
      <View style={styles.formaAcentoCentro} />

      {/* Forma 5: Pastilla suave inferior */}
      <View style={styles.formaPastillaInferior} />

      {/* Forma 6: Forma orgánica inferior derecha */}
      <View style={styles.semicirculoInferiorDerecho} />

      {/* Forma 7: Semicírculo inferior izquierdo */}
      <View style={styles.formaInferiorIzquierda} />
    </View>
  );
};

const styles = StyleSheet.create({
  contenedor: {
    flex: 1,
    height: '100%',
    minHeight: 560,
    backgroundColor: '#FFFFFF',
    position: 'relative',
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 48,
  },
  /* Semicírculo superior derecho */
  semicirculoSuperior: {
    position: 'absolute',
    top: -50,
    right: 80,
    width: 170,
    height: 170,
    borderRadius: 85,
    backgroundColor: '#DCCCAC',
    opacity: 0.65,
  },
  /* Círculo menta suave */
  circuloMenta: {
    position: 'absolute',
    top: -40,
    right: -40,
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: '#E4EAD8',
    opacity: 0.85,
  },
  /* Cápsula vertical en el cuadrante superior izquierdo */
  capsulaVertical: {
    position: 'absolute',
    top: -30,
    left: -20,
    width: 140,
    height: 190,
    borderRadius: 70,
    backgroundColor: '#B5C79E',
    opacity: 0.45,
  },
  /* Matriz tecnológica de puntos */
  matrizPuntos: {
    position: 'absolute',
    top: 110,
    right: 48,
    gap: 8,
  },
  filaPuntos: {
    flexDirection: 'row',
    gap: 8,
  },
  punto: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#99AD7A',
    opacity: 0.45,
  },
  /* Frase de Alto Impacto */
  centroTexto: {
    zIndex: 10,
    maxWidth: 360,
    alignItems: 'flex-start',
  },
  frasePrincipal: {
    fontSize: 32,
    fontWeight: '800',
    color: '#1F2937',
    lineHeight: 42,
    letterSpacing: -0.6,
  },
  /* Acento orgánico en el centro */
  formaAcentoCentro: {
    position: 'absolute',
    top: 260,
    left: 20,
    width: 80,
    height: 40,
    borderTopLeftRadius: 40,
    borderTopRightRadius: 40,
    backgroundColor: '#EAB308',
    opacity: 0.55,
    transform: [{ rotate: '45deg' }],
  },
  /* Pastilla orgánica inferior */
  formaPastillaInferior: {
    position: 'absolute',
    bottom: -30,
    left: 80,
    width: 100,
    height: 180,
    borderRadius: 50,
    backgroundColor: Palette.forestGreen,
    opacity: 0.75,
  },
  /* Semicírculo inferior derecho */
  semicirculoInferiorDerecho: {
    position: 'absolute',
    bottom: 40,
    right: 20,
    width: 110,
    height: 110,
    borderRadius: 55,
    backgroundColor: '#8FA374',
    opacity: 0.5,
    transform: [{ rotate: '-25deg' }],
  },
  /* Forma inferior izquierda */
  formaInferiorIzquierda: {
    position: 'absolute',
    bottom: -40,
    right: 120,
    width: 130,
    height: 130,
    borderRadius: 65,
    backgroundColor: '#A8C090',
    opacity: 0.7,
  },
});

