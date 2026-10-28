import React, { useEffect, useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  Pressable,
  Platform,
  Vibration,
} from 'react-native';
import { useRouter, type Href } from 'expo-router';
import {
  AlertTriangle,
  MapPin,
  Calendar,
  User,
  ExternalLink,
  ScanLine,
  X,
  Bug,
  ShieldAlert,
} from 'lucide-react-native';
import { Palette } from '@/constants/theme';
import { Badge } from '@/shared/components/ui/badge';
import { Boton } from '@/shared/components/ui/boton';
import { useAuthStore } from '@/features/autenticacion';
import { DiagnosticoCampoItem } from '../types/diagnostico.types';
import { obtenerAlertasRecientes } from '../api/diagnostico.api';
import { abrirGoogleMaps } from '../utils/geolocalizacion';
import { getDynamicHost } from '@/shared/api/api-client';

/**
 * @description Genera un tono de audio sintetizado suave para advertencia inmediata en navegadores.
 */
function emitirTonoAlerta() {
  try {
    if (typeof window !== 'undefined') {
      const AudioContextClass =
        window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioContextClass) {
        const ctx = new AudioContextClass();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(784, ctx.currentTime); // Sol (G5)
        osc.frequency.exponentialRampToValueAtTime(587.33, ctx.currentTime + 0.25); // Re (D5)

        gain.gain.setValueAtTime(0.25, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start();
        osc.stop(ctx.currentTime + 0.35);
      }
    }
  } catch {
    // Silencioso si el navegador bloquea audio antes de interacción
  }
}

/**
 * @description Componente global que escucha alertas fitosanitarias reportadas en campo en tiempo real.
 * Si dos usuarios están conectados y se emite una alerta, la pantalla del agrónomo / supervisor
 * despliega inmediatamente el reporte con quién reportó, fecha, hora y ubicación georreferenciada.
 */
export function NotificadorAlertasAgronomo() {
  const router = useRouter();
  const usuarioActual = useAuthStore((state) => state.usuario);
  const rol = usuarioActual?.rol || '';

  // Solo notificar si hay sesión activa (Agrónomos, Administradores, Supervisores)
  const puedeRecibirAlertas =
    rol === 'AGRONOMO' || rol === 'ADMINISTRADOR' || rol === 'SUPERVISOR';

  const [alertaActiva, setAlertaActiva] = useState<DiagnosticoCampoItem | null>(null);
  const idsAlertasProcesadas = useRef<Set<string>>(new Set());
  const marcaTiempoInicio = useRef<number>(Date.now() - 30000); // Considerar alertas de los últimos 30 segundos al entrar

  const procesarAlerta = useCallback((alerta: DiagnosticoCampoItem) => {
    if (!alerta || !alerta.id || idsAlertasProcesadas.current.has(alerta.id)) {
      return;
    }

    idsAlertasProcesadas.current.add(alerta.id);

    // Activar modal en pantalla
    setAlertaActiva(alerta);

    // Estimular al usuario mediante sonido y vibración
    emitirTonoAlerta();
    if (Platform.OS !== 'web') {
      Vibration.vibrate([0, 250, 100, 250]);
    }
  }, []);

  // Efecto 1: Suscripción reactiva mediante Server-Sent Events (SSE) en Web
  useEffect(() => {
    if (!puedeRecibirAlertas) return;

    let eventSource: EventSource | null = null;

    if (Platform.OS === 'web' && typeof window !== 'undefined' && window.EventSource) {
      try {
        const host = getDynamicHost() || 'localhost';
        const urlSse = `http://${host}:3001/api/v1/diagnosticos/alertas/en-vivo`;

        eventSource = new EventSource(urlSse);

        eventSource.onmessage = (event) => {
          try {
            const data: DiagnosticoCampoItem = JSON.parse(event.data);
            if (data && data.esAlerta) {
              procesarAlerta(data);
            }
          } catch (err) {
            console.warn('[SSE Alertas] Error al parsear evento:', err);
          }
        };

        eventSource.onerror = () => {
          // Si SSE se desconecta, el polling secundario garantiza continuidad
          if (eventSource) {
            eventSource.close();
            eventSource = null;
          }
        };
      } catch (err) {
        console.warn('[SSE Alertas] EventSource no disponible:', err);
      }
    }

    return () => {
      if (eventSource) {
        eventSource.close();
      }
    };
  }, [puedeRecibirAlertas, procesarAlerta]);

  // Efecto 2: Polling de alta confiabilidad cada 4.5 segundos (móvil y respaldo web)
  useEffect(() => {
    if (!puedeRecibirAlertas) return;

    const interval = setInterval(async () => {
      try {
        const fechaDesdeIso = new Date(marcaTiempoInicio.current).toISOString();
        const alertas = await obtenerAlertasRecientes(fechaDesdeIso);

        if (Array.isArray(alertas) && alertas.length > 0) {
          // Procesar las más recientes primero
          alertas.forEach((item) => {
            if (item.esAlerta) {
              procesarAlerta(item);
            }
          });
        }
      } catch {
        // Silencioso para no saturar consola
      }
    }, 4500);

    return () => clearInterval(interval);
  }, [puedeRecibirAlertas, procesarAlerta]);

  if (!alertaActiva) {
    return null;
  }

  const formatearFechaHora = (iso: string) => {
    try {
      const d = new Date(iso);
      const fecha = d.toLocaleDateString('es-PE', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      });
      const hora = d.toLocaleTimeString('es-PE', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      });
      return `${fecha} · ${hora}`;
    } catch {
      return iso;
    }
  };

  const nombreReportante =
    alertaActiva.usuarioNombre ||
    (alertaActiva.usuarioId ? 'Personal Técnico de Campo' : 'Operador de Campo / Dron');

  return (
    <Modal
      transparent
      animationType="fade"
      visible={!!alertaActiva}
      onRequestClose={() => setAlertaActiva(null)}
    >
      <View style={styles.overlayFondo}>
        <View style={styles.tarjetaModal}>
          {/* Cabecera Roja de Alerta Prioritaria */}
          <View style={styles.cabeceraAlerta}>
            <View style={styles.filaTituloAlerta}>
              <View style={styles.iconoAlertaWrapper}>
                <AlertTriangle size={22} color="#DC2626" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.tituloAlerta}>¡ALERTA FITOSANITARIA EN CAMPO!</Text>
                <Text style={styles.subtituloAlerta}>
                  Monitoreo georreferenciado reportado en tiempo real
                </Text>
              </View>
            </View>

            <Pressable
              onPress={() => setAlertaActiva(null)}
              style={({ pressed }) => [styles.botonCerrar, pressed && styles.presionado]}
            >
              <X size={20} color="#64748B" />
            </Pressable>
          </View>

          {/* Cuerpo con Información Detallada del Reporte */}
          <View style={styles.cuerpoDetalles}>
            {/* Fila: Código y Estado */}
            <View style={styles.filaInfoPrincipal}>
              <View style={styles.cajaCodigo}>
                <ShieldAlert size={16} color="#DC2626" />
                <Text style={styles.textoCodigo}>{alertaActiva.codigo}</Text>
              </View>
              <Badge texto="PRIORIDAD CRÍTICA" variante="peligro" />
              <Badge texto={alertaActiva.estadoGeneral} variante="alerta" />
            </View>

            {/* Fila: Quién Reportó */}
            <View style={styles.itemDetalle}>
              <View style={styles.iconoItem}>
                <User size={16} color={Palette.forestGreen} />
              </View>
              <View style={styles.textosItem}>
                <Text style={styles.etiquetaItem}>Reportado por:</Text>
                <Text style={styles.valorItemPrincipal}>{nombreReportante}</Text>
              </View>
            </View>

            {/* Fila: Fecha y Hora */}
            <View style={styles.itemDetalle}>
              <View style={styles.iconoItem}>
                <Calendar size={16} color={Palette.forestGreen} />
              </View>
              <View style={styles.textosItem}>
                <Text style={styles.etiquetaItem}>Fecha y Hora de Detección:</Text>
                <Text style={styles.valorItem}>{formatearFechaHora(alertaActiva.createdAt)}</Text>
              </View>
            </View>

            {/* Fila: Ubicación (Parcela, Sector, Coordenadas) */}
            <View style={styles.itemDetalle}>
              <View style={styles.iconoItem}>
                <MapPin size={16} color={Palette.forestGreen} />
              </View>
              <View style={styles.textosItem}>
                <Text style={styles.etiquetaItem}>Ubicación del Hallazgo:</Text>
                <Text style={styles.valorItemPrincipal}>
                  {alertaActiva.parcelaNombre || 'Parcela'}
                  {alertaActiva.sectorNombre ? ` > ${alertaActiva.sectorNombre}` : ''}
                  {alertaActiva.cultivoNombre ? ` (${alertaActiva.cultivoNombre})` : ''}
                </Text>
                <Text style={styles.valorItemCoordenadas}>
                  GPS: {Number(alertaActiva.latitud).toFixed(6)}°, {Number(alertaActiva.longitud).toFixed(6)}°
                </Text>
              </View>
            </View>

            {/* Resumen Fitosanitario: Salud y Plagas */}
            <View style={styles.cajaHallazgoFitosanitario}>
              <View style={styles.filaSaludPlaga}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Bug size={16} color="#DC2626" />
                  <Text style={styles.textoTotalPlagas}>
                    {alertaActiva.totalPlagasDetectadas === 0
                      ? 'Riesgo foliar severo'
                      : `${alertaActiva.totalPlagasDetectadas} plaga(s) detectada(s)`}
                  </Text>
                </View>
                <Text style={styles.textoSaludPorcentaje}>
                  Salud: {alertaActiva.saludPorcentaje}%
                </Text>
              </View>

              {/* Chips de Detecciones */}
              {Array.isArray(alertaActiva.detecciones) && alertaActiva.detecciones.length > 0 && (
                <View style={styles.listaChipsDeteccion}>
                  {alertaActiva.detecciones.map((det, idx) => (
                    <View key={`notif-det-${idx}`} style={styles.chipDeteccion}>
                      <Text style={styles.textoChipDeteccion}>
                        {det.clase ? String(det.clase).replace(/_/g, ' ') : 'Anomalía'}
                        {det.confianza ? ` (${Math.round(det.confianza * 100)}%)` : ''}
                      </Text>
                    </View>
                  ))}
                </View>
              )}

              {/* Primera recomendación */}
              {Array.isArray(alertaActiva.recomendaciones) && alertaActiva.recomendaciones.length > 0 && (
                <Text style={styles.textoRecomendacionAlerta} numberOfLines={2}>
                  💡 {alertaActiva.recomendaciones[0]}
                </Text>
              )}
            </View>
          </View>

          {/* Botones de Acción */}
          <View style={styles.pieAcciones}>
            <Pressable
              onPress={() => abrirGoogleMaps(Number(alertaActiva.latitud), Number(alertaActiva.longitud))}
              style={({ pressed }) => [styles.botonMaps, pressed && styles.presionado]}
            >
              <ExternalLink size={15} color="#0284C7" />
              <Text style={styles.textoBotonMaps}>Ver en Google Maps</Text>
            </Pressable>

            <View style={styles.filaBotonesPrincipales}>
              <Boton
                titulo="Cerrar / Entendido"
                variante="secundario"
                onPress={() => setAlertaActiva(null)}
              />
              <Boton
                titulo="Ir a Diagnósticos"
                variante="primario"
                iconoIzquierda={<ScanLine size={16} color="#FFFFFF" />}
                onPress={() => {
                  setAlertaActiva(null);
                  router.push('/diagnostico' as Href);
                }}
              />
            </View>
          </View>
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
    zIndex: 999999,
  },
  tarjetaModal: {
    width: '100%',
    maxWidth: 540,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#F87171',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 25,
    overflow: 'hidden',
  },
  cabeceraAlerta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FEF2F2',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#FEE2E2',
  },
  filaTituloAlerta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  iconoAlertaWrapper: {
    width: 42,
    height: 42,
    borderRadius: 10,
    backgroundColor: '#FEE2E2',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  tituloAlerta: {
    fontSize: 15,
    fontWeight: '800',
    color: '#991B1B',
    letterSpacing: 0.3,
  },
  subtituloAlerta: {
    fontSize: 12,
    color: '#7F1D1D',
    marginTop: 2,
  },
  botonCerrar: {
    padding: 6,
    borderRadius: 8,
  },
  cuerpoDetalles: {
    padding: 20,
    gap: 14,
  },
  filaInfoPrincipal: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
  },
  cajaCodigo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  textoCodigo: {
    fontSize: 12,
    fontWeight: '800',
    color: '#991B1B',
    fontFamily: 'monospace',
  },
  itemDetalle: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  iconoItem: {
    width: 28,
    height: 28,
    borderRadius: 6,
    backgroundColor: '#EBF2E5',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  textosItem: {
    flex: 1,
    gap: 1,
  },
  etiquetaItem: {
    fontSize: 11.5,
    color: '#64748B',
    fontWeight: '600',
  },
  valorItem: {
    fontSize: 13,
    color: '#1E293B',
    fontWeight: '500',
  },
  valorItemPrincipal: {
    fontSize: 14,
    color: '#0F172A',
    fontWeight: '700',
  },
  valorItemCoordenadas: {
    fontSize: 11.5,
    color: '#0284C7',
    fontFamily: 'monospace',
    marginTop: 2,
  },
  cajaHallazgoFitosanitario: {
    backgroundColor: '#FFF1F2',
    borderWidth: 1,
    borderColor: '#FECDD3',
    borderRadius: 10,
    padding: 12,
    gap: 8,
    marginTop: 4,
  },
  filaSaludPlaga: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  textoTotalPlagas: {
    fontSize: 13,
    fontWeight: '700',
    color: '#9F1239',
  },
  textoSaludPorcentaje: {
    fontSize: 12,
    fontWeight: '700',
    color: '#E11D48',
  },
  listaChipsDeteccion: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  chipDeteccion: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#FDA4AF',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  textoChipDeteccion: {
    fontSize: 11,
    fontWeight: '700',
    color: '#BE123C',
  },
  textoRecomendacionAlerta: {
    fontSize: 11.5,
    color: '#881337',
    fontStyle: 'italic',
    lineHeight: 16,
  },
  pieAcciones: {
    paddingHorizontal: 20,
    paddingBottom: 20,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    paddingTop: 16,
  },
  botonMaps: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#E0F2FE',
    borderWidth: 1,
    borderColor: '#BAE6FD',
    paddingVertical: 8,
    borderRadius: 8,
  },
  textoBotonMaps: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#0369A1',
  },
  filaBotonesPrincipales: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 10,
    flexWrap: 'wrap',
  },
  presionado: {
    opacity: 0.8,
  },
});
