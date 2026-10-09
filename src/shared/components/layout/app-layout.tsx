import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  useWindowDimensions,
  SafeAreaView,
  Text,
  Pressable,
} from 'react-native';
import { Menu, Sprout } from 'lucide-react-native';
import { Palette } from '@/constants/theme';
import { Sidebar } from './sidebar';

import { useUIStore } from '@/shared/stores/ui.store';

export interface AppLayoutProps {
  children: React.ReactNode;
  titulo?: string;
  subtitulo?: string;
  accionEncabezado?: React.ReactNode;
}

/**
 * @description Layout general de la aplicación con Sidebar colapsable en Web y navegación adaptada a móvil.
 */
export const AppLayout: React.FC<AppLayoutProps> = ({
  children,
  titulo,
  subtitulo,
  accionEncabezado,
}) => {
  const { width } = useWindowDimensions();
  const sidebarColapsado = useUIStore((s) => s.sidebarColapsado);
  const toggleSidebarColapsado = useUIStore((s) => s.toggleSidebarColapsado);
  const [menuMovilAbierto, setMenuMovilAbierto] = useState(false);
  const esPantallaAmplia = width >= 840;
  const esMovil = width < 768;

  return (
    <SafeAreaView style={styles.contenedorRaiz}>
      <View style={styles.layoutPrincipal}>
        {/* Sidebar en Desktop / Tablet */}
        {esPantallaAmplia && (
          <Sidebar
            colapsado={sidebarColapsado}
            onToggleColapsar={toggleSidebarColapsado}
          />
        )}

        {/* Sidebar flotante en móvil cuando se abre el menú */}
        {!esPantallaAmplia && menuMovilAbierto && (
          <View style={styles.overlayMovil}>
            <Pressable
              style={styles.backdrop}
              onPress={() => setMenuMovilAbierto(false)}
            />
            <View style={styles.sidebarMovilContenedor}>
              <Sidebar
                colapsado={false}
                onToggleColapsar={() => setMenuMovilAbierto(false)}
              />
            </View>
          </View>
        )}

        {/* Contenido Principal */}
        <View style={styles.areaContenido}>
          {/* Barra Superior / Header */}
          <View style={[styles.barraSuperior, esMovil && styles.barraSuperiorMovil]}>
            <View style={styles.cabeceraIzquierda}>
              {!esPantallaAmplia && (
                <Pressable
                  onPress={() => setMenuMovilAbierto(true)}
                  style={styles.botonMenuMovil}
                >
                  <Menu size={20} color={Palette.forestGreen} />
                </Pressable>
              )}

              {titulo ? (
                <View style={styles.titulosWrapper}>
                  <Text style={[styles.tituloHeader, esMovil && styles.tituloHeaderMovil]}>
                    {titulo}
                  </Text>
                  {subtitulo && (
                    <Text style={[styles.subtituloHeader, esMovil && styles.subtituloHeaderMovil]}>
                      {subtitulo}
                    </Text>
                  )}
                </View>
              ) : (
                <View style={styles.marcaHeaderMovil}>
                  <Sprout size={18} color={Palette.forestGreen} />
                  <Text style={styles.textoMarcaMovil}>AgroSanta Elena</Text>
                </View>
              )}
            </View>

            {accionEncabezado && <View style={styles.accionHeader}>{accionEncabezado}</View>}
          </View>

          {/* Cuerpo de la Página */}
          <View style={[styles.cuerpoPagina, esMovil && styles.cuerpoPaginaMovil]}>
            {children}
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  contenedorRaiz: {
    flex: 1,
    backgroundColor: Palette.cream,
  },
  layoutPrincipal: {
    flex: 1,
    flexDirection: 'row',
    width: '100%',
    overflow: 'hidden',
  },
  areaContenido: {
    flex: 1,
    minWidth: 0,
    backgroundColor: Palette.cream,
    overflow: 'hidden',
  },
  barraSuperior: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
    backgroundColor: Palette.white,
    borderBottomWidth: 1,
    borderBottomColor: Palette.border,
    flexWrap: 'wrap',
    gap: 10,
    minHeight: 60,
  },
  barraSuperiorMovil: {
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  cabeceraIzquierda: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
    minWidth: 0,
  },
  titulosWrapper: {
    flex: 1,
    minWidth: 0,
  },
  botonMenuMovil: {
    padding: 6,
    borderRadius: 6,
    backgroundColor: '#EBF2E5',
  },
  tituloHeader: {
    fontSize: 20,
    fontWeight: '800',
    color: Palette.text,
    letterSpacing: -0.3,
  },
  tituloHeaderMovil: {
    fontSize: 17,
  },
  subtituloHeader: {
    fontSize: 12.5,
    color: Palette.textSecondary,
    marginTop: 1,
  },
  subtituloHeaderMovil: {
    fontSize: 11,
  },
  marcaHeaderMovil: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  textoMarcaMovil: {
    fontSize: 15,
    fontWeight: '700',
    color: Palette.forestGreen,
  },
  accionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  cuerpoPagina: {
    flex: 1,
    minWidth: 0,
    padding: 20,
    overflow: 'hidden',
  },
  cuerpoPaginaMovil: {
    padding: 12,
  },
  overlayMovil: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 100,
    flexDirection: 'row',
  },
  backdrop: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
  },
  sidebarMovilContenedor: {
    width: 270,
    height: '100%',
    zIndex: 101,
  },
});
