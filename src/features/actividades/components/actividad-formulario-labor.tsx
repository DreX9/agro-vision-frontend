import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { Controller, Control, FieldErrors } from 'react-hook-form';
import { Boton, Input, Select, SelectOpcion } from '@/shared/components/ui';
import { esLaborCampo, TipoActividadTipo } from '../types/actividad.types';
import { ActividadFormValores } from '../schemas/actividad.schema';
import { styles } from './actividad-formulario.styles';

export const LABORES_CAMPO_ITEMS: { id: TipoActividadTipo; etiqueta: string }[] = [
  { id: 'RIEGO', etiqueta: 'Riego' },
  { id: 'PODA', etiqueta: 'Poda' },
  { id: 'COSECHA', etiqueta: 'Cosecha' },
  { id: 'SIEMBRA', etiqueta: 'Siembra' },
  { id: 'FERTILIZACION', etiqueta: 'Fertilización' },
  { id: 'CONTROL_PLAGAS', etiqueta: 'Control Plagas' },
  { id: 'DESHIERBE', etiqueta: 'Deshierbe' },
  { id: 'MANTENIMIENTO', etiqueta: 'Mantenimiento' },
];

export const LABORES_ADMINISTRATIVAS_ITEMS: { id: TipoActividadTipo; etiqueta: string }[] = [
  { id: 'MONITOREO_FITOSANITARIO', etiqueta: 'Monitoreo Fitosanitario' },
  { id: 'AUDITORIA_CALIDAD', etiqueta: 'Auditoría de Calidad' },
  { id: 'SUPERVISION_TECNICA', etiqueta: 'Supervisión Técnica' },
  { id: 'GESTION_ADMINISTRATIVA', etiqueta: 'Gestión Administrativa' },
  { id: 'OTRO', etiqueta: 'Otro' },
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
 * @description Sección de formulario para la información agronómica de la labor a programar,
 * con diferenciación entre labores operativas de campo y labores administrativas/técnicas.
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
  const [categoriaTab, setCategoriaTab] = React.useState<'CAMPO' | 'ADMIN'>(() => {
    return esLaborCampo(tipoActual) ? 'CAMPO' : 'ADMIN';
  });

  const listaActual = categoriaTab === 'CAMPO' ? LABORES_CAMPO_ITEMS : LABORES_ADMINISTRATIVAS_ITEMS;

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
        <Text style={styles.etiquetaCampo}>Tipo de labor y categoría *</Text>
        
        {/* Selector de categoría de labor */}
        <View style={styles.selectorCategoria}>
          <Pressable
            onPress={() => {
              setCategoriaTab('CAMPO');
              if (!esLaborCampo(tipoActual)) onCambiarTipo('RIEGO');
            }}
            style={[styles.botonCategoria, categoriaTab === 'CAMPO' && styles.botonCategoriaActivo]}
          >
            <Text
              style={[styles.textoCategoria, categoriaTab === 'CAMPO' && styles.textoCategoriaActivo]}
            >
              🌿 Labores de Campo (Operativas)
            </Text>
          </Pressable>

          <Pressable
            onPress={() => {
              setCategoriaTab('ADMIN');
              if (esLaborCampo(tipoActual)) onCambiarTipo('MONITOREO_FITOSANITARIO');
            }}
            style={[styles.botonCategoria, categoriaTab === 'ADMIN' && styles.botonCategoriaActivo]}
          >
            <Text
              style={[styles.textoCategoria, categoriaTab === 'ADMIN' && styles.textoCategoriaActivo]}
            >
              📋 Labores Administrativas / Técnicas
            </Text>
          </Pressable>
        </View>

        {/* Chips de tipo de labor específico */}
        <View style={styles.filaChips}>
          {listaActual.map((tl) => {
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

        {/* Aviso contextual de impacto en la cuadrilla */}
        <View style={styles.avisoTipoLabor}>
          <Text style={styles.textoAvisoTipoLabor}>
            {categoriaTab === 'CAMPO'
              ? '💡 Labor de campo: La cuadrilla recomendará a Operarios y situará perfiles administrativos al final.'
              : '💡 Labor técnica/administrativa: La cuadrilla recomendará a especialistas como Agrónomos y Supervisores.'}
          </Text>
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
