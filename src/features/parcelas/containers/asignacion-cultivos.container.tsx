import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  useWindowDimensions,
  Platform,
} from 'react-native';
import { useRouter, type Href } from 'expo-router';
import axios from 'axios';
import {
  Layers,
  Sprout,
  PlusCircle,
  Trash2,
  AlertTriangle,
  Info,
  CheckCircle2,
  Calendar,
  ChevronRight,
  Maximize2,
  MapPin,
  RefreshCw,
  Sparkles,
} from 'lucide-react-native';
import { Palette } from '@/constants/theme';
import { AppLayout } from '@/shared/components/layout/app-layout';
import {
  Boton,
  Input,
  Select,
  SelectorFecha,
  ModalConfirmacion,
  type DetalleConfirmacion,
  Badge,
} from '@/shared/components/ui';
import { MapaSectoresDelimitador } from '@/shared/components/mapa/mapa-sectores-delimitador';
import { ParcelasSkeleton } from '../components/parcelas-skeleton';
import { useParcelasQuery } from '../api/parcelas.api';
import {
  useSectoresPorParcelaQuery,
  useCrearSectorParcelaMutation,
  useEliminarSectorParcelaMutation,
} from '../api/sectores.api';
import { useCultivosQuery } from '@/features/cultivos/api/cultivos.api';
import { SectorParcelaItem } from '../types/sector-parcela.types';
import { type CoordenadaPunto, extraerPuntosPoligono } from '@/shared/utils/geometria';
import { PALETA_COLORES_LOTES } from '../components/parcela-formulario';

export interface AsignacionCultivosContainerProps {
  initialParcelaId?: string;
}

export const AsignacionCultivosContainer: React.FC<AsignacionCultivosContainerProps> = ({
  initialParcelaId,
}) => {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const esDesktop = width >= 1024;

  // Carga de parcelas y cultivos del sistema
  const { data: respuestaParcelas, isLoading: cargandoParcelas } = useParcelasQuery({ limite: 100 });
  const parcelas = respuestaParcelas?.items || [];
  const { data: cultivos = [], isLoading: cargandoCultivos } = useCultivosQuery();

  // Parcela actualmente seleccionada
  const [parcelaSeleccionadaId, setParcelaSeleccionadaId] = useState<string>('');

  // Sincronizar parcela inicial
  useEffect(() => {
    if (initialParcelaId && parcelas.some((p) => p.id === initialParcelaId)) {
      setParcelaSeleccionadaId(initialParcelaId);
    } else if (!parcelaSeleccionadaId && parcelas.length > 0) {
      setParcelaSeleccionadaId(parcelas[0].id);
    }
  }, [initialParcelaId, parcelas, parcelaSeleccionadaId]);

  const parcelaActual = useMemo(
    () => parcelas.find((p) => p.id === parcelaSeleccionadaId),
    [parcelas, parcelaSeleccionadaId],
  );

  // Consulta de balance y sectores de la parcela
  const {
    data: resumenSectores,
    isLoading: cargandoSectores,
    refetch: recargarSectores,
  } = useSectoresPorParcelaQuery(parcelaSeleccionadaId || undefined);

  const sectoresExistentes = resumenSectores?.sectores || [];

  // Puntos perimetrales de la parcela matriz
  const poligonoMatriz = useMemo(() => {
    if (!parcelaActual?.delimitacionGeoJson) return [];
    return extraerPuntosPoligono(parcelaActual.delimitacionGeoJson);
  }, [parcelaActual]);

  const tieneDelimitacionMatriz = poligonoMatriz.length >= 3;

  // Pestaña en columna izquierda: Trazar nuevo sector o ver lista de sectores existentes
  const [pestaniaActiva, setPestaniaActiva] = useState<'trazar' | 'lista'>('trazar');

  // Estados del formulario de nuevo sector
  const [codigoSector, setCodigoSector] = useState<string>('');
  const [nombreSector, setNombreSector] = useState<string>('');
  const [cultivoId, setCultivoId] = useState<string>('');
  const [variedad, setVariedad] = useState<string>('');
  const [colorSector, setColorSector] = useState<string>('#15803D');
  const [fechaSiembra, setFechaSiembra] = useState<string>('');
  const [fechaCosechaEstimada, setFechaCosechaEstimada] = useState<string>('');

  // Estado del trazado en mapa
  const [puntosTrazados, setPuntosTrazados] = useState<CoordenadaPunto[]>([]);
  const [areaTrazadaHa, setAreaTrazadaHa] = useState<number>(0);
  const [centroideTrazado, setCentroideTrazado] = useState<CoordenadaPunto | null>(null);
  const [tieneCruce, setTieneCruce] = useState<boolean>(false);
  const [errorValidacion, setErrorValidacion] = useState<string | null>(null);

  // Modales de confirmación
  const [confirmarCrearVisible, setConfirmarCrearVisible] = useState<boolean>(false);
  const [sectorAEliminar, setSectorAEliminar] = useState<SectorParcelaItem | null>(null);
  const [modalExitoMensaje, setModalExitoMensaje] = useState<string | null>(null);

  // Mutaciones
  const crearMutation = useCrearSectorParcelaMutation();
  const eliminarMutation = useEliminarSectorParcelaMutation();

  // Autogenerar código sugerido cuando cambia la parcela o el número de sectores
  useEffect(() => {
    if (parcelaActual) {
      const correlativo = sectoresExistentes.length + 1;
      const codSugerido = `${parcelaActual.codigo || 'P'}-S${String(correlativo).padStart(2, '0')}`;
      setCodigoSector(codSugerido);
    }
  }, [parcelaActual?.id, sectoresExistentes.length]);

  // Al seleccionar un cultivo, sugerir su color y variedades por defecto
  const handleCambioCultivo = (idCultivo: string) => {
    setCultivoId(idCultivo);
    const cultivo = cultivos.find((c) => c.id === idCultivo);
    if (cultivo) {
      if (cultivo.colorHex) {
        setColorSector(cultivo.colorHex);
      }
      if (cultivo.variedadesDefault && cultivo.variedadesDefault.length > 0) {
        setVariedad(cultivo.variedadesDefault[0]);
      } else {
        setVariedad('');
      }
      if (!nombreSector || nombreSector.startsWith('Sector')) {
        setNombreSector(`Sector ${cultivo.nombre}`);
      }
    }
  };

  // Callback del mapa interactivo
  const handleCambioPoligono = (datos: {
    puntos: CoordenadaPunto[];
    areaHectareas: number;
    centroide: CoordenadaPunto | null;
    tieneCruce?: boolean;
    tieneSuperposicion?: boolean;
    sectorConflicto?: string | null;
  }) => {
    setPuntosTrazados(datos.puntos);
    setAreaTrazadaHa(datos.areaHectareas);
    setCentroideTrazado(datos.centroide);
    setTieneCruce(Boolean(datos.tieneCruce));
    setErrorValidacion(null);
  };

  const handleLimpiarTrazo = () => {
    setPuntosTrazados([]);
    setAreaTrazadaHa(0);
    setCentroideTrazado(null);
    setTieneCruce(false);
    setErrorValidacion(null);
  };

  // Validaciones antes de abrir modal de confirmación
  const validarYConfirmarCreacion = () => {
    setErrorValidacion(null);

    if (!parcelaActual) {
      setErrorValidacion('Debe seleccionar una parcela.');
      return;
    }
    if (!tieneDelimitacionMatriz) {
      setErrorValidacion(
        'Esta parcela no tiene un perímetro delimitado. No es posible trazar sectores dentro de ella.',
      );
      return;
    }
    if (!codigoSector.trim()) {
      setErrorValidacion('Ingrese un código para el sector.');
      return;
    }
    if (!nombreSector.trim()) {
      setErrorValidacion('Ingrese un nombre descriptivo para el sector de cultivo.');
      return;
    }
    if (!cultivoId) {
      setErrorValidacion('Seleccione el tipo de cultivo que sembrará en este sector.');
      return;
    }
    if (puntosTrazados.length < 3) {
      setErrorValidacion('Debe delimitar al menos 3 vértices en el mapa satelital.');
      return;
    }
    if (tieneCruce) {
      setErrorValidacion('El perímetro trazado se cruza a sí mismo. Ajuste los vértices.');
      return;
    }
    if (areaTrazadaHa <= 0) {
      setErrorValidacion('El área calculada del sector debe ser mayor a 0 ha.');
      return;
    }

    const areaDisponible = resumenSectores?.areaDisponibleHectareas ?? Number(parcelaActual.areaHectareas);
    if (areaTrazadaHa > areaDisponible + 0.0001) {
      setErrorValidacion(
        `El área trazada (${areaTrazadaHa.toFixed(2)} ha) excede la superficie disponible (${areaDisponible.toFixed(2)} ha).`,
      );
      return;
    }

    setConfirmarCrearVisible(true);
  };

  const ejecutarCreacionSector = () => {
    if (!parcelaActual) return;

    crearMutation.mutate(
      {
        parcelaId: parcelaActual.id,
        datos: {
          codigo: codigoSector.trim(),
          nombre: nombreSector.trim(),
          cultivoId,
          variedad: variedad.trim() || undefined,
          areaHectareas: areaTrazadaHa,
          colorHex: colorSector,
          delimitacionGeoJson: puntosTrazados,
          latitudCentro: centroideTrazado?.latitude,
          longitudCentro: centroideTrazado?.longitude,
          fechaSiembra: fechaSiembra || undefined,
          fechaCosechaEstimada: fechaCosechaEstimada || undefined,
        },
      },
      {
        onSuccess: (nuevoSector) => {
          setConfirmarCrearVisible(false);
          setModalExitoMensaje(
            `El sector "${nuevoSector.nombre}" (${nuevoSector.codigo}) de ${nuevoSector.areaHectareas.toFixed(2)} ha ha sido asignado exitosamente.`,
          );
          // Limpiar trazado y formulario para el siguiente sector
          handleLimpiarTrazo();
          setNombreSector('');
          setVariedad('');
          setFechaSiembra('');
          setFechaCosechaEstimada('');
        },
        onError: (err) => {
          setConfirmarCrearVisible(false);
          let msg = 'No se pudo guardar el sector. Verifique los datos e intente nuevamente.';
          if (axios.isAxiosError(err) && err.response?.data?.message) {
            msg = Array.isArray(err.response.data.message)
              ? err.response.data.message.join('\n')
              : String(err.response.data.message);
          } else if (err instanceof Error) {
            msg = err.message;
          }
          setErrorValidacion(msg);
        },
      },
    );
  };

  const ejecutarEliminacionSector = () => {
    if (!parcelaActual || !sectorAEliminar) return;

    eliminarMutation.mutate(
      {
        parcelaId: parcelaActual.id,
        sectorId: sectorAEliminar.id,
      },
      {
        onSuccess: () => {
          const nombreEliminado = sectorAEliminar.nombre;
          setSectorAEliminar(null);
          setModalExitoMensaje(
            `El sector "${nombreEliminado}" fue eliminado y sus hectáreas fueron liberadas.`,
          );
        },
        onError: (err) => {
          setSectorAEliminar(null);
          let msg = 'No se pudo eliminar el sector.';
          if (axios.isAxiosError(err) && err.response?.data?.message) {
            msg = String(err.response.data.message);
          }
          setErrorValidacion(msg);
        },
      },
    );
  };

  const cultivoSeleccionado = cultivos.find((c) => c.id === cultivoId);

  // Resumen numérico
  const areaTotal = resumenSectores?.areaTotalHectareas ?? Number(parcelaActual?.areaHectareas || 0);
  const areaAsignada = resumenSectores?.areaAsignadaHectareas ?? 0;
  const areaDisponible = resumenSectores?.areaDisponibleHectareas ?? areaTotal;
  const porcentajeOcupado = resumenSectores?.porcentajeOcupado ?? (areaTotal > 0 ? (areaAsignada / areaTotal) * 100 : 0);

  // Opciones de selector de parcelas
  const opcionesParcelas = useMemo(
    () =>
      parcelas.map((p) => ({
        label: `${p.codigo || 'Lote'} - ${p.nombre} (${Number(p.areaHectareas).toFixed(2)} ha)`,
        valor: p.id,
      })),
    [parcelas],
  );

  // Opciones de selector de cultivos
  const opcionesCultivos = useMemo(
    () =>
      cultivos.map((c) => ({
        label: c.nombre,
        valor: c.id,
      })),
    [cultivos],
  );

  const detallesConfirmacionSector: DetalleConfirmacion[] = [
    { etiqueta: 'Parcela Matriz', valor: `${parcelaActual?.codigo} - ${parcelaActual?.nombre}` },
    { etiqueta: 'Código del Sector', valor: codigoSector },
    { etiqueta: 'Nombre del Sector', valor: nombreSector },
    { etiqueta: 'Cultivo Asignado', valor: cultivoSeleccionado?.nombre || 'Cultivo' },
    ...(variedad ? [{ etiqueta: 'Variedad', valor: variedad }] : []),
    {
      etiqueta: 'Superficie Sector',
      valor: `${areaTrazadaHa.toFixed(2)} ha (${areaTotal > 0 ? ((areaTrazadaHa / areaTotal) * 100).toFixed(1) : 0}% del predio)`,
    },
    {
      etiqueta: 'Color en Mapa',
      valor: colorSector,
      colorIndicador: colorSector,
    },
    ...(fechaSiembra ? [{ etiqueta: 'Fecha de Siembra', valor: fechaSiembra }] : []),
    ...(fechaCosechaEstimada
      ? [{ etiqueta: 'Fecha Estimada Cosecha', valor: fechaCosechaEstimada }]
      : []),
  ];

  if (cargandoParcelas || cargandoCultivos) {
    return (
      <AppLayout
        titulo="Asignación de Cultivos por Sectores"
        subtitulo="Cargando información predial y catálogo de cultivos..."
      >
        <ParcelasSkeleton />
      </AppLayout>
    );
  }

  return (
    <AppLayout
      titulo="Asignación de Cultivos por Sectores"
      subtitulo="Delimite sub-áreas de cultivo satelitales dentro de cada parcela matriz con imán perimetral"
      accionEncabezado={
        parcelaActual ? (
          <Boton
            titulo="Ver Ficha de Parcela"
            variante="outline"
            iconoIzquierda={<Maximize2 size={15} color={Palette.forestGreen} />}
            onPress={() => router.push(`/parcelas/${parcelaActual.id}` as Href)}
          />
        ) : undefined
      }
    >
      <View style={styles.contenedor}>
        {/* Selector de Parcela y Barra de Ocupación Agronómica */}
        <View style={styles.tarjetaSelector}>
          <View style={styles.filaSelectorParcela}>
            <View style={styles.bloqueSelectParcela}>
              <Text style={styles.etiquetaSelect}>Seleccionar Parcela Matriz:</Text>
              <Select
                placeholder="Elija una parcela para subdividir..."
                opciones={opcionesParcelas}
                valor={parcelaSeleccionadaId}
                onChange={(val) => {
                  setParcelaSeleccionadaId(val);
                  handleLimpiarTrazo();
                }}
              />
            </View>

            {parcelaActual && (
              <View style={styles.resumenChipLote}>
                <MapPin size={16} color={Palette.forestGreen} />
                <Text style={styles.textoChipLote}>
                  {parcelaActual.distrito || parcelaActual.departamento || 'Predio registrado'}
                </Text>
              </View>
            )}
          </View>

          {/* Advertencia si la parcela no tiene polígono trazado */}
          {parcelaActual && !tieneDelimitacionMatriz && (
            <View style={styles.alertaSinPoligono}>
              <AlertTriangle size={20} color="#D97706" />
              <View style={{ flex: 1 }}>
                <Text style={styles.tituloAlertaSinPoligono}>
                  La parcela "{parcelaActual.nombre}" no tiene delimitación satelital
                </Text>
                <Text style={styles.textoAlertaSinPoligono}>
                  Para poder delimitar cuarteles y sectores en su interior, primero debe registrar el
                  perímetro georreferenciado de la parcela matriz.
                </Text>
              </View>
              <Boton
                titulo="Trazar Perímetro"
                variante="primario"
                estilo={{ alignSelf: 'flex-start' }}
                onPress={() => router.push(`/parcelas/${parcelaActual.id}/editar` as Href)}
              />
            </View>
          )}

          {/* Barra de Balance de Superficies */}
          {parcelaActual && tieneDelimitacionMatriz && (
            <View style={styles.bloqueMetricas}>
              <View style={styles.grillaMetricas}>
                <View style={styles.cajaMetrica}>
                  <Text style={styles.etiquetaMetrica}>Superficie Matriz</Text>
                  <Text style={styles.valorMetrica}>{areaTotal.toFixed(2)} ha</Text>
                </View>

                <View style={styles.cajaMetrica}>
                  <Text style={styles.etiquetaMetrica}>Superficie Asignada</Text>
                  <Text style={[styles.valorMetrica, { color: Palette.forestGreen }]}>
                    {areaAsignada.toFixed(2)} ha
                  </Text>
                  <Text style={styles.subtextoMetrica}>
                    {sectoresExistentes.length} {sectoresExistentes.length === 1 ? 'sector' : 'sectores'}
                  </Text>
                </View>

                <View style={styles.cajaMetrica}>
                  <Text style={styles.etiquetaMetrica}>Superficie Disponible</Text>
                  <Text
                    style={[
                      styles.valorMetrica,
                      { color: areaDisponible <= 0.05 ? '#DC2626' : '#2563EB' },
                    ]}
                  >
                    {areaDisponible.toFixed(2)} ha
                  </Text>
                  <Text style={styles.subtextoMetrica}>
                    {(100 - porcentajeOcupado).toFixed(1)}% libre
                  </Text>
                </View>
              </View>

              {/* Barra de progreso de ocupación */}
              <View style={styles.barraProgresoContenedor}>
                <View style={styles.barraProgresoFondo}>
                  <View
                    style={[
                      styles.barraProgresoRelleno,
                      {
                        width: `${Math.min(100, Math.max(0, porcentajeOcupado))}%`,
                        backgroundColor:
                          porcentajeOcupado > 98
                            ? '#DC2626'
                            : porcentajeOcupado > 80
                            ? '#D97706'
                            : Palette.forestGreen,
                      },
                    ]}
                  />
                </View>
                <Text style={styles.textoPorcentajeProgreso}>
                  {porcentajeOcupado.toFixed(1)}% de la parcela asignado a cultivos
                </Text>
              </View>
            </View>
          )}
        </View>

        {/* Layout Principal: 2 columnas en Desktop */}
        <View style={[styles.layoutPrincipal, esDesktop ? styles.layoutDesktop : styles.layoutMovil]}>
          {/* COLUMNA IZQUIERDA: Formulario o Lista de Sectores */}
          <View style={esDesktop ? styles.columnaIzquierda : styles.columnaCompleta}>
            {/* Pestañas Trazar vs Lista */}
            <View style={styles.tabsColumna}>
              <Pressable
                onPress={() => setPestaniaActiva('trazar')}
                style={[styles.botonTab, pestaniaActiva === 'trazar' && styles.botonTabActivo]}
              >
                <PlusCircle
                  size={16}
                  color={pestaniaActiva === 'trazar' ? Palette.forestGreen : '#6B7280'}
                />
                <Text
                  style={[styles.textoTab, pestaniaActiva === 'trazar' && styles.textoTabActivo]}
                >
                  Nuevo Sector
                </Text>
              </Pressable>

              <Pressable
                onPress={() => setPestaniaActiva('lista')}
                style={[styles.botonTab, pestaniaActiva === 'lista' && styles.botonTabActivo]}
              >
                <Layers
                  size={16}
                  color={pestaniaActiva === 'lista' ? Palette.forestGreen : '#6B7280'}
                />
                <Text
                  style={[styles.textoTab, pestaniaActiva === 'lista' && styles.textoTabActivo]}
                >
                  Sectores ({sectoresExistentes.length})
                </Text>
              </Pressable>
            </View>

            {pestaniaActiva === 'trazar' ? (
              <View style={styles.tarjetaFormulario}>
                <View style={styles.cabeceraFormulario}>
                  <Sprout size={20} color={Palette.forestGreen} />
                  <View>
                    <Text style={styles.tituloFormulario}>Especificaciones del Sector</Text>
                    <Text style={styles.subtituloFormulario}>
                      Asigne el cultivo y trace el polígono en el satélite
                    </Text>
                  </View>
                </View>

                {errorValidacion && (
                  <View style={styles.cajaError}>
                    <AlertTriangle size={16} color="#DC2626" />
                    <Text style={styles.textoError}>{errorValidacion}</Text>
                  </View>
                )}

                <View style={styles.cuerpoFormulario}>
                  {/* Código correlativo */}
                  <Input
                    label="Código de Sector / Cuartel:"
                    placeholder="Ej. P-001-S01"
                    value={codigoSector}
                    onChangeText={setCodigoSector}
                  />

                  {/* Cultivo a sembrar */}
                  <View style={styles.grupoCampo}>
                    <Text style={styles.etiquetaCampo}>Tipo de Cultivo:</Text>
                    <Select
                      placeholder="Seleccionar cultivo..."
                      opciones={opcionesCultivos}
                      valor={cultivoId}
                      onChange={handleCambioCultivo}
                    />
                  </View>

                  {/* Nombre del sector */}
                  <Input
                    label="Nombre del Sector:"
                    placeholder="Ej. Sector Norte - Palto Hass"
                    value={nombreSector}
                    onChangeText={setNombreSector}
                  />

                  {/* Variedad específica */}
                  <Input
                    label="Variedad de Cultivo (Opcional):"
                    placeholder="Ej. Hass, Fuerte, Maluma..."
                    value={variedad}
                    onChangeText={setVariedad}
                  />

                  {/* Paleta rápida de colores del sector */}
                  <View style={styles.grupoCampo}>
                    <Text style={styles.etiquetaCampo}>Color Distintivo del Sector:</Text>
                    <View style={styles.filaPaletaColores}>
                      {PALETA_COLORES_LOTES.map((color) => {
                        const esSeleccionado = colorSector.toLowerCase() === color.toLowerCase();
                        return (
                          <Pressable
                            key={color}
                            onPress={() => setColorSector(color)}
                            style={[
                              styles.chipColor,
                              { backgroundColor: color },
                              esSeleccionado && styles.chipColorSeleccionado,
                            ]}
                          >
                            {esSeleccionado && <CheckCircle2 size={14} color="#FFFFFF" />}
                          </Pressable>
                        );
                      })}
                    </View>
                  </View>

                  {/* Fechas de siembra y cosecha */}
                  <View style={styles.filaFechas}>
                    <View style={{ flex: 1 }}>
                      <SelectorFecha
                        label="Fecha de Siembra:"
                        placeholder="AAAA-MM-DD"
                        valor={fechaSiembra}
                        onChange={setFechaSiembra}
                      />
                    </View>
                    <View style={{ flex: 1 }}>
                      <SelectorFecha
                        label="Cosecha Estimada:"
                        placeholder="AAAA-MM-DD"
                        valor={fechaCosechaEstimada}
                        onChange={setFechaCosechaEstimada}
                      />
                    </View>
                  </View>

                  {/* Monitor en tiempo real de área trazada */}
                  <View style={styles.tarjetaAreaEnVivo}>
                    <View style={styles.filaAreaEnVivo}>
                      <View>
                        <Text style={styles.etiquetaAreaEnVivo}>Área Delimitada en Mapa:</Text>
                        <Text style={styles.valorAreaEnVivo}>
                          {areaTrazadaHa > 0 ? `${areaTrazadaHa.toFixed(2)} ha` : '0.00 ha'}
                        </Text>
                      </View>
                      <Badge
                        texto={
                          puntosTrazados.length >= 3
                            ? `${puntosTrazados.length} vértices trazados`
                            : 'Trazando...'
                        }
                        variante={puntosTrazados.length >= 3 ? 'exito' : 'neutro'}
                      />
                    </View>

                    {areaTrazadaHa > areaDisponible && (
                      <Text style={styles.advertenciaExcesoArea}>
                        ⚠️ Excede el área disponible ({areaDisponible.toFixed(2)} ha)
                      </Text>
                    )}
                  </View>

                  {/* Acciones de guardado y limpieza */}
                  <View style={styles.filaAccionesFormulario}>
                    <Boton
                      titulo="Limpiar Trazo"
                      variante="outline"
                      onPress={handleLimpiarTrazo}
                      disabled={puntosTrazados.length === 0}
                    />
                    <Boton
                      titulo="Guardar y Asignar Sector"
                      variante="primario"
                      cargando={crearMutation.isPending}
                      onPress={validarYConfirmarCreacion}
                      disabled={puntosTrazados.length < 3 || !cultivoId || !nombreSector.trim()}
                    />
                  </View>
                </View>
              </View>
            ) : (
              /* PESTAÑA: LISTA DE SECTORES EXISTENTES */
              <View style={styles.tarjetaFormulario}>
                <View style={styles.cabeceraFormulario}>
                  <Layers size={20} color={Palette.forestGreen} />
                  <View>
                    <Text style={styles.tituloFormulario}>Sectores Registrados</Text>
                    <Text style={styles.subtituloFormulario}>
                      {sectoresExistentes.length} {sectoresExistentes.length === 1 ? 'cuartel' : 'cuarteles'} distribuidos en este predio
                    </Text>
                  </View>
                </View>

                {sectoresExistentes.length === 0 ? (
                  <View style={styles.contenedorListaVacia}>
                    <Sprout size={32} color="#9CA3AF" />
                    <Text style={styles.textoListaVacia}>
                      No hay sectores delimitados en esta parcela todavía.
                    </Text>
                    <Boton
                      titulo="Trazar el Primer Sector"
                      variante="secundario"
                      onPress={() => setPestaniaActiva('trazar')}
                    />
                  </View>
                ) : (
                  <ScrollView
                    style={{ maxHeight: 650 }}
                    contentContainerStyle={styles.listaSectoresContainer}
                    showsVerticalScrollIndicator={false}
                  >
                    {sectoresExistentes.map((sector) => {
                      const colorBadge = sector.colorHex || sector.cultivoColorHex || Palette.forestGreen;
                      const porcentajeSector =
                        areaTotal > 0 ? ((sector.areaHectareas / areaTotal) * 100).toFixed(1) : 0;

                      return (
                        <View key={sector.id} style={styles.itemTarjetaSector}>
                          <View style={styles.cabeceraItemSector}>
                            <View style={styles.ladoIzquierdoItemSector}>
                              <View
                                style={[
                                  styles.indicadorColorItem,
                                  { backgroundColor: colorBadge },
                                ]}
                              />
                              <View>
                                <View style={styles.filaCodigoSector}>
                                  <Text style={styles.codigoItemSector}>{sector.codigo}</Text>
                                  <Badge texto={`${sector.areaHectareas.toFixed(2)} ha`} variante="info" />
                                </View>
                                <Text style={styles.nombreItemSector}>{sector.nombre}</Text>
                              </View>
                            </View>

                            <Pressable
                              onPress={() => setSectorAEliminar(sector)}
                              style={({ pressed }) => [
                                styles.botonEliminarSector,
                                pressed && styles.botonEliminarPresionado,
                              ]}
                            >
                              <Trash2 size={16} color="#DC2626" />
                            </Pressable>
                          </View>

                          <View style={styles.detallesItemSector}>
                            <View style={styles.filaDetalleSector}>
                              <Sprout size={14} color="#6B7280" />
                              <Text style={styles.textoDetalleSector}>
                                Cultivo: <Text style={{ fontWeight: '600', color: '#1F2937' }}>{sector.cultivoNombre || 'Cultivo'}</Text>
                                {sector.variedad ? ` (${sector.variedad})` : ''}
                              </Text>
                            </View>

                            <View style={styles.filaDetalleSector}>
                              <Layers size={14} color="#6B7280" />
                              <Text style={styles.textoDetalleSector}>
                                Ocupación: {porcentajeSector}% de la parcela matriz
                              </Text>
                            </View>

                            {(sector.fechaSiembra || sector.fechaCosechaEstimada) && (
                              <View style={styles.filaDetalleSector}>
                                <Calendar size={14} color="#6B7280" />
                                <Text style={styles.textoDetalleSector}>
                                  {sector.fechaSiembra ? `Siembra: ${sector.fechaSiembra}` : ''}
                                  {sector.fechaSiembra && sector.fechaCosechaEstimada ? ' • ' : ''}
                                  {sector.fechaCosechaEstimada ? `Cosecha: ${sector.fechaCosechaEstimada}` : ''}
                                </Text>
                              </View>
                            )}
                          </View>
                        </View>
                      );
                    })}
                  </ScrollView>
                )}
              </View>
            )}
          </View>

          {/* COLUMNA DERECHA: Visor y Delimitador Satelital con Snapping */}
          <View style={esDesktop ? styles.columnaDerecha : styles.columnaCompleta}>
            <View style={styles.tarjetaMapa}>
              <View style={styles.cabeceraMapa}>
                <View>
                  <View style={styles.filaTituloMapa}>
                    <Text style={styles.tituloMapa}>Delimitador Satelital con Imán Magnético</Text>
                    <View style={styles.badgeSnappingActivo}>
                      <Sparkles size={13} color="#059669" />
                      <Text style={styles.textoSnappingActivo}>Imán perimetral activo</Text>
                    </View>
                  </View>
                  <Text style={styles.subtituloMapa}>
                    {tieneDelimitacionMatriz
                      ? 'Haga clic para colocar vértices dentro del lote matriz. Los puntos se imantarán a los límites.'
                      : 'Seleccione una parcela con delimitación perimetral para comenzar.'}
                  </Text>
                </View>
              </View>

              <MapaSectoresDelimitador
                poligonoParcelaMatriz={poligonoMatriz}
                sectoresExistentes={sectoresExistentes}
                colorPoligonoNuevo={colorSector}
                puntosInicialesNuevo={puntosTrazados}
                nombreParcela={parcelaActual?.nombre || 'Parcela'}
                codigoParcela={parcelaActual?.codigo || 'P-001'}
                areaMatrizHectareas={Number(parcelaActual?.areaHectareas || 0)}
                altura={esDesktop ? 680 : 440}
                soloLectura={!tieneDelimitacionMatriz}
                onCambioPoligono={handleCambioPoligono}
              />
            </View>
          </View>
        </View>
      </View>

      {/* Modal de Confirmación Previa al Registro del Sector */}
      <ModalConfirmacion
        visible={confirmarCrearVisible}
        tipo="confirmacion"
        titulo="¿Confirmar Asignación de Sector?"
        mensaje="Verifique la superficie trazada y las especificaciones del cultivo antes de guardar el nuevo sector."
        detalles={detallesConfirmacionSector}
        textoConfirmar="Confirmar y Asignar Sector"
        textoCancelar="Seguir Ajustando"
        cargando={crearMutation.isPending}
        onConfirmar={ejecutarCreacionSector}
        onCancelar={() => setConfirmarCrearVisible(false)}
      />

      {/* Modal de Confirmación para Eliminar Sector */}
      <ModalConfirmacion
        visible={Boolean(sectorAEliminar)}
        tipo="peligro"
        titulo="¿Eliminar Sector de Cultivo?"
        mensaje={`¿Está seguro de eliminar el sector "${sectorAEliminar?.nombre}" (${sectorAEliminar?.codigo})? Esta acción liberará sus ${sectorAEliminar?.areaHectareas.toFixed(2)} hectáreas para que puedan ser reasignadas a otros cultivos.`}
        textoConfirmar="Eliminar y Liberar Superficie"
        textoCancelar="Cancelar"
        cargando={eliminarMutation.isPending}
        onConfirmar={ejecutarEliminacionSector}
        onCancelar={() => setSectorAEliminar(null)}
      />

      {/* Modal de Éxito */}
      <ModalConfirmacion
        visible={Boolean(modalExitoMensaje)}
        tipo="exito"
        titulo="Operación Exitosa"
        mensaje={modalExitoMensaje || ''}
        textoConfirmar="Aceptar"
        onConfirmar={() => setModalExitoMensaje(null)}
      />
    </AppLayout>
  );
};

const styles = StyleSheet.create({
  contenedor: { flex: 1, paddingBottom: 30 },
  tarjetaSelector: {
    backgroundColor: Palette.white,
    borderRadius: 14,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    ...Platform.select({
      web: {
        boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
      },
    }),
  },
  filaSelectorParcela: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 12,
  },
  bloqueSelectParcela: {
    flex: 1,
    minWidth: 280,
  },
  etiquetaSelect: {
    fontSize: 13,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 6,
  },
  resumenChipLote: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
  },
  textoChipLote: {
    fontSize: 13,
    color: '#4B5563',
    fontWeight: '500',
  },
  alertaSinPoligono: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    padding: 14,
    backgroundColor: '#FEF3C7',
    borderRadius: 10,
    marginTop: 14,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  tituloAlertaSinPoligono: {
    fontSize: 14,
    fontWeight: '700',
    color: '#92400E',
    marginBottom: 2,
  },
  textoAlertaSinPoligono: {
    fontSize: 13,
    color: '#B45309',
    lineHeight: 18,
  },
  bloqueMetricas: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  grillaMetricas: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 12,
  },
  cajaMetrica: {
    flex: 1,
    minWidth: 140,
    backgroundColor: '#F9FAFB',
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  etiquetaMetrica: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
    marginBottom: 4,
  },
  valorMetrica: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },
  subtextoMetrica: {
    fontSize: 11,
    color: '#9CA3AF',
    marginTop: 2,
  },
  barraProgresoContenedor: {
    marginTop: 4,
  },
  barraProgresoFondo: {
    height: 8,
    backgroundColor: '#E5E7EB',
    borderRadius: 4,
    overflow: 'hidden',
  },
  barraProgresoRelleno: {
    height: '100%',
    borderRadius: 4,
  },
  textoPorcentajeProgreso: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 6,
    textAlign: 'right',
  },
  layoutPrincipal: {
    width: '100%',
  },
  layoutDesktop: {
    flexDirection: 'row',
    gap: 18,
    alignItems: 'flex-start',
  },
  layoutMovil: {
    flexDirection: 'column',
    gap: 18,
  },
  columnaIzquierda: {
    width: 440,
    flexShrink: 0,
  },
  columnaDerecha: {
    flex: 1,
    minWidth: 0,
  },
  columnaCompleta: {
    width: '100%',
  },
  tabsColumna: {
    flexDirection: 'row',
    backgroundColor: '#E5E7EB',
    padding: 3,
    borderRadius: 10,
    marginBottom: 12,
  },
  botonTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 9,
    borderRadius: 8,
  },
  botonTabActivo: {
    backgroundColor: Palette.white,
    ...Platform.select({
      web: {
        boxShadow: '0 1px 2px rgba(0,0,0,0.08)',
      },
    }),
  },
  textoTab: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6B7280',
  },
  textoTabActivo: {
    color: Palette.forestGreen,
  },
  tarjetaFormulario: {
    backgroundColor: Palette.white,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    ...Platform.select({
      web: {
        boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
      },
    }),
  },
  cabeceraFormulario: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 14,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  tituloFormulario: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
  },
  subtituloFormulario: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  cuerpoFormulario: {
    gap: 14,
  },
  cajaError: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 10,
    backgroundColor: '#FEE2E2',
    borderRadius: 8,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#FCA5A5',
  },
  textoError: {
    fontSize: 12,
    color: '#B91C1C',
    fontWeight: '600',
    flex: 1,
  },
  grupoCampo: {
    gap: 6,
  },
  etiquetaCampo: {
    fontSize: 13,
    fontWeight: '600',
    color: '#374151',
  },
  filaPaletaColores: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 4,
  },
  chipColor: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipColorSeleccionado: {
    borderWidth: 2,
    borderColor: '#111827',
    transform: [{ scale: 1.15 }],
  },
  filaFechas: {
    flexDirection: 'row',
    gap: 10,
  },
  tarjetaAreaEnVivo: {
    backgroundColor: '#F0FDF4',
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#BBF7D0',
    marginTop: 4,
  },
  filaAreaEnVivo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  etiquetaAreaEnVivo: {
    fontSize: 12,
    color: '#166534',
    fontWeight: '500',
  },
  valorAreaEnVivo: {
    fontSize: 20,
    fontWeight: '800',
    color: '#15803D',
    marginTop: 2,
  },
  advertenciaExcesoArea: {
    fontSize: 12,
    color: '#DC2626',
    fontWeight: '600',
    marginTop: 6,
  },
  filaAccionesFormulario: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 6,
  },
  tarjetaMapa: {
    backgroundColor: Palette.white,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    ...Platform.select({
      web: {
        boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
      },
    }),
  },
  cabeceraMapa: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  filaTituloMapa: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  tituloMapa: {
    fontSize: 15,
    fontWeight: '700',
    color: '#111827',
  },
  badgeSnappingActivo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  textoSnappingActivo: {
    fontSize: 11,
    fontWeight: '600',
    color: '#065F46',
  },
  subtituloMapa: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  contenedorListaVacia: {
    padding: 30,
    alignItems: 'center',
    gap: 12,
  },
  textoListaVacia: {
    fontSize: 13,
    color: '#6B7280',
    textAlign: 'center',
  },
  listaSectoresContainer: {
    gap: 10,
    paddingVertical: 4,
  },
  itemTarjetaSector: {
    backgroundColor: '#F9FAFB',
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  cabeceraItemSector: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  ladoIzquierdoItemSector: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  indicadorColorItem: {
    width: 12,
    height: 34,
    borderRadius: 4,
  },
  filaCodigoSector: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  codigoItemSector: {
    fontSize: 12,
    fontWeight: '700',
    color: '#374151',
  },
  nombreItemSector: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
  },
  botonEliminarSector: {
    padding: 6,
    borderRadius: 6,
    backgroundColor: '#FEE2E2',
  },
  botonEliminarPresionado: {
    opacity: 0.7,
  },
  detallesItemSector: {
    gap: 4,
    paddingLeft: 20,
  },
  filaDetalleSector: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  textoDetalleSector: {
    fontSize: 12,
    color: '#4B5563',
  },
});
