import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { Controller, Control, FieldErrors } from 'react-hook-form';
import { Boton, Input, Select, SelectOpcion, SelectorFecha, SelectorHora } from '@/shared/components/ui';
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
  horaInicioActual?: string;
  horaFinActual?: string;
  onCambiarHorario?: (inicio: string, fin: string) => void;
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
  horaInicioActual = '07:00',
  horaFinActual = '12:00',
  onCambiarHorario,
}) => {
  const [categoriaTab, setCategoriaTab] = React.useState<'CAMPO' | 'ADMIN'>(() => {
    return esLaborCampo(tipoActual) ? 'CAMPO' : 'ADMIN';
  });

  const listaActual = categoriaTab === 'CAMPO' ? LABORES_CAMPO_ITEMS : LABORES_ADMINISTRATIVAS_ITEMS;

  const duracionCalculada = React.useMemo(() => {
    const [h1, m1] = (horaInicioActual || '07:00').split(':').map(Number);
    const [h2, m2] = (horaFinActual || '12:00').split(':').map(Number);
    const diff = ((h2 || 0) * 60 + (m2 || 0) - ((h1 || 0) * 60 + (m1 || 0))) / 60;
    return diff > 0 ? Number(diff.toFixed(1)) : 0;
  }, [horaInicioActual, horaFinActual]);

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

      {/* Selector interactivo de Fechas (Calendario) */}
      <View style={styles.filaDosColumnas}>
        <View style={styles.columna}>
          <Controller
            control={control}
            name="fechaInicio"
            render={({ field: { onChange, value } }) => (
              <SelectorFecha
                label="Fecha de Inicio *"
                placeholder="Seleccionar en calendario..."
                valor={value}
                onChange={onChange}
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
              <SelectorFecha
                label="Fecha Fin (Opcional)"
                placeholder="Seleccionar en calendario..."
                valor={value || ''}
                onChange={onChange}
                error={errors.fechaFin?.message}
              />
            )}
          />
        </View>
      </View>

      {/* Sección: Horario de Turno Diario y Duración (Reloj) */}
      <View style={styles.tarjetaTurno}>
        <View style={styles.cabeceraTurno}>
          <Text style={styles.tituloTurno}>⏰ Horario de Jornada / Turno Diario</Text>
          <View style={styles.badgeDuracionTurno}>
            <Text style={styles.textoDuracionTurno}>
              ⏱️ {duracionCalculada}h programadas
            </Text>
          </View>
        </View>

        <View style={styles.filaDosColumnas}>
          <View style={styles.columna}>
            <Controller
              control={control}
              name="horaInicio"
              render={({ field: { onChange, value } }) => (
                <SelectorHora
                  label="Hora de Inicio *"
                  valor={value || '07:00'}
                  onChange={(h) => {
                    onChange(h);
                    if (onCambiarHorario) onCambiarHorario(h, horaFinActual || '12:00');
                  }}
                  error={errors.horaInicio?.message}
                />
              )}
            />
          </View>
          <View style={styles.columna}>
            <Controller
              control={control}
              name="horaFin"
              render={({ field: { onChange, value } }) => (
                <SelectorHora
                  label="Hora de Fin *"
                  valor={value || '12:00'}
                  onChange={(h) => {
                    onChange(h);
                    if (onCambiarHorario) onCambiarHorario(horaInicioActual || '07:00', h);
                  }}
                  error={errors.horaFin?.message}
                />
              )}
            />
          </View>
        </View>

        <Text style={styles.avisoTurno}>
          💡 La cuadrilla asumirá este horario para validar automáticamente que ningún trabajador tenga cruces de turno ni traslados imposibles entre parcelas.
        </Text>
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
