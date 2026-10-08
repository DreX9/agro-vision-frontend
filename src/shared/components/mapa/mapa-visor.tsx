import React, { useRef } from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { type CoordenadaPunto } from '@/shared/utils/geometria';

export interface MapaVisorProps {
  puntos: CoordenadaPunto[];
  centro?: { lat: number; lng: number };
  etiqueta?: string;
  altura?: number;
}

/**
 * @description Componente de solo lectura para visualizar un polígono de parcela en el mapa satelital.
 */
export const MapaVisor: React.FC<MapaVisorProps> = ({
  puntos,
  centro,
  etiqueta = 'Parcela',
  altura = 260,
}) => {
  const centroLat = centro?.lat ?? (puntos.length > 0 ? puntos[0].latitude : -13.0768);
  const centroLng = centro?.lng ?? (puntos.length > 0 ? puntos[0].longitude : -76.3854);

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8" />
      <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
      <style>body, html, #map { margin: 0; padding: 0; width: 100%; height: 100%; }</style>
    </head>
    <body>
      <div id="map"></div>
      <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
      <script>
        const satelite = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}');
        const map = L.map('map', {
          center: [${centroLat}, ${centroLng}],
          zoom: 15,
          layers: [satelite]
        });

        const vertices = ${JSON.stringify(puntos)}.map(p => [p.latitude, p.longitude]);
        if (vertices.length >= 3) {
          const poly = L.polygon(vertices, {
            color: '#2E7D32',
            weight: 3,
            fillColor: '#4CAF50',
            fillOpacity: 0.45
          }).addTo(map);
          poly.bindPopup('<b>${etiqueta}</b>').openPopup();
          map.fitBounds(poly.getBounds());
        } else if (vertices.length > 0) {
          L.marker([${centroLat}, ${centroLng}]).addTo(map).bindPopup('<b>${etiqueta}</b>');
        }
      </script>
    </body>
    </html>
  `;

  return (
    <View style={[styles.contenedor, { height: altura }]}>
      {Platform.OS === 'web' && (
        <iframe
          srcDoc={html}
          style={{ width: '100%', height: '100%', border: 'none' }}
          title={etiqueta}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  contenedor: {
    width: '100%',
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: '#E5E7EB',
    borderWidth: 1,
    borderColor: '#D0DEC8',
  },
});
