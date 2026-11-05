import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  Pressable,
  Modal,
  StyleSheet,
  Platform,
} from 'react-native';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, X, Check, Lock } from 'lucide-react-native';
import { Palette } from '@/constants/theme';

export interface SelectorFechaProps {
  label?: string;
  valor?: string; // Formato YYYY-MM-DD
  onChange: (fecha: string) => void;
  placeholder?: string;
  error?: string;
  minFecha?: string;
  deshabilitado?: boolean;
}

const NOMBRES_MESES = [
  'Enero',
  'Febrero',
  'Marzo',
  'Abril',
  'Mayo',
  'Junio',
  'Julio',
  'Agosto',
  'Septiembre',
  'Octubre',
  'Noviembre',
  'Diciembre',
];

const DIAS_SEMANA = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

/**
 * @description Formatea una fecha YYYY-MM-DD a formato legible en español.
 */
export const formatearFechaLegible = (fechaStr?: string): string => {
  if (!fechaStr) return '';
  const partes = fechaStr.split('T')[0].split('-');
  if (partes.length !== 3) return fechaStr;
  const anio = parseInt(partes[0], 10);
  const mesIdx = parseInt(partes[1], 10) - 1;
  const dia = parseInt(partes[2], 10);

  if (isNaN(anio) || isNaN(mesIdx) || isNaN(dia) || mesIdx < 0 || mesIdx > 11) {
    return fechaStr;
  }
  return `${dia} de ${NOMBRES_MESES[mesIdx]} de ${anio}`;
};

/**
 * @description Obtiene la fecha de hoy en formato YYYY-MM-DD.
 */
const hoyStr = (): string => {
  const d = new Date();
  const anio = d.getFullYear();
  const mes = String(d.getMonth() + 1).padStart(2, '0');
  const dia = String(d.getDate()).padStart(2, '0');
  return `${anio}-${mes}-${dia}`;
};

export const SelectorFecha: React.FC<SelectorFechaProps> = ({
  label,
  valor,
  onChange,
  placeholder = 'Seleccionar fecha en calendario...',
  error,
  deshabilitado = false,
}) => {
  const [modalVisible, setModalVisible] = useState(false);

  // Fecha para navegar el mes del calendario
  const fechaReferencia = useMemo(() => {
    if (valor) {
      const p = valor.split('T')[0].split('-');
      if (p.length === 3) {
        return new Date(parseInt(p[0], 10), parseInt(p[1], 10) - 1, parseInt(p[2], 10));
      }
    }
    return new Date();
  }, [valor]);

  const [mesActual, setMesActual] = useState(fechaReferencia.getMonth());
  const [anioActual, setAnioActual] = useState(fechaReferencia.getFullYear());

  const abrirModal = () => {
    if (deshabilitado) return;
    setMesActual(fechaReferencia.getMonth());
    setAnioActual(fechaReferencia.getFullYear());
    setModalVisible(true);
  };

  const cambiarMes = (delta: number) => {
    let nuevoMes = mesActual + delta;
    let nuevoAnio = anioActual;
    if (nuevoMes < 0) {
      nuevoMes = 11;
      nuevoAnio -= 1;
    } else if (nuevoMes > 11) {
      nuevoMes = 0;
      nuevoAnio += 1;
    }
    setMesActual(nuevoMes);
    setAnioActual(nuevoAnio);
  };

  // Generar cuadrícula de días para el mes actual
  const diasGrilla = useMemo(() => {
    const primerDiaSemana = new Date(anioActual, mesActual, 1).getDay();
    const totalDiasMes = new Date(anioActual, mesActual + 1, 0).getDate();
    const totalDiasMesAnterior = new Date(anioActual, mesActual, 0).getDate();

    const celdas: { dia: number; mes: number; anio: number; esMesActual: boolean }[] = [];

    // Relleno de días del mes anterior
    for (let i = primerDiaSemana - 1; i >= 0; i--) {
      celdas.push({
        dia: totalDiasMesAnterior - i,
        mes: mesActual === 0 ? 11 : mesActual - 1,
        anio: mesActual === 0 ? anioActual - 1 : anioActual,
        esMesActual: false,
      });
    }

    // Días del mes en curso
    for (let d = 1; d <= totalDiasMes; d++) {
      celdas.push({
        dia: d,
        mes: mesActual,
        anio: anioActual,
        esMesActual: true,
      });
    }

    // Relleno de días del siguiente mes para completar filas
    const resto = celdas.length % 7;
    if (resto !== 0) {
      const faltan = 7 - resto;
      for (let s = 1; s <= faltan; s++) {
        celdas.push({
          dia: s,
          mes: mesActual === 11 ? 0 : mesActual + 1,
          anio: mesActual === 11 ? anioActual + 1 : anioActual,
          esMesActual: false,
        });
      }
    }

    return celdas;
  }, [anioActual, mesActual]);

  const seleccionarDia = (dia: number, mes: number, anio: number) => {
    const mesStr = String(mes + 1).padStart(2, '0');
    const diaStr = String(dia).padStart(2, '0');
    const fechaSeleccionada = `${anio}-${mesStr}-${diaStr}`;
    onChange(fechaSeleccionada);
    setModalVisible(false);
  };

  const seleccionarHoy = () => {
    const h = hoyStr();
    onChange(h);
    setModalVisible(false);
  };

  const seleccionarManana = () => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    const anio = d.getFullYear();
    const mes = String(d.getMonth() + 1).padStart(2, '0');
    const dia = String(d.getDate()).padStart(2, '0');
    onChange(`${anio}-${mes}-${dia}`);
    setModalVisible(false);
  };

  const textoMostrar = valor ? formatearFechaLegible(valor) : placeholder;

  return (
    <View style={styles.contenedor}>
      {label && <Text style={styles.label}>{label}</Text>}

      {/* Botón visual que abre el calendario */}
      <Pressable
        onPress={abrirModal}
        style={[
          styles.campoBoton,
          !!error && styles.campoBotonError,
          deshabilitado && styles.campoBotonDeshabilitado,
        ]}
      >
        <CalendarIcon size={18} color={valor ? Palette.forestGreen : '#9CA3AF'} style={styles.icono} />
        <Text style={[styles.textoCampo, !valor && styles.textoPlaceholder]}>
          {textoMostrar}
        </Text>
        {deshabilitado && <Lock size={15} color="#9CA3AF" style={{ marginLeft: 'auto' }} />}
      </Pressable>

      {error && <Text style={styles.errorTexto}>{error}</Text>}

      {/* Modal interactivo de Calendario */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setModalVisible(false)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setModalVisible(false)}>
          <Pressable style={styles.modalTarjeta} onPress={(e) => e.stopPropagation()}>
            {/* Cabecera del Calendario */}
            <View style={styles.modalCabecera}>
              <View style={styles.modalCabeceraInfo}>
                <CalendarIcon size={20} color={Palette.forestGreen} />
                <Text style={styles.modalTitulo}>Seleccionar Fecha</Text>
              </View>
              <Pressable
                onPress={() => setModalVisible(false)}
                style={styles.botonCerrar}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <X size={18} color="#6B7280" />
              </Pressable>
            </View>

            {/* Selector de Mes y Año con navegación */}
            <View style={styles.navegadorMes}>
              <Pressable
                onPress={() => cambiarMes(-1)}
                style={styles.botonNavMes}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <ChevronLeft size={20} color="#374151" />
              </Pressable>

              <Text style={styles.textoMesAnio}>
                {NOMBRES_MESES[mesActual]} {anioActual}
              </Text>

              <Pressable
                onPress={() => cambiarMes(1)}
                style={styles.botonNavMes}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <ChevronRight size={20} color="#374151" />
              </Pressable>
            </View>

            {/* Días de la semana */}
            <View style={styles.filaDiasSemana}>
              {DIAS_SEMANA.map((d, idx) => (
                <Text
                  key={d}
                  style={[styles.celdaCabeceraSemana, (idx === 0 || idx === 6) && styles.celdaFinSemana]}
                >
                  {d}
                </Text>
              ))}
            </View>

            {/* Grilla mensual interactiva */}
            <View style={styles.grillaDias}>
              {diasGrilla.map((celda, i) => {
                const mesStr = String(celda.mes + 1).padStart(2, '0');
                const diaStr = String(celda.dia).padStart(2, '0');
                const celdaStr = `${celda.anio}-${mesStr}-${diaStr}`;
                const esSeleccionado = valor === celdaStr;
                const esHoy = hoyStr() === celdaStr;

                return (
                  <Pressable
                    key={`${celda.anio}-${celda.mes}-${celda.dia}-${i}`}
                    onPress={() => seleccionarDia(celda.dia, celda.mes, celda.anio)}
                    style={[
                      styles.celdaDia,
                      esSeleccionado && styles.celdaDiaSeleccionado,
                      esHoy && !esSeleccionado && styles.celdaDiaHoy,
                    ]}
                  >
                    <Text
                      style={[
                        styles.textoDia,
                        !celda.esMesActual && styles.textoDiaFueraMes,
                        esSeleccionado && styles.textoDiaSeleccionado,
                        esHoy && !esSeleccionado && styles.textoDiaHoy,
                      ]}
                    >
                      {celda.dia}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            {/* Atajos rápidos en la base del calendario */}
            <View style={styles.pieAtajos}>
              <Pressable onPress={seleccionarHoy} style={styles.botonAtajo}>
                <Text style={styles.textoAtajo}>📅 Hoy</Text>
              </Pressable>
              <Pressable onPress={seleccionarManana} style={styles.botonAtajo}>
                <Text style={styles.textoAtajo}>🌅 Mañana</Text>
              </Pressable>
              {valor ? (
                <Pressable
                  onPress={() => {
                    onChange('');
                    setModalVisible(false);
                  }}
                  style={styles.botonAtajoLimpiar}
                >
                  <Text style={styles.textoAtajoLimpiar}>Limpiar</Text>
                </Pressable>
              ) : null}
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
    maxWidth: 360,
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
    marginBottom: 14,
    paddingBottom: 10,
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
  navegadorMes: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
    paddingHorizontal: 6,
  },
  botonNavMes: {
    padding: 6,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
  },
  textoMesAnio: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1F2937',
  },
  filaDiasSemana: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 8,
  },
  celdaCabeceraSemana: {
    width: 38,
    textAlign: 'center',
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
  },
  celdaFinSemana: {
    color: '#9CA3AF',
  },
  grillaDias: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-around',
  },
  celdaDia: {
    width: 38,
    height: 38,
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 3,
    borderRadius: 19,
  },
  celdaDiaSeleccionado: {
    backgroundColor: Palette.forestGreen,
  },
  celdaDiaHoy: {
    borderWidth: 1.5,
    borderColor: Palette.forestGreen,
  },
  textoDia: {
    fontSize: 13,
    fontWeight: '500',
    color: '#1F2937',
  },
  textoDiaFueraMes: {
    color: '#D1D5DB',
  },
  textoDiaSeleccionado: {
    color: Palette.white,
    fontWeight: '700',
  },
  textoDiaHoy: {
    color: Palette.forestGreen,
    fontWeight: '700',
  },
  pieAtajos: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  botonAtajo: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: '#ECFDF5',
    borderRadius: 8,
  },
  textoAtajo: {
    fontSize: 12,
    fontWeight: '600',
    color: Palette.forestGreen,
  },
  botonAtajoLimpiar: {
    paddingVertical: 6,
    paddingHorizontal: 10,
  },
  textoAtajoLimpiar: {
    fontSize: 12,
    fontWeight: '500',
    color: '#6B7280',
  },
});
