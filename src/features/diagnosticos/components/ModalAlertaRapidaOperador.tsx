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
  ShieldAlert,
  Bug,
  Droplets,
  Sprout,
  AlertCircle,
  Trash2,
  Send,
  Building,
} from 'lucide-react-native';
import { Palette } from '@/constants/theme';
import { Badge } from '@/shared/components/ui/badge';
import { Boton } from '@/shared/components/ui/boton';
import { Select } from '@/shared/components/ui/select';
import { useAuthStore } from '@/features/autenticacion';
import { useParcelasQuery } from '@/features/parcelas/api/parcelas.api';
import { useSectoresPorParcelaQuery } from '@/features/parcelas/api/sectores.api';
import { useGuardarDiagnosticoMutation } from '../api/diagnostico.api';
import { obtenerCoordenadasDispositivo, CoordenadasGps } from '../utils/geolocalizacion';
import { detectarUbicacionEnFundo, ResultadoDeteccionGeografica } from '../utils/detector-geografico';

export interface ModalAlertaRapidaOperadorProps {
  visible: boolean;
  onCerrar: () => void;
}

type CategoriaAlerta = 'PLAGA' | 'ENFERMEDAD' | 'RIEGO' | 'MALEZAS' | 'ANOMALIA';
type NivelUrgencia = 'ALERTA' | 'CRITICO';

interface OpcionCategoria {
  id: CategoriaAlerta;
  titulo: string;
  descripcion: string;
  icono: React.ElementType;
  color: string;
}

const CATEGORIAS: OpcionCategoria[] = [
  {
    id: 'PLAGA',
    titulo: 'Plaga o Insectos',
    descripcion: 'Pulgones, gusano cogollero, mosca, ácaros',
    icono: Bug,
    color: '#DC2626',
  },
  {
    id: 'ENFERMEDAD',
    titulo: 'Enfermedad Foliar',
    descripcion: 'Manchas, hongos, roya, mildiu, marchitez',
    icono: Sprout,
    color: '#D97706',
  },
  {
    id: 'RIEGO',
    titulo: 'Falla de Riego / Fuga',
    descripcion: 'Tubería rota, sector seco, encharcamiento',
    icono: Droplets,
    color: '#0284C7',
  },
  {
    id: 'MALEZAS',
    titulo: 'Malezas Excesivas',
    descripcion: 'Competencia vegetal en camellón / surco',
    icono: AlertCircle,
    color: '#16A34A',
  },
  {
    id: 'ANOMALIA',
    titulo: 'Otra Anomalía / Daño',
    descripcion: 'Daño mecánico, caída de ramas, cerco',
    icono: ShieldAlert,
    color: '#7C3AED',
  },
];

export function ModalAlertaRapidaOperador({
  visible,
  onCerrar,
}: ModalAlertaRapidaOperadorProps) {
  const usuarioActual = useAuthStore((s) => s.usuario);
  const guardarMutation = useGuardarDiagnosticoMutation();

  // Cargar parcelas del fundo
  const { data: datosParcelas, isLoading: cargandoParcelas } = useParcelasQuery({ limite: 100 });
  const parcelas = datosParcelas?.items || [];

  // Estados de geolocalización
  const [cargandoGps, setCargandoGps] = useState(false);
  const [coords, setCoords] = useState<CoordenadasGps | null>(null);
  const [deteccion, setDeteccion] = useState<ResultadoDeteccionGeografica | null>(null);

  // Parcela y sector seleccionados
  const [parcelaId, setParcelaId] = useState<string>('');
  const [sectorId, setSectorId] = useState<string>('');

  // Consulta de sectores de la parcela seleccionada
  const { data: datosSectores, isLoading: cargandoSectores } = useSectoresPorParcelaQuery(
    parcelaId || undefined,
  );
  const sectores = datosSectores?.sectores || [];

  // Datos del formulario de alerta
  const [categoria, setCategoria] = useState<CategoriaAlerta>('PLAGA');
  const [urgencia, setUrgencia] = useState<NivelUrgencia>('ALERTA');
  const [observaciones, setObservaciones] = useState('');
  const [fotoUri, setFotoUri] = useState<string | null>(null);
  const [fotoBase64, setFotoBase64] = useState<string | null>(null);

  // Estado de éxito / enviado
  const [alertaEnviadaConExito, setAlertaEnviadaConExito] = useState(false);
  const [codigoGenerado, setCodigoGenerado] = useState('');

  // Función para obtener GPS y evaluar polígonos
  const refrescarUbicacion = useCallback(async () => {
    setCargandoGps(true);
    try {
      const gps = await obtenerCoordenadasDispositivo();
      if (gps) {
        setCoords(gps);
        if (parcelas.length > 0) {
          const resultado = await detectarUbicacionEnFundo(gps, parcelas);
          setDeteccion(resultado);

          // Si detectó una parcela válida, preseleccionarla
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

  // Ejecutar adquisición GPS al abrir el modal
  useEffect(() => {
    if (visible) {
      setAlertaEnviadaConExito(false);
      setCodigoGenerado('');
      setObservaciones('');
      setFotoUri(null);
      setFotoBase64(null);
      setCategoria('PLAGA');
      setUrgencia('ALERTA');
      refrescarUbicacion();
    }
  }, [visible, refrescarUbicacion]);

  // Si no hay parcela seleccionada y no se detectó ninguna, preseleccionar la primera
  useEffect(() => {
    if (!parcelaId && parcelas.length > 0) {
      setParcelaId(parcelas[0].id);
    }
  }, [parcelas, parcelaId]);

  // Capturar foto desde cámara
  const tomarFoto = async () => {
    try {
      const permiso = await ImagePicker.requestCameraPermissionsAsync();
      if (!permiso.granted) {
        alert('Se requieren permisos de cámara para capturar la evidencia.');
        return;
      }

      const resultado = await ImagePicker.launchCameraAsync({
        allowsEditing: false,
        quality: 0.6,
        base64: true,
      });

      if (!resultado.canceled && resultado.assets?.[0]) {
        const asset = resultado.assets[0];
        setFotoUri(asset.uri);
        if (asset.base64) {
          setFotoBase64(`data:image/jpeg;base64,${asset.base64}`);
        }
      }
    } catch (err) {
      console.warn('Error al activar cámara:', err);
    }
  };

  // Seleccionar foto desde galería
  const seleccionarFoto = async () => {
    try {
      const permiso = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permiso.granted) {
        alert('Se requieren permisos de galería para seleccionar la evidencia.');
        return;
      }

      const resultado = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: false,
        quality: 0.6,
        base64: true,
      });

      if (!resultado.canceled && resultado.assets?.[0]) {
        const asset = resultado.assets[0];
        setFotoUri(asset.uri);
        if (asset.base64) {
          setFotoBase64(`data:image/jpeg;base64,${asset.base64}`);
        }
      }
    } catch (err) {
      console.warn('Error al seleccionar imagen:', err);
    }
  };

  // Enviar alerta fitosanitaria al supervisor
  const handleSubmitAlerta = async () => {
    if (!parcelaId) {
      alert('Debes seleccionar o confirmar la parcela donde te encuentras.');
      return;
    }

    const lat = coords?.latitud || parcelas.find((p) => p.id === parcelaId)?.latitudCentro || -11.95;
    const lng = coords?.longitud || parcelas.find((p) => p.id === parcelaId)?.longitudCentro || -76.98;

    const catSeleccionada = CATEGORIAS.find((c) => c.id === categoria);
    const recomendacionAutomatica =
      categoria === 'PLAGA'
        ? 'Inspección urgente de focos, aislar el sector y preparar cuadrilla de control fitosanitario.'
        : categoria === 'ENFERMEDAD'
          ? 'Inspección de avance fúngico; suspender aspersión foliar hasta prescripción agronómica.'
          : categoria === 'RIEGO'
            ? 'Cierre de válvula del sector afectado y revisión técnica inmediata de tubería y goteros.'
            : categoria === 'MALEZAS'
              ? 'Programar labor de deshierbe manual o mecánico en el sector.'
              : 'Verificación en terreno por el supervisor de campo asignado.';

    const payload = {
      parcelaId,
      sectorId: sectorId || undefined,
      usuarioId: usuarioActual?.id,
      latitud: Number(lat),
      longitud: Number(lng),
      estadoGeneral: urgencia === 'CRITICO' ? ('CRITICO' as const) : ('ALERTA' as const),
      saludPorcentaje: urgencia === 'CRITICO' ? 35 : 65,
      totalPlagasDetectadas: categoria === 'PLAGA' || categoria === 'ENFERMEDAD' ? 1 : 0,
      esAlerta: true,
      detecciones: [
        {
          clase: catSeleccionada?.titulo || 'Anomalía de Campo',
          confianza: 0.95,
          caja: { x_min: 0, y_min: 0, x_max: 100, y_max: 100 },
        },
      ],
      recomendaciones: [recomendacionAutomatica],
      imagenUrl: fotoBase64 || fotoUri || undefined,
      origenCaptura: 'OPERADOR_CAMPO_APP',
      observaciones: observaciones.trim() || `Alerta rápida reportada por operador: ${catSeleccionada?.titulo}`,
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
          {/* Cabecera de Alerta */}
          <View style={styles.cabecera}>
            <View style={styles.filaTitulo}>
              <View style={styles.iconoAlerta}>
                <AlertTriangle size={24} color="#DC2626" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.tituloModal}>¡ALERTA FITOSANITARIA EN CAMPO!</Text>
                <Text style={styles.subtituloModal}>
                  Reporte georreferenciado directo para tu Supervisor
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

          {/* Si ya se envió con éxito */}
          {alertaEnviadaConExito ? (
            <View style={styles.cuerpoExito}>
              <View style={styles.iconoExitoGrande}>
                <CheckCircle2 size={54} color="#16A34A" />
              </View>

              <Text style={styles.tituloExito}>¡ALERTA EMITIDA CON ÉXITO!</Text>
              <Text style={styles.codigoExito}>{codigoGenerado}</Text>
              <Text style={styles.descripcionExito}>
                Tu reporte ha sido transmitido en tiempo real con tus coordenadas satelitales exactas.
                La alerta ha escalado automáticamente a la pantalla de tu{' '}
                <Text style={{ fontWeight: 'bold', color: Palette.forestGreen }}>
                  Supervisor de Campo
                </Text>{' '}
                para su verificación inmediata.
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
                {coords && (
                  <Text style={styles.itemResumenExito}>
                    📡 GPS: {coords.latitud.toFixed(6)}, {coords.longitud.toFixed(6)}
                  </Text>
                )}
              </View>

              <Boton
                titulo="Entendido y Volver al Trabajo"
                onPress={onCerrar}
                variante="primario"
                tamano="lg"
                estilo={{ width: '100%', marginTop: 16 }}
              />
            </View>
          ) : (
            <ScrollView style={styles.cuerpoScroll} showsVerticalScrollIndicator={false}>
              {/* Tarjeta de Ubicación GPS y Detección Automática de Parcela/Sector */}
              <View style={styles.tarjetaGps}>
                <View style={styles.cabeceraTarjetaGps}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flex: 1 }}>
                    <MapPin size={18} color={Palette.forestGreen} />
                    <Text style={styles.tituloTarjetaGps}>Geolocalización en Tiempo Real</Text>
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

                {/* Banner de Reconocimiento Geográfico */}
                {cargandoGps ? (
                  <View style={styles.bannerBuscando}>
                    <ActivityIndicator size="small" color="#0284C7" />
                    <Text style={styles.textoBuscando}>
                      Adquiriendo satélites y evaluando delimitación de parcelas...
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

                    {coords && (
                      <Text style={styles.textoCoordsPrecision}>
                        Coordenadas: {coords.latitud.toFixed(6)}, {coords.longitud.toFixed(6)}
                        {coords.precision != null ? ` (±${Math.round(coords.precision)}m de precisión)` : ''}
                      </Text>
                    )}
                  </View>
                ) : (
                  <Text style={styles.textoSinGps}>
                    Presiona &quot;Actualizar GPS&quot; para validar tu ubicación en campo.
                  </Text>
                )}

                {/* Confirmación manual o selectores de Parcela y Sector */}
                <View style={styles.filaSelectoresUbicacion}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.etiquetaCampo}>Parcela Asignada / Confirmada *</Text>
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
                    <Text style={styles.etiquetaCampo}>Sector / Área de Cultivo</Text>
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
                            ? 'Sin sectores'
                            : 'Todo el lote...'
                      }
                      deshabilitado={sectores.length === 0}
                    />
                  </View>
                </View>
              </View>

              {/* Selector de Tipo de Labor / Anomalía */}
              <View style={styles.seccionFormulario}>
                <Text style={styles.tituloSeccion}>1. ¿Qué anomalía detectas en campo? *</Text>
                <View style={styles.gridCategorias}>
                  {CATEGORIAS.map((cat) => {
                    const IconoCat = cat.icono;
                    const esSeleccionado = categoria === cat.id;
                    return (
                      <Pressable
                        key={cat.id}
                        onPress={() => setCategoria(cat.id)}
                        style={({ pressed }) => [
                          styles.tarjetaCategoria,
                          esSeleccionado && styles.tarjetaCategoriaActiva,
                          pressed && styles.presionado,
                        ]}
                      >
                        <View
                          style={[
                            styles.iconoCatCirculo,
                            { backgroundColor: esSeleccionado ? cat.color : '#F1F5F9' },
                          ]}
                        >
                          <IconoCat
                            size={18}
                            color={esSeleccionado ? '#FFFFFF' : cat.color}
                          />
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text
                            style={[
                              styles.tituloCat,
                              esSeleccionado && { color: Palette.forestGreen, fontWeight: '700' },
                            ]}
                          >
                            {cat.titulo}
                          </Text>
                          <Text style={styles.descripcionCat}>{cat.descripcion}</Text>
                        </View>
                        {esSeleccionado && (
                          <View style={styles.checkCat}>
                            <CheckCircle2 size={16} color={Palette.forestGreen} />
                          </View>
                        )}
                      </Pressable>
                    );
                  })}
                </View>
              </View>

              {/* Selector de Nivel de Urgencia */}
              <View style={styles.seccionFormulario}>
                <Text style={styles.tituloSeccion}>2. Nivel de Urgencia</Text>
                <View style={styles.filaUrgencias}>
                  <Pressable
                    onPress={() => setUrgencia('ALERTA')}
                    style={[
                      styles.botonUrgencia,
                      urgencia === 'ALERTA' && styles.urgenciaAlertaActiva,
                    ]}
                  >
                    <ShieldAlert
                      size={18}
                      color={urgencia === 'ALERTA' ? '#D97706' : '#64748B'}
                    />
                    <View style={{ flex: 1 }}>
                      <Text
                        style={[
                          styles.textoUrgenciaTitulo,
                          urgencia === 'ALERTA' && { color: '#B45309', fontWeight: 'bold' },
                        ]}
                      >
                        ALERTA MODERADA
                      </Text>
                      <Text style={styles.textoUrgenciaDesc}>
                        Atención durante el turno / supervisión hoy
                      </Text>
                    </View>
                  </Pressable>

                  <Pressable
                    onPress={() => setUrgencia('CRITICO')}
                    style={[
                      styles.botonUrgencia,
                      urgencia === 'CRITICO' && styles.urgenciaCriticaActiva,
                    ]}
                  >
                    <AlertTriangle
                      size={18}
                      color={urgencia === 'CRITICO' ? '#DC2626' : '#64748B'}
                    />
                    <View style={{ flex: 1 }}>
                      <Text
                        style={[
                          styles.textoUrgenciaTitulo,
                          urgencia === 'CRITICO' && { color: '#DC2626', fontWeight: 'bold' },
                        ]}
                      >
                        CRÍTICA / INMEDIATA
                      </Text>
                      <Text style={styles.textoUrgenciaDesc}>
                        Peligro de pérdida o fuga masiva
                      </Text>
                    </View>
                  </Pressable>
                </View>
              </View>

              {/* Evidencia Fotográfica */}
              <View style={styles.seccionFormulario}>
                <Text style={styles.tituloSeccion}>3. Evidencia Fotográfica (Opcional)</Text>

                {fotoUri ? (
                  <View style={styles.contenedorFotoPreview}>
                    <Image source={{ uri: fotoUri }} style={styles.fotoPreview} />
                    <Pressable
                      onPress={() => {
                        setFotoUri(null);
                        setFotoBase64(null);
                      }}
                      style={styles.botonEliminarFoto}
                    >
                      <Trash2 size={16} color="#FFFFFF" />
                      <Text style={styles.textoEliminarFoto}>Eliminar Foto</Text>
                    </Pressable>
                  </View>
                ) : (
                  <View style={styles.filaBotonesFoto}>
                    <Pressable
                      onPress={tomarFoto}
                      style={({ pressed }) => [styles.botonCaptura, pressed && styles.presionado]}
                    >
                      <Camera size={20} color={Palette.forestGreen} />
                      <Text style={styles.textoBotonCaptura}>Tomar Foto con Cámara</Text>
                    </Pressable>

                    <Pressable
                      onPress={seleccionarFoto}
                      style={({ pressed }) => [styles.botonCaptura, pressed && styles.presionado]}
                    >
                      <ImageIcon size={20} color="#64748B" />
                      <Text style={[styles.textoBotonCaptura, { color: '#475569' }]}>
                        Subir de Galería
                      </Text>
                    </Pressable>
                  </View>
                )}
              </View>

              {/* Observaciones Adicionales */}
              <View style={styles.seccionFormulario}>
                <Text style={styles.tituloSeccion}>4. Observaciones de Campo</Text>
                <TextInput
                  value={observaciones}
                  onChangeText={setObservaciones}
                  placeholder="Detalla lo que observas (ej. Hojas con manchas amarillas en surco 3, o fuga de agua en válvula 2)..."
                  placeholderTextColor="#94A3B8"
                  multiline
                  numberOfLines={3}
                  style={styles.inputObservaciones}
                />
              </View>
            </ScrollView>
          )}

          {/* Barra de Acciones Inferior */}
          {!alertaEnviadaConExito && (
            <View style={styles.pieAcciones}>
              <Boton
                titulo="Cancelar"
                onPress={onCerrar}
                variante="secundario"
                disabled={guardarMutation.isPending}
              />

              <Boton
                titulo={
                  guardarMutation.isPending
                    ? 'Transmitiendo Alerta...'
                    : '🚨 Emitir Alerta a Supervisor'
                }
                onPress={handleSubmitAlerta}
                variante="peligro"
                disabled={guardarMutation.isPending || !parcelaId}
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
    maxHeight: '92%',
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
    paddingVertical: 16,
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
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#FEE2E2',
    justifyContent: 'center',
    alignItems: 'center',
  },
  tituloModal: {
    fontSize: 16,
    fontWeight: '800',
    color: '#991B1B',
    letterSpacing: 0.3,
  },
  subtituloModal: {
    fontSize: 12,
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
    padding: 18,
  },
  tarjetaGps: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 16,
  },
  cabeceraTarjetaGps: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  tituloTarjetaGps: {
    fontSize: 13,
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
    marginBottom: 12,
  },
  textoBuscando: {
    fontSize: 12,
    color: '#0369A1',
    flex: 1,
  },
  bannerDeteccion: {
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 12,
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
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  textoDeteccionMensaje: {
    fontSize: 12,
    color: '#334155',
    marginTop: 4,
  },
  textoCoordsPrecision: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 4,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  textoSinGps: {
    fontSize: 12,
    color: '#64748B',
    fontStyle: 'italic',
    marginBottom: 10,
  },
  filaSelectoresUbicacion: {
    flexDirection: Platform.OS === 'web' ? 'row' : 'column',
    gap: 12,
    marginTop: 4,
  },
  etiquetaCampo: {
    fontSize: 12,
    fontWeight: '600',
    color: '#334155',
    marginBottom: 4,
  },
  seccionFormulario: {
    marginBottom: 18,
  },
  tituloSeccion: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 8,
  },
  gridCategorias: {
    gap: 8,
  },
  tarjetaCategoria: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 10,
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
  },
  tarjetaCategoriaActiva: {
    borderColor: Palette.forestGreen,
    backgroundColor: '#F0FDF4',
  },
  iconoCatCirculo: {
    width: 36,
    height: 36,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tituloCat: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1E293B',
  },
  descripcionCat: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 1,
  },
  checkCat: {
    paddingRight: 4,
  },
  filaUrgencias: {
    flexDirection: 'row',
    gap: 10,
  },
  botonUrgencia: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 10,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    backgroundColor: '#FFFFFF',
  },
  urgenciaAlertaActiva: {
    borderColor: '#D97706',
    backgroundColor: '#FFFBEB',
  },
  urgenciaCriticaActiva: {
    borderColor: '#DC2626',
    backgroundColor: '#FEF2F2',
  },
  textoUrgenciaTitulo: {
    fontSize: 12,
    fontWeight: '700',
    color: '#475569',
  },
  textoUrgenciaDesc: {
    fontSize: 10,
    color: '#64748B',
    marginTop: 2,
  },
  filaBotonesFoto: {
    flexDirection: 'row',
    gap: 10,
  },
  botonCaptura: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    backgroundColor: '#F8FAFC',
  },
  textoBotonCaptura: {
    fontSize: 12,
    fontWeight: '600',
    color: Palette.forestGreen,
  },
  contenedorFotoPreview: {
    position: 'relative',
    borderRadius: 10,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  fotoPreview: {
    width: '100%',
    height: 180,
    resizeMode: 'cover',
  },
  botonEliminarFoto: {
    position: 'absolute',
    top: 8,
    right: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(220, 38, 38, 0.85)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
  },
  textoEliminarFoto: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
  inputObservaciones: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 8,
    padding: 10,
    fontSize: 13,
    color: '#1E293B',
    textAlignVertical: 'top',
  },
  pieAcciones: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    backgroundColor: '#F8FAFC',
  },
  cuerpoExito: {
    padding: 24,
    alignItems: 'center',
  },
  iconoExitoGrande: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#DCFCE7',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  tituloExito: {
    fontSize: 18,
    fontWeight: '800',
    color: '#16A34A',
    marginBottom: 4,
  },
  codigoExito: {
    fontSize: 15,
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
    fontSize: 13,
    color: '#475569',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 16,
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
    fontSize: 12,
    color: '#334155',
    fontWeight: '500',
  },
});
