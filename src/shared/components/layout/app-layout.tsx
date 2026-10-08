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
          <View style={styles.barraSuperior}>
            <View style={styles.cabeceraIzquierda}>
              {!esPantallaAmplia && (
                <Pressable
                  onPress={() => setMenuMovilAbierto(true)}
                  style={styles.botonMenuMovil}
                >
                  <Menu size={22} color={Palette.forestGreen} />
                </Pressable>
              )}

              {titulo ? (
                <View>
                  <Text style={styles.tituloHeader}>{titulo}</Text>
                  {subtitulo && <Text style={styles.subtituloHeader}>{subtitulo}</Text>}
                </View>
              ) : (
                <View style={styles.marcaHeaderMovil}>
                  <Sprout size={20} color={Palette.forestGreen} />
                  <Text style={styles.textoMarcaMovil}>AgroSanta Elena</Text>
                </View>
              )}
            </View>

            {accionEncabezado && <View style={styles.accionHeader}>{accionEncabezado}</View>}
          </View>

          {/* Cuerpo de la Página */}
          <View style={styles.cuerpoPagina}>{children}</View>
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
  },
  areaContenido: {
    flex: 1,
    backgroundColor: Palette.cream,
  },
  barraSuperior: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingVertical: 18,
    backgroundColor: Palette.white,
    borderBottomWidth: 1,
    borderBottomColor: Palette.border,
  },
  cabeceraIzquierda: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  botonMenuMovil: {
    padding: 6,
    borderRadius: 6,
    backgroundColor: '#EBF2E5',
  },
  tituloHeader: {
    fontSize: 22,
    fontWeight: '800',
    color: Palette.text,
    letterSpacing: -0.3,
  },
  subtituloHeader: {
    fontSize: 13,
    color: Palette.textSecondary,
    marginTop: 2,
  },
  marcaHeaderMovil: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  textoMarcaMovil: {
    fontSize: 16,
    fontWeight: '700',
    color: Palette.forestGreen,
  },
  accionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  cuerpoPagina: {
    flex: 1,
    padding: 24,
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
