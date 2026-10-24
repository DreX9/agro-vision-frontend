import React from 'react';
import { View, Text, StyleSheet, Pressable, Modal, Platform } from 'react-native';
import { Check } from 'lucide-react-native';
import { Palette } from '@/constants/theme';
import { ActividadItem, EstadoActividadTipo } from '../types/actividad.types';

export interface PosicionPopover {
  top: number;
  left: number;
}

export interface ActividadEstadoPopoverProps {
  actividad: ActividadItem | null;
  posicion: PosicionPopover;
  visible: boolean;
  onCerrar: () => void;
  onSeleccionarEstado: (actividad: ActividadItem, nuevoEstado: EstadoActividadTipo) => void;
}

export interface OpcionEstadoConfig {
  estado: EstadoActividadTipo;
  label: string;
  subtitulo: string;
  colorDot: string;
}

export const OPCIONES_ESTADOS_ACTIVIDAD: OpcionEstadoConfig[] = [
  {
    estado: 'PENDIENTE',
    label: 'Pendiente',
    subtitulo: 'Programada para campo',
    colorDot: '#D97706',
  },
  {
    estado: 'EN_PROGRESO',
    label: 'En Progreso',
    subtitulo: 'Cuadrilla operando',
    colorDot: '#2563EB',
  },
  {
    estado: 'COMPLETADA',
    label: 'Completada',
    subtitulo: 'Labor finalizada en terreno',
    colorDot: '#15803D',
  },
  {
    estado: 'CANCELADA',
    label: 'Cancelada',
    subtitulo: 'Labor suspendida / anulada',
    colorDot: '#DC2626',
  },
];

/**
 * @description Menú emergente para cambio directo e instantáneo de estado de labor desde la tabla.
 */
export const ActividadEstadoPopover: React.FC<ActividadEstadoPopoverProps> = ({
  actividad,
  posicion,
  visible,
  onCerrar,
  onSeleccionarEstado,
}) => {
  if (!visible || !actividad) return null;

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onCerrar}>
      <Pressable style={styles.fondoTransparente} onPress={onCerrar}>
        <View style={[styles.popoverFlotante, { top: posicion.top, left: posicion.left }]}>
          <View style={styles.encabezado}>
            <Text style={styles.tituloEncabezado}>Cambiar Estado ({actividad.codigo})</Text>
          </View>

          {OPCIONES_ESTADOS_ACTIVIDAD.map((opcion) => {
            const esSeleccionado = actividad.estado === opcion.estado;

            return (
              <Pressable
                key={opcion.estado}
                style={({ pressed }) => [
                  styles.itemOpcion,
                  esSeleccionado && styles.itemSeleccionado,
                  pressed && styles.itemPresionado,
                ]}
                onPress={() => {
                  onCerrar();
                  if (!esSeleccionado) {
                    onSeleccionarEstado(actividad, opcion.estado);
                  }
                }}
              >
                <View style={styles.filaIzquierda}>
                  <View style={[styles.puntoColor, { backgroundColor: opcion.colorDot }]} />
                  <View style={styles.columnaTextos}>
                    <Text style={[styles.labelEstado, esSeleccionado && styles.labelEstadoActivo]}>
                      {opcion.label}
                    </Text>
                    <Text style={styles.subtituloEstado}>{opcion.subtitulo}</Text>
                  </View>
                </View>

                {esSeleccionado && <Check size={16} color={opcion.colorDot} strokeWidth={2.5} />}
              </Pressable>
            );
          })}
        </View>
      </Pressable>
    </Modal>
  );
};

const styles = StyleSheet.create({
  fondoTransparente: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  popoverFlotante: {
    position: 'absolute',
    width: 220,
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#D4DEC9',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.16,
    shadowRadius: 14,
    elevation: 10,
    paddingVertical: 6,
    zIndex: 9999,
  },
  encabezado: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#EEF2E6',
    marginBottom: 4,
  },
  tituloEncabezado: {
    fontSize: 10,
    fontWeight: '700',
    color: '#6B7280',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  itemOpcion: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
    paddingHorizontal: 12,
    cursor: Platform.OS === 'web' ? ('pointer' as const) : undefined,
  },
  itemSeleccionado: {
    backgroundColor: '#F3F8F0',
  },
  itemPresionado: {
    backgroundColor: '#EBF3E5',
  },
  filaIzquierda: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  puntoColor: {
    width: 9,
    height: 9,
    borderRadius: 5,
  },
  columnaTextos: {
    flex: 1,
  },
  labelEstado: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1F2937',
  },
  labelEstadoActivo: {
    color: Palette.forestGreen,
    fontWeight: '700',
  },
  subtituloEstado: {
    fontSize: 11,
    color: '#6B7280',
  },
});
