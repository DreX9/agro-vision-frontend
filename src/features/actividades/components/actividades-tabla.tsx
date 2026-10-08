import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable, Platform } from 'react-native';
import { MoreVertical, Users, Calendar, MapPin } from 'lucide-react-native';
import { Palette } from '@/constants/theme';
import { Badge, Tabla, ColumnaTabla } from '@/shared/components/ui';
import { ActividadItem, EstadoActividadTipo } from '../types/actividad.types';
import { ActividadesMenuAcciones, PosicionMenu } from './actividades-menu-acciones';

export interface ActividadesTablaProps {
  actividades: ActividadItem[];
  cargando?: boolean;
  onVerDetalle?: (actividad: ActividadItem) => void;
  onEditar?: (actividad: ActividadItem) => void;
  onCambiarEstado?: (actividad: ActividadItem) => void;
  onEliminar?: (actividad: ActividadItem) => void;
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
}) => {
  const [actividadActiva, setActividadActiva] = useState<ActividadItem | null>(null);
  const [posicion, setPosicion] = useState<PosicionMenu>({ top: 0, left: 0 });

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
      anchoMinimo: 150,
      render: (a: ActividadItem) => (
        <View style={styles.filaUbicacion}>
          <MapPin size={13} color={Palette.forestGreen} />
          <View>
            <Text style={styles.textoParcela}>{a.parcelaNombre || 'Parcela'}</Text>
            {a.cultivoNombre ? <Text style={styles.textoCultivo}>({a.cultivoNombre})</Text> : null}
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
      anchoMinimo: 120,
      render: (a: ActividadItem) => (
        <Badge
          texto={formatearEstadoTexto(a.estado)}
          variante={obtenerVarianteEstado(a.estado)}
        />
      ),
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
  filaUbicacion: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  textoParcela: { fontSize: 13, fontWeight: '600', color: '#111827' },
  textoCultivo: { fontSize: 11, color: '#6B7280' },
  filaFecha: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  textoFecha: { fontSize: 12, color: '#374151', fontWeight: '500' },
  filaCuadrilla: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  textoCuadrilla: { fontSize: 12, fontWeight: '600', color: Palette.forestGreen },
  botonAccion: { padding: 6, borderRadius: 6, alignItems: 'center', justifyContent: 'center' },
  botonAccionPresionado: { backgroundColor: '#EAEFE7' },
});
