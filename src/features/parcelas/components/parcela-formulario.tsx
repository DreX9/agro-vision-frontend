import React, { useState, useEffect, useRef, useMemo } from 'react';
import { View, Text, ScrollView, useWindowDimensions, Alert, Pressable, Platform } from 'react-native';
import { useForm, Controller, type FieldErrors } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Compass, AlertTriangle, AlertCircle } from 'lucide-react-native';
import { Palette } from '@/constants/theme';
import { Boton, Input } from '@/shared/components/ui';
import { MapaDelimitador, type ParcelaOcupadaGeo } from '@/shared/components/mapa/mapa-delimitador';
import { CultivoItem } from '@/features/cultivos/types/cultivo.types';
import { ParcelaItem } from '../types/parcela.types';
import { parcelaSchema, type ParcelaFormValores } from '../schemas/parcela.schema';
import { ParcelaUbicacionSelector } from './parcela-ubicacion-selector';
import { type CoordenadaPunto, extraerPuntosPoligono } from '@/shared/utils/geometria';
import {
  obtenerUbicacionActual,
  geocodificacionInversa,
} from '@/shared/utils/geocodificacion';
import { styles } from './parcela-formulario.styles';

/**
 * @description Utilidad multiplataforma para desplegar diálogos informativos en Web y React Native.
 */
export const mostrarAlerta = (titulo: string, mensaje: string) => {
  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    window.alert(`${titulo}\n\n${mensaje}`);
  } else {
    Alert.alert(titulo, mensaje);
  }
};

export const PALETA_COLORES_LOTES = [
  '#15803D', // Verde Bosque
  '#0284C7', // Azul Océano
  '#D97706', // Ámbar / Dorado
  '#7C3AED', // Púrpura / Violeta
  '#EA580C', // Naranja Fuego
  '#0D9488', // Turquesa / Teal
  '#DB2777', // Rosa Fucsia
  '#65A30D', // Verde Lima
  '#4F46E5', // Índigo
  '#B45309', // Ocre / Bronce
];

/**
 * @description Obtiene un color distintivo según el número correlativo del código de área (ej. P-001 -> Verde, P-002 -> Azul...)
 */
export function calcularColorDistintivoPorCodigo(codigo: string): string {
  const match = codigo.match(/(\d+)$/);
  const num = match ? parseInt(match[1], 10) : 1;
  const index = Math.max(0, num - 1) % PALETA_COLORES_LOTES.length;
  return PALETA_COLORES_LOTES[index];
}

export interface ParcelaFormularioProps {
  cultivos?: CultivoItem[];
  valoresIniciales?: Partial<ParcelaFormValores>;
  puntosIniciales?: CoordenadaPunto[];
  parcelasExistentes?: ParcelaItem[];
  idParcelaActual?: string;
  guardando?: boolean;
  errorMensaje?: string | null;
  modo?: 'crear' | 'editar';
  onSubmit: (valores: ParcelaFormValores) => void;
  onCancelar: () => void;
}

/**
 * @description Genera el siguiente código correlativo de parcela (ej. P-001, P-002, etc.)
 */
function calcularSiguienteCodigoParcela(parcelas: ParcelaItem[] = []): string {
  let maxCorrelativo = 0;
  for (const p of parcelas) {
    if (!p.codigo) continue;
    const coincidencia = p.codigo.match(/(\d+)$/);
    if (coincidencia) {
      const num = parseInt(coincidencia[1], 10);
      if (!isNaN(num) && num > maxCorrelativo) {
        maxCorrelativo = num;
      }
    }
  }
  return `P-${String(maxCorrelativo + 1).padStart(3, '0')}`;
}

const PUNTOS_VACIOS_DEFAULT: CoordenadaPunto[] = [];
const PARCELAS_VACIAS_DEFAULT: ParcelaItem[] = [];

/**
 * @description Formulario responsive para registro/edición de parcelas:
 * 2 columnas en Desktop (Formulario a la izquierda, Mapa satelital expandido a la derecha)
 * y flujo vertical optimizado en Móvil.
 */
export const ParcelaFormulario: React.FC<ParcelaFormularioProps> = ({
  cultivos,
  valoresIniciales,
  puntosIniciales = PUNTOS_VACIOS_DEFAULT,
  parcelasExistentes = PARCELAS_VACIAS_DEFAULT,
  idParcelaActual,
  guardando = false,
  errorMensaje,
  modo = 'crear',
  onSubmit,
  onCancelar,
}) => {
  const { width } = useWindowDimensions();
  const esEscritorio = width >= 1150;

  // Código correlativo autoincrementable
  const codigoAutoincrementable = useMemo(() => {
    if (modo === 'editar' && valoresIniciales?.codigo) {
      return valoresIniciales.codigo;
    }
    return calcularSiguienteCodigoParcela(parcelasExistentes);
  }, [modo, valoresIniciales?.codigo, parcelasExistentes]);

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
  const [poligonoTieneSuperposicion, setPoligonoTieneSuperposicion] = useState<boolean>(false);
  const [parcelaConflicto, setParcelaConflicto] = useState<string | null>(null);
  const timeoutGeocodificacionRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Mapear parcelas ocupadas con delimitaciones válidas para mostrarlas en el mapa
  const parcelasOcupadas: ParcelaOcupadaGeo[] = useMemo(() => {
    if (!parcelasExistentes || parcelasExistentes.length === 0) return [];
    const lista: ParcelaOcupadaGeo[] = [];
    for (const p of parcelasExistentes) {
      if (p.id === idParcelaActual) continue;
      const puntos = extraerPuntosPoligono(p.delimitacionGeoJson);
      if (puntos.length >= 3) {
        lista.push({
          id: p.id,
          nombre: p.nombre,
          codigo: p.codigo || null,
          cultivoNombre: p.cultivoNombre || null,
          cultivoColorHex: p.colorHex || p.cultivoColorHex || null,
          variedad: p.variedad || null,
          areaHectareas: p.areaHectareas ? Number(p.areaHectareas) : 0,
          puntos,
        });
      }
    }
    return lista;
  }, [parcelasExistentes, idParcelaActual]);

  // Color distintivo asignado incrementalmente según el código correlativo del área
  const colorDistintivoPorDefecto = useMemo(() => {
    if (valoresIniciales?.colorHex) return valoresIniciales.colorHex;
    return calcularColorDistintivoPorCodigo(codigoAutoincrementable);
  }, [valoresIniciales?.colorHex, codigoAutoincrementable]);

  const [colorSeleccionado, setColorSeleccionado] = useState<string>(colorDistintivoPorDefecto);
  const colorModificadoManualmenteRef = useRef(false);

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
      codigo: valoresIniciales?.codigo || codigoAutoincrementable,
      nombre: valoresIniciales?.nombre || '',
      areaHectareas: valoresIniciales?.areaHectareas || 0,
      colorHex: valoresIniciales?.colorHex || colorDistintivoPorDefecto,
      cultivoId: valoresIniciales?.cultivoId || '',
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

  // Mantener actualizado el color por defecto en modo creación si el usuario no ha seleccionado uno manualmente
  useEffect(() => {
    if (modo === 'crear' && !colorModificadoManualmenteRef.current) {
      setColorSeleccionado(colorDistintivoPorDefecto);
      setValue('colorHex', colorDistintivoPorDefecto);
    }
  }, [colorDistintivoPorDefecto, modo, setValue]);

  // Mantener actualizado el código correlativo autoincrementado en modo creación
  useEffect(() => {
    if (modo === 'crear' && codigoAutoincrementable) {
      setValue('codigo', codigoAutoincrementable, { shouldValidate: true });
    }
  }, [codigoAutoincrementable, modo, setValue]);

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
    tieneSuperposicion?: boolean;
    parcelaConflicto?: string | null;
  }) => {
    setPoligonoTieneCruce(Boolean(datos.tieneCruce));
    setPoligonoTieneSuperposicion(Boolean(datos.tieneSuperposicion));
    setParcelaConflicto(datos.parcelaConflicto || null);

    const tienePuntosValidos = datos.puntos && datos.puntos.length >= 3;
    const nuevaArea = tienePuntosValidos ? (datos.areaHectareas || 0) : 0;

    // Actualizar área según el mapa: si se limpian o borran puntos, se actualiza a 0
    setValue('areaHectareas', nuevaArea, { shouldValidate: true });
    setValue('delimitacionGeoJson', tienePuntosValidos ? datos.puntos : undefined);

    if (datos.centroide && tienePuntosValidos) {
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
      if (timeoutGeocodificacionRef.current) {
        clearTimeout(timeoutGeocodificacionRef.current);
      }
      setValue('latitudCentro', null);
      setValue('longitudCentro', null);
      setMensajeAutocompletado(null);
    }
  };

  const manejarErroresValidacion = (errores: FieldErrors<ParcelaFormValores>) => {
    const listaErrores: string[] = [];
    if (errores.nombre?.message) listaErrores.push(`• Nombre del lote: ${errores.nombre.message}`);
    if (errores.areaHectareas?.message) listaErrores.push(`• Delimitación / Área: ${errores.areaHectareas.message}`);
    if (errores.codigo?.message) listaErrores.push(`• Código: ${errores.codigo.message}`);
    if (errores.departamento?.message) listaErrores.push(`• Departamento: ${errores.departamento.message}`);
    if (errores.provincia?.message) listaErrores.push(`• Provincia: ${errores.provincia.message}`);
    if (errores.distrito?.message) listaErrores.push(`• Distrito: ${errores.distrito.message}`);

    const detalle = listaErrores.length > 0
      ? listaErrores.join('\n')
      : 'Por favor complete todos los datos requeridos antes de registrar la parcela.';

    mostrarAlerta('Datos requeridos incompletos', detalle);
  };

  const manejarSubmit = (valores: ParcelaFormValores) => {
    if (!valores.areaHectareas || valores.areaHectareas <= 0) {
      mostrarAlerta(
        'Área no delimitada',
        'Debe delimitar el área de la parcela en el mapa satelital marcando al menos 3 vértices para calcular su superficie en hectáreas.',
      );
      return;
    }

    if (poligonoTieneSuperposicion) {
      mostrarAlerta(
        'Superposición de Lotes Detectada',
        `El área seleccionada invade el espacio de la parcela "${parcelaConflicto || 'vecina'}". Las parcelas contiguas pueden compartir el mismo lindero perimetral, pero sus superficies no deben superponerse. Ajuste los vértices antes de registrar.`,
      );
      return;
    }

    if (poligonoTieneCruce) {
      mostrarAlerta(
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
            render={({ field: { value } }) => (
              <View>
                <Input
                  label="Código (Autoincrementable)"
                  placeholder="Generando código..."
                  value={value || codigoAutoincrementable}
                  editable={false}
                  error={errors.codigo?.message}
                />
                <Text style={styles.textoAyudaCampo}>
                  {modo === 'crear'
                    ? 'Correlativo asignado automáticamente'
                    : 'Código identificador único'}
                </Text>
              </View>
            )}
          />
        </View>
        <View style={styles.columna}>
          <Controller
            control={control}
            name="areaHectareas"
            render={({ field: { value } }) => (
              <View>
                <Input
                  label="Área (Hectáreas) *"
                  placeholder="Delimite en el mapa..."
                  value={value && value > 0 ? String(value) : ''}
                  editable={false}
                  error={errors.areaHectareas?.message}
                />
                <Text style={styles.textoAyudaCampo}>
                  Calculada automáticamente desde el mapa satelital
                </Text>
              </View>
            )}
          />
        </View>
      </View>

      {/* Color distintivo del área / lote */}
      <View style={styles.contenedorColorLote}>
        <View style={styles.cabeceraColorLote}>
          <Text style={styles.etiquetaColorLote}>COLOR DISTINTIVO DEL ÁREA</Text>
          <View
            style={[
              styles.badgeColorActivo,
              { backgroundColor: colorSeleccionado + '20', borderColor: colorSeleccionado },
            ]}
          >
            <View style={[styles.puntoColorActivo, { backgroundColor: colorSeleccionado }]} />
            <Text style={[styles.textoColorActivo, { color: colorSeleccionado }]}>
              {codigoAutoincrementable}
            </Text>
          </View>
        </View>

        <View style={styles.paletaFila}>
          {PALETA_COLORES_LOTES.map((hex) => {
            const esSeleccionado = colorSeleccionado.toLowerCase() === hex.toLowerCase();
            return (
              <Pressable
                key={hex}
                onPress={() => {
                  colorModificadoManualmenteRef.current = true;
                  setColorSeleccionado(hex);
                  setValue('colorHex', hex, { shouldValidate: true });
                }}
                style={[
                  styles.swatchColor,
                  { backgroundColor: hex },
                  esSeleccionado && styles.swatchColorSeleccionado,
                ]}
                accessibilityLabel={`Color ${hex}`}
              >
                {esSeleccionado && <View style={styles.swatchPuntoBlanco} />}
              </Pressable>
            );
          })}
        </View>
        <Text style={styles.textoAyudaColor}>
          Asignado automáticamente según el correlativo del lote para diferenciar cada área en el mapa satelital.
        </Text>
      </View>
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
        colorPoligono={colorSeleccionado}
        parcelasOcupadas={parcelasOcupadas}
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
        {errorMensaje && (
          <View style={styles.bannerErrorGlobal}>
            <AlertCircle size={18} color="#DC2626" />
            <Text style={styles.textoErrorGlobal}>{errorMensaje}</Text>
          </View>
        )}
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
        <View style={[styles.barraAccionesCard, Boolean(errorMensaje) && styles.barraAccionesCardConError]}>
          {errorMensaje && (
            <View style={styles.bannerErrorGlobal}>
              <AlertCircle size={16} color="#DC2626" />
              <Text style={styles.textoErrorGlobal}>{errorMensaje}</Text>
            </View>
          )}
          <View style={styles.filaBotonesAcciones}>
            <Boton
              titulo="Cancelar"
              variante="secundario"
              onPress={onCancelar}
              disabled={guardando}
            />
            <Boton
              titulo={modo === 'crear' ? 'Registrar Parcela' : 'Actualizar Parcela'}
              variante="primario"
              onPress={handleSubmit(manejarSubmit, manejarErroresValidacion)}
              cargando={guardando}
            />
          </View>
        </View>
      </View>
    </View>
  );
};
