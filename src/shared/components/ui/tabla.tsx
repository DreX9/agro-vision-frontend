import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ViewStyle,
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
 * @description Componente de tabla responsiva con tarjetas compactas de 1 columna adaptadas a pantalla móvil
 * y tabla de datos con saltos de línea ordenados y scroll horizontal suave.
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

  // Si la segunda columna es nombre, labor o título, mostrarla en cabecera
  const tieneColSecundaria =
    columnas.length > 1 &&
    (columnas[1].id === 'nombre' || columnas[1].id === 'labor' || columnas[1].id === 'titulo');
  const colSecundaria = tieneColSecundaria ? columnas[1] : undefined;

  // Columnas intermedias restantes para los metadatos compactos
  const columnasIntermedias = columnas.filter(
    (c) => c !== colPrincipal && c !== colSecundaria && c !== colAcciones && c !== colEstado,
  );

  const renderSelectorVistas = (enTabla = false) => {
    if (!mostrarSelectorVistas || !permitirCambioVistaMovil) return null;
    return (
      <View style={enTabla ? styles.barraToggleMovilEnTabla : styles.barraToggleMovil}>
        <Text style={styles.textoRegistrosMovil}>
          {datos.length} {datos.length === 1 ? 'registro' : 'registros'}
        </Text>
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
              Tarjetas
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
            <ArrowRightLeft size={11} color="#6B7280" />
            <Text style={styles.textoAvisoDeslizar}>Desliza</Text>
          </View>
        )}
      </View>
    );
  };

  // VISTA MÓVIL EN MODO TARJETA (1 COLUMNA COMPACTA ADAPTADA A LA PANTALLA)
  if (esMovil && vistaMovil === 'tarjetas') {
    return (
      <View style={[styles.contenedorMovil, estilo]}>
        {renderSelectorVistas(false)}

        {/* Listado de Tarjetas Compactas de 1 Columna */}
        {cargando ? (
          <View style={styles.filaVacia}>
            <ActivityIndicator size="small" color={Palette.forestGreen} />
            <Text style={[styles.textoVacio, { marginTop: 8 }]}>Cargando registros...</Text>
          </View>
        ) : datos.length > 0 ? (
          <View style={styles.listaTarjetasMovil}>
            {datos.map((item, index) => (
              <View key={claveExtractor(item)} style={styles.tarjetaMovil1Col}>
                {/* Cabecera: Identificador y Título a la izquierda, Estado y Acción a la derecha */}
                <View style={styles.cabecera1Col}>
                  <View style={styles.identificadoresWrapper}>
                    <View style={styles.filaIdYNombre}>
                      <View style={styles.cajaIdPrincipal}>
                        {colPrincipal.render(item, index)}
                      </View>
                      {colSecundaria && (
                        <View style={styles.cajaNombreSecundario}>
                          {colSecundaria.render(item, index)}
                        </View>
                      )}
                    </View>
                  </View>

                  <View style={styles.estadoYAccion1Col}>
                    {colEstado && (
                      <View style={styles.badgeEstado1Col}>
                        {colEstado.render(item, index)}
                      </View>
                    )}
                    {colAcciones && (
                      <View style={styles.botonAccion1Col}>
                        {colAcciones.render(item, index)}
                      </View>
                    )}
                  </View>
                </View>

                {/* Línea de atributos y metadatos en formato horizontal fluido */}
                {columnasIntermedias.length > 0 && (
                  <View style={styles.filaMetadatos1Col}>
                    {columnasIntermedias.map((col, idx) => (
                      <View key={col.id} style={styles.itemMeta1Col}>
                        <Text style={styles.etiquetaMeta1Col}>
                          {col.encabezado}:
                        </Text>
                        <View style={styles.valorMeta1Col}>
                          {col.render(item, index)}
                        </View>
                        {idx < columnasIntermedias.length - 1 && (
                          <Text style={styles.separadorBullet}>·</Text>
                        )}
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
          {/* Fila de Encabezados con saltos de línea permitidos */}
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
                  <Text style={styles.textoEncabezado} numberOfLines={2}>
                    {col.encabezado}
                  </Text>
                </View>
              );
            })}
          </View>

          {/* Filas de Datos con alineación vertical limpia y saltos de línea */}
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
    gap: 8,
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
    gap: 3,
  },
  textoAvisoDeslizar: {
    fontSize: 10,
    color: '#6B7280',
    fontWeight: '500',
  },
  listaTarjetasMovil: {
    gap: 8,
    width: '100%',
  },
  tarjetaMovil1Col: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingVertical: 10,
    paddingHorizontal: 12,
    gap: 6,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1,
  },
  cabecera1Col: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 8,
  },
  identificadoresWrapper: {
    flex: 1,
    minWidth: 0,
  },
  filaIdYNombre: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
  },
  cajaIdPrincipal: {
    flexShrink: 0,
  },
  cajaNombreSecundario: {
    flex: 1,
    minWidth: 120,
  },
  estadoYAccion1Col: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    flexShrink: 0,
  },
  badgeEstado1Col: {
    transform: [{ scale: 0.92 }],
  },
  botonAccion1Col: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  filaMetadatos1Col: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 6,
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  itemMeta1Col: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    flexWrap: 'wrap',
  },
  etiquetaMeta1Col: {
    fontSize: 10,
    fontWeight: '700',
    color: '#64748B',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  valorMeta1Col: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  separadorBullet: {
    fontSize: 12,
    color: '#94A3B8',
    fontWeight: '700',
    marginLeft: 3,
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
    minWidth: 840,
  },
  filaEncabezado: {
    flexDirection: 'row',
    backgroundColor: '#F3EFE6',
    borderBottomWidth: 1.5,
    borderBottomColor: Palette.border,
    paddingVertical: 12,
    paddingHorizontal: 12,
    alignItems: 'center',
  },
  celdaEncabezado: {
    paddingHorizontal: 8,
    justifyContent: 'center',
  },
  textoEncabezado: {
    fontSize: 11,
    fontWeight: '800',
    color: '#374151',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    lineHeight: 15,
  },
  filaDato: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#F0EAD8',
    paddingVertical: 12,
    paddingHorizontal: 12,
    alignItems: 'center',
  },
  filaPar: {
    backgroundColor: Palette.white,
  },
  filaImpar: {
    backgroundColor: '#FCFAF5',
  },
  celdaDato: {
    paddingHorizontal: 8,
    justifyContent: 'center',
  },
  filaVacia: {
    padding: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textoVacio: {
    fontSize: 13,
    color: Palette.textSecondary,
    fontStyle: 'italic',
  },
});
