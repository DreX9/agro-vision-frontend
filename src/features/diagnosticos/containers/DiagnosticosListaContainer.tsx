import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  useWindowDimensions,
  Pressable,
} from 'react-native';
import { useRouter, type Href } from 'expo-router';
import {
  ScanLine,
  ShieldCheck,
  AlertTriangle,
  FileSpreadsheet,
  Filter,
  MapPin,
  RefreshCw,
} from 'lucide-react-native';
import { Palette } from '@/constants/theme';
import { AppLayout } from '@/shared/components/layout/app-layout';
import { Card } from '@/shared/components/ui/card';
import { Boton } from '@/shared/components/ui/boton';
import { useParcelasQuery } from '@/features/parcelas/api/parcelas.api';
import { useDiagnosticosQuery } from '../api/diagnostico.api';
import { HistorialDiagnosticosCampo } from '../components/HistorialDiagnosticosCampo';

/**
 * @description Pantalla dedicada a la lista completa de hallazgos y diagnósticos fitosanitarios
 * con filtros avanzados por parcela, condición de alerta y acceso rápido al escáner de campo.
 */
export function DiagnosticosListaContainer() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const esEscritorio = width >= 980;

  const [parcelaSeleccionada, setParcelaSeleccionada] = useState<string | undefined>(undefined);

  // Consulta de parcelas disponibles para el filtro
  const { data: datosParcelas } = useParcelasQuery({ limite: 50 });
  const parcelas = datosParcelas?.items || [];

  // Consulta para obtener métricas generales de las detecciones
  const {
    data: conteoGeneral,
    isLoading: cargandoMetricas,
    refetch,
    isFetching,
  } = useDiagnosticosQuery({
    parcelaId: parcelaSeleccionada,
    limite: 100,
  });

  const items = conteoGeneral?.items || [];
  const totalDetecciones = conteoGeneral?.total ?? items.length;
  const totalAlertas = items.filter((d) => d.esAlerta).length;
  const totalNormales = items.filter((d) => !d.esAlerta).length;

  return (
    <AppLayout
      titulo="Lista de Detecciones"
      subtitulo="Historial completo de alertas fitosanitarias y reportes de salud vegetal"
    >
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[
          styles.scrollContenedor,
          esEscritorio && styles.scrollEscritorio,
        ]}
      >
        <View style={[styles.areaTrabajo, esEscritorio && styles.areaTrabajoEscritorio]}>
          {/* Barra Superior de Acciones y Filtros */}
          <View style={styles.barraAcciones}>
            <View style={styles.textosModulo}>
              <View style={styles.badgeModulo}>
                <FileSpreadsheet size={13} color="#2E7D32" />
                <Text style={styles.textoBadgeModulo}>Módulo Fitosanitario</Text>
              </View>
              <Text style={styles.tituloModulo}>Historial de Detecciones</Text>
              <Text style={styles.subtituloModulo}>
                Consulta, filtra y revisa la georreferenciación de cada alerta registrada en campo.
              </Text>
            </View>

            <View style={styles.botonesAccion}>
              <Boton
                titulo="Refrescar"
                variante="secundario"
                iconoIzquierda={<RefreshCw size={14} color="#374151" />}
                cargando={isFetching}
                onPress={() => refetch()}
              />
              <Boton
                titulo="Abrir Escáner IA"
                variante="primario"
                iconoIzquierda={<ScanLine size={16} color="#FFFFFF" />}
                onPress={() => router.push('/diagnosticos/escaner' as Href)}
              />
            </View>
          </View>

          {/* Tarjetas de Métricas Estadísticas */}
          <View style={styles.gridMetricas}>
            <Card estilo={styles.tarjetaMetrica}>
              <View style={styles.filaMetrica}>
                <View style={[styles.iconoMetrica, styles.iconoMetricaTotal]}>
                  <FileSpreadsheet size={18} color="#1E293B" />
                </View>
                <View>
                  <Text style={styles.valorMetrica}>{totalDetecciones}</Text>
                  <Text style={styles.etiquetaMetrica}>Total Reportes</Text>
                </View>
              </View>
            </Card>

            <Card style={[styles.tarjetaMetrica, styles.tarjetaMetricaAlerta]}>
              <View style={styles.filaMetrica}>
                <View style={[styles.iconoMetrica, styles.iconoMetricaAlerta]}>
                  <AlertTriangle size={18} color="#DC2626" />
                </View>
                <View>
                  <Text style={[styles.valorMetrica, { color: '#DC2626' }]}>
                    {totalAlertas}
                  </Text>
                  <Text style={styles.etiquetaMetrica}>Alertas Fitosanitarias</Text>
                </View>
              </View>
            </Card>

            <Card style={[styles.tarjetaMetrica, styles.tarjetaMetricaNormal]}>
              <View style={styles.filaMetrica}>
                <View style={[styles.iconoMetrica, styles.iconoMetricaNormal]}>
                  <ShieldCheck size={18} color="#059669" />
                </View>
                <View>
                  <Text style={[styles.valorMetrica, { color: '#059669' }]}>
                    {totalNormales}
                  </Text>
                  <Text style={styles.etiquetaMetrica}>Condición Normal</Text>
                </View>
              </View>
            </Card>
          </View>

          {/* Filtro Rápido por Parcela */}
          {parcelas.length > 0 && (
            <Card estilo={styles.tarjetaFiltroParcela}>
              <View style={styles.filaFiltroEncabezado}>
                <MapPin size={15} color={Palette.forestGreen} />
                <Text style={styles.tituloFiltroParcela}>Filtrar por Parcela:</Text>
              </View>

              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.listaChipsParcelas}
              >
                <Pressable
                  onPress={() => setParcelaSeleccionada(undefined)}
                  style={[
                    styles.chipParcela,
                    parcelaSeleccionada === undefined && styles.chipParcelaActivo,
                  ]}
                >
                  <Text
                    style={[
                      styles.textoChipParcela,
                      parcelaSeleccionada === undefined && styles.textoChipParcelaActivo,
                    ]}
                  >
                    Todas ({parcelas.length})
                  </Text>
                </Pressable>

                {parcelas.map((p) => {
                  const seleccionada = parcelaSeleccionada === p.id;
                  return (
                    <Pressable
                      key={p.id}
                      onPress={() => setParcelaSeleccionada(p.id)}
                      style={[
                        styles.chipParcela,
                        seleccionada && styles.chipParcelaActivo,
                      ]}
                    >
                      <Text
                        style={[
                          styles.textoChipParcela,
                          seleccionada && styles.textoChipParcelaActivo,
                        ]}
                      >
                        {p.nombre}
                      </Text>
                    </Pressable>
                  );
                })}
              </ScrollView>
            </Card>
          )}

          {/* Listado Completo de Hallazgos con Filtros y Detalles */}
          <HistorialDiagnosticosCampo
            parcelaId={parcelaSeleccionada}
            limite={50}
            modoCompacto={false}
          />
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
    gap: 16,
  },
  areaTrabajoEscritorio: {
    maxWidth: 1400,
  },
  barraAcciones: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 14,
  },
  textosModulo: {
    flex: 1,
    minWidth: 260,
    gap: 4,
  },
  badgeModulo: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#C8E6C9',
  },
  textoBadgeModulo: {
    fontSize: 11,
    fontWeight: '700',
    color: '#2E7D32',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  tituloModulo: {
    fontSize: 22,
    fontWeight: '800',
    color: '#111827',
  },
  subtituloModulo: {
    fontSize: 13,
    color: '#6B7280',
    lineHeight: 18,
  },
  botonesAccion: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flexWrap: 'wrap',
  },
  gridMetricas: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  tarjetaMetrica: {
    flex: 1,
    minWidth: 160,
    padding: 14,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  tarjetaMetricaAlerta: {
    borderLeftWidth: 4,
    borderLeftColor: '#DC2626',
  },
  tarjetaMetricaNormal: {
    borderLeftWidth: 4,
    borderLeftColor: '#059669',
  },
  filaMetrica: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconoMetrica: {
    width: 38,
    height: 38,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconoMetricaTotal: {
    backgroundColor: '#F1F5F9',
  },
  iconoMetricaAlerta: {
    backgroundColor: '#FEE2E2',
  },
  iconoMetricaNormal: {
    backgroundColor: '#DCFCE7',
  },
  valorMetrica: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0F172A',
  },
  etiquetaMetrica: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '600',
  },
  tarjetaFiltroParcela: {
    padding: 12,
    gap: 10,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  filaFiltroEncabezado: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  tituloFiltroParcela: {
    fontSize: 12,
    fontWeight: '700',
    color: '#334155',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  listaChipsParcelas: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 2,
  },
  chipParcela: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  chipParcelaActivo: {
    backgroundColor: Palette.forestGreen,
    borderColor: Palette.forestGreen,
  },
  textoChipParcela: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475569',
  },
  textoChipParcelaActivo: {
    color: '#FFFFFF',
  },
});
