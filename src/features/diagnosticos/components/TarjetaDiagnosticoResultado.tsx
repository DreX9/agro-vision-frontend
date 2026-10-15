import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import {
  ShieldCheck,
  AlertTriangle,
  AlertOctagon,
  HelpCircle,
  Clock,
  Sparkles,
  Leaf,
} from 'lucide-react-native';
import { Palette } from '@/constants/theme';
import { Card } from '@/shared/components/ui/card';
import { Badge, VarianteBadge } from '@/shared/components/ui/badge';
import { DiagnosticoRespuesta } from '../types/diagnostico.types';

export interface TarjetaDiagnosticoResultadoProps {
  resultado: DiagnosticoRespuesta | null;
}

/**
 * @description Presenta el informe fitosanitario estructurado con estado, métricas y recomendaciones agronómicas.
 */
export const TarjetaDiagnosticoResultado: React.FC<TarjetaDiagnosticoResultadoProps> = ({
  resultado,
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

  return (
    <Card estilo={styles.contenedor}>
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
});

