import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  useWindowDimensions,
  Modal,
  Platform,
} from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { Colors, Radius, Spacing, Fonts } from '@/constants/theme';
import Sidebar, { ViewId } from '@/components/Sidebar';
import Dashboard from '@/components/Dashboard';
import LoginPage from '@/components/LoginPage';

export default function AppLayout() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentView, setCurrentView] = useState<ViewId>('dashboard');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const { width } = useWindowDimensions();
  const isDesktop = width >= 1024;

  if (!isLoggedIn) {
    return <LoginPage onLogin={() => setIsLoggedIn(true)} />;
  }

  const getBreadcrumbTitle = (view: ViewId) => {
    const [module] = view.split('.');
    const moduleLabels: Record<string, string> = {
      dashboard: 'Dashboard',
      parcelas: 'Parcelas y Cultivos',
      actividades: 'Actividades Agrícolas',
      inspecciones: 'Inspecciones',
      incidencias: 'Incidencias Fitosanitarias',
      monitoreo: 'Monitoreo Ambiental',
      alertas: 'Alertas',
      reportes: 'Reportes',
      admin: 'Administración',
    };
    return moduleLabels[module] || 'Dashboard';
  };

  const currentDateFormatted = 'Jue, 01 Oct. 2026';

  return (
    <View style={styles.container}>
      {/* Desktop Sidebar */}
      {isDesktop && (
        <Sidebar
          activeView={currentView}
          onNavigate={(v) => setCurrentView(v)}
          onLogout={() => setIsLoggedIn(false)}
          alertasBadge={6}
        />
      )}

      {/* Mobile Drawer Modal */}
      {!isDesktop && (
        <Modal
          visible={mobileMenuOpen}
          animationType="fade"
          transparent
          onRequestClose={() => setMobileMenuOpen(false)}
        >
          <View style={styles.modalOverlay}>
            <TouchableOpacity
              style={styles.backdrop}
              activeOpacity={1}
              onPress={() => setMobileMenuOpen(false)}
            />
            <View style={styles.drawerContainer}>
              <Sidebar
                activeView={currentView}
                onNavigate={(v) => {
                  setCurrentView(v);
                  setMobileMenuOpen(false);
                }}
                onLogout={() => {
                  setMobileMenuOpen(false);
                  setIsLoggedIn(false);
                }}
                alertasBadge={6}
                onCloseMobile={() => setMobileMenuOpen(false)}
              />
            </View>
          </View>
        </Modal>
      )}

      {/* Main Container */}
      <View style={styles.mainWrapper}>
        {/* Top Header Bar */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            {/* Hamburger Button on small screens */}
            {!isDesktop && (
              <TouchableOpacity
                style={styles.menuButton}
                onPress={() => setMobileMenuOpen(true)}
                activeOpacity={0.7}
              >
                <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
                  <Path
                    d="M4 6h16M4 12h16M4 18h16"
                    stroke={Colors.text}
                    strokeWidth={2}
                    strokeLinecap="round"
                  />
                </Svg>
              </TouchableOpacity>
            )}

            {/* Breadcrumb */}
            <View style={styles.breadcrumbRow}>
              {isDesktop && (
                <>
                  <Text style={styles.breadcrumbCompany}>Santa Elena S.A.C.</Text>
                  <Text style={styles.breadcrumbSlash}>/</Text>
                </>
              )}
              <Text style={styles.breadcrumbCurrent}>
                {getBreadcrumbTitle(currentView)}
              </Text>
            </View>
          </View>

          {/* Header Right */}
          <View style={styles.headerRight}>
            {/* Notification Bell */}
            <TouchableOpacity
              style={styles.bellButton}
              onPress={() => setCurrentView('alertas.pendientes')}
              activeOpacity={0.7}
            >
              <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
                <Path
                  d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 01-3.46 0"
                  stroke={Colors.textSecondary}
                  strokeWidth={1.8}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </Svg>
              <View style={styles.bellBadge}>
                <Text style={styles.bellBadgeText}>6</Text>
              </View>
            </TouchableOpacity>

            {/* Date Tag */}
            {isDesktop && (
              <Text style={styles.dateText}>{currentDateFormatted}</Text>
            )}
          </View>
        </View>

        {/* Dynamic View Body */}
        <View style={styles.body}>
          {currentView === 'dashboard' && (
            <Dashboard onNavigate={(v) => setCurrentView(v as ViewId)} />
          )}
          {currentView !== 'dashboard' && (
            <Dashboard onNavigate={(v) => setCurrentView(v as ViewId)} />
          )}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: '#F2F6F4',
    ...(Platform.OS === 'web' ? { height: '100vh' as any } : {}),
  },
  mainWrapper: {
    flex: 1,
    flexDirection: 'column',
    overflow: 'hidden',
  },
  header: {
    height: 56,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.xl,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  menuButton: {
    width: 36,
    height: 36,
    borderRadius: Radius.md,
    backgroundColor: '#F0F4F2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  breadcrumbRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  breadcrumbCompany: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontFamily: Fonts?.mono || 'monospace',
  },
  breadcrumbSlash: {
    fontSize: 12,
    color: Colors.border,
  },
  breadcrumbCurrent: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.text,
    fontFamily: Fonts?.display || 'System',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.lg,
  },
  bellButton: {
    width: 36,
    height: 36,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    backgroundColor: '#F7FAF8',
    borderWidth: 1,
    borderColor: '#E2EBE6',
  },
  bellBadge: {
    position: 'absolute',
    top: -3,
    right: -3,
    backgroundColor: '#EF4444',
    width: 16,
    height: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bellBadgeText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '700',
    fontFamily: Fonts?.mono || 'monospace',
  },
  dateText: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontFamily: Fonts?.mono || 'monospace',
  },
  body: {
    flex: 1,
    backgroundColor: '#F2F6F4',
  },
  modalOverlay: {
    flex: 1,
    flexDirection: 'row',
  },
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  drawerContainer: {
    width: 250,
    height: '100%',
    zIndex: 10,
  },
});
