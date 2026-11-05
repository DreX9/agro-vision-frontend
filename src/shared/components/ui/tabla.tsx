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
  mostrarSelectorVistas?: boolean;
}

/**
 * @description Componente de tabla de datos responsiva con vista en tarjetas 2x2 compactas para móviles
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
  mostrarSelectorVistas = true,
}: TablaProps<T>) {
  const { width } = useWindowDimensions();
  const esMovil = width < 768;
  const esPantallaMuyPequena = width < 340;
  const [vistaMovil, setVistaMovil] = useState<'tarjetas' | 'tabla'>(vistaInicialMovil);

  // Identificar columnas especiales
  const colAcciones = columnas.find(
    (c) => c.id === 'acciones' || c.encabezado.toLowerCase().includes('acci'),
  );
  const colEstado = columnas.find(
    (c) => c.id === 'estado' || c.encabezado.toLowerCase() === 'estado',
  );
  // Columna principal (código o primera columna)
  const colPrincipal = columnas[0];

  // Si la segunda columna es nombre, labor o título, mostrarla destacada bajo la cabecera
  const tieneColSecundaria =
    columnas.length > 1 &&
    (columnas[1].id === 'nombre' || columnas[1].id === 'labor' || columnas[1].id === 'titulo');
  const colSecundaria = tieneColSecundaria ? columnas[1] : undefined;

  // Columnas intermedias restantes en formato compacto
  const columnasIntermedias = columnas.filter(
    (c) => c !== colPrincipal && c !== colSecundaria && c !== colAcciones && c !== colEstado,
  );

  const renderSelectorVistas = (enTabla = false) => {
    if (!mostrarSelectorVistas || !permitirCambioVistaMovil) return null;
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
              size={12}
              color={vistaMovil === 'tarjetas' ? '#FFFFFF' : '#4B5563'}
            />
            <Text
              style={[
                styles.textoBotonToggle,
                vistaMovil === 'tarjetas' && styles.textoBotonToggleActivo,
              ]}
            >
              Cards (2x2)
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
              size={12}
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
            <ArrowRightLeft size={11} color="#6B7280" />
            <Text style={styles.textoAvisoDeslizar}>Desliza para ver más</Text>
          </View>
        )}
      </View>
    );
  };

  // VISTA MÓVIL EN MODO TARJETA (GRID 2x2 COMPACTO)
  if (esMovil && vistaMovil === 'tarjetas') {
    return (
      <View style={[styles.contenedorMovil, estilo]}>
        {renderSelectorVistas(false)}

        {/* Listado de Tarjetas en Cuadrícula 2x2 */}
        {cargando ? (
          <View style={styles.filaVacia}>
            <ActivityIndicator size="small" color={Palette.forestGreen} />
            <Text style={[styles.textoVacio, { marginTop: 8 }]}>Cargando registros...</Text>
          </View>
        ) : datos.length > 0 ? (
          <View style={styles.listaTarjetasMovil}>
            {datos.map((item, index) => (
              <View
                key={claveExtractor(item)}
                style={[
                  styles.tarjetaMovil2Col,
                  esPantallaMuyPequena && { width: '100%' },
                ]}
              >
                {/* Cabecera Compacta: Identificador + (Estado & Acciones a la derecha) */}
                <View style={styles.cabecera2Col}>
                  <View style={styles.idWrapper2Col}>
                    <Text style={styles.etiquetaId2Col} numberOfLines={1}>
                      {colPrincipal.encabezado}
                    </Text>
                    <View style={styles.valorId2Col}>
                      {colPrincipal.render(item, index)}
                    </View>
                  </View>

                  <View style={styles.estadoYAccion2Col}>
                    {colEstado && (
                      <View style={styles.badgeEstado2Col}>
                        {colEstado.render(item, index)}
                      </View>
                    )}
                    {colAcciones && (
                      <View style={styles.botonAccion2Col}>
                        {colAcciones.render(item, index)}
                      </View>
                    )}
                  </View>
                </View>

                {/* Bloque Secundario Destacado (Nombre de Lote / Labor) */}
                {colSecundaria && (
                  <View style={styles.bloqueSecundario2Col}>
                    <Text style={styles.etiquetaSecundaria2Col} numberOfLines={1}>
                      {colSecundaria.encabezado}
                    </Text>
                    <View style={styles.valorSecundario2Col}>
                      {colSecundaria.render(item, index)}
                    </View>
                  </View>
                )}

                {/* Campos restantes en formato ultra-compacto */}
                {columnasIntermedias.length > 0 && (
                  <View style={styles.cuerpoCampos2Col}>
                    {columnasIntermedias.map((col) => (
                      <View key={col.id} style={styles.filaCampo2Col}>
                        <Text style={styles.etiquetaCampo2Col} numberOfLines={1}>
                          {col.encabezado}:
                        </Text>
                        <View style={styles.valorCampo2Col}>
                          {col.render(item, index)}
                        </View>
                      </View>
                    ))}
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
      {/* En móvil con modo tabla activo, mostrar selector si está permitido */}
      {esMovil && renderSelectorVistas(true)}

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={true}
        contentContainerStyle={styles.scrollContenido}
        style={styles.scrollWrapper}
      >
        <View style={styles.tablaWrapper}>
          {/* Fila de Encabezados */}
          <View style={styles.filaEncabezado}>
            {columnas.map((col) => {
              const anchoEstilo = {
                flex: col.flex ?? 1,
                minWidth: col.anchoMinimo ?? 130,
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
                      minWidth: col.anchoMinimo ?? 130,
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
    gap: 8,
  },
  barraToggleMovil: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 4,
    paddingVertical: 2,
    marginBottom: 2,
  },
  barraToggleMovilEnTabla: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: '#F8FAFC',
    borderBottomWidth: 1,
    borderBottomColor: Palette.border,
  },
  textoRegistrosMovil: {
    fontSize: 11,
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
    gap: 4,
    paddingVertical: 4,
    paddingHorizontal: 8,
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
    gap: 3,
  },
  textoAvisoDeslizar: {
    fontSize: 10,
    color: '#6B7280',
    fontWeight: '500',
  },
  listaTarjetasMovil: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    width: '100%',
  },
  tarjetaMovil2Col: {
    width: '48.7%',
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 10,
    gap: 5,
    justifyContent: 'space-between',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1,
  },
  cabecera2Col: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 4,
    paddingBottom: 4,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  idWrapper2Col: {
    flex: 1,
    minWidth: 0,
    gap: 1,
  },
  etiquetaId2Col: {
    fontSize: 9,
    fontWeight: '800',
    color: Palette.forestGreen,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  valorId2Col: {
    minWidth: 0,
  },
  estadoYAccion2Col: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  badgeEstado2Col: {
    transform: [{ scale: 0.88 }],
  },
  botonAccion2Col: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  bloqueSecundario2Col: {
    paddingVertical: 2,
    borderBottomWidth: 1,
    borderBottomColor: '#F8FAFC',
    gap: 1,
  },
  etiquetaSecundaria2Col: {
    fontSize: 9,
    fontWeight: '700',
    color: '#64748B',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  valorSecundario2Col: {
    minWidth: 0,
  },
  cuerpoCampos2Col: {
    gap: 3,
  },
  filaCampo2Col: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 1,
  },
  etiquetaCampo2Col: {
    fontSize: 9,
    fontWeight: '700',
    color: '#64748B',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
    maxWidth: '48%',
  },
  valorCampo2Col: {
    flex: 1,
    alignItems: 'flex-end',
    justifyContent: 'center',
    minWidth: 0,
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
    minWidth: 1040,
  },
  filaEncabezado: {
    flexDirection: 'row',
    backgroundColor: '#F3EFE6',
    borderBottomWidth: 1.5,
    borderBottomColor: Palette.border,
    paddingVertical: 12,
    paddingHorizontal: 16,
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
    paddingVertical: 14,
    paddingHorizontal: 16,
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
