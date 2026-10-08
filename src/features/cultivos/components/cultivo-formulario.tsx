import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Plus, X, Check } from 'lucide-react-native';
import { Palette } from '@/constants/theme';
import { Boton, Input } from '@/shared/components/ui';
import { cultivoSchema, type CultivoFormValores } from '../schemas/cultivo.schema';

const COLORES_PREDETERMINADOS = [
  '#2E7D32', // Verde Agrícola
  '#1B5E20', // Verde Bosque
  '#558B2F', // Verde Oliva
  '#00796B', // Esmeralda Azulado
  '#F57F17', // Cítrico Dorado
  '#D97706', // Ámbar Frutal
  '#880E4F', // Baya / Morado
  '#5D4037', // Café Tierra
];

export interface CultivoFormularioProps {
  valoresIniciales?: Partial<CultivoFormValores>;
  guardando?: boolean;
  modo?: 'crear' | 'editar';
  onSubmit: (valores: CultivoFormValores) => void;
  onCancelar: () => void;
}

/**
 * @description Formulario para registrar o editar un cultivo con variedades dinámicas y paleta cromática.
 */
export const CultivoFormulario: React.FC<CultivoFormularioProps> = ({
  valoresIniciales,
  guardando = false,
  modo = 'crear',
  onSubmit,
  onCancelar,
}) => {
  const [nuevaVariedad, setNuevaVariedad] = useState('');

  const {
    control,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<CultivoFormValores>({
    resolver: zodResolver(cultivoSchema),
    defaultValues: {
      nombre: valoresIniciales?.nombre || '',
      nombreCientifico: valoresIniciales?.nombreCientifico || '',
      variedadesDefault: valoresIniciales?.variedadesDefault || [],
      colorHex: valoresIniciales?.colorHex || '#2E7D32',
      activo: valoresIniciales?.activo ?? true,
    },
  });

  const variedades = watch('variedadesDefault') || [];
  const colorSeleccionado = watch('colorHex');

  const agregarVariedad = () => {
    const texto = nuevaVariedad.trim();
    if (texto && !variedades.includes(texto)) {
      setValue('variedadesDefault', [...variedades, texto]);
      setNuevaVariedad('');
    }
  };

  const quitarVariedad = (variedad: string) => {
    setValue(
      'variedadesDefault',
      variedades.filter((v) => v !== variedad),
    );
  };

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.contenedor}>
      <View style={styles.tarjeta}>
        <Text style={styles.tituloSeccion}>Identificación del Cultivo</Text>

        <Controller
          control={control}
          name="nombre"
          render={({ field: { onChange, value } }) => (
            <Input
              label="Nombre Común del Cultivo *"
              placeholder="Ej. Arándano, Palto, Espárrago, Vid"
              value={value}
              onChangeText={onChange}
              error={errors.nombre?.message}
            />
          )}
        />

        <Controller
          control={control}
          name="nombreCientifico"
          render={({ field: { onChange, value } }) => (
            <Input
              label="Nombre Científico (Opcional)"
              placeholder="Ej. Vaccinium corymbosum, Persea americana"
              value={value || ''}
              onChangeText={onChange}
              error={errors.nombreCientifico?.message}
            />
          )}
        />
      </View>

      <View style={styles.tarjeta}>
        <Text style={styles.tituloSeccion}>Variedades Comerciales</Text>
        <Text style={styles.subtituloAyuda}>
          Agregue las variedades disponibles para este cultivo. Se sugerirán al registrar parcelas.
        </Text>

        <View style={styles.filaAgregarVariedad}>
          <View style={styles.inputFlex}>
            <Input
              placeholder="Escriba variedad (ej. Biloxi, Hass, etc.)"
              value={nuevaVariedad}
              onChangeText={setNuevaVariedad}
              onSubmitEditing={agregarVariedad}
            />
          </View>
          <Boton
            titulo="Agregar"
            iconoIzquierda={<Plus size={16} color="#FFFFFF" />}
            variante="primario"
            onPress={agregarVariedad}
            disabled={!nuevaVariedad.trim()}
          />
        </View>

        <View style={styles.contenedorChips}>
          {variedades.length === 0 ? (
            <Text style={styles.textoSinVariedades}>
              No se han agregado variedades aún. Escriba una y presione Agregar.
            </Text>
          ) : (
            variedades.map((v) => (
              <View key={v} style={styles.chipVariedad}>
                <Text style={styles.textoChip}>{v}</Text>
                <Pressable onPress={() => quitarVariedad(v)} hitSlop={6}>
                  <X size={14} color="#6B7280" />
                </Pressable>
              </View>
            ))
          )}
        </View>
      </View>

      <View style={styles.tarjeta}>
        <Text style={styles.tituloSeccion}>Identificador Cromático</Text>
        <Text style={styles.subtituloAyuda}>
          Color con el que se representará este cultivo en el mapa y en las actividades.
        </Text>

        <View style={styles.paletaColores}>
          {COLORES_PREDETERMINADOS.map((color) => {
            const activo = color.toLowerCase() === (colorSeleccionado || '').toLowerCase();
            return (
              <Pressable
                key={color}
                onPress={() => setValue('colorHex', color)}
                style={[styles.muestraColor, { backgroundColor: color }]}
              >
                {activo && <Check size={16} color="#FFFFFF" />}
              </Pressable>
            );
          })}
        </View>
      </View>

      <View style={styles.acciones}>
        <Boton
          titulo="Cancelar"
          variante="secundario"
          onPress={onCancelar}
          disabled={guardando}
        />
        <Boton
          titulo={modo === 'crear' ? 'Registrar Cultivo' : 'Guardar Cambios'}
          variante="primario"
          onPress={handleSubmit(onSubmit)}
          cargando={guardando}
        />
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  scroll: { flex: 1 },
  contenedor: { padding: 16, gap: 16, maxWidth: 800, alignSelf: 'center', width: '100%' },
  tarjeta: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#D0DEC8',
    padding: 16,
    gap: 12,
  },
  tituloSeccion: { fontSize: 15, fontWeight: '800', color: Palette.forestGreen },
  subtituloAyuda: { fontSize: 12, color: '#6B7280' },
  filaAgregarVariedad: { flexDirection: 'row', gap: 10, alignItems: 'flex-end' },
  inputFlex: { flex: 1 },
  contenedorChips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 4 },
  chipVariedad: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#EDF4E8',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#D0DEC8',
  },
  textoChip: { fontSize: 13, color: '#1F2937', fontWeight: '600' },
  textoSinVariedades: { fontSize: 13, color: '#9CA3AF', fontStyle: 'italic' },
  paletaColores: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 4 },
  muestraColor: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  acciones: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
    paddingVertical: 12,
  },
});
