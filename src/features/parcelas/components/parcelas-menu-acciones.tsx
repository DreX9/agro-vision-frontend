import React from 'react';
import { View, Text, StyleSheet, Pressable, Modal } from 'react-native';
import { Eye, Pencil, Power, Trash2 } from 'lucide-react-native';
import { Palette } from '@/constants/theme';
import { ParcelaItem } from '../types/parcela.types';

export interface PosicionMenu {
  top: number;
  left: number;
}

export interface ParcelasMenuAccionesProps {
  parcela: ParcelaItem | null;
  posicion: PosicionMenu;
  visible: boolean;
  onCerrar: () => void;
  onVerDetalle?: (parcela: ParcelaItem) => void;
  onEditar?: (parcela: ParcelaItem) => void;
  onCambiarEstado?: (parcela: ParcelaItem) => void;
  onEliminar?: (parcela: ParcelaItem) => void;
}

/**
 * @description Menú contextual flotante desplegable anclado al botón de tres puntos de cada fila.
 */
export const ParcelasMenuAcciones: React.FC<ParcelasMenuAccionesProps> = ({
  parcela,
  posicion,
  visible,
  onCerrar,
  onVerDetalle,
  onEditar,
  onCambiarEstado,
  onEliminar,
}) => {
  if (!visible || !parcela) return null;

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onCerrar}>
      <Pressable style={styles.fondoTransparente} onPress={onCerrar}>
        <View style={[styles.menuFlotante, { top: posicion.top, left: posicion.left }]}>
          {onVerDetalle && (
            <Pressable
              style={({ pressed }) => [styles.opcionMenu, pressed && styles.opcionPresionada]}
              onPress={() => {
                onCerrar();
                onVerDetalle(parcela);
              }}
            >
              <Eye size={15} color="#2563EB" />
              <Text style={styles.textoOpcion}>Ver Ficha / Mapa</Text>
            </Pressable>
          )}
          {onEditar && (
            <Pressable
              style={({ pressed }) => [styles.opcionMenu, pressed && styles.opcionPresionada]}
              onPress={() => {
                onCerrar();
                onEditar(parcela);
              }}
            >
              <Pencil size={15} color={Palette.forestGreen} />
              <Text style={styles.textoOpcion}>Editar parcela</Text>
            </Pressable>
          )}

          {onCambiarEstado && (
            <Pressable
              style={({ pressed }) => [styles.opcionMenu, pressed && styles.opcionPresionada]}
              onPress={() => {
                onCerrar();
                onCambiarEstado(parcela);
              }}
            >
              <Power size={15} color="#D97706" />
              <Text style={styles.textoOpcion}>Cambiar estado</Text>
            </Pressable>
          )}

          {onEliminar && (
            <Pressable
              style={({ pressed }) => [
                styles.opcionMenu,
                styles.opcionEliminar,
                pressed && styles.opcionPresionada,
              ]}
              onPress={() => {
                onCerrar();
                onEliminar(parcela);
              }}
            >
              <Trash2 size={15} color="#DC2626" />
              <Text style={[styles.textoOpcion, styles.textoEliminar]}>Eliminar</Text>
            </Pressable>
          )}
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
  menuFlotante: {
    position: 'absolute',
    width: 170,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#D0DEC8',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.14,
    shadowRadius: 10,
    elevation: 8,
    paddingVertical: 4,
    zIndex: 9999,
  },
  opcionMenu: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  opcionEliminar: {
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  opcionPresionada: {
    backgroundColor: '#F4F7F2',
  },
  textoOpcion: {
    fontSize: 13,
    fontWeight: '500',
    color: '#374151',
  },
  textoEliminar: {
    color: '#DC2626',
    fontWeight: '600',
  },
});
