import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Platform,
  ScrollView,
  useWindowDimensions,
  type DimensionValue,
} from 'react-native';
import { useRouter, type Href } from 'expo-router';
import {
  MapPin,
  Layers,
  Maximize2,
  Filter,
  CheckCircle2,
  Compass,
  ArrowRight,
  ExternalLink,
  ChevronRight,
  Map as MapIcon,
} from 'lucide-react-native';
import { Palette } from '@/constants/theme';
import { ParcelaItem, EstadoParcelaTipo } from '@/features/parcelas/types/parcela.types';
import { extraerPuntosPoligono, calcularCentroide, type CoordenadaPunto } from '@/shared/utils/geometria';

export interface MapaGeneralParcelasProps {
  parcelas: ParcelaItem[];
  altura?: DimensionValue;
  titulo?: string;
  subtitulo?: string;
  onSeleccionarParcela?: (parcela: ParcelaItem) => void;
  mostrarResumen?: boolean;
}

interface ParcelaGeoData {
  id: string;
  codigo: string;
  nombre: string;
  cultivoId: string;
  cultivoNombre: string;
  cultivoColorHex: string;
  variedad: string;
  areaHectareas: number;
  estado: EstadoParcelaTipo;
  usuarioResponsableNombre: string;
  ubicacion: string;
  vertices: [number, number][]; // [lat, lng]
  centro: [number, number]; // [lat, lng]
}

/**
 * @description Visor satelital GIS con mapa de proporción cuadrada y panel explorador de lotes adaptativo.
 * En pantallas amplias (Desktop) organiza el mapa cuadrado a la izquierda y la lista interactiva a la derecha.
 * En pantallas móviles se adapta verticalmente con proporciones equilibradas.
 */
export const MapaGeneralParcelas: React.FC<MapaGeneralParcelasProps> = ({
  parcelas,
  titulo = 'Monitoreo Satelital de Predios',
  subtitulo = 'Visualización geoespacial de lotes catastrales y zonificación por cultivo',
  onSeleccionarParcela,
  mostrarResumen = true,
}) => {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const esDesktop = width >= 900;

  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const [cultivoFiltro, setCultivoFiltro] = useState<string>('TODOS');
  const [parcelaSeleccionadaId, setParcelaSeleccionadaId] = useState<string | null>(null);

  // Procesar parcelas con vértices válidos
  const parcelasConPoligono: ParcelaGeoData[] = useMemo(() => {
    return parcelas
      .map((p) => {
        const puntos = extraerPuntosPoligono(p.delimitacionGeoJson);
        if (puntos.length < 3) return null;

        const centroide =
          p.latitudCentro && p.longitudCentro
            ? { latitude: p.latitudCentro, longitude: p.longitudCentro }
            : calcularCentroide(puntos) || puntos[0];

        const ubicacionTexto = [p.distrito, p.provincia, p.departamento]
          .filter(Boolean)
          .join(', ') || p.ubicacion || 'Fundo Agrícola';

        return {
          id: p.id,
          codigo: p.codigo || 'S/C',
          nombre: p.nombre,
          cultivoId: p.cultivoId,
          cultivoNombre: p.cultivoNombre || 'Cultivo',
          cultivoColorHex: p.cultivoColorHex || '#15803D',
          variedad: p.variedad || 'Estándar',
          areaHectareas: p.areaHectareas || 0,
          estado: p.estado || 'ACTIVA',
          usuarioResponsableNombre: p.usuarioResponsableNombre || 'No asignado',
          ubicacion: ubicacionTexto,
          vertices: puntos.map((pt) => [pt.latitude, pt.longitude] as [number, number]),
          centro: [centroide.latitude, centroide.longitude] as [number, number],
        };
      })
      .filter((p): p is ParcelaGeoData => p !== null);
  }, [parcelas]);

  // Lista única de cultivos con color y conteo para la leyenda y filtro
  const listaCultivos = useMemo(() => {
    const mapa = new Map<string, { nombre: string; color: string; cantidad: number; area: number }>();
    for (const p of parcelasConPoligono) {
      const actual = mapa.get(p.cultivoId) || {
        nombre: p.cultivoNombre,
        color: p.cultivoColorHex,
        cantidad: 0,
        area: 0,
      };
      actual.cantidad += 1;
      actual.area += p.areaHectareas;
      mapa.set(p.cultivoId, actual);
    }
    return Array.from(mapa.entries()).map(([id, datos]) => ({
      id,
      ...datos,
      area: Number(datos.area.toFixed(2)),
    }));
  }, [parcelasConPoligono]);

  const totalHectareas = useMemo(() => {
    return Number(
      parcelasConPoligono.reduce((acc, p) => acc + (p.areaHectareas || 0), 0).toFixed(2),
    );
  }, [parcelasConPoligono]);

  // Filtrar parcelas según el botón de cultivo activo
  const parcelasFiltradas = useMemo(() => {
    if (cultivoFiltro === 'TODOS') return parcelasConPoligono;
    return parcelasConPoligono.filter((p) => p.cultivoId === cultivoFiltro);
  }, [parcelasConPoligono, cultivoFiltro]);

  const enviarAccion = (accion: string, carga?: unknown) => {
    if (iframeRef.current && iframeRef.current.contentWindow) {
      iframeRef.current.contentWindow.postMessage({ accion, carga }, '*');
    }
  };

  // Enviar parcelas filtradas al mapa cada vez que cambien
  useEffect(() => {
    enviarAccion('ACTUALIZAR_PARCELAS', {
      parcelas: parcelasFiltradas,
    });
  }, [parcelasFiltradas]);

  // Escuchar mensajes provenientes del iframe
  useEffect(() => {
    if (Platform.OS !== 'web') return;

    const manejarMensaje = (evento: MessageEvent) => {
      if (!evento.data) return;

      if (evento.data.tipo === 'VER_DETALLE_PARCELA' && evento.data.id) {
        router.push(`/parcelas/${evento.data.id}` as Href);
      }

      if (evento.data.tipo === 'SELECCIONAR_PARCELA' && evento.data.id) {
        setParcelaSeleccionadaId(evento.data.id);
        const encontrada = parcelas.find((p) => p.id === evento.data.id);
        if (encontrada && onSeleccionarParcela) {
          onSeleccionarParcela(encontrada);
        }
      }
    };

    window.addEventListener('message', manejarMensaje);
    return () => window.removeEventListener('message', manejarMensaje);
  }, [parcelas, router, onSeleccionarParcela]);

  const centrarEnValle = (lat: number, lng: number) => {
    enviarAccion('CENTRAR', { lat, lng, zoom: 15 });
  };

  const enfocarTodas = () => {
    enviarAccion('ENFOCAR_TODAS');
  };

  const seleccionarLoteDesdePanel = (p: ParcelaGeoData) => {
    setParcelaSeleccionadaId(p.id);
    enviarAccion('CENTRAR', { lat: p.centro[0], lng: p.centro[1], zoom: 16 });
    enviarAccion('ABRIR_POPUP', { id: p.id });

    const encontrada = parcelas.find((item) => item.id === p.id);
    if (encontrada && onSeleccionarParcela) {
      onSeleccionarParcela(encontrada);
    }
  };

  // Generador de documento Leaflet
  const htmlMapa = useMemo(() => {
    const jsonParcelas = JSON.stringify(parcelasConPoligono);

    return `
    <!DOCTYPE html>
    <html lang="es">
    <head>
      <meta charset="utf-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
      <style>
        body, html, #map { margin: 0; padding: 0; width: 100%; height: 100%; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; }
        
        .leaflet-tooltip.tooltip-parcela {
          background: rgba(15, 23, 42, 0.94) !important;
          border: 1px solid rgba(255, 255, 255, 0.2) !important;
          border-radius: 8px !important;
          padding: 8px 12px !important;
          box-shadow: 0 10px 25px rgba(0, 0, 0, 0.35) !important;
          color: #FFFFFF !important;
          backdrop-filter: blur(4px);
        }
        .leaflet-tooltip-bottom:before, .leaflet-tooltip-top:before {
          border-top-color: rgba(15, 23, 42, 0.94) !important;
        }

        .leaflet-popup-content-wrapper {
          padding: 0 !important;
          border-radius: 12px !important;
          overflow: hidden !important;
          box-shadow: 0 20px 35px -5px rgba(0, 0, 0, 0.3) !important;
          border: 1px solid #E2E8F0;
        }
        .leaflet-popup-content {
          margin: 0 !important;
          line-height: 1.4 !important;
          width: 280px !important;
        }
        .popup-cabecera {
          padding: 10px 14px;
          color: #FFFFFF;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .popup-cuerpo {
          padding: 12px 14px;
          background: #FFFFFF;
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        .popup-fila {
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 11.5px;
          border-bottom: 1px dashed #F1F5F9;
          padding-bottom: 5px;
        }
        .popup-label {
          color: #64748B;
          font-weight: 500;
        }
        .popup-valor {
          color: #0F172A;
          font-weight: 700;
          text-align: right;
        }
        .popup-btn-detalle {
          margin-top: 4px;
          width: 100%;
          background: #15803D;
          color: #FFFFFF;
          border: none;
          border-radius: 7px;
          padding: 8px 12px;
          font-size: 12px;
          font-weight: 700;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          transition: background 0.15s ease;
        }
        .popup-btn-detalle:hover {
          background: #166534;
        }

        .etiqueta-lote {
          background: rgba(255, 255, 255, 0.95);
          border: 1.5px solid #0F172A;
          border-radius: 6px;
          padding: 2px 6px;
          font-size: 10.5px;
          font-weight: 800;
          color: #0F172A;
          white-space: nowrap;
          box-shadow: 0 2px 6px rgba(0,0,0,0.3);
          pointer-events: none;
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
          center: [-13.0768, -76.3854],
          zoom: 14,
          maxZoom: 21,
          layers: [googleHibrido]
        });

        L.control.layers({
          "Google Satélite (Híbrido)": googleHibrido,
          "Esri Satélite": esriSatelite,
          "Calles (OSM)": callesOSM
        }, null, { position: 'topright' }).addTo(map);

        let capaPoligonos = L.featureGroup().addTo(map);
        let capaEtiquetas = L.layerGroup().addTo(map);

        let todasLasParcelas = ${jsonParcelas};

        function renderizarParcelas(parcelas) {
          capaPoligonos.clearLayers();
          capaEtiquetas.clearLayers();

          if (!parcelas || parcelas.length === 0) return;

          parcelas.forEach(p => {
            if (!p.vertices || p.vertices.length < 3) return;

            const color = p.cultivoColorHex || '#15803D';

            const poli = L.polygon(p.vertices, {
              color: color,
              fillColor: color,
              fillOpacity: 0.44,
              weight: 2.5
            });

            poli._parcelaId = p.id;

            poli.bindTooltip(\`
              <div style="font-size: 12px; line-height: 1.4;">
                <div style="font-weight: 800; font-size: 13px; display: flex; align-items: center; gap: 6px;">
                  <span style="width: 10px; height: 10px; border-radius: 50%; background: \${color}; border: 1.5px solid #FFF; display: inline-block;"></span>
                  \${p.codigo} · \${p.nombre}
                </div>
                <div style="margin-top: 3px; color: #CBD5E1; font-size: 11.5px;">
                  🌿 <b>\${p.cultivoNombre}</b> (\${p.variedad})
                </div>
                <div style="color: #94A3B8; font-size: 11px;">
                  📐 <b>\${p.areaHectareas} ha</b> · \${p.estado}
                </div>
                <div style="color: #64748B; font-size: 10px; margin-top: 2px;">
                  Clic para abrir ficha completa
                </div>
              </div>
            \`, {
              sticky: true,
              direction: 'top',
              offset: [0, -10],
              className: 'tooltip-parcela'
            });

            poli.on('mouseover', function(e) {
              this.setStyle({
                weight: 4.5,
                fillOpacity: 0.75,
                color: '#FFFFFF'
              });
              this.bringToFront();
            });

            poli.on('mouseout', function(e) {
              this.setStyle({
                weight: 2.5,
                fillOpacity: 0.44,
                color: color
              });
            });

            const popupHtml = \`
              <div>
                <div class="popup-cabecera" style="background: \${color};">
                  <div>
                    <div style="font-size: 10.5px; text-transform: uppercase; letter-spacing: 0.5px; opacity: 0.9;">\${p.codigo}</div>
                    <div style="font-weight: 800; font-size: 14.5px;">\${p.nombre}</div>
                  </div>
                  <span style="background: rgba(255,255,255,0.25); padding: 2px 7px; border-radius: 10px; font-size: 10px; font-weight: 700;">
                    \${p.estado}
                  </span>
                </div>
                <div class="popup-cuerpo">
                  <div class="popup-fila">
                    <span class="popup-label">Cultivo:</span>
                    <span class="popup-valor" style="color: \${color};">🌿 \${p.cultivoNombre}</span>
                  </div>
                  <div class="popup-fila">
                    <span class="popup-label">Variedad:</span>
                    <span class="popup-valor">\${p.variedad}</span>
                  </div>
                  <div class="popup-fila">
                    <span class="popup-label">Superficie:</span>
                    <span class="popup-valor" style="font-size: 12.5px; color: #15803D;">\${p.areaHectareas} Ha</span>
                  </div>
                  <div class="popup-fila">
                    <span class="popup-label">Supervisor:</span>
                    <span class="popup-valor">\${p.usuarioResponsableNombre}</span>
                  </div>
                  <div class="popup-fila">
                    <span class="popup-label">Ubicación:</span>
                    <span class="popup-valor" style="font-size: 10.5px; max-width: 150px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
                      📍 \${p.ubicacion}
                    </span>
                  </div>

                  <button class="popup-btn-detalle" onclick="window.parent.postMessage({ tipo: 'VER_DETALLE_PARCELA', id: '\${p.id}' }, '*')">
                    Ver Ficha Completa &rarr;
                  </button>
                </div>
              </div>
            \`;

            poli.bindPopup(popupHtml, { maxWidth: 300 });

            poli.on('click', function() {
              window.parent.postMessage({ tipo: 'SELECCIONAR_PARCELA', id: p.id }, '*');
            });

            capaPoligonos.addLayer(poli);

            if (p.centro && p.centro.length === 2) {
              const labelIcon = L.divIcon({
                className: '',
                html: \`<div class="etiqueta-lote" style="border-color: \${color};">\${p.codigo}</div>\`,
                iconSize: [54, 20],
                iconAnchor: [27, 10]
              });
              L.marker(p.centro, { icon: labelIcon, interactive: false }).addTo(capaEtiquetas);
            }
          });

          try {
            const bounds = capaPoligonos.getBounds();
            if (bounds.isValid()) {
              map.fitBounds(bounds, { padding: [35, 35], maxZoom: 16 });
            }
          } catch(e) {}
        }

        renderizarParcelas(todasLasParcelas);

        window.addEventListener('message', function(e) {
          if (!e.data || !e.data.accion) return;

          switch(e.data.accion) {
            case 'ACTUALIZAR_PARCELAS':
              renderizarParcelas(e.data.carga.parcelas || []);
              break;
            case 'ENFOCAR_TODAS':
              try {
                const bounds = capaPoligonos.getBounds();
                if (bounds.isValid()) {
                  map.fitBounds(bounds, { padding: [35, 35], maxZoom: 16 });
                }
              } catch(err) {}
              break;
            case 'CENTRAR':
              if (e.data.carga && e.data.carga.lat && e.data.carga.lng) {
                map.flyTo([e.data.carga.lat, e.data.carga.lng], e.data.carga.zoom || 16, { duration: 1.1 });
              }
              break;
            case 'ABRIR_POPUP':
              if (e.data.carga && e.data.carga.id) {
                capaPoligonos.eachLayer(function(layer) {
                  if (layer._parcelaId === e.data.carga.id) {
                    layer.openPopup();
                    layer.setStyle({ weight: 4.5, fillOpacity: 0.75, color: '#FFFFFF' });
                  }
                });
              }
              break;
          }
        });

        setTimeout(function() {
          map.invalidateSize();
          try {
            const bounds = capaPoligonos.getBounds();
            if (bounds.isValid()) {
              map.fitBounds(bounds, { padding: [35, 35], maxZoom: 16 });
            }
          } catch(e) {}
        }, 350);
      </script>
    </body>
    </html>
    `;
  }, [parcelasConPoligono]);

  return (
    <View style={styles.contenedorPrincipal}>
      {/* Encabezado Superior */}
      <View style={styles.encabezado}>
        <View style={styles.titulosColumna}>
          <View style={styles.filaTitulo}>
            <Compass size={18} color={Palette.forestGreen} />
            <Text style={styles.titulo}>{titulo}</Text>
          </View>
          <Text style={styles.subtitulo}>{subtitulo}</Text>
        </View>

        {mostrarResumen && (
          <View style={styles.chipsResumen}>
            <View style={styles.badgeResumen}>
              <Text style={styles.badgeResumenNumero}>{parcelasConPoligono.length}</Text>
              <Text style={styles.badgeResumenTexto}>Lotes</Text>
            </View>
            <View style={[styles.badgeResumen, styles.badgeResumenHectareas]}>
              <Text style={[styles.badgeResumenNumero, styles.badgeResumenTextoVerde]}>
                {totalHectareas}
              </Text>
              <Text style={styles.badgeResumenTexto}>Hectáreas</Text>
            </View>
          </View>
        )}
      </View>

      {/* Barra de Filtros por Cultivo */}
      <View style={styles.barraFiltros}>
        <View style={styles.filaFiltroScroll}>
          <Text style={styles.etiquetaFiltro}>Cultivo:</Text>
          <Pressable
            onPress={() => setCultivoFiltro('TODOS')}
            style={[
              styles.chipFiltro,
              cultivoFiltro === 'TODOS' && styles.chipFiltroActivo,
            ]}
          >
            <Text
              style={[
                styles.textoChipFiltro,
                cultivoFiltro === 'TODOS' && styles.textoChipFiltroActivo,
              ]}
            >
              Todos ({parcelasConPoligono.length})
            </Text>
          </Pressable>

          {listaCultivos.map((c) => {
            const estaActivo = cultivoFiltro === c.id;
            return (
              <Pressable
                key={c.id}
                onPress={() => setCultivoFiltro(estaActivo ? 'TODOS' : c.id)}
                style={[
                  styles.chipFiltro,
                  estaActivo && {
                    backgroundColor: c.color,
                    borderColor: c.color,
                  },
                ]}
              >
                <View style={[styles.dotCultivo, { backgroundColor: c.color }]} />
                <Text
                  style={[
                    styles.textoChipFiltro,
                    estaActivo && { color: '#FFFFFF', fontWeight: '800' },
                  ]}
                >
                  {c.nombre} ({c.cantidad})
                </Text>
              </Pressable>
            );
          })}
        </View>

        <Pressable onPress={enfocarTodas} style={styles.botonEnfocar}>
          <Maximize2 size={13} color={Palette.forestGreen} />
          <Text style={styles.textoBotonEnfocar}>Enfocar todo</Text>
        </Pressable>
      </View>

      {/* Cuerpo en 2 Columnas (Desktop: Mapa Cuadrado a la izquierda + Panel de Lotes a la derecha; Móvil: Vertical) */}
      <View style={[styles.cuerpoDobleColumna, !esDesktop && styles.cuerpoColumnaSimple]}>
        {/* Columna Izquierda: Mapa Satelital Cuadrado */}
        <View style={[styles.panelMapa, !esDesktop && styles.panelMapaMovil]}>
          <View style={[styles.marcoMapa, { height: esDesktop ? 440 : 340 }]}>
            {Platform.OS === 'web' ? (
              <iframe
                ref={(ref) => {
                  iframeRef.current = ref as HTMLIFrameElement;
                }}
                srcDoc={htmlMapa}
                style={{ width: '100%', height: '100%', border: 'none' }}
                title="Visor General de Parcelas Agro Vision"
              />
            ) : (
              <View style={styles.avisoNativo}>
                <MapPin size={32} color={Palette.forestGreen} />
                <Text style={styles.textoAvisoNativo}>Visor satelital disponible en web</Text>
              </View>
            )}
          </View>

          {/* Accesos rápidos de Valles debajo del mapa */}
          <View style={styles.barraVallesMapa}>
            <Text style={styles.textoVallesEtiqueta}>Valles:</Text>
            <Pressable
              onPress={() => centrarEnValle(-13.0768, -76.3854)}
              style={styles.chipValle}
            >
              <Text style={styles.textoChipValle}>Cañete</Text>
            </Pressable>
            <Pressable
              onPress={() => centrarEnValle(-14.0678, -75.7286)}
              style={styles.chipValle}
            >
              <Text style={styles.textoChipValle}>Ica</Text>
            </Pressable>
            <Pressable
              onPress={() => centrarEnValle(-8.1159, -79.0299)}
              style={styles.chipValle}
            >
              <Text style={styles.textoChipValle}>Chavimochic</Text>
            </Pressable>
            <Pressable
              onPress={() => centrarEnValle(-11.4947, -77.2081)}
              style={styles.chipValle}
            >
              <Text style={styles.textoChipValle}>Huaral</Text>
            </Pressable>
            <Pressable
              onPress={() => centrarEnValle(-5.9844, -79.7456)}
              style={styles.chipValle}
            >
              <Text style={styles.textoChipValle}>Olmos</Text>
            </Pressable>
          </View>
        </View>

        {/* Columna Derecha: Explorador Interactivo de Lotes */}
        <View style={[styles.panelLotes, !esDesktop && styles.panelLotesMovil]}>
          <View style={styles.cabeceraPanelLotes}>
            <View style={styles.filaTituloPanelLotes}>
              <Layers size={16} color={Palette.forestGreen} />
              <Text style={styles.tituloPanelLotes}>Lotes Delimitados</Text>
            </View>
            <Text style={styles.subtituloPanelLotes}>
              {parcelasFiltradas.length} predios · Haga clic para enfocar
            </Text>
          </View>

          <ScrollView
            style={styles.listaLotesScroll}
            contentContainerStyle={styles.listaLotesContent}
            showsVerticalScrollIndicator={true}
            nestedScrollEnabled
          >
            {parcelasFiltradas.length === 0 ? (
              <View style={styles.vacioLotes}>
                <Text style={styles.textoVacioLotes}>
                  No hay parcelas con georreferenciación en este filtro.
                </Text>
              </View>
            ) : (
              parcelasFiltradas.map((p) => {
                const esActivo = parcelaSeleccionadaId === p.id;
                return (
                  <Pressable
                    key={p.id}
                    onPress={() => seleccionarLoteDesdePanel(p)}
                    style={[
                      styles.tarjetaLoteItem,
                      esActivo && styles.tarjetaLoteItemActivo,
                    ]}
                  >
                    <View style={styles.loteItemIzquierda}>
                      <View
                        style={[
                          styles.badgeCodigoLote,
                          { borderColor: p.cultivoColorHex },
                          esActivo && { backgroundColor: p.cultivoColorHex },
                        ]}
                      >
                        <Text
                          style={[
                            styles.textoCodigoLote,
                            esActivo && { color: '#FFFFFF' },
                          ]}
                        >
                          {p.codigo}
                        </Text>
                      </View>
                      <View style={styles.loteInfo}>
                        <Text style={styles.loteNombre} numberOfLines={1}>
                          {p.nombre}
                        </Text>
                        <View style={styles.loteMetaFila}>
                          <View
                            style={[
                              styles.dotCultivoPequeno,
                              { backgroundColor: p.cultivoColorHex },
                            ]}
                          />
                          <Text style={styles.loteCultivoTexto} numberOfLines={1}>
                            {p.cultivoNombre} ({p.variedad})
                          </Text>
                        </View>
                      </View>
                    </View>

                    <View style={styles.loteItemDerecha}>
                      <Text style={styles.loteAreaTexto}>{p.areaHectareas} ha</Text>
                      <Pressable
                        onPress={(e) => {
                          e.stopPropagation();
                          router.push(`/parcelas/${p.id}` as Href);
                        }}
                        style={styles.botonVerFichaPequeno}
                      >
                        <Text style={styles.textoBotonVerFicha}>Ficha</Text>
                        <ChevronRight size={13} color={Palette.forestGreen} />
                      </Pressable>
                    </View>
                  </Pressable>
                );
              })
            )}
          </ScrollView>

          <View style={styles.piePanelLotes}>
            <Text style={styles.textoPiePanelLotes}>
              💡 Clic en lote para ubicarlo en el mapa o abrir su ficha técnica.
            </Text>
          </View>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  contenedorPrincipal: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#D0DEC8',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    marginBottom: 24,
  },
  encabezado: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FAFDF9',
    borderBottomWidth: 1,
    borderBottomColor: '#E2EBDC',
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
  },
  titulosColumna: {
    flex: 1,
    minWidth: 220,
    gap: 2,
  },
  filaTitulo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  titulo: {
    fontSize: 16,
    fontWeight: '800',
    color: Palette.text,
    letterSpacing: -0.2,
  },
  subtitulo: {
    fontSize: 12,
    color: Palette.textSecondary,
    lineHeight: 16,
  },
  chipsResumen: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  badgeResumen: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D0DEC8',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
    alignItems: 'center',
  },
  badgeResumenHectareas: {
    backgroundColor: '#F0FDF4',
    borderColor: '#86EFAC',
  },
  badgeResumenNumero: {
    fontSize: 14,
    fontWeight: '800',
    color: Palette.text,
  },
  badgeResumenTextoVerde: {
    color: '#15803D',
  },
  badgeResumenTexto: {
    fontSize: 9.5,
    fontWeight: '600',
    color: '#6B7280',
    textTransform: 'uppercase',
  },
  barraFiltros: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: '#F5F8F3',
    borderBottomWidth: 1,
    borderBottomColor: '#E6EFE0',
    gap: 8,
  },
  filaFiltroScroll: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 6,
    flex: 1,
  },
  etiquetaFiltro: {
    fontSize: 12,
    fontWeight: '700',
    color: '#4B5563',
    marginRight: 2,
  },
  chipFiltro: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D1D5DB',
  },
  chipFiltroActivo: {
    backgroundColor: Palette.forestGreen,
    borderColor: Palette.forestGreen,
  },
  textoChipFiltro: {
    fontSize: 11.5,
    fontWeight: '600',
    color: '#374151',
  },
  textoChipFiltroActivo: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  dotCultivo: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
  },
  botonEnfocar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D0DEC8',
  },
  textoBotonEnfocar: {
    fontSize: 11.5,
    fontWeight: '700',
    color: Palette.forestGreen,
  },
  cuerpoDobleColumna: {
    flexDirection: 'row',
    width: '100%',
  },
  cuerpoColumnaSimple: {
    flexDirection: 'column',
  },
  panelMapa: {
    flex: 1.25,
    minWidth: 320,
    borderRightWidth: 1,
    borderRightColor: '#E2EBDC',
  },
  panelMapaMovil: {
    borderRightWidth: 0,
    borderBottomWidth: 1,
    borderBottomColor: '#E2EBDC',
  },
  marcoMapa: {
    width: '100%',
    backgroundColor: '#E2E8F0',
  },
  avisoNativo: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  textoAvisoNativo: {
    fontSize: 13,
    color: '#4B5563',
    fontWeight: '600',
  },
  barraVallesMapa: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#FAFDF9',
    borderTopWidth: 1,
    borderTopColor: '#E2EBDC',
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 6,
  },
  textoVallesEtiqueta: {
    fontSize: 11,
    fontWeight: '700',
    color: '#6B7280',
    marginRight: 2,
  },
  chipValle: {
    paddingHorizontal: 7,
    paddingVertical: 3,
    backgroundColor: '#EAEFE7',
    borderRadius: 4,
  },
  textoChipValle: {
    fontSize: 11,
    fontWeight: '600',
    color: Palette.forestGreen,
  },
  panelLotes: {
    flex: 0.95,
    minWidth: 280,
    backgroundColor: '#FFFFFF',
    display: 'flex',
    flexDirection: 'column',
    maxHeight: 495,
  },
  panelLotesMovil: {
    maxHeight: 340,
  },
  cabeceraPanelLotes: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: '#FAFDF9',
    borderBottomWidth: 1,
    borderBottomColor: '#EAEFE7',
  },
  filaTituloPanelLotes: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  tituloPanelLotes: {
    fontSize: 13.5,
    fontWeight: '800',
    color: Palette.text,
  },
  subtituloPanelLotes: {
    fontSize: 11,
    color: Palette.textSecondary,
    marginTop: 2,
  },
  listaLotesScroll: {
    flex: 1,
  },
  listaLotesContent: {
    padding: 10,
    gap: 8,
  },
  vacioLotes: {
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textoVacioLotes: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
  },
  tarjetaLoteItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 9,
    borderRadius: 8,
    backgroundColor: '#FAFAF8',
    borderWidth: 1,
    borderColor: '#E5EAE1',
    gap: 8,
  },
  tarjetaLoteItemActivo: {
    backgroundColor: '#F0FDF4',
    borderColor: '#86EFAC',
  },
  loteItemIzquierda: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
    minWidth: 0,
  },
  badgeCodigoLote: {
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 5,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textoCodigoLote: {
    fontSize: 11,
    fontWeight: '800',
    color: Palette.text,
  },
  loteInfo: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  loteNombre: {
    fontSize: 12.5,
    fontWeight: '700',
    color: Palette.text,
  },
  loteMetaFila: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  dotCultivoPequeno: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  loteCultivoTexto: {
    fontSize: 11,
    color: Palette.textSecondary,
  },
  loteItemDerecha: {
    alignItems: 'flex-end',
    gap: 4,
  },
  loteAreaTexto: {
    fontSize: 11.5,
    fontWeight: '800',
    color: '#15803D',
  },
  botonVerFichaPequeno: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    backgroundColor: '#EAEFE7',
  },
  textoBotonVerFicha: {
    fontSize: 10,
    fontWeight: '700',
    color: Palette.forestGreen,
  },
  piePanelLotes: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#FAFDF9',
    borderTopWidth: 1,
    borderTopColor: '#EAEFE7',
  },
  textoPiePanelLotes: {
    fontSize: 10.5,
    color: '#6B7280',
    fontStyle: 'italic',
  },
});
