import React from 'react';
import {
  Modal,
  View,
  Text,
  Pressable,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import {
  Trash2,
  AlertTriangle,
  CheckCircle2,
  HelpCircle,
  X,
} from 'lucide-react-native';
import { Palette } from '@/constants/theme';
import { Boton } from './boton';

export interface DetalleConfirmacion {
  etiqueta: string;
  valor: string | number;
  colorIndicador?: string;
}

export interface ModalConfirmacionProps {
  visible: boolean;
  tipo?: 'peligro' | 'confirmacion' | 'exito' | 'advertencia';
  titulo: string;
  mensaje: string;
  detalles?: DetalleConfirmacion[];
  textoConfirmar?: string;
  textoCancelar?: string;
  cargando?: boolean;
  onConfirmar: () => void;
  onCancelar?: () => void;
}

/**
 * @description Diálogo modal de confirmación con variantes temáticas (peligro, confirmación, éxito),
 * resumen de datos y estados de carga.
 */
export const ModalConfirmacion: React.FC<ModalConfirmacionProps> = ({
  visible,
  tipo = 'confirmacion',
  titulo,
  mensaje,
  detalles,
  textoConfirmar,
  textoCancelar = 'Cancelar',
  cargando = false,
  onConfirmar,
  onCancelar,
}) => {
  if (!visible) return null;

  const esPeligro = tipo === 'peligro';
  const esExito = tipo === 'exito';
  const esAdvertencia = tipo === 'advertencia';

  const textoBotonDefecto = esPeligro
    ? 'Eliminar'
    : esExito
    ? 'Entendido'
    : 'Confirmar';

  const renderIcono = () => {
    if (esPeligro) {
      return (
        <View style={[styles.contenedorIcono, styles.iconoPeligro]}>
          <Trash2 size={26} color="#DC2626" />
        </View>
      );
    }
    if (esExito) {
      return (
        <View style={[styles.contenedorIcono, styles.iconoExito]}>
          <CheckCircle2 size={26} color="#16A34A" />
        </View>
      );
    }
    if (esAdvertencia) {
      return (
        <View style={[styles.contenedorIcono, styles.iconoAdvertencia]}>
          <AlertTriangle size={26} color="#D97706" />
        </View>
      );
    }
    return (
      <View style={[styles.contenedorIcono, styles.iconoConfirmacion]}>
        <HelpCircle size={26} color={Palette.forestGreen} />
      </View>
    );
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancelar}>
      <Pressable
        style={styles.overlay}
        onPress={() => {
          if (!cargando && onCancelar) {
            onCancelar();
          }
        }}
      >
        <Pressable style={styles.tarjeta} onPress={(e) => e.stopPropagation()}>
          {onCancelar && !cargando && !esExito && (
            <Pressable style={styles.botonCerrar} onPress={onCancelar} hitSlop={12}>
              <X size={18} color="#9CA3AF" />
            </Pressable>
          )}

          <View style={styles.centroIcono}>{renderIcono()}</View>

          <Text style={styles.titulo}>{titulo}</Text>
          <Text style={styles.mensaje}>{mensaje}</Text>

          {detalles && detalles.length > 0 && (
            <View style={styles.cajaDetalles}>
              {detalles.map((d, index) => (
                <View
                  key={index}
                  style={[
                    styles.filaDetalle,
                    index === detalles.length - 1 && styles.filaDetalleUltima,
                  ]}
                >
                  <Text style={styles.etiquetaDetalle}>{d.etiqueta}</Text>
                  <View style={styles.valorContenedor}>
                    {d.colorIndicador && (
                      <View
                        style={[
                          styles.colorPunto,
                          { backgroundColor: d.colorIndicador },
                        ]}
                      />
                    )}
                    <Text style={styles.valorDetalle} numberOfLines={1}>
                      {d.valor}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          )}

          <View style={styles.filaAcciones}>
            {onCancelar && !esExito && (
              <View style={styles.columnaBoton}>
                <Boton
                  titulo={textoCancelar}
                  variante="outline"
                  disabled={cargando}
                  onPress={onCancelar}
                  estilo={styles.botonAccion}
                />
              </View>
            )}
            <View style={styles.columnaBoton}>
              <Boton
                titulo={textoConfirmar || textoBotonDefecto}
                variante={esPeligro ? 'peligro' : 'primario'}
                cargando={cargando}
                onPress={onConfirmar}
                estilo={styles.botonAccion}
              />
            </View>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    zIndex: 9999,
  },
  tarjeta: {
    width: '100%',
    maxWidth: 440,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.18,
    shadowRadius: 20,
    elevation: 8,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  botonCerrar: {
    position: 'absolute',
    top: 18,
    right: 18,
    padding: 6,
    borderRadius: 8,
    zIndex: 2,
  },
  centroIcono: {
    alignItems: 'center',
    marginBottom: 16,
  },
  contenedorIcono: {
    width: 58,
    height: 58,
    borderRadius: 29,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconoPeligro: {
    backgroundColor: '#FEE2E2',
    borderWidth: 1.5,
    borderColor: '#FECACA',
  },
  iconoConfirmacion: {
    backgroundColor: '#EBF3E8',
    borderWidth: 1.5,
    borderColor: '#D4E6CF',
  },
  iconoExito: {
    backgroundColor: '#DCFCE7',
    borderWidth: 1.5,
    borderColor: '#BBF7D0',
  },
  iconoAdvertencia: {
    backgroundColor: '#FEF3C7',
    borderWidth: 1.5,
    borderColor: '#FDE68A',
  },
  titulo: {
    fontSize: 20,
    fontWeight: '800',
    color: '#111827',
    textAlign: 'center',
    marginBottom: 8,
    letterSpacing: -0.2,
  },
  mensaje: {
    fontSize: 14,
    color: '#4B5563',
    textAlign: 'center',
    lineHeight: 21,
    paddingHorizontal: 8,
  },
  cajaDetalles: {
    marginTop: 18,
    marginBottom: 4,
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  filaDetalle: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#EDF2F7',
  },
  filaDetalleUltima: {
    borderBottomWidth: 0,
  },
  etiquetaDetalle: {
    fontSize: 13,
    color: '#64748B',
    fontWeight: '600',
  },
  valorContenedor: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    maxWidth: '65%',
  },
  colorPunto: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  valorDetalle: {
    fontSize: 13,
    color: '#1E293B',
    fontWeight: '700',
  },
  filaAcciones: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 22,
    width: '100%',
  },
  columnaBoton: {
    flex: 1,
  },
  botonAccion: {
    minHeight: 48,
    paddingVertical: 12,
  },
});
