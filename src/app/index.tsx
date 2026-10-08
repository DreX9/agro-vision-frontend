import React from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { useRouter, type Href } from 'expo-router';
import {
  Users,
  MapPin,
  Sprout,
  Activity,
  ScanLine,
  ArrowRight,
  TrendingUp,
} from 'lucide-react-native';
import { Palette } from '@/constants/theme';
import { AppLayout } from '@/shared/components/layout/app-layout';
import { Card, Badge, Boton } from '@/shared/components/ui';
import { useAuthStore } from '@/features/autenticacion';

/**
 * @description Pantalla principal de Dashboard agronómico inteligente.
 */
export default function DashboardScreen() {
  const router = useRouter();
  const usuario = useAuthStore((state) => state.usuario);

  const nombreMostrar = usuario
    ? usuario.nombreCompleto || `${usuario.nombres} ${usuario.apellidos}`
    : 'Administrador';

  return (
    <AppLayout
      titulo="Panel de Control Agronómico"
      subtitulo={`Bienvenido, ${nombreMostrar} · Fundo Santa Elena`}
    >
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Banner de Bienvenida */}
        <Card estilo={styles.bannerHero}>
          <View style={styles.bannerInfo}>
            <Badge texto="TEMPORADA 2026-II" variante="exito" />
            <Text style={styles.bannerTitulo}>Monitoreo Centralizado de Operaciones</Text>
            <Text style={styles.bannerSubtitulo}>
              Visualiza en tiempo real el estado de tus parcelas, telemetría de sensores y gestión de personal agrícola.
            </Text>
          </View>
          <View style={styles.bannerBotonWrapper}>
            <Boton
              titulo="Gestionar Usuarios"
              variante="primario"
              iconoDerecha={<ArrowRight size={16} color={Palette.white} />}
              onPress={() => router.push('/usuarios' as Href)}
            />
          </View>
        </Card>

        {/* Tarjetas de Métricas Rápidas */}
        <View style={styles.gridMetricas}>
          {/* Métrica: Usuarios */}
          <Pressable
            style={styles.columnaMetrica}
            onPress={() => router.push('/usuarios' as Href)}
          >
            <Card estilo={styles.tarjetaMetrica}>
              <View style={styles.iconoMetricaWrapper}>
                <Users size={22} color={Palette.forestGreen} />
              </View>
              <Text style={styles.valorMetrica}>62</Text>
              <Text style={styles.etiquetaMetrica}>Personal y Usuarios</Text>
              <View style={styles.badgeMetricaFila}>
                <TrendingUp size={14} color={Palette.success} />
                <Text style={styles.textoTrending}>Mantenimiento activo</Text>
              </View>
            </Card>
          </Pressable>

          {/* Métrica: Parcelas */}
          <View style={styles.columnaMetrica}>
            <Card estilo={styles.tarjetaMetrica}>
              <View style={styles.iconoMetricaWrapper}>
                <MapPin size={22} color={Palette.forestGreen} />
              </View>
              <Text style={styles.valorMetrica}>24</Text>
              <Text style={styles.etiquetaMetrica}>Parcelas Delimitadas</Text>
              <Text style={styles.subtextoMetrica}>180 Hectáreas totales</Text>
            </Card>
          </View>

          {/* Métrica: Cultivos */}
          <View style={styles.columnaMetrica}>
            <Card estilo={styles.tarjetaMetrica}>
              <View style={styles.iconoMetricaWrapper}>
                <Sprout size={22} color={Palette.forestGreen} />
              </View>
              <Text style={styles.valorMetrica}>8</Text>
              <Text style={styles.etiquetaMetrica}>Variedades en Ciclo</Text>
              <Text style={styles.subtextoMetrica}>Uva de mesa, Espárrago, Palto</Text>
            </Card>
          </View>

          {/* Métrica: Sensores */}
          <View style={styles.columnaMetrica}>
            <Card estilo={styles.tarjetaMetrica}>
              <View style={styles.iconoMetricaWrapper}>
                <Activity size={22} color={Palette.forestGreen} />
              </View>
              <Text style={styles.valorMetrica}>16</Text>
              <Text style={styles.etiquetaMetrica}>Nodos IoT Conectados</Text>
              <Text style={styles.subtextoMetrica}>Telemetría en tiempo real</Text>
            </Card>
          </View>
        </View>

        {/* Módulos de Acceso Directo */}
        <Text style={styles.seccionTitulo}>Módulos del Sistema</Text>
        <View style={styles.gridAccesos}>
          <Pressable
            style={styles.columnaAcceso}
            onPress={() => router.push('/usuarios' as Href)}
          >
            <Card estilo={styles.tarjetaAcceso}>
              <View style={styles.iconoAccesoContenedor}>
                <Users size={24} color={Palette.forestGreen} />
              </View>
              <Text style={styles.tituloAcceso}>Mantenimiento de Usuarios</Text>
              <Text style={styles.descripcionAcceso}>
                Alta, edición de roles, asignación técnica y control de acceso.
              </Text>
              <View style={styles.enlaceAccesoFila}>
                <Text style={styles.textoEnlaceAcceso}>Ver listado de usuarios</Text>
                <ArrowRight size={14} color={Palette.forestGreen} />
              </View>
            </Card>
          </Pressable>

          <View style={styles.columnaAcceso}>
            <Card estilo={styles.tarjetaAcceso}>
              <View style={styles.iconoAccesoContenedor}>
                <ScanLine size={24} color={Palette.forestGreen} />
              </View>
              <Text style={styles.tituloAcceso}>Diagnóstico IA</Text>
              <Text style={styles.descripcionAcceso}>
                Detección fitosanitaria y estrés hídrico mediante visión computacional.
              </Text>
              <View style={styles.enlaceAccesoFila}>
                <Text style={styles.textoEnlaceAcceso}>Próximamente disponible</Text>
              </View>
            </Card>
          </View>
        </View>
      </ScrollView>
    </AppLayout>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    paddingBottom: 40,
  },
  bannerHero: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 28,
    marginBottom: 24,
    backgroundColor: '#FAF7F0',
    gap: 20,
  },
  bannerInfo: {
    flex: 1,
    minWidth: 280,
    gap: 8,
  },
  bannerTitulo: {
    fontSize: 22,
    fontWeight: '800',
    color: Palette.text,
    letterSpacing: -0.3,
  },
  bannerSubtitulo: {
    fontSize: 14,
    color: Palette.textSecondary,
    lineHeight: 20,
  },
  bannerBotonWrapper: {
    alignSelf: 'center',
  },
  gridMetricas: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    marginBottom: 28,
  },
  columnaMetrica: {
    flex: 1,
    minWidth: 180,
  },
  tarjetaMetrica: {
    padding: 20,
    gap: 6,
  },
  iconoMetricaWrapper: {
    width: 42,
    height: 42,
    borderRadius: 8,
    backgroundColor: '#EBF2E5',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  valorMetrica: {
    fontSize: 26,
    fontWeight: '800',
    color: Palette.text,
  },
  etiquetaMetrica: {
    fontSize: 13,
    fontWeight: '700',
    color: Palette.text,
  },
  subtextoMetrica: {
    fontSize: 12,
    color: Palette.textSecondary,
  },
  badgeMetricaFila: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  textoTrending: {
    fontSize: 12,
    color: Palette.success,
    fontWeight: '600',
  },
  seccionTitulo: {
    fontSize: 16,
    fontWeight: '800',
    color: Palette.forestGreen,
    marginBottom: 16,
  },
  gridAccesos: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  columnaAcceso: {
    flex: 1,
    minWidth: 280,
  },
  tarjetaAcceso: {
    padding: 24,
    gap: 10,
  },
  iconoAccesoContenedor: {
    width: 46,
    height: 46,
    borderRadius: 10,
    backgroundColor: '#EBF2E5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tituloAcceso: {
    fontSize: 17,
    fontWeight: '700',
    color: Palette.text,
  },
  descripcionAcceso: {
    fontSize: 13,
    color: Palette.textSecondary,
    lineHeight: 18,
  },
  enlaceAccesoFila: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 8,
  },
  textoEnlaceAcceso: {
    fontSize: 13,
    fontWeight: '700',
    color: Palette.forestGreen,
  },
});
