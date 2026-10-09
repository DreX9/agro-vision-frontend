import React from 'react';
import { View, Text, StyleSheet, ScrollView, ViewStyle, Platform } from 'react-native';
import { Palette } from '@/constants/theme';

export interface ColumnaTabla<T> {
  id: string;
  encabezado: string;
  anchoMinimo?: number;
  flex?: number;
  anchoPorcentaje?: `${number}%`;
  alineacion?: 'left' | 'center' | 'right';
  render: (item: T, index: number) => React.ReactNode;
}

export interface TablaProps<T> {
  columnas: ColumnaTabla<T>[];
  datos: T[];
  claveExtractor: (item: T) => string;
  cargando?: boolean;
  mensajeVacio?: string;
  estilo?: ViewStyle;
}

/**
 * @description Componente de tabla de datos responsiva con ancho completo al 100% y scroll horizontal en móviles.
 */
export function Tabla<T>({
  columnas,
  datos,
  claveExtractor,
  cargando = false,
  mensajeVacio = 'No se encontraron registros.',
  estilo,
}: TablaProps<T>) {
  return (
    <View style={[styles.contenedor, estilo]}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={Platform.OS === 'web'}
        contentContainerStyle={styles.scrollContenido}
        style={styles.scrollWrapper}
      >
        <View style={styles.tablaWrapper}>
          {/* Fila de Encabezados */}
          <View style={styles.filaEncabezado}>
            {columnas.map((col) => {
              const anchoEstilo = {
                flex: col.flex ?? 1,
                minWidth: col.anchoMinimo ?? 120,
              };
              const alineacionEstilo = {
                alignItems:
                  col.alineacion === 'center'
                    ? ('center' as const)
                    : col.alineacion === 'right'
                      ? ('flex-end' as const)
                      : ('flex-start' as const),
              };

              return (
                <View
                  key={col.id}
                  style={[styles.celdaEncabezado, anchoEstilo, alineacionEstilo]}
                >
                  <Text style={styles.textoEncabezado}>{col.encabezado}</Text>
                </View>
              );
            })}
          </View>

          {/* Filas de Datos */}
          {datos.length > 0 ? (
            datos.map((item, index) => {
              const esPar = index % 2 === 0;
              return (
                <View
                  key={claveExtractor(item)}
                  style={[
                    styles.filaDato,
                    esPar ? styles.filaPar : styles.filaImpar,
                  ]}
                >
                  {columnas.map((col) => {
                    const anchoEstilo = {
                      flex: col.flex ?? 1,
                      minWidth: col.anchoMinimo ?? 120,
                    };
                    const alineacionEstilo = {
                      alignItems:
                        col.alineacion === 'center'
                          ? ('center' as const)
                          : col.alineacion === 'right'
                            ? ('flex-end' as const)
                            : ('flex-start' as const),
                    };

                    return (
                      <View
                        key={col.id}
                        style={[styles.celdaDato, anchoEstilo, alineacionEstilo]}
                      >
                        {col.render(item, index)}
                      </View>
                    );
                  })}
                </View>
              );
            })
          ) : !cargando ? (
            <View style={styles.filaVacia}>
              <Text style={styles.textoVacio}>{mensajeVacio}</Text>
            </View>
          ) : null}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  contenedor: {
    backgroundColor: Palette.white,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Palette.border,
    overflow: 'hidden',
    width: '100%',
  },
  scrollWrapper: {
    width: '100%',
  },
  scrollContenido: {
    minWidth: '100%',
    flexGrow: 1,
  },
  tablaWrapper: {
    width: '100%',
    minWidth: 880,
  },
  filaEncabezado: {
    flexDirection: 'row',
    backgroundColor: '#F3EFE6',
    borderBottomWidth: 1.5,
    borderBottomColor: Palette.border,
    paddingVertical: 14,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  celdaEncabezado: {
    paddingHorizontal: 10,
    justifyContent: 'center',
  },
  textoEncabezado: {
    fontSize: 11,
    fontWeight: '800',
    color: '#374151',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  filaDato: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#F0EAD8',
    paddingVertical: 16,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  filaPar: {
    backgroundColor: Palette.white,
  },
  filaImpar: {
    backgroundColor: '#FCFAF5',
  },
  celdaDato: {
    paddingHorizontal: 10,
    justifyContent: 'center',
  },
  filaVacia: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textoVacio: {
    fontSize: 14,
    color: Palette.textSecondary,
    fontStyle: 'italic',
  },
});

