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
