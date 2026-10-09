import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { Controller, Control, FieldErrors } from 'react-hook-form';
import { Boton, Input, Select, SelectOpcion } from '@/shared/components/ui';
import { TipoActividadTipo } from '../types/actividad.types';
import { ActividadFormValores } from '../schemas/actividad.schema';
import { styles } from './actividad-formulario.styles';

export const TIPOS_LABOR: { id: TipoActividadTipo; etiqueta: string }[] = [
  { id: 'FERTILIZACION', etiqueta: 'Fertilización' },
  { id: 'CONTROL_PLAGAS', etiqueta: 'Control Plagas' },
  { id: 'RIEGO', etiqueta: 'Riego' },
  { id: 'PODA', etiqueta: 'Poda' },
  { id: 'COSECHA', etiqueta: 'Cosecha' },
  { id: 'SIEMBRA', etiqueta: 'Siembra' },
  { id: 'DESHIERBE', etiqueta: 'Deshierbe' },
  { id: 'MANTENIMIENTO', etiqueta: 'Mantenimiento' },
];

export interface ActividadFormularioLaborProps {
  control: Control<ActividadFormValores>;
  errors: FieldErrors<ActividadFormValores>;
  tipoActual: TipoActividadTipo;
  parcelaIdActual: string;
  responsableIdActual?: string;
  opcionesParcelas: SelectOpcion[];
  opcionesResponsables: SelectOpcion[];
  onCambiarTipo: (tipo: TipoActividadTipo) => void;
}

/**
 * @description Sección de formulario para la información agronómica de la labor a programar.
 */
export const ActividadFormularioLabor: React.FC<ActividadFormularioLaborProps> = ({
  control,
  errors,
  tipoActual,
  parcelaIdActual,
  responsableIdActual,
  opcionesParcelas,
  opcionesResponsables,
  onCambiarTipo,
}) => {
  return (
    <View style={styles.tarjeta}>
      <Text style={styles.tituloSeccion}>Información de la Labor Agrícola</Text>

      <Controller
        control={control}
        name="titulo"
        render={({ field: { onChange, value } }) => (
          <Input
            label="Título o Labor *"
            placeholder="Ej. Fertilización foliar con Sulfato de Potasio"
            value={value}
            onChangeText={onChange}
            error={errors.titulo?.message}
          />
        )}
      />

      <View style={styles.bloqueCampo}>
        <Text style={styles.etiquetaCampo}>Tipo de labor *</Text>
        <View style={styles.filaChips}>
          {TIPOS_LABOR.map((tl) => {
            const activo = tipoActual === tl.id;
            return (
              <Pressable
                key={tl.id}
                onPress={() => onCambiarTipo(tl.id)}
                style={[styles.chipTipo, activo && styles.chipTipoActivo]}
              >
                <Text style={[styles.textoChipTipo, activo && styles.textoChipTipoActivo]}>
                  {tl.etiqueta}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      <Controller
        control={control}
        name="parcelaId"
        render={({ field: { onChange } }) => (
          <Select
            label="Parcela Asignada *"
            placeholder="Seleccione la parcela del lote..."
            valor={parcelaIdActual}
            opciones={opcionesParcelas}
            onChange={onChange}
            error={errors.parcelaId?.message}
          />
        )}
      />

      <View style={styles.filaDosColumnas}>
        <View style={styles.columna}>
          <Controller
            control={control}
            name="fechaInicio"
            render={({ field: { onChange, value } }) => (
              <Input
                label="Fecha de Inicio *"
                placeholder="AAAA-MM-DD"
                value={value}
                onChangeText={onChange}
                error={errors.fechaInicio?.message}
              />
            )}
          />
        </View>
        <View style={styles.columna}>
          <Controller
            control={control}
            name="fechaFin"
            render={({ field: { onChange, value } }) => (
              <Input
                label="Fecha Fin (Opcional)"
                placeholder="AAAA-MM-DD"
                value={value || ''}
                onChangeText={onChange}
                error={errors.fechaFin?.message}
              />
            )}
          />
        </View>
      </View>

      <Controller
        control={control}
        name="usuarioResponsableId"
        render={({ field: { onChange } }) => (
          <Select
            label="Responsable / Supervisor"
            placeholder="Seleccionar supervisor de campo..."
            valor={responsableIdActual || ''}
            opciones={opcionesResponsables}
            onChange={onChange}
            error={errors.usuarioResponsableId?.message}
          />
        )}
      />
    </View>
  );
};
