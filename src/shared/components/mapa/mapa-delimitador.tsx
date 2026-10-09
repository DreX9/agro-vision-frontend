import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Pressable, Platform, type DimensionValue } from 'react-native';
import { Undo, Trash2, MapPin, Navigation, AlertTriangle, RotateCw, Move } from 'lucide-react-native';
import { Palette } from '@/constants/theme';
import {
  type CoordenadaPunto,
  calcularAreaHectareas,
  calcularCentroide,
  esPoligonoAutoIntersecante,
} from '@/shared/utils/geometria';
import { obtenerUbicacionActual } from '@/shared/utils/geocodificacion';

export interface MapaDelimitadorProps {
  puntosIniciales?: CoordenadaPunto[];
  centroInicial?: { lat: number; lng: number };
  zoomInicial?: number;
  altura?: DimensionValue;
  soloLectura?: boolean;
  colorPoligono?: string;
  onCambioPoligono?: (datos: {
    puntos: CoordenadaPunto[];
    areaHectareas: number;
    centroide: CoordenadaPunto | null;
    tieneCruce?: boolean;
  }) => void;
}

/**
 * @description Componente de mapa satelital interactivo para delimitación de parcelas
 * con puntos arrastrables (draggable), detección de polígonos cruzados y auto-corrección perimetral.
 */
export const MapaDelimitador: React.FC<MapaDelimitadorProps> = ({
  puntosIniciales = [],
  centroInicial = { lat: -13.0768, lng: -76.3854 },
  zoomInicial = 15,
  altura = 380,
  soloLectura = false,
  colorPoligono = '#2E7D32',
  onCambioPoligono,
}) => {
  const [puntos, setPuntos] = useState<CoordenadaPunto[]>(puntosIniciales);
  const [areaHa, setAreaHa] = useState<number>(() => calcularAreaHectareas(puntosIniciales));
  const [tieneCruce, setTieneCruce] = useState<boolean>(() => esPoligonoAutoIntersecante(puntosIniciales));
  const iframeRef = useRef<HTMLIFrameElement | null>(null);

  const enviarAccionAMapa = (accion: string, carga?: unknown) => {
    if (iframeRef.current && iframeRef.current.contentWindow) {
      iframeRef.current.contentWindow.postMessage({ accion, carga }, '*');
    }
  };

  useEffect(() => {
    if (puntosIniciales && puntosIniciales.length > 0) {
      setPuntos(puntosIniciales);
      setAreaHa(calcularAreaHectareas(puntosIniciales));
      setTieneCruce(esPoligonoAutoIntersecante(puntosIniciales));
      enviarAccionAMapa('CARGAR_PUNTOS', {
        puntos: puntosIniciales,
        color: colorPoligono,
      });
    }
  }, [puntosIniciales, colorPoligono]);

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
      const cruceDetectado: boolean = Boolean(evento.data.tieneCruce);
      const nuevaArea = calcularAreaHectareas(nuevosPuntos);
      const centroide = calcularCentroide(nuevosPuntos);

      setPuntos(nuevosPuntos);
      setAreaHa(nuevaArea);
      setTieneCruce(cruceDetectado);

      if (onCambioPoligono) {
        onCambioPoligono({
          puntos: nuevosPuntos,
          areaHectareas: nuevaArea,
          centroide,
          tieneCruce: cruceDetectado,
        });
      }
    };
    window.addEventListener('message', manejarMensaje);
    return () => window.removeEventListener('message', manejarMensaje);
  }, [onCambioPoligono]);

  const limpiar = () => {
    setPuntos([]);
    setAreaHa(0);
    setTieneCruce(false);
    enviarAccionAMapa('LIMPIAR');
    if (onCambioPoligono) {
      onCambioPoligono({ puntos: [], areaHectareas: 0, centroide: null, tieneCruce: false });
    }
  };

  const deshacer = () => enviarAccionAMapa('DESHACER');
  const reordenarContorno = () => enviarAccionAMapa('REORDENAR');
  const centrarEnValle = (lat: number, lng: number) => enviarAccionAMapa('CENTRAR', { lat, lng, zoom: 15 });

  const centrarEnMiUbicacion = async () => {
    const loc = await obtenerUbicacionActual();
    if (loc) {
      enviarAccionAMapa('CENTRAR', { lat: loc.lat, lng: loc.lng, zoom: 17 });
    } else {
      enviarAccionAMapa('LOCALIZAR_ACTUAL');
    }
  };

  const htmlMapa = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
      <style>
        body, html, #map { margin: 0; padding: 0; width: 100%; height: 100%; }
        .vertice-pin {
          width: 14px;
          height: 14px;
          border-radius: 50%;
          background: ${colorPoligono};
          border: 2.5px solid #ffffff;
          box-shadow: 0 2px 5px rgba(0,0,0,0.45);
          cursor: grab;
          transition: transform 0.1s ease;
        }
        .vertice-pin:hover {
          transform: scale(1.35);
          border-color: #E8F5E9;
        }
        .vertice-pin:active {
          cursor: grabbing;
        }
        .vertice-pin.error {
          background: #DC2626 !important;
          box-shadow: 0 0 8px rgba(220,38,38,0.8);
        }
        .vertice-midpoint {
          width: 10px;
          height: 10px;
          border-radius: 50%;
          background: #81C784;
          border: 2px solid #ffffff;
          box-shadow: 0 1px 4px rgba(0,0,0,0.35);
          cursor: grab;
          opacity: 0.85;
          transition: transform 0.12s ease, background 0.12s ease;
        }
        .vertice-midpoint:hover {
          transform: scale(1.45);
          background: #2E7D32;
          opacity: 1;
        }
      </style>
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

        let colorCultivo = '${colorPoligono}';
        let vertices = ${JSON.stringify(puntosIniciales)}.map(p => [p.latitude, p.longitude]);
        let marcadores = [];
        let marcadoresMedios = [];
        let poligono = null;

        function ccw(p1, p2, p3) {
          return (p3[1] - p1[1]) * (p2[0] - p1[0]) - (p3[0] - p1[0]) * (p2[1] - p1[1]);
        }
        function seCruzan(a, b, c, d) {
          const d1 = ccw(a, b, c);
          const d2 = ccw(a, b, d);
          const d3 = ccw(c, d, a);
          const d4 = ccw(c, d, b);
          return (((d1 > 0 && d2 < 0) || (d1 < 0 && d2 > 0)) &&
                  ((d3 > 0 && d4 < 0) || (d3 < 0 && d4 > 0)));
        }
        function tieneAutoInterseccion(pts) {
          if (pts.length < 4) return false;
          const n = pts.length;
          for (let i = 0; i < n; i++) {
            const a = pts[i];
            const b = pts[(i + 1) % n];
            for (let j = i + 1; j < n; j++) {
              if (j === i || j === (i + 1) % n || (i === 0 && j === n - 1)) continue;
              if (seCruzan(a, b, pts[j], pts[(j + 1) % n])) return true;
            }
          }
          return false;
        }

        function distanciaPuntoASegmento(p, a, b) {
          const x = p[0], y = p[1];
          const x1 = a[0], y1 = a[1];
          const x2 = b[0], y2 = b[1];
          const dx = x2 - x1;
          const dy = y2 - y1;
          const lenSq = dx * dx + dy * dy;
          if (lenSq === 0) {
            const dLat = x - x1;
            const dLng = y - y1;
            return dLat * dLat + dLng * dLng;
          }
          let t = ((x - x1) * dx + (y - y1) * dy) / lenSq;
          t = Math.max(0, Math.min(1, t));
          const projX = x1 + t * dx;
          const projY = y1 + t * dy;
          const dLat = x - projX;
          const dLng = y - projY;
          return dLat * dLat + dLng * dLng;
        }

        function obtenerIndiceSegmentoMasCercano(nuevoPunto, verticesActuales) {
          if (verticesActuales.length < 3) return verticesActuales.length;
          const n = verticesActuales.length;
          let menorDist = Infinity;
          let mejorIdx = n;
          for (let i = 0; i < n; i++) {
            const a = verticesActuales[i];
            const b = verticesActuales[(i + 1) % n];
            const dist = distanciaPuntoASegmento(nuevoPunto, a, b);
            if (dist < menorDist) {
              menorDist = dist;
              mejorIdx = i + 1;
            }
          }
          return mejorIdx;
        }

        function crearIcono(esError) {
          const bg = esError ? '#DC2626' : colorCultivo;
          return L.divIcon({
            className: 'vertice-wrapper',
            html: '<div class="vertice-pin ' + (esError ? 'error' : '') + '" style="background:' + bg + ';"></div>',
            iconSize: [14, 14],
            iconAnchor: [7, 7]
          });
        }

        function redibujarEnArrastre() {
          if (vertices.length >= 3) {
            const cruce = tieneAutoInterseccion(vertices);
            if (poligono) {
              poligono.setLatLngs(vertices);
              poligono.setStyle({
                color: cruce ? '#DC2626' : colorCultivo,
                fillColor: cruce ? '#EF4444' : colorCultivo,
                dashArray: cruce ? '6, 6' : null
              });
            }
          } else if (vertices.length === 2 && poligono) {
            poligono.setLatLngs(vertices);
          }
        }

        function actualizarPoligono() {
          if (poligono) map.removeLayer(poligono);
          marcadores.forEach(m => map.removeLayer(m));
          marcadores = [];
          marcadoresMedios.forEach(m => map.removeLayer(m));
          marcadoresMedios = [];

          const cruce = tieneAutoInterseccion(vertices);

        const esSoloLectura = ${soloLectura ? 'true' : 'false'};

        if (vertices.length > 0) {
          vertices.forEach((v, idx) => {
            const m = L.marker(v, {
              draggable: !esSoloLectura,
              icon: crearIcono(cruce),
              title: esSoloLectura ? 'Vértice #' + (idx + 1) : 'Vértice #' + (idx + 1) + ' (Arrastrar para mover, clic para borrar)'
            }).addTo(map);

            if (!esSoloLectura) {
              m.on('drag', function(ev) {
                const pos = ev.target.getLatLng();
                vertices[idx] = [pos.lat, pos.lng];
                redibujarEnArrastre();
              });

              m.on('dragend', function(ev) {
                const pos = ev.target.getLatLng();
                vertices[idx] = [pos.lat, pos.lng];
                actualizarPoligono();
              });

              m.on('click', function(ev) {
                L.DomEvent.stopPropagation(ev);
                vertices.splice(idx, 1);
                actualizarPoligono();
              });
            }

            marcadores.push(m);
          });

          if (vertices.length >= 3) {
            poligono = L.polygon(vertices, {
              color: cruce ? '#DC2626' : colorCultivo,
              weight: 3,
              fillColor: cruce ? '#EF4444' : colorCultivo,
              fillOpacity: 0.38,
              dashArray: cruce ? '6, 6' : null
            }).addTo(map);

            if (!esSoloLectura) {
              // Generar puntos medios (handles) en cada lado para estirar el perímetro
              for (let i = 0; i < vertices.length; i++) {
                const p1 = vertices[i];
                const p2 = vertices[(i + 1) % vertices.length];
                const medio = [(p1[0] + p2[0]) / 2, (p1[1] + p2[1]) / 2];

                const midMarker = L.marker(medio, {
                  draggable: true,
                  icon: L.divIcon({
                    className: 'midpoint-wrapper',
                    html: '<div class="vertice-midpoint"></div>',
                    iconSize: [10, 10],
                    iconAnchor: [5, 5]
                  }),
                  title: 'Arrastre para estirar este lado de la parcela'
                }).addTo(map);

                let nuevoIdx = -1;
                midMarker.on('dragstart', function(ev) {
                  const pos = ev.target.getLatLng();
                  vertices.splice(i + 1, 0, [pos.lat, pos.lng]);
                  nuevoIdx = i + 1;
                });

                midMarker.on('drag', function(ev) {
                  if (nuevoIdx >= 0) {
                    const pos = ev.target.getLatLng();
                    vertices[nuevoIdx] = [pos.lat, pos.lng];
                    redibujarEnArrastre();
                  }
                });

                midMarker.on('dragend', function() {
                  nuevoIdx = -1;
                  actualizarPoligono();
                });

                marcadoresMedios.push(midMarker);
              }
            }
          } else if (vertices.length === 2) {
            poligono = L.polyline(vertices, { color: colorCultivo, weight: 3 }).addTo(map);
          }
        }

        const puntosFormateados = vertices.map(v => ({ latitude: v[0], longitude: v[1] }));
        window.parent.postMessage({
          tipo: 'MAPA_VERTICES_ACTUALIZADOS',
          puntos: puntosFormateados,
          tieneCruce: cruce
        }, '*');
      }

      actualizarPoligono();

      if (vertices.length >= 3 && poligono) {
        try {
          map.fitBounds(poligono.getBounds(), { padding: [35, 35] });
        } catch (e) {}
      }

      map.on('click', function(e) {
        if (esSoloLectura) return;
        const nuevoPunto = [e.latlng.lat, e.latlng.lng];
        if (vertices.length < 3) {
          vertices.push(nuevoPunto);
        } else {
          const idx = obtenerIndiceSegmentoMasCercano(nuevoPunto, vertices);
          vertices.splice(idx, 0, nuevoPunto);
        }
        actualizarPoligono();
      });

        window.addEventListener('message', function(e) {
          if (!e.data) return;
          if (e.data.accion === 'LIMPIAR') {
            vertices = [];
            actualizarPoligono();
          } else if (e.data.accion === 'DESHACER') {
            vertices.pop();
            actualizarPoligono();
          } else if (e.data.accion === 'CARGAR_PUNTOS' && e.data.carga) {
            if (Array.isArray(e.data.carga.puntos)) {
              vertices = e.data.carga.puntos.map(function(p) { return [p.latitude, p.longitude]; });
              if (e.data.carga.color) {
                colorCultivo = e.data.carga.color;
              }
              actualizarPoligono();
              if (vertices.length >= 3 && poligono) {
                try {
                  map.fitBounds(poligono.getBounds(), { padding: [40, 40], maxZoom: 18 });
                } catch (err) {}
              } else if (vertices.length > 0) {
                try {
                  map.setView(vertices[0], 16);
                } catch (err) {}
              }
            }
          } else if (e.data.accion === 'REORDENAR') {
            if (vertices.length >= 3) {
              let sLat = 0, sLng = 0;
              vertices.forEach(v => { sLat += v[0]; sLng += v[1]; });
              const cLat = sLat / vertices.length;
              const cLng = sLng / vertices.length;
              vertices.sort((a, b) => {
                const angA = Math.atan2(a[0] - cLat, a[1] - cLng);
                const angB = Math.atan2(b[0] - cLat, b[1] - cLng);
                return angA - angB;
              });
              actualizarPoligono();
            }
          } else if (e.data.accion === 'CENTRAR' && e.data.carga) {
            map.setView([e.data.carga.lat, e.data.carga.lng], e.data.carga.zoom || 15);
          } else if (e.data.accion === 'LOCALIZAR_ACTUAL') {
            map.locate({ setView: true, maxZoom: 17 });
          }
        });
      </script>
    </body>
    </html>
  `;

  return (
    <View style={styles.contenedor}>
      {/* Barra de Controles y Métricas */}
      <View style={styles.barraControl}>
        <View style={styles.infoArea}>
          {colorPoligono ? (
            <View style={[styles.muestraColorCultivo, { backgroundColor: colorPoligono }]} />
          ) : null}
          <Text style={styles.textoAreaEtiqueta}>Área delimitada:</Text>
          <Text style={[styles.textoAreaValor, tieneCruce && styles.textoAreaValorError]}>
            {areaHa.toFixed(4)} ha
          </Text>
          <Text style={styles.textoPuntos}>({puntos.length} vértices)</Text>

          {tieneCruce && (
            <View style={styles.badgeCruce}>
              <AlertTriangle size={13} color="#B91C1C" />
              <Text style={styles.textoBadgeCruce}>Líneas cruzadas</Text>
            </View>
          )}
        </View>

        <View style={styles.botonesAccion}>
          {!soloLectura && tieneCruce && (
            <Pressable onPress={reordenarContorno} style={[styles.botonPequeno, styles.botonReordenar]}>
              <RotateCw size={13} color="#15803D" />
              <Text style={styles.textoBotonReordenar}>Corregir contorno</Text>
            </Pressable>
          )}
          <Pressable onPress={centrarEnMiUbicacion} style={[styles.botonPequeno, styles.botonUbicacion]}>
            <Navigation size={13} color={Palette.forestGreen} />
            <Text style={[styles.textoBotonPequeno, { color: Palette.forestGreen }]}>Mi ubicación</Text>
          </Pressable>
          {!soloLectura && (
            <>
              <Pressable onPress={deshacer} style={styles.botonPequeno}>
                <Undo size={14} color={Palette.forestGreen} />
                <Text style={styles.textoBotonPequeno}>Deshacer</Text>
              </Pressable>
              <Pressable onPress={limpiar} style={[styles.botonPequeno, styles.botonPequenoPeligro]}>
                <Trash2 size={14} color="#B71C1C" />
                <Text style={[styles.textoBotonPequeno, { color: '#B71C1C' }]}>Limpiar</Text>
              </Pressable>
            </>
          )}
        </View>
      </View>

      {/* Guía contextual para el usuario */}
      {!soloLectura && (
        <View style={[styles.bannerGuia, tieneCruce && styles.bannerGuiaError]}>
          {tieneCruce ? (
            <Text style={styles.textoGuiaError}>
              ⚠️ El polígono se cruza sobre sí mismo. Mueva los puntos o presione "Corregir contorno" para desenredarlo.
            </Text>
          ) : (
            <View style={styles.filaGuia}>
              <Move size={12} color="#4B5563" />
              <Text style={styles.textoGuia}>
                Haga clic para agregar puntos. Puede arrastrar cualquier punto para ajustar el límite, o hacer clic en uno para eliminarlo.
              </Text>
            </View>
          )}
        </View>
      )}

      {/* Contenedor del Mapa Satelital */}
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

      {/* Accesos rápidos a Valles Agrícolas */}
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
    flexWrap: 'wrap',
    gap: 8,
  },
  infoArea: { flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' },
  muestraColorCultivo: { width: 12, height: 12, borderRadius: 6, marginRight: 2 },
  textoAreaEtiqueta: { fontSize: 12, fontWeight: '600', color: '#4B5563' },
  textoAreaValor: { fontSize: 14, fontWeight: '800', color: Palette.forestGreen },
  textoAreaValorError: { color: '#DC2626' },
  textoPuntos: { fontSize: 11, color: '#6B7280' },
  badgeCruce: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#FCA5A5',
  },
  textoBadgeCruce: { fontSize: 11, fontWeight: '700', color: '#B91C1C' },
  botonesAccion: { flexDirection: 'row', gap: 6, flexWrap: 'wrap' },
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
  botonReordenar: {
    backgroundColor: '#F0FDF4',
    borderColor: '#86EFAC',
  },
  textoBotonReordenar: { fontSize: 12, fontWeight: '700', color: '#15803D' },
  botonPequenoPeligro: { borderColor: '#FFCDD2', backgroundColor: '#FFF8F8' },
  botonUbicacion: {
    backgroundColor: '#E8F5E9',
    borderColor: '#C8E6C9',
  },
  textoBotonPequeno: { fontSize: 12, fontWeight: '600', color: Palette.forestGreen },
  bannerGuia: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#F8FAF5',
    borderBottomWidth: 1,
    borderBottomColor: '#E8EFE3',
  },
  bannerGuiaError: {
    backgroundColor: '#FEF2F2',
    borderBottomColor: '#FEE2E2',
  },
  filaGuia: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  textoGuia: { fontSize: 11, color: '#4B5563', flex: 1 },
  textoGuiaError: { fontSize: 11, fontWeight: '600', color: '#B91C1C' },
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
