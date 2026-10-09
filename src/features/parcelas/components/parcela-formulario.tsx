import React, { useState, useEffect, useRef } from 'react';
import { View, Text, ScrollView, useWindowDimensions, Alert } from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Compass, AlertTriangle } from 'lucide-react-native';
import { Palette } from '@/constants/theme';
import { Boton, Input } from '@/shared/components/ui';
import { MapaDelimitador } from '@/shared/components/mapa/mapa-delimitador';
import { CultivoItem } from '@/features/cultivos/types/cultivo.types';
import { parcelaSchema, type ParcelaFormValores } from '../schemas/parcela.schema';
import { ParcelaFormularioCultivo } from './parcela-formulario-cultivo';
import { ParcelaUbicacionSelector } from './parcela-ubicacion-selector';
import { type CoordenadaPunto } from '@/shared/utils/geometria';
import {
  obtenerUbicacionActual,
  geocodificacionInversa,
} from '@/shared/utils/geocodificacion';
import { styles } from './parcela-formulario.styles';

export interface ParcelaFormularioProps {
  cultivos: CultivoItem[];
  valoresIniciales?: Partial<ParcelaFormValores>;
  puntosIniciales?: CoordenadaPunto[];
  guardando?: boolean;
  modo?: 'crear' | 'editar';
  onSubmit: (valores: ParcelaFormValores) => void;
  onCancelar: () => void;
}

/**
 * @description Formulario responsive para registro/edición de parcelas:
 * 2 columnas en Desktop (Formulario a la izquierda, Mapa satelital expandido a la derecha)
 * y flujo vertical optimizado en Móvil.
 */
export const ParcelaFormulario: React.FC<ParcelaFormularioProps> = ({
  cultivos,
  valoresIniciales,
  puntosIniciales = [],
  guardando = false,
  modo = 'crear',
  onSubmit,
  onCancelar,
}) => {
  const { width } = useWindowDimensions();
  const esEscritorio = width >= 980;

  const [centroMapa, setCentroMapa] = useState<{ lat: number; lng: number } | undefined>(() => {
    if (valoresIniciales?.latitudCentro && valoresIniciales?.longitudCentro) {
      return { lat: valoresIniciales.latitudCentro, lng: valoresIniciales.longitudCentro };
    }
    return undefined;
  });
  const [zoomMapa, setZoomMapa] = useState<number>(15);
  const [autocompletandoUbicacion, setAutocompletandoUbicacion] = useState<boolean>(false);
  const [mensajeAutocompletado, setMensajeAutocompletado] = useState<string | null>(null);
  const [poligonoTieneCruce, setPoligonoTieneCruce] = useState<boolean>(false);
  const timeoutGeocodificacionRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // En primera instancia al crear una parcela, centrar el mapa en la ubicación actual
  useEffect(() => {
    let activo = true;
    if (modo === 'crear' && !valoresIniciales?.latitudCentro) {
      obtenerUbicacionActual().then((ubicacion) => {
        if (activo && ubicacion) {
          setCentroMapa(ubicacion);
          setZoomMapa(16);
        }
      });
    }
    return () => {
      activo = false;
      if (timeoutGeocodificacionRef.current) {
        clearTimeout(timeoutGeocodificacionRef.current);
      }
    };
  }, [modo, valoresIniciales?.latitudCentro]);

  const {
    control,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<ParcelaFormValores>({
    resolver: zodResolver(parcelaSchema),
    defaultValues: {
      codigo: valoresIniciales?.codigo || '',
      nombre: valoresIniciales?.nombre || '',
      areaHectareas: valoresIniciales?.areaHectareas || 0,
      cultivoId: valoresIniciales?.cultivoId || (cultivos[0]?.id ?? ''),
      variedad: valoresIniciales?.variedad || '',
      ubicacion: valoresIniciales?.ubicacion || '',
      departamento: valoresIniciales?.departamento || '',
      provincia: valoresIniciales?.provincia || '',
      distrito: valoresIniciales?.distrito || '',
      estado: valoresIniciales?.estado || 'ACTIVA',
      delimitacionGeoJson: valoresIniciales?.delimitacionGeoJson,
      latitudCentro: valoresIniciales?.latitudCentro,
      longitudCentro: valoresIniciales?.longitudCentro,
    },
  });

  const cultivoIdActual = watch('cultivoId');
  const variedadActual = watch('variedad');
  const departamentoActual = watch('departamento');
  const provinciaActual = watch('provincia');
  const distritoActual = watch('distrito');
  const latitudActual = watch('latitudCentro');
  const longitudActual = watch('longitudCentro');

  const manejarCambioPoligono = (datos: {
    puntos: CoordenadaPunto[];
    areaHectareas: number;
    centroide: CoordenadaPunto | null;
    tieneCruce?: boolean;
  }) => {
    setPoligonoTieneCruce(Boolean(datos.tieneCruce));

    if (datos.areaHectareas > 0) {
      setValue('areaHectareas', datos.areaHectareas, { shouldValidate: true });
    }
    setValue('delimitacionGeoJson', datos.puntos);

    if (datos.centroide) {
      setValue('latitudCentro', datos.centroide.latitude, { shouldValidate: true });
      setValue('longitudCentro', datos.centroide.longitude, { shouldValidate: true });

      if (timeoutGeocodificacionRef.current) {
        clearTimeout(timeoutGeocodificacionRef.current);
      }

      const latCentro = datos.centroide.latitude;
      const lngCentro = datos.centroide.longitude;

      // Autocompletar automáticamente el Punto 2 (Ubicación Territorial) desde el centroide del lote
      timeoutGeocodificacionRef.current = setTimeout(async () => {
        setAutocompletandoUbicacion(true);
        try {
          const resultado = await geocodificacionInversa(latCentro, lngCentro);
          if (resultado) {
            setValue('departamento', resultado.departamento, { shouldValidate: true });
            setValue('provincia', resultado.provincia, { shouldValidate: true });
            setValue('distrito', resultado.distrito, { shouldValidate: true });
            if (resultado.direccion) {
              setValue('ubicacion', resultado.direccion, { shouldValidate: true });
            }
            setMensajeAutocompletado(
              `📍 Ubicación autocompletada desde el centroide: ${resultado.distrito}, ${resultado.provincia}, ${resultado.departamento}`,
            );
          }
        } finally {
          setAutocompletandoUbicacion(false);
        }
      }, 400);
    } else {
      setValue('latitudCentro', null);
      setValue('longitudCentro', null);
    }
  };

  const manejarSubmit = (valores: ParcelaFormValores) => {
    if (poligonoTieneCruce) {
      Alert.alert(
        'Contorno del Lote no Válido',
        'El polígono delimitado tiene líneas cruzadas sobre sí mismas (dimensión irregular). Por favor mueva los puntos o presione "Corregir contorno" en la barra del mapa antes de guardar.',
      );
      return;
    }
    onSubmit(valores);
  };

  const seccionAgronomica = (
    <View style={styles.tarjeta}>
      <Text style={styles.tituloSeccion}>1. Información Agronómica del Lote</Text>
      <Controller
        control={control}
        name="nombre"
        render={({ field: { onChange, value } }) => (
          <Input
            label="Nombre o Denominación del Lote *"
            placeholder="Ej. Lote San Isidro 01"
            value={value}
            onChangeText={onChange}
            error={errors.nombre?.message}
          />
        )}
      />
      <View style={styles.filaDosColumnas}>
        <View style={styles.columna}>
          <Controller
            control={control}
            name="codigo"
            render={({ field: { onChange, value } }) => (
              <Input
                label="Código (Opcional)"
                placeholder="Ej. P-001"
                value={value || ''}
                onChangeText={onChange}
                error={errors.codigo?.message}
              />
            )}
          />
        </View>
        <View style={styles.columna}>
          <Controller
            control={control}
            name="areaHectareas"
            render={({ field: { onChange, value } }) => (
              <Input
                label="Área (Hectáreas) *"
                placeholder="Calculada en mapa..."
                value={value ? String(value) : ''}
                onChangeText={(v) => onChange(Number(v) || 0)}
                keyboardType="numeric"
                error={errors.areaHectareas?.message}
              />
            )}
          />
        </View>
      </View>

      <ParcelaFormularioCultivo
        cultivos={cultivos}
        cultivoSeleccionadoId={cultivoIdActual}
        variedadSeleccionada={variedadActual}
        errorCultivo={errors.cultivoId?.message}
        onSeleccionarCultivo={(id) => setValue('cultivoId', id, { shouldValidate: true })}
        onSeleccionarVariedad={(v) => setValue('variedad', v, { shouldValidate: true })}
      />

      <Controller
        control={control}
        name="variedad"
        render={({ field: { onChange, value } }) => (
          <Input
            label="Variedad Específica (Opcional)"
            placeholder="Ej. Hass, Red Globe, etc."
            value={value || ''}
            onChangeText={onChange}
            error={errors.variedad?.message}
          />
        )}
      />
    </View>
  );

  const seccionTerritorial = (
    <View style={styles.tarjeta}>
      <View style={styles.cabeceraSeccionTerritorial}>
        <Text style={styles.tituloSeccion}>2. Ubicación Territorial</Text>
        {autocompletandoUbicacion && (
          <Text style={styles.badgeDetectando}>Detectando desde mapa...</Text>
        )}
      </View>

      {mensajeAutocompletado && (
        <View style={styles.cajaNotificacionAuto}>
          <Text style={styles.textoNotificacionAuto}>{mensajeAutocompletado}</Text>
        </View>
      )}

      {/* Selectores Jerárquicos Limpios: Departamento -> Provincia -> Distrito */}
      <ParcelaUbicacionSelector
        departamento={departamentoActual}
        provincia={provinciaActual}
        distrito={distritoActual}
        errorDepartamento={errors.departamento?.message}
        errorProvincia={errors.provincia?.message}
        errorDistrito={errors.distrito?.message}
        onSeleccionarDepartamento={(dep) => setValue('departamento', dep)}
        onSeleccionarProvincia={(prov) => setValue('provincia', prov)}
        onSeleccionarDistrito={(dist) => setValue('distrito', dist)}
        onCentroSugerido={(nuevoCentro, zoom) => {
          setCentroMapa(nuevoCentro);
          if (zoom) setZoomMapa(zoom);
        }}
      />

      <Controller
        control={control}
        name="ubicacion"
        render={({ field: { onChange, value } }) => (
          <Input
            label="Referencia de Ubicación / Fundo"
            placeholder="Ej. Valle de Cañete Km 14, Sector Santa Elena"
            value={value || ''}
            onChangeText={onChange}
            error={errors.ubicacion?.message}
          />
        )}
      />

      {/* Coordenadas GPS del punto central de la parcela */}
      <View style={styles.cajaCoordenadasGps}>
        <View style={styles.cabeceraCoordenadas}>
          <View style={styles.filaTituloCoord}>
            <Compass size={15} color={Palette.forestGreen} />
            <Text style={styles.tituloCoordenadas}>Coordenadas GPS (Punto Central del Lote)</Text>
          </View>
          {latitudActual != null && longitudActual != null && (
            <View style={styles.badgeCentroide}>
              <Text style={styles.textoBadgeCentroide}>Centroide Calculado</Text>
            </View>
          )}
        </View>

        {latitudActual != null && longitudActual != null ? (
          <View style={styles.filaCoordenadasValores}>
            <View style={styles.campoCoordenada}>
              <Text style={styles.etiquetaCoordenada}>Latitud</Text>
              <Text style={styles.valorCoordenada}>
                {typeof latitudActual === 'number' ? latitudActual.toFixed(6) : Number(latitudActual).toFixed(6)}°
              </Text>
            </View>
            <View style={styles.campoCoordenada}>
              <Text style={styles.etiquetaCoordenada}>Longitud</Text>
              <Text style={styles.valorCoordenada}>
                {typeof longitudActual === 'number' ? longitudActual.toFixed(6) : Number(longitudActual).toFixed(6)}°
              </Text>
            </View>
          </View>
        ) : (
          <Text style={styles.textoCoordenadasPendiente}>
            Se calcularán automáticamente al marcar los vértices de la parcela en el mapa satelital.
          </Text>
        )}
      </View>
    </View>
  );

  const seccionMapa = (alturaMapa: number) => (
    <View style={[styles.tarjeta, esEscritorio && styles.tarjetaMapaEscritorio]}>
      <View style={styles.cabeceraMapa}>
        <Text style={styles.tituloSeccion}>Delimitación y Mapeo Satelital</Text>
        <Text style={styles.ayudaMapa}>
          Haga clic sobre el mapa para marcar los vértices. Arrastre cualquier punto para ampliar o ajustar el contorno.
        </Text>
      </View>
      <MapaDelimitador
        puntosIniciales={puntosIniciales}
        centroInicial={centroMapa}
        zoomInicial={zoomMapa}
        onCambioPoligono={manejarCambioPoligono}
        altura={alturaMapa}
      />
    </View>
  );

  return (
    <View style={styles.contenedorPrincipal}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.contenedorScroll}
        showsVerticalScrollIndicator={false}
      >
        {esEscritorio ? (
          <View style={styles.layoutDosColumnas}>
            <View style={styles.columnaIzquierda}>
              {seccionAgronomica}
              {seccionTerritorial}
            </View>
            <View style={styles.columnaDerecha}>
              {seccionMapa(620)}
            </View>
          </View>
        ) : (
          <View style={styles.layoutMovil}>
            {seccionAgronomica}
            {seccionTerritorial}
            {seccionMapa(360)}
          </View>
        )}
      </ScrollView>

      {/* Barra de Acciones Flotante Fija que Acompaña el Scroll */}
      <View style={styles.barraAccionesFlotanteWrapper}>
        <View style={styles.barraAccionesCard}>
          <Boton
            titulo="Cancelar"
            variante="secundario"
            onPress={onCancelar}
            disabled={guardando}
          />
          <Boton
            titulo={modo === 'crear' ? 'Registrar Parcela' : 'Actualizar Parcela'}
            variante="primario"
            onPress={handleSubmit(manejarSubmit)}
            cargando={guardando}
          />
        </View>
      </View>
    </View>
  );
};
