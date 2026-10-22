import React from 'react';
import { View, Text, StyleSheet, FlatList, Pressable } from 'react-native';
import {
  History,
  MapPin,
  Calendar,
  AlertTriangle,
  ShieldCheck,
  AlertOctagon,
  HelpCircle,
  Bug,
  ExternalLink,
} from 'lucide-react-native';
import { Palette } from '@/constants/theme';
import { Card } from '@/shared/components/ui/card';
import { Badge, VarianteBadge } from '@/shared/components/ui/badge';
import { useDiagnosticosQuery } from '../api/diagnostico.api';
import { DiagnosticoCampoItem, EstadoSaludFoliar } from '../types/diagnostico.types';
import { abrirGoogleMaps } from '../utils/geolocalizacion';

export interface HistorialDiagnosticosCampoProps {
  parcelaId?: string;
}

export const HistorialDiagnosticosCampo: React.FC<HistorialDiagnosticosCampoProps> = ({
  parcelaId,
}) => {
  const { data: respuestaDiagnosticos, isLoading } = useDiagnosticosQuery({
    parcelaId: parcelaId || undefined,
    limite: 10,
  });

  const diagnosticos = respuestaDiagnosticos?.items || [];

  const obtenerConfigEstado = (
    estado: EstadoSaludFoliar,
  ): { variante: VarianteBadge; icono: React.ReactNode } => {
    switch (estado) {
      case 'CRITICO':
        return {
          variante: 'peligro',
          icono: <AlertOctagon size={14} color="#DC2626" />,
        };
      case 'ALERTA':
        return {
          variante: 'alerta',
          icono: <AlertTriangle size={14} color="#D97706" />,
        };
      case 'SIN_DETECCION':
        return {
          variante: 'neutro',
          icono: <HelpCircle size={14} color="#64748B" />,
        };
      case 'OPTIMO':
      default:
        return {
          variante: 'exito',
          icono: <ShieldCheck size={14} color="#059669" />,
        };
    }
  };

  const formatearFecha = (iso: string) => {
    try {
      const d = new Date(iso);
      return `${d.toLocaleDateString('es-PE')} ${d.toLocaleTimeString('es-PE', {
        hour: '2-digit',
        minute: '2-digit',
      })}`;
    } catch {
      return iso;
    }
  };

  return (
    <Card estilo={styles.contenedor}>
      <View style={styles.filaEncabezado}>
        <View style={styles.iconoEncabezado}>
          <History size={18} color={Palette.forestGreen} />
        </View>
        <View style={styles.textosEncabezado}>
          <Text style={styles.titulo}>Historial de Diagnósticos en Campo</Text>
          <Text style={styles.subtitulo}>
            Registro de telemetría y hallazgos fitosanitarios persistidos en base de datos.
          </Text>
        </View>
      </View>

      {isLoading ? (
        <Text style={styles.textoCargando}>Consultando registros...</Text>
      ) : diagnosticos.length === 0 ? (
        <View style={styles.cajaVacia}>
          <Text style={styles.textoVacio}>
            No hay diagnósticos registrados para el área seleccionada.
          </Text>
        </View>
      ) : (
        <View style={styles.lista}>
          {diagnosticos.map((item) => {
            const config = obtenerConfigEstado(item.estadoGeneral);
            return (
              <View key={item.id} style={styles.tarjetaItem}>
                <View style={styles.cabeceraItem}>
                  <View style={styles.filaCodigo}>
                    <Text style={styles.codigoItem}>{item.codigo}</Text>
                    <Badge
                      texto={item.estadoGeneral}
                      variante={config.variante}
                      icono={config.icono}
                    />
                  </View>
                  <View style={styles.filaFecha}>
                    <Calendar size={13} color="#64748B" />
                    <Text style={styles.textoFecha}>{formatearFecha(item.createdAt)}</Text>
                  </View>
                </View>

                <View style={styles.cuerpoItem}>
                  <View style={styles.columnaDetalle}>
                    <View style={styles.filaIconoTexto}>
                      <MapPin size={14} color={Palette.forestGreen} />
                      <Text style={styles.textoUbicacion}>
                        {item.parcelaNombre}
                        {item.sectorNombre ? ` > ${item.sectorNombre}` : ''}
                      </Text>
                    </View>
                    <View style={styles.filaCoordenadasHistorial}>
                      <Text style={styles.textoCoordenadas}>
                        GPS: {Number(item.latitud).toFixed(6)}°, {Number(item.longitud).toFixed(6)}°
                      </Text>
                      <Pressable
                        onPress={() => abrirGoogleMaps(Number(item.latitud), Number(item.longitud))}
                        style={({ pressed }) => [styles.botonMapsItem, pressed && styles.presionado]}
                      >
                        <ExternalLink size={11} color="#0284C7" />
                        <Text style={styles.textoBotonMapsItem}>Ver en Maps</Text>
                      </Pressable>
                    </View>
                  </View>

                  <View style={styles.columnaMetricas}>
                    <Text style={styles.etiquetaMetrica}>Salud: {item.saludPorcentaje}%</Text>
                    <View style={styles.filaPlagas}>
                      <Bug size={14} color={item.totalPlagasDetectadas > 0 ? '#DC2626' : '#059669'} />
                      <Text style={styles.textoPlagas}>
                        {item.totalPlagasDetectadas === 0
                          ? 'Sin plagas'
                          : `${item.totalPlagasDetectadas} plaga(s)`}
                      </Text>
                    </View>
                  </View>
                </View>
              </View>
            );
          })}
        </View>
      )}
    </Card>
  );
};

const styles = StyleSheet.create({
  contenedor: {
    padding: 18,
    gap: 14,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  filaEncabezado: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  iconoEncabezado: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#DCFCE7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  textosEncabezado: {
    flex: 1,
  },
  titulo: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
  },
  subtitulo: {
    fontSize: 12,
    color: '#64748B',
  },
  textoCargando: {
    fontSize: 13,
    color: '#64748B',
    fontStyle: 'italic',
    paddingVertical: 10,
  },
  cajaVacia: {
    padding: 18,
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
  },
  textoVacio: {
    fontSize: 13,
    color: '#64748B',
    fontStyle: 'italic',
  },
  lista: {
    gap: 10,
  },
  tarjetaItem: {
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 8,
  },
  cabeceraItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
  },
  filaCodigo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  codigoItem: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
    fontFamily: 'monospace',
  },
  filaFecha: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  textoFecha: {
    fontSize: 11,
    color: '#64748B',
  },
  cuerpoItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    flexWrap: 'wrap',
    gap: 10,
  },
  columnaDetalle: {
    gap: 2,
    flex: 1,
    minWidth: 200,
  },
  filaIconoTexto: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  textoUbicacion: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1E293B',
  },
  filaCoordenadasHistorial: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginLeft: 20,
    flexWrap: 'wrap',
  },
  textoCoordenadas: {
    fontSize: 11,
    color: '#0284C7',
    fontFamily: 'monospace',
  },
  botonMapsItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#E0F2FE',
    borderWidth: 1,
    borderColor: '#BAE6FD',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  textoBotonMapsItem: {
    fontSize: 10,
    fontWeight: '700',
    color: '#0284C7',
  },
  presionado: {
    opacity: 0.8,
  },
  columnaMetricas: {
    alignItems: 'flex-end',
    gap: 2,
  },
  etiquetaMetrica: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0F172A',
  },
  filaPlagas: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  textoPlagas: {
    fontSize: 11,
    fontWeight: '600',
    color: '#475569',
  },
});
