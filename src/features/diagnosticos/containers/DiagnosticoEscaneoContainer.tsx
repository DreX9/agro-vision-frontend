import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  useWindowDimensions,
} from 'react-native';
import { Palette } from '@/constants/theme';
import { AlertTriangle } from 'lucide-react-native';
import { AppLayout } from '@/shared/components/layout/app-layout';
import { useParcelasQuery } from '@/features/parcelas/api/parcelas.api';
import {
  useEscanearImagenMutation,
  useGuardarDiagnosticoMutation,
} from '../api/diagnostico.api';
import {
  DiagnosticoRespuesta,
  DespliegueDronConfig,
  CoordenadasHallazgo,
} from '../types/diagnostico.types';
import { obtenerCoordenadasDispositivo } from '../utils/geolocalizacion';
import { VisorCamaraEscaneo } from '../components/VisorCamaraEscaneo';
import { TarjetaDiagnosticoResultado } from '../components/TarjetaDiagnosticoResultado';
import { DiagnosticoSkeleton } from '../components/DiagnosticoSkeleton';
import { SelectorDespliegueDron } from '../components/SelectorDespliegueDron';
import { HistorialDiagnosticosCampo } from '../components/HistorialDiagnosticosCampo';

/**
 * @description Contenedor que orquesta la selección de área/sector para monitoreo fitosanitario,
 * captura de video en vivo (Irium Cam / muestras), inferencia con IA, persistencia automática en BD
 * y clasificación explícita según si es alerta o condición normal.
 */
export function DiagnosticoEscaneoContainer() {
  const { width } = useWindowDimensions();
  const esEscritorio = width >= 980;

  const [diagnosticoActual, setDiagnosticoActual] = useState<DiagnosticoRespuesta | null>(null);
  const [despliegueActual, setDespliegueActual] = useState<DespliegueDronConfig | null>(null);
  const [coordenadasHallazgo, setCoordenadasHallazgo] = useState<CoordenadasHallazgo | null>(null);
  const [guardadoExitoso, setGuardadoExitoso] = useState(false);
  const [autoGuardado, setAutoGuardado] = useState(false);
  const [codigoGuardado, setCodigoGuardado] = useState<string | null>(null);
  const [errorConexion, setErrorConexion] = useState<string | null>(null);
  const [solicitandoGps, setSolicitandoGps] = useState(false);

  // Consulta de parcelas para fallback de persistencia en caso de escaneo rápido sin selección
  const { data: datosParcelas } = useParcelasQuery({ limite: 10 });
  const parcelas = datosParcelas?.items || [];

  const escanearMutacion = useEscanearImagenMutation();
  const guardarMutacion = useGuardarDiagnosticoMutation();

  const handleSolicitarGps = async () => {
    setSolicitandoGps(true);
    try {
      const coords = await obtenerCoordenadasDispositivo();
      if (coords) {
        setCoordenadasHallazgo({
          latitud: coords.latitud,
          longitud: coords.longitud,
          origen: 'GPS_DISPOSITIVO',
          precision: coords.precision,
          timestamp: Date.now(),
        });
      } else {
        alert(
          'No se pudo obtener la ubicación GPS del dispositivo. Por favor verifica los permisos de geolocalización en tu navegador o smartphone.',
        );
      }
    } catch (err) {
      console.warn('Error al solicitar GPS del dispositivo:', err);
    } finally {
      setSolicitandoGps(false);
    }
  };

  /**
   * @description Persiste en PostgreSQL el diagnóstico fitosanitario con su clasificación de alerta
   */
  const ejecutarGuardado = (
    diagnostico: DiagnosticoRespuesta,
    esAuto: boolean = false,
  ) => {
    // Resolver parcela de destino (despliegue actual o primera parcela disponible)
    const parcelaDestino =
      despliegueActual ||
      (parcelas.length > 0
        ? {
            parcelaId: parcelas[0].id,
            parcelaNombre: parcelas[0].nombre,
            sectorId: undefined,
            latitud: Number(parcelas[0].latitudCentro ?? -11.947138),
            longitud: Number(parcelas[0].longitudCentro ?? -76.975346),
          }
        : null);

    if (!parcelaDestino) {
      console.warn('No hay parcela disponible en el sistema para guardar el diagnóstico');
      return;
    }

    const latitudGuardar = coordenadasHallazgo?.latitud ?? parcelaDestino.latitud;
    const longitudGuardar = coordenadasHallazgo?.longitud ?? parcelaDestino.longitud;
    const origenGuardar =
      coordenadasHallazgo?.origen === 'GPS_DISPOSITIVO'
        ? 'CAMARA_DISPOSITIVO'
        : 'SISTEMA_PARCELA';

    // Determinar si constituye una ALERTA fitosanitaria
    const esAlerta =
      diagnostico.estado_general === 'ALERTA' ||
      diagnostico.estado_general === 'CRITICO' ||
      diagnostico.total_plagas_detectadas > 0;

    guardarMutacion.mutate(
      {
        parcelaId: parcelaDestino.parcelaId,
        sectorId: parcelaDestino.sectorId,
        latitud: latitudGuardar,
        longitud: longitudGuardar,
        estadoGeneral: diagnostico.estado_general,
        saludPorcentaje: Math.round(diagnostico.salud_porcentaje),
        totalPlagasDetectadas: diagnostico.total_plagas_detectadas,
        esAlerta,
        detecciones: diagnostico.detecciones,
        recomendaciones: diagnostico.recomendaciones,
        tiempoProcesamientoMs: diagnostico.tiempo_procesamiento_ms,
        origenCaptura: origenGuardar,
      },
      {
        onSuccess: (guardado) => {
          setGuardadoExitoso(true);
          setAutoGuardado(esAuto);
          setCodigoGuardado(guardado.codigo);
        },
        onError: (err) => {
          console.error('Error al guardar diagnóstico en base de datos:', err);
          if (!esAuto) {
            alert('No se pudo guardar el diagnóstico en la base de datos.');
          }
        },
      },
    );
  };

  const handleCapturarYEscanear = async (archivo: Blob | File | string) => {
    setErrorConexion(null);
    setGuardadoExitoso(false);
    setAutoGuardado(false);
    setCodigoGuardado(null);

    // Solicitar automáticamente la ubicación GPS en vivo del dispositivo
    try {
      const coords = await obtenerCoordenadasDispositivo();
      if (coords) {
        setCoordenadasHallazgo({
          latitud: coords.latitud,
          longitud: coords.longitud,
          origen: 'GPS_DISPOSITIVO',
          precision: coords.precision,
          timestamp: Date.now(),
        });
      } else if (despliegueActual) {
        setCoordenadasHallazgo((prev) => {
          if (prev?.origen === 'GPS_DISPOSITIVO') return prev;
          return {
            latitud: despliegueActual.latitud,
            longitud: despliegueActual.longitud,
            origen: 'PARCELA_REFERENCIA',
            timestamp: Date.now(),
          };
        });
      }
    } catch {
      if (despliegueActual) {
        setCoordenadasHallazgo((prev) => {
          if (prev?.origen === 'GPS_DISPOSITIVO') return prev;
          return {
            latitud: despliegueActual.latitud,
            longitud: despliegueActual.longitud,
            origen: 'PARCELA_REFERENCIA',
            timestamp: Date.now(),
          };
        });
      }
    }

    const formData = new FormData();

    if (typeof archivo === 'string') {
      formData.append('archivo', {
        uri: archivo,
        name: 'captura_planta.jpg',
        type: 'image/jpeg',
      } as unknown as Blob);
    } else {
      formData.append('archivo', archivo, 'captura_planta.jpg');
    }

    escanearMutacion.mutate(formData, {
      onSuccess: (data) => {
        setDiagnosticoActual(data);
        setErrorConexion(null);

        // Guardar automáticamente en la base de datos clasificado según si es alerta o no
        ejecutarGuardado(data, true);
      },
      onError: (error) => {
        console.error('Error al ejecutar diagnóstico:', error);
        setErrorConexion(
          'No se pudo conectar con el microservicio de IA (puerto 8000). Asegúrate de que agro-vision-ai esté ejecutándose con: python -m uvicorn api.main:app --reload --port 8000',
        );
      },
    });
  };

  const handleGuardarDiagnostico = () => {
    if (!diagnosticoActual) return;
    ejecutarGuardado(diagnosticoActual, false);
  };

  const handleLimpiar = () => {
    setDiagnosticoActual(null);
    setCoordenadasHallazgo(null);
    setGuardadoExitoso(false);
    setAutoGuardado(false);
    setCodigoGuardado(null);
    setErrorConexion(null);
  };

  const esAlertaActual = diagnosticoActual
    ? diagnosticoActual.estado_general === 'ALERTA' ||
      diagnosticoActual.estado_general === 'CRITICO' ||
      diagnosticoActual.total_plagas_detectadas > 0
    : false;

  return (
    <AppLayout
      titulo="Escáner y Diagnóstico con IA"
      subtitulo="Inspecciona en tiempo real el cultivo mediante video o cámara web. Detecta plagas y patógenos foliares al instante."
      accionEncabezado={
        <View style={styles.badgeModulo}>
          <Text style={styles.textoBadgeModulo}>MÓDULO FITOSANITARIO CON IA</Text>
        </View>
      }
    >
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[
          styles.scrollContenedor,
          esEscritorio && styles.scrollEscritorio,
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.areaTrabajo, esEscritorio && styles.areaTrabajoEscritorio]}>
          {/* Alerta de Error de Conexión si el servicio de IA está apagado */}
          {errorConexion && (
            <View style={styles.alertaError}>
              <AlertTriangle size={20} color="#DC2626" />
              <Text style={styles.textoAlertaError}>{errorConexion}</Text>
            </View>
          )}

          {/* Configuración de Misión: Parcela y Sector donde se envía el dron */}
          <SelectorDespliegueDron
            despliegue={despliegueActual}
            onDespliegueChange={setDespliegueActual}
          />

          {/* Distribución Responsiva (2 Columnas en PC, 1 Columna en Celular) */}
          <View
            style={[
              styles.grillaPrincipal,
              esEscritorio && styles.grillaPrincipalEscritorio,
            ]}
          >
            {/* Columna Izquierda: Visor de Video / Cámara (Irium Webcam o Video Muestra) */}
            <View
              style={[
                styles.columnaMedia,
                esEscritorio && styles.columnaMediaEscritorio,
              ]}
            >
              <VisorCamaraEscaneo
                detecciones={diagnosticoActual?.detecciones ?? []}
                cargando={escanearMutacion.isPending}
                onCapturarYEscanear={handleCapturarYEscanear}
                onLimpiar={handleLimpiar}
              />
            </View>

            {/* Columna Derecha: Tarjeta de Diagnóstico, Coordenadas con Google Maps y Botón de Guardado */}
            <View
              style={[
                styles.columnaInforme,
                esEscritorio && styles.columnaInformeEscritorio,
              ]}
            >
              {escanearMutacion.isPending ? (
                <DiagnosticoSkeleton />
              ) : (
                <TarjetaDiagnosticoResultado
                  resultado={diagnosticoActual}
                  despliegue={despliegueActual}
                  coordenadasHallazgo={coordenadasHallazgo}
                  onGuardarDiagnostico={handleGuardarDiagnostico}
                  guardando={guardarMutacion.isPending}
                  guardadoExitoso={guardadoExitoso}
                  autoGuardado={autoGuardado}
                  codigoGuardado={codigoGuardado}
                  esAlerta={diagnosticoActual ? esAlertaActual : undefined}
                  onSolicitarGps={handleSolicitarGps}
                  solicitandoGps={solicitandoGps}
                />
              )}
            </View>
          </View>

          {/* Historial de Diagnósticos Registrados en Base de Datos */}
          <HistorialDiagnosticosCampo parcelaId={despliegueActual?.parcelaId} />
        </View>
      </ScrollView>
    </AppLayout>
  );
}

const styles = StyleSheet.create({
  scroll: {
    flex: 1,
    width: '100%',
  },
  scrollContenedor: {
    flexGrow: 1,
    paddingBottom: 40,
    width: '100%',
  },
  scrollEscritorio: {
    alignItems: 'center',
  },
  areaTrabajo: {
    width: '100%',
    gap: 20,
  },
  areaTrabajoEscritorio: {
    maxWidth: 1400,
  },
  badgeModulo: {
    alignSelf: 'flex-start',
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#C8E6C9',
  },
  textoBadgeModulo: {
    color: Palette.forestGreen,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  grillaPrincipal: {
    flexDirection: 'column',
    gap: 20,
  },
  grillaPrincipalEscritorio: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 24,
  },
  columnaMedia: {
    width: '100%',
  },
  columnaMediaEscritorio: {
    flex: 1.25,
  },
  columnaInforme: {
    width: '100%',
  },
  columnaInformeEscritorio: {
    flex: 1,
  },
  alertaError: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    borderRadius: 8,
    padding: 14,
  },
  textoAlertaError: {
    flex: 1,
    fontSize: 13,
    color: '#991B1B',
    lineHeight: 18,
    fontWeight: '500',
  },
});
