import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import {
  ShieldCheck,
  AlertTriangle,
  AlertOctagon,
  HelpCircle,
  Clock,
  Sparkles,
  Leaf,
  MapPin,
  Save,
  CheckCircle2,
  ExternalLink,
  Navigation,
} from 'lucide-react-native';
import { Palette } from '@/constants/theme';
import { Card } from '@/shared/components/ui/card';
import { Badge, VarianteBadge } from '@/shared/components/ui/badge';
import { Boton } from '@/shared/components/ui/boton';
import { DiagnosticoRespuesta, DespliegueDronConfig, CoordenadasHallazgo } from '../types/diagnostico.types';
import { abrirGoogleMaps } from '../utils/geolocalizacion';

export interface TarjetaDiagnosticoResultadoProps {
  resultado: DiagnosticoRespuesta | null;
  despliegue?: DespliegueDronConfig | null;
  coordenadasHallazgo?: CoordenadasHallazgo | null;
  onGuardarDiagnostico?: () => void;
  guardando?: boolean;
  guardadoExitoso?: boolean;
  onSolicitarGps?: () => Promise<void> | void;
  solicitandoGps?: boolean;
  esAlerta?: boolean;
  codigoGuardado?: string | null;
  autoGuardado?: boolean;
}

/**
 * @description Presenta el informe fitosanitario con estado, detecciones, recomendaciones,
 * coordenadas geográficas fijadas al momento del hallazgo con enlace directo a Google Maps y guardado.
 */
export const TarjetaDiagnosticoResultado: React.FC<TarjetaDiagnosticoResultadoProps> = ({
  resultado,
  despliegue,
  coordenadasHallazgo,
  onGuardarDiagnostico,
  guardando = false,
  guardadoExitoso = false,
  onSolicitarGps,
  solicitandoGps = false,
  esAlerta,
  codigoGuardado,
  autoGuardado = false,
}) => {
  if (!resultado) {
    return (
      <Card estilo={styles.tarjetaVacia}>
        <Leaf size={40} color={Palette.forestGreen} />
        <Text style={styles.tituloVacio}>Listo para Escanear</Text>
        <Text style={styles.descripcionVacia}>
          Apunta la cámara a las hojas o activa el video de prueba y presiona "Empezar a escanear" para detectar anomalías.
        </Text>
      </Card>
    );
  }

  const obtenerConfiguracionEstado = (
    estado: DiagnosticoRespuesta['estado_general'],
  ): { variante: VarianteBadge; icono: React.ReactNode; color: string } => {
    switch (estado) {
      case 'CRITICO':
        return {
          variante: 'peligro',
          icono: <AlertOctagon size={16} color="#DC2626" />,
          color: '#DC2626',
        };
      case 'ALERTA':
        return {
          variante: 'alerta',
          icono: <AlertTriangle size={16} color="#D97706" />,
          color: '#D97706',
        };
      case 'SIN_DETECCION':
        return {
          variante: 'neutro',
          icono: <HelpCircle size={16} color="#64748B" />,
          color: '#64748B',
        };
      case 'OPTIMO':
      default:
        return {
          variante: 'exito',
          icono: <ShieldCheck size={16} color="#059669" />,
          color: '#059669',
        };
    }
  };

  const configEstado = obtenerConfiguracionEstado(resultado.estado_general);
  const esAlertaCalculada =
    esAlerta !== undefined
      ? esAlerta
      : resultado.estado_general === 'ALERTA' ||
        resultado.estado_general === 'CRITICO' ||
        resultado.total_plagas_detectadas > 0;

  return (
    <Card estilo={styles.contenedor}>
      {/* Banner Prominente de Clasificación: ALERTA FITOSANITARIA vs CONDICIÓN REGULAR */}
      {esAlertaCalculada ? (
        <View style={styles.bannerAlertaFitosanitaria}>
          <View style={styles.iconoAlertaBanner}>
            <AlertTriangle size={22} color="#DC2626" />
          </View>
          <View style={styles.textosAlertaBanner}>
            <View style={styles.filaTagAlerta}>
              <Text style={styles.tituloAlertaBanner}>ALERTA FITOSANITARIA DETECTADA</Text>
              <Badge texto="PRIORIDAD ALTA" variante="peligro" />
            </View>
            <Text style={styles.descripcionAlertaBanner}>
              Se detectaron signos patógenos o plagas activas en el cultivo. Este hallazgo se registra en base de datos como ALERTA fitosanitaria para intervención.
            </Text>
          </View>
        </View>
      ) : (
        <View style={styles.bannerNormalFitosanitaria}>
          <View style={styles.iconoNormalBanner}>
            <ShieldCheck size={22} color="#059669" />
          </View>
          <View style={styles.textosNormalBanner}>
            <View style={styles.filaTagAlerta}>
              <Text style={styles.tituloNormalBanner}>CONDICIÓN REGULAR / SIN ALERTA</Text>
              <Badge texto="CULTIVO SANO" variante="exito" />
            </View>
            <Text style={styles.descripcionNormalBanner}>
              Foliarmente óptimo sin evidencia de plagas invasoras. Este monitoreo se registra en base de datos como CONDICIÓN NORMAL.
            </Text>
          </View>
        </View>
      )}

      {/* Cabecera de Estado y Tiempo */}
      <View style={styles.filaCabecera}>
        <View style={styles.columnaTitulo}>
          <Text style={styles.subtitulo}>Diagnóstico Fitosanitario</Text>
          <View style={styles.filaBadge}>
            <Badge
              texto={resultado.estado_general === 'SIN_DETECCION' ? 'SIN DETECCIÓN' : `ESTADO: ${resultado.estado_general}`}
              variante={configEstado.variante}
              icono={configEstado.icono}
            />
          </View>
        </View>

        <View style={styles.tiempoInferencia}>
          <Clock size={14} color="#64748B" />
          <Text style={styles.textoTiempo}>{resultado.tiempo_procesamiento_ms} ms</Text>
        </View>
      </View>

      {/* Métricas de Salud Foliar */}
      <View style={styles.cajaSalud}>
        <View style={styles.filaPorcentaje}>
          <Text style={styles.etiquetaSalud}>Salud Estimada de la Planta</Text>
          <Text style={[styles.valorPorcentaje, { color: configEstado.color }]}>
            {resultado.estado_general === 'SIN_DETECCION' ? 'N/D' : `${resultado.salud_porcentaje}%`}
          </Text>
        </View>
        <View style={styles.barraFondo}>
          <View
            style={[
              styles.barraProgreso,
              {
                width: `${Math.max(5, Math.min(100, resultado.salud_porcentaje))}%`,
                backgroundColor: configEstado.color,
              },
            ]}
          />
        </View>
      </View>

      {/* Bloque de Geolocalización de la Detección */}
      {(() => {
        const coordsEfectivas = coordenadasHallazgo
          ? { latitud: coordenadasHallazgo.latitud, longitud: coordenadasHallazgo.longitud }
          : despliegue
          ? { latitud: despliegue.latitud, longitud: despliegue.longitud }
          : null;

        return (
          <View style={styles.cajaGeolocalizacion}>
            <View style={styles.filaTituloGeo}>
              <View style={styles.filaTituloConIcono}>
                <MapPin size={16} color={Palette.forestGreen} />
                <Text style={styles.tituloSeccion}>Geolocalización del Hallazgo</Text>
              </View>
              {coordenadasHallazgo?.origen === 'GPS_DISPOSITIVO' && (
                <Badge texto="GPS EN VIVO FIJADO AL DETECTAR" variante="exito" />
              )}
            </View>

            {despliegue || coordsEfectivas ? (
              <View style={styles.grillaGeoDetalles}>
                {despliegue && (
                  <>
                    <View style={styles.itemGeo}>
                      <Text style={styles.labelGeo}>Área / Parcela:</Text>
                      <Text style={styles.valorGeo}>{despliegue.parcelaNombre}</Text>
                    </View>

                    {despliegue.sectorNombre && (
                      <View style={styles.itemGeo}>
                        <Text style={styles.labelGeo}>Zona de Cultivo:</Text>
                        <Text style={styles.valorGeo}>{despliegue.sectorNombre}</Text>
                      </View>
                    )}

                    <View style={styles.itemGeo}>
                      <Text style={styles.labelGeo}>Cultivo:</Text>
                      <Text style={styles.valorGeo}>
                        {despliegue.cultivoNombre}
                        {despliegue.cultivoVariedad ? ` (${despliegue.cultivoVariedad})` : ''}
                      </Text>
                    </View>
                  </>
                )}

                {coordsEfectivas && (
                  <View style={styles.itemGeo}>
                    <Text style={styles.labelGeo}>Coordenadas GPS de Detección:</Text>
                    <Text style={styles.valorGeoCoordenadas}>
                      Lat: {coordsEfectivas.latitud.toFixed(6)}°, Lon: {coordsEfectivas.longitud.toFixed(6)}°
                    </Text>
                  </View>
                )}

                {/* Enlace para abrir en Google Maps y solicitar GPS */}
                {coordsEfectivas && (
                  <View style={styles.filaBotonesGeo}>
                    <Pressable
                      onPress={() => abrirGoogleMaps(coordsEfectivas.latitud, coordsEfectivas.longitud)}
                      style={({ pressed }) => [styles.botonGoogleMaps, pressed && styles.presionado]}
                    >
                      <ExternalLink size={14} color="#0284C7" />
                      <Text style={styles.textoBotonGoogleMaps}>Ver ubicación en Google Maps</Text>
                    </Pressable>

                    {onSolicitarGps && (
                      <Pressable
                        onPress={onSolicitarGps}
                        disabled={solicitandoGps}
                        style={({ pressed }) => [
                          styles.botonSolicitarGps,
                          solicitandoGps && styles.botonDeshabilitado,
                          pressed && styles.presionado,
                        ]}
                      >
                        <Navigation size={13} color={Palette.forestGreen} />
                        <Text style={styles.textoBotonSolicitarGps}>
                          {solicitandoGps ? 'Obteniendo GPS...' : 'Solicitar GPS en vivo'}
                        </Text>
                      </Pressable>
                    )}
                  </View>
                )}
              </View>
            ) : (
              <View style={styles.avisoSinUbicacion}>
                <AlertTriangle size={16} color="#D97706" />
                <Text style={styles.textoAvisoSinUbicacion}>
                  Seleccione una parcela en el panel superior para asociar las coordenadas GPS y guardar.
                </Text>
              </View>
            )}
          </View>
        );
      })()}

      {/* Resumen de Detecciones */}
      <View style={styles.seccionDetecciones}>
        <Text style={styles.tituloSeccion}>
          Detecciones Espaciales ({resultado.total_plagas_detectadas})
        </Text>
        {resultado.detecciones.length === 0 ? (
          <Text style={styles.textoSinDetecciones}>
            No se identificaron patógenos ni plagas invasoras en este frame.
          </Text>
        ) : (
          <View style={styles.listaChips}>
            {resultado.detecciones.map((item, idx) => (
              <View key={`det-${idx}`} style={styles.chipDeteccion}>
                <Text style={styles.textoChipClase}>{item.clase.replace(/_/g, ' ')}</Text>
                <View style={styles.badgeCerteza}>
                  <Text style={styles.textoCerteza}>{Math.round(item.confianza * 100)}%</Text>
                </View>
              </View>
            ))}
          </View>
        )}
      </View>

      {/* Recomendaciones Agronómicas */}
      <View style={styles.seccionRecomendaciones}>
        <View style={styles.filaTituloRecomendacion}>
          <Sparkles size={16} color={Palette.forestGreen} />
          <Text style={styles.tituloSeccion}>Recomendaciones Agronómicas</Text>
        </View>
        <View style={styles.listaRecomendaciones}>
          {resultado.recomendaciones.map((rec, i) => (
            <View key={`rec-${i}`} style={styles.itemRecomendacion}>
              <View style={styles.puntoVinieta} />
              <Text style={styles.textoRecomendacion}>{rec}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* Estado de Persistencia en Base de Datos */}
      <View style={styles.seccionAccionGuardar}>
        {guardadoExitoso ? (
          <View
            style={[
              styles.bannerGuardadoExitoso,
              esAlertaCalculada ? styles.bannerGuardadoAlerta : styles.bannerGuardadoNormal,
            ]}
          >
            <CheckCircle2 size={18} color={esAlertaCalculada ? '#DC2626' : '#059669'} />
            <View style={{ flex: 1, gap: 2 }}>
              <Text
                style={[
                  styles.textoGuardadoExitoso,
                  { color: esAlertaCalculada ? '#991B1B' : '#065F46' },
                ]}
              >
                {autoGuardado
                  ? 'Guardado automáticamente en Base de Datos'
                  : 'Guardado con éxito en Base de Datos'}
              </Text>
              <Text
                style={{
                  fontSize: 12,
                  color: esAlertaCalculada ? '#B91C1C' : '#047857',
                  fontWeight: '500',
                }}
              >
                {codigoGuardado ? `Código: ${codigoGuardado} · ` : ''}
                {esAlertaCalculada
                  ? 'Registrado como: ALERTA FITOSANITARIA ⚠️'
                  : 'Registrado como: CONDICIÓN NORMAL ✅'}
              </Text>
            </View>
          </View>
        ) : (
          <Boton
            titulo={
              guardando
                ? 'Guardando en Base de Datos...'
                : esAlertaCalculada
                  ? 'Registrar Alerta Fitosanitaria en BD'
                  : 'Registrar Monitoreo en BD'
            }
            variante={esAlertaCalculada ? 'peligro' : 'primario'}
            cargando={guardando}
            disabled={!despliegue || guardando}
            iconoIzquierda={<Save size={18} color="#FFFFFF" />}
            onPress={onGuardarDiagnostico}
          />
        )}
      </View>
    </Card>
  );
};

const styles = StyleSheet.create({
  contenedor: { padding: 22, gap: 18 },
  tarjetaVacia: {
    padding: 32,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: '#F8FAFC',
    borderStyle: 'dashed',
  },
  tituloVacio: { fontSize: 18, fontWeight: '700', color: '#1E293B' },
  descripcionVacia: {
    fontSize: 14,
    color: '#64748B',
    textAlign: 'center',
    maxWidth: 320,
    lineHeight: 20,
  },
  filaCabecera: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  columnaTitulo: { gap: 6 },
  subtitulo: { fontSize: 12, fontWeight: '700', color: '#64748B', textTransform: 'uppercase', letterSpacing: 0.5 },
  filaBadge: { flexDirection: 'row' },
  tiempoInferencia: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  textoTiempo: { fontSize: 12, fontWeight: '600', color: '#475569' },
  cajaSalud: { backgroundColor: '#F8FAFC', padding: 14, borderRadius: 10, gap: 8 },
  filaPorcentaje: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  etiquetaSalud: { fontSize: 13, fontWeight: '600', color: '#334155' },
  valorPorcentaje: { fontSize: 20, fontWeight: '800' },
  barraFondo: { height: 8, backgroundColor: '#E2E8F0', borderRadius: 4, overflow: 'hidden' },
  barraProgreso: { height: '100%', borderRadius: 4 },
  cajaGeolocalizacion: {
    backgroundColor: '#F8FAFC',
    padding: 14,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 10,
  },
  filaTituloGeo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
  },
  filaTituloConIcono: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  grillaGeoDetalles: {
    gap: 8,
  },
  itemGeo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    flexWrap: 'wrap',
  },
  labelGeo: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
  },
  valorGeo: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
  },
  valorGeoCoordenadas: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0369A1',
    fontFamily: 'monospace',
  },
  filaBotonesGeo: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 6,
  },
  botonGoogleMaps: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#F0F9FF',
    borderWidth: 1,
    borderColor: '#BAE6FD',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  textoBotonGoogleMaps: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0284C7',
  },
  botonSolicitarGps: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#BBF7D0',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  textoBotonSolicitarGps: {
    fontSize: 12,
    fontWeight: '700',
    color: '#15803D',
  },
  botonDeshabilitado: {
    opacity: 0.6,
  },
  avisoSinUbicacion: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FFFBEB',
    padding: 10,
    borderRadius: 6,
  },
  textoAvisoSinUbicacion: {
    flex: 1,
    fontSize: 12,
    color: '#B45309',
    lineHeight: 16,
  },
  seccionDetecciones: { gap: 10 },
  tituloSeccion: { fontSize: 14, fontWeight: '700', color: '#1E293B' },
  textoSinDetecciones: { fontSize: 13, color: '#64748B', fontStyle: 'italic' },
  listaChips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chipDeteccion: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#F1F5F9',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  textoChipClase: { fontSize: 13, fontWeight: '600', color: '#1E293B' },
  badgeCerteza: { backgroundColor: '#E2E8F0', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  textoCerteza: { fontSize: 11, fontWeight: '700', color: '#475569' },
  seccionRecomendaciones: { gap: 10, borderTopWidth: 1, borderTopColor: '#F1F5F9', paddingTop: 14 },
  filaTituloRecomendacion: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  listaRecomendaciones: { gap: 8 },
  itemRecomendacion: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  puntoVinieta: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Palette.forestGreen,
    marginTop: 6,
  },
  textoRecomendacion: { flex: 1, fontSize: 13, color: '#334155', lineHeight: 18 },
  seccionAccionGuardar: {
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    paddingTop: 14,
  },
  bannerGuardadoExitoso: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#A7F3D0',
    padding: 12,
    borderRadius: 8,
  },
  bannerGuardadoNormal: {
    backgroundColor: '#ECFDF5',
    borderColor: '#A7F3D0',
  },
  bannerGuardadoAlerta: {
    backgroundColor: '#FEF2F2',
    borderColor: '#FECACA',
  },
  bannerAlertaFitosanitaria: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    backgroundColor: '#FEF2F2',
    borderWidth: 1.5,
    borderColor: '#F87171',
    borderRadius: 10,
    padding: 14,
  },
  iconoAlertaBanner: {
    padding: 4,
  },
  textosAlertaBanner: {
    flex: 1,
    gap: 4,
  },
  filaTagAlerta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    flexWrap: 'wrap',
  },
  tituloAlertaBanner: {
    fontSize: 13,
    fontWeight: '800',
    color: '#991B1B',
    letterSpacing: 0.5,
  },
  descripcionAlertaBanner: {
    fontSize: 12,
    color: '#7F1D1D',
    lineHeight: 16,
  },
  bannerNormalFitosanitaria: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    backgroundColor: '#F0FDF4',
    borderWidth: 1.5,
    borderColor: '#86EFAC',
    borderRadius: 10,
    padding: 14,
  },
  iconoNormalBanner: {
    padding: 4,
  },
  textosNormalBanner: {
    flex: 1,
    gap: 4,
  },
  tituloNormalBanner: {
    fontSize: 13,
    fontWeight: '800',
    color: '#166534',
    letterSpacing: 0.5,
  },
  descripcionNormalBanner: {
    fontSize: 12,
    color: '#14532D',
    lineHeight: 16,
  },
  textoGuardadoExitoso: {
    flex: 1,
    fontSize: 13,
    color: '#065F46',
    fontWeight: '700',
  },
  presionado: {
    opacity: 0.8,
  },
});
