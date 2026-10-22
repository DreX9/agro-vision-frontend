import React, { useMemo } from 'react';
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
  Layers,
  CalendarCheck,
} from 'lucide-react-native';
import { Palette } from '@/constants/theme';
import { AppLayout } from '@/shared/components/layout/app-layout';
import { Card, Badge, Boton } from '@/shared/components/ui';
import { useAuthStore } from '@/features/autenticacion';
import { useParcelasQuery } from '@/features/parcelas';
import { useCultivosQuery } from '@/features/cultivos';
import { MapaGeneralParcelas } from '@/shared/components/mapa';
import {
  tienePermisoRuta,
  MATRIZ_ROLES,
  RolSistema,
} from '@/shared/constants/roles-permisos';

/**
 * @description Pantalla principal de Dashboard agronómico inteligente con monitoreo geoespacial en tiempo real.
 */
export default function DashboardScreen() {
  const router = useRouter();
  const usuario = useAuthStore((state) => state.usuario);
  const rolActual = (usuario?.rol || 'ADMINISTRADOR') as RolSistema;
  const defRol = MATRIZ_ROLES[rolActual] || MATRIZ_ROLES.OPERADOR;

  const puedeAccederParcelas = tienePermisoRuta(rolActual, '/parcelas');
  const puedeAccederCultivos = tienePermisoRuta(rolActual, '/cultivos');
  const puedeAccederUsuarios = tienePermisoRuta(rolActual, '/usuarios');
  const puedeAccederDiagnosticos = tienePermisoRuta(rolActual, '/diagnostico');
  const puedeAccederActividades = tienePermisoRuta(rolActual, '/actividades');

  const { data: parcelasData, isLoading: cargandoParcelas } = useParcelasQuery({ limite: 100 });
  const { data: cultivosData } = useCultivosQuery();

  const parcelas = parcelasData?.items || [];
  const totalParcelas = parcelasData?.total ?? parcelas.length;
  const totalCultivos = cultivosData?.length ?? 0;

  const totalHectareas = useMemo(() => {
    const suma = parcelas.reduce((acc, p) => acc + (Number(p.areaHectareas) || 0), 0);
    return Number(suma.toFixed(2));
  }, [parcelas]);

  const nombreMostrar = usuario
    ? usuario.nombreCompleto || `${usuario.nombres} ${usuario.apellidos}`
    : 'Administrador';

  return (
    <AppLayout
      titulo="Panel de Control Agronómico"
      subtitulo={`Bienvenido, ${nombreMostrar} · Rol: ${defRol.etiqueta}`}
    >
      <ScrollView
        style={styles.scroll}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Banner de Bienvenida */}
        <Card estilo={styles.bannerHero}>
          <View style={styles.bannerInfo}>
            <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
              <Badge texto="TEMPORADA 2026-II" variante="exito" />
              <Badge texto={defRol.etiqueta.toUpperCase()} variante="info" />
            </View>
            <Text style={styles.bannerTitulo}>Monitoreo Centralizado de Operaciones</Text>
            <Text style={styles.bannerSubtitulo}>{defRol.descripcion}</Text>
          </View>
          {puedeAccederParcelas ? (
            <View style={styles.bannerBotonWrapper}>
              <Boton
                titulo="Gestionar Parcelas"
                variante="primario"
                iconoDerecha={<ArrowRight size={16} color={Palette.white} />}
                onPress={() => router.push('/parcelas' as Href)}
              />
            </View>
          ) : puedeAccederActividades ? (
            <View style={styles.bannerBotonWrapper}>
              <Boton
                titulo="Gestionar Labores"
                variante="primario"
                iconoDerecha={<ArrowRight size={16} color={Palette.white} />}
                onPress={() => router.push('/actividades' as Href)}
              />
            </View>
          ) : puedeAccederDiagnosticos ? (
            <View style={styles.bannerBotonWrapper}>
              <Boton
                titulo="Ver Diagnósticos"
                variante="primario"
                iconoDerecha={<ArrowRight size={16} color={Palette.white} />}
                onPress={() => router.push('/diagnostico' as Href)}
              />
            </View>
          ) : null}
        </Card>

        {/* Tarjetas de Métricas Rápidas */}
        <View style={styles.gridMetricas}>
          {/* Métrica: Parcelas */}
          {puedeAccederParcelas ? (
            <Pressable
              style={styles.columnaMetrica}
              onPress={() => router.push('/parcelas' as Href)}
            >
              <Card estilo={styles.tarjetaMetrica}>
                <View style={styles.iconoMetricaWrapper}>
                  <MapPin size={22} color={Palette.forestGreen} />
                </View>
                <Text style={styles.valorMetrica}>
                  {cargandoParcelas ? '...' : totalParcelas}
                </Text>
                <Text style={styles.etiquetaMetrica}>Parcelas Delimitadas</Text>
                <View style={styles.badgeMetricaFila}>
                  <TrendingUp size={14} color={Palette.success} />
                  <Text style={styles.textoTrending}>{totalHectareas} ha totales</Text>
                </View>
              </Card>
            </Pressable>
          ) : (
            <View style={styles.columnaMetrica}>
              <Card estilo={styles.tarjetaMetrica}>
                <View style={styles.iconoMetricaWrapper}>
                  <MapPin size={22} color={Palette.forestGreen} />
                </View>
                <Text style={styles.valorMetrica}>
                  {cargandoParcelas ? '...' : totalParcelas}
                </Text>
                <Text style={styles.etiquetaMetrica}>Parcelas del Fundo</Text>
                <Text style={styles.subtextoMetrica}>{totalHectareas} ha totales</Text>
              </Card>
            </View>
          )}

          {/* Métrica: Cultivos */}
          {puedeAccederCultivos ? (
            <Pressable
              style={styles.columnaMetrica}
              onPress={() => router.push('/cultivos' as Href)}
            >
              <Card estilo={styles.tarjetaMetrica}>
                <View style={styles.iconoMetricaWrapper}>
                  <Sprout size={22} color={Palette.forestGreen} />
                </View>
                <Text style={styles.valorMetrica}>{totalCultivos || 8}</Text>
                <Text style={styles.etiquetaMetrica}>Variedades en Ciclo</Text>
                <Text style={styles.subtextoMetrica}>Palto, Arándano, Vid, etc.</Text>
              </Card>
            </Pressable>
          ) : (
            <View style={styles.columnaMetrica}>
              <Card estilo={styles.tarjetaMetrica}>
                <View style={styles.iconoMetricaWrapper}>
                  <Sprout size={22} color={Palette.forestGreen} />
                </View>
                <Text style={styles.valorMetrica}>{totalCultivos || 8}</Text>
                <Text style={styles.etiquetaMetrica}>Especies Agrícolas</Text>
                <Text style={styles.subtextoMetrica}>Variedades activas</Text>
              </Card>
            </View>
          )}

          {/* Métrica Condicional: Usuarios (Admin) o Diagnósticos (Agrónomo/Supervisor) */}
          {puedeAccederUsuarios ? (
            <Pressable
              style={styles.columnaMetrica}
              onPress={() => router.push('/usuarios' as Href)}
            >
              <Card estilo={styles.tarjetaMetrica}>
                <View style={styles.iconoMetricaWrapper}>
                  <Users size={22} color={Palette.forestGreen} />
                </View>
                <Text style={styles.valorMetrica}>62</Text>
                <Text style={styles.etiquetaMetrica}>Personal y Cuadrillas</Text>
                <View style={styles.badgeMetricaFila}>
                  <TrendingUp size={14} color={Palette.success} />
                  <Text style={styles.textoTrending}>Operaciones activas</Text>
                </View>
              </Card>
            </Pressable>
          ) : puedeAccederDiagnosticos ? (
            <Pressable
              style={styles.columnaMetrica}
              onPress={() => router.push('/diagnostico' as Href)}
            >
              <Card estilo={styles.tarjetaMetrica}>
                <View style={styles.iconoMetricaWrapper}>
                  <ScanLine size={22} color={Palette.forestGreen} />
                </View>
                <Text style={styles.valorMetrica}>100%</Text>
                <Text style={styles.etiquetaMetrica}>Índice Salud Foliar</Text>
                <View style={styles.badgeMetricaFila}>
                  <TrendingUp size={14} color={Palette.success} />
                  <Text style={styles.textoTrending}>Vuelos actualizados</Text>
                </View>
              </Card>
            </Pressable>
          ) : (
            <View style={styles.columnaMetrica}>
              <Card estilo={styles.tarjetaMetrica}>
                <View style={styles.iconoMetricaWrapper}>
                  <Activity size={22} color={Palette.forestGreen} />
                </View>
                <Text style={styles.valorMetrica}>Activo</Text>
                <Text style={styles.etiquetaMetrica}>Jornada en Curso</Text>
                <Text style={styles.subtextoMetrica}>Fundo Santa Elena</Text>
              </Card>
            </View>
          )}

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

        {/* Visor Satelital Geoespacial de TODAS las Parcelas */}
        <MapaGeneralParcelas
          parcelas={parcelas}
          titulo="Monitoreo Satelital de Predios y Lotes"
          subtitulo="Pase el cursor sobre un lote para vista rápida o seleccione en el explorador lateral"
          mostrarResumen={true}
        />

        {/* Módulos de Acceso Directo Habilitados para el Rol */}
        <Text style={styles.seccionTitulo}>Módulos Habilitados para tu Rol ({defRol.etiqueta})</Text>
        <View style={styles.gridAccesos}>
          {/* Módulo: Parcelas */}
          {puedeAccederParcelas && (
            <Pressable
              style={styles.columnaAcceso}
              onPress={() => router.push('/parcelas' as Href)}
            >
              <Card estilo={styles.tarjetaAcceso}>
                <View style={styles.iconoAccesoContenedor}>
                  <Layers size={24} color={Palette.forestGreen} />
                </View>
                <Text style={styles.tituloAcceso}>Gestión de Parcelas</Text>
                <Text style={styles.descripcionAcceso}>
                  Delimitación satelital interactiva, cálculo geodésico de áreas y asignación de cultivos.
                </Text>
                <View style={styles.enlaceAccesoFila}>
                  <Text style={styles.textoEnlaceAcceso}>Explorar listado de lotes</Text>
                  <ArrowRight size={14} color={Palette.forestGreen} />
                </View>
              </Card>
            </Pressable>
          )}

          {/* Módulo: Cultivos */}
          {puedeAccederCultivos && (
            <Pressable
              style={styles.columnaAcceso}
              onPress={() => router.push('/cultivos' as Href)}
            >
              <Card estilo={styles.tarjetaAcceso}>
                <View style={styles.iconoAccesoContenedor}>
                  <Sprout size={24} color={Palette.forestGreen} />
                </View>
                <Text style={styles.tituloAcceso}>Catálogo de Cultivos</Text>
                <Text style={styles.descripcionAcceso}>
                  Registro de especies, ventanas fenológicas, paleta de colores y requerimientos.
                </Text>
                <View style={styles.enlaceAccesoFila}>
                  <Text style={styles.textoEnlaceAcceso}>Ver catálogo de cultivos</Text>
                  <ArrowRight size={14} color={Palette.forestGreen} />
                </View>
              </Card>
            </Pressable>
          )}

          {/* Módulo: Usuarios (Solo Administrador) */}
          {puedeAccederUsuarios && (
            <Pressable
              style={styles.columnaAcceso}
              onPress={() => router.push('/usuarios' as Href)}
            >
              <Card estilo={styles.tarjetaAcceso}>
                <View style={styles.iconoAccesoContenedor}>
                  <Users size={24} color={Palette.forestGreen} />
                </View>
                <Text style={styles.tituloAcceso}>Personal y Accesos</Text>
                <Text style={styles.descripcionAcceso}>
                  Alta de colaboradores, asignación de roles técnicos y supervisores agrícolas.
                </Text>
                <View style={styles.enlaceAccesoFila}>
                  <Text style={styles.textoEnlaceAcceso}>Ver listado de personal</Text>
                  <ArrowRight size={14} color={Palette.forestGreen} />
                </View>
              </Card>
            </Pressable>
          )}

          {/* Módulo: Actividades Agrícolas / Cuadrillas (Admin, Agrónomo, Supervisor) */}
          {puedeAccederActividades && (
            <Pressable
              style={styles.columnaAcceso}
              onPress={() => router.push('/actividades' as Href)}
            >
              <Card estilo={styles.tarjetaAcceso}>
                <View style={styles.iconoAccesoContenedor}>
                  <CalendarCheck size={24} color={Palette.forestGreen} />
                </View>
                <Text style={styles.tituloAcceso}>
                  {rolActual === 'SUPERVISOR'
                    ? 'Cuadrillas y Labores'
                    : rolActual === 'AGRONOMO'
                      ? 'Planificación de Labores'
                      : 'Actividades Agrícolas'}
                </Text>
                <Text style={styles.descripcionAcceso}>
                  {rolActual === 'SUPERVISOR'
                    ? 'Conformación de cuadrillas de operarios, asignación de turnos y reporte en campo.'
                    : rolActual === 'AGRONOMO'
                      ? 'Prescripción técnica de labores (riego, poda, nutrición) asignando al Supervisor a cargo.'
                      : 'Planificación integral de labores de campo, asignación de cuadrillas y control de insumos.'}
                </Text>
                <View style={styles.enlaceAccesoFila}>
                  <Text style={styles.textoEnlaceAcceso}>
                    {rolActual === 'SUPERVISOR' ? 'Gestionar cuadrillas y tareas' : 'Ver actividades de campo'}
                  </Text>
                  <ArrowRight size={14} color={Palette.forestGreen} />
                </View>
              </Card>
            </Pressable>
          )}

          {/* Módulo: Diagnóstico IA (Admin, Agrónomo, Supervisor) */}
          {puedeAccederDiagnosticos && (
            <Pressable
              style={styles.columnaAcceso}
              onPress={() => router.push('/diagnostico' as Href)}
            >
              <Card estilo={styles.tarjetaAcceso}>
                <View style={styles.iconoAccesoContenedor}>
                  <ScanLine size={24} color={Palette.forestGreen} />
                </View>
                <Text style={styles.tituloAcceso}>Diagnóstico IA</Text>
                <Text style={styles.descripcionAcceso}>
                  Detección fitosanitaria, estado foliar y anomalías mediante visión computacional.
                </Text>
                <View style={styles.enlaceAccesoFila}>
                  <Text style={styles.textoEnlaceAcceso}>Ir a diagnósticos de campo</Text>
                  <ArrowRight size={14} color={Palette.forestGreen} />
                </View>
              </Card>
            </Pressable>
          )}

          {/* Tarjeta Informativa de Operador */}
          {rolActual === 'OPERADOR' && (
            <View style={styles.columnaAcceso}>
              <Card estilo={styles.tarjetaAcceso}>
                <View style={styles.iconoAccesoContenedor}>
                  <Activity size={24} color={Palette.forestGreen} />
                </View>
                <Text style={styles.tituloAcceso}>Panel Operativo de Campo</Text>
                <Text style={styles.descripcionAcceso}>
                  En preparación: Consulta de tareas asignadas del día, registro de horas y reporte de labores agrícolas.
                </Text>
                <View style={styles.enlaceAccesoFila}>
                  <Text style={styles.textoEnlaceAcceso}>Labores operativas al día</Text>
                </View>
              </Card>
            </View>
          )}
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
  scrollContent: {
    paddingBottom: 40,
  },
  bannerHero: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 22,
    marginBottom: 20,
    backgroundColor: '#FAF7F0',
    borderRadius: 14,
    gap: 16,
  },
  bannerInfo: {
    flex: 1,
    minWidth: 260,
    gap: 8,
  },
  bannerTitulo: {
    fontSize: 21,
    fontWeight: '800',
    color: Palette.text,
    letterSpacing: -0.3,
  },
  bannerSubtitulo: {
    fontSize: 13.5,
    color: Palette.textSecondary,
    lineHeight: 19,
  },
  bannerBotonWrapper: {
    alignSelf: 'center',
  },
  gridMetricas: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 14,
    marginBottom: 20,
  },
  columnaMetrica: {
    flexGrow: 1,
    flexBasis: 200,
    minWidth: 150,
  },
  tarjetaMetrica: {
    padding: 18,
    gap: 6,
  },
  iconoMetricaWrapper: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: '#EBF2E5',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  valorMetrica: {
    fontSize: 24,
    fontWeight: '800',
    color: Palette.text,
  },
  etiquetaMetrica: {
    fontSize: 12.5,
    fontWeight: '700',
    color: Palette.text,
  },
  subtextoMetrica: {
    fontSize: 11.5,
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
    marginBottom: 14,
  },
  gridAccesos: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 14,
  },
  columnaAcceso: {
    flexGrow: 1,
    flexBasis: 240,
    minWidth: 240,
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
