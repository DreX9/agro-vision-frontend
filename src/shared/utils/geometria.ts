export interface CoordenadaPunto {
  latitude: number;
  longitude: number;
}

/**
 * @description Calcula el área geodésica de un polígono en hectáreas (ha) usando la fórmula esférica.
 * @param puntos Lista de coordenadas de los vértices del polígono
 * @returns Área en hectáreas redondeada a 4 decimales
 */
export function calcularAreaHectareas(puntos: CoordenadaPunto[]): number {
  if (!puntos || puntos.length < 3) {
    return 0;
  }

  const radioTierraM = 6378137;
  let areaTotalM2 = 0;
  const len = puntos.length;

  for (let i = 0; i < len; i++) {
    const pAnterior = puntos[(i - 1 + len) % len];
    const pSiguiente = puntos[(i + 1) % len];
    const pActual = puntos[i];

    const lngDiff = ((pSiguiente.longitude - pAnterior.longitude) * Math.PI) / 180;
    const latRad = (pActual.latitude * Math.PI) / 180;

    areaTotalM2 += lngDiff * Math.sin(latRad);
  }

  areaTotalM2 = Math.abs((areaTotalM2 * radioTierraM * radioTierraM) / 2.0);

  // 1 hectárea = 10,000 m²
  const hectareas = areaTotalM2 / 10000;
  return Number(hectareas.toFixed(4));
}

/**
 * @description Calcula el centro geográfico (centroide promedio) de un conjunto de coordenadas.
 */
export function calcularCentroide(puntos: CoordenadaPunto[]): CoordenadaPunto | null {
  if (!puntos || puntos.length === 0) {
    return null;
  }

  let sumaLat = 0;
  let sumaLng = 0;

  for (const p of puntos) {
    sumaLat += p.latitude;
    sumaLng += p.longitude;
  }

  return {
    latitude: Number((sumaLat / puntos.length).toFixed(6)),
    longitude: Number((sumaLng / puntos.length).toFixed(6)),
  };
}

/**
 * @description Comprueba si dos segmentos de línea se intersectan o cruzan entre sí.
 */
export function seCruzanSegmentos(
  a: CoordenadaPunto,
  b: CoordenadaPunto,
  c: CoordenadaPunto,
  d: CoordenadaPunto,
): boolean {
  const ccw = (p1: CoordenadaPunto, p2: CoordenadaPunto, p3: CoordenadaPunto): number => {
    return (
      (p3.longitude - p1.longitude) * (p2.latitude - p1.latitude) -
      (p3.latitude - p1.latitude) * (p2.longitude - p1.longitude)
    );
  };

  const d1 = ccw(a, b, c);
  const d2 = ccw(a, b, d);
  const d3 = ccw(c, d, a);
  const d4 = ccw(c, d, b);

  return (
    ((d1 > 0 && d2 < 0) || (d1 < 0 && d2 > 0)) &&
    ((d3 > 0 && d4 < 0) || (d3 < 0 && d4 > 0))
  );
}

/**
 * @description Evalúa si los bordes de un polígono se cruzan entre sí (polígono auto-intersecante o en reloj de arena).
 * Un polígono agrícola válido no debe cruzar sus líneas de límite.
 */
export function esPoligonoAutoIntersecante(puntos: CoordenadaPunto[]): boolean {
  if (!puntos || puntos.length < 4) return false;
  const n = puntos.length;

  for (let i = 0; i < n; i++) {
    const a = puntos[i];
    const b = puntos[(i + 1) % n];

    for (let j = i + 1; j < n; j++) {
      // Ignorar segmentos adyacentes que comparten un vértice
      if (j === i || j === (i + 1) % n || (i === 0 && j === n - 1)) continue;

      const c = puntos[j];
      const d = puntos[(j + 1) % n];

      if (seCruzanSegmentos(a, b, c, d)) {
        return true;
      }
    }
  }

  return false;
}

/**
 * @description Reordena los vértices en sentido angular perimetral alrededor del centroide.
 * Corrige polígonos complejos o con líneas cruzadas transformándolos en un contorno perimetral cerrado y limpio.
 */
export function ordenarPuntosPerimetralmente(puntos: CoordenadaPunto[]): CoordenadaPunto[] {
  if (!puntos || puntos.length < 3) return [...(puntos || [])];
  const centro = calcularCentroide(puntos);
  if (!centro) return [...puntos];

  return [...puntos].sort((a, b) => {
    const angA = Math.atan2(a.latitude - centro.latitude, a.longitude - centro.longitude);
    const angB = Math.atan2(b.latitude - centro.latitude, b.longitude - centro.longitude);
    return angA - angB;
  });
}
/**
 * @description Extrae de manera robusta un arreglo de vértices CoordenadaPunto a partir de cualquier
 * estructura almacenada (GeoJSON Feature, Geometry Polygon, Array de coordenadas o string JSON).
 */
export function extraerPuntosPoligono(geoRaw: unknown): CoordenadaPunto[] {
  if (!geoRaw) return [];
  try {
    let geo: any = geoRaw;
    if (typeof geo === 'string') {
      try {
        geo = JSON.parse(geo);
      } catch {
        return [];
      }
    }

    // Caso 1: Array directo de coordenadas [{ latitude, longitude }] o [[lat, lng], ...]
    if (Array.isArray(geo)) {
      const puntos = geo
        .map((item: any) => {
          if (!item) return null;
          if (typeof item === 'object' && !Array.isArray(item)) {
            const lat = Number(item.latitude ?? item.lat);
            const lng = Number(item.longitude ?? item.lng);
            if (!isNaN(lat) && !isNaN(lng)) {
              return { latitude: lat, longitude: lng };
            }
          }
          if (Array.isArray(item) && item.length >= 2) {
            let lat = Number(item[0]);
            let lng = Number(item[1]);
            // Heurística de inversión de ejes si lat y lng están invertidos (e.g. Perú latitud ~ -12, longitud ~ -76)
            if (lat < -50 && lng > -20 && lng < 0) {
              const temp = lat;
              lat = lng;
              lng = temp;
            }
            if (!isNaN(lat) && !isNaN(lng)) {
              return { latitude: lat, longitude: lng };
            }
          }
          return null;
        })
        .filter((p): p is CoordenadaPunto => p !== null);

      if (puntos.length > 0) return puntos;
    }

    // Caso 2: GeoJSON Feature o Geometry Polygon
    if (geo && typeof geo === 'object') {
      if (geo.type === 'Feature' && geo.geometry) {
        geo = geo.geometry;
      }

      const coordinates = geo.coordinates;
      if (Array.isArray(coordinates)) {
        // En GeoJSON Polygon estándar, coordinates es [ [ [lng, lat], [lng, lat], ... ] ]
        let anillo: any[] = coordinates;
        if (Array.isArray(coordinates[0])) {
          anillo = Array.isArray(coordinates[0][0]) ? coordinates[0][0] : coordinates[0];
        }

        const puntosGeoJson = anillo
          .map((coord: any) => {
            if (Array.isArray(coord) && coord.length >= 2) {
              // Estándar GeoJSON: [longitud, latitud]
              const lng = Number(coord[0]);
              const lat = Number(coord[1]);
              if (!isNaN(lat) && !isNaN(lng)) {
                return { latitude: lat, longitude: lng };
              }
            } else if (coord && typeof coord === 'object') {
              const lat = Number(coord.latitude ?? coord.lat);
              const lng = Number(coord.longitude ?? coord.lng);
              if (!isNaN(lat) && !isNaN(lng)) {
                return { latitude: lat, longitude: lng };
              }
            }
            return null;
          })
          .filter((p): p is CoordenadaPunto => p !== null);

        if (puntosGeoJson.length > 0) return puntosGeoJson;
      }
    }
  } catch (error) {
    console.warn('Error al extraer puntos de delimitación geoespacial:', error);
  }
  return [];
}
