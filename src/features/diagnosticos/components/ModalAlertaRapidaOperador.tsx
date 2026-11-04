import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  Pressable,
  ScrollView,
  TextInput,
  Platform,
  Animated,
  Image,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import {
  AlertTriangle,
  MapPin,
  Camera,
  CheckCircle2,
  X,
  Bug,
  AlertCircle,
  Send,
  Sparkles,
  RotateCcw,
  Scan,
  User,
} from 'lucide-react-native';
import { Palette } from '@/constants/theme';
import { Badge } from '@/shared/components/ui/badge';
import { Boton } from '@/shared/components/ui/boton';
import { useAuthStore } from '@/features/autenticacion';
import { useParcelasQuery } from '@/features/parcelas/api/parcelas.api';
import {
  useEscanearImagenMutation,
  useGuardarDiagnosticoMutation,
} from '../api/diagnostico.api';
import { DiagnosticoRespuesta, DeteccionPlaga } from '../types/diagnostico.types';
import { obtenerCoordenadasDispositivo, CoordenadasGps } from '../utils/geolocalizacion';
import { detectarUbicacionEnFundo, ResultadoDeteccionGeografica } from '../utils/detector-geografico';
import { BoundingBoxOverlay } from './BoundingBoxOverlay';

export interface ModalAlertaRapidaOperadorProps {
  visible: boolean;
  onCerrar: () => void;
}

const URL_VIDEO_MUESTRA =
  'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4';

/**
 * @description Modal de Alerta Fitosanitaria para el Operador en Terreno.
 * Incorpora la cámara de escaneo en vivo (idéntica a la vista de diagnóstico)
 * con inferencia automática de IA, opción de reescaneo instantáneo y transmisión
 * automática de metadatos (operador, parcela, GPS y labor activa).
 */
export function ModalAlertaRapidaOperador({
  visible,
  onCerrar,
}: ModalAlertaRapidaOperadorProps) {
  const usuarioActual = useAuthStore((s) => s.usuario);
  const guardarMutation = useGuardarDiagnosticoMutation();
  const escanearMutation = useEscanearImagenMutation();

  // Parcelas del fundo para resolver geocercas en segundo plano
  const { data: datosParcelas } = useParcelasQuery({ limite: 100 });
  const parcelas = datosParcelas?.items || [];

  // Estados de geolocalización en segundo plano
  const [coords, setCoords] = useState<CoordenadasGps | null>(null);
  const [deteccion, setDeteccion] = useState<ResultadoDeteccionGeografica | null>(null);

  // Estados de cámara y escaneo
  const [permisoAndroid, solicitarPermisoAndroid] = useCameraPermissions();
  const [camaraWebActiva, setCamaraWebActiva] = useState(false);
  const [imagenPreviewUrl, setImagenPreviewUrl] = useState<string | null>(null);

  // Refs de cámara Web y Android
  const videoWebRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const cameraAndroidRef = useRef<CameraView | null>(null);
  const animacionLaser = useRef(new Animated.Value(0)).current;

  // Resultado de la IA
  const [diagnosticoIa, setDiagnosticoIa] = useState<DiagnosticoRespuesta | null>(null);
  const [errorIa, setErrorIa] = useState<string | null>(null);
  const [observaciones, setObservaciones] = useState('');

  // Estado tras enviar la alerta
  const [alertaEnviadaConExito, setAlertaEnviadaConExito] = useState(false);
  const [codigoGenerado, setCodigoGenerado] = useState('');

  // Animación del escáner láser
  useEffect(() => {
    if (escanearMutation.isPending) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(animacionLaser, {
            toValue: 1,
            duration: 1200,
            useNativeDriver: Platform.OS !== 'web',
          }),
          Animated.timing(animacionLaser, {
            toValue: 0,
            duration: 1200,
            useNativeDriver: Platform.OS !== 'web',
          }),
        ]),
      ).start();
    } else {
      animacionLaser.stopAnimation();
      animacionLaser.setValue(0);
    }
  }, [escanearMutation.isPending, animacionLaser]);

  // Capturar coordenadas GPS y geocerca en segundo plano
  const cargarUbicacionSegundoPlano = useCallback(async () => {
    try {
      const gps = await obtenerCoordenadasDispositivo();
      if (gps) {
        setCoords(gps);
        if (parcelas.length > 0) {
          const resultado = await detectarUbicacionEnFundo(gps, parcelas);
          setDeteccion(resultado);
        }
      }
    } catch (error) {
      console.warn('[ModalAlertaOperador] GPS segundo plano:', error);
    }
  }, [parcelas]);

  // Iniciar cámara web en navegadores
  const iniciarCamaraWeb = useCallback(async () => {
    if (Platform.OS !== 'web') return;
    try {
      if (navigator.mediaDevices?.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: { ideal: 'environment' },
            width: { ideal: 1280 },
            height: { ideal: 720 },
          },
          audio: false,
        });

        if (stream && videoWebRef.current) {
          streamRef.current = stream;
          videoWebRef.current.removeAttribute('src');
          videoWebRef.current.srcObject = stream;
          await videoWebRef.current.play();
          setCamaraWebActiva(true);
        }
      }
    } catch {
      // Si la cámara web no está disponible o se deniega permiso, el video de muestra sirve de fallback
      if (videoWebRef.current) {
        videoWebRef.current.src = URL_VIDEO_MUESTRA;
        videoWebRef.current.play().catch(() => {});
      }
    }
  }, []);

  // Detener cámara web al desmontar o cerrar
  const detenerCamaraWeb = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setCamaraWebActiva(false);
  }, []);

  // Al abrir el modal
  useEffect(() => {
    if (visible) {
      setAlertaEnviadaConExito(false);
      setCodigoGenerado('');
      setImagenPreviewUrl(null);
      setDiagnosticoIa(null);
      setErrorIa(null);
      setObservaciones('');

      cargarUbicacionSegundoPlano();

      if (Platform.OS === 'web') {
        setTimeout(() => {
          iniciarCamaraWeb();
        }, 150);
      }
    } else {
      detenerCamaraWeb();
    }
    return () => {
      detenerCamaraWeb();
    };
  }, [visible, cargarUbicacionSegundoPlano, iniciarCamaraWeb, detenerCamaraWeb]);

  /**
   * @description Envía el frame capturado al motor de IA para pre-evaluación fitosanitaria.
   */
  const enviarIaParaPreEvaluacion = (archivo: Blob | File | string) => {
    setErrorIa(null);
    setDiagnosticoIa(null);

    const formData = new FormData();
    if (typeof archivo === 'string') {
      formData.append('archivo', {
        uri: archivo,
        name: 'alerta_operador.jpg',
        type: 'image/jpeg',
      } as unknown as Blob);
    } else {
      formData.append('archivo', archivo, 'alerta_operador.jpg');
    }

    escanearMutation.mutate(formData, {
      onSuccess: (data) => {
        setDiagnosticoIa(data);
      },
      onError: (err) => {
        console.warn('[ModalAlertaOperador] IA no disponible:', err);
        setErrorIa(
          'La IA no respondió en este momento. La alerta con tu foto se enviará igualmente al Supervisor para revisión manual.',
        );
      },
    });
  };

  // Capturar fotograma en Web manteniendo proporciones reales
  const capturarFrameWeb = async () => {
    if (escanearMutation.isPending || Platform.OS !== 'web' || !videoWebRef.current) return;
    try {
      const vWidth = videoWebRef.current.videoWidth || 1280;
      const vHeight = videoWebRef.current.videoHeight || 720;
      const canvas = document.createElement('canvas');
      canvas.width = vWidth;
      canvas.height = vHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(videoWebRef.current, 0, 0, vWidth, vHeight);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.88);
        setImagenPreviewUrl(dataUrl);

        canvas.toBlob((blob) => {
          if (blob) {
            enviarIaParaPreEvaluacion(blob);
          }
        }, 'image/jpeg', 0.88);
      }
    } catch (e) {
      console.error('Error al capturar frame en web:', e);
    }
  };

  // Capturar fotograma en Android nativo
  const capturarFrameAndroid = async () => {
    if (escanearMutation.isPending || !cameraAndroidRef.current) return;
    try {
      const foto = await cameraAndroidRef.current.takePictureAsync({
        quality: 0.8,
        skipProcessing: false,
      });

      if (foto?.uri) {
        setImagenPreviewUrl(foto.uri);
        enviarIaParaPreEvaluacion(foto.uri);
      }
    } catch (err) {
      console.error('Error al capturar cuadro de cámara en Android:', err);
    }
  };

  const handleDispararEscaneo = () => {
    if (Platform.OS === 'web') {
      capturarFrameWeb();
    } else {
      capturarFrameAndroid();
    }
  };

  // Permite reescanear instantáneamente si no detectó a la primera
  const handleReescanear = () => {
    setImagenPreviewUrl(null);
    setDiagnosticoIa(null);
    setErrorIa(null);
    if (Platform.OS === 'web' && !camaraWebActiva) {
      iniciarCamaraWeb();
    }
  };

  // Enviar el reporte de alerta fitosanitaria al supervisor
  const handleSubmitAlerta = async () => {
    if (!imagenPreviewUrl) {
      alert('Por favor enfoca la planta y pulsa "Empezar a escanear" para registrar la captura con IA.');
      return;
    }

    // Resolver parcela en segundo plano
    const parcelaIdFinal =
      deteccion?.parcelaId ||
      (parcelas.length > 0 ? parcelas[0].id : null);

    if (!parcelaIdFinal) {
      alert('No se pudo identificar una parcela en el sistema para asociar la alerta.');
      return;
    }

    const sectorIdFinal = deteccion?.sectorId || undefined;
    const lat = coords?.latitud || parcelas.find((p) => p.id === parcelaIdFinal)?.latitudCentro || -11.95;
    const lng = coords?.longitud || parcelas.find((p) => p.id === parcelaIdFinal)?.longitudCentro || -76.98;

    const estadoGeneral = diagnosticoIa?.estado_general || 'ALERTA';
    const saludPorcentaje = diagnosticoIa?.salud_porcentaje ? Math.round(diagnosticoIa.salud_porcentaje) : 65;
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
      parcelaId: parcelaIdFinal,
      sectorId: sectorIdFinal,
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
      imagenUrl: imagenPreviewUrl,
      origenCaptura: 'OPERADOR_CAMPO_APP',
      observaciones: observaciones.trim() || undefined,
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

  const translateY = animacionLaser.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 240],
  });

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
                <AlertTriangle size={22} color="#DC2626" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.tituloModal}>¡ALERTA FITOSANITARIA EN CAMPO!</Text>
                <Text style={styles.subtituloModal}>
                  Cámara de escaneo con IA y aviso automático a tu Supervisor
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

          {/* Estado de Éxito al Transmitir */}
          {alertaEnviadaConExito ? (
            <View style={styles.cuerpoExito}>
              <View style={styles.iconoExitoGrande}>
                <CheckCircle2 size={52} color="#16A34A" />
              </View>

              <Text style={styles.tituloExito}>¡ALERTA ENVIADA AL SUPERVISOR!</Text>
              <Text style={styles.codigoExito}>{codigoGenerado}</Text>
              <Text style={styles.descripcionExito}>
                Tu foto, el pre-diagnóstico de la IA y tus coordenadas GPS se han transmitido en segundo plano.
                La alarma ha escalado a la pantalla de tu{' '}
                <Text style={{ fontWeight: 'bold', color: Palette.forestGreen }}>
                  Supervisor de Campo
                </Text>{' '}
                con los detalles de la labor para su atención y seguimiento.
              </Text>

              <View style={styles.resumenExito}>
                <Text style={styles.itemResumenExito}>
                  👷 Operador: {usuarioActual?.nombres} {usuarioActual?.apellidos}
                </Text>
                <Text style={styles.itemResumenExito}>
                  📍 Ubicación: {deteccion?.parcelaNombre || 'Parcela'} {deteccion?.sectorNombre ? `· ${deteccion.sectorNombre}` : ''}
                </Text>
                {diagnosticoIa && (
                  <Text style={styles.itemResumenExito}>
                    🧠 Pre-evaluación IA: {diagnosticoIa.estado_general} ({diagnosticoIa.total_plagas_detectadas} anomalía(s) detectada(s))
                  </Text>
                )}
              </View>

              <Boton
                titulo="Entendido y Continuar Labor"
                onPress={onCerrar}
                variante="primario"
                tamano="lg"
                estilo={{ width: '100%', marginTop: 18 }}
              />
            </View>
          ) : (
            <ScrollView
              style={styles.cuerpoScroll}
              contentContainerStyle={styles.cuerpoScrollContenido}
              showsVerticalScrollIndicator={true}
            >
              {/* Badge Informativo de Fondo (Ubicación Satelital y Trabajador) */}
              <View style={styles.badgeFondoInformativo}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flex: 1 }}>
                  <MapPin size={14} color={Palette.forestGreen} />
                  <Text style={styles.textoFondoInformativo} numberOfLines={1}>
                    {deteccion
                      ? `${deteccion.parcelaNombre || 'Parcela'} > ${deteccion.sectorNombre || 'Sector'}`
                      : 'Adquiriendo GPS en segundo plano...'}
                  </Text>
                </View>

                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                  <User size={13} color="#64748B" />
                  <Text style={styles.textoTrabajadorFondo}>
                    {usuarioActual?.nombres}
                  </Text>
                </View>
              </View>

              {/* VISOR DE CÁMARA DE DIAGNÓSTICO EN VIVO (Idéntico al módulo de escaneo) */}
              <View style={styles.contenedorVisorCamara}>
                <View style={styles.visorMedia}>
                  {/* Vista de imagen capturada estática o stream en vivo */}
                  {imagenPreviewUrl ? (
                    <Image
                      source={{ uri: imagenPreviewUrl }}
                      style={styles.fotoCapturada}
                    />
                  ) : Platform.OS === 'web' ? (
                    <video
                      ref={videoWebRef}
                      autoPlay
                      playsInline
                      muted
                      loop
                      style={styles.videoWeb}
                    />
                  ) : permisoAndroid?.granted ? (
                    <CameraView ref={cameraAndroidRef} facing="back" style={StyleSheet.absoluteFill} />
                  ) : (
                    <View style={styles.cajaPermisoAndroid}>
                      <Camera size={40} color="#10B981" />
                      <Text style={styles.permisoTitulo}>Acceso a Cámara Requerido</Text>
                      <Pressable onPress={solicitarPermisoAndroid} style={styles.botonSolicitarPermiso}>
                        <Text style={styles.textoBotonPermiso}>Habilitar Cámara</Text>
                      </Pressable>
                    </View>
                  )}

                  {/* Badge de estado en la esquina superior izquierda del visor */}
                  <View style={styles.badgeEnVivo}>
                    <View
                      style={[
                        styles.puntoGrabando,
                        !imagenPreviewUrl && styles.puntoActivo,
                      ]}
                    />
                    <Text style={styles.textoEnVivo}>
                      {imagenPreviewUrl ? 'CAPTURA FITOSANITARIA' : 'CÁMARA EN VIVO'}
                    </Text>
                  </View>

                  {/* Efecto de Escáner Láser animado durante inferencia */}
                  {escanearMutation.isPending && (
                    <Animated.View style={[styles.lineaLaser, { transform: [{ translateY }] }]}>
                      <View style={styles.brilloLaser} />
                    </Animated.View>
                  )}

                  {/* Cajas Delimitadoras si la IA detectó anomalías */}
                  {diagnosticoIa?.detecciones && (
                    <BoundingBoxOverlay detecciones={diagnosticoIa.detecciones} />
                  )}

                  {/* Botón flotante central de escaneo / reescaneo directo en el visor */}
                  <View style={styles.barraInferiorFlotante}>
                    {imagenPreviewUrl ? (
                      <Pressable
                        onPress={handleReescanear}
                        disabled={escanearMutation.isPending}
                        style={({ pressed }) => [
                          styles.botonReescanear,
                          pressed && styles.presionado,
                        ]}
                      >
                        <RotateCcw size={18} color="#FFFFFF" />
                        <Text style={styles.textoBotonEscanear}>
                          {escanearMutation.isPending ? 'Escaneando...' : 'Reescanear planta'}
                        </Text>
                        <Sparkles size={16} color="#6EE7B7" />
                      </Pressable>
                    ) : (
                      <Pressable
                        onPress={handleDispararEscaneo}
                        disabled={escanearMutation.isPending}
                        style={({ pressed }) => [
                          styles.botonEscanear,
                          escanearMutation.isPending && styles.botonEscanearCargando,
                          pressed && styles.presionado,
                        ]}
                      >
                        <Scan size={20} color="#FFFFFF" />
                        <Text style={styles.textoBotonEscanear}>
                          {escanearMutation.isPending ? 'Escaneando planta...' : 'Empezar a escanear'}
                        </Text>
                        <Sparkles size={16} color="#6EE7B7" />
                      </Pressable>
                    )}
                  </View>
                </View>
              </View>

              {/* RESULTADO DE LA PRE-EVALUACIÓN DE IA */}
              {diagnosticoIa && (
                <View
                  style={[
                    styles.tarjetaResultadoIa,
                    diagnosticoIa.total_plagas_detectadas > 0 || diagnosticoIa.estado_general === 'CRITICO'
                      ? styles.bordeAlerta
                      : styles.bordeExito,
                  ]}
                >
                  <View style={styles.filaCabeceraIa}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                      <Sparkles size={16} color="#7C3AED" />
                      <Text style={styles.tituloIa}>Pre-evaluación Automática IA</Text>
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

                  <View style={styles.filaDetallesIa}>
                    <Text style={styles.textoSaludIa}>
                      🌿 Salud foliar: {Math.round(diagnosticoIa.salud_porcentaje)}%
                    </Text>
                    <Text style={styles.textoPlagasIa}>
                      🐛 {diagnosticoIa.total_plagas_detectadas} plaga(s) detectada(s)
                    </Text>
                  </View>

                  {Array.isArray(diagnosticoIa.detecciones) && diagnosticoIa.detecciones.length > 0 && (
                    <View style={styles.chipsContenedor}>
                      {diagnosticoIa.detecciones.map((det: DeteccionPlaga, i: number) => (
                        <View key={`det-modal-${i}`} style={styles.chipDeteccion}>
                          <Bug size={13} color="#DC2626" />
                          <Text style={styles.textoChip}>
                            {det.clase} ({Math.round(det.confianza * 100)}%)
                          </Text>
                        </View>
                      ))}
                    </View>
                  )}

                  {Array.isArray(diagnosticoIa.recomendaciones) && diagnosticoIa.recomendaciones.length > 0 && (
                    <Text style={styles.textoRecomendacion}>
                      💡 {diagnosticoIa.recomendaciones[0]}
                    </Text>
                  )}

                  {diagnosticoIa.total_plagas_detectadas === 0 && (
                    <Text style={styles.textoTipReescanear}>
                      💡 Si observas alguna anomalía o plaga que no fue detectada, acércate más a la hoja y pulsa{' '}
                      <Text style={{ fontWeight: '700' }}>"Reescanear planta"</Text>.
                    </Text>
                  )}
                </View>
              )}

              {/* Mensaje de contingencia si el microservicio de IA no está activo */}
              {errorIa && (
                <View style={styles.cajaErrorIa}>
                  <AlertCircle size={15} color="#B45309" />
                  <Text style={styles.textoErrorIa}>{errorIa}</Text>
                </View>
              )}

              {/* NOTA ADICIONAL DEL OPERARIO (OPCIONAL) */}
              <View style={styles.seccionNota}>
                <Text style={styles.etiquetaNota}>Nota adicional del operario (opcional)</Text>
                <TextInput
                  value={observaciones}
                  onChangeText={setObservaciones}
                  placeholder="Escribe alguna observación adicional (ej. Se repite en los surcos 4 y 5)..."
                  placeholderTextColor="#94A3B8"
                  multiline
                  numberOfLines={2}
                  style={styles.inputNota}
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
                      : '🚨 Enviar Reporte de Alerta'
                }
                onPress={handleSubmitAlerta}
                variante="peligro"
                disabled={
                  guardarMutation.isPending ||
                  escanearMutation.isPending ||
                  !imagenPreviewUrl
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
    backgroundColor: 'rgba(15, 23, 42, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 14,
    zIndex: 99999,
  },
  contenedorModal: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    width: '100%',
    maxWidth: 580,
    maxHeight: '92%',
    display: 'flex',
    flexDirection: 'column',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 12,
    overflow: 'hidden',
  },
  cabecera: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingVertical: 12,
    backgroundColor: '#FEF2F2',
    borderBottomWidth: 1,
    borderBottomColor: '#FEE2E2',
  },
  filaTitulo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  iconoAlerta: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: '#FEE2E2',
    justifyContent: 'center',
    alignItems: 'center',
  },
  tituloModal: {
    fontSize: 14,
    fontWeight: '800',
    color: '#991B1B',
    letterSpacing: 0.3,
  },
  subtituloModal: {
    fontSize: 11,
    color: '#B91C1C',
    marginTop: 1,
  },
  botonCerrar: {
    padding: 6,
    borderRadius: 6,
  },
  presionado: {
    opacity: 0.8,
    transform: [{ scale: 0.98 }],
  },
  cuerpoScroll: {
    flex: 1,
    flexGrow: 1,
    flexShrink: 1,
    paddingHorizontal: 14,
    paddingTop: 14,
  },
  cuerpoScrollContenido: {
    paddingBottom: 20,
  },
  badgeFondoInformativo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  textoFondoInformativo: {
    fontSize: 11,
    fontWeight: '700',
    color: '#334155',
  },
  textoTrabajadorFondo: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748B',
  },
  contenedorVisorCamara: {
    borderRadius: 14,
    overflow: 'hidden',
    backgroundColor: '#0F172A',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#334155',
  },
  visorMedia: {
    width: '100%',
    height: 250,
    position: 'relative',
    backgroundColor: '#0F172A',
    overflow: 'hidden',
  },
  videoWeb: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
    backgroundColor: '#0F172A',
  },
  fotoCapturada: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
    // @ts-ignore Web support
    objectFit: 'cover',
    backgroundColor: '#0F172A',
  },
  badgeEnVivo: {
    position: 'absolute',
    top: 12,
    left: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(15, 23, 42, 0.85)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    zIndex: 25,
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
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  barraInferiorFlotante: {
    position: 'absolute',
    bottom: 14,
    left: 14,
    right: 14,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 25,
  },
  botonEscanear: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: Palette.forestGreen,
    paddingVertical: 12,
    paddingHorizontal: 22,
    borderRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 6,
    elevation: 6,
  },
  botonEscanearCargando: {
    backgroundColor: '#065F46',
    opacity: 0.85,
  },
  botonReescanear: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(30, 41, 59, 0.92)',
    paddingVertical: 12,
    paddingHorizontal: 22,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.25)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 6,
    elevation: 6,
  },
  textoBotonEscanear: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  cajaPermisoAndroid: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    gap: 8,
    flex: 1,
  },
  permisoTitulo: {
    color: '#F8FAFC',
    fontSize: 14,
    fontWeight: '700',
  },
  botonSolicitarPermiso: {
    backgroundColor: Palette.forestGreen,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
  },
  textoBotonPermiso: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  lineaLaser: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    height: 3,
    backgroundColor: '#10B981',
    zIndex: 15,
  },
  brilloLaser: {
    width: '100%',
    height: 24,
    marginTop: -12,
    backgroundColor: 'rgba(16, 185, 129, 0.3)',
  },
  tarjetaResultadoIa: {
    borderRadius: 10,
    padding: 12,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    marginBottom: 12,
  },
  bordeAlerta: {
    borderColor: '#FECACA',
    backgroundColor: '#FEF2F2',
  },
  bordeExito: {
    borderColor: '#BBF7D0',
    backgroundColor: '#F0FDF4',
  },
  filaCabeceraIa: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  tituloIa: {
    fontSize: 12,
    fontWeight: '800',
    color: '#581C87',
  },
  filaDetallesIa: {
    flexDirection: 'row',
    gap: 14,
    marginBottom: 6,
  },
  textoSaludIa: {
    fontSize: 12,
    fontWeight: '700',
    color: Palette.forestGreen,
  },
  textoPlagasIa: {
    fontSize: 12,
    fontWeight: '700',
    color: '#DC2626',
  },
  chipsContenedor: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 6,
  },
  chipDeteccion: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  textoChip: {
    fontSize: 11,
    fontWeight: '700',
    color: '#991B1B',
  },
  textoRecomendacion: {
    fontSize: 11,
    color: '#334155',
    lineHeight: 15,
    backgroundColor: '#FFFFFF',
    padding: 6,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  textoTipReescanear: {
    fontSize: 11,
    color: '#15803D',
    lineHeight: 15,
    backgroundColor: '#DCFCE7',
    padding: 6,
    borderRadius: 6,
    marginTop: 6,
  },
  cajaErrorIa: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FFFBEB',
    padding: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FDE68A',
    marginBottom: 10,
  },
  textoErrorIa: {
    fontSize: 11,
    color: '#92400E',
    flex: 1,
  },
  seccionNota: {
    marginBottom: 8,
  },
  etiquetaNota: {
    fontSize: 12,
    fontWeight: '700',
    color: '#334155',
    marginBottom: 4,
  },
  inputNota: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 8,
    padding: 10,
    fontSize: 12,
    color: '#1E293B',
    textAlignVertical: 'top',
    minHeight: 52,
  },
  pieAcciones: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    backgroundColor: '#F8FAFC',
  },
  cuerpoExito: {
    padding: 22,
    alignItems: 'center',
  },
  iconoExitoGrande: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#DCFCE7',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  tituloExito: {
    fontSize: 16,
    fontWeight: '800',
    color: '#16A34A',
    marginBottom: 4,
  },
  codigoExito: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 6,
    marginBottom: 10,
  },
  descripcionExito: {
    fontSize: 12,
    color: '#475569',
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 12,
  },
  resumenExito: {
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    padding: 10,
    width: '100%',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 4,
  },
  itemResumenExito: {
    fontSize: 11,
    color: '#334155',
    fontWeight: '500',
  },
});
