import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  useWindowDimensions,
} from 'react-native';
import Svg, { Path, Circle, Rect, Polygon, Line } from 'react-native-svg';
import { Colors, Radius, Spacing, Fonts } from '@/constants/theme';
import StatCard from '@/components/StatCard';
import Badge from '@/components/Badge';
import TemperatureChart from '@/components/TemperatureChart';
import {
  parcelas,
  alertas,
  incidencias,
  actividades,
  registrosClima,
} from '@/data/mockData';

interface DashboardProps {
  onNavigate?: (view: string) => void;
}

export default function Dashboard({ onNavigate }: DashboardProps) {
  const { width } = useWindowDimensions();
  const isDesktop = width >= 1100;
  const isTablet = width >= 720;

  const parcelasActivas = parcelas.filter(p => p.estado === 'Activa').length;
  const parcelasMonitoreadas = parcelas.filter(p => p.ultimaInspeccion !== '—').length;
  const incidenciasActivas = incidencias.filter(
    i => !['Resuelta', 'Cerrada'].includes(i.estado)
  );
  const incidenciasCriticas = incidenciasActivas.filter(i => i.nivelPrioridad === 'Crítica');
  const actividadesPendientes = actividades.filter(a => a.estado === 'Pendiente');
  const alertasPendientes = alertas.filter(
    a => a.estado === 'Pendiente' || a.estado === 'En revisión'
  );

  const hoyClima = registrosClima[registrosClima.length - 1];

  const estadosCultivos = {
    Normal: parcelas.filter(p => p.estadoCultivo === 'Normal').length,
    'Requiere atención': parcelas.filter(p => p.estadoCultivo === 'Requiere atención').length,
    Crítico: parcelas.filter(p => p.estadoCultivo === 'Crítico').length,
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      showsVerticalScrollIndicator={false}
    >
      {/* Title Header */}
      <View style={styles.titleSection}>
        <Text style={styles.pageTitle}>Dashboard</Text>
        <Text style={styles.pageSubtitle}>Fundo Santa Elena — Cajamarca</Text>
      </View>

      {/* KPI Cards Grid */}
      <View
        style={[
          styles.kpiGrid,
          isDesktop ? styles.kpiGrid6 : isTablet ? styles.kpiGrid3 : styles.kpiGrid2,
        ]}
      >
        <View style={styles.kpiCol}>
          <StatCard
            dark
            label="Parcelas registradas"
            value={parcelas.length}
            sub={`${parcelasActivas} activas`}
            icon={
              <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
                <Path
                  d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"
                  stroke="#FFFFFF"
                  strokeWidth={2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </Svg>
            }
            trend={{ value: 8, label: 'vs año anterior' }}
          />
        </View>

        <View style={styles.kpiCol}>
          <StatCard
            label="Monitoreadas"
            value={parcelasMonitoreadas}
            sub="Con inspección reciente"
            iconColor="#3A9B6C"
            icon={
              <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
                <Circle cx={11} cy={11} r={8} stroke="#3A9B6C" strokeWidth={2} />
                <Path d="m21 21-4.35-4.35" stroke="#3A9B6C" strokeWidth={2} strokeLinecap="round" />
              </Svg>
            }
          />
        </View>

        <View style={styles.kpiCol}>
          <StatCard
            label="Incidencias activas"
            value={incidenciasActivas.length}
            sub={`${incidenciasCriticas.length} crítica`}
            iconColor="#B91C1C"
            icon={
              <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
                <Path
                  d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0zM12 9v4M12 17h.01"
                  stroke="#B91C1C"
                  strokeWidth={2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </Svg>
            }
          />
        </View>

        <View style={styles.kpiCol}>
          <StatCard
            label="Incidencias críticas"
            value={incidenciasCriticas.length}
            sub="Atención inmediata"
            iconColor="#B91C1C"
            icon={
              <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
                <Polygon
                  points="7.86 2 16.14 2 22 7.86 22 16.14 16.14 22 7.86 22 2 16.14 2 7.86 7.86 2"
                  stroke="#B91C1C"
                  strokeWidth={2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <Line x1={12} y1={8} x2={12} y2={12} stroke="#B91C1C" strokeWidth={2} strokeLinecap="round" />
                <Circle cx={12} cy={16} r={0.7} fill="#B91C1C" />
              </Svg>
            }
          />
        </View>

        <View style={styles.kpiCol}>
          <StatCard
            label="Act. pendientes"
            value={actividadesPendientes.length}
            sub="Por ejecutar"
            iconColor="#B45309"
            icon={
              <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
                <Rect x={5} y={2} width={14} height={20} rx={2} stroke="#B45309" strokeWidth={2} />
                <Path d="M9 7h6M9 11h6M9 15h4" stroke="#B45309" strokeWidth={2} strokeLinecap="round" />
              </Svg>
            }
          />
        </View>

        <View style={styles.kpiCol}>
          <StatCard
            label="Alertas sin atender"
            value={alertasPendientes.length}
            sub="Pendientes"
            iconColor="#1D4ED8"
            icon={
              <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
                <Path
                  d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 01-3.46 0"
                  stroke="#1D4ED8"
                  strokeWidth={2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </Svg>
            }
          />
        </View>
      </View>

      {/* Middle Row: Estado Cultivos & Temperatura Semanal */}
      <View style={[styles.middleRow, isTablet ? styles.middleRowHorizontal : styles.middleRowVertical]}>
        {/* Left Card: Estado de Cultivos */}
        <View style={[styles.card, styles.cultivosCard]}>
          <Text style={styles.cardTitle}>Estado de Cultivos</Text>
          <Text style={styles.cardSubtitle}>Actualizado por inspecciones</Text>

          <View style={styles.cultivosList}>
            {/* Normal */}
            <View style={[styles.cultivoItem, styles.cultivoItemNormal]}>
              <View style={styles.cultivoItemLeft}>
                <View style={[styles.dotCircle, { backgroundColor: '#15803D' }]} />
                <Text style={[styles.cultivoLabel, { color: '#15803D' }]}>Normal</Text>
              </View>
              <Text style={[styles.cultivoCount, { color: '#15803D' }]}>
                {estadosCultivos.Normal}
              </Text>
            </View>

            {/* Requiere atención */}
            <View style={[styles.cultivoItem, styles.cultivoItemWarning]}>
              <View style={styles.cultivoItemLeft}>
                <View style={[styles.dotCircle, { backgroundColor: '#B45309' }]} />
                <Text style={[styles.cultivoLabel, { color: '#B45309' }]}>
                  Requiere atención
                </Text>
              </View>
              <Text style={[styles.cultivoCount, { color: '#B45309' }]}>
                {estadosCultivos['Requiere atención']}
              </Text>
            </View>

            {/* Crítico */}
            <View style={[styles.cultivoItem, styles.cultivoItemDanger]}>
              <View style={styles.cultivoItemLeft}>
                <View style={[styles.dotCircle, { backgroundColor: '#B91C1C' }]} />
                <Text style={[styles.cultivoLabel, { color: '#B91C1C' }]}>Crítico</Text>
              </View>
              <Text style={[styles.cultivoCount, { color: '#B91C1C' }]}>
                {estadosCultivos.Crítico}
              </Text>
            </View>
          </View>
        </View>

        {/* Right Card: Temperatura Semanal */}
        <View style={[styles.card, styles.tempCard]}>
          <View style={styles.tempCardHeader}>
            <Text style={styles.cardTitle}>Temperatura Semanal</Text>
            <View style={styles.weatherBadge}>
              <Text style={styles.weatherIcon}>☀️</Text>
              <Text style={styles.weatherTemp}>{hoyClima?.tempMax}°C</Text>
              <Text style={styles.weatherLabel}>hoy</Text>
            </View>
          </View>

          <TemperatureChart />
        </View>
      </View>

      {/* Alertas Recientes */}
      <View style={styles.card}>
        <View style={styles.cardHeaderRow}>
          <Text style={styles.cardTitle}>Alertas Recientes</Text>
          <TouchableOpacity
            onPress={() => onNavigate && onNavigate('alertas')}
            activeOpacity={0.7}
          >
            <Text style={styles.linkText}>Ver todas →</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.alertsList}>
          {alertasPendientes.slice(0, 4).map((a) => {
            const isCriticalOrHigh = a.prioridad === 'Crítica' || a.prioridad === 'Alta';
            const isMedium = a.prioridad === 'Media';

            return (
              <View
                key={a.id}
                style={[
                  styles.alertItem,
                  isCriticalOrHigh
                    ? styles.alertItemRed
                    : isMedium
                    ? styles.alertItemAmber
                    : styles.alertItemDefault,
                ]}
              >
                <Text style={styles.alertIcon}>
                  {a.tipo === 'Fitosanitaria' ? '🌿' : a.tipo === 'Ambiental' ? '🌤️' : '⚙️'}
                </Text>

                <View style={styles.alertInfo}>
                  <Text style={styles.alertTitle} numberOfLines={1}>
                    {a.titulo}
                  </Text>
                  <Text style={styles.alertMeta}>
                    {a.parcelaCodigo} · {a.fecha}
                  </Text>
                </View>

                <Badge
                  variant={isCriticalOrHigh ? 'danger' : isMedium ? 'warning' : 'muted'}
                >
                  {a.prioridad}
                </Badge>
              </View>
            );
          })}
        </View>
      </View>

      {/* Actividades & Incidencias (Side by side on desktop) */}
      <View style={[styles.middleRow, isTablet ? styles.middleRowHorizontal : styles.middleRowVertical]}>
        {/* Actividades Recientes */}
        <View style={[styles.card, styles.flex1]}>
          <View style={styles.cardHeaderRow}>
            <Text style={styles.cardTitle}>Actividades Recientes</Text>
            <TouchableOpacity
              onPress={() => onNavigate && onNavigate('actividades')}
              activeOpacity={0.7}
            >
              <Text style={styles.linkText}>Ver todas →</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.listContainer}>
            {actividades.slice(0, 4).map((act) => (
              <View key={act.id} style={styles.activityRow}>
                <View style={styles.activityDot} />
                <View style={styles.activityContent}>
                  <View style={styles.activityTop}>
                    <Text style={styles.activityType}>{act.tipo}</Text>
                    <Badge
                      variant={
                        act.estado === 'Completada'
                          ? 'success'
                          : act.estado === 'En progreso'
                          ? 'info'
                          : 'warning'
                      }
                    >
                      {act.estado}
                    </Badge>
                  </View>
                  <Text style={styles.activityMeta}>
                    {act.parcelaCodigo} · {act.fecha} · {act.responsable}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* Incidencias Activas */}
        <View style={[styles.card, styles.flex1]}>
          <View style={styles.cardHeaderRow}>
            <Text style={styles.cardTitle}>Incidencias Activas</Text>
            <TouchableOpacity
              onPress={() => onNavigate && onNavigate('incidencias')}
              activeOpacity={0.7}
            >
              <Text style={styles.linkText}>Ver todas →</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.listContainer}>
            {incidenciasActivas.slice(0, 4).map((inc) => (
              <View key={inc.id} style={styles.activityRow}>
                <View
                  style={[
                    styles.activityDot,
                    {
                      backgroundColor:
                        inc.nivelPrioridad === 'Crítica'
                          ? '#EF4444'
                          : inc.nivelPrioridad === 'Alta'
                          ? '#F59E0B'
                          : '#3B82F6',
                    },
                  ]}
                />
                <View style={styles.activityContent}>
                  <View style={styles.activityTop}>
                    <Text style={styles.activityType}>{inc.codigo}</Text>
                    <Badge
                      variant={
                        inc.nivelPrioridad === 'Crítica'
                          ? 'danger'
                          : inc.nivelPrioridad === 'Alta'
                          ? 'warning'
                          : 'info'
                      }
                    >
                      {inc.nivelPrioridad}
                    </Badge>
                  </View>
                  <Text style={styles.activityMeta}>
                    {inc.parcelaCodigo} · {inc.tipo} · {inc.estado}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        </View>
      </View>

      {/* Resumen de Parcelas Table */}
      <View style={styles.card}>
        <View style={styles.cardHeaderRow}>
          <Text style={styles.cardTitle}>Resumen de Parcelas</Text>
          <TouchableOpacity
            onPress={() => onNavigate && onNavigate('parcelas')}
            activeOpacity={0.7}
          >
            <Text style={styles.linkText}>Ver mapa →</Text>
          </TouchableOpacity>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={styles.table}>
            {/* Table Header */}
            <View style={styles.tableHeaderRow}>
              <Text style={[styles.tableTh, { width: 90 }]}>CÓDIGO</Text>
              <Text style={[styles.tableTh, { width: 140 }]}>PARCELA</Text>
              <Text style={[styles.tableTh, { width: 110 }]}>CULTIVO</Text>
              <Text style={[styles.tableTh, { width: 80 }]}>ÁREA</Text>
              <Text style={[styles.tableTh, { width: 150 }]}>ESTADO CULTIVO</Text>
              <Text style={[styles.tableTh, { width: 110 }]}>ÚLTIMA INSP.</Text>
            </View>

            {/* Table Rows */}
            {parcelas.slice(0, 6).map((p) => (
              <View key={p.id} style={styles.tableRow}>
                <Text style={[styles.tableTdCode, { width: 90 }]}>{p.codigo}</Text>
                <Text style={[styles.tableTdBold, { width: 140 }]}>{p.nombre}</Text>
                <Text style={[styles.tableTdMuted, { width: 110 }]}>{p.cultivo}</Text>
                <Text style={[styles.tableTdMono, { width: 80 }]}>{p.area} ha</Text>
                <View style={{ width: 150 }}>
                  <Badge
                    variant={
                      p.estadoCultivo === 'Normal'
                        ? 'success'
                        : p.estadoCultivo === 'Crítico'
                        ? 'danger'
                        : 'warning'
                    }
                    dot
                  >
                    {p.estadoCultivo}
                  </Badge>
                </View>
                <Text style={[styles.tableTdMono, { width: 110 }]}>
                  {p.ultimaInspeccion}
                </Text>
              </View>
            ))}
          </View>
        </ScrollView>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F6F4',
  },
  contentContainer: {
    padding: Spacing.xl,
    gap: Spacing.xl,
    paddingBottom: Spacing.xxxl * 2,
  },
  titleSection: {
    marginBottom: Spacing.xs,
  },
  pageTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.text,
    fontFamily: Fonts?.display || 'System',
  },
  pageSubtitle: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: 2,
    fontFamily: Fonts?.sans || 'System',
  },
  kpiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -Spacing.xs,
  },
  kpiGrid6: {
    flexWrap: 'nowrap',
  },
  kpiGrid3: {
    // 3 columns on tablet
  },
  kpiGrid2: {
    // 2 columns on phone
  },
  kpiCol: {
    flex: 1,
    minWidth: 150,
    padding: Spacing.xs,
  },
  middleRow: {
    gap: Spacing.lg,
  },
  middleRowHorizontal: {
    flexDirection: 'row',
  },
  middleRowVertical: {
    flexDirection: 'column',
  },
  flex1: {
    flex: 1,
  },
  cultivosCard: {
    flex: 1,
  },
  tempCard: {
    flex: 2,
  },
  card: {
    backgroundColor: Colors.card,
    borderColor: Colors.border,
    borderWidth: 1,
    borderRadius: Radius.lg,
    padding: Spacing.xl,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.lg,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.text,
    fontFamily: Fonts?.display || 'System',
  },
  cardSubtitle: {
    fontSize: 10,
    color: Colors.textSecondary,
    fontFamily: Fonts?.mono || 'monospace',
    marginTop: 2,
    marginBottom: Spacing.lg,
  },
  linkText: {
    fontSize: 12,
    color: Colors.primaryLight,
    fontWeight: '600',
    fontFamily: Fonts?.sans || 'System',
  },
  cultivosList: {
    gap: Spacing.sm,
  },
  cultivoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingVertical: 10,
    borderRadius: Radius.md,
    borderWidth: 1,
  },
  cultivoItemNormal: {
    backgroundColor: Colors.successBg,
    borderColor: Colors.successBorder,
  },
  cultivoItemWarning: {
    backgroundColor: Colors.warningBg,
    borderColor: Colors.warningBorder,
  },
  cultivoItemDanger: {
    backgroundColor: Colors.dangerBg,
    borderColor: Colors.dangerBorder,
  },
  cultivoItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  dotCircle: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  cultivoLabel: {
    fontSize: 13,
    fontWeight: '600',
    fontFamily: Fonts?.sans || 'System',
  },
  cultivoCount: {
    fontSize: 14,
    fontWeight: '700',
    fontFamily: Fonts?.mono || 'monospace',
  },
  tempCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  weatherBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  weatherIcon: {
    fontSize: 18,
  },
  weatherTemp: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.text,
    fontFamily: Fonts?.display || 'System',
  },
  weatherLabel: {
    fontSize: 11,
    color: Colors.textSecondary,
    fontFamily: Fonts?.sans || 'System',
  },
  alertsList: {
    gap: Spacing.sm,
  },
  alertItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    padding: Spacing.md,
    borderRadius: Radius.md,
    borderWidth: 1,
  },
  alertItemRed: {
    backgroundColor: '#FEF2F2',
    borderColor: '#FECACA',
  },
  alertItemAmber: {
    backgroundColor: '#FFFBEB',
    borderColor: '#FDE68A',
  },
  alertItemDefault: {
    backgroundColor: '#F8FAF9',
    borderColor: Colors.border,
  },
  alertIcon: {
    fontSize: 18,
  },
  alertInfo: {
    flex: 1,
  },
  alertTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.text,
    fontFamily: Fonts?.sans || 'System',
  },
  alertMeta: {
    fontSize: 11,
    color: Colors.textSecondary,
    marginTop: 2,
    fontFamily: Fonts?.mono || 'monospace',
  },
  listContainer: {
    gap: Spacing.md,
  },
  activityRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: '#EDF3F0',
    paddingBottom: Spacing.md,
  },
  activityDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.primaryLight,
    marginTop: 6,
  },
  activityContent: {
    flex: 1,
  },
  activityTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.sm,
  },
  activityType: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.text,
    fontFamily: Fonts?.sans || 'System',
  },
  activityMeta: {
    fontSize: 11,
    color: Colors.textSecondary,
    marginTop: 2,
    fontFamily: Fonts?.mono || 'monospace',
  },
  table: {
    minWidth: 680,
  },
  tableHeaderRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    paddingBottom: Spacing.sm,
  },
  tableTh: {
    fontSize: 10,
    fontWeight: '600',
    color: Colors.textSecondary,
    fontFamily: Fonts?.mono || 'monospace',
    letterSpacing: 0.6,
  },
  tableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#EDF3F0',
  },
  tableTdCode: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.primary,
    fontFamily: Fonts?.mono || 'monospace',
  },
  tableTdBold: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.text,
    fontFamily: Fonts?.sans || 'System',
  },
  tableTdMuted: {
    fontSize: 13,
    color: Colors.textSecondary,
    fontFamily: Fonts?.sans || 'System',
  },
  tableTdMono: {
    fontSize: 11,
    color: Colors.textSecondary,
    fontFamily: Fonts?.mono || 'monospace',
  },
});
