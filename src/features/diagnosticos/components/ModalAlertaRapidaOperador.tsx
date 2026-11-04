import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  Pressable,
  ScrollView,
  TextInput,
  ActivityIndicator,
  Platform,
  Image,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import {
  AlertTriangle,
  MapPin,
  Camera,
  Image as ImageIcon,
  CheckCircle2,
  X,
  RefreshCw,
  Bug,
  AlertCircle,
  Send,
  Sparkles,
  RotateCcw,
} from 'lucide-react-native';
import { Palette } from '@/constants/theme';
import { Badge } from '@/shared/components/ui/badge';
import { Boton } from '@/shared/components/ui/boton';
import { Select } from '@/shared/components/ui/select';
import { useAuthStore } from '@/features/autenticacion';
import { useParcelasQuery } from '@/features/parcelas/api/parcelas.api';
import { useSectoresPorParcelaQuery } from '@/features/parcelas/api/sectores.api';
import {
  useEscanearImagenMutation,
  useGuardarDiagnosticoMutation,
} from '../api/diagnostico.api';
import { DiagnosticoRespuesta } from '../types/diagnostico.types';
import { obtenerCoordenadasDispositivo, CoordenadasGps } from '../utils/geolocalizacion';
import { detectarUbicacionEnFundo, ResultadoDeteccionGeografica } from '../utils/detector-geografico';

export interface ModalAlertaRapidaOperadorProps {
  visible: boolean;
  onCerrar: () => void;
}

/**
 * @description Prepara el objeto FormData compatible multiplataforma (Web y Móvil nativo).
 */
async function crearFormDataParaInferencia(uri: string): Promise<FormData> {
  const formData = new FormData();

  if (Platform.OS === 'web') {
    try {
      const res = await fetch(uri);
      const blob = await res.blob();
      formData.append('archivo', blob, 'planta_alerta.jpg');
    } catch {
      formData.append('archivo', uri);
    }
  } else {
    formData.append('archivo', {
      uri,
      name: 'planta_alerta.jpg',
      type: 'image/jpeg',
    } as any);
  }

  return formData;
}

/**
 * @description Modal de Alerta Fitosanitaria para el Operador de Campo.
 * Integra la cámara de diagnóstico y el motor de visión computacional (IA) para pre-evaluación
 * y reconocimiento satelital de parcela/sector, escalando la alerta en tiempo real a su Supervisor.
 */
export function ModalAlertaRapidaOperador({
  visible,
  onCerrar,
}: ModalAlertaRapidaOperadorProps) {
  const usuarioActual = useAuthStore((s) => s.usuario);
  const guardarMutation = useGuardarDiagnosticoMutation();
  const escanearMutation = useEscanearImagenMutation();

  // Parcelas del fundo
  const { data: datosParcelas } = useParcelasQuery({ limite: 100 });
  const parcelas = datosParcelas?.items || [];

  // Estados de geolocalización
  const [cargandoGps, setCargandoGps] = useState(false);
  const [coords, setCoords] = useState<CoordenadasGps | null>(null);
  const [deteccion, setDeteccion] = useState<ResultadoDeteccionGeografica | null>(null);

  // Parcela y sector
  const [parcelaId, setParcelaId] = useState<string>('');
  const [sectorId, setSectorId] = useState<string>('');

  const { data: datosSectores, isLoading: cargandoSectores } = useSectoresPorParcelaQuery(
    parcelaId || undefined,
  );
  const sectores = datosSectores?.sectores || [];

  // Estado de la foto y la inferencia de IA
  const [fotoUri, setFotoUri] = useState<string | null>(null);
  const [fotoBase64, setFotoBase64] = useState<string | null>(null);
  const [diagnosticoIa, setDiagnosticoIa] = useState<DiagnosticoRespuesta | null>(null);
  const [errorIa, setErrorIa] = useState<string | null>(null);
  const [observaciones, setObservaciones] = useState('');

  // Estado tras enviar la alerta
  const [alertaEnviadaConExito, setAlertaEnviadaConExito] = useState(false);
  const [codigoGenerado, setCodigoGenerado] = useState('');

  // Adquisición de GPS y evaluación geoespacial en el fundo
  const refrescarUbicacion = useCallback(async () => {
    setCargandoGps(true);
    try {
      const gps = await obtenerCoordenadasDispositivo();
      if (gps) {
        setCoords(gps);
        if (parcelas.length > 0) {
          const resultado = await detectarUbicacionEnFundo(gps, parcelas);
          setDeteccion(resultado);

          if (resultado.parcelaId) {
            setParcelaId(resultado.parcelaId);
          }
          if (resultado.sectorId) {
            setSectorId(resultado.sectorId);
          }
        }
      }
    } catch (error) {
      console.warn('[ModalAlertaOperador] Error al obtener GPS:', error);
    } finally {
      setCargandoGps(false);
    }
  }, [parcelas]);

  // Al abrir el modal, reiniciar estados y obtener GPS
  useEffect(() => {
    if (visible) {
      setAlertaEnviadaConExito(false);
      setCodigoGenerado('');
      setFotoUri(null);
      setFotoBase64(null);
      setDiagnosticoIa(null);
      setErrorIa(null);
      setObservaciones('');
      refrescarUbicacion();
    }
  }, [visible, refrescarUbicacion]);

  // Preseleccionar primera parcela si no hay seleccionada
  useEffect(() => {
    if (!parcelaId && parcelas.length > 0) {
      setParcelaId(parcelas[0].id);
    }
  }, [parcelas, parcelaId]);

  /**
   * @description Procesa la imagen capturada enviándola inmediatamente a la IA para inferencia automática.
   */
  const procesarImagenConIa = async (uri: string) => {
    setErrorIa(null);
    setDiagnosticoIa(null);

    try {
      const formData = await crearFormDataParaInferencia(uri);
      escanearMutation.mutate(formData, {
        onSuccess: (data) => {
          setDiagnosticoIa(data);
        },
        onError: (err) => {
          console.warn('[ModalAlertaOperador] IA no disponible:', err);
          setErrorIa(
            'El microservicio de IA no respondió en este momento. Aún así puedes emitir la alerta con la foto para revisión manual de tu Supervisor.',
          );
        },
      });
    } catch (err) {
      console.error('Error al preparar imagen para inferencia:', err);
      setErrorIa('Error al preparar la imagen para el análisis.');
    }
  };

  // Abrir cámara nativa para escaneo fitosanitario
  const tomarFotoCamara = async () => {
    try {
      const permiso = await ImagePicker.requestCameraPermissionsAsync();
      if (!permiso.granted) {
        alert('Se requieren permisos de cámara para capturar la evidencia.');
        return;
      }

      const resultado = await ImagePicker.launchCameraAsync({
        allowsEditing: false,
        quality: 0.7,
        base64: true,
      });

      if (!resultado.canceled && resultado.assets?.[0]) {
        const asset = resultado.assets[0];
        setFotoUri(asset.uri);
        if (asset.base64) {
          setFotoBase64(`data:image/jpeg;base64,${asset.base64}`);
        }
        await procesarImagenConIa(asset.uri);
      }
    } catch (err) {
      console.warn('Error al activar cámara:', err);
    }
  };

  // Subir imagen de galería
  const seleccionarFotoGaleria = async () => {
    try {
      const permiso = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permiso.granted) {
        alert('Se requieren permisos de galería para seleccionar la evidencia.');
        return;
      }

      const resultado = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: false,
        quality: 0.7,
        base64: true,
      });

      if (!resultado.canceled && resultado.assets?.[0]) {
        const asset = resultado.assets[0];
        setFotoUri(asset.uri);
        if (asset.base64) {
          setFotoBase64(`data:image/jpeg;base64,${asset.base64}`);
        }
        await procesarImagenConIa(asset.uri);
      }
    } catch (err) {
      console.warn('Error al seleccionar imagen:', err);
    }
  };

  // Limpiar foto y reiniciar para nuevo escaneo
  const handleLimpiarFoto = () => {
    setFotoUri(null);
    setFotoBase64(null);
    setDiagnosticoIa(null);
    setErrorIa(null);
  };

  // Emitir la alerta fitosanitaria a su supervisor
  const handleSubmitAlerta = async () => {
    if (!parcelaId) {
      alert('Debes confirmar la parcela donde te encuentras.');
      return;
    }

    if (!fotoUri) {
      alert('Por favor captura una foto de la planta para que la IA realice la pre-evaluación.');
      return;
    }

    const lat = coords?.latitud || parcelas.find((p) => p.id === parcelaId)?.latitudCentro || -11.95;
    const lng = coords?.longitud || parcelas.find((p) => p.id === parcelaId)?.longitudCentro || -76.98;

    // Si la IA respondió, usar su clasificación; de lo contrario, clasificar como ALERTA preventiva
    const estadoGeneral = diagnosticoIa?.estado_general || 'ALERTA';
    const saludPorcentaje = diagnosticoIa?.salud_porcentaje ? Math.round(diagnosticoIa.salud_porcentaje) : 60;
    const totalPlagas = diagnosticoIa?.total_plagas_detectadas ?? 1;
    const detecciones = diagnosticoIa?.detecciones || [
      {
        clase: 'Pre-evaluación en campo por operador',
        confianza: 0.9,
        caja: { x_min: 0, y_min: 0, x_max: 100, y_max: 100 },
      },
    ];
    const recomendaciones = diagnosticoIa?.recomendaciones || [
      'Verificación urgente en terreno por el supervisor de campo asignado.',
    ];

    const payload = {
      parcelaId,
      sectorId: sectorId || undefined,
      usuarioId: usuarioActual?.id,
      latitud: Number(lat),
      longitud: Number(lng),
      estadoGeneral,
      saludPorcentaje,
      totalPlagasDetectadas: totalPlagas,
      esAlerta: true,
      detecciones,
      recomendaciones,
      tiempoProcesamientoMs: diagnosticoIa?.tiempo_procesamiento_ms || undefined,
      imagenUrl: fotoBase64 || fotoUri || undefined,
      origenCaptura: 'OPERADOR_CAMPO_APP',
      observaciones: observaciones.trim() || 'Alerta con cámara de pre-evaluación IA emitida por operador',
    };

    try {
      const res = await guardarMutation.mutateAsync(payload);
      setCodigoGenerado(res.codigo);
      setAlertaEnviadaConExito(true);
    } catch (error: any) {
      console.error('Error al emitir alerta:', error);
      alert(
        error?.response?.data?.message ||
          'No se pudo emitir la alerta. Verifica la conexión con el servidor.',
      );
    }
  };

  const parcelaSeleccionada = parcelas.find((p) => p.id === parcelaId);
  const sectorSeleccionado = sectores.find((s) => s.id === sectorId);

  return (
    <Modal
      transparent
      animationType="slide"
      visible={visible}
      onRequestClose={onCerrar}
    >
      <View style={styles.overlayFondo}>
        <View style={styles.contenedorModal}>
          {/* Cabecera */}
          <View style={styles.cabecera}>
            <View style={styles.filaTitulo}>
              <View style={styles.iconoAlerta}>
                <AlertTriangle size={24} color="#DC2626" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.tituloModal}>¡ALERTA FITOSANITARIA EN CAMPO!</Text>
                <Text style={styles.subtituloModal}>
                  Pre-evaluación con IA y escalamiento inmediato al Supervisor
                </Text>
              </View>
            </View>

            <Pressable
              onPress={onCerrar}
              style={({ pressed }) => [styles.botonCerrar, pressed && styles.presionado]}
            >
              <X size={20} color="#64748B" />
            </Pressable>
          </View>

          {/* Estado de Éxito al Transmitir Alerta */}
          {alertaEnviadaConExito ? (
            <View style={styles.cuerpoExito}>
              <View style={styles.iconoExitoGrande}>
                <CheckCircle2 size={54} color="#16A34A" />
              </View>

              <Text style={styles.tituloExito}>¡ALERTA EMITIDA CON ÉXITO!</Text>
              <Text style={styles.codigoExito}>{codigoGenerado}</Text>
              <Text style={styles.descripcionExito}>
                Tu foto, la pre-evaluación de la IA y tus coordenadas GPS se han transmitido en tiempo real.
                La alarma ha escalado a la pantalla de tu{' '}
                <Text style={{ fontWeight: 'bold', color: Palette.forestGreen }}>
                  Supervisor de Campo
                </Text>{' '}
                para que el equipo técnico se encargue de la verificación y tratamiento.
              </Text>

              <View style={styles.resumenExito}>
                <Text style={styles.itemResumenExito}>
                  📍 Parcela: {parcelaSeleccionada?.nombre} ({parcelaSeleccionada?.codigo})
                </Text>
                {sectorSeleccionado && (
                  <Text style={styles.itemResumenExito}>
                    🌱 Sector: {sectorSeleccionado.nombre} · {sectorSeleccionado.cultivoNombre}
                  </Text>
                )}
                {diagnosticoIa && (
                  <Text style={styles.itemResumenExito}>
                    🧠 Pre-evaluación IA: {diagnosticoIa.estado_general} ({diagnosticoIa.total_plagas_detectadas} anomalía(s) / Salud: {Math.round(diagnosticoIa.salud_porcentaje)}%)
                  </Text>
                )}
                {coords && (
                  <Text style={styles.itemResumenExito}>
                    📡 GPS: {coords.latitud.toFixed(6)}, {coords.longitud.toFixed(6)}
                  </Text>
                )}
              </View>

              <Boton
                titulo="Entendido y Volver a Labores"
                onPress={onCerrar}
                variante="primario"
                tamano="lg"
                estilo={{ width: '100%', marginTop: 18 }}
              />
            </View>
          ) : (
            <ScrollView style={styles.cuerpoScroll} showsVerticalScrollIndicator={false}>
              {/* Tarjeta de Reconocimiento Geográfico por Satélite / GPS */}
              <View style={styles.tarjetaGps}>
                <View style={styles.cabeceraTarjetaGps}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flex: 1 }}>
                    <MapPin size={18} color={Palette.forestGreen} />
                    <Text style={styles.tituloTarjetaGps}>Ubicación Satelital en el Fundo</Text>
                  </View>

                  <Pressable
                    onPress={refrescarUbicacion}
                    disabled={cargandoGps}
                    style={styles.botonRefrescarGps}
                  >
                    {cargandoGps ? (
                      <ActivityIndicator size="small" color={Palette.forestGreen} />
                    ) : (
                      <>
                        <RefreshCw size={13} color={Palette.forestGreen} />
                        <Text style={styles.textoBotonGps}>Actualizar GPS</Text>
                      </>
                    )}
                  </Pressable>
                </View>

                {cargandoGps ? (
                  <View style={styles.bannerBuscando}>
                    <ActivityIndicator size="small" color="#0284C7" />
                    <Text style={styles.textoBuscando}>
                      Adquiriendo satélites y reconociendo parcela/sector...
                    </Text>
                  </View>
                ) : deteccion ? (
                  <View
                    style={[
                      styles.bannerDeteccion,
                      deteccion.tipo === 'DENTRO_SECTOR' && styles.bannerVerde,
                      deteccion.tipo === 'DENTRO_PARCELA' && styles.bannerVerde,
                      deteccion.tipo === 'CERCANA' && styles.bannerAmarillo,
                      deteccion.tipo === 'FUERA' && styles.bannerRojo,
                    ]}
                  >
                    <View style={styles.filaDeteccionIcono}>
                      {deteccion.tipo === 'DENTRO_SECTOR' || deteccion.tipo === 'DENTRO_PARCELA' ? (
                        <CheckCircle2 size={18} color="#16A34A" />
                      ) : (
                        <AlertCircle size={18} color={deteccion.tipo === 'CERCANA' ? '#D97706' : '#DC2626'} />
                      )}
                      <Text style={styles.textoDeteccionEstado}>
                        {deteccion.tipo === 'DENTRO_SECTOR'
                          ? '✅ VALIDADO DENTRO DE ÁREA DE CULTIVO'
                          : deteccion.tipo === 'DENTRO_PARCELA'
                            ? '✅ DENTRO DEL PERÍMETRO DE PARCELA'
                            : deteccion.tipo === 'CERCANA'
                              ? '📍 EN LINDES / PERIFERIA DE PARCELA'
                              : '⚠️ FUERA DE LÍMITES CONOCIDOS'}
                      </Text>
                    </View>

                    <Text style={styles.textoDeteccionMensaje}>{deteccion.mensaje}</Text>
                  </View>
                ) : null}

                {/* Confirmación rápida de parcela y sector */}
                <View style={styles.filaSelectoresUbicacion}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.etiquetaCampo}>Parcela *</Text>
                    <Select
                      opciones={parcelas.map((p) => ({
                        label: `${p.codigo} - ${p.nombre}`,
                        valor: p.id,
                      }))}
                      valor={parcelaId}
                      onChange={(val) => {
                        setParcelaId(val);
                        setSectorId('');
                      }}
                      placeholder="Seleccionar parcela..."
                    />
                  </View>

                  <View style={{ flex: 1 }}>
                    <Text style={styles.etiquetaCampo}>Sector / Cultivo</Text>
                    <Select
                      opciones={sectores.map((s) => ({
                        label: `${s.codigo} - ${s.nombre} (${s.cultivoNombre || 'Cultivo'})`,
                        valor: s.id,
                      }))}
                      valor={sectorId}
                      onChange={setSectorId}
                      placeholder={
                        cargandoSectores
                          ? 'Cargando sectores...'
                          : sectores.length === 0
                            ? 'Todo el lote'
                            : 'Sector...'
                      }
                      deshabilitado={sectores.length === 0}
                    />
                  </View>
                </View>
              </View>

              {/* SECCIÓN PRINCIPAL: Cámara de Diagnóstico y Pre-evaluación IA */}
              <View style={styles.seccionCamaraIa}>
                <Text style={styles.tituloSeccion}>
                  📷 Escaneo con Cámara de Diagnóstico (IA) *
                </Text>

                {!fotoUri ? (
                  <View style={styles.cajaSinFoto}>
                    <View style={styles.iconoCamaraCirculo}>
                      <Camera size={36} color={Palette.forestGreen} />
                    </View>
                    <Text style={styles.textoInstruccionCamara}>
                      Enfoca con la cámara la hoja, fruto o tallo con signos de plaga o anomalía.
                    </Text>
                    <Text style={styles.textoSubinstruccion}>
                      La Inteligencia Artificial pre-evaluará el tejido foliar automáticamente.
                    </Text>

                    <View style={styles.filaBotonesCaptura}>
                      <Pressable
                        onPress={tomarFotoCamara}
                        style={({ pressed }) => [styles.botonTomarFoto, pressed && styles.presionado]}
                      >
                        <Camera size={20} color="#FFFFFF" />
                        <Text style={styles.textoBotonTomarFoto}>Abrir Cámara y Escanear</Text>
                      </Pressable>

                      <Pressable
                        onPress={seleccionarFotoGaleria}
                        style={({ pressed }) => [styles.botonGaleria, pressed && styles.presionado]}
                      >
                        <ImageIcon size={18} color="#475569" />
                        <Text style={styles.textoBotonGaleria}>Galería</Text>
                      </Pressable>
                    </View>
                  </View>
                ) : (
                  <View style={styles.contenedorFotoConIa}>
                    <View style={styles.marcoFoto}>
                      <Image source={{ uri: fotoUri }} style={styles.imagenCaptura} />

                      <Pressable onPress={handleLimpiarFoto} style={styles.botonReintentarFoto}>
                        <RotateCcw size={14} color="#FFFFFF" />
                        <Text style={styles.textoReintentarFoto}>Tomar otra foto</Text>
                      </Pressable>
                    </View>

                    {/* Estado del análisis de IA */}
                    {escanearMutation.isPending && (
                      <View style={styles.cajaIaAnalizando}>
                        <ActivityIndicator size="small" color="#7C3AED" />
                        <Text style={styles.textoIaAnalizando}>
                          🧠 AgroVision AI analizando la planta y detectando plagas...
                        </Text>
                      </View>
                    )}

                    {/* Resultado de la pre-evaluación de IA */}
                    {diagnosticoIa && (
                      <View
                        style={[
                          styles.cajaResultadoIa,
                          diagnosticoIa.total_plagas_detectadas > 0 || diagnosticoIa.estado_general === 'CRITICO'
                            ? styles.iaAlertaRoja
                            : styles.iaAlertaVerde,
                        ]}
                      >
                        <View style={styles.cabeceraResultadoIa}>
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flex: 1 }}>
                            <Sparkles size={18} color="#7C3AED" />
                            <Text style={styles.tituloResultadoIa}>
                              Pre-evaluación Automática de la IA
                            </Text>
                          </View>
                          <Badge
                            texto={diagnosticoIa.estado_general}
                            variante={
                              diagnosticoIa.estado_general === 'CRITICO'
                                ? 'peligro'
                                : diagnosticoIa.estado_general === 'ALERTA'
                                  ? 'alerta'
                                  : 'exito'
                            }
                          />
                        </View>

                        {/* Indicadores de Salud y Plagas */}
                        <View style={styles.filaMetricasIa}>
                          <View style={styles.metricaIaItem}>
                            <Text style={styles.metricaIaEtiqueta}>Salud Estimada</Text>
                            <Text style={styles.metricaIaValor}>
                              {Math.round(diagnosticoIa.salud_porcentaje)}%
                            </Text>
                          </View>

                          <View style={styles.metricaIaItem}>
                            <Text style={styles.metricaIaEtiqueta}>Anomalías / Plagas</Text>
                            <Text
                              style={[
                                styles.metricaIaValor,
                                diagnosticoIa.total_plagas_detectadas > 0 && { color: '#DC2626' },
                              ]}
                            >
                              {diagnosticoIa.total_plagas_detectadas} detectada(s)
                            </Text>
                          </View>
                        </View>

                        {/* Detecciones específicas encontradas por la visión computacional */}
                        {Array.isArray(diagnosticoIa.detecciones) && diagnosticoIa.detecciones.length > 0 && (
                          <View style={styles.contenedorChipsDeteccion}>
                            {diagnosticoIa.detecciones.map((det, idx) => (
                              <View key={`det-ia-${idx}`} style={styles.chipDeteccionIa}>
                                <Bug size={14} color="#DC2626" />
                                <Text style={styles.textoChipDeteccionIa}>
                                  {det.clase} ({Math.round(det.confianza * 100)}% certeza)
                                </Text>
                              </View>
                            ))}
                          </View>
                        )}

                        {/* Primera recomendación agronómica sugerida */}
                        {Array.isArray(diagnosticoIa.recomendaciones) && diagnosticoIa.recomendaciones.length > 0 && (
                          <Text style={styles.textoRecomendacionIa}>
                            💡 Sugerencia técnica: {diagnosticoIa.recomendaciones[0]}
                          </Text>
                        )}
                      </View>
                    )}

                    {/* Mensaje de contingencia si la IA no respondió */}
                    {errorIa && (
                      <View style={styles.cajaErrorIa}>
                        <AlertCircle size={16} color="#B45309" />
                        <Text style={styles.textoErrorIa}>{errorIa}</Text>
                      </View>
                    )}
                  </View>
                )}
              </View>

              {/* Observaciones breves opcionales */}
              <View style={styles.seccionFormulario}>
                <Text style={styles.tituloSeccion}>Nota adicional del operario (opcional)</Text>
                <TextInput
                  value={observaciones}
                  onChangeText={setObservaciones}
                  placeholder="Ej. Se observan hojas comidas en los últimos tres surcos del lote..."
                  placeholderTextColor="#94A3B8"
                  multiline
                  numberOfLines={2}
                  style={styles.inputObservaciones}
                />
              </View>
            </ScrollView>
          )}

          {/* Pie de Acciones */}
          {!alertaEnviadaConExito && (
            <View style={styles.pieAcciones}>
              <Boton
                titulo="Cancelar"
                onPress={onCerrar}
                variante="secundario"
                disabled={guardarMutation.isPending || escanearMutation.isPending}
              />

              <Boton
                titulo={
                  guardarMutation.isPending
                    ? 'Transmitiendo a Supervisor...'
                    : escanearMutation.isPending
                      ? 'Analizando con IA...'
                      : '🚨 Emitir Alerta Fitosanitaria'
                }
                onPress={handleSubmitAlerta}
                variante="peligro"
                disabled={
                  guardarMutation.isPending ||
                  escanearMutation.isPending ||
                  !fotoUri ||
                  !parcelaId
                }
                iconoIzquierda={<Send size={16} color="#FFFFFF" />}
              />
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlayFondo: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
    zIndex: 99999,
  },
  contenedorModal: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    width: '100%',
    maxWidth: 620,
    maxHeight: '94%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 10,
    overflow: 'hidden',
  },
  cabecera: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
    backgroundColor: '#FEF2F2',
    borderBottomWidth: 1,
    borderBottomColor: '#FEE2E2',
  },
  filaTitulo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  iconoAlerta: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: '#FEE2E2',
    justifyContent: 'center',
    alignItems: 'center',
  },
  tituloModal: {
    fontSize: 15,
    fontWeight: '800',
    color: '#991B1B',
    letterSpacing: 0.3,
  },
  subtituloModal: {
    fontSize: 11,
    color: '#B91C1C',
    marginTop: 2,
  },
  botonCerrar: {
    padding: 8,
    borderRadius: 8,
  },
  presionado: {
    opacity: 0.7,
  },
  cuerpoScroll: {
    padding: 16,
  },
  tarjetaGps: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 14,
  },
  cabeceraTarjetaGps: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  tituloTarjetaGps: {
    fontSize: 12,
    fontWeight: '700',
    color: Palette.forestGreen,
  },
  botonRefrescarGps: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: '#E8F5E9',
  },
  textoBotonGps: {
    fontSize: 11,
    fontWeight: '600',
    color: Palette.forestGreen,
  },
  bannerBuscando: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#F0F9FF',
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#BAE6FD',
    marginBottom: 10,
  },
  textoBuscando: {
    fontSize: 12,
    color: '#0369A1',
    flex: 1,
  },
  bannerDeteccion: {
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 10,
  },
  bannerVerde: {
    backgroundColor: '#F0FDF4',
    borderColor: '#BBF7D0',
  },
  bannerAmarillo: {
    backgroundColor: '#FFFBEB',
    borderColor: '#FDE68A',
  },
  bannerRojo: {
    backgroundColor: '#FEF2F2',
    borderColor: '#FECACA',
  },
  filaDeteccionIcono: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  textoDeteccionEstado: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
  textoDeteccionMensaje: {
    fontSize: 12,
    color: '#334155',
    marginTop: 3,
  },
  filaSelectoresUbicacion: {
    flexDirection: Platform.OS === 'web' ? 'row' : 'column',
    gap: 10,
    marginTop: 4,
  },
  etiquetaCampo: {
    fontSize: 11,
    fontWeight: '600',
    color: '#334155',
    marginBottom: 4,
  },
  seccionCamaraIa: {
    marginBottom: 14,
  },
  tituloSeccion: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 8,
  },
  cajaSinFoto: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: '#CBD5E1',
    padding: 24,
    alignItems: 'center',
  },
  iconoCamaraCirculo: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: '#E8F5E9',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  textoInstruccionCamara: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1E293B',
    textAlign: 'center',
    marginBottom: 4,
  },
  textoSubinstruccion: {
    fontSize: 11,
    color: '#64748B',
    textAlign: 'center',
    marginBottom: 16,
  },
  filaBotonesCaptura: {
    flexDirection: 'row',
    gap: 10,
    width: '100%',
    maxWidth: 380,
  },
  botonTomarFoto: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Palette.forestGreen,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 10,
    shadowColor: Palette.forestGreen,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 4,
  },
  textoBotonTomarFoto: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13,
  },
  botonGaleria: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#FFFFFF',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
  },
  textoBotonGaleria: {
    color: '#475569',
    fontWeight: '600',
    fontSize: 12,
  },
  contenedorFotoConIa: {
    gap: 10,
  },
  marcoFoto: {
    position: 'relative',
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    backgroundColor: '#0F172A',
  },
  imagenCaptura: {
    width: '100%',
    height: 200,
    resizeMode: 'contain',
  },
  botonReintentarFoto: {
    position: 'absolute',
    top: 8,
    right: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(15, 23, 42, 0.75)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
  },
  textoReintentarFoto: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '600',
  },
  cajaIaAnalizando: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FAF5FF',
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E9D5FF',
  },
  textoIaAnalizando: {
    fontSize: 12,
    color: '#6B21A8',
    fontWeight: '600',
    flex: 1,
  },
  cajaResultadoIa: {
    borderRadius: 10,
    padding: 12,
    borderWidth: 1.5,
  },
  iaAlertaRoja: {
    backgroundColor: '#FEF2F2',
    borderColor: '#FECACA',
  },
  iaAlertaVerde: {
    backgroundColor: '#F0FDF4',
    borderColor: '#BBF7D0',
  },
  cabeceraResultadoIa: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  tituloResultadoIa: {
    fontSize: 13,
    fontWeight: '800',
    color: '#581C87',
  },
  filaMetricasIa: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 8,
  },
  metricaIaItem: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    padding: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  metricaIaEtiqueta: {
    fontSize: 10,
    color: '#64748B',
    fontWeight: '600',
  },
  metricaIaValor: {
    fontSize: 15,
    fontWeight: '800',
    color: Palette.forestGreen,
    marginTop: 2,
  },
  contenedorChipsDeteccion: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 8,
  },
  chipDeteccionIa: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  textoChipDeteccionIa: {
    fontSize: 11,
    fontWeight: '700',
    color: '#991B1B',
  },
  textoRecomendacionIa: {
    fontSize: 11,
    color: '#334155',
    lineHeight: 16,
    backgroundColor: '#FFFFFF',
    padding: 8,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  cajaErrorIa: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FFFBEB',
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  textoErrorIa: {
    fontSize: 11,
    color: '#92400E',
    flex: 1,
  },
  seccionFormulario: {
    marginBottom: 10,
  },
  inputObservaciones: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 8,
    padding: 10,
    fontSize: 12,
    color: '#1E293B',
    textAlignVertical: 'top',
  },
  pieAcciones: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    backgroundColor: '#F8FAFC',
  },
  cuerpoExito: {
    padding: 24,
    alignItems: 'center',
  },
  iconoExitoGrande: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: '#DCFCE7',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 14,
  },
  tituloExito: {
    fontSize: 17,
    fontWeight: '800',
    color: '#16A34A',
    marginBottom: 4,
  },
  codigoExito: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 6,
    marginBottom: 12,
  },
  descripcionExito: {
    fontSize: 12,
    color: '#475569',
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 14,
  },
  resumenExito: {
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    padding: 12,
    width: '100%',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 6,
  },
  itemResumenExito: {
    fontSize: 11,
    color: '#334155',
    fontWeight: '500',
  },
});
