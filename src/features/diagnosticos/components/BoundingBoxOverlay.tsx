import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { DeteccionPlaga } from '../types/diagnostico.types';

export interface BoundingBoxOverlayProps {
  detecciones: DeteccionPlaga[];
}

/**
 * @description Capa superpuesta que dibuja los recuadros delimitadores y etiquetas sobre la planta.
 */
export const BoundingBoxOverlay: React.FC<BoundingBoxOverlayProps> = ({ detecciones }) => {
  if (!detecciones || detecciones.length === 0) {
    return null;
  }

  const obtenerColorBorde = (confianza: number): string => {
    if (confianza >= 0.85) return '#EF4444'; // Rojo crítico
    if (confianza >= 0.65) return '#F59E0B'; // Ámbar advertencia
    return '#10B981'; // Verde moderado
  };

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {detecciones.map((deteccion, indice) => {
        const { caja, clase, confianza } = deteccion;
        const color = obtenerColorBorde(confianza);
        const left: import('react-native').DimensionValue = `${Math.max(0, Math.min(100, caja.x_min * 100))}%`;
        const top: import('react-native').DimensionValue = `${Math.max(0, Math.min(100, caja.y_min * 100))}%`;
        const width: import('react-native').DimensionValue = `${Math.max(5, Math.min(100, (caja.x_max - caja.x_min) * 100))}%`;
        const height: import('react-native').DimensionValue = `${Math.max(5, Math.min(100, (caja.y_max - caja.y_min) * 100))}%`;
        const nombreFormateado = clase.replace(/_/g, ' ');

        return (
          <View
            key={`box-${indice}-${clase}`}
            style={[
              styles.caja,
              {
                left,
                top,
                width,
                height,
                borderColor: color,
              },
            ]}
          >
            <View style={[styles.etiqueta, { backgroundColor: color }]}>
              <Text style={styles.textoEtiqueta}>
                {nombreFormateado} · {Math.round(confianza * 100)}%
              </Text>
            </View>
          </View>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  caja: {
    position: 'absolute',
    borderWidth: 2.5,
    borderRadius: 8,
    borderStyle: 'solid',
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
  },
  etiqueta: {
    position: 'absolute',
    top: -24,
    left: -2,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3,
    elevation: 3,
  },
  textoEtiqueta: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'capitalize',
  },
});
