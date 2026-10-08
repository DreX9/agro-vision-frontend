import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable, Platform } from 'react-native';
import { MoreVertical, Sprout, User } from 'lucide-react-native';
import { Palette } from '@/constants/theme';
import { Badge, Tabla, ColumnaTabla } from '@/shared/components/ui';
import { ParcelaItem } from '../types/parcela.types';
import { ParcelasMenuAcciones, PosicionMenu } from './parcelas-menu-acciones';

export interface ParcelasTablaProps {
  parcelas: ParcelaItem[];
  cargando?: boolean;
  onEditar?: (parcela: ParcelaItem) => void;
  onCambiarEstado?: (parcela: ParcelaItem) => void;
  onEliminar?: (parcela: ParcelaItem) => void;
}

/**
 * @description Tabla responsiva de parcelas agrícolas con menú de 3 puntos y badges de estado.
 */
export const ParcelasTabla: React.FC<ParcelasTablaProps> = ({
  parcelas,
  cargando = false,
  onEditar,
  onCambiarEstado,
  onEliminar,
}) => {
  const [parcelaActiva, setParcelaActiva] = useState<ParcelaItem | null>(null);
  const [posicion, setPosicion] = useState<PosicionMenu>({ top: 0, left: 0 });

  const obtenerVarianteEstado = (
    estado: string,
  ): 'exito' | 'info' | 'alerta' | 'peligro' | 'neutro' => {
    switch (estado) {
      case 'ACTIVA':
        return 'exito';
      case 'EN_PREPARACION':
        return 'info';
      case 'EN_DESCANSO':
        return 'alerta';
      case 'COSECHADA':
        return 'neutro';
      case 'INACTIVA':
        return 'peligro';
      default:
        return 'neutro';
    }
  };

  const formatearEstadoTexto = (estado: string): string => {
    switch (estado) {
      case 'ACTIVA':
        return 'Activa';
      case 'EN_PREPARACION':
        return 'En Preparación';
      case 'EN_DESCANSO':
        return 'En Descanso';
      case 'COSECHADA':
        return 'Cosechada';
      case 'INACTIVA':
        return 'Inactiva';
      default:
        return estado;
    }
  };

  const abrirMenu = (p: ParcelaItem, ref: View | null) => {
    if (!ref) {
      setParcelaActiva(p);
      return;
    }

    if (Platform.OS === 'web') {
      const el = ref as unknown as HTMLElement;
      if (el && typeof el.getBoundingClientRect === 'function') {
        const rect = el.getBoundingClientRect();
        setPosicion({
          top: rect.bottom + 4,
          left: Math.max(10, rect.right - 170),
        });
        setParcelaActiva(p);
        return;
      }
    }

    ref.measureInWindow((x, y, width, height) => {
      setPosicion({
        top: y + height + 4,
        left: Math.max(10, x + width - 170),
      });
      setParcelaActiva(p);
    });
  };

  const columnas: ColumnaTabla<ParcelaItem>[] = [
    {
      id: 'codigo',
      encabezado: 'Código',
      anchoMinimo: 95,
      render: (p: ParcelaItem) => <Text style={styles.textoCodigo}>{p.codigo}</Text>,
    },
    {
      id: 'nombre',
      encabezado: 'Nombre del Lote',
      anchoMinimo: 170,
      render: (p: ParcelaItem) => (
        <View>
          <Text style={styles.textoNombre}>{p.nombre}</Text>
          {p.ubicacion ? <Text style={styles.textoSub}>{p.ubicacion}</Text> : null}
        </View>
      ),
    },
    {
      id: 'cultivo',
      encabezado: 'Cultivo',
      anchoMinimo: 150,
      render: (p: ParcelaItem) => (
        <View style={styles.filaCultivo}>
          <Sprout size={14} color={Palette.forestGreen} />
          <Text style={styles.textoCultivo}>{p.cultivoNombre || 'Sin cultivo'}</Text>
          {p.variedad ? <Text style={styles.textoVariedad}>({p.variedad})</Text> : null}
        </View>
      ),
    },
    {
      id: 'area',
      encabezado: 'Área (ha)',
      anchoMinimo: 100,
      render: (p: ParcelaItem) => (
        <Text style={styles.textoArea}>
          {Number(p.areaHectareas).toFixed(2)} <Text style={styles.unidadHa}>ha</Text>
        </Text>
      ),
    },
    {
      id: 'responsable',
      encabezado: 'Responsable',
      anchoMinimo: 150,
      render: (p: ParcelaItem) => (
        <View style={styles.filaUsuario}>
          <User size={13} color="#6B7280" />
          <Text style={styles.textoResponsable} numberOfLines={1}>
            {p.usuarioResponsableNombre || 'Sin asignar'}
          </Text>
        </View>
      ),
    },
    {
      id: 'estado',
      encabezado: 'Estado',
      anchoMinimo: 130,
      render: (p: ParcelaItem) => (
        <Badge
          texto={formatearEstadoTexto(p.estado)}
          variante={obtenerVarianteEstado(p.estado)}
        />
      ),
    },
    {
      id: 'acciones',
      encabezado: 'Acciones',
      anchoMinimo: 80,
      alineacion: 'center',
      render: (p: ParcelaItem) => {
        let botonRef: View | null = null;
        return (
          <Pressable
            ref={(ref) => {
              botonRef = ref;
            }}
            onPress={() => abrirMenu(p, botonRef)}
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
        datos={parcelas}
        columnas={columnas}
        claveExtractor={(item) => item.id}
        cargando={cargando}
        mensajeVacio="No se encontraron parcelas registradas."
      />

      <ParcelasMenuAcciones
        parcela={parcelaActiva}
        posicion={posicion}
        visible={Boolean(parcelaActiva)}
        onCerrar={() => setParcelaActiva(null)}
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
  textoNombre: { fontSize: 13, fontWeight: '700', color: '#1F2937' },
  textoSub: { fontSize: 11, color: '#6B7280' },
  filaCultivo: { flexDirection: 'row', alignItems: 'center', gap: 5, flexWrap: 'wrap' },
  textoCultivo: { fontSize: 13, fontWeight: '600', color: '#111827' },
  textoVariedad: { fontSize: 11, color: '#4B5563' },
  textoArea: { fontSize: 13, fontWeight: '800', color: '#111827' },
  unidadHa: { fontSize: 11, fontWeight: '500', color: '#6B7280' },
  filaUsuario: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  textoResponsable: { fontSize: 12, color: '#374151' },
  botonAccion: {
    padding: 6,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  botonAccionPresionado: { backgroundColor: '#EAEFE7' },
});
