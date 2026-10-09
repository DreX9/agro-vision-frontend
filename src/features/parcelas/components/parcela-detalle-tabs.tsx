import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView, Linking } from 'react-native';
import {
  Info,
  MapPin,
  Calendar,
  User,
  Sprout,
  Compass,
  Layers,
  ExternalLink,
  Map as MapIcon,
  CheckCircle2,
} from 'lucide-react-native';
import { Palette } from '@/constants/theme';
import { Badge } from '@/shared/components/ui';
import { MapaDelimitador } from '@/shared/components/mapa/mapa-delimitador';
import { ParcelaItem, EstadoParcelaTipo } from '../types/parcela.types';
import { type CoordenadaPunto, extraerPuntosPoligono } from '@/shared/utils/geometria';
import { useCultivosQuery } from '@/features/cultivos';

export interface ParcelaDetalleTabsProps {
  parcela: ParcelaItem;
}

/**
 * @description Vista técnica estructurada por pestañas (Tabs) para inspeccionar la ficha
 * agronómica y la delimitación satelital georreferenciada de una parcela.
 */
export const ParcelaDetalleTabs: React.FC<ParcelaDetalleTabsProps> = ({ parcela }) => {
  const [tabActivo, setTabActivo] = useState<'info' | 'mapa'>('info');

  const obtenerVarianteEstado = (
    estado: EstadoParcelaTipo,
  ): 'exito' | 'info' | 'alerta' | 'peligro' | 'neutro' => {
    switch (estado) {
      case 'ACTIVA':
        return 'exito';
      case 'EN_PREPARACION':
        return 'info';
      case 'EN_DESCANSO':
        return 'alerta';
      case 'COSECHADA':
        return 'neutro';
      case 'INACTIVA':
        return 'peligro';
      default:
        return 'neutro';
    }
  };

  const formatearEstadoTexto = (estado: EstadoParcelaTipo): string => {
    switch (estado) {
      case 'ACTIVA':
        return 'Activa en producción';
      case 'EN_PREPARACION':
        return 'En preparación';
      case 'EN_DESCANSO':
        return 'En descanso';
      case 'COSECHADA':
        return 'Cosechada';
      case 'INACTIVA':
        return 'Inactiva';
      default:
        return estado;
    }
  };

  const { data: cultivos = [] } = useCultivosQuery();
  const cultivoEncontrado = cultivos.find((c) => c.id === parcela.cultivoId);
  const colorCosecha = cultivoEncontrado?.colorHex || parcela.cultivoColorHex || '#2E7D32';
  const nombreCultivo = cultivoEncontrado?.nombre || parcela.cultivoNombre || 'Cultivo asignado';

  // Extraer puntos del polígono desde delimitacionGeoJson con soporte para arrays, GeoJSON y strings
  const puntosPoligono = extraerPuntosPoligono(parcela.delimitacionGeoJson);
  const centroLat = parcela.latitudCentro ?? (puntosPoligono[0]?.latitude || -13.0768);
  const centroLng = parcela.longitudCentro ?? (puntosPoligono[0]?.longitude || -76.3854);

  const abrirEnGoogleMaps = () => {
    if (parcela.latitudCentro && parcela.longitudCentro) {
      const url = `https://www.google.com/maps/search/?api=1&query=${parcela.latitudCentro},${parcela.longitudCentro}`;
      Linking.openURL(url);
    }
  };

  return (
    <View style={styles.contenedor}>
      {/* Selector de pestañas */}
      <View style={styles.barraTabs}>
        <Pressable
          onPress={() => setTabActivo('info')}
          style={[styles.botonTab, tabActivo === 'info' && styles.botonTabActivo]}
        >
          <Info size={16} color={tabActivo === 'info' ? Palette.forestGreen : '#6B7280'} />
          <Text style={[styles.textoTab, tabActivo === 'info' && styles.textoTabActivo]}>
            Información Agronómica y Predio
          </Text>
        </Pressable>

        <Pressable
          onPress={() => setTabActivo('mapa')}
          style={[styles.botonTab, tabActivo === 'mapa' && styles.botonTabActivo]}
        >
          <MapIcon size={16} color={tabActivo === 'mapa' ? Palette.forestGreen : '#6B7280'} />
          <Text style={[styles.textoTab, tabActivo === 'mapa' && styles.textoTabActivo]}>
            Georreferenciación y Mapa Satelital ({puntosPoligono.length} vértices)
          </Text>
        </Pressable>
      </View>

      {/* Contenido según pestaña activa */}
      <ScrollView contentContainerStyle={styles.contenidoScroll} showsVerticalScrollIndicator={false}>
        {tabActivo === 'info' ? (
          <View style={styles.bloqueTab}>
            {/* Cabecera del predio */}
            <View style={styles.tarjetaFicha}>
              <View style={styles.cabeceraFicha}>
                <View>
                  <Text style={styles.codigoLote}>{parcela.codigo}</Text>
                  <Text style={styles.tituloLote}>{parcela.nombre}</Text>
                </View>
                <Badge
                  texto={formatearEstadoTexto(parcela.estado)}
                  variante={obtenerVarianteEstado(parcela.estado)}
                />
              </View>

              <View style={styles.grillaMetadatos}>
                <View style={styles.itemMeta}>
                  <Sprout size={16} color={colorCosecha} />
                  <View>
                    <Text style={styles.etiquetaMeta}>Cultivo Instalado</Text>
                    <View style={styles.filaCultivoTab}>
                      <View style={[styles.puntoColorPill, { backgroundColor: colorCosecha }]} />
                      <Text style={styles.valorMeta}>
                        {nombreCultivo}
                        {parcela.variedad ? ` (${parcela.variedad})` : ''}
                      </Text>
                    </View>
                  </View>
                </View>

                <View style={styles.itemMeta}>
                  <User size={16} color={Palette.forestGreen} />
                  <View>
                    <Text style={styles.etiquetaMeta}>Supervisor Agronómico</Text>
                    <Text style={styles.valorMeta}>
                      {parcela.usuarioResponsableNombre || 'Sin supervisor asignado'}
                    </Text>
                  </View>
                </View>

                <View style={styles.itemMeta}>
                  <Layers size={16} color={Palette.forestGreen} />
                  <View>
                    <Text style={styles.etiquetaMeta}>Superficie Total</Text>
                    <Text style={styles.valorMeta}>
                      {Number(parcela.areaHectareas).toFixed(2)} hectáreas (ha)
                    </Text>
                  </View>
                </View>

                <View style={styles.itemMeta}>
                  <Calendar size={16} color={Palette.forestGreen} />
                  <View>
                    <Text style={styles.etiquetaMeta}>Fecha de Registro</Text>
                    <Text style={styles.valorMeta}>
                      {new Date(parcela.createdAt).toLocaleDateString('es-PE', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric',
                      })}
                    </Text>
                  </View>
                </View>
              </View>
            </View>

            {/* Localización y Jurisdicción */}
            <View style={styles.tarjetaFicha}>
              <Text style={styles.tituloSeccion}>Localización Política y Predial</Text>
              <View style={styles.grillaMetadatos}>
                <View style={styles.itemMeta}>
                  <MapPin size={16} color={Palette.forestGreen} />
                  <View>
                    <Text style={styles.etiquetaMeta}>Departamento</Text>
                    <Text style={styles.valorMeta}>{parcela.departamento || 'No especificado'}</Text>
                  </View>
                </View>

                <View style={styles.itemMeta}>
                  <MapPin size={16} color={Palette.forestGreen} />
                  <View>
                    <Text style={styles.etiquetaMeta}>Provincia</Text>
                    <Text style={styles.valorMeta}>{parcela.provincia || 'No especificado'}</Text>
                  </View>
                </View>

                <View style={styles.itemMeta}>
                  <MapPin size={16} color={Palette.forestGreen} />
                  <View>
                    <Text style={styles.etiquetaMeta}>Distrito</Text>
                    <Text style={styles.valorMeta}>{parcela.distrito || 'No especificado'}</Text>
                  </View>
                </View>

                <View style={styles.itemMeta}>
                  <Compass size={16} color={Palette.forestGreen} />
                  <View>
                    <Text style={styles.etiquetaMeta}>Centroide GPS</Text>
                    <Text style={styles.valorMeta}>
                      {parcela.latitudCentro !== null && parcela.longitudCentro !== null
                        ? `${Number(parcela.latitudCentro).toFixed(6)}, ${Number(parcela.longitudCentro).toFixed(6)}`
                        : 'Sin coordenadas calculadas'}
                    </Text>
                  </View>
                </View>
              </View>

              {parcela.ubicacion ? (
                <View style={styles.cajaTexto}>
                  <Text style={styles.subtituloTexto}>Ubicación Detallada / Fundo:</Text>
                  <Text style={styles.cuerpoTexto}>{parcela.ubicacion}</Text>
                </View>
              ) : null}
            </View>
          </View>
        ) : (
          /* Tab Georreferenciación y Mapa */
          <View style={styles.bloqueTab}>
            {/* Mapa Satelital Interactivo */}
            <View style={styles.tarjetaFicha}>
              <View style={styles.cabeceraMapa}>
                <View>
                  <View style={styles.filaTituloMapa}>
                    <Text style={styles.tituloSeccion}>Inspección Satelital del Perímetro</Text>
                    <View style={[styles.badgeCultivoSatelital, { borderColor: colorCosecha }]}>
                      <View style={[styles.puntoColorPill, { backgroundColor: colorCosecha }]} />
                      <Text style={[styles.textoBadgeCultivo, { color: colorCosecha }]}>
                        {nombreCultivo}
                      </Text>
                    </View>
                  </View>
                  <Text style={styles.subtituloMapa}>
                    Superficie delimitada: {Number(parcela.areaHectareas).toFixed(4)} ha • {puntosPoligono.length} vértices
                  </Text>
                </View>

                {parcela.latitudCentro && parcela.longitudCentro ? (
                  <Pressable
                    onPress={abrirEnGoogleMaps}
                    style={({ pressed }) => [styles.botonGoogleMaps, pressed && styles.botonGoogleMapsPresionado]}
                  >
                    <ExternalLink size={14} color="#1D4ED8" />
                    <Text style={styles.textoGoogleMaps}>Abrir en Google Maps</Text>
                  </Pressable>
                ) : null}
              </View>

              <MapaDelimitador
                puntosIniciales={puntosPoligono}
                centroInicial={{ lat: Number(centroLat), lng: Number(centroLng) }}
                altura={420}
                soloLectura={true}
                colorPoligono={colorCosecha}
              />
            </View>

            {/* Vértices perimetrales */}
            <View style={styles.tarjetaFicha}>
              <Text style={styles.tituloSeccion}>Coordenadas de los Vértices ({puntosPoligono.length})</Text>
              {puntosPoligono.length === 0 ? (
                <Text style={styles.textoVacio}>No se registraron vértices para esta parcela.</Text>
              ) : (
                <View style={styles.grillaVertices}>
                  {puntosPoligono.map((pt, index) => (
                    <View key={index} style={styles.tarjetaVertice}>
                      <View style={styles.badgeVertice}>
                        <CheckCircle2 size={12} color={colorCosecha} />
                        <Text style={[styles.textoNumVertice, { color: colorCosecha }]}>V#{index + 1}</Text>
                      </View>
                      <Text style={styles.coordenadaVertice}>
                        Lat: {pt.latitude.toFixed(6)}
                      </Text>
                      <Text style={styles.coordenadaVertice}>
                        Lng: {pt.longitude.toFixed(6)}
                      </Text>
                    </View>
                  ))}
                </View>
              )}
            </View>
          </View>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  contenedor: { flex: 1 },
  barraTabs: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2EBDC',
    paddingHorizontal: 16,
  },
  botonTab: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  botonTabActivo: { borderBottomColor: Palette.forestGreen },
  textoTab: { fontSize: 13, fontWeight: '600', color: '#6B7280' },
  textoTabActivo: { color: Palette.forestGreen, fontWeight: '800' },
  contenidoScroll: { padding: 16, gap: 16, maxWidth: 960, width: '100%', alignSelf: 'center' },
  bloqueTab: { gap: 16 },
  tarjetaFicha: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#D0DEC8',
    padding: 18,
    gap: 14,
  },
  cabeceraFicha: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
    paddingBottom: 12,
  },
  codigoLote: { fontSize: 12, fontWeight: '700', color: Palette.forestGreen, textTransform: 'uppercase' },
  tituloLote: { fontSize: 18, fontWeight: '700', color: '#111827', marginTop: 2 },
  grillaMetadatos: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  itemMeta: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    minWidth: 200,
    flex: 1,
  },
  etiquetaMeta: { fontSize: 11, fontWeight: '600', color: '#6B7280', textTransform: 'uppercase' },
  valorMeta: { fontSize: 13, fontWeight: '600', color: '#1F2937', marginTop: 2 },
  cajaTexto: {
    backgroundColor: '#F9FAFB',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  subtituloTexto: { fontSize: 12, fontWeight: '700', color: '#374151', marginBottom: 4 },
  cuerpoTexto: { fontSize: 13, color: '#4B5563', lineHeight: 18 },
  tituloSeccion: { fontSize: 15, fontWeight: '700', color: '#111827' },
  subtituloMapa: { fontSize: 12, color: '#6B7280', marginTop: 2 },
  cabeceraMapa: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  botonGoogleMaps: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 6,
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  botonGoogleMapsPresionado: { opacity: 0.8 },
  textoGoogleMaps: { fontSize: 12, fontWeight: '600', color: '#1D4ED8' },
  textoVacio: { fontSize: 13, color: '#6B7280', fontStyle: 'italic', paddingVertical: 8 },
  grillaVertices: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tarjetaVertice: {
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    padding: 8,
    minWidth: 160,
  },
  badgeVertice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 4,
  },
  textoNumVertice: {
    fontSize: 11,
    fontWeight: '700',
    color: Palette.forestGreen,
  },
  coordenadaVertice: {
    fontSize: 11,
    color: '#4B5563',
    fontFamily: 'monospace',
  },
  filaCultivoTab: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 2,
  },
  puntoColorPill: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  filaTituloMapa: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flexWrap: 'wrap',
  },
  badgeCultivoSatelital: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    borderWidth: 1,
    backgroundColor: '#F9FAFB',
  },
  textoBadgeCultivo: {
    fontSize: 12,
    fontWeight: '700',
  },
});
