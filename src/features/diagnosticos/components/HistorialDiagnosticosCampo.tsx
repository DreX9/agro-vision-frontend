import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
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
  Filter,
  ArrowRight,
  Sparkles,
} from 'lucide-react-native';
import { Palette } from '@/constants/theme';
import { Card } from '@/shared/components/ui/card';
import { Badge, VarianteBadge } from '@/shared/components/ui/badge';
import { useDiagnosticosQuery } from '../api/diagnostico.api';
import { EstadoSaludFoliar } from '../types/diagnostico.types';
import { abrirGoogleMaps } from '../utils/geolocalizacion';

export interface HistorialDiagnosticosCampoProps {
  parcelaId?: string;
  limite?: number;
  modoCompacto?: boolean;
  onVerTodos?: () => void;
}

type FiltroAlertaTipo = 'TODOS' | 'ALERTAS' | 'NORMALES';

export const HistorialDiagnosticosCampo: React.FC<HistorialDiagnosticosCampoProps> = ({
  parcelaId,
  limite = 20,
  modoCompacto = false,
  onVerTodos,
}) => {
  const [filtroAlerta, setFiltroAlerta] = useState<FiltroAlertaTipo>('TODOS');

  // En modo compacto traemos las últimas detecciones directas; en modo completo permitimos filtrar
  const esAlertaParam = modoCompacto
    ? undefined
    : filtroAlerta === 'ALERTAS'
      ? true
      : filtroAlerta === 'NORMALES'
        ? false
        : undefined;

  const { data: respuestaDiagnosticos, isLoading } = useDiagnosticosQuery({
    parcelaId: parcelaId || undefined,
    esAlerta: esAlertaParam,
    limite: modoCompacto ? Math.min(limite, 3) : limite,
  });

  // Consulta general sin filtro de alerta para obtener conteos globales de la parcela
  const { data: conteoGeneral } = useDiagnosticosQuery({
    parcelaId: parcelaId || undefined,
    limite: 100,
  });

  const todosItems = conteoGeneral?.items || [];
  const totalGlobal = conteoGeneral?.total ?? todosItems.length;
  const totalAlertas = todosItems.filter((d) => d.esAlerta).length;
  const totalNormales = todosItems.filter((d) => !d.esAlerta).length;

  const diagnosticos = (respuestaDiagnosticos?.items || []).slice(0, modoCompacto ? Math.min(limite, 3) : limite);

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
      {/* Encabezado Principal */}
      <View style={styles.filaEncabezado}>
        <View style={styles.iconoEncabezado}>
          {modoCompacto ? (
            <Sparkles size={18} color={Palette.forestGreen} />
          ) : (
            <History size={18} color={Palette.forestGreen} />
          )}
        </View>
        <View style={styles.textosEncabezado}>
          <Text style={styles.titulo}>
            {modoCompacto
              ? `Últimas Detecciones en Campo (${diagnosticos.length})`
              : 'Historial de Diagnósticos en Campo'}
          </Text>
          <Text style={styles.subtitulo}>
            {modoCompacto
              ? 'Mostrando los últimos 2 a 3 registros evaluados por la IA en este sector.'
              : 'Hallazgos fitosanitarios georreferenciados clasificados según condición de alerta.'}
          </Text>
        </View>

        {modoCompacto && onVerTodos && (
          <Pressable
            onPress={onVerTodos}
            style={({ pressed }) => [styles.botonCabeceraVerTodos, pressed && styles.presionado]}
          >
            <Text style={styles.textoBotonCabecera}>Ver historial</Text>
            <ArrowRight size={13} color={Palette.forestGreen} />
          </Pressable>
        )}
      </View>

      {/* Barra de Filtros: Solo en modo completo */}
      {!modoCompacto && (
        <View style={styles.barraFiltros}>
          <View style={styles.etiquetaFiltro}>
            <Filter size={13} color="#64748B" />
            <Text style={styles.textoEtiquetaFiltro}>Filtrar por:</Text>
          </View>

          <Pressable
            onPress={() => setFiltroAlerta('TODOS')}
            style={[
              styles.tabFiltro,
              filtroAlerta === 'TODOS' && styles.tabFiltroActivo,
            ]}
          >
            <Text
              style={[
                styles.textoTabFiltro,
                filtroAlerta === 'TODOS' && styles.textoTabFiltroActivo,
              ]}
            >
              Todos ({totalGlobal})
            </Text>
          </Pressable>

          <Pressable
            onPress={() => setFiltroAlerta('ALERTAS')}
            style={[
              styles.tabFiltro,
              styles.tabFiltroAlerta,
              filtroAlerta === 'ALERTAS' && styles.tabFiltroAlertaActivo,
            ]}
          >
            <AlertTriangle
              size={12}
              color={filtroAlerta === 'ALERTAS' ? '#FFFFFF' : '#DC2626'}
            />
            <Text
              style={[
                styles.textoTabFiltro,
                styles.textoTabAlerta,
                filtroAlerta === 'ALERTAS' && styles.textoTabFiltroActivo,
              ]}
            >
              Alertas ({totalAlertas})
            </Text>
          </Pressable>

          <Pressable
            onPress={() => setFiltroAlerta('NORMALES')}
            style={[
              styles.tabFiltro,
              styles.tabFiltroNormal,
              filtroAlerta === 'NORMALES' && styles.tabFiltroNormalActivo,
            ]}
          >
            <ShieldCheck
              size={12}
              color={filtroAlerta === 'NORMALES' ? '#FFFFFF' : '#059669'}
            />
            <Text
              style={[
                styles.textoTabFiltro,
                styles.textoTabNormal,
                filtroAlerta === 'NORMALES' && styles.textoTabFiltroActivo,
              ]}
            >
              Normales ({totalNormales})
            </Text>
          </Pressable>
        </View>
      )}

      {/* Contenido de la Lista */}
      {isLoading ? (
        <Text style={styles.textoCargando}>Consultando registros en base de datos...</Text>
      ) : diagnosticos.length === 0 ? (
        <View style={styles.cajaVacia}>
          <Text style={styles.textoVacio}>
            {filtroAlerta === 'ALERTAS'
              ? 'No se encontraron alertas fitosanitarias registradas para este filtro.'
              : filtroAlerta === 'NORMALES'
                ? 'No se encontraron registros normales para este filtro.'
                : 'No hay diagnósticos registrados para el área seleccionada.'}
          </Text>
        </View>
      ) : (
        <View style={styles.lista}>
          {diagnosticos.map((item) => {
            const config = obtenerConfigEstado(item.estadoGeneral);
            return (
              <View
                key={item.id}
                style={[
                  styles.tarjetaItem,
                  item.esAlerta ? styles.tarjetaItemAlerta : styles.tarjetaItemNormal,
                ]}
              >
                {/* Cabecera del Item con Código y Clasificación */}
                <View style={styles.cabeceraItem}>
                  <View style={styles.filaCodigo}>
                    <Text style={styles.codigoItem}>{item.codigo}</Text>

                    {/* Badge de Alerta vs Normal */}
                    {item.esAlerta ? (
                      <Badge
                        texto="ALERTA FITOSANITARIA"
                        variante="peligro"
                        icono={<AlertTriangle size={12} color="#DC2626" />}
                      />
                    ) : (
                      <Badge
                        texto="CONDICIÓN NORMAL"
                        variante="exito"
                        icono={<ShieldCheck size={12} color="#059669" />}
                      />
                    )}

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

                {/* Cuerpo del Item con Ubicación, GPS y Métricas */}
                <View style={styles.cuerpoItem}>
                  <View style={styles.columnaDetalle}>
                    <View style={styles.filaIconoTexto}>
                      <MapPin size={14} color={Palette.forestGreen} />
                      <Text style={styles.textoUbicacion}>
                        {item.parcelaNombre || 'Parcela'}
                        {item.sectorNombre ? ` > ${item.sectorNombre}` : ''}
                        {item.cultivoNombre ? ` (${item.cultivoNombre})` : ''}
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
                      <Text
                        style={[
                          styles.textoPlagas,
                          item.totalPlagasDetectadas > 0 && { color: '#DC2626', fontWeight: '700' },
                        ]}
                      >
                        {item.totalPlagasDetectadas === 0
                          ? 'Sin plagas'
                          : `${item.totalPlagasDetectadas} plaga(s) detectada(s)`}
                      </Text>
                    </View>
                  </View>
                </View>

                {/* Detecciones específicas si existen */}
                {Array.isArray(item.detecciones) && item.detecciones.length > 0 && (
                  <View style={styles.filaDeteccionesChips}>
                    {item.detecciones.map((det: any, idx: number) => (
                      <View key={`hist-det-${idx}`} style={styles.chipDeteccionHistorial}>
                        <Text style={styles.textoChipDeteccionHistorial}>
                          {det.clase ? String(det.clase).replace(/_/g, ' ') : 'Detección'}
                          {det.confianza ? ` (${Math.round(det.confianza * 100)}%)` : ''}
                        </Text>
                      </View>
                    ))}
                  </View>
                )}
              </View>
            );
          })}
        </View>
      )}

      {/* Botón inferior para ver todos los registros en modo compacto */}
      {modoCompacto && onVerTodos && totalGlobal > 0 && (
        <Pressable
          onPress={onVerTodos}
          style={({ pressed }) => [styles.botonVerMas, pressed && styles.presionado]}
        >
          <Text style={styles.textoBotonVerMas}>
            Ver lista completa de detecciones ({totalGlobal} en total)
          </Text>
          <ArrowRight size={15} color={Palette.forestGreen} />
        </Pressable>
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
  barraFiltros: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
    paddingVertical: 4,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    paddingBottom: 10,
  },
  etiquetaFiltro: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginRight: 4,
  },
  textoEtiquetaFiltro: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
  },
  tabFiltro: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 6,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  tabFiltroActivo: {
    backgroundColor: Palette.forestGreen,
    borderColor: Palette.forestGreen,
  },
  tabFiltroAlerta: {
    backgroundColor: '#FEF2F2',
    borderColor: '#FECACA',
  },
  tabFiltroAlertaActivo: {
    backgroundColor: '#DC2626',
    borderColor: '#DC2626',
  },
  tabFiltroNormal: {
    backgroundColor: '#F0FDF4',
    borderColor: '#BBF7D0',
  },
  tabFiltroNormalActivo: {
    backgroundColor: '#059669',
    borderColor: '#059669',
  },
  textoTabFiltro: {
    fontSize: 11.5,
    fontWeight: '600',
    color: '#475569',
  },
  textoTabFiltroActivo: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  textoTabAlerta: {
    color: '#DC2626',
  },
  textoTabNormal: {
    color: '#059669',
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
  tarjetaItemAlerta: {
    backgroundColor: '#FFFBFB',
    borderColor: '#FCA5A5',
    borderLeftWidth: 4,
    borderLeftColor: '#DC2626',
  },
  tarjetaItemNormal: {
    backgroundColor: '#F8FAFC',
    borderColor: '#E2E8F0',
    borderLeftWidth: 4,
    borderLeftColor: '#059669',
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
    flexWrap: 'wrap',
    gap: 6,
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
  filaDeteccionesChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    paddingTop: 4,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  chipDeteccionHistorial: {
    backgroundColor: '#FEE2E2',
    paddingVertical: 2,
    paddingHorizontal: 8,
    borderRadius: 4,
  },
  textoChipDeteccionHistorial: {
    fontSize: 10.5,
    fontWeight: '600',
    color: '#991B1B',
  },
  botonCabeceraVerTodos: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 5,
    paddingHorizontal: 10,
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#BBF7D0',
    borderRadius: 6,
  },
  textoBotonCabecera: {
    fontSize: 12,
    fontWeight: '700',
    color: Palette.forestGreen,
  },
  botonVerMas: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 10,
    paddingHorizontal: 16,
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#BBF7D0',
    borderRadius: 8,
    marginTop: 6,
  },
  textoBotonVerMas: {
    fontSize: 13,
    fontWeight: '700',
    color: Palette.forestGreen,
  },
});
