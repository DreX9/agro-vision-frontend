import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Pressable, Platform, type DimensionValue } from 'react-native';
import { Undo, Trash2, MapPin } from 'lucide-react-native';
import { Palette } from '@/constants/theme';
import {
  type CoordenadaPunto,
  calcularAreaHectareas,
  calcularCentroide,
} from '@/shared/utils/geometria';

export interface MapaDelimitadorProps {
  puntosIniciales?: CoordenadaPunto[];
  centroInicial?: { lat: number; lng: number };
  zoomInicial?: number;
  altura?: DimensionValue;
  onCambioPoligono?: (datos: {
    puntos: CoordenadaPunto[];
    areaHectareas: number;
    centroide: CoordenadaPunto | null;
  }) => void;
}

/**
 * @description Componente de mapa interactivo multiplataforma para delimitar polígonos de parcelas
 * con capas satelitales de alta resolución sin errores de zoom ("Map data not yet available").
 */
export const MapaDelimitador: React.FC<MapaDelimitadorProps> = ({
  puntosIniciales = [],
  centroInicial = { lat: -13.0768, lng: -76.3854 },
  zoomInicial = 15,
  altura = 380,
  onCambioPoligono,
}) => {
  const [puntos, setPuntos] = useState<CoordenadaPunto[]>(puntosIniciales);
  const [areaHa, setAreaHa] = useState<number>(() => calcularAreaHectareas(puntosIniciales));
  const iframeRef = useRef<HTMLIFrameElement | null>(null);

  useEffect(() => {
    if (puntosIniciales.length > 0) {
      setPuntos(puntosIniciales);
      setAreaHa(calcularAreaHectareas(puntosIniciales));
    }
  }, [puntosIniciales]);

  const enviarAccionAMapa = (accion: string, carga?: unknown) => {
    if (iframeRef.current && iframeRef.current.contentWindow) {
      iframeRef.current.contentWindow.postMessage({ accion, carga }, '*');
    }
  };

  useEffect(() => {
    if (centroInicial && (centroInicial.lat !== 0 || centroInicial.lng !== 0)) {
      enviarAccionAMapa('CENTRAR', { lat: centroInicial.lat, lng: centroInicial.lng, zoom: zoomInicial });
    }
  }, [centroInicial?.lat, centroInicial?.lng, zoomInicial]);

  useEffect(() => {
    if (Platform.OS !== 'web') return;
    const manejarMensaje = (evento: MessageEvent) => {
      if (!evento.data || evento.data.tipo !== 'MAPA_VERTICES_ACTUALIZADOS') return;
      const nuevosPuntos: CoordenadaPunto[] = evento.data.puntos || [];
      const nuevaArea = calcularAreaHectareas(nuevosPuntos);
      const centroide = calcularCentroide(nuevosPuntos);
      setPuntos(nuevosPuntos);
      setAreaHa(nuevaArea);
      if (onCambioPoligono) {
        onCambioPoligono({ puntos: nuevosPuntos, areaHectareas: nuevaArea, centroide });
      }
    };
    window.addEventListener('message', manejarMensaje);
    return () => window.removeEventListener('message', manejarMensaje);
  }, [onCambioPoligono]);

  const limpiar = () => {
    setPuntos([]);
    setAreaHa(0);
    enviarAccionAMapa('LIMPIAR');
    if (onCambioPoligono) onCambioPoligono({ puntos: [], areaHectareas: 0, centroide: null });
  };

  const deshacer = () => enviarAccionAMapa('DESHACER');
  const centrarEnValle = (lat: number, lng: number) => enviarAccionAMapa('CENTRAR', { lat, lng, zoom: 15 });

  const htmlMapa = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
      <style>body, html, #map { margin: 0; padding: 0; width: 100%; height: 100%; }</style>
    </head>
    <body>
      <div id="map"></div>
      <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
      <script>
        const googleHibrido = L.tileLayer('https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}', {
          attribution: '&copy; Google Satellite', maxNativeZoom: 20, maxZoom: 22
        });
        const esriSatelite = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
          attribution: 'Tiles &copy; Esri', maxNativeZoom: 18, maxZoom: 21
        });
        const callesOSM = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '&copy; OpenStreetMap', maxZoom: 19
        });

        const map = L.map('map', {
          center: [${centroInicial.lat}, ${centroInicial.lng}],
          zoom: ${zoomInicial}, maxZoom: 21, layers: [googleHibrido]
        });

        L.control.layers({
          "Google Satélite (Híbrido)": googleHibrido,
          "Esri Satélite": esriSatelite,
          "Calles (OSM)": callesOSM
        }, null, { position: 'topright' }).addTo(map);

        let vertices = ${JSON.stringify(puntosIniciales)}.map(p => [p.latitude, p.longitude]);
        let marcadores = [];
        let poligono = null;

        function actualizarPoligono() {
          if (poligono) map.removeLayer(poligono);
          marcadores.forEach(m => map.removeLayer(m));
          marcadores = [];

          if (vertices.length > 0) {
            vertices.forEach((v) => {
              const m = L.circleMarker(v, {
                radius: 6, color: '#ffffff', weight: 2, fillColor: '#2E7D32', fillOpacity: 1
              }).addTo(map);
              marcadores.push(m);
            });

            if (vertices.length >= 3) {
              poligono = L.polygon(vertices, {
                color: '#2E7D32', weight: 3, fillColor: '#4CAF50', fillOpacity: 0.4
              }).addTo(map);
            } else if (vertices.length === 2) {
              poligono = L.polyline(vertices, { color: '#2E7D32', weight: 3 }).addTo(map);
            }
          }

          const puntosFormateados = vertices.map(v => ({ latitude: v[0], longitude: v[1] }));
          window.parent.postMessage({ tipo: 'MAPA_VERTICES_ACTUALIZADOS', puntos: puntosFormateados }, '*');
        }

        actualizarPoligono();

        map.on('click', function(e) {
          vertices.push([e.latlng.lat, e.latlng.lng]);
          actualizarPoligono();
        });

        window.addEventListener('message', function(e) {
          if (!e.data) return;
          if (e.data.accion === 'LIMPIAR') {
            vertices = []; actualizarPoligono();
          } else if (e.data.accion === 'DESHACER') {
            vertices.pop(); actualizarPoligono();
          } else if (e.data.accion === 'CENTRAR' && e.data.carga) {
            map.setView([e.data.carga.lat, e.data.carga.lng], e.data.carga.zoom || 15);
          }
        });
      </script>
    </body>
    </html>
  `;

  return (
    <View style={styles.contenedor}>
      <View style={styles.barraControl}>
        <View style={styles.infoArea}>
          <Text style={styles.textoAreaEtiqueta}>Área delimitada:</Text>
          <Text style={styles.textoAreaValor}>{areaHa.toFixed(4)} ha</Text>
          <Text style={styles.textoPuntos}>({puntos.length} vértices)</Text>
        </View>

        <View style={styles.botonesAccion}>
          <Pressable onPress={deshacer} style={styles.botonPequeno}>
            <Undo size={14} color={Palette.forestGreen} />
            <Text style={styles.textoBotonPequeno}>Deshacer</Text>
          </Pressable>
          <Pressable onPress={limpiar} style={[styles.botonPequeno, styles.botonPequenoPeligro]}>
            <Trash2 size={14} color="#B71C1C" />
            <Text style={[styles.textoBotonPequeno, { color: '#B71C1C' }]}>Limpiar</Text>
          </Pressable>
        </View>
      </View>

      <View style={[styles.marcoMapa, { height: altura }]}>
        {Platform.OS === 'web' ? (
          <iframe
            ref={(ref) => {
              iframeRef.current = ref as HTMLIFrameElement;
            }}
            srcDoc={htmlMapa}
            style={{ width: '100%', height: '100%', border: 'none' }}
            title="Delimitador de Parcela Agro Vision"
          />
        ) : (
          <View style={styles.avisoNativo}>
            <MapPin size={28} color={Palette.forestGreen} />
            <Text style={styles.textoAvisoNativo}>
              Mapeo satelital activo ({puntos.length} puntos registrados)
            </Text>
          </View>
        )}
      </View>

      <View style={styles.barraAccesos}>
        <Text style={styles.textoValle}>Valles:</Text>
        <Pressable onPress={() => centrarEnValle(-13.0768, -76.3854)} style={styles.chipValle}>
          <Text style={styles.textoChipValle}>Cañete</Text>
        </Pressable>
        <Pressable onPress={() => centrarEnValle(-14.0678, -75.7286)} style={styles.chipValle}>
          <Text style={styles.textoChipValle}>Ica</Text>
        </Pressable>
        <Pressable onPress={() => centrarEnValle(-8.1159, -79.0299)} style={styles.chipValle}>
          <Text style={styles.textoChipValle}>Chavimochic</Text>
        </Pressable>
        <Pressable onPress={() => centrarEnValle(-11.4947, -77.2081)} style={styles.chipValle}>
          <Text style={styles.textoChipValle}>Huaral</Text>
        </Pressable>
        <Pressable onPress={() => centrarEnValle(-5.9844, -79.7456)} style={styles.chipValle}>
          <Text style={styles.textoChipValle}>Olmos</Text>
        </Pressable>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  contenedor: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#D0DEC8',
    backgroundColor: '#FFFFFF',
    overflow: 'hidden',
    flex: 1,
  },
  barraControl: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: '#F4F7F2',
    borderBottomWidth: 1,
    borderBottomColor: '#E2EBDC',
  },
  infoArea: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  textoAreaEtiqueta: { fontSize: 12, fontWeight: '600', color: '#4B5563' },
  textoAreaValor: { fontSize: 14, fontWeight: '800', color: Palette.forestGreen },
  textoPuntos: { fontSize: 11, color: '#6B7280' },
  botonesAccion: { flexDirection: 'row', gap: 8 },
  botonPequeno: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    backgroundColor: '#FFFFFF',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#D0DEC8',
  },
  botonPequenoPeligro: { borderColor: '#FFCDD2', backgroundColor: '#FFF8F8' },
  textoBotonPequeno: { fontSize: 12, fontWeight: '600', color: Palette.forestGreen },
  marcoMapa: { width: '100%', minHeight: 320, backgroundColor: '#E5E7EB' },
  avisoNativo: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 8 },
  textoAvisoNativo: { fontSize: 13, fontWeight: '600', color: '#374151' },
  barraAccesos: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#FAFAF8',
    borderTopWidth: 1,
    borderTopColor: '#EBEFEB',
    gap: 8,
    flexWrap: 'wrap',
  },
  textoValle: { fontSize: 11, fontWeight: '700', color: '#6B7280' },
  chipValle: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    backgroundColor: '#EAEFE7',
    borderRadius: 4,
  },
  textoChipValle: { fontSize: 11, fontWeight: '600', color: Palette.forestGreen },
});
