import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Plus, Trash2, Wrench, Package } from 'lucide-react-native';
import { Palette } from '@/constants/theme';
import { Input } from '@/shared/components/ui';
import { InsumoItem } from '../types/insumo.types';

export interface RecursoAsignadoInput {
  insumoId: string;
  cantidadEstimada: number;
  unidadMedida: string;
  dosis?: string;
  cantidadReal?: number;
  notas?: string;
}

export interface ActividadFormularioRecursosProps {
  insumosDisponibles: InsumoItem[];
  recursosSeleccionados: RecursoAsignadoInput[];
  onAgregarRecurso: (insumo: InsumoItem) => void;
  onEliminarRecurso: (insumoId: string) => void;
  onCambiarCantidad: (insumoId: string, cantidad: number) => void;
  onCambiarDosis?: (insumoId: string, dosis: string) => void;
}

/**
 * @description Selector y planificador de insumos químicos, fertilizantes y maquinaria/equipos para la actividad.
 */
export const ActividadFormularioRecursos: React.FC<ActividadFormularioRecursosProps> = ({
  insumosDisponibles,
  recursosSeleccionados,
  onAgregarRecurso,
  onEliminarRecurso,
  onCambiarCantidad,
  onCambiarDosis,
}) => {
  return (
    <View style={styles.contenedor}>
      <View style={styles.cabecera}>
        <View style={styles.filaTitulo}>
          <Wrench size={16} color={Palette.forestGreen} />
          <Text style={styles.titulo}>Insumos, Fertilizantes y Equipos Requeridos</Text>
        </View>
      </View>
      <Text style={styles.subtitulo}>
        Seleccione los materiales del catálogo y defina las dosis técnicas y cantidades totales necesarias.
      </Text>

      {/* Catálogo de chips disponibles para agregar */}
      <View style={styles.catalogoInsumos}>
        {insumosDisponibles.map((insumo) => {
          const yaAgregado = recursosSeleccionados.some((r) => r.insumoId === insumo.id);
          return (
            <Pressable
              key={insumo.id}
              disabled={yaAgregado}
              onPress={() => onAgregarRecurso(insumo)}
              style={[
                styles.chipInsumo,
                yaAgregado && styles.chipInsumoDeshabilitado,
              ]}
            >
              <Package size={13} color={yaAgregado ? '#9CA3AF' : Palette.forestGreen} />
              <Text
                style={[
                  styles.textoChipInsumo,
                  yaAgregado && styles.textoChipInsumoDeshabilitado,
                ]}
              >
                {insumo.nombre} ({insumo.unidadMedida})
              </Text>
              {!yaAgregado && <Plus size={13} color={Palette.forestGreen} />}
            </Pressable>
          );
        })}
      </View>

      {/* Lista de recursos ya agregados con selector de cantidad y dosis */}
      {recursosSeleccionados.length > 0 && (
        <View style={styles.listaAgregados}>
          <Text style={styles.etiquetaAgregados}>Insumos planificados:</Text>
          {recursosSeleccionados.map((rec) => {
            const insumoInfo = insumosDisponibles.find((i) => i.id === rec.insumoId);
            return (
              <View key={rec.insumoId} style={styles.tarjetaRecurso}>
                <View style={styles.filaRecursoCabecera}>
                  <View style={styles.infoRecurso}>
                    <Text style={styles.nombreRecurso}>
                      {insumoInfo?.nombre || 'Insumo agrícola'}
                    </Text>
                    <Text style={styles.categoriaRecurso}>
                      {insumoInfo?.categoria} • Unidad: {rec.unidadMedida}
                    </Text>
                  </View>

                  <Pressable
                    onPress={() => onEliminarRecurso(rec.insumoId)}
                    style={styles.botonEliminar}
                  >
                    <Trash2 size={16} color="#DC2626" />
                  </Pressable>
                </View>

                <View style={styles.filaControles}>
                  <View style={styles.columnaControlDosis}>
                    <Input
                      label="Dosis Técnica (ej. 1.5 L/ha)"
                      placeholder="Ej. 2 L/ha o 200 ml/cil"
                      value={rec.dosis || ''}
                      onChangeText={(val) => onCambiarDosis?.(rec.insumoId, val)}
                    />
                  </View>

                  <View style={styles.columnaControlCantidad}>
                    <Input
                      label={`Total (${rec.unidadMedida}) *`}
                      keyboardType="numeric"
                      value={String(rec.cantidadEstimada || '')}
                      onChangeText={(val) => onCambiarCantidad(rec.insumoId, Number(val) || 0)}
                    />
                  </View>
                </View>
              </View>
            );
          })}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  contenedor: { gap: 10 },
  cabecera: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  filaTitulo: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  titulo: { fontSize: 14, fontWeight: '700', color: Palette.forestGreen },
  subtitulo: { fontSize: 12, color: '#6B7280' },
  catalogoInsumos: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chipInsumo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#D0DEC8',
    backgroundColor: '#FFFFFF',
  },
  chipInsumoDeshabilitado: {
    backgroundColor: '#F3F4F6',
    borderColor: '#E5E7EB',
  },
  textoChipInsumo: { fontSize: 12, fontWeight: '600', color: '#374151' },
  textoChipInsumoDeshabilitado: { color: '#9CA3AF' },
  listaAgregados: {
    marginTop: 6,
    padding: 12,
    backgroundColor: '#F9FAF8',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2EBDC',
    gap: 10,
  },
  etiquetaAgregados: { fontSize: 12, fontWeight: '700', color: '#374151' },
  tarjetaRecurso: {
    backgroundColor: '#FFFFFF',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    gap: 10,
  },
  filaRecursoCabecera: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  infoRecurso: { flex: 1 },
  nombreRecurso: { fontSize: 13, fontWeight: '700', color: '#111827' },
  categoriaRecurso: { fontSize: 11, color: '#6B7280' },
  botonEliminar: {
    padding: 6,
    borderRadius: 6,
    backgroundColor: '#FEE2E2',
  },
  filaControles: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'flex-start',
  },
  columnaControlDosis: {
    flex: 1.4,
  },
  columnaControlCantidad: {
    flex: 1,
  },
});
