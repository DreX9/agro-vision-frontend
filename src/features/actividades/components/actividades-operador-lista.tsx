import React from 'react';
import { View, Text, StyleSheet, Pressable, Platform } from 'react-native';
import {
  Calendar,
  MapPin,
  FileText,
  CheckCircle2,
  AlertTriangle,
  Navigation,
  ArrowRight,
  Package,
} from 'lucide-react-native';
import { Palette } from '@/constants/theme';
import { Badge, Boton } from '@/shared/components/ui';
import { ActividadItem, EstadoActividadTipo } from '../types/actividad.types';
import { useOperadorJornadaStore } from '../stores/operador-jornada.store';

export interface ActividadesOperadorListaProps {
  actividades: ActividadItem[];
  cargando?: boolean;
  onVerDetalle: (actividad: ActividadItem) => void;
  onCambiarEstado?: (actividad: ActividadItem, nuevoEstado?: EstadoActividadTipo) => void;
}

/**
 * @description Vista adaptada para el Operador de Campo. Presenta cada labor en tarjetas
 * con la descripción operativa destacada, indicadores de subtareas, novedades y punto GPS.
 */
export const ActividadesOperadorLista: React.FC<ActividadesOperadorListaProps> = ({
  actividades,
  cargando = false,
  onVerDetalle,
  onCambiarEstado,
}) => {
  const { subtareasPorActividad, hallazgosPorActividad, puntosAvancePorActividad } =
    useOperadorJornadaStore();

  const obtenerVarianteEstado = (
    estado: EstadoActividadTipo,
  ): 'exito' | 'info' | 'alerta' | 'peligro' | 'neutro' => {
    switch (estado) {
      case 'COMPLETADA':
        return 'exito';
      case 'EN_PROGRESO':
        return 'info';
      case 'PENDIENTE':
        return 'alerta';
      case 'CANCELADA':
        return 'peligro';
      default:
        return 'neutro';
    }
  };

  const formatearEstadoTexto = (estado: EstadoActividadTipo): string => {
    switch (estado) {
      case 'COMPLETADA':
        return 'Completada';
      case 'EN_PROGRESO':
        return 'En Progreso';
      case 'PENDIENTE':
        return 'Pendiente';
      case 'CANCELADA':
        return 'Cancelada';
      default:
        return estado;
    }
  };

  if (actividades.length === 0 && !cargando) {
    return (
      <View style={styles.cajaVacia}>
        <Text style={styles.textoVacio}>No tienes labores asignadas programadas por el momento.</Text>
      </View>
    );
  }

  return (
    <View style={styles.contenedor}>
      {actividades.map((act) => {
        const subtareas = subtareasPorActividad[act.id] || [];
        const hallazgos = hallazgosPorActividad[act.id] || [];
        const puntoGuardado = puntosAvancePorActividad[act.id];

        const totalSub = subtareas.length;
        const subCompletadas = subtareas.filter((s) => s.completada).length;

        return (
          <View key={act.id} style={styles.tarjetaLabor}>
            {/* Cabecera */}
            <View style={styles.cabeceraTarjeta}>
              <View style={{ flex: 1 }}>
                <View style={styles.filaCodigoTipo}>
                  <Text style={styles.codigoLabor}>{act.codigo}</Text>
                  <Text style={styles.tipoLabor}>{act.tipo.replace(/_/g, ' ')}</Text>
                </View>
                <Text style={styles.tituloLabor}>{act.titulo}</Text>
              </View>

              <Badge
                texto={formatearEstadoTexto(act.estado)}
                variante={obtenerVarianteEstado(act.estado)}
              />
            </View>

            {/* Ubicación y Parcela */}
            <View style={styles.filaUbicacion}>
              <MapPin size={15} color={Palette.forestGreen} />
              <Text style={styles.textoUbicacion}>
                <Text style={{ fontWeight: '700' }}>{act.parcelaNombre || 'Parcela'}</Text>
                {act.sectorNombre ? ` · ${act.sectorNombre}` : ''}
                {act.cultivoNombre ? ` (${act.cultivoNombre})` : ''}
              </Text>
            </View>

            {/* DESCRIPCIÓN OPERATIVA DESTACADA */}
            <View style={styles.cajaDescripcionDestacada}>
              <View style={styles.filaTituloDescripcion}>
                <FileText size={15} color={Palette.forestGreen} />
                <Text style={styles.etiquetaDescripcion}>Indicaciones Operativas:</Text>
              </View>
              <Text style={styles.cuerpoDescripcion}>
                {/* Fallback a texto informativo si no tiene descripción cargada */}
                {'Sin indicaciones adicionales especificadas por el supervisor o agrónomo.'}
              </Text>
            </View>

            {/* Fecha y Resumen de Cuadrilla */}
            <View style={styles.filaMetas}>
              <View style={styles.itemMeta}>
                <Calendar size={13} color="#6B7280" />
                <Text style={styles.textoMeta}>
                  {new Date(act.fechaInicio).toLocaleDateString('es-PE', {
                    day: '2-digit',
                    month: 'short',
                    year: 'numeric',
                  })}
                </Text>
              </View>

              {act.cantidadRecursos > 0 && (
                <View style={styles.itemMeta}>
                  <Package size={13} color="#6B7280" />
                  <Text style={styles.textoMeta}>
                    {act.cantidadRecursos} {act.cantidadRecursos === 1 ? 'insumo' : 'insumos'}
                  </Text>
                </View>
              )}
            </View>

            {/* Resumen del Turno del Operador (Pills de avance) */}
            <View style={styles.filaResumenTurno}>
              {totalSub > 0 && (
                <View style={styles.pillResumen}>
                  <CheckCircle2 size={13} color={Palette.forestGreen} />
                  <Text style={styles.textoPillResumen}>
                    {subCompletadas}/{totalSub} subtareas
                  </Text>
                </View>
              )}

              {hallazgos.length > 0 && (
                <View style={[styles.pillResumen, styles.pillAlerta]}>
                  <AlertTriangle size={13} color="#D97706" />
                  <Text style={[styles.textoPillResumen, { color: '#B45309' }]}>
                    {hallazgos.length} {hallazgos.length === 1 ? 'novedad' : 'novedades'}
                  </Text>
                </View>
              )}

              {puntoGuardado && (
                <View style={[styles.pillResumen, styles.pillPuntoGps]}>
                  <Navigation size={13} color={Palette.forestGreen} />
                  <Text
                    style={styles.textoPillResumen}
                    numberOfLines={1}
                    ellipsizeMode="tail"
                  >
                    📍 {puntoGuardado.referencia}
                  </Text>
                </View>
              )}
            </View>

            {/* Acciones principales */}
            <View style={styles.filaAcciones}>
              {act.estado === 'PENDIENTE' && onCambiarEstado && (
                <Boton
                  titulo="Iniciar Labor"
                  variante="secundario"
                  onPress={() => onCambiarEstado(act, 'EN_PROGRESO')}
                />
              )}

              {act.estado === 'EN_PROGRESO' && onCambiarEstado && (
                <Boton
                  titulo="Marcar Completada"
                  variante="secundario"
                  onPress={() => onCambiarEstado(act, 'COMPLETADA')}
                />
              )}

              <Boton
                titulo="Abrir Bitácora & Tareas del Turno"
                variante="primario"
                iconoDerecha={<ArrowRight size={16} color={Palette.white} />}
                onPress={() => onVerDetalle(act)}
              />
            </View>
          </View>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  contenedor: {
    gap: 14,
  },
  cajaVacia: {
    padding: 30,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  textoVacio: {
    fontSize: 14,
    color: '#6B7280',
    fontStyle: 'italic',
  },
  tarjetaLabor: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#D7E3CF',
    padding: 16,
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  cabeceraTarjeta: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
  },
  filaCodigoTipo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 2,
  },
  codigoLabor: {
    fontSize: 12,
    fontWeight: '700',
    color: Palette.forestGreen,
    fontFamily: Platform.OS === 'web' ? 'monospace' : undefined,
  },
  tipoLabor: {
    fontSize: 11,
    fontWeight: '600',
    color: '#6B7280',
    textTransform: 'uppercase',
  },
  tituloLabor: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
  },
  filaUbicacion: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  textoUbicacion: {
    fontSize: 13,
    color: '#374151',
  },
  cajaDescripcionDestacada: {
    backgroundColor: '#F5F9F2',
    borderLeftWidth: 3.5,
    borderLeftColor: Palette.forestGreen,
    padding: 12,
    borderRadius: 8,
    gap: 4,
  },
  filaTituloDescripcion: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  etiquetaDescripcion: {
    fontSize: 11,
    fontWeight: '700',
    color: Palette.forestGreen,
    textTransform: 'uppercase',
  },
  cuerpoDescripcion: {
    fontSize: 13,
    color: '#2D3748',
    lineHeight: 18,
  },
  filaMetas: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  itemMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  textoMeta: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
  },
  filaResumenTurno: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  pillResumen: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#EDF5E8',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 6,
  },
  pillAlerta: {
    backgroundColor: '#FEF3C7',
  },
  pillPuntoGps: {
    backgroundColor: '#E6F4EA',
    maxWidth: 220,
  },
  textoPillResumen: {
    fontSize: 11,
    fontWeight: '600',
    color: Palette.forestGreen,
  },
  filaAcciones: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    gap: 10,
    marginTop: 4,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    paddingTop: 12,
  },
});
