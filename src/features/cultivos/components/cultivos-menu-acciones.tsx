import React from 'react';
import { View, Text, StyleSheet, Pressable, Modal } from 'react-native';
import { Pencil, Power, Trash2 } from 'lucide-react-native';
import { Palette } from '@/constants/theme';
import { CultivoItem } from '../types/cultivo.types';

export interface PosicionMenu {
  top: number;
  left: number;
}

export interface CultivosMenuAccionesProps {
  cultivo: CultivoItem | null;
  posicion: PosicionMenu;
  visible: boolean;
  onCerrar: () => void;
  onEditar?: (cultivo: CultivoItem) => void;
  onCambiarEstado?: (cultivo: CultivoItem) => void;
  onEliminar?: (cultivo: CultivoItem) => void;
}

/**
 * @description Menú contextual flotante desplegable anclado al botón de tres puntos de cultivos.
 */
export const CultivosMenuAcciones: React.FC<CultivosMenuAccionesProps> = ({
  cultivo,
  posicion,
  visible,
  onCerrar,
  onEditar,
  onCambiarEstado,
  onEliminar,
}) => {
  if (!visible || !cultivo) return null;

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onCerrar}>
      <Pressable style={styles.fondoTransparente} onPress={onCerrar}>
        <View style={[styles.menuFlotante, { top: posicion.top, left: posicion.left }]}>
          {onEditar && (
            <Pressable
              style={({ pressed }) => [styles.opcionMenu, pressed && styles.opcionPresionada]}
              onPress={() => {
                onCerrar();
                onEditar(cultivo);
              }}
            >
              <Pencil size={15} color={Palette.forestGreen} />
              <Text style={styles.textoOpcion}>Editar cultivo</Text>
            </Pressable>
          )}

          {onCambiarEstado && (
            <Pressable
              style={({ pressed }) => [styles.opcionMenu, pressed && styles.opcionPresionada]}
              onPress={() => {
                onCerrar();
                onCambiarEstado(cultivo);
              }}
            >
              <Power size={15} color={cultivo.activo ? '#D97706' : Palette.forestGreen} />
              <Text style={styles.textoOpcion}>
                {cultivo.activo ? 'Desactivar cultivo' : 'Activar cultivo'}
              </Text>
            </Pressable>
          )}

          {onEliminar && (
            <Pressable
              style={({ pressed }) => [
                styles.opcionMenu,
                styles.opcionPeligro,
                pressed && styles.opcionPresionada,
              ]}
              onPress={() => {
                onCerrar();
                onEliminar(cultivo);
              }}
            >
              <Trash2 size={15} color="#DC2626" />
              <Text style={[styles.textoOpcion, styles.textoPeligro]}>Eliminar</Text>
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
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
  },
  menuFlotante: {
    position: 'absolute',
    width: 190,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 10,
    elevation: 8,
    zIndex: 9999,
    paddingVertical: 4,
  },
  opcionMenu: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  opcionPresionada: {
    backgroundColor: '#F3F4F6',
  },
  textoOpcion: {
    fontSize: 13,
    color: '#374151',
    fontWeight: '500',
  },
  opcionPeligro: {
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  textoPeligro: {
    color: '#DC2626',
    fontWeight: '600',
  },
});
