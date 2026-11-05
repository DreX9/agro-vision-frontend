import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ViewStyle,
  Platform,
  useWindowDimensions,
  Pressable,
  ActivityIndicator,
} from 'react-native';
import { LayoutGrid, ListTree, ArrowRightLeft } from 'lucide-react-native';
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
  vistaInicialMovil?: 'tarjetas' | 'tabla';
  permitirCambioVistaMovil?: boolean;
}

/**
 * @description Componente de tabla de datos responsiva con vista automática en tarjetas para móviles
 * y vista tabular completa con scroll horizontal optimizado.
 */
export function Tabla<T>({
  columnas,
  datos,
  claveExtractor,
  cargando = false,
  mensajeVacio = 'No se encontraron registros.',
  estilo,
  vistaInicialMovil = 'tarjetas',
  permitirCambioVistaMovil = true,
}: TablaProps<T>) {
  const { width } = useWindowDimensions();
  const esMovil = width < 768;
  const [vistaMovil, setVistaMovil] = useState<'tarjetas' | 'tabla'>(vistaInicialMovil);

  // Identificar columnas especiales para la vista de tarjetas en móvil
  const colAcciones = columnas.find(
    (c) => c.id === 'acciones' || c.encabezado.toLowerCase().includes('acci'),
  );
  const colEstado = columnas.find(
    (c) => c.id === 'estado' || c.encabezado.toLowerCase() === 'estado',
  );
  // Columna principal (primera columna)
  const colPrincipal = columnas[0];

  // Columnas intermedias para la tarjeta móvil
  const columnasIntermedias = columnas.filter(
    (c) => c !== colPrincipal && c !== colAcciones && c !== colEstado,
  );

  const renderSelectorVistas = (enTabla = false) => {
    if (!permitirCambioVistaMovil) return null;
    return (
      <View style={enTabla ? styles.barraToggleMovilEnTabla : styles.barraToggleMovil}>
        {!enTabla && (
          <Text style={styles.textoRegistrosMovil}>
            {datos.length} {datos.length === 1 ? 'registro' : 'registros'}
          </Text>
        )}
        <View style={styles.grupoBotonesToggle}>
          <Pressable
            onPress={() => setVistaMovil('tarjetas')}
            style={[
              styles.botonToggle,
              vistaMovil === 'tarjetas' && styles.botonToggleActivo,
            ]}
          >
            <LayoutGrid
              size={13}
              color={vistaMovil === 'tarjetas' ? '#FFFFFF' : '#4B5563'}
            />
            <Text
              style={[
                styles.textoBotonToggle,
                vistaMovil === 'tarjetas' && styles.textoBotonToggleActivo,
              ]}
            >
              Fichas
            </Text>
          </Pressable>

          <Pressable
            onPress={() => setVistaMovil('tabla')}
            style={[
              styles.botonToggle,
              vistaMovil === 'tabla' && styles.botonToggleActivo,
            ]}
          >
            <ListTree
              size={13}
              color={vistaMovil === 'tabla' ? '#FFFFFF' : '#4B5563'}
            />
            <Text
              style={[
                styles.textoBotonToggle,
                vistaMovil === 'tabla' && styles.textoBotonToggleActivo,
              ]}
            >
              Tabla
            </Text>
          </Pressable>
        </View>

        {enTabla && (
          <View style={styles.avisoDeslizar}>
            <ArrowRightLeft size={12} color="#6B7280" />
            <Text style={styles.textoAvisoDeslizar}>Desliza para ver más</Text>
          </View>
        )}
      </View>
    );
  };

  // VISTA MÓVIL EN MODO TARJETA (FICHAS VERTICALES LEGIBLES)
  if (esMovil && vistaMovil === 'tarjetas') {
    return (
      <View style={[styles.contenedorMovil, estilo]}>
        {renderSelectorVistas(false)}

        {/* Listado de Tarjetas Responsivas */}
        {cargando ? (
          <View style={styles.filaVacia}>
            <ActivityIndicator size="small" color={Palette.forestGreen} />
            <Text style={[styles.textoVacio, { marginTop: 8 }]}>Cargando registros...</Text>
          </View>
        ) : datos.length > 0 ? (
          <View style={styles.listaTarjetasMovil}>
            {datos.map((item, index) => (
              <View key={claveExtractor(item)} style={styles.tarjetaMovil}>
                {/* Cabecera de la Tarjeta: Identificador Principal + Estado */}
                <View style={styles.cabeceraTarjetaMovil}>
                  <View style={styles.columnaPrincipalMovil}>
                    <Text style={styles.etiquetaPrincipalMovil}>
                      {colPrincipal.encabezado}
                    </Text>
                    <View style={styles.valorPrincipalMovil}>
                      {colPrincipal.render(item, index)}
                    </View>
                  </View>

                  {colEstado && (
                    <View style={styles.badgeEstadoMovil}>
                      {colEstado.render(item, index)}
                    </View>
                  )}
                </View>

                {/* Campos de datos intermedios */}
                {columnasIntermedias.length > 0 && (
                  <View style={styles.cuerpoCamposMovil}>
                    {columnasIntermedias.map((col) => {
                      const esCampoLargo =
                        (col.anchoMinimo && col.anchoMinimo >= 180) ||
                        col.id === 'labor' ||
                        col.id === 'parcela' ||
                        col.id === 'variedades' ||
                        col.id === 'correo' ||
                        col.id === 'descripcion';

                      if (esCampoLargo) {
                        return (
                          <View key={col.id} style={styles.bloqueCampoLargo}>
                            <Text style={styles.etiquetaCampoLargo}>{col.encabezado}</Text>
                            <View style={styles.valorCampoLargo}>{col.render(item, index)}</View>
                          </View>
                        );
                      }

                      return (
                        <View key={col.id} style={styles.filaCampoCorto}>
                          <Text style={styles.etiquetaCampoCorto}>{col.encabezado}</Text>
                          <View style={styles.valorCampoCorto}>{col.render(item, index)}</View>
                        </View>
                      );
                    })}
                  </View>
                )}

                {/* Barra inferior de acciones */}
                {colAcciones && (
                  <View style={styles.pieAccionesMovil}>
                    <Text style={styles.etiquetaAccionesMovil}>Acciones</Text>
                    <View style={styles.valorAccionesMovil}>
                      {colAcciones.render(item, index)}
                    </View>
                  </View>
                )}
              </View>
            ))}
          </View>
        ) : (
          <View style={styles.filaVacia}>
            <Text style={styles.textoVacio}>{mensajeVacio}</Text>
          </View>
        )}
      </View>
    );
  }

  // VISTA TABULAR COMPLETA (Desktop o Modo Tabla seleccionado en Móvil)
  return (
    <View style={[styles.contenedor, estilo]}>
      {/* En móvil con modo tabla activo, mostrar selector y aviso de deslizamiento */}
      {esMovil && renderSelectorVistas(true)}

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
          {cargando ? (
            <View style={styles.filaVacia}>
              <ActivityIndicator size="small" color={Palette.forestGreen} />
              <Text style={[styles.textoVacio, { marginTop: 8 }]}>Cargando registros...</Text>
            </View>
          ) : datos.length > 0 ? (
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
          ) : (
            <View style={styles.filaVacia}>
              <Text style={styles.textoVacio}>{mensajeVacio}</Text>
            </View>
          )}
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
  contenedorMovil: {
    width: '100%',
    gap: 10,
  },
  barraToggleMovil: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 4,
    paddingVertical: 2,
    marginBottom: 4,
  },
  barraToggleMovilEnTabla: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#F8FAFC',
    borderBottomWidth: 1,
    borderBottomColor: Palette.border,
  },
  textoRegistrosMovil: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
  },
  grupoBotonesToggle: {
    flexDirection: 'row',
    backgroundColor: '#E5E7EB',
    borderRadius: 8,
    padding: 2,
    gap: 2,
  },
  botonToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 6,
  },
  botonToggleActivo: {
    backgroundColor: Palette.forestGreen,
  },
  textoBotonToggle: {
    fontSize: 11,
    fontWeight: '600',
    color: '#4B5563',
  },
  textoBotonToggleActivo: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  avisoDeslizar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  textoAvisoDeslizar: {
    fontSize: 11,
    color: '#6B7280',
    fontWeight: '500',
  },
  listaTarjetasMovil: {
    gap: 12,
    width: '100%',
  },
  tarjetaMovil: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 14,
    gap: 10,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  cabeceraTarjetaMovil: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 10,
    paddingBottom: 8,
    borderBottomWidth: 1.5,
    borderBottomColor: '#F1F5F9',
  },
  columnaPrincipalMovil: {
    flex: 1,
    gap: 4,
  },
  etiquetaPrincipalMovil: {
    fontSize: 10,
    fontWeight: '800',
    color: Palette.forestGreen,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  valorPrincipalMovil: {
    width: '100%',
  },
  badgeEstadoMovil: {
    alignSelf: 'flex-start',
  },
  cuerpoCamposMovil: {
    gap: 8,
  },
  filaCampoCorto: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 5,
    borderBottomWidth: 1,
    borderBottomColor: '#F8FAFC',
    gap: 10,
  },
  etiquetaCampoCorto: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    maxWidth: 130,
  },
  valorCampoCorto: {
    flex: 1,
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  bloqueCampoLargo: {
    gap: 4,
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#F8FAFC',
  },
  etiquetaCampoLargo: {
    fontSize: 10,
    fontWeight: '700',
    color: '#64748B',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  valorCampoLargo: {
    width: '100%',
  },
  pieAccionesMovil: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 8,
    marginTop: 2,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  etiquetaAccionesMovil: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
    textTransform: 'uppercase',
  },
  valorAccionesMovil: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
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
    minWidth: 960,
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
    overflow: 'hidden',
    minWidth: 0,
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
    overflow: 'hidden',
    minWidth: 0,
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
