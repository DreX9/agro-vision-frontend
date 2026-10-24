import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable, Platform, ActivityIndicator } from 'react-native';
import { MoreVertical, Users, Calendar, MapPin, ChevronDown } from 'lucide-react-native';
import { Palette } from '@/constants/theme';
import { Badge, Tabla, ColumnaTabla } from '@/shared/components/ui';
import { ActividadItem, EstadoActividadTipo } from '../types/actividad.types';
import { ActividadesMenuAcciones, PosicionMenu } from './actividades-menu-acciones';
import { ActividadEstadoPopover, PosicionPopover } from './actividad-estado-popover';

export interface ActividadesTablaProps {
  actividades: ActividadItem[];
  cargando?: boolean;
  onVerDetalle?: (actividad: ActividadItem) => void;
  onEditar?: (actividad: ActividadItem) => void;
  onCambiarEstado?: (actividad: ActividadItem, nuevoEstado?: EstadoActividadTipo) => void;
  onEliminar?: (actividad: ActividadItem) => void;
  idActividadCambiandoEstado?: string;
}

/**
 * @description Tabla responsiva para visualizar las actividades y labores de campo agrícolas.
 */
export const ActividadesTabla: React.FC<ActividadesTablaProps> = ({
  actividades,
  cargando = false,
  onVerDetalle,
  onEditar,
  onCambiarEstado,
  onEliminar,
  idActividadCambiandoEstado,
}) => {
  const [actividadActiva, setActividadActiva] = useState<ActividadItem | null>(null);
  const [posicion, setPosicion] = useState<PosicionMenu>({ top: 0, left: 0 });
  const [actividadEstadoActiva, setActividadEstadoActiva] = useState<ActividadItem | null>(null);
  const [posicionEstado, setPosicionEstado] = useState<PosicionPopover>({ top: 0, left: 0 });

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

  const formatearTipo = (tipo: string): string => {
    return tipo.replace(/_/g, ' ');
  };

  const abrirMenu = (a: ActividadItem, ref: View | null) => {
    if (!ref) {
      setActividadActiva(a);
      return;
    }

    if (Platform.OS === 'web') {
      const el = ref as unknown as HTMLElement;
      if (el && typeof el.getBoundingClientRect === 'function') {
        const rect = el.getBoundingClientRect();
        setPosicion({
          top: rect.bottom + 4,
          left: Math.max(10, rect.right - 180),
        });
        setActividadActiva(a);
        return;
      }
    }

    ref.measureInWindow((x, y, width, height) => {
      setPosicion({
        top: y + height + 4,
        left: Math.max(10, x + width - 180),
      });
      setActividadActiva(a);
    });
  };

  const abrirMenuEstado = (a: ActividadItem, ref: View | null) => {
    if (!ref) {
      setActividadEstadoActiva(a);
      return;
    }

    if (Platform.OS === 'web') {
      const el = ref as unknown as HTMLElement;
      if (el && typeof el.getBoundingClientRect === 'function') {
        const rect = el.getBoundingClientRect();
        setPosicionEstado({
          top: rect.bottom + 4,
          left: Math.max(10, Math.min(window.innerWidth - 230, rect.left)),
        });
        setActividadEstadoActiva(a);
        return;
      }
    }

    ref.measureInWindow((x, y, width, height) => {
      setPosicionEstado({
        top: y + height + 4,
        left: Math.max(10, x),
      });
      setActividadEstadoActiva(a);
    });
  };

  const columnas: ColumnaTabla<ActividadItem>[] = [
    {
      id: 'codigo',
      encabezado: 'Código',
      anchoMinimo: 90,
      render: (a: ActividadItem) => <Text style={styles.textoCodigo}>{a.codigo}</Text>,
    },
    {
      id: 'labor',
      encabezado: 'Labor / Título',
      anchoMinimo: 180,
      render: (a: ActividadItem) => (
        <View>
          <Text style={styles.textoTitulo}>{a.titulo}</Text>
          <Text style={styles.textoTipo}>{formatearTipo(a.tipo)}</Text>
        </View>
      ),
    },
    {
      id: 'parcela',
      encabezado: 'Parcela & Cultivo',
      flex: 1.4,
      anchoMinimo: 200,
      render: (a: ActividadItem) => (
        <View style={styles.filaUbicacion}>
          <MapPin size={13} color={Palette.forestGreen} style={{ marginTop: 2 }} />
          <View style={styles.contenedorTextoUbicacion}>
            <Text style={styles.textoParcela} numberOfLines={1} ellipsizeMode="tail">
              {a.parcelaNombre || 'Parcela'}
            </Text>
            {a.sectorNombre ? (
              <Text style={styles.textoCultivo} numberOfLines={2} ellipsizeMode="tail">
                {a.sectorNombre}{a.cultivoNombre ? ` (${a.cultivoNombre})` : ''}
              </Text>
            ) : a.cultivoNombre ? (
              <Text style={styles.textoCultivo} numberOfLines={1} ellipsizeMode="tail">
                ({a.cultivoNombre})
              </Text>
            ) : null}
          </View>
        </View>
      ),
    },
    {
      id: 'fecha',
      encabezado: 'Fecha Programada',
      anchoMinimo: 140,
      render: (a: ActividadItem) => (
        <View style={styles.filaFecha}>
          <Calendar size={13} color="#6B7280" />
          <Text style={styles.textoFecha}>
            {new Date(a.fechaInicio).toLocaleDateString('es-PE', {
              day: '2-digit',
              month: 'short',
            })}
          </Text>
        </View>
      ),
    },
    {
      id: 'cuadrilla',
      encabezado: 'Personal Asignado',
      anchoMinimo: 140,
      render: (a: ActividadItem) => (
        <View style={styles.filaCuadrilla}>
          <Users size={14} color={Palette.forestGreen} />
          <Text style={styles.textoCuadrilla}>
            {a.cantidadTrabajadores} {a.cantidadTrabajadores === 1 ? 'operador' : 'operadores'}
          </Text>
        </View>
      ),
    },
    {
      id: 'estado',
      encabezado: 'Estado',
      anchoMinimo: 140,
      render: (a: ActividadItem) => {
        let badgeRef: View | null = null;
        const estaCambiando = idActividadCambiandoEstado === a.id;

        return (
          <Pressable
            ref={(ref) => {
              badgeRef = ref;
            }}
            onPress={() => abrirMenuEstado(a, badgeRef)}
            disabled={estaCambiando || !onCambiarEstado}
            style={({ pressed }) => [
              styles.botonBadgeEstado,
              pressed && styles.botonBadgeEstadoPresionado,
            ]}
          >
            {estaCambiando ? (
              <View style={styles.filaEstadoCargando}>
                <ActivityIndicator size="small" color={Palette.forestGreen} />
                <Text style={styles.textoActualizando}>Cambiando...</Text>
              </View>
            ) : (
              <View style={styles.contenedorBadgeInteractivo}>
                <Badge
                  texto={formatearEstadoTexto(a.estado)}
                  variante={obtenerVarianteEstado(a.estado)}
                />
                <ChevronDown size={13} color="#6B7280" style={styles.iconoChevron} />
              </View>
            )}
          </Pressable>
        );
      },
    },
    {
      id: 'acciones',
      encabezado: 'Acciones',
      anchoMinimo: 70,
      alineacion: 'center',
      render: (a: ActividadItem) => {
        let botonRef: View | null = null;
        return (
          <Pressable
            ref={(ref) => {
              botonRef = ref;
            }}
            onPress={() => abrirMenu(a, botonRef)}
            style={({ pressed }) => [styles.botonAccion, pressed && styles.botonAccionPresionado]}
          >
            <MoreVertical size={18} color="#4B5563" />
          </Pressable>
        );
      },
    },
  ];

  return (
    <View style={styles.contenedor}>
      <Tabla
        datos={actividades}
        columnas={columnas}
        claveExtractor={(item) => item.id}
        cargando={cargando}
        mensajeVacio="No se encontraron actividades agrícolas registradas."
      />

      <ActividadesMenuAcciones
        actividad={actividadActiva}
        posicion={posicion}
        visible={Boolean(actividadActiva)}
        onCerrar={() => setActividadActiva(null)}
        onVerDetalle={onVerDetalle}
        onEditar={onEditar}
        onCambiarEstado={onCambiarEstado}
        onEliminar={onEliminar}
      />

      <ActividadEstadoPopover
        actividad={actividadEstadoActiva}
        posicion={posicionEstado}
        visible={Boolean(actividadEstadoActiva)}
        onCerrar={() => setActividadEstadoActiva(null)}
        onSeleccionarEstado={(act, nuevoEstado) => {
          if (onCambiarEstado) {
            onCambiarEstado(act, nuevoEstado);
          }
        }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  contenedor: { flex: 1 },
  textoCodigo: {
    fontFamily: Platform.OS === 'web' ? 'monospace' : 'monospace',
    fontWeight: '700',
    color: Palette.forestGreen,
    fontSize: 13,
  },
  textoTitulo: { fontSize: 13, fontWeight: '700', color: '#1F2937' },
  textoTipo: { fontSize: 11, color: '#4B5563', fontWeight: '500', textTransform: 'capitalize' },
  filaUbicacion: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
    flex: 1,
    minWidth: 0,
    maxWidth: '100%',
  },
  contenedorTextoUbicacion: {
    flex: 1,
    minWidth: 0,
    maxWidth: '100%',
    overflow: 'hidden',
  },
  textoParcela: { fontSize: 13, fontWeight: '600', color: '#111827' },
  textoCultivo: { fontSize: 11, color: '#6B7280', flexShrink: 1 },
  filaFecha: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  textoFecha: { fontSize: 12, color: '#374151', fontWeight: '500' },
  filaCuadrilla: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  textoCuadrilla: { fontSize: 12, fontWeight: '600', color: Palette.forestGreen },
  botonAccion: { padding: 6, borderRadius: 6, alignItems: 'center', justifyContent: 'center' },
  botonAccionPresionado: { backgroundColor: '#EAEFE7' },
  botonBadgeEstado: {
    paddingVertical: 2,
    paddingHorizontal: 4,
    borderRadius: 8,
    cursor: Platform.OS === 'web' ? ('pointer' as const) : undefined,
  },
  botonBadgeEstadoPresionado: {
    opacity: 0.75,
    backgroundColor: '#EAEFE7',
  },
  contenedorBadgeInteractivo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  iconoChevron: {
    opacity: 0.6,
  },
  filaEstadoCargando: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 3,
    paddingHorizontal: 8,
    backgroundColor: '#F3F4F6',
    borderRadius: 6,
  },
  textoActualizando: {
    fontSize: 11,
    color: '#4B5563',
    fontWeight: '500',
  },
});
