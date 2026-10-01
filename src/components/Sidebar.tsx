import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from 'react-native';
import Svg, { Path, Circle, Rect, Polyline } from 'react-native-svg';
import { Colors, Radius, Spacing, Fonts } from '@/constants/theme';
import { usuarioActual } from '@/data/mockData';

export type ViewId =
  | 'dashboard'
  | 'parcelas.listado' | 'parcelas.nueva' | 'parcelas.detalle'
  | 'actividades.listado' | 'actividades.registrar' | 'actividades.historial'
  | 'inspecciones.nueva' | 'inspecciones.historial'
  | 'incidencias.listado' | 'incidencias.detalle' | 'incidencias.analisis' | 'incidencias.seguimiento'
  | 'monitoreo.indicadores' | 'monitoreo.historial'
  | 'alertas.pendientes' | 'alertas.historial'
  | 'reportes.parcelas' | 'reportes.actividades' | 'reportes.incidencias' | 'reportes.monitoreo'
  | 'admin.usuarios';

interface NavSub {
  id: ViewId;
  label: string;
}

interface NavSection {
  id: string;
  label: string;
  badge?: number;
  subs: NavSub[];
  renderIcon: (active: boolean) => React.ReactNode;
}

interface SidebarProps {
  activeView: ViewId;
  onNavigate: (view: ViewId) => void;
  onLogout: () => void;
  alertasBadge?: number;
  onCloseMobile?: () => void;
}

export default function Sidebar({
  activeView,
  onNavigate,
  onLogout,
  alertasBadge = 6,
  onCloseMobile,
}: SidebarProps) {
  // Modules that can be toggled open/closed
  const [openModules, setOpenModules] = useState<string[]>([
    'parcelas',
    'actividades',
    'inspecciones',
    'incidencias',
    'monitoreo',
    'alertas',
    'reportes',
    'admin',
  ]);

  const toggleModule = (id: string) => {
    setOpenModules((prev) =>
      prev.includes(id) ? prev.filter((m) => m !== id) : [...prev, id]
    );
  };

  const handleSelectSub = (subId: ViewId) => {
    onNavigate(subId);
    if (onCloseMobile) onCloseMobile();
  };

  const handleSelectDashboard = () => {
    onNavigate('dashboard');
    if (onCloseMobile) onCloseMobile();
  };

  const activeModule = activeView.split('.')[0];

  const navSections: NavSection[] = [
    {
      id: 'parcelas',
      label: 'Parcelas y Cultivos',
      renderIcon: (active) => (
        <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
          <Path
            d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"
            stroke={active ? '#3A9B6C' : 'rgba(255,255,255,0.45)'}
            strokeWidth={1.8}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </Svg>
      ),
      subs: [
        { id: 'parcelas.listado', label: 'Listado de parcelas' },
        { id: 'parcelas.nueva', label: 'Nueva parcela' },
        { id: 'parcelas.detalle', label: 'Detalle de parcela' },
      ],
    },
    {
      id: 'actividades',
      label: 'Actividades Agrícolas',
      renderIcon: (active) => (
        <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
          <Path
            d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2M9 12h6M9 16h4"
            stroke={active ? '#3A9B6C' : 'rgba(255,255,255,0.45)'}
            strokeWidth={1.8}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </Svg>
      ),
      subs: [
        { id: 'actividades.listado', label: 'Listado' },
        { id: 'actividades.registrar', label: 'Registrar actividad' },
        { id: 'actividades.historial', label: 'Historial' },
      ],
    },
    {
      id: 'inspecciones',
      label: 'Inspecciones',
      renderIcon: (active) => (
        <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
          <Circle
            cx={11}
            cy={11}
            r={8}
            stroke={active ? '#3A9B6C' : 'rgba(255,255,255,0.45)'}
            strokeWidth={1.8}
          />
          <Path
            d="m21 21-4.35-4.35M11 8v6M8 11h6"
            stroke={active ? '#3A9B6C' : 'rgba(255,255,255,0.45)'}
            strokeWidth={1.8}
            strokeLinecap="round"
          />
        </Svg>
      ),
      subs: [
        { id: 'inspecciones.nueva', label: 'Nueva inspección' },
        { id: 'inspecciones.historial', label: 'Historial' },
      ],
    },
    {
      id: 'incidencias',
      label: 'Incidencias Fitosanitarias',
      renderIcon: (active) => (
        <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
          <Path
            d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0zM12 9v4M12 17h.01"
            stroke={active ? '#3A9B6C' : 'rgba(255,255,255,0.45)'}
            strokeWidth={1.8}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </Svg>
      ),
      subs: [
        { id: 'incidencias.listado', label: 'Listado' },
        { id: 'incidencias.detalle', label: 'Detalle' },
        { id: 'incidencias.analisis', label: 'Análisis IA' },
        { id: 'incidencias.seguimiento', label: 'Seguimiento' },
      ],
    },
    {
      id: 'monitoreo',
      label: 'Monitoreo Ambiental',
      renderIcon: (active) => (
        <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
          <Path
            d="M18 10h-1.26A8 8 0 109 20h9a5 5 0 000-10z"
            stroke={active ? '#3A9B6C' : 'rgba(255,255,255,0.45)'}
            strokeWidth={1.8}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </Svg>
      ),
      subs: [
        { id: 'monitoreo.indicadores', label: 'Indicadores' },
        { id: 'monitoreo.historial', label: 'Historial' },
      ],
    },
    {
      id: 'alertas',
      label: 'Alertas',
      badge: alertasBadge,
      renderIcon: (active) => (
        <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
          <Path
            d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 01-3.46 0"
            stroke={active ? '#3A9B6C' : 'rgba(255,255,255,0.45)'}
            strokeWidth={1.8}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </Svg>
      ),
      subs: [
        { id: 'alertas.pendientes', label: 'Pendientes' },
        { id: 'alertas.historial', label: 'Historial' },
      ],
    },
    {
      id: 'reportes',
      label: 'Reportes',
      renderIcon: (active) => (
        <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
          <Path
            d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8zM14 2v6h6M16 13H8M16 17H8M10 9H8"
            stroke={active ? '#3A9B6C' : 'rgba(255,255,255,0.45)'}
            strokeWidth={1.8}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </Svg>
      ),
      subs: [
        { id: 'reportes.parcelas', label: 'Parcelas' },
        { id: 'reportes.actividades', label: 'Actividades' },
        { id: 'reportes.incidencias', label: 'Incidencias' },
        { id: 'reportes.monitoreo', label: 'Monitoreo' },
      ],
    },
    {
      id: 'admin',
      label: 'Administración',
      renderIcon: (active) => (
        <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
          <Path
            d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M9 11a4 4 0 100-8 4 4 0 000 8zM23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"
            stroke={active ? '#3A9B6C' : 'rgba(255,255,255,0.45)'}
            strokeWidth={1.8}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </Svg>
      ),
      subs: [
        { id: 'admin.usuarios', label: 'Usuarios y roles' },
      ],
    },
  ];

  return (
    <View style={styles.sidebar}>
      {/* Brand Header */}
      <View style={styles.brandSection}>
        <View style={styles.brandIconBox}>
          <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
            <Path
              d="M12 22V12M12 12C12 12 7 9 5 4c3.5 0 6 2 7 8zM12 12C12 12 17 9 19 4c-3.5 0-6 2-7 8z"
              stroke="#FFFFFF"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <Path d="M5 22h14" stroke="#FFFFFF" strokeWidth={2} strokeLinecap="round" />
          </Svg>
        </View>
        <View style={styles.brandTextBox}>
          <Text style={styles.brandTitle}>AgroSanta Elena</Text>
          <Text style={styles.brandVersion}>SAC · v1.0</Text>
        </View>
      </View>

      {/* Navigation List */}
      <ScrollView style={styles.navScroll} showsVerticalScrollIndicator={false}>
        {/* Dashboard Nav Button */}
        <TouchableOpacity
          style={[
            styles.dashboardBtn,
            activeView === 'dashboard' && styles.dashboardBtnActive,
          ]}
          onPress={handleSelectDashboard}
          activeOpacity={0.8}
        >
          <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
            <Rect
              x={3}
              y={3}
              width={7}
              height={7}
              rx={1.5}
              stroke={activeView === 'dashboard' ? '#3A9B6C' : 'rgba(255,255,255,0.4)'}
              strokeWidth={1.8}
            />
            <Rect
              x={14}
              y={3}
              width={7}
              height={7}
              rx={1.5}
              stroke={activeView === 'dashboard' ? '#3A9B6C' : 'rgba(255,255,255,0.4)'}
              strokeWidth={1.8}
            />
            <Rect
              x={14}
              y={14}
              width={7}
              height={7}
              rx={1.5}
              stroke={activeView === 'dashboard' ? '#3A9B6C' : 'rgba(255,255,255,0.4)'}
              strokeWidth={1.8}
            />
            <Rect
              x={3}
              y={14}
              width={7}
              height={7}
              rx={1.5}
              stroke={activeView === 'dashboard' ? '#3A9B6C' : 'rgba(255,255,255,0.4)'}
              strokeWidth={1.8}
            />
          </Svg>
          <Text
            style={[
              styles.dashboardBtnText,
              activeView === 'dashboard' && styles.dashboardBtnTextActive,
            ]}
          >
            Dashboard
          </Text>
        </TouchableOpacity>

        {/* Section Header: MÓDULOS */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionHeaderText}>MÓDULOS</Text>
        </View>

        {/* Module Accordion Items */}
        {navSections.map((section) => {
          const isOpen = openModules.includes(section.id);
          const isSectionActive = activeModule === section.id;

          return (
            <View key={section.id} style={styles.sectionBlock}>
              {/* Module Header Bar */}
              <TouchableOpacity
                style={[
                  styles.moduleHeader,
                  isSectionActive && styles.moduleHeaderActive,
                ]}
                onPress={() => toggleModule(section.id)}
                activeOpacity={0.75}
              >
                <View style={styles.moduleHeaderLeft}>
                  {section.renderIcon(isSectionActive)}
                  <Text
                    style={[
                      styles.moduleHeaderText,
                      isSectionActive && styles.moduleHeaderTextActive,
                    ]}
                    numberOfLines={1}
                  >
                    {section.label}
                  </Text>
                </View>

                <View style={styles.moduleHeaderRight}>
                  {section.badge !== undefined && section.badge > 0 && (
                    <View style={styles.badgeRed}>
                      <Text style={styles.badgeRedText}>{section.badge}</Text>
                    </View>
                  )}
                  <Svg width={12} height={12} viewBox="0 0 24 24" fill="none">
                    <Polyline
                      points={isOpen ? '18 15 12 9 6 15' : '6 9 12 15 18 9'}
                      stroke="rgba(255,255,255,0.3)"
                      strokeWidth={2}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </Svg>
                </View>
              </TouchableOpacity>

              {/* Sub-items list */}
              {isOpen && (
                <View style={styles.subsList}>
                  {section.subs.map((sub) => {
                    const isSubActive = activeView === sub.id;
                    return (
                      <TouchableOpacity
                        key={sub.id}
                        style={[
                          styles.subItem,
                          isSubActive && styles.subItemActive,
                        ]}
                        onPress={() => handleSelectSub(sub.id)}
                        activeOpacity={0.7}
                      >
                        {isSubActive && <View style={styles.subItemDot} />}
                        <Text
                          style={[
                            styles.subItemText,
                            isSubActive && styles.subItemTextActive,
                          ]}
                          numberOfLines={1}
                        >
                          {sub.label}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              )}
            </View>
          );
        })}
      </ScrollView>

      {/* User Footer Profile */}
      <View style={styles.userSection}>
        <View style={styles.userAvatar}>
          <Text style={styles.userAvatarText}>
            {usuarioActual.nombre[0]}
            {usuarioActual.apellido[0]}
          </Text>
        </View>
        <View style={styles.userInfo}>
          <Text style={styles.userName} numberOfLines={1}>
            {usuarioActual.nombre} {usuarioActual.apellido}
          </Text>
          <Text style={styles.userRole}>{usuarioActual.rol}</Text>
        </View>
        <TouchableOpacity
          style={styles.logoutButton}
          onPress={onLogout}
          activeOpacity={0.7}
        >
          <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
            <Path
              d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9"
              stroke="rgba(255,255,255,0.4)"
              strokeWidth={1.8}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </Svg>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  sidebar: {
    width: 250,
    backgroundColor: '#0C1912',
    height: '100%',
    flexDirection: 'column',
    borderRightWidth: 1,
    borderRightColor: 'rgba(255, 255, 255, 0.06)',
  },
  brandSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.xl,
    paddingBottom: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.07)',
  },
  brandIconBox: {
    width: 34,
    height: 34,
    borderRadius: Radius.md,
    backgroundColor: '#3A9B6C',
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandTextBox: {
    flex: 1,
  },
  brandTitle: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
    fontFamily: Fonts?.display || 'System',
  },
  brandVersion: {
    color: 'rgba(255, 255, 255, 0.4)',
    fontSize: 10,
    fontFamily: Fonts?.mono || 'monospace',
    marginTop: 1,
  },
  navScroll: {
    flex: 1,
    paddingHorizontal: Spacing.sm,
    paddingTop: Spacing.md,
  },
  dashboardBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    paddingVertical: 10,
    paddingHorizontal: Spacing.md,
    borderRadius: Radius.md,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    marginBottom: 4,
  },
  dashboardBtnActive: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  dashboardBtnText: {
    color: 'rgba(255, 255, 255, 0.65)',
    fontSize: 14,
    fontWeight: '600',
    fontFamily: Fonts?.display || 'System',
  },
  dashboardBtnTextActive: {
    color: '#FFFFFF',
  },
  sectionHeader: {
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.xs,
  },
  sectionHeaderText: {
    color: 'rgba(255, 255, 255, 0.3)',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1.2,
    fontFamily: Fonts?.mono || 'monospace',
  },
  sectionBlock: {
    marginBottom: 2,
  },
  moduleHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
    paddingHorizontal: Spacing.md,
    borderRadius: Radius.md,
  },
  moduleHeaderActive: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  moduleHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  moduleHeaderText: {
    color: 'rgba(255, 255, 255, 0.65)',
    fontSize: 13,
    fontWeight: '500',
    fontFamily: Fonts?.sans || 'System',
    flex: 1,
  },
  moduleHeaderTextActive: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  moduleHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  badgeRed: {
    backgroundColor: '#EF4444',
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  badgeRedText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
    fontFamily: Fonts?.mono || 'monospace',
  },
  subsList: {
    paddingLeft: 36,
    paddingTop: 2,
    paddingBottom: 4,
    gap: 2,
  },
  subItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: Radius.sm,
  },
  subItemActive: {
    backgroundColor: 'rgba(58, 155, 108, 0.18)',
  },
  subItemDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#3A9B6C',
  },
  subItemText: {
    color: 'rgba(255, 255, 255, 0.42)',
    fontSize: 12,
    fontFamily: Fonts?.sans || 'System',
  },
  subItemTextActive: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  userSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.07)',
    backgroundColor: '#0A150F',
  },
  userAvatar: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#1B5E40',
    borderWidth: 1,
    borderColor: '#3A9B6C',
    alignItems: 'center',
    justifyContent: 'center',
  },
  userAvatarText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
    fontFamily: Fonts?.mono || 'monospace',
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
    fontFamily: Fonts?.display || 'System',
  },
  userRole: {
    color: 'rgba(255, 255, 255, 0.45)',
    fontSize: 10,
    fontFamily: Fonts?.sans || 'System',
  },
  logoutButton: {
    padding: 6,
  },
});
