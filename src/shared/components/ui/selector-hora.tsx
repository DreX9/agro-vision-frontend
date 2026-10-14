import React, { useState } from 'react';
import {
  View,
  Text,
  Pressable,
  Modal,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { Clock, X, Check, Sun, Sunrise, Sunset } from 'lucide-react-native';
import { Palette } from '@/constants/theme';

export interface SelectorHoraProps {
  label?: string;
  valor?: string; // Formato HH:mm, ej: '07:00'
  onChange: (hora: string) => void;
  placeholder?: string;
  error?: string;
  deshabilitado?: boolean;
}

const HORAS_JORNADA = [
  '05', '06', '07', '08', '09', '10', '11', '12',
  '13', '14', '15', '16', '17', '18', '19', '20'
];

const MINUTOS_JORNADA = ['00', '15', '30', '45'];

const TURNOS_RAPIDOS = [
  { etiqueta: '🌅 06:00 (Madrugada)', hora: '06:00' },
  { etiqueta: '🚜 07:00 (Inicio Faena)', hora: '07:00' },
  { etiqueta: '☀️ 12:00 (Fin Mañana)', hora: '12:00' },
  { etiqueta: '🌱 13:00 (Inicio Tarde)', hora: '13:00' },
  { etiqueta: '🌇 15:00 (8h Jornada)', hora: '15:00' },
  { etiqueta: '🌙 17:00 (Fin Tarde)', hora: '17:00' },
];

/**
 * @description Formatea una hora en formato amigable HH:mm (12h con AM/PM).
 */
export const formatearHoraAmigable = (horaStr?: string): string => {
  if (!horaStr) return '';
  const partes = horaStr.split(':');
  if (partes.length < 2) return horaStr;
  const h = parseInt(partes[0], 10);
  const m = partes[1].slice(0, 2);
  if (isNaN(h)) return horaStr;
  const ampm = h >= 12 ? 'PM' : 'AM';
  const h12 = h % 12 === 0 ? 12 : h % 12;
  const h12Str = String(h12).padStart(2, '0');
  return `${h12Str}:${m} ${ampm} (${horaStr})`;
};

export const SelectorHora: React.FC<SelectorHoraProps> = ({
  label,
  valor = '07:00',
  onChange,
  placeholder = 'Seleccionar hora en reloj...',
  error,
  deshabilitado = false,
}) => {
  const [modalVisible, setModalVisible] = useState(false);

  const partes = (valor || '07:00').split(':');
  const horaInicial = partes[0] ? partes[0].padStart(2, '0') : '07';
  const minutoInicial = partes[1] ? partes[1].padStart(2, '0').slice(0, 2) : '00';

  const [horaSeleccionada, setHoraSeleccionada] = useState(horaInicial);
  const [minutoSeleccionado, setMinutoSeleccionado] = useState(minutoInicial);

  const abrirModal = () => {
    if (deshabilitado) return;
    const p = (valor || '07:00').split(':');
    setHoraSeleccionada(p[0] ? p[0].padStart(2, '0') : '07');
    setMinutoSeleccionado(p[1] ? p[1].padStart(2, '0').slice(0, 2) : '00');
    setModalVisible(true);
  };

  const aplicarTurnoRapido = (horaComp: string) => {
    onChange(horaComp);
    setModalVisible(false);
  };

  const confirmarHora = () => {
    const horaFinal = `${horaSeleccionada}:${minutoSeleccionado}`;
    onChange(horaFinal);
    setModalVisible(false);
  };

  const textoMostrar = valor ? formatearHoraAmigable(valor) : placeholder;

  return (
    <View style={styles.contenedor}>
      {label && <Text style={styles.label}>{label}</Text>}

      {/* Botón visual de selección de reloj */}
      <Pressable
        onPress={abrirModal}
        style={[
          styles.campoBoton,
          !!error && styles.campoBotonError,
          deshabilitado && styles.campoBotonDeshabilitado,
        ]}
      >
        <Clock size={18} color={valor ? Palette.forestGreen : '#9CA3AF'} style={styles.icono} />
        <Text style={[styles.textoCampo, !valor && styles.textoPlaceholder]}>
          {textoMostrar}
        </Text>
      </Pressable>

      {error && <Text style={styles.errorTexto}>{error}</Text>}

      {/* Modal interactivo de Reloj / Horario */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setModalVisible(false)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setModalVisible(false)}>
          <Pressable style={styles.modalTarjeta} onPress={(e) => e.stopPropagation()}>
            {/* Cabecera */}
            <View style={styles.modalCabecera}>
              <View style={styles.modalCabeceraInfo}>
                <Clock size={20} color={Palette.forestGreen} />
                <Text style={styles.modalTitulo}>Horario de Jornada / Turno</Text>
              </View>
              <Pressable
                onPress={() => setModalVisible(false)}
                style={styles.botonCerrar}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <X size={18} color="#6B7280" />
              </Pressable>
            </View>

            {/* Display digital del reloj seleccionado */}
            <View style={styles.displayDigital}>
              <Text style={styles.displayDigitalTexto}>
                {horaSeleccionada}:{minutoSeleccionado}
              </Text>
              <Text style={styles.displayDigitalSubtexto}>
                {parseInt(horaSeleccionada, 10) >= 12 ? 'TURNO TARDE / NOCHE' : 'TURNO MAÑANA'}
              </Text>
            </View>

            {/* Sección: Selección de Horas */}
            <Text style={styles.subtituloSeccion}>1. Seleccione Hora (HH)</Text>
            <View style={styles.grillaHoras}>
              {HORAS_JORNADA.map((h) => {
                const activo = horaSeleccionada === h;
                return (
                  <Pressable
                    key={h}
                    onPress={() => setHoraSeleccionada(h)}
                    style={[styles.chipHora, activo && styles.chipHoraActivo]}
                  >
                    <Text style={[styles.textoChipHora, activo && styles.textoChipHoraActivo]}>
                      {h}:00
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            {/* Sección: Selección de Minutos */}
            <Text style={styles.subtituloSeccion}>2. Minutos (mm)</Text>
            <View style={styles.grillaMinutos}>
              {MINUTOS_JORNADA.map((m) => {
                const activo = minutoSeleccionado === m;
                return (
                  <Pressable
                    key={m}
                    onPress={() => setMinutoSeleccionado(m)}
                    style={[styles.chipMinuto, activo && styles.chipMinutoActivo]}
                  >
                    <Text style={[styles.textoChipMinuto, activo && styles.textoChipMinutoActivo]}>
                      :{m}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            {/* Turnos rápidos comunes en agricultura */}
            <Text style={styles.subtituloSeccion}>Atajos de Campo Habituales</Text>
            <View style={styles.grillaAtajos}>
              {TURNOS_RAPIDOS.map((t) => (
                <Pressable
                  key={t.hora}
                  onPress={() => aplicarTurnoRapido(t.hora)}
                  style={styles.botonTurnoRapido}
                >
                  <Text style={styles.textoTurnoRapido}>{t.etiqueta}</Text>
                </Pressable>
              ))}
            </View>

            {/* Botón de confirmación */}
            <View style={styles.pieAcciones}>
              <Pressable onPress={confirmarHora} style={styles.botonConfirmar}>
                <Check size={18} color={Palette.white} />
                <Text style={styles.textoBotonConfirmar}>
                  Aceptar Horario ({horaSeleccionada}:{minutoSeleccionado})
                </Text>
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  contenedor: {
    width: '100%',
    marginBottom: 16,
  },
  label: {
    fontSize: 12,
    fontWeight: '700',
    color: '#374151',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  campoBoton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Palette.white,
    borderWidth: 1.2,
    borderColor: Palette.border,
    borderRadius: 10,
    minHeight: 48,
    paddingHorizontal: 12,
  },
  campoBotonError: {
    borderColor: Palette.error,
  },
  campoBotonDeshabilitado: {
    backgroundColor: '#F3F4F6',
    opacity: 0.7,
  },
  icono: {
    marginRight: 10,
  },
  textoCampo: {
    fontSize: 14,
    color: '#1F2937',
    fontWeight: '500',
    flex: 1,
  },
  textoPlaceholder: {
    color: '#9CA3AF',
    fontWeight: '400',
  },
  errorTexto: {
    fontSize: 12,
    color: Palette.error,
    marginTop: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modalTarjeta: {
    backgroundColor: Palette.white,
    borderRadius: 16,
    padding: 18,
    width: '100%',
    maxWidth: 380,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 14,
    elevation: 8,
  },
  modalCabecera: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  modalCabeceraInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  modalTitulo: {
    fontSize: 15,
    fontWeight: '700',
    color: '#111827',
  },
  botonCerrar: {
    padding: 4,
    borderRadius: 6,
  },
  displayDigital: {
    backgroundColor: '#064E3B',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    marginBottom: 14,
  },
  displayDigitalTexto: {
    fontSize: 28,
    fontWeight: '800',
    color: '#34D399',
    letterSpacing: 2,
  },
  displayDigitalSubtexto: {
    fontSize: 11,
    color: '#A7F3D0',
    fontWeight: '600',
    marginTop: 2,
  },
  subtituloSeccion: {
    fontSize: 12,
    fontWeight: '700',
    color: '#4B5563',
    marginBottom: 6,
    textTransform: 'uppercase',
  },
  grillaHoras: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 12,
  },
  chipHora: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  chipHoraActivo: {
    backgroundColor: Palette.forestGreen,
    borderColor: Palette.forestGreen,
  },
  textoChipHora: {
    fontSize: 12,
    fontWeight: '600',
    color: '#374151',
  },
  textoChipHoraActivo: {
    color: Palette.white,
    fontWeight: '700',
  },
  grillaMinutos: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 14,
  },
  chipMinuto: {
    flex: 1,
    paddingVertical: 7,
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  chipMinutoActivo: {
    backgroundColor: Palette.forestGreen,
    borderColor: Palette.forestGreen,
  },
  textoChipMinuto: {
    fontSize: 13,
    fontWeight: '600',
    color: '#374151',
  },
  textoChipMinutoActivo: {
    color: Palette.white,
    fontWeight: '700',
  },
  grillaAtajos: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 14,
  },
  botonTurnoRapido: {
    backgroundColor: '#ECFDF5',
    paddingVertical: 5,
    paddingHorizontal: 8,
    borderRadius: 6,
  },
  textoTurnoRapido: {
    fontSize: 11,
    fontWeight: '600',
    color: Palette.forestGreen,
  },
  pieAcciones: {
    marginTop: 6,
  },
  botonConfirmar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Palette.forestGreen,
    paddingVertical: 11,
    borderRadius: 10,
  },
  textoBotonConfirmar: {
    color: Palette.white,
    fontSize: 14,
    fontWeight: '700',
  },
});
