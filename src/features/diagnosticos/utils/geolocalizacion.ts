import { Platform } from 'react-native';
import * as Location from 'expo-location';

export interface CoordenadasGps {
  latitud: number;
  longitud: number;
  precision?: number | null;
}

// Bandera en memoria para evitar spam de llamadas si el usuario denegó geolocalización en navegador web
let permisoDenegadoWeb = false;

/**
 * @description Solicita los permisos necesarios de ubicación en la app móvil.
 * Se invoca automáticamente en la primera ejecución o al acceder a la cámara.
 */
export async function solicitarPermisosUbicacion(): Promise<boolean> {
  if (Platform.OS === 'web') {
    return true;
  }

  try {
    const { status: statusActual } = await Location.getForegroundPermissionsAsync();
    if (statusActual === 'granted') {
      return true;
    }

    const { status: nuevoStatus } = await Location.requestForegroundPermissionsAsync();
    return nuevoStatus === 'granted';
  } catch (error) {
    console.warn('[AgroVision GPS] Error al solicitar permisos nativos:', error);
    return false;
  }
}

/**
 * @description Obtiene las coordenadas GPS del dispositivo o navegador en tiempo real.
 * Si está en Web, consulta navigator.geolocation con manejo silencioso de denegación.
 * En móvil nativo consulta expo-location previa comprobación de permisos.
 */
export async function obtenerCoordenadasDispositivo(): Promise<CoordenadasGps | null> {
  try {
    if (Platform.OS === 'web') {
      if (permisoDenegadoWeb) {
        return null;
      }

      if (typeof navigator !== 'undefined' && navigator.geolocation) {
        return new Promise((resolve) => {
          navigator.geolocation.getCurrentPosition(
            (pos) => {
              permisoDenegadoWeb = false;
              resolve({
                latitud: pos.coords.latitude,
                longitud: pos.coords.longitude,
                precision: pos.coords.accuracy,
              });
            },
            (err) => {
              // Si el usuario denegó expresamente el permiso (código 1 - PERMISSION_DENIED)
              if (err.code === 1 || err.message?.toLowerCase().includes('denied')) {
                permisoDenegadoWeb = true;
                resolve(null);
                return;
              }

              // Si fue por timeout o precisión, reintentar una sola vez con Wi-Fi/red
              navigator.geolocation.getCurrentPosition(
                (posNet) => {
                  resolve({
                    latitud: posNet.coords.latitude,
                    longitud: posNet.coords.longitude,
                    precision: posNet.coords.accuracy,
                  });
                },
                () => {
                  resolve(null);
                },
                {
                  enableHighAccuracy: false,
                  timeout: 6000,
                  maximumAge: 300000,
                },
              );
            },
            {
              enableHighAccuracy: true,
              timeout: 5000,
              maximumAge: 60000,
            },
          );
        });
      }
      return null;
    }

    // Entorno móvil nativo (Android APK / iOS)
    const tienePermiso = await solicitarPermisosUbicacion();
    if (!tienePermiso) {
      return null;
    }

    const loc = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Balanced,
    });

    return {
      latitud: loc.coords.latitude,
      longitud: loc.coords.longitude,
      precision: loc.coords.accuracy,
    };
  } catch {
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
