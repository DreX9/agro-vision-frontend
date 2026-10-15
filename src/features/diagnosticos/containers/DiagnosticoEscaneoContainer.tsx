import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  useWindowDimensions,
  Platform,
} from 'react-native';
import { Palette } from '@/constants/theme';
import { AlertTriangle } from 'lucide-react-native';
import { useEscanearImagenMutation } from '../api/diagnostico.api';
import { DiagnosticoRespuesta } from '../types/diagnostico.types';
import { VisorCamaraEscaneo } from '../components/VisorCamaraEscaneo';
import { TarjetaDiagnosticoResultado } from '../components/TarjetaDiagnosticoResultado';
import { DiagnosticoSkeleton } from '../components/DiagnosticoSkeleton';

/**
 * @description Contenedor que orquesta la captura de video/cámara y el diagnóstico fitosanitario.
 */
export function DiagnosticoEscaneoContainer() {
  const { width } = useWindowDimensions();
  const esEscritorio = width >= 980;

  const [diagnosticoActual, setDiagnosticoActual] = useState<DiagnosticoRespuesta | null>(null);
  const [errorConexion, setErrorConexion] = useState<string | null>(null);
  const escanearMutacion = useEscanearImagenMutation();

  const handleCapturarYEscanear = (archivo: Blob | File | string) => {
    setErrorConexion(null);
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
      },
      onError: (error) => {
        console.error('Error al ejecutar diagnóstico:', error);
        setErrorConexion(
          'No se pudo conectar con el microservicio de IA (puerto 8000). Asegúrate de que agro-vision-ai esté ejecutándose con: python -m uvicorn api.main:app --reload --port 8000',
        );
      },
    });
  };

  const handleLimpiar = () => {
    setDiagnosticoActual(null);
    setErrorConexion(null);
  };

  return (
    <ScrollView
      contentContainerStyle={[
        styles.scrollContenedor,
        esEscritorio && styles.scrollEscritorio,
      ]}
      showsVerticalScrollIndicator={false}
    >
      <View style={[styles.areaTrabajo, esEscritorio && styles.areaTrabajoEscritorio]}>
        {/* Cabecera del Módulo Aislado */}
        <View style={styles.cabeceraModulo}>
          <View style={styles.badgeModulo}>
            <Text style={styles.textoBadgeModulo}>MÓDULO DE PRUEBA FITOSANITARIA</Text>
          </View>
          <Text style={styles.tituloPrincipal}>Escáner y Diagnóstico con IA</Text>
          <Text style={styles.subtituloPrincipal}>
            Inspecciona en tiempo real el cultivo mediante video o cámara web. Detecta plagas y patógenos foliares al instante.
          </Text>
        </View>

        {/* Alerta de Error de Conexión si el servicio de IA está apagado */}
        {errorConexion && (
          <View style={styles.alertaError}>
            <AlertTriangle size={20} color="#DC2626" />
            <Text style={styles.textoAlertaError}>{errorConexion}</Text>
          </View>
        )}

        {/* Distribución Responsiva (2 Columnas en PC, 1 Columna en Celular) */}
        <View
          style={[
            styles.grillaPrincipal,
            esEscritorio && styles.grillaPrincipalEscritorio,
          ]}
        >
          {/* Columna Izquierda: Visor de Video / Cámara */}
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

          {/* Columna Derecha: Tarjeta de Diagnóstico y Recomendaciones */}
          <View
            style={[
              styles.columnaInforme,
              esEscritorio && styles.columnaInformeEscritorio,
            ]}
          >
            {escanearMutacion.isPending ? (
              <DiagnosticoSkeleton />
            ) : (
              <TarjetaDiagnosticoResultado resultado={diagnosticoActual} />
            )}
          </View>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollContenedor: {
    flexGrow: 1,
    backgroundColor: '#F8FAFC',
    padding: 16,
  },
  scrollEscritorio: {
    padding: 32,
    alignItems: 'center',
  },
  areaTrabajo: {
    width: '100%',
    gap: 24,
  },
  areaTrabajoEscritorio: {
    maxWidth: 1400,
  },
  cabeceraModulo: {
    gap: 8,
  },
  badgeModulo: {
    alignSelf: 'flex-start',
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  textoBadgeModulo: {
    color: Palette.forestGreen,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  tituloPrincipal: {
    fontSize: 26,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: -0.5,
  },
  subtituloPrincipal: {
    fontSize: 14,
    color: '#64748B',
    lineHeight: 22,
    maxWidth: 800,
  },
  grillaPrincipal: {
    flexDirection: 'column',
    gap: 24,
  },
  grillaPrincipalEscritorio: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 28,
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

