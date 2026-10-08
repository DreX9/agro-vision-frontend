import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Modal,
  FlatList,
  Platform,
  ViewStyle,
} from 'react-native';
import { ChevronDown, Check, X } from 'lucide-react-native';
import { Palette } from '@/constants/theme';

export interface SelectOpcion {
  label: string;
  valor: string;
}

export interface SelectProps {
  label?: string;
  placeholder?: string;
  opciones: SelectOpcion[];
  valor?: string;
  error?: string;
  deshabilitado?: boolean;
  contenedorEstilo?: ViewStyle;
  onChange: (valor: string) => void;
}

/**
 * @description Selector dropdown estandarizado multiplataforma (Web y Móvil)
 * con diseño limpio, estados activo/deshabilitado y mensajes de error.
 */
export const Select: React.FC<SelectProps> = ({
  label,
  placeholder = 'Seleccionar...',
  opciones,
  valor,
  error,
  deshabilitado = false,
  contenedorEstilo,
  onChange,
}) => {
  const [modalAbierto, setModalAbierto] = useState(false);

  const opcionSeleccionada = opciones.find((o) => o.valor === valor);

  if (Platform.OS === 'web') {
    return (
      <View style={[styles.contenedor, contenedorEstilo]}>
        {label && <Text style={styles.label}>{label}</Text>}
        <div
          style={{
            position: 'relative',
            width: '100%',
          }}
        >
          <select
            value={valor || ''}
            disabled={deshabilitado}
            onChange={(e) => onChange(e.target.value)}
            style={{
              width: '100%',
              height: '44px',
              paddingLeft: '12px',
              paddingRight: '36px',
              borderRadius: '8px',
              border: error ? '1px solid #DC2626' : '1px solid #D1D5DB',
              backgroundColor: deshabilitado ? '#F3F4F6' : '#FFFFFF',
              color: valor ? '#111827' : '#9CA3AF',
              fontSize: '14px',
              outline: 'none',
              cursor: deshabilitado ? 'not-allowed' : 'pointer',
              appearance: 'none',
              fontFamily: 'inherit',
            }}
          >
            <option value="" disabled>
              {placeholder}
            </option>
            {opciones.map((o) => (
              <option key={o.valor} value={o.valor} style={{ color: '#111827' }}>
                {o.label}
              </option>
            ))}
          </select>
          <div
            style={{
              position: 'absolute',
              right: '12px',
              top: '50%',
              transform: 'translateY(-50%)',
              pointerEvents: 'none',
              display: 'flex',
              alignItems: 'center',
            }}
          >
            <ChevronDown size={16} color="#6B7280" />
          </div>
        </div>
        {error && <Text style={styles.textoError}>{error}</Text>}
      </View>
    );
  }

  return (
    <View style={[styles.contenedor, contenedorEstilo]}>
      {label && <Text style={styles.label}>{label}</Text>}

      <Pressable
        disabled={deshabilitado}
        onPress={() => setModalAbierto(true)}
        style={[
          styles.cajaSelector,
          deshabilitado && styles.cajaDeshabilitada,
          !!error && styles.cajaError,
        ]}
      >
        <Text style={[styles.textoValor, !opcionSeleccionada && styles.textoPlaceholder]}>
          {opcionSeleccionada ? opcionSeleccionada.label : placeholder}
        </Text>
        <ChevronDown size={18} color="#6B7280" />
      </Pressable>

      {error && <Text style={styles.textoError}>{error}</Text>}

      <Modal visible={modalAbierto} transparent animationType="fade">
        <Pressable style={styles.fondoModal} onPress={() => setModalAbierto(false)}>
          <View style={styles.contenidoModal}>
            <View style={styles.cabeceraModal}>
              <Text style={styles.tituloModal}>{label || placeholder}</Text>
              <Pressable onPress={() => setModalAbierto(false)} hitSlop={10}>
                <X size={20} color="#6B7280" />
              </Pressable>
            </View>

            <FlatList
              data={opciones}
              keyExtractor={(item) => item.valor}
              renderItem={({ item }) => {
                const activo = item.valor === valor;
                return (
                  <Pressable
                    style={[styles.itemOpcion, activo && styles.itemOpcionActivo]}
                    onPress={() => {
                      onChange(item.valor);
                      setModalAbierto(false);
                    }}
                  >
                    <Text style={[styles.textoOpcion, activo && styles.textoOpcionActivo]}>
                      {item.label}
                    </Text>
                    {activo && <Check size={18} color={Palette.forestGreen} />}
                  </Pressable>
                );
              }}
            />
          </View>
        </Pressable>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  contenedor: { gap: 6 },
  label: { fontSize: 13, fontWeight: '700', color: '#374151' },
  cajaSelector: {
    height: 44,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cajaDeshabilitada: { backgroundColor: '#F3F4F6' },
  cajaError: { borderColor: '#DC2626' },
  textoValor: { fontSize: 14, color: '#111827' },
  textoPlaceholder: { color: '#9CA3AF' },
  textoError: { fontSize: 12, color: '#DC2626', marginTop: 2 },
  fondoModal: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  contenidoModal: {
    width: '100%',
    maxWidth: 420,
    maxHeight: '70%',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    overflow: 'hidden',
  },
  cabeceraModal: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  tituloModal: { fontSize: 15, fontWeight: '700', color: '#111827' },
  itemOpcion: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  itemOpcionActivo: { backgroundColor: '#F4F7F2' },
  textoOpcion: { fontSize: 14, color: '#374151' },
  textoOpcionActivo: { fontWeight: '700', color: Palette.forestGreen },
});
