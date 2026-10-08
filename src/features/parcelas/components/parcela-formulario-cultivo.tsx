import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useRouter, type Href } from 'expo-router';
import { Plus } from 'lucide-react-native';
import { Palette } from '@/constants/theme';
import { CultivoItem } from '@/features/cultivos/types/cultivo.types';

export interface ParcelaFormularioCultivoProps {
  cultivos: CultivoItem[];
  cultivoSeleccionadoId: string;
  variedadSeleccionada?: string;
  errorCultivo?: string;
  onSeleccionarCultivo: (id: string) => void;
  onSeleccionarVariedad: (variedad: string) => void;
}

/**
 * @description Selector visual de cultivo con chips de variedades y acceso rápido para registrar nuevos cultivos.
 */
export const ParcelaFormularioCultivo: React.FC<ParcelaFormularioCultivoProps> = ({
  cultivos,
  cultivoSeleccionadoId,
  variedadSeleccionada,
  errorCultivo,
  onSeleccionarCultivo,
  onSeleccionarVariedad,
}) => {
  const router = useRouter();
  const cultivoActual = cultivos.find((c) => c.id === cultivoSeleccionadoId);

  return (
    <View style={styles.contenedor}>
      <View style={styles.cabecera}>
        <Text style={styles.etiqueta}>Cultivo asignado *</Text>
        <Pressable
          onPress={() => router.push('/cultivos/nuevo' as Href)}
          style={styles.botonNuevoCultivo}
        >
          <Plus size={14} color={Palette.forestGreen} />
          <Text style={styles.textoNuevoCultivo}>+ Registrar nuevo cultivo</Text>
        </Pressable>
      </View>

      {cultivos.length === 0 ? (
        <View style={styles.cajaSinCultivos}>
          <Text style={styles.textoSinCultivos}>
            No hay cultivos activos en el catálogo. Registra al menos un cultivo para continuar.
          </Text>
        </View>
      ) : (
        <View style={styles.grillaCultivos}>
          {cultivos.map((cultivo) => {
            const seleccionado = cultivo.id === cultivoSeleccionadoId;
            return (
              <Pressable
                key={cultivo.id}
                onPress={() => onSeleccionarCultivo(cultivo.id)}
                style={[styles.chipCultivo, seleccionado && styles.chipCultivoActivo]}
              >
                <View
                  style={[
                    styles.puntoColor,
                    { backgroundColor: cultivo.colorHex || Palette.forestGreen },
                  ]}
                />
                <Text
                  style={[
                    styles.textoChipCultivo,
                    seleccionado && styles.textoChipCultivoActivo,
                  ]}
                >
                  {cultivo.nombre}
                </Text>
              </Pressable>
            );
          })}
        </View>
      )}

      {errorCultivo && <Text style={styles.textoError}>{errorCultivo}</Text>}

      {cultivoActual && cultivoActual.variedadesDefault.length > 0 && (
        <View style={styles.seccionVariedades}>
          <Text style={styles.subEtiqueta}>Variedad recomendada:</Text>
          <View style={styles.filaChips}>
            {cultivoActual.variedadesDefault.map((variedad) => {
              const activa = variedad === variedadSeleccionada;
              return (
                <Pressable
                  key={variedad}
                  onPress={() => onSeleccionarVariedad(variedad)}
                  style={[styles.chipVariedad, activa && styles.chipVariedadActiva]}
                >
                  <Text
                    style={[
                      styles.textoVariedad,
                      activa && styles.textoVariedadActiva,
                    ]}
                  >
                    {variedad}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  contenedor: { gap: 8 },
  cabecera: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  etiqueta: { fontSize: 13, fontWeight: '700', color: '#374151' },
  botonNuevoCultivo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 2,
    paddingHorizontal: 6,
  },
  textoNuevoCultivo: {
    fontSize: 12,
    fontWeight: '700',
    color: Palette.forestGreen,
  },
  cajaSinCultivos: {
    padding: 12,
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  textoSinCultivos: {
    fontSize: 13,
    color: '#6B7280',
  },
  grillaCultivos: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chipCultivo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    backgroundColor: '#FFFFFF',
  },
  chipCultivoActivo: {
    borderColor: Palette.forestGreen,
    backgroundColor: '#F0F7ED',
  },
  puntoColor: { width: 10, height: 10, borderRadius: 5 },
  textoChipCultivo: { fontSize: 13, color: '#374151', fontWeight: '500' },
  textoChipCultivoActivo: { color: Palette.forestGreen, fontWeight: '700' },
  seccionVariedades: { gap: 6, marginTop: 4 },
  subEtiqueta: { fontSize: 12, fontWeight: '600', color: '#6B7280' },
  filaChips: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  chipVariedad: {
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 6,
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  chipVariedadActiva: {
    backgroundColor: Palette.forestGreen,
    borderColor: Palette.forestGreen,
  },
  textoVariedad: { fontSize: 12, color: '#4B5563', fontWeight: '500' },
  textoVariedadActiva: { color: '#FFFFFF', fontWeight: '700' },
  textoError: { fontSize: 12, color: '#DC2626' },
});
