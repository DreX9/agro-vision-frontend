import {
  DEPARTAMENTOS_PERU,
  type DepartamentoUbigeo,
  type ProvinciaUbigeo,
} from '@/shared/constants/ubigeo-peru';

export interface ResultadoGeocodificacion {
  lat: number;
  lng: number;
  nombreMostrar: string;
  departamento?: string;
  provincia?: string;
  distrito?: string;
}

export interface ResultadoUbicacionInversa {
  departamento: string;
  provincia: string;
  distrito: string;
  direccion: string;
  nombreMostrar?: string;
}

/**
 * Coordenadas directas de distritos y zonas agrícolas clave de Perú para respuesta instantánea offline.
 */
export const COORDENADAS_DISTRITOS_RAPIDAS: Record<string, { lat: number; lng: number }> = {
  // Distritos de Lima
  'el agustino': { lat: -12.0461, lng: -77.0006 },
  'cercado de lima': { lat: -12.0464, lng: -77.0428 },
  'miraflores': { lat: -12.1217, lng: -77.0297 },
  'san isidro': { lat: -12.0969, lng: -77.0353 },
  'ate': { lat: -12.0289, lng: -76.9189 },
  'santiago de surco': { lat: -12.1436, lng: -76.9936 },
  'la molina': { lat: -12.0789, lng: -76.9489 },
  'san borja': { lat: -12.0944, lng: -77.0022 },
  'san miguel': { lat: -12.0789, lng: -77.0906 },
  'los olivos': { lat: -11.9789, lng: -77.0789 },
  'san juan de lurigancho': { lat: -11.9789, lng: -76.9989 },
  'puente piedra': { lat: -11.8689, lng: -77.0789 },
  'villa el salvador': { lat: -12.2189, lng: -76.9389 },

  // Distritos de Cañete
  'san vicente de cañete': { lat: -13.0768, lng: -76.3854 },
  'imperial': { lat: -13.0619, lng: -76.3533 },
  'lunahuaná': { lat: -12.9619, lng: -76.1367 },
  'nuevo imperial': { lat: -13.0789, lng: -76.3189 },
  'quilmaná': { lat: -12.9489, lng: -76.3789 },
  'cerro azul': { lat: -13.0289, lng: -76.4789 },
  'mala': { lat: -12.6589, lng: -76.6289 },
  'asia': { lat: -12.7789, lng: -76.5789 },
  'san luis': { lat: -13.0489, lng: -76.4189 },

  // Distritos y valles de Ica
  'ica': { lat: -14.0678, lng: -75.7286 },
  'los aquijes': { lat: -14.0989, lng: -75.6889 },
  'salas': { lat: -13.9789, lng: -75.7889 },
  'santiago': { lat: -14.1889, lng: -75.7189 },
  'chincha alta': { lat: -13.4178, lng: -76.1322 },
  'el carmen': { lat: -13.4989, lng: -76.0289 },
  'pisco': { lat: -13.7089, lng: -76.2053 },
  'paracas': { lat: -13.8389, lng: -76.2489 },

  // La Libertad (Chavimochic, Virú)
  'virú': { lat: -8.4144, lng: -78.7525 },
  'chao': { lat: -8.5419, lng: -78.6789 },
  'trujillo': { lat: -8.1117, lng: -79.0287 },

  // Lambayeque (Olmos, Motupe)
  'olmos': { lat: -5.9844, lng: -79.7456 },
  'motupe': { lat: -6.1519, lng: -79.7153 },
  'chiclayo': { lat: -6.7714, lng: -79.8409 },

  // Piura
  'sullana': { lat: -4.9039, lng: -80.6853 },
  'tambo grande': { lat: -4.9289, lng: -80.3456 },

  // Arequipa
  'la joya': { lat: -16.5989, lng: -71.9189 },
  'camaná': { lat: -16.6231, lng: -72.7111 },
};

/**
 * @description Busca coordenadas de un distrito por nombre, primero en caché rápida y luego en Nominatim.
 */
export async function buscarCoordenadasDistrito(
  distrito: string,
  provincia?: string,
  departamento?: string,
): Promise<{ lat: number; lng: number } | null> {
  const normalizado = distrito.trim().toLowerCase();
  if (COORDENADAS_DISTRITOS_RAPIDAS[normalizado]) {
    return COORDENADAS_DISTRITOS_RAPIDAS[normalizado];
  }

  try {
    const consulta = [distrito, provincia, departamento, 'Peru'].filter(Boolean).join(', ');
    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(consulta)}&countrycodes=pe&limit=1`;
    const res = await fetch(url, { headers: { 'User-Agent': 'AgroVisionApp/1.0' } });
    const datos = await res.json();
    if (datos && datos.length > 0) {
      return {
        lat: parseFloat(datos[0].lat),
        lng: parseFloat(datos[0].lon),
      };
    }
  } catch {
    // Si falla la red, retorna null de forma segura
  }
  return null;
}

/**
 * @description Geocodifica una dirección o referencia exacta en Perú.
 */
export async function geocodificarDireccion(
  direccion: string,
): Promise<ResultadoGeocodificacion | null> {
  if (!direccion || direccion.trim().length < 3) return null;

  try {
    const consulta = `${direccion.trim()}, Peru`;
    const url = `https://nominatim.openstreetmap.org/search?format=json&addressdetails=1&q=${encodeURIComponent(consulta)}&countrycodes=pe&limit=1`;
    const res = await fetch(url, { headers: { 'User-Agent': 'AgroVisionApp/1.0' } });
    const datos = await res.json();

    if (datos && datos.length > 0) {
      const item = datos[0];
      const addr = item.address || {};
      return {
        lat: parseFloat(item.lat),
        lng: parseFloat(item.lon),
        nombreMostrar: item.display_name,
        departamento: addr.state || addr.region,
        provincia: addr.county || addr.city_district || addr.city,
        distrito: addr.suburb || addr.town || addr.village || addr.city_district,
      };
    }
  } catch {
    // Manejo resiliente
  }
  return null;
}

/**
 * @description Normaliza cadenas de texto eliminando tildes y espacios extras para comparaciones robustas.
 */
export function normalizarTexto(texto: string): string {
  if (!texto) return '';
  return texto
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
}

/**
 * @description Obtiene la ubicación geográfica actual del dispositivo o navegador web.
 */
export function obtenerUbicacionActual(): Promise<{ lat: number; lng: number } | null> {
  return new Promise((resolve) => {
    if (typeof window !== 'undefined' && typeof navigator !== 'undefined' && 'geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          resolve({
            lat: Number(pos.coords.latitude.toFixed(6)),
            lng: Number(pos.coords.longitude.toFixed(6)),
          });
        },
        (error) => {
          console.warn('Geolocalización no disponible o permiso denegado:', error.message);
          resolve(null);
        },
        {
          enableHighAccuracy: true,
          timeout: 6000,
          maximumAge: 30000,
        },
      );
    } else {
      resolve(null);
    }
  });
}

function distanciaCuadratica(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const dLat = lat1 - lat2;
  const dLng = lng1 - lng2;
  return dLat * dLat + dLng * dLng;
}

function encontrarDepartamentoMasCercano(lat: number, lng: number): DepartamentoUbigeo {
  let mejor = DEPARTAMENTOS_PERU[0];
  let menorDist = Infinity;
  for (const d of DEPARTAMENTOS_PERU) {
    const dist = distanciaCuadratica(lat, lng, d.centro.lat, d.centro.lng);
    if (dist < menorDist) {
      menorDist = dist;
      mejor = d;
    }
  }
  return mejor;
}

function encontrarProvinciaMasCercana(
  lat: number,
  lng: number,
  depto: DepartamentoUbigeo,
): ProvinciaUbigeo {
  let mejor = depto.provincias[0];
  let menorDist = Infinity;
  for (const p of depto.provincias) {
    if (p.centro) {
      const dist = distanciaCuadratica(lat, lng, p.centro.lat, p.centro.lng);
      if (dist < menorDist) {
        menorDist = dist;
        mejor = p;
      }
    }
  }
  return mejor;
}

function estimarUbicacionPorProximidad(lat: number, lng: number): ResultadoUbicacionInversa {
  const depto = encontrarDepartamentoMasCercano(lat, lng);
  const prov = encontrarProvinciaMasCercana(lat, lng, depto);
  const dist = prov.distritos[0] || prov.nombre;
  return {
    departamento: depto.nombre,
    provincia: prov.nombre,
    distrito: dist,
    direccion: `Sector ${dist}, ${prov.nombre}`,
  };
}

/**
 * @description Geocodificación inversa para Perú: a partir de coordenadas geográficas
 * (latitud, longitud), deduce el departamento, provincia, distrito y dirección/referencia
 * autocompletable en el sistema.
 */
export async function geocodificacionInversa(
  lat: number,
  lng: number,
): Promise<ResultadoUbicacionInversa | null> {
  if (!lat || !lng) return null;

  try {
    const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`;
    const res = await fetch(url, { headers: { 'User-Agent': 'AgroVisionApp/1.0' } });

    if (res.ok) {
      const datos = await res.json();
      if (datos && datos.address) {
        const addr = datos.address;
        const nombreMostrar: string = datos.display_name || '';

        const stateCandidate = normalizarTexto(addr.state || addr.region || addr.province || '');
        const countyCandidate = normalizarTexto(addr.county || addr.city || addr.state_district || '');
        const distCandidate = normalizarTexto(
          addr.suburb || addr.town || addr.village || addr.city_district || addr.municipality || addr.city || '',
        );

        // 1. Buscar Departamento coincidente en DEPARTAMENTOS_PERU
        let deptoEncontrado = DEPARTAMENTOS_PERU.find((d) => {
          const normD = normalizarTexto(d.nombre);
          return normD === stateCandidate || stateCandidate.includes(normD) || normD.includes(stateCandidate);
        });

        if (!deptoEncontrado) {
          deptoEncontrado = encontrarDepartamentoMasCercano(lat, lng);
        }

        let provEncontrada: ProvinciaUbigeo | undefined;
        let distEncontrado = '';

        if (deptoEncontrado) {
          // 2. Buscar Provincia coincidente dentro del departamento
          provEncontrada = deptoEncontrado.provincias.find((p) => {
            const normP = normalizarTexto(p.nombre);
            return (
              normP === countyCandidate ||
              countyCandidate.includes(normP) ||
              normP.includes(countyCandidate) ||
              normP === distCandidate
            );
          });

          if (!provEncontrada && deptoEncontrado.provincias.length > 0) {
            provEncontrada = encontrarProvinciaMasCercana(lat, lng, deptoEncontrado);
          }

          if (provEncontrada) {
            // 3. Buscar Distrito coincidente dentro de la provincia
            const matchDist = provEncontrada.distritos.find((dist) => {
              const normDist = normalizarTexto(dist);
              const normDisplay = normalizarTexto(nombreMostrar);
              return (
                normDist === distCandidate ||
                distCandidate.includes(normDist) ||
                normDist.includes(distCandidate) ||
                normDisplay.includes(normDist)
              );
            });
            distEncontrado = matchDist || provEncontrada.distritos[0] || '';
          }
        }

        // 4. Formatear dirección o referencia de fundo
        const via = addr.road || addr.neighbourhood || addr.suburb || addr.hamlet || '';
        const direccion = via
          ? `${via}${distEncontrado ? `, ${distEncontrado}` : ''}`
          : distEncontrado
          ? `Sector ${distEncontrado}`
          : nombreMostrar.split(',').slice(0, 2).join(', ').trim();

        if (deptoEncontrado && provEncontrada) {
          return {
            departamento: deptoEncontrado.nombre,
            provincia: provEncontrada.nombre,
            distrito: distEncontrado,
            direccion,
            nombreMostrar,
          };
        }
      }
    }
  } catch (err) {
    console.warn('Fallo en geocodificación inversa por red:', err);
  }

  // Fallback por proximidad geométrica
  return estimarUbicacionPorProximidad(lat, lng);
}
