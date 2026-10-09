import React from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView } from 'react-native';
import { useRouter, usePathname, type Href } from 'expo-router';
import {
  Sprout,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  LogOut,
  Shield,
} from 'lucide-react-native';
import { Palette } from '@/constants/theme';
import { useAuthStore } from '@/features/autenticacion';
import { useUIStore } from '@/shared/stores/ui.store';
import {
  ITEMS_MENU_SIDEBAR,
  ItemNavegacion,
} from './sidebar.types';

export interface SidebarProps {
  colapsado?: boolean;
  onToggleColapsar?: () => void;
}

/**
 * @description Sidebar lateral colapsable con submódulos de parcelas y persistencia de UI.
 */
export const Sidebar: React.FC<SidebarProps> = ({
  colapsado: colapsadoProp,
  onToggleColapsar: onToggleProp,
}) => {
  const router = useRouter();
  const rutaActual = usePathname();

  const sidebarColapsadoStore = useUIStore((s) => s.sidebarColapsado);
  const toggleSidebarStore = useUIStore((s) => s.toggleSidebarColapsado);
  const submenuParcelasAbierto = useUIStore((s) => s.submenuParcelasAbierto);
  const toggleSubmenuParcelas = useUIStore((s) => s.toggleSubmenuParcelas);

  const colapsado = colapsadoProp !== undefined ? colapsadoProp : sidebarColapsadoStore;
  const toggleColapsar = onToggleProp || toggleSidebarStore;

  const usuario = useAuthStore((state) => state.usuario);
  const cerrarSesion = useAuthStore((state) => state.cerrarSesion);

  const esRutaActiva = (ruta: string): boolean => {
    if (ruta === '/') return rutaActual === '/' || rutaActual === '/index';
    return rutaActual === ruta;
  };

  const esModuloActivo = (item: ItemNavegacion): boolean => {
    if (item.ruta === '/') return rutaActual === '/' || rutaActual === '/index';
    if (item.subitems) {
      return item.subitems.some((sub) => rutaActual.startsWith(sub.ruta));
    }
    return rutaActual.startsWith(item.ruta);
  };

  const manejarClickPrincipal = (item: ItemNavegacion) => {
    if (colapsado) {
      router.push(item.ruta as Href);
      return;
    }
    if (item.subitems) {
      toggleSubmenuParcelas();
      if (!rutaActual.startsWith(item.ruta)) {
        router.push(item.ruta as Href);
      }
      return;
    }
    router.push(item.ruta as Href);
  };

  return (
    <View style={[styles.sidebar, colapsado ? styles.sidebarColapsado : styles.sidebarExpandido]}>
      <View style={styles.encabezado}>
        <View style={styles.logoContenedor}>
          <View style={styles.logoIcono}>
            <Sprout size={22} color={Palette.white} />
          </View>
          {!colapsado && (
            <View style={styles.textoMarca}>
              <Text style={styles.tituloMarca}>AgroSanta Elena</Text>
              <Text style={styles.subtituloMarca}>Gestión Agrícola</Text>
            </View>
          )}
        </View>

        <Pressable onPress={toggleColapsar} style={styles.botonToggle}>
          {colapsado ? (
            <ChevronRight size={18} color={Palette.white} />
          ) : (
            <ChevronLeft size={18} color={Palette.white} />
          )}
        </Pressable>
      </View>

      <ScrollView style={styles.menuScroll} showsVerticalScrollIndicator={false}>
        <View style={styles.listaMenu}>
          {ITEMS_MENU_SIDEBAR.map((item) => {
            const Icono = item.icono;
            const tieneSubitems = !!item.subitems && item.subitems.length > 0;
            const moduloActivo = esModuloActivo(item);

            return (
              <View key={item.ruta} style={styles.bloqueItemMenu}>
                <Pressable
                  onPress={() => manejarClickPrincipal(item)}
                  style={({ pressed }) => [
                    styles.itemMenu,
                    moduloActivo && !tieneSubitems && styles.itemMenuActivo,
                    pressed && styles.itemMenuPresionado,
                    colapsado && styles.itemMenuCentrado,
                  ]}
                >
                  <Icono
                    size={20}
                    color={moduloActivo && !tieneSubitems ? Palette.forestGreen : '#E2EBDC'}
                  />
                  {!colapsado && (
                    <View style={styles.filaContenidoItem}>
                      <Text
                        style={[
                          styles.textoItem,
                          moduloActivo && !tieneSubitems && styles.textoItemActivo,
                        ]}
                      >
                        {item.nombre}
                      </Text>
                      {tieneSubitems && (
                        <Pressable onPress={toggleSubmenuParcelas} hitSlop={8}>
                          {submenuParcelasAbierto ? (
                            <ChevronUp size={16} color="#E2EBDC" />
                          ) : (
                            <ChevronDown size={16} color="#E2EBDC" />
                          )}
                        </Pressable>
                      )}
                    </View>
                  )}
                </Pressable>

                {!colapsado && tieneSubitems && submenuParcelasAbierto && (
                  <View style={styles.contenedorSubmenu}>
                    <View style={styles.lineaGuiaSubmenu} />
                    <View style={styles.listaSubmenu}>
                      {item.subitems!.map((sub) => {
                        const SubIcono = sub.icono;
                        const subActivo = esRutaActiva(sub.ruta);

                        return (
                          <Pressable
                            key={sub.ruta}
                            onPress={() => router.push(sub.ruta as Href)}
                            style={({ pressed }) => [
                              styles.itemSubmenu,
                              subActivo && styles.itemSubmenuActivo,
                              pressed && styles.itemMenuPresionado,
                            ]}
                          >
                            <SubIcono
                              size={15}
                              color={subActivo ? Palette.forestGreen : '#C8D9BD'}
                            />
                            <Text
                              style={[
                                styles.textoSubmenu,
                                subActivo && styles.textoSubmenuActivo,
                              ]}
                            >
                              {sub.nombre}
                            </Text>
                          </Pressable>
                        );
                      })}
                    </View>
                  </View>
                )}
              </View>
            );
          })}
        </View>
      </ScrollView>

      <View style={styles.pieUsuario}>
        <View style={[styles.infoUsuario, colapsado && styles.infoUsuarioCentrado]}>
          <View style={styles.avatarUsuario}>
            <Shield size={16} color={Palette.forestGreen} />
          </View>
          {!colapsado && (
            <View style={styles.detallesUsuario}>
              <Text style={styles.nombreUsuario} numberOfLines={1}>
                {usuario ? usuario.nombreCompleto || usuario.nombres : 'Administrador'}
              </Text>
              <Text style={styles.rolUsuario} numberOfLines={1}>
                {usuario?.rol || 'ADMINISTRADOR'}
              </Text>
            </View>
          )}
        </View>

        <Pressable
          onPress={cerrarSesion}
          style={({ pressed }) => [
            styles.botonCerrarSesion,
            pressed && styles.botonCerrarSesionPresionado,
            colapsado && styles.botonCerrarSesionCentrado,
          ]}
        >
          <LogOut size={18} color="#FFCDD2" />
          {!colapsado && <Text style={styles.textoCerrarSesion}>Cerrar sesión</Text>}
        </Pressable>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  sidebar: {
    backgroundColor: Palette.forestGreen,
    height: '100%',
    borderRightWidth: 1,
    borderRightColor: '#435833',
    justifyContent: 'space-between',
    zIndex: 50,
  },
  sidebarExpandido: { width: 250 },
  sidebarColapsado: { width: 76 },
  encabezado: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.12)',
  },
  logoContenedor: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  logoIcono: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: '#3E522F',
    alignItems: 'center',
    justifyContent: 'center',
  },
  textoMarca: { overflow: 'hidden' },
  tituloMarca: { fontSize: 15, fontWeight: '800', color: '#FFFFFF', letterSpacing: 0.2 },
  subtituloMarca: { fontSize: 11, color: '#C3D4B9' },
  botonToggle: {
    width: 28,
    height: 28,
    borderRadius: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuScroll: { flex: 1, paddingVertical: 14 },
  listaMenu: { gap: 4, paddingHorizontal: 12 },
  bloqueItemMenu: { gap: 2 },
  itemMenu: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 11,
    paddingHorizontal: 14,
    borderRadius: 8,
  },
  itemMenuCentrado: { justifyContent: 'center', paddingHorizontal: 0 },
  itemMenuActivo: { backgroundColor: Palette.cream },
  itemMenuPresionado: { opacity: 0.85 },
  filaContenidoItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  textoItem: { fontSize: 14, fontWeight: '600', color: '#E2EBDC' },
  textoItemActivo: { color: Palette.forestGreen, fontWeight: '800' },
  contenedorSubmenu: {
    flexDirection: 'row',
    paddingLeft: 22,
    paddingVertical: 4,
    position: 'relative',
  },
  lineaGuiaSubmenu: {
    width: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.18)',
    borderRadius: 1,
    marginRight: 10,
  },
  listaSubmenu: { flex: 1, gap: 3 },
  itemSubmenu: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 6,
  },
  itemSubmenuActivo: { backgroundColor: '#EBF2E5' },
  textoSubmenu: { fontSize: 13, color: '#D4E4CB', fontWeight: '500' },
  textoSubmenuActivo: { color: Palette.forestGreen, fontWeight: '700' },
  pieUsuario: {
    padding: 14,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.12)',
    gap: 12,
  },
  infoUsuario: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    padding: 10,
    borderRadius: 8,
  },
  infoUsuarioCentrado: { justifyContent: 'center', paddingHorizontal: 0 },
  avatarUsuario: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Palette.cream,
    alignItems: 'center',
    justifyContent: 'center',
  },
  detallesUsuario: { flex: 1 },
  nombreUsuario: { fontSize: 13, fontWeight: '700', color: '#FFFFFF' },
  rolUsuario: { fontSize: 11, color: Palette.sageGreen, fontWeight: '600' },
  botonCerrarSesion: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 6,
  },
  botonCerrarSesionCentrado: { justifyContent: 'center', paddingHorizontal: 0 },
  botonCerrarSesionPresionado: { backgroundColor: 'rgba(255, 255, 255, 0.06)' },
  textoCerrarSesion: { fontSize: 12, color: '#FFCDD2', fontWeight: '600' },
});
