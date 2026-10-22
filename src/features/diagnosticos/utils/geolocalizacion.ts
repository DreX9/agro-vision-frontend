import { Platform } from 'react-native';
import * as Location from 'expo-location';

export interface CoordenadasGps {
  latitud: number;
  longitud: number;
  precision?: number | null;
}

/**
 * @description Obtiene las coordenadas GPS del dispositivo o navegador en tiempo real.
 * Si está en Web, consulta navigator.geolocation; en móvil consulta expo-location.
 */
export async function obtenerCoordenadasDispositivo(): Promise<CoordenadasGps | null> {
  try {
    if (Platform.OS === 'web') {
      if (typeof navigator !== 'undefined' && navigator.geolocation) {
        return new Promise((resolve) => {
          navigator.geolocation.getCurrentPosition(
            (pos) => {
              resolve({
                latitud: pos.coords.latitude,
                longitud: pos.coords.longitude,
                precision: pos.coords.accuracy,
              });
            },
            (err) => {
              console.warn('GPS de alta precisión no disponible o demoró, reintentando con ubicación de red/Wi-Fi:', err.message);
              navigator.geolocation.getCurrentPosition(
                (posNet) => {
                  resolve({
                    latitud: posNet.coords.latitude,
                    longitud: posNet.coords.longitude,
                    precision: posNet.coords.accuracy,
                  });
                },
                (errNet) => {
                  console.warn('Error definitivo al obtener geolocalización:', errNet.message);
                  resolve(null);
                },
                {
                  enableHighAccuracy: false,
                  timeout: 10000,
                  maximumAge: 300000,
                },
              );
            },
            {
              enableHighAccuracy: true,
              timeout: 6000,
              maximumAge: 60000,
            },
          );
        });
      }
      return null;
    }

    // Entorno móvil nativo (Android / iOS)
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      console.warn('Permiso de geolocalización denegado en el dispositivo.');
      return null;
    }

    const loc = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.High,
    });

    return {
      latitud: loc.coords.latitude,
      longitud: loc.coords.longitude,
      precision: loc.coords.accuracy,
    };
  } catch (error) {
    console.warn('Excepción al consultar GPS del dispositivo:', error);
    return null;
  }
}

/**
 * @description Abre la ubicación en Google Maps en una nueva pestaña (web) o en la app de mapas (móvil).
 */
export function abrirGoogleMaps(latitud: number, longitud: number) {
  const url = `https://www.google.com/maps?q=${latitud},${longitud}`;
  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    window.open(url, '_blank', 'noopener,noreferrer');
  } else {
    import('react-native').then(({ Linking }) => {
      Linking.openURL(url).catch((err) =>
        console.error('No se pudo abrir Google Maps:', err),
      );
    });
  }
}

