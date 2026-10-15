import React, { useRef, useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Platform,
  Animated,
  useWindowDimensions,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { Scan, RotateCcw, Sparkles, Camera } from 'lucide-react-native';
import { Palette } from '@/constants/theme';
import { DeteccionPlaga } from '../types/diagnostico.types';
import { BoundingBoxOverlay } from './BoundingBoxOverlay';
import { VisorControlesSuperiores } from './VisorControlesSuperiores';

export interface VisorCamaraEscaneoProps {
  detecciones: DeteccionPlaga[];
  cargando: boolean;
  onCapturarYEscanear: (blob: Blob | File | string) => void;
  onLimpiar: () => void;
}

const URL_VIDEO_MUESTRA =
  'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4';

/**
 * @description Visor multimedia adaptativo con video/webcam en Web, carga de fotos locales y CameraView en vivo continuo en Android.
 */
export const VisorCamaraEscaneo: React.FC<VisorCamaraEscaneoProps> = ({
  detecciones,
  cargando,
  onCapturarYEscanear,
  onLimpiar,
}) => {
  const { width: windowWidth, height: windowHeight } = useWindowDimensions();
  const [esPantallaCompleta, setEsPantallaCompleta] = useState(false);
  const [camaraActiva, setCamaraActiva] = useState(false);
  const [imagenPreviewUrl, setImagenPreviewUrl] = useState<string | null>(null);

  // Refs Web y Android
  const videoWebRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const cameraAndroidRef = useRef<CameraView | null>(null);
  const inputArchivoWebRef = useRef<HTMLInputElement | null>(null);
  const animacionLaser = useRef(new Animated.Value(0)).current;

  // Permisos para cámara nativa en Android
  const [permisoAndroid, solicitarPermisoAndroid] = useCameraPermissions();

  // Animación del escáner láser
  useEffect(() => {
    if (cargando) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(animacionLaser, { toValue: 1, duration: 1200, useNativeDriver: true }),
          Animated.timing(animacionLaser, { toValue: 0, duration: 1200, useNativeDriver: true }),
        ]),
      ).start();
    } else {
      animacionLaser.stopAnimation();
      animacionLaser.setValue(0);
    }
  }, [cargando, animacionLaser]);

  // Limpiar stream web al desmontar
  useEffect(() => {
    return () => {
      if (streamRef.current) streamRef.current.getTracks().forEach((track) => track.stop());
    };
  }, []);

  // Manejo de cámara web en navegadores PC / Laptop
  const toggleCamaraWeb = async () => {
    if (Platform.OS !== 'web') return;

    if (camaraActiva) {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }
      if (videoWebRef.current) {
        videoWebRef.current.srcObject = null;
        videoWebRef.current.src = URL_VIDEO_MUESTRA;
        videoWebRef.current.play().catch(() => {});
      }
      setCamaraActiva(false);
      return;
    }

    try {
      if (!navigator.mediaDevices?.getUserMedia) {
        alert('Tu navegador no soporta acceso a la cámara.');
        return;
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: 'environment' }, width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false,
      });

      if (stream && videoWebRef.current) {
        streamRef.current = stream;
        setImagenPreviewUrl(null);
        videoWebRef.current.removeAttribute('src');
        videoWebRef.current.srcObject = stream;
        await videoWebRef.current.play();
        setCamaraActiva(true);
      }
    } catch (err) {
      console.error('Error al encender cámara web:', err);
      alert('No se pudo acceder a la cámara. Verifica los permisos.');
    }
  };

  // Manejo de selección de archivo local en web
  const handleAbrirSelectorArchivo = () => {
    if (inputArchivoWebRef.current) {
      inputArchivoWebRef.current.value = '';
      inputArchivoWebRef.current.click();
    }
  };

  const handleArchivoSeleccionado = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (camaraActiva && streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
        setCamaraActiva(false);
      }
      const url = URL.createObjectURL(file);
      setImagenPreviewUrl(url);
      onCapturarYEscanear(file);
    }
  };

  // Capturar frame desde Canvas (Web)
  const ejecutarEscaneoWeb = async () => {
    if (cargando || Platform.OS !== 'web') return;
    try {
      const canvas = document.createElement('canvas');
      canvas.width = 640;
      canvas.height = 640;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        if (camaraActiva && videoWebRef.current) {
          ctx.drawImage(videoWebRef.current, 0, 0, 640, 640);
        } else if (imagenPreviewUrl) {
          const img = new Image();
          img.crossOrigin = 'anonymous';
          img.src = imagenPreviewUrl;
          await new Promise((res) => {
            img.onload = res;
          });
          ctx.drawImage(img, 0, 0, 640, 640);
        } else {
          ctx.fillStyle = '#2d5a27';
          ctx.fillRect(0, 0, 640, 640);
          ctx.fillStyle = '#b45309';
          ctx.beginPath();
          ctx.arc(280, 260, 45, 0, Math.PI * 2);
          ctx.fill();
        }
        canvas.toBlob((blob) => {
          if (blob) onCapturarYEscanear(blob);
        }, 'image/jpeg', 0.9);
      }
    } catch (e) {
      console.error('Error al capturar frame web:', e);
    }
  };

  // Capturar frame continuo de CameraView en vivo (Android)
  const ejecutarEscaneoAndroid = async () => {
    if (cargando || !cameraAndroidRef.current) return;
    try {
      const foto = await cameraAndroidRef.current.takePictureAsync({
        quality: 0.8,
        skipProcessing: false,
      });
      if (foto?.uri) {
        onCapturarYEscanear(foto.uri);
      }
    } catch (err) {
      console.error('Error al capturar cuadro de cámara en Android:', err);
    }
  };

  const handleLimpiarTodo = () => {
    setImagenPreviewUrl(null);
    onLimpiar();
  };

  const translateY = animacionLaser.interpolate({
    inputRange: [0, 1],
    outputRange: [0, esPantallaCompleta ? windowHeight - 120 : 380],
  });

  return (
    <View style={[styles.contenedor, esPantallaCompleta && [styles.pantallaCompleta, { width: windowWidth, height: windowHeight }]]}>
      <View style={styles.visorMedia}>
        {Platform.OS === 'web' && (
          <input
            type="file"
            ref={inputArchivoWebRef}
            accept="image/*"
            style={{ display: 'none' }}
            onChange={handleArchivoSeleccionado}
          />
        )}

        {Platform.OS === 'web' ? (
          imagenPreviewUrl && !camaraActiva ? (
            <img
              src={imagenPreviewUrl}
              alt="Captura cargada"
              style={styles.videoWeb as any}
            />
          ) : (
            <video
              ref={videoWebRef}
              autoPlay
              playsInline
              muted
              loop
              style={styles.videoWeb}
              src={!camaraActiva ? URL_VIDEO_MUESTRA : undefined}
            />
          )
        ) : permisoAndroid?.granted ? (
          <CameraView ref={cameraAndroidRef} facing="back" style={StyleSheet.absoluteFill} />
        ) : (
          <View style={styles.cajaPermisoAndroid}>
            <Camera size={44} color="#10B981" />
            <Text style={styles.permisoTitulo}>Acceso a Cámara Requerido</Text>
            <Text style={styles.permisoSub}>Se requiere permiso para enfocar cultivos en vivo desde tu celular.</Text>
            <Pressable onPress={solicitarPermisoAndroid} style={styles.botonSolicitarPermiso}>
              <Text style={styles.textoBotonPermiso}>Habilitar Cámara en Vivo</Text>
            </Pressable>
          </View>
        )}

        {/* Efecto de Escaneo Láser */}
        {cargando && (
          <Animated.View style={[styles.lineaLaser, { transform: [{ translateY }] }]}>
            <View style={styles.brilloLaser} />
          </Animated.View>
        )}

        {/* Cajas Delimitadoras Detectadas */}
        <BoundingBoxOverlay detecciones={detecciones} />

        {/* Barra Superior con Controles */}
        <VisorControlesSuperiores
          camaraActiva={Platform.OS === 'web' ? camaraActiva : true}
          esPantallaCompleta={esPantallaCompleta}
          onToggleCamara={toggleCamaraWeb}
          onTogglePantallaCompleta={() => setEsPantallaCompleta(!esPantallaCompleta)}
          onSubirFoto={handleAbrirSelectorArchivo}
        />

        {/* Barra de Acciones Inferior */}
        <View style={styles.barraInferiorFlotante}>
          {detecciones.length > 0 && (
            <Pressable onPress={handleLimpiarTodo} style={({ pressed }) => [styles.botonReiniciar, pressed && styles.presionado]}>
              <RotateCcw size={16} color="#FFFFFF" />
              <Text style={styles.textoBotonReiniciar}>Limpiar</Text>
            </Pressable>
          )}

          <Pressable
            disabled={cargando}
            onPress={Platform.OS === 'web' ? ejecutarEscaneoWeb : ejecutarEscaneoAndroid}
            style={({ pressed }) => [styles.botonEscanear, cargando && styles.botonEscanearCargando, pressed && styles.presionado]}
          >
            <Scan size={22} color="#FFFFFF" />
            <Text style={styles.textoBotonEscanear}>
              {cargando ? 'Escaneando planta...' : 'Empezar a escanear'}
            </Text>
            <Sparkles size={16} color="#6EE7B7" />
          </Pressable>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  contenedor: { width: '100%', borderRadius: 16, overflow: 'hidden', backgroundColor: '#0F172A', elevation: 4 },
  pantallaCompleta: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 9999, borderRadius: 0 },
  visorMedia: { width: '100%', height: 420, position: 'relative', overflow: 'hidden', backgroundColor: '#0F172A' },
  videoWeb: { width: '100%', height: '100%', objectFit: 'cover', backgroundColor: '#0F172A' },
  cajaPermisoAndroid: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, gap: 12 },
  permisoTitulo: { color: '#F8FAFC', fontSize: 18, fontWeight: '700', textAlign: 'center' },
  permisoSub: { color: '#94A3B8', fontSize: 13, textAlign: 'center', maxWidth: 280, lineHeight: 18 },
  botonSolicitarPermiso: {
    backgroundColor: Palette.forestGreen,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    marginTop: 4,
  },
  textoBotonPermiso: { color: '#FFFFFF', fontSize: 14, fontWeight: '700' },
  barraInferiorFlotante: {
    position: 'absolute',
    bottom: 20,
    left: 14,
    right: 14,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 10,
    zIndex: 20,
  },
  botonEscanear: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: Palette.forestGreen,
    paddingVertical: 14,
    paddingHorizontal: 26,
    borderRadius: 30,
    elevation: 6,
  },
  botonEscanearCargando: { backgroundColor: '#065F46', opacity: 0.85 },
  textoBotonEscanear: { color: '#FFFFFF', fontSize: 16, fontWeight: '700', letterSpacing: 0.3 },
  botonReiniciar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(30, 41, 59, 0.85)',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 24,
  },
  textoBotonReiniciar: { color: '#F1F5F9', fontSize: 13, fontWeight: '600' },
  presionado: { opacity: 0.85, transform: [{ scale: 0.98 }] },
  lineaLaser: { position: 'absolute', left: 0, right: 0, height: 3, backgroundColor: '#10B981', zIndex: 15 },
  brilloLaser: { width: '100%', height: 28, marginTop: -14, backgroundColor: 'rgba(16, 185, 129, 0.25)' },
});
