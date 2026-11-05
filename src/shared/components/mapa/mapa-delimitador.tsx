import React, { useState, useEffect, useRef, useMemo } from 'react';
import { View, Text, StyleSheet, Pressable, Platform, type DimensionValue } from 'react-native';
import { WebView } from 'react-native-webview';
import {
  Undo,
  Trash2,
  MapPin,
  Navigation,
  AlertTriangle,
  RotateCw,
  Move,
  Crosshair,
  Layers,
} from 'lucide-react-native';
import { Palette } from '@/constants/theme';
import {
  type CoordenadaPunto,
  calcularAreaHectareas,
  calcularCentroide,
  esPoligonoAutoIntersecante,
  detectarSuperposicionPoligonos,
} from '@/shared/utils/geometria';
import { obtenerUbicacionActual } from '@/shared/utils/geocodificacion';

export interface ParcelaOcupadaGeo {
  id: string;
  nombre: string;
  codigo?: string | null;
  cultivoNombre?: string | null;
  cultivoColorHex?: string | null;
  variedad?: string | null;
  areaHectareas?: number | null;
  puntos: CoordenadaPunto[];
}

export interface MapaDelimitadorProps {
  puntosIniciales?: CoordenadaPunto[];
  centroInicial?: { lat: number; lng: number };
  zoomInicial?: number;
  altura?: DimensionValue;
  soloLectura?: boolean;
  colorPoligono?: string;
  parcelasOcupadas?: ParcelaOcupadaGeo[];
  onCambioPoligono?: (datos: {
    puntos: CoordenadaPunto[];
    areaHectareas: number;
    centroide: CoordenadaPunto | null;
    tieneCruce?: boolean;
    tieneSuperposicion?: boolean;
    parcelaConflicto?: string | null;
  }) => void;
}

/**
 * @description Componente de mapa satelital interactivo para delimitación de parcelas
 * con puntos arrastrables, snapping magnético a linderos de áreas existentes y validación de superposición.
 */
const PUNTOS_VACIOS_DEFAULT: CoordenadaPunto[] = [];
const PARCELAS_OCUPADAS_DEFAULT: ParcelaOcupadaGeo[] = [];
const CENTRO_DEFAULT = { lat: -13.0768, lng: -76.3854 };

export const MapaDelimitador: React.FC<MapaDelimitadorProps> = ({
  puntosIniciales = PUNTOS_VACIOS_DEFAULT,
  centroInicial = CENTRO_DEFAULT,
  zoomInicial = 15,
  altura = 380,
  soloLectura = false,
  colorPoligono = '#2E7D32',
  parcelasOcupadas = PARCELAS_OCUPADAS_DEFAULT,
  onCambioPoligono,
}) => {
  const [puntos, setPuntos] = useState<CoordenadaPunto[]>(puntosIniciales);
  const [areaHa, setAreaHa] = useState<number>(() => calcularAreaHectareas(puntosIniciales));
  const [tieneCruce, setTieneCruce] = useState<boolean>(() => esPoligonoAutoIntersecante(puntosIniciales));
  const [tieneSuperposicion, setTieneSuperposicion] = useState<boolean>(false);
  const [parcelaConflicto, setParcelaConflicto] = useState<string | null>(null);
  const [adherenciaActiva, setAdherenciaActiva] = useState<boolean>(true);

  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const webViewRef = useRef<any>(null);
  const mapaListoRef = useRef<boolean>(false);
  const colaMensajesRef = useRef<Array<{ accion: string; carga?: unknown }>>([]);
  const onCambioPoligonoRef = useRef(onCambioPoligono);
  onCambioPoligonoRef.current = onCambioPoligono;
  const colorPoligonoRef = useRef(colorPoligono);
  colorPoligonoRef.current = colorPoligono;

  const enviarAccionAMapa = (accion: string, carga?: unknown) => {
    const payload = { accion, carga };
    if (mapaListoRef.current) {
      if (Platform.OS === 'web' && iframeRef.current && iframeRef.current.contentWindow) {
        iframeRef.current.contentWindow.postMessage(payload, '*');
      } else if (webViewRef.current) {
        webViewRef.current.postMessage(JSON.stringify(payload));
      }
    } else {
      colaMensajesRef.current.push(payload);
    }
  };

  const procesarMensajeMapa = (datos: any) => {
    if (!datos) return;

    if (datos.tipo === 'MAPA_LISTO') {
      mapaListoRef.current = true;
      while (colaMensajesRef.current.length > 0) {
        const item = colaMensajesRef.current.shift();
        if (item) {
          if (Platform.OS === 'web' && iframeRef.current && iframeRef.current.contentWindow) {
            iframeRef.current.contentWindow.postMessage(item, '*');
          } else if (webViewRef.current) {
            webViewRef.current.postMessage(JSON.stringify(item));
          }
        }
      }
      return;
    }

    if (datos.tipo === 'MAPA_VERTICES_ACTUALIZADOS') {
      const nuevosPuntos: CoordenadaPunto[] = datos.puntos || [];
      const cruceDetectado: boolean = Boolean(datos.tieneCruce);
      const superposicionDetectada: boolean = Boolean(datos.tieneSuperposicion);
      const conflictoDetectado: string | null = datos.parcelaConflicto || null;
      const nuevaArea = calcularAreaHectareas(nuevosPuntos);
      const centroide = calcularCentroide(nuevosPuntos);

      setPuntos(nuevosPuntos);
      setAreaHa(nuevaArea);
      setTieneCruce(cruceDetectado);
      setTieneSuperposicion(superposicionDetectada);
      setParcelaConflicto(conflictoDetectado);

      if (onCambioPoligonoRef.current) {
        onCambioPoligonoRef.current({
          puntos: nuevosPuntos,
          areaHectareas: nuevaArea,
          centroide,
          tieneCruce: cruceDetectado,
          tieneSuperposicion: superposicionDetectada,
          parcelaConflicto: conflictoDetectado,
        });
      }
    }
  };

  // Notificaciones y sincronización de eventos provenientes del iframe en Web
  useEffect(() => {
    if (Platform.OS !== 'web') return;
    const manejarMensaje = (evento: MessageEvent) => {
      procesarMensajeMapa(evento.data);
    };
    window.addEventListener('message', manejarMensaje);
    return () => window.removeEventListener('message', manejarMensaje);
  }, []);

  // Carga de puntos iniciales sólo cuando realmente cambian desde las props externas
  const prevPuntosInicialesRef = useRef<string>(JSON.stringify(puntosIniciales));
  useEffect(() => {
    if (puntosIniciales && puntosIniciales.length > 0) {
      const puntosStr = JSON.stringify(puntosIniciales);
      if (puntosStr !== prevPuntosInicialesRef.current) {
        prevPuntosInicialesRef.current = puntosStr;
        setPuntos(puntosIniciales);
        setAreaHa(calcularAreaHectareas(puntosIniciales));
        setTieneCruce(esPoligonoAutoIntersecante(puntosIniciales));
        enviarAccionAMapa('CARGAR_PUNTOS', {
          puntos: puntosIniciales,
          color: colorPoligonoRef.current,
        });
      }
    }
  }, [puntosIniciales]);

  // Cambio dinámico de color del polígono sin recargar ni alterar los vértices existentes
  useEffect(() => {
    enviarAccionAMapa('CAMBIAR_COLOR', {
      color: colorPoligono,
    });
  }, [colorPoligono]);

  // Sincronización de modo solo lectura
  useEffect(() => {
    enviarAccionAMapa('CONFIGURAR_MODO', {
      soloLectura,
      color: colorPoligonoRef.current,
    });
  }, [soloLectura]);

  // Sincronización de parcelas ocupadas vecinas
  const prevParcelasOcupadasRef = useRef<string>('');
  useEffect(() => {
    const parcelasStr = JSON.stringify(parcelasOcupadas);
    if (parcelasStr !== prevParcelasOcupadasRef.current) {
      prevParcelasOcupadasRef.current = parcelasStr;
      enviarAccionAMapa('CARGAR_PARCELAS_OCUPADAS', {
        parcelas: parcelasOcupadas,
      });
    }
  }, [parcelasOcupadas]);

  // Snapping magnético
  useEffect(() => {
    enviarAccionAMapa('CONFIGURAR_SNAPPING', {
      activo: adherenciaActiva,
    });
  }, [adherenciaActiva]);

  // Centrado de cámara satelital
  const prevCentroRef = useRef<string>('');
  useEffect(() => {
    if (centroInicial && (centroInicial.lat !== 0 || centroInicial.lng !== 0)) {
      const centroStr = `${centroInicial.lat},${centroInicial.lng},${zoomInicial}`;
      if (centroStr !== prevCentroRef.current) {
        prevCentroRef.current = centroStr;
        enviarAccionAMapa('CENTRAR', { lat: centroInicial.lat, lng: centroInicial.lng, zoom: zoomInicial });
      }
    }
  }, [centroInicial?.lat, centroInicial?.lng, zoomInicial]);

  const limpiar = () => {
    setPuntos([]);
    setAreaHa(0);
    setTieneCruce(false);
    setTieneSuperposicion(false);
    setParcelaConflicto(null);
    enviarAccionAMapa('LIMPIAR');
    if (onCambioPoligonoRef.current) {
      onCambioPoligonoRef.current({
        puntos: [],
        areaHectareas: 0,
        centroide: null,
        tieneCruce: false,
        tieneSuperposicion: false,
        parcelaConflicto: null,
      });
    }
  };

  const deshacer = () => enviarAccionAMapa('DESHACER');
  const reordenarContorno = () => enviarAccionAMapa('REORDENAR');
  const alternarAdherencia = () => {
    setAdherenciaActiva((prev) => !prev);
  };
  const centrarEnValle = (lat: number, lng: number) => enviarAccionAMapa('CENTRAR', { lat, lng, zoom: 15 });

  const centrarEnMiUbicacion = async () => {
    const loc = await obtenerUbicacionActual();
    if (loc) {
      enviarAccionAMapa('CENTRAR', { lat: loc.lat, lng: loc.lng, zoom: 17 });
    } else {
      enviarAccionAMapa('LOCALIZAR_ACTUAL');
    }
  };

  // Memoizar el HTML del mapa para que el iframe se monte UNA SOLA VEZ y no se recargue por cambios de color o estado
  const htmlMapa = useMemo(() => {
    const colorInicial = colorPoligono;
    const centroLat = centroInicial.lat;
    const centroLng = centroInicial.lng;
    const zoomInit = zoomInicial;
    const soloLecturaInit = soloLectura;
    const puntosInit = puntosIniciales;
    const parcelasInit = parcelasOcupadas;
    const adherenciaInit = adherenciaActiva;

    return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
      <style>
        body, html, #map { margin: 0; padding: 0; width: 100%; height: 100%; font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; }
        :root {
          --color-cultivo: ${colorInicial};
        }
        .vertice-pin {
          width: 14px;
          height: 14px;
          border-radius: 50%;
          background: var(--color-cultivo, ${colorInicial});
          border: 2.5px solid #ffffff;
          box-shadow: 0 2px 6px rgba(0,0,0,0.5);
          cursor: grab;
          transition: transform 0.1s ease, background 0.15s ease;
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
          box-shadow: 0 0 10px rgba(220,38,38,0.9);
        }
        .vertice-midpoint {
          width: 10px;
          height: 10px;
          border-radius: 50%;
          background: #81C784;
          border: 2px solid #ffffff;
          box-shadow: 0 1px 4px rgba(0,0,0,0.35);
          cursor: grab;
          opacity: 0.9;
          transition: transform 0.12s ease, background 0.12s ease;
        }
        .vertice-midpoint:hover {
          transform: scale(1.45);
          background: #2E7D32;
          opacity: 1;
        }
        .vertice-ocupado-dot {
          width: 7px;
          height: 7px;
          border-radius: 50%;
          background: #38BDF8;
          border: 1.5px solid #FFFFFF;
          box-shadow: 0 0 4px rgba(0,0,0,0.4);
          pointer-events: none;
        }
        .snap-marker-glow {
          width: 16px;
          height: 16px;
          border-radius: 50%;
          background: rgba(2, 132, 199, 0.45);
          border: 2.5px solid #0284C7;
          box-shadow: 0 0 12px #38BDF8;
          animation: snap-pulse 0.9s infinite alternate;
          pointer-events: none;
        }
        @keyframes snap-pulse {
          0% { transform: scale(0.85); opacity: 0.7; }
          100% { transform: scale(1.35); opacity: 1; }
        }
        .tooltip-ocupada {
          background: rgba(15, 23, 42, 0.92) !important;
          border: 1px solid #334155 !important;
          border-radius: 6px !important;
          color: #F8FAFC !important;
          padding: 6px 10px !important;
          box-shadow: 0 4px 12px rgba(0,0,0,0.35) !important;
        }
        .tooltip-ocupada .leaflet-tooltip-pane {
          z-index: 1000;
        }
      </style>
    </head>
    <body>
      <div id="map"></div>
      <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
      <script src="https://unpkg.com/@turf/turf@7.2.0/turf.min.js"></script>
      <script>
        const googleHibrido = L.tileLayer('https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}', {
          attribution: '&copy; Google Satellite', maxNativeZoom: 20, maxZoom: 22, noWrap: true
        });
        const esriSatelite = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
          attribution: 'Tiles &copy; Esri', maxNativeZoom: 18, maxZoom: 21, noWrap: true
        });
        const callesOSM = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '&copy; OpenStreetMap', maxZoom: 19, noWrap: true
        });

        // Delimitación geográfica de navegación (Territorio de Perú con margen de maniobra)
        const limitesPeru = L.latLngBounds(
          L.latLng(-19.5, -83.0),
          L.latLng(1.0, -67.0)
        );

        const map = L.map('map', {
          center: [${centroLat}, ${centroLng}],
          zoom: ${zoomInit},
          minZoom: 5,
          maxZoom: 21,
          maxBounds: limitesPeru,
          maxBoundsViscosity: 1.0,
          layers: [googleHibrido]
        });

        L.control.layers({
          "Google Satélite (Híbrido)": googleHibrido,
          "Esri Satélite": esriSatelite,
          "Calles (OSM)": callesOSM
        }, null, { position: 'topright' }).addTo(map);

        let esSoloLectura = ${soloLecturaInit ? 'true' : 'false'};
        let colorCultivo = '${colorInicial}';
        let vertices = ${JSON.stringify(puntosInit)}.map(p => [p.latitude, p.longitude]);
        let parcelasOcupadasData = ${JSON.stringify(parcelasInit || [])};
        let snappingHabilitado = ${adherenciaInit ? 'true' : 'false'};

        let marcadores = [];
        let marcadoresMedios = [];
        let capasParcelasOcupadas = [];
        let marcadoresVerticesOcupados = [];
        let poligono = null;

        function notificarParent(datos) {
          try {
            if (window.ReactNativeWebView && window.ReactNativeWebView.postMessage) {
              window.ReactNativeWebView.postMessage(JSON.stringify(datos));
            } else if (window.parent && window.parent.postMessage) {
              window.parent.postMessage(datos, '*');
            }
          } catch(err) {}
        }

        // Marcador visual de Snap / Imán
        let puntoSnapActivo = null;
        const snapMarker = L.marker([0, 0], {
          icon: L.divIcon({
            className: 'snap-marker-container',
            html: '<div class="snap-marker-glow"></div>',
            iconSize: [16, 16],
            iconAnchor: [8, 8]
          }),
          interactive: false,
          zIndexOffset: 1500
        });

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

        // Ray casting para evaluar si punto está dentro de polígono
        function puntoDentroDePoligono(pt, poly) {
          if (!poly || poly.length < 3) return false;
          let adentro = false;
          const n = poly.length;
          for (let i = 0, j = n - 1; i < n; j = i++) {
            const xi = poly[i][1], yi = poly[i][0];
            const xj = poly[j][1], yj = poly[j][0];
            const intersecta = ((yi > pt[0]) !== (yj > pt[0])) &&
              (pt[1] < ((xj - xi) * (pt[0] - yi)) / (yj - yi) + xi);
            if (intersecta) adentro = !adentro;
          }
          return adentro;
        }

        // Distancia punto a segmento en coordenadas
        function distanciaPuntoASegmentoCoord(p, a, b) {
          const x = p[0], y = p[1];
          const x1 = a[0], y1 = a[1];
          const x2 = b[0], y2 = b[1];
          const dx = x2 - x1;
          const dy = y2 - y1;
          const lenSq = dx * dx + dy * dy;
          if (lenSq === 0) {
            return Math.hypot(x - x1, y - y1);
          }
          let t = ((x - x1) * dx + (y - y1) * dy) / lenSq;
          t = Math.max(0, Math.min(1, t));
          const projX = x1 + t * dx;
          const projY = y1 + t * dy;
          return Math.hypot(x - projX, y - projY);
        }

        function estaEnBordeDePoligono(pt, poly, toleranciaDeg) {
          toleranciaDeg = toleranciaDeg || 0.00004; // ~4 metros de tolerancia para borde compartido
          if (!poly || poly.length < 2) return false;
          const n = poly.length;
          for (let i = 0; i < n; i++) {
            const a = poly[i];
            const b = poly[(i + 1) % n];
            if (distanciaPuntoASegmentoCoord(pt, a, b) <= toleranciaDeg) {
              return true;
            }
          }
          return false;
        }

        // Validación de superposición con parcelas ocupadas
        function evaluarSuperposicionConOcupadas(misVertices) {
          if (misVertices.length < 3 || parcelasOcupadasData.length === 0) {
            return { superpuesto: false, conflicto: null };
          }

          // Si Turf está cargado en el navegador, evaluar intersección real de superficie
          if (typeof turf !== 'undefined' && turf.intersect) {
            try {
              const coordsMi = misVertices.map(function(v) { return [v[1], v[0]]; });
              coordsMi.push([misVertices[0][1], misVertices[0][0]]);
              const polyMi = turf.polygon([coordsMi]);

              for (let pIdx = 0; pIdx < parcelasOcupadasData.length; pIdx++) {
                const parcela = parcelasOcupadasData[pIdx];
                if (!parcela.puntos || parcela.puntos.length < 3) continue;

                const coordsOc = parcela.puntos.map(function(pt) { return [pt.longitude, pt.latitude]; });
                coordsOc.push([parcela.puntos[0].longitude, parcela.puntos[0].latitude]);
                const polyOc = turf.polygon([coordsOc]);

                let inter = null;
                try {
                  inter = turf.intersect(turf.featureCollection([polyMi, polyOc]));
                } catch (e1) {
                  try {
                    inter = turf.intersect(polyMi, polyOc);
                  } catch (e2) {}
                }

                if (inter) {
                  const areaM2 = turf.area(inter);
                  // Sólo es superposición si hay más de 5 m² de superficie invadida
                  // (Las fronteras compartidas, vértices coincidentes o líneas colindantes dan 0 m²)
                  if (areaM2 > 5) {
                    return { superpuesto: true, conflicto: parcela.nombre };
                  }
                }
              }
              return { superpuesto: false, conflicto: null };
            } catch (err) {
              console.warn('Evaluación Turf:', err);
            }
          }

          // Algoritmo de reserva geométrica:
          for (let pIdx = 0; pIdx < parcelasOcupadasData.length; pIdx++) {
            const parcela = parcelasOcupadasData[pIdx];
            if (!parcela.puntos || parcela.puntos.length < 3) continue;
            const ocPts = parcela.puntos.map(function(pt) { return [pt.latitude, pt.longitude]; });

            // Cruce transversal de límites
            for (let i = 0; i < misVertices.length; i++) {
              const a = misVertices[i];
              const b = misVertices[(i + 1) % misVertices.length];
              for (let j = 0; j < ocPts.length; j++) {
                const c = ocPts[j];
                const d = ocPts[(j + 1) % ocPts.length];
                if (seCruzan(a, b, c, d)) {
                  return { superpuesto: true, conflicto: parcela.nombre };
                }
              }
            }

            // Vértice propio que cae adentro con margen amplio para bordes compartidos
            for (let i = 0; i < misVertices.length; i++) {
              const v = misVertices[i];
              if (puntoDentroDePoligono(v, ocPts) && !estaEnBordeDePoligono(v, ocPts, 0.00008)) {
                return { superpuesto: true, conflicto: parcela.nombre };
              }
            }
          }

          return { superpuesto: false, conflicto: null };
        }

        // Búsqueda de imantación (Snapping) por proximidad en píxeles de pantalla
        function buscarPuntoSnap(mouseLatLng) {
          if (!snappingHabilitado || esSoloLectura || parcelasOcupadasData.length === 0) {
            return null;
          }
          const mousePt = map.latLngToContainerPoint(mouseLatLng);
          const UMBRAL_VERTICE_PX = 20; // 20 píxeles para esquinas
          const UMBRAL_BORDE_PX = 15;   // 15 píxeles para bordes

          let mejorSnap = null;
          let menorDist = Infinity;

          // 1. Prioridad: Vértices exactos de parcelas ocupadas
          for (let pIdx = 0; pIdx < parcelasOcupadasData.length; pIdx++) {
            const parcela = parcelasOcupadasData[pIdx];
            if (!parcela.puntos) continue;
            for (let vIdx = 0; vIdx < parcela.puntos.length; vIdx++) {
              const v = parcela.puntos[vIdx];
              const vPt = map.latLngToContainerPoint([v.latitude, v.longitude]);
              const dist = Math.hypot(vPt.x - mousePt.x, vPt.y - mousePt.y);
              if (dist < UMBRAL_VERTICE_PX && dist < menorDist) {
                menorDist = dist;
                mejorSnap = {
                  lat: v.latitude,
                  lng: v.longitude,
                  tipo: 'vertice',
                  nombre: parcela.nombre
                };
              }
            }
          }

          if (mejorSnap) return mejorSnap;

          // 2. Si no hay vértice tan cerca, proyectar sobre aristas/bordes perimetrales
          for (let pIdx = 0; pIdx < parcelasOcupadasData.length; pIdx++) {
            const parcela = parcelasOcupadasData[pIdx];
            if (!parcela.puntos || parcela.puntos.length < 2) continue;
            const pts = parcela.puntos;
            const len = pts.length;
            for (let i = 0; i < len; i++) {
              const a = pts[i];
              const b = pts[(i + 1) % len];
              const aPt = map.latLngToContainerPoint([a.latitude, a.longitude]);
              const bPt = map.latLngToContainerPoint([b.latitude, b.longitude]);

              const dx = bPt.x - aPt.x;
              const dy = bPt.y - aPt.y;
              const lenSq = dx * dx + dy * dy;
              if (lenSq === 0) continue;

              let t = ((mousePt.x - aPt.x) * dx + (mousePt.y - aPt.y) * dy) / lenSq;
              t = Math.max(0, Math.min(1, t));

              const projX = aPt.x + t * dx;
              const projY = aPt.y + t * dy;
              const dist = Math.hypot(mousePt.x - projX, mousePt.y - projY);

              if (dist < UMBRAL_BORDE_PX && dist < menorDist) {
                menorDist = dist;
                const snapLat = a.latitude + t * (b.latitude - a.latitude);
                const snapLng = a.longitude + t * (b.longitude - a.longitude);
                mejorSnap = {
                  lat: snapLat,
                  lng: snapLng,
                  tipo: 'borde',
                  nombre: parcela.nombre
                };
              }
            }
          }

          return mejorSnap;
        }

        function renderizarParcelasOcupadas() {
          capasParcelasOcupadas.forEach(function(l) { map.removeLayer(l); });
          capasParcelasOcupadas = [];
          marcadoresVerticesOcupados.forEach(function(m) { map.removeLayer(m); });
          marcadoresVerticesOcupados = [];

          if (!parcelasOcupadasData || parcelasOcupadasData.length === 0) return;

          parcelasOcupadasData.forEach(function(p) {
            if (!p.puntos || p.puntos.length < 3) return;
            const latlngs = p.puntos.map(function(pt) { return [pt.latitude, pt.longitude]; });
            const col = p.cultivoColorHex || '#475569';

            const poly = L.polygon(latlngs, {
              color: col,
              fillColor: col,
              fillOpacity: 0.22,
              weight: 2,
              dashArray: '5, 5',
              interactive: true
            }).addTo(map);

            const tooltipHtml = [
              '<div style="font-family:system-ui,sans-serif; font-size:11px; line-height:1.4;">',
              '  <div style="font-weight:700; font-size:12px; color:#F8FAFC;">' + (p.nombre || 'Lote') + ' <span style="font-weight:400; color:#94A3B8;">(' + (p.codigo || 'S/C') + ')</span></div>',
              '  <div style="color:#A7F3D0; margin-top:2px;">● ' + (p.cultivoNombre || 'Cultivo') + (p.variedad ? ' - ' + p.variedad : '') + '</div>',
              '  <div style="color:#CBD5E1;">Área: ' + (p.areaHectareas ? Number(p.areaHectareas).toFixed(2) + ' ha' : 'N/D') + '</div>',
              '  <div style="display:inline-block; margin-top:4px; font-size:9.5px; font-weight:700; padding:1px 5px; background:rgba(255,255,255,0.15); border-radius:3px; color:#F1F5F9;">ÁREA OCUPADA</div>',
              '</div>'
            ].join('');

            poly.bindTooltip(tooltipHtml, {
              className: 'tooltip-ocupada',
              sticky: true,
              direction: 'top',
              opacity: 0.95
            });

            capasParcelasOcupadas.push(poly);

            // Vértices guía en las esquinas para facilitar el enganche visual
            p.puntos.forEach(function(v) {
              const vDot = L.marker([v.latitude, v.longitude], {
                icon: L.divIcon({
                  className: 'vertice-ocupado-container',
                  html: '<div class="vertice-ocupado-dot"></div>',
                  iconSize: [7, 7],
                  iconAnchor: [3.5, 3.5]
                }),
                interactive: false,
                zIndexOffset: 500
              }).addTo(map);
              marcadoresVerticesOcupados.push(vDot);
            });
          });
        }

        renderizarParcelasOcupadas();

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

        function redibujarEnArrastre() {
          const cruce = tieneAutoInterseccion(vertices);
          const superposicion = evaluarSuperposicionConOcupadas(vertices);
          const hayError = cruce || superposicion.superpuesto;
          const colorTrazado = hayError ? '#DC2626' : colorCultivo;
          const fillTrazado = hayError ? '#EF4444' : colorCultivo;

          if (poligono) {
            poligono.setLatLngs(vertices);
            poligono.setStyle({ color: colorTrazado, fillColor: fillTrazado, fillOpacity: hayError ? 0.42 : 0.25 });
          }
          marcadores.forEach(function(m, idx) {
            m.setLatLng(vertices[idx]);
            const el = m.getElement();
            if (el) {
              const pin = el.querySelector('.vertice-pin');
              if (pin) {
                if (hayError) pin.classList.add('error');
                else pin.classList.remove('error');
              }
            }
          });
        }

        function actualizarPoligono() {
          marcadores.forEach(function(m) { map.removeLayer(m); });
          marcadores = [];
          marcadoresMedios.forEach(function(m) { map.removeLayer(m); });
          marcadoresMedios = [];

          if (poligono) {
            map.removeLayer(poligono);
            poligono = null;
          }

          const cruce = tieneAutoInterseccion(vertices);
          const superposicion = evaluarSuperposicionConOcupadas(vertices);
          const hayError = cruce || superposicion.superpuesto;
          const colorTrazado = hayError ? '#DC2626' : colorCultivo;
          const fillTrazado = hayError ? '#EF4444' : colorCultivo;

          if (vertices.length >= 3) {
            poligono = L.polygon(vertices, {
              color: colorTrazado,
              fillColor: fillTrazado,
              fillOpacity: hayError ? 0.42 : 0.25,
              weight: 3
            }).addTo(map);

            if (!esSoloLectura) {
              for (let i = 0; i < vertices.length; i++) {
                (function(idx) {
                  const m = L.marker(vertices[idx], {
                    draggable: true,
                    icon: L.divIcon({
                      className: 'vertice-wrapper',
                      html: '<div class="vertice-pin' + (hayError ? ' error' : '') + '"></div>',
                      iconSize: [14, 14],
                      iconAnchor: [7, 7]
                    }),
                    title: 'Vértice ' + (idx + 1) + ' (Haga clic para eliminar, arrastre para mover)'
                  }).addTo(map);

                  m.on('drag', function(ev) {
                    let pos = ev.target.getLatLng();
                    const snap = buscarPuntoSnap(pos);
                    if (snap) {
                      pos = L.latLng(snap.lat, snap.lng);
                      ev.target.setLatLng(pos);
                      snapMarker.setLatLng([snap.lat, snap.lng]);
                      if (!map.hasLayer(snapMarker)) snapMarker.addTo(map);
                    } else if (map.hasLayer(snapMarker)) {
                      map.removeLayer(snapMarker);
                    }
                    vertices[idx] = [pos.lat, pos.lng];
                    redibujarEnArrastre();
                  });

                  m.on('dragend', function() {
                    if (map.hasLayer(snapMarker)) map.removeLayer(snapMarker);
                    actualizarPoligono();
                  });

                  m.on('click', function(ev) {
                    L.DomEvent.stopPropagation(ev);
                    if (vertices.length > 3) {
                      vertices.splice(idx, 1);
                      actualizarPoligono();
                    }
                  });

                  marcadores.push(m);
                })(i);
              }

              // Puntos medios para insertar nuevos vértices arrastrando
              for (let i = 0; i < vertices.length; i++) {
                (function(idx) {
                  const p1 = vertices[idx];
                  const p2 = vertices[(idx + 1) % vertices.length];
                  const medio = [(p1[0] + p2[0]) / 2, (p1[1] + p2[1]) / 2];

                  const midMarker = L.marker(medio, {
                    draggable: true,
                    icon: L.divIcon({
                      className: 'midpoint-wrapper',
                      html: '<div class="vertice-midpoint"></div>',
                      iconSize: [10, 10],
                      iconAnchor: [5, 5]
                    }),
                    title: 'Arrastre para crear un nuevo vértice aquí'
                  }).addTo(map);

                  let nuevoIdx = -1;
                  midMarker.on('dragstart', function(ev) {
                    const pos = ev.target.getLatLng();
                    vertices.splice(idx + 1, 0, [pos.lat, pos.lng]);
                    nuevoIdx = idx + 1;
                  });

                  midMarker.on('drag', function(ev) {
                    if (nuevoIdx >= 0) {
                      let pos = ev.target.getLatLng();
                      const snap = buscarPuntoSnap(pos);
                      if (snap) {
                        pos = L.latLng(snap.lat, snap.lng);
                        ev.target.setLatLng(pos);
                        snapMarker.setLatLng([snap.lat, snap.lng]);
                        if (!map.hasLayer(snapMarker)) snapMarker.addTo(map);
                      } else if (map.hasLayer(snapMarker)) {
                        map.removeLayer(snapMarker);
                      }
                      vertices[nuevoIdx] = [pos.lat, pos.lng];
                      redibujarEnArrastre();
                    }
                  });

                  midMarker.on('dragend', function() {
                    if (map.hasLayer(snapMarker)) map.removeLayer(snapMarker);
                    nuevoIdx = -1;
                    actualizarPoligono();
                  });

                  marcadoresMedios.push(midMarker);
                })(i);
              }
            }
          } else if (vertices.length === 2) {
            poligono = L.polyline(vertices, { color: colorTrazado, weight: 3 }).addTo(map);
          }

          const puntosFormateados = vertices.map(function(v) { return { latitude: v[0], longitude: v[1] }; });
          notificarParent({
            tipo: 'MAPA_VERTICES_ACTUALIZADOS',
            puntos: puntosFormateados,
            tieneCruce: cruce,
            tieneSuperposicion: superposicion.superpuesto,
            parcelaConflicto: superposicion.conflicto
          });
        }

        actualizarPoligono();

        if (vertices.length >= 3 && poligono) {
          try {
            map.fitBounds(poligono.getBounds(), { padding: [35, 35] });
          } catch (e) {}
        }

        // Detección de proximidad del cursor para Snapping
        map.on('mousemove', function(e) {
          if (esSoloLectura || !snappingHabilitado) {
            if (map.hasLayer(snapMarker)) map.removeLayer(snapMarker);
            puntoSnapActivo = null;
            return;
          }
          const snap = buscarPuntoSnap(e.latlng);
          puntoSnapActivo = snap;
          if (snap) {
            snapMarker.setLatLng([snap.lat, snap.lng]);
            if (!map.hasLayer(snapMarker)) snapMarker.addTo(map);
          } else {
            if (map.hasLayer(snapMarker)) map.removeLayer(snapMarker);
          }
        });

        map.on('mouseout', function() {
          if (map.hasLayer(snapMarker)) map.removeLayer(snapMarker);
          puntoSnapActivo = null;
        });

        function distEuclidea(p1, p2) {
          return Math.hypot(p2[0] - p1[0], p2[1] - p1[1]);
        }

        function ordenarPerimetralmente(pts) {
          if (!pts || pts.length < 3) return pts;
          let sLat = 0, sLng = 0;
          pts.forEach(function(v) { sLat += v[0]; sLng += v[1]; });
          const cLat = sLat / pts.length;
          const cLng = sLng / pts.length;
          return pts.slice().sort(function(a, b) {
            const angA = Math.atan2(a[0] - cLat, a[1] - cLng);
            const angB = Math.atan2(b[0] - cLat, b[1] - cLng);
            return angA - angB;
          });
        }

        // Inserta un nuevo punto en el segmento que minimiza el perímetro sin cruzar líneas
        function insertarVerticeOptimo(nuevoPunto, verticesActuales) {
          if (verticesActuales.length < 3) {
            return verticesActuales.concat([nuevoPunto]);
          }

          const n = verticesActuales.length;
          let mejorCandidato = null;
          let menorCosto = Infinity;

          for (let i = 0; i < n; i++) {
            const a = verticesActuales[i];
            const b = verticesActuales[(i + 1) % n];

            // Variación de perímetro: dist(a, p) + dist(p, b) - dist(a, b)
            const dAB = distEuclidea(a, b);
            const dAP = distEuclidea(a, nuevoPunto);
            const dPB = distEuclidea(nuevoPunto, b);
            const deltaPerimetro = dAP + dPB - dAB;

            const candidato = verticesActuales.slice();
            candidato.splice(i + 1, 0, nuevoPunto);

            const cruza = tieneAutoInterseccion(candidato);
            // Penalización severa para configuraciones que generen líneas cruzadas
            const costo = deltaPerimetro + (cruza ? 1000 : 0);

            if (costo < menorCosto) {
              menorCosto = costo;
              mejorCandidato = candidato;
            }
          }

          // Si la inserción simple aún cruza líneas, aplicar orden perimetral automático
          if (mejorCandidato && tieneAutoInterseccion(mejorCandidato)) {
            const perimetral = ordenarPerimetralmente(mejorCandidato);
            if (!tieneAutoInterseccion(perimetral)) {
              return perimetral;
            }
          }

          return mejorCandidato || verticesActuales.concat([nuevoPunto]);
        }

        // Click para registrar vértice (priorizando el punto de snap magnético si está activo)
        map.on('click', function(e) {
          if (esSoloLectura) return;
          const puntoFinal = puntoSnapActivo
            ? [puntoSnapActivo.lat, puntoSnapActivo.lng]
            : [e.latlng.lat, e.latlng.lng];

          // Evitar registrar puntos fuera de los límites territoriales
          if (!limitesPeru.contains(puntoFinal)) {
            return;
          }

          // Insertar óptimamente en el linde más cercano sin romper ni cruzar la figura
          vertices = insertarVerticeOptimo(puntoFinal, vertices);
          actualizarPoligono();
        });

        function alRecibirMensaje(e) {
          let d = e.data;
          if (typeof d === 'string') {
            try { d = JSON.parse(d); } catch (err) {}
          }
          if (!d) return;

          if (d.accion === 'LIMPIAR') {
            vertices = [];
            actualizarPoligono();
          } else if (d.accion === 'DESHACER') {
            vertices.pop();
            actualizarPoligono();
          } else if (d.accion === 'CARGAR_PUNTOS' && d.carga) {
            if (Array.isArray(d.carga.puntos)) {
              vertices = d.carga.puntos.map(function(p) { return [p.latitude, p.longitude]; });
              if (d.carga.color) {
                colorCultivo = d.carga.color;
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
          } else if (d.accion === 'CARGAR_PARCELAS_OCUPADAS' && d.carga) {
            parcelasOcupadasData = d.carga.parcelas || [];
            renderizarParcelasOcupadas();
            actualizarPoligono();
          } else if (d.accion === 'CONFIGURAR_SNAPPING' && d.carga) {
            snappingHabilitado = Boolean(d.carga.activo);
            if (!snappingHabilitado && map.hasLayer(snapMarker)) {
              map.removeLayer(snapMarker);
              puntoSnapActivo = null;
            }
          } else if (d.accion === 'REORDENAR') {
            if (vertices.length >= 3) {
              vertices = ordenarPerimetralmente(vertices);
              actualizarPoligono();
            }
          } else if (d.accion === 'CENTRAR' && d.carga) {
            map.setView([d.carga.lat, d.carga.lng], d.carga.zoom || 15);
          } else if (d.accion === 'CAMBIAR_COLOR' && d.carga) {
            if (d.carga.color) {
              colorCultivo = d.carga.color;
              document.documentElement.style.setProperty('--color-cultivo', colorCultivo);
              if (poligono) {
                const cruce = tieneAutoInterseccion(vertices);
                const superposicion = evaluarSuperposicionConOcupadas(vertices);
                const hayError = cruce || superposicion.superpuesto;
                const colorTrazado = hayError ? '#DC2626' : colorCultivo;
                const fillTrazado = hayError ? '#EF4444' : colorCultivo;
                poligono.setStyle({ color: colorTrazado, fillColor: fillTrazado });
              }
            }
          } else if (d.accion === 'CONFIGURAR_MODO' && d.carga) {
            if (typeof d.carga.soloLectura !== 'undefined') {
              esSoloLectura = Boolean(d.carga.soloLectura);
            }
            if (d.carga.color) {
              colorCultivo = d.carga.color;
              document.documentElement.style.setProperty('--color-cultivo', colorCultivo);
            }
            actualizarPoligono();
          } else if (d.accion === 'LOCALIZAR_ACTUAL') {
            map.locate({ setView: true, maxZoom: 17 });
          }
        }

        window.addEventListener('message', alRecibirMensaje);
        document.addEventListener('message', alRecibirMensaje);

        notificarParent({ tipo: 'MAPA_LISTO' });
      </script>
    </body>
    </html>
  `;
  }, []);

  return (
    <View style={styles.contenedor}>
      {/* Barra de Controles y Métricas */}
      <View style={styles.barraControl}>
        <View style={styles.infoArea}>
          {colorPoligono ? (
            <View style={[styles.muestraColorCultivo, { backgroundColor: colorPoligono }]} />
          ) : null}
          <Text style={styles.textoAreaEtiqueta}>Área delimitada:</Text>
          <Text
            style={[
              styles.textoAreaValor,
              (tieneCruce || tieneSuperposicion) && styles.textoAreaValorError,
            ]}
          >
            {areaHa.toFixed(4)} ha
          </Text>
          <Text style={styles.textoPuntos}>({puntos.length} vértices)</Text>

          {tieneCruce && (
            <View style={styles.badgeCruce}>
              <AlertTriangle size={13} color="#B91C1C" />
              <Text style={styles.textoBadgeCruce}>Líneas cruzadas</Text>
            </View>
          )}

          {tieneSuperposicion && (
            <View style={styles.badgeSuperposicion}>
              <AlertTriangle size={13} color="#991B1B" />
              <Text style={styles.textoBadgeSuperposicion}>
                Superposición {parcelaConflicto ? `(${parcelaConflicto})` : ''}
              </Text>
            </View>
          )}
        </View>

        <View style={styles.botonesAccion}>
          {!soloLectura && parcelasOcupadas.length > 0 && (
            <Pressable
              onPress={alternarAdherencia}
              style={[styles.botonPequeno, adherenciaActiva && styles.botonAdherenciaActiva]}
              accessibilityLabel="Alternar imán de lindes"
            >
              <Crosshair size={13} color={adherenciaActiva ? '#0284C7' : '#6B7280'} />
              <Text
                style={[
                  styles.textoBotonPequeno,
                  adherenciaActiva && { color: '#0284C7', fontWeight: '700' },
                ]}
              >
                Imán de lindes {adherenciaActiva ? 'ON' : 'OFF'}
              </Text>
            </Pressable>
          )}

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

      {/* Guía contextual y Avisos de Linderos */}
      {!soloLectura && (
        <View
          style={[
            styles.bannerGuia,
            tieneSuperposicion && styles.bannerGuiaPeligro,
            !tieneSuperposicion && tieneCruce && styles.bannerGuiaError,
          ]}
        >
          {tieneSuperposicion ? (
            <Text style={styles.textoGuiaPeligro}>
              ⚠️ Superposición detectada: El área trazada invade la parcela{' '}
              <Text style={{ fontWeight: '800' }}>"{parcelaConflicto}"</Text>. Puede compartir el límite
              exterior, pero no invadir el área interior.
            </Text>
          ) : tieneCruce ? (
            <Text style={styles.textoGuiaError}>
              ⚠️ El polígono se cruza sobre sí mismo. Mueva los puntos o presione "Corregir contorno"
              para desenredarlo.
            </Text>
          ) : parcelasOcupadas.length > 0 ? (
            <View style={styles.filaGuia}>
              <Layers size={13} color="#0369A1" />
              <Text style={[styles.textoGuia, { color: '#0369A1' }]}>
                {parcelasOcupadas.length} área(s) existente(s) en el mapa. Haga clic sobre sus vértices o
                bordes con el <Text style={{ fontWeight: '700' }}>Imán de lindes</Text> para compartir el
                perímetro sin dejar espacios vacíos.
              </Text>
            </View>
          ) : (
            <View style={styles.filaGuia}>
              <Move size={12} color="#4B5563" />
              <Text style={styles.textoGuia}>
                Haga clic para agregar puntos. Puede arrastrar cualquier punto para ajustar el límite, o
                hacer clic en uno para eliminarlo.
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
          <WebView
            ref={webViewRef}
            originWhitelist={['*']}
            source={{ html: htmlMapa }}
            style={{ width: '100%', height: '100%', backgroundColor: 'transparent' }}
            javaScriptEnabled={true}
            domStorageEnabled={true}
            geolocationEnabled={true}
            scrollEnabled={false}
            nestedScrollEnabled={true}
            onMessage={(event) => {
              try {
                const datos = JSON.parse(event.nativeEvent.data);
                procesarMensajeMapa(datos);
              } catch (e) {
                console.warn('[MapaDelimitador] Error al procesar mensaje de WebView:', e);
              }
            }}
          />
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
  badgeSuperposicion: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FFE4E6',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#FDA4AF',
  },
  textoBadgeSuperposicion: { fontSize: 11, fontWeight: '700', color: '#991B1B' },
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
  botonAdherenciaActiva: {
    backgroundColor: '#F0F9FF',
    borderColor: '#BAE6FD',
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
    paddingVertical: 7,
    backgroundColor: '#F8FAF5',
    borderBottomWidth: 1,
    borderBottomColor: '#E8EFE3',
  },
  bannerGuiaError: {
    backgroundColor: '#FEF2F2',
    borderBottomColor: '#FEE2E2',
  },
  bannerGuiaPeligro: {
    backgroundColor: '#FFF1F2',
    borderBottomColor: '#FFE4E6',
  },
  filaGuia: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  textoGuia: { fontSize: 11.5, color: '#4B5563', flex: 1 },
  textoGuiaError: { fontSize: 11.5, fontWeight: '600', color: '#B91C1C' },
  textoGuiaPeligro: { fontSize: 11.5, fontWeight: '600', color: '#991B1B', lineHeight: 16 },
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
