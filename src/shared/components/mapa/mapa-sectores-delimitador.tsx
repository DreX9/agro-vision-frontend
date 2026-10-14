import React, { useState, useEffect, useRef, useMemo } from 'react';
import { View, Text, StyleSheet, Pressable, Platform, type DimensionValue } from 'react-native';
import {
  Undo,
  Trash2,
  Navigation,
  AlertTriangle,
  RotateCw,
  Crosshair,
  Layers,
  Maximize2,
} from 'lucide-react-native';
import { Palette } from '@/constants/theme';
import {
  type CoordenadaPunto,
  calcularAreaHectareas,
  calcularCentroide,
  esPoligonoAutoIntersecante,
  extraerPuntosPoligono,
} from '@/shared/utils/geometria';
import { obtenerUbicacionActual } from '@/shared/utils/geocodificacion';
import { SectorParcelaItem } from '@/features/parcelas/types/sector-parcela.types';

export interface MapaSectoresDelimitadorProps {
  poligonoParcelaMatriz: CoordenadaPunto[];
  sectoresExistentes?: SectorParcelaItem[];
  colorPoligonoNuevo?: string;
  puntosInicialesNuevo?: CoordenadaPunto[];
  nombreParcela?: string;
  codigoParcela?: string;
  areaMatrizHectareas?: number;
  altura?: DimensionValue;
  soloLectura?: boolean;
  onCambioPoligono?: (datos: {
    puntos: CoordenadaPunto[];
    areaHectareas: number;
    centroide: CoordenadaPunto | null;
    tieneCruce?: boolean;
    tieneSuperposicion?: boolean;
    sectorConflicto?: string | null;
  }) => void;
}

const PUNTOS_VACIOS_DEFAULT: CoordenadaPunto[] = [];
const SECTORES_VACIOS_DEFAULT: SectorParcelaItem[] = [];

/**
 * @description Visor y delimitador satelital para trazar sectores/cuarteles de cultivo
 * contenidos dentro del perímetro de una parcela matriz, con imán magnético perimetral e inter-sectorial.
 */
export const MapaSectoresDelimitador: React.FC<MapaSectoresDelimitadorProps> = ({
  poligonoParcelaMatriz = PUNTOS_VACIOS_DEFAULT,
  sectoresExistentes = SECTORES_VACIOS_DEFAULT,
  colorPoligonoNuevo = '#15803D',
  puntosInicialesNuevo = PUNTOS_VACIOS_DEFAULT,
  nombreParcela = 'Parcela',
  codigoParcela = 'P-001',
  areaMatrizHectareas = 0,
  altura = 500,
  soloLectura = false,
  onCambioPoligono,
}) => {
  const [puntos, setPuntos] = useState<CoordenadaPunto[]>(puntosInicialesNuevo);
  const [areaHa, setAreaHa] = useState<number>(() => calcularAreaHectareas(puntosInicialesNuevo));
  const [tieneCruce, setTieneCruce] = useState<boolean>(() => esPoligonoAutoIntersecante(puntosInicialesNuevo));
  const [tieneSuperposicion, setTieneSuperposicion] = useState<boolean>(false);
  const [sectorConflicto, setSectorConflicto] = useState<string | null>(null);
  const [adherenciaActiva, setAdherenciaActiva] = useState<boolean>(true);

  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const mapaListoRef = useRef<boolean>(false);
  const colaMensajesRef = useRef<Array<{ accion: string; carga?: unknown }>>([]);
  const onCambioPoligonoRef = useRef(onCambioPoligono);
  onCambioPoligonoRef.current = onCambioPoligono;
  const colorPoligonoRef = useRef(colorPoligonoNuevo);
  colorPoligonoRef.current = colorPoligonoNuevo;
  const prevPuntosInicialesRef = useRef<string>(JSON.stringify(puntosInicialesNuevo || []));

  const enviarAccionAMapa = (accion: string, carga?: unknown) => {
    if (mapaListoRef.current && iframeRef.current && iframeRef.current.contentWindow) {
      iframeRef.current.contentWindow.postMessage({ accion, carga }, '*');
    } else {
      colaMensajesRef.current.push({ accion, carga });
    }
  };

  // Escuchar mensajes provenientes del mapa
  useEffect(() => {
    if (Platform.OS !== 'web') return;
    const manejarMensaje = (evento: MessageEvent) => {
      if (!evento.data) return;

      if (evento.data.tipo === 'MAPA_SECTORES_LISTO') {
        mapaListoRef.current = true;
        while (colaMensajesRef.current.length > 0) {
          const item = colaMensajesRef.current.shift();
          if (item && iframeRef.current && iframeRef.current.contentWindow) {
            iframeRef.current.contentWindow.postMessage(item, '*');
          }
        }
        return;
      }

      if (evento.data.tipo === 'MAPA_SECTOR_VERTICES_ACTUALIZADOS') {
        const nuevosPuntos: CoordenadaPunto[] = evento.data.puntos || [];
        prevPuntosInicialesRef.current = JSON.stringify(nuevosPuntos);
        const cruceDetectado = Boolean(evento.data.tieneCruce);
        const superposicionDetectada = Boolean(evento.data.tieneSuperposicion);
        const conflictoDetectado = evento.data.sectorConflicto || null;
        const nuevaArea = calcularAreaHectareas(nuevosPuntos);
        const centroide = calcularCentroide(nuevosPuntos);

        setPuntos(nuevosPuntos);
        setAreaHa(nuevaArea);
        setTieneCruce(cruceDetectado);
        setTieneSuperposicion(superposicionDetectada);
        setSectorConflicto(conflictoDetectado);

        if (onCambioPoligonoRef.current) {
          onCambioPoligonoRef.current({
            puntos: nuevosPuntos,
            areaHectareas: nuevaArea,
            centroide,
            tieneCruce: cruceDetectado,
            tieneSuperposicion: superposicionDetectada,
            sectorConflicto: conflictoDetectado,
          });
        }
      }
    };

    window.addEventListener('message', manejarMensaje);
    return () => window.removeEventListener('message', manejarMensaje);
  }, []);

  // Sincronizar cambio de color del cultivo dinámicamente sin recargar el iframe
  useEffect(() => {
    enviarAccionAMapa('CAMBIAR_COLOR', {
      color: colorPoligonoNuevo,
    });
  }, [colorPoligonoNuevo]);

  // Sincronizar perímetro de la parcela matriz si cambia
  const prevMatrizRef = useRef<string>('');
  useEffect(() => {
    const matrizStr = JSON.stringify(poligonoParcelaMatriz);
    if (matrizStr !== prevMatrizRef.current) {
      prevMatrizRef.current = matrizStr;
      enviarAccionAMapa('CARGAR_PARCELA_MATRIZ', {
        puntosMatriz: poligonoParcelaMatriz,
        nombre: nombreParcela,
        codigo: codigoParcela,
        areaHectareas: areaMatrizHectareas,
      });
    }
  }, [poligonoParcelaMatriz, nombreParcela, codigoParcela, areaMatrizHectareas]);

  // Sincronizar sectores ya asignados
  const prevSectoresRef = useRef<string>('');
  useEffect(() => {
    const sectoresLimpios = sectoresExistentes.map((s) => ({
      id: s.id,
      nombre: s.nombre,
      codigo: s.codigo,
      cultivoNombre: s.cultivoNombre,
      cultivoColorHex: s.colorHex || s.cultivoColorHex || '#15803D',
      variedad: s.variedad,
      areaHectareas: s.areaHectareas,
      puntos: extraerPuntosPoligono(s.delimitacionGeoJson),
    }));

    const sectoresStr = JSON.stringify(sectoresLimpios);
    if (sectoresStr !== prevSectoresRef.current) {
      prevSectoresRef.current = sectoresStr;
      enviarAccionAMapa('CARGAR_SECTORES_EXISTENTES', {
        sectores: sectoresLimpios,
      });
    }
  }, [sectoresExistentes]);

  // Snapping
  useEffect(() => {
    enviarAccionAMapa('CONFIGURAR_SNAPPING', {
      activo: adherenciaActiva,
    });
  }, [adherenciaActiva]);

  // Sincronizar puntos iniciales del nuevo sector si se vacían o actualizan desde el contenedor padre
  useEffect(() => {
    const puntosStr = JSON.stringify(puntosInicialesNuevo || []);
    if (puntosStr !== prevPuntosInicialesRef.current) {
      prevPuntosInicialesRef.current = puntosStr;
      if (!puntosInicialesNuevo || puntosInicialesNuevo.length === 0) {
        limpiar();
      } else {
        setPuntos(puntosInicialesNuevo);
        setAreaHa(calcularAreaHectareas(puntosInicialesNuevo));
        enviarAccionAMapa('ESTABLECER_VERTICES', { puntos: puntosInicialesNuevo });
      }
    }
  }, [puntosInicialesNuevo]);

  const limpiar = () => {
    prevPuntosInicialesRef.current = '[]';
    setPuntos([]);
    setAreaHa(0);
    setTieneCruce(false);
    setTieneSuperposicion(false);
    setSectorConflicto(null);
    enviarAccionAMapa('LIMPIAR');
    if (onCambioPoligonoRef.current) {
      onCambioPoligonoRef.current({
        puntos: [],
        areaHectareas: 0,
        centroide: null,
        tieneCruce: false,
        tieneSuperposicion: false,
        sectorConflicto: null,
      });
    }
  };

  const deshacer = () => enviarAccionAMapa('DESHACER');
  const reordenarContorno = () => enviarAccionAMapa('REORDENAR');
  const alternarAdherencia = () => setAdherenciaActiva((prev) => !prev);
  const ajustarVistaAParcela = () => enviarAccionAMapa('AJUSTAR_A_PARCELA');

  const centrarEnMiUbicacion = async () => {
    const loc = await obtenerUbicacionActual();
    if (loc) {
      enviarAccionAMapa('CENTRAR', { lat: loc.lat, lng: loc.lng, zoom: 17 });
    } else {
      enviarAccionAMapa('LOCALIZAR_ACTUAL');
    }
  };

  // Memoizar el HTML del mapa satelital para que monte UNA SOLA VEZ
  const htmlMapa = useMemo(() => {
    const centroLat = poligonoParcelaMatriz[0]?.latitude || -13.0768;
    const centroLng = poligonoParcelaMatriz[0]?.longitude || -76.3854;
    const colorInicial = colorPoligonoNuevo;

    const sectoresLimpios = sectoresExistentes.map((s) => ({
      id: s.id,
      nombre: s.nombre,
      codigo: s.codigo,
      cultivoNombre: s.cultivoNombre,
      cultivoColorHex: s.colorHex || s.cultivoColorHex || '#15803D',
      variedad: s.variedad,
      areaHectareas: s.areaHectareas,
      puntos: extraerPuntosPoligono(s.delimitacionGeoJson),
    }));

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
        .tooltip-parcela-matriz {
          background: rgba(30, 41, 59, 0.92) !important;
          border: 1.5px solid #F59E0B !important;
          border-radius: 6px !important;
          color: #F8FAFC !important;
          padding: 6px 10px !important;
          font-size: 11px !important;
        }
        .tooltip-sector-ocupado {
          background: rgba(15, 23, 42, 0.92) !important;
          border: 1px solid #334155 !important;
          border-radius: 6px !important;
          color: #F8FAFC !important;
          padding: 6px 10px !important;
          font-size: 11px !important;
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

        const map = L.map('map', {
          center: [${centroLat}, ${centroLng}],
          zoom: 16,
          layers: [googleHibrido]
        });

        L.control.layers({
          "Google Satélite": googleHibrido,
          "Esri Satélite": esriSatelite
        }, null, { position: 'topright' }).addTo(map);

        let esSoloLectura = ${soloLectura ? 'true' : 'false'};
        let colorCultivo = '${colorInicial}';
        let snappingHabilitado = true;

        // Datos iniciales
        let puntosMatrizData = ${JSON.stringify(poligonoParcelaMatriz)}.map(function(p) { return [p.latitude, p.longitude]; });
        let sectoresExistentesData = ${JSON.stringify(sectoresLimpios)};
        let vertices = ${JSON.stringify(puntosInicialesNuevo)}.map(function(p) { return [p.latitude, p.longitude]; });

        // Capas gráficas
        let capaParcelaMatriz = null;
        let capasSectoresExistentes = [];
        let capaPoligonoNuevo = null;
        let marcadoresNuevo = [];
        let marcadoresMediosNuevo = [];

        // Snap marker
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

        function renderizarParcelaMatriz() {
          if (capaParcelaMatriz) {
            map.removeLayer(capaParcelaMatriz);
            capaParcelaMatriz = null;
          }
          if (puntosMatrizData.length < 3) return;

          capaParcelaMatriz = L.polygon(puntosMatrizData, {
            color: '#F59E0B',
            fillColor: '#FEF3C7',
            fillOpacity: 0.08,
            weight: 3,
            dashArray: '8, 6',
            interactive: true
          }).addTo(map);

          capaParcelaMatriz.bindTooltip(
            '<div style="font-weight:700; color:#FBBF24;">PARCELA MATRIZ: ${codigoParcela}</div>' +
            '<div style="color:#F3F4F6;">${nombreParcela} (${Number(areaMatrizHectareas).toFixed(2)} ha)</div>' +
            '<div style="color:#94A3B8; font-size:10px; margin-top:2px;">Límite exterior contenedor</div>',
            { className: 'tooltip-parcela-matriz', sticky: true, opacity: 0.95 }
          );

          try {
            map.fitBounds(capaParcelaMatriz.getBounds(), { padding: [45, 45], maxZoom: 18 });
          } catch (e) {}
        }

        renderizarParcelaMatriz();

        function renderizarSectoresExistentes() {
          capasSectoresExistentes.forEach(function(l) { map.removeLayer(l); });
          capasSectoresExistentes = [];

          if (!sectoresExistentesData || sectoresExistentesData.length === 0) return;

          sectoresExistentesData.forEach(function(sec) {
            if (!sec.puntos || sec.puntos.length < 3) return;
            const latlngs = sec.puntos.map(function(p) { return [p.latitude, p.longitude]; });
            const col = sec.cultivoColorHex || '#15803D';

            const poly = L.polygon(latlngs, {
              color: col,
              fillColor: col,
              fillOpacity: 0.35,
              weight: 2,
              interactive: true
            }).addTo(map);

            const tooltipHtml = [
              '<div style="font-weight:700; color:#F8FAFC;">' + (sec.nombre || 'Sector') + ' (' + (sec.codigo || 'S/C') + ')</div>',
              '<div style="color:#A7F3D0; margin-top:2px;">● ' + (sec.cultivoNombre || 'Cultivo') + (sec.variedad ? ' - ' + sec.variedad : '') + '</div>',
              '<div style="color:#CBD5E1;">Superficie: ' + Number(sec.areaHectareas || 0).toFixed(2) + ' ha</div>',
              '<div style="margin-top:3px; font-size:9.5px; font-weight:700; color:#67E8F9;">SECTOR ASIGNADO</div>'
            ].join('');

            poly.bindTooltip(tooltipHtml, {
              className: 'tooltip-sector-ocupado',
              sticky: true,
              opacity: 0.95
            });

            capasSectoresExistentes.push(poly);
          });
        }

        renderizarSectoresExistentes();

        // Algoritmo de Snap magnético dual: se adhiere tanto a la Parcela Matriz como a otros sectores
        function buscarPuntoSnap(mouseLatLng) {
          if (!snappingHabilitado) return null;
          const mousePt = map.latLngToContainerPoint(mouseLatLng);
          const UMBRAL_VERTICE_PX = 16;
          const UMBRAL_BORDE_PX = 13;
          let menorDist = Infinity;
          let mejorSnap = null;

          // 1. Vértices de la parcela matriz
          puntosMatrizData.forEach(function(v) {
            const vPt = map.latLngToContainerPoint(v);
            const dist = Math.hypot(mousePt.x - vPt.x, mousePt.y - vPt.y);
            if (dist < UMBRAL_VERTICE_PX && dist < menorDist) {
              menorDist = dist;
              mejorSnap = { lat: v[0], lng: v[1], origen: 'Linde de Parcela Matriz' };
            }
          });

          // 2. Vértices de sectores ya creados
          sectoresExistentesData.forEach(function(sec) {
            if (!sec.puntos) return;
            sec.puntos.forEach(function(v) {
              const vPt = map.latLngToContainerPoint([v.latitude, v.longitude]);
              const dist = Math.hypot(mousePt.x - vPt.x, mousePt.y - vPt.y);
              if (dist < UMBRAL_VERTICE_PX && dist < menorDist) {
                menorDist = dist;
                mejorSnap = { lat: v.latitude, lng: v.longitude, origen: 'Sector: ' + sec.nombre };
              }
            });
          });

          if (mejorSnap) return mejorSnap;

          // 3. Bordes de la parcela matriz
          const lenMat = puntosMatrizData.length;
          for (let i = 0; i < lenMat; i++) {
            const a = puntosMatrizData[i];
            const b = puntosMatrizData[(i + 1) % lenMat];
            const aPt = map.latLngToContainerPoint(a);
            const bPt = map.latLngToContainerPoint(b);

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
              mejorSnap = {
                lat: a[0] + t * (b[0] - a[0]),
                lng: a[1] + t * (b[1] - a[1]),
                origen: 'Borde de Parcela Matriz'
              };
            }
          }

          // 4. Bordes de sectores existentes
          sectoresExistentesData.forEach(function(sec) {
            if (!sec.puntos || sec.puntos.length < 2) return;
            const len = sec.puntos.length;
            for (let i = 0; i < len; i++) {
              const a = sec.puntos[i];
              const b = sec.puntos[(i + 1) % len];
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
                mejorSnap = {
                  lat: a.latitude + t * (b.latitude - a.latitude),
                  lng: a.longitude + t * (b.longitude - a.longitude),
                  origen: 'Borde de Sector ' + sec.nombre
                };
              }
            }
          });

          return mejorSnap;
        }

        // Validación de superposición con otros sectores
        function evaluarSuperposicionConOtrosSectores(misVertices) {
          if (misVertices.length < 3 || sectoresExistentesData.length === 0) {
            return { superpuesto: false, conflicto: null };
          }

          if (typeof turf !== 'undefined' && turf.intersect) {
            try {
              const coordsMi = misVertices.map(function(v) { return [v[1], v[0]]; });
              coordsMi.push([misVertices[0][1], misVertices[0][0]]);
              const polyMi = turf.polygon([coordsMi]);

              for (let sIdx = 0; sIdx < sectoresExistentesData.length; sIdx++) {
                const sec = sectoresExistentesData[sIdx];
                if (!sec.puntos || sec.puntos.length < 3) continue;

                const coordsOc = sec.puntos.map(function(pt) { return [pt.longitude, pt.latitude]; });
                coordsOc.push([sec.puntos[0].longitude, sec.puntos[0].latitude]);
                const polyOc = turf.polygon([coordsOc]);

                let inter = null;
                try {
                  inter = turf.intersect(turf.featureCollection([polyMi, polyOc]));
                } catch (e1) {
                  try { inter = turf.intersect(polyMi, polyOc); } catch (e2) {}
                }

                if (inter) {
                  const areaM2 = turf.area(inter);
                  if (areaM2 > 5) {
                    return { superpuesto: true, conflicto: sec.nombre };
                  }
                }
              }
              return { superpuesto: false, conflicto: null };
            } catch (err) {}
          }
          return { superpuesto: false, conflicto: null };
        }

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

        function redibujarEnArrastre() {
          const cruce = tieneAutoInterseccion(vertices);
          const superposicion = evaluarSuperposicionConOtrosSectores(vertices);
          const hayError = cruce || superposicion.superpuesto;
          const colorTrazado = hayError ? '#DC2626' : colorCultivo;
          const fillTrazado = hayError ? '#EF4444' : colorCultivo;

          if (capaPoligonoNuevo) {
            capaPoligonoNuevo.setLatLngs(vertices);
            capaPoligonoNuevo.setStyle({ color: colorTrazado, fillColor: fillTrazado, fillOpacity: hayError ? 0.45 : 0.28 });
          }
          marcadoresNuevo.forEach(function(m, idx) {
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
          marcadoresNuevo.forEach(function(m) { map.removeLayer(m); });
          marcadoresNuevo = [];
          marcadoresMediosNuevo.forEach(function(m) { map.removeLayer(m); });
          marcadoresMediosNuevo = [];

          if (capaPoligonoNuevo) {
            map.removeLayer(capaPoligonoNuevo);
            capaPoligonoNuevo = null;
          }

          const cruce = tieneAutoInterseccion(vertices);
          const superposicion = evaluarSuperposicionConOtrosSectores(vertices);
          const hayError = cruce || superposicion.superpuesto;
          const colorTrazado = hayError ? '#DC2626' : colorCultivo;
          const fillTrazado = hayError ? '#EF4444' : colorCultivo;

          if (vertices.length >= 3) {
            capaPoligonoNuevo = L.polygon(vertices, {
              color: colorTrazado,
              fillColor: fillTrazado,
              fillOpacity: hayError ? 0.45 : 0.28,
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

                  marcadoresNuevo.push(m);
                })(i);
              }

              // Puntos medios para insertar vértices
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

                  marcadoresMediosNuevo.push(midMarker);
                })(i);
              }
            }
          } else if (vertices.length === 2) {
            capaPoligonoNuevo = L.polyline(vertices, { color: colorTrazado, weight: 3 }).addTo(map);
          }

          const puntosFormateados = vertices.map(function(v) { return { latitude: v[0], longitude: v[1] }; });
          window.parent.postMessage({
            tipo: 'MAPA_SECTOR_VERTICES_ACTUALIZADOS',
            puntos: puntosFormateados,
            tieneCruce: cruce,
            tieneSuperposicion: superposicion.superpuesto,
            sectorConflicto: superposicion.conflicto
          }, '*');
        }

        actualizarPoligono();

        // Proximidad de cursor para snap
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

        // Click para registrar vértice en nuevo sector
        map.on('click', function(e) {
          if (esSoloLectura) return;
          const puntoFinal = puntoSnapActivo
            ? [puntoSnapActivo.lat, puntoSnapActivo.lng]
            : [e.latlng.lat, e.latlng.lng];

          vertices.push(puntoFinal);
          actualizarPoligono();
        });

        window.addEventListener('message', function(e) {
          if (!e.data) return;

          if (e.data.accion === 'LIMPIAR') {
            vertices = [];
            actualizarPoligono();
          } else if (e.data.accion === 'ESTABLECER_VERTICES' && e.data.carga) {
            vertices = (e.data.carga.puntos || []).map(function(p) { return [p.latitude, p.longitude]; });
            actualizarPoligono();
          } else if (e.data.accion === 'DESHACER') {
            vertices.pop();
            actualizarPoligono();
          } else if (e.data.accion === 'AJUSTAR_A_PARCELA') {
            if (capaParcelaMatriz) {
              map.fitBounds(capaParcelaMatriz.getBounds(), { padding: [40, 40] });
            }
          } else if (e.data.accion === 'CAMBIAR_COLOR' && e.data.carga) {
            if (e.data.carga.color) {
              colorCultivo = e.data.carga.color;
              document.documentElement.style.setProperty('--color-cultivo', colorCultivo);
              if (capaPoligonoNuevo) {
                const cruce = tieneAutoInterseccion(vertices);
                const superposicion = evaluarSuperposicionConOtrosSectores(vertices);
                const hayError = cruce || superposicion.superpuesto;
                const colorTrazado = hayError ? '#DC2626' : colorCultivo;
                const fillTrazado = hayError ? '#EF4444' : colorCultivo;
                capaPoligonoNuevo.setStyle({ color: colorTrazado, fillColor: fillTrazado });
              }
            }
          } else if (e.data.accion === 'CARGAR_PARCELA_MATRIZ' && e.data.carga) {
            if (Array.isArray(e.data.carga.puntosMatriz)) {
              puntosMatrizData = e.data.carga.puntosMatriz.map(function(p) { return [p.latitude, p.longitude]; });
              renderizarParcelaMatriz();
            }
          } else if (e.data.accion === 'CARGAR_SECTORES_EXISTENTES' && e.data.carga) {
            sectoresExistentesData = e.data.carga.sectores || [];
            renderizarSectoresExistentes();
            actualizarPoligono();
          } else if (e.data.accion === 'CONFIGURAR_SNAPPING' && e.data.carga) {
            snappingHabilitado = Boolean(e.data.carga.activo);
            if (!snappingHabilitado && map.hasLayer(snapMarker)) {
              map.removeLayer(snapMarker);
              puntoSnapActivo = null;
            }
          } else if (e.data.accion === 'CENTRAR' && e.data.carga) {
            map.setView([e.data.carga.lat, e.data.carga.lng], e.data.carga.zoom || 16);
          } else if (e.data.accion === 'LOCALIZAR_ACTUAL') {
            map.locate({ setView: true, maxZoom: 17 });
          }
        });

        window.parent.postMessage({ tipo: 'MAPA_SECTORES_LISTO' }, '*');
      </script>
    </body>
    </html>
    `;
  }, []);

  return (
    <View style={styles.contenedor}>
      {/* Barra de Controles y Métricas de Sub-área */}
      <View style={styles.barraControl}>
        <View style={styles.infoArea}>
          <View style={[styles.muestraColorCultivo, { backgroundColor: colorPoligonoNuevo }]} />
          <Text style={styles.textoAreaEtiqueta}>Área del nuevo sector:</Text>
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
                Invade sector "{sectorConflicto}"
              </Text>
            </View>
          )}
        </View>

        <View style={styles.botonesAccion}>
          {!soloLectura && (
            <Pressable
              onPress={alternarAdherencia}
              style={[styles.botonPequeno, adherenciaActiva && styles.botonAdherenciaActiva]}
              accessibilityLabel="Alternar imán a linderos y sectores"
            >
              <Crosshair size={13} color={adherenciaActiva ? '#0284C7' : '#6B7280'} />
              <Text
                style={[
                  styles.textoBotonPequeno,
                  adherenciaActiva && { color: '#0284C7', fontWeight: '700' },
                ]}
              >
                Imán {adherenciaActiva ? 'ON' : 'OFF'}
              </Text>
            </Pressable>
          )}

          <Pressable onPress={ajustarVistaAParcela} style={styles.botonPequeno}>
            <Maximize2 size={13} color={Palette.forestGreen} />
            <Text style={styles.textoBotonPequeno}>Ajustar a parcela</Text>
          </Pressable>

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

      {/* Guía contextual */}
      <View
        style={[
          styles.bannerGuia,
          tieneSuperposicion && styles.bannerGuiaPeligro,
          !tieneSuperposicion && tieneCruce && styles.bannerGuiaError,
        ]}
      >
        {tieneSuperposicion ? (
          <Text style={styles.textoGuiaPeligro}>
            ⚠️ Superposición detectada: El área trazada invade el sector existente "{sectorConflicto}". Ajuste los puntos para compartir únicamente el lindero.
          </Text>
        ) : tieneCruce ? (
          <Text style={styles.textoGuiaError}>
            ⚠️ Las líneas perimetrales se cruzan. Mueva los puntos para definir un contorno cerrado válido.
          </Text>
        ) : (
          <View style={styles.filaGuia}>
            <Layers size={13} color="#D97706" />
            <Text style={styles.textoGuia}>
              Contorno dorado: <Text style={{ fontWeight: '700' }}>Parcela matriz {codigoParcela}</Text>. Con el <Text style={{ fontWeight: '700' }}>Imán ON</Text>, sus puntos se acoplarán automáticamente a la cerca exterior y a los sectores vecinos.
            </Text>
          </View>
        )}
      </View>

      {/* Iframe del Mapa */}
      <View style={[styles.marcoMapa, { height: altura }]}>
        {Platform.OS === 'web' ? (
          <iframe
            ref={(ref) => {
              iframeRef.current = ref as HTMLIFrameElement;
            }}
            srcDoc={htmlMapa}
            style={{ width: '100%', height: '100%', border: 'none' }}
            title="Delimitador de Sectores de Parcela Agro Vision"
          />
        ) : (
          <View style={styles.avisoNativo}>
            <Text style={styles.textoAvisoNativo}>
              Mapeo de sectores activo ({puntos.length} vértices)
            </Text>
          </View>
        )}
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
    paddingHorizontal: 9,
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
  botonPequenoPeligro: { borderColor: '#FFCDD2', backgroundColor: '#FFF8F8' },
  botonUbicacion: {
    backgroundColor: '#E8F5E9',
    borderColor: '#C8E6C9',
  },
  textoBotonPequeno: { fontSize: 12, fontWeight: '600', color: Palette.forestGreen },
  bannerGuia: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    backgroundColor: '#FEFDF8',
    borderBottomWidth: 1,
    borderBottomColor: '#F5E6BE',
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
  marcoMapa: { width: '100%', minHeight: 380, backgroundColor: '#E5E7EB' },
  avisoNativo: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 20 },
  textoAvisoNativo: { fontSize: 13, fontWeight: '600', color: '#374151' },
});
