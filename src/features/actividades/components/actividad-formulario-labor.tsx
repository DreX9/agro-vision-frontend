import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { Controller, Control, FieldErrors } from 'react-hook-form';
import { Lock } from 'lucide-react-native';
import { Boton, Input, Select, SelectOpcion, SelectorFecha, SelectorHora } from '@/shared/components/ui';
import { Palette } from '@/constants/theme';
import { SectorParcelaItem } from '@/features/parcelas/types/sector-parcela.types';
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
  sectorIdActual?: string;
  opcionesSectores: SelectOpcion[];
  cargandoSectores?: boolean;
  sectoresDisponibles?: SectorParcelaItem[];
  onCambiarSector?: (sectorId: string) => void;
  responsableIdActual?: string;
  opcionesParcelas: SelectOpcion[];
  opcionesResponsables: SelectOpcion[];
  onCambiarTipo: (tipo: TipoActividadTipo) => void;
  horaInicioActual?: string;
  horaFinActual?: string;
  onCambiarHorario?: (inicio: string, fin: string) => void;
  esSupervisor?: boolean;
  esAgronomo?: boolean;
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
  sectorIdActual,
  opcionesSectores,
  cargandoSectores = false,
  sectoresDisponibles = [],
  onCambiarSector,
  responsableIdActual,
  opcionesParcelas,
  opcionesResponsables,
  onCambiarTipo,
  horaInicioActual = '07:00',
  horaFinActual = '12:00',
  onCambiarHorario,
  esSupervisor = false,
  esAgronomo = false,
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
            label={esSupervisor ? 'Título o Labor 🔒 (Asignado por Agronomía)' : 'Título o Labor *'}
            placeholder="Ej. Fertilización foliar con Sulfato de Potasio"
            value={value}
            onChangeText={onChange}
            editable={!esSupervisor}
            iconoIzquierda={esSupervisor ? <Lock size={15} color="#9CA3AF" /> : undefined}
            error={errors.titulo?.message}
          />
        )}
      />

      <View style={styles.bloqueCampo}>
        <View style={styles.filaLabelConCandado}>
          <Text style={styles.etiquetaCampo}>Tipo de labor y categoría *</Text>
          {esSupervisor && (
            <View style={styles.chipSoloLectura}>
              <Lock size={11} color="#6B7280" />
              <Text style={styles.textoChipSoloLectura}>Fijado por Agronomía</Text>
            </View>
          )}
        </View>
        
        {/* Selector de categoría de labor */}
        <View style={styles.selectorCategoria}>
          <Pressable
            disabled={esSupervisor}
            onPress={() => {
              setCategoriaTab('CAMPO');
              if (!esLaborCampo(tipoActual)) onCambiarTipo('RIEGO');
            }}
            style={[
              styles.botonCategoria,
              categoriaTab === 'CAMPO' && styles.botonCategoriaActivo,
              esSupervisor && styles.botonDeshabilitado,
            ]}
          >
            <Text
              style={[styles.textoCategoria, categoriaTab === 'CAMPO' && styles.textoCategoriaActivo]}
            >
              🌿 Labores de Campo (Operativas)
            </Text>
          </Pressable>

          <Pressable
            disabled={esSupervisor}
            onPress={() => {
              setCategoriaTab('ADMIN');
              if (esLaborCampo(tipoActual)) onCambiarTipo('MONITOREO_FITOSANITARIO');
            }}
            style={[
              styles.botonCategoria,
              categoriaTab === 'ADMIN' && styles.botonCategoriaActivo,
              esSupervisor && styles.botonDeshabilitado,
            ]}
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
                disabled={esSupervisor}
                onPress={() => onCambiarTipo(tl.id)}
                style={[
                  styles.chipTipo,
                  activo && styles.chipTipoActivo,
                  esSupervisor && !activo && styles.chipDeshabilitadoOpaco,
                ]}
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
            {esSupervisor
              ? '🔒 Parámetro técnico: Tipo de labor programada desde planificación agrícola.'
              : esAgronomo
              ? '💡 Labor técnica: La cuadrilla operativa de campo será conformada directamente por el Supervisor.'
              : categoriaTab === 'CAMPO'
              ? '💡 Labor de campo: La cuadrilla está conformada exclusivamente por Operarios de campo.'
              : '💡 Labor técnica/administrativa: La cuadrilla recomendará a especialistas técnicos.'}
          </Text>
        </View>
      </View>

      <Controller
        control={control}
        name="parcelaId"
        render={({ field: { onChange } }) => (
          <Select
            label={esSupervisor ? 'Parcela Asignada 🔒 (Solo lectura)' : 'Parcela Asignada *'}
            placeholder="Seleccione la parcela del lote..."
            valor={parcelaIdActual}
            opciones={opcionesParcelas}
            deshabilitado={esSupervisor}
            onChange={onChange}
            error={errors.parcelaId?.message}
          />
        )}
      />

      {/* Campo: Área de Cultivo / Sector según la parcela seleccionada */}
      <View style={styles.bloqueSectorCultivo}>
        <Controller
          control={control}
          name="sectorId"
          render={({ field: { onChange, value } }) => (
            <Select
              label={esSupervisor ? 'Área de Cultivo / Sector 🔒 (Solo lectura)' : 'Área de Cultivo / Sector'}
              placeholder={
                cargandoSectores
                  ? 'Cargando áreas de cultivo...'
                  : 'Seleccione un sector o toda la parcela...'
              }
              valor={value || ''}
              opciones={opcionesSectores}
              deshabilitado={esSupervisor}
              onChange={(val) => {
                onChange(val);
                onCambiarSector?.(val);
              }}
              error={errors.sectorId?.message}
            />
          )}
        />

        {/* Resumen agronómico del sector o aviso si la parcela no tiene sectores */}
        {sectorIdActual && sectoresDisponibles.find((s) => s.id === sectorIdActual) ? (
          (() => {
            const sec = sectoresDisponibles.find((s) => s.id === sectorIdActual)!;
            return (
              <View style={styles.tarjetaResumenSector}>
                <View style={styles.indicadorSectorColorWrapper}>
                  <View
                    style={[
                      styles.circuloColorSector,
                      { backgroundColor: sec.colorHex || Palette.forestGreen },
                    ]}
                  />
                  <Text style={styles.textoNombreSectorResumen}>
                    {sec.nombre} ({sec.codigo})
                  </Text>
                </View>
                <View style={styles.etiquetasDetalleSector}>
                  <View style={styles.chipSectorDetalle}>
                    <Text style={styles.textoChipSectorDetalle}>
                      🌱 {sec.cultivoNombre || 'Cultivo'}
                      {sec.variedad ? ` • ${sec.variedad}` : ''}
                    </Text>
                  </View>
                  <View style={styles.chipSectorDetalle}>
                    <Text style={styles.textoChipSectorDetalle}>
                      📐 {Number(sec.areaHectareas).toFixed(2)} ha asignadas
                    </Text>
                  </View>
                </View>
              </View>
            );
          })()
        ) : sectoresDisponibles.length === 0 && !cargandoSectores && Boolean(parcelaIdActual) ? (
          <View style={styles.avisoSinSectores}>
            <Text style={styles.textoAvisoSinSectores}>
              ℹ️ Esta parcela aún no tiene subdivisiones de cultivo. La labor se programará para toda la parcela.
            </Text>
          </View>
        ) : null}
      </View>

      {/* Selector interactivo de Fechas (Calendario) */}
      <View style={styles.filaDosColumnas}>
        <View style={styles.columna}>
          <Controller
            control={control}
            name="fechaInicio"
            render={({ field: { onChange, value } }) => (
              <SelectorFecha
                label={esSupervisor ? 'Fecha de Inicio 🔒' : 'Fecha de Inicio *'}
                placeholder="Seleccionar en calendario..."
                valor={value}
                deshabilitado={esSupervisor}
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
                label={esSupervisor ? 'Fecha Fin 🔒' : 'Fecha Fin (Opcional)'}
                placeholder="Seleccionar en calendario..."
                valor={value || ''}
                deshabilitado={esSupervisor}
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
                  label={esSupervisor ? 'Hora de Inicio 🔒' : 'Hora de Inicio *'}
                  valor={value || '07:00'}
                  deshabilitado={esSupervisor}
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
                  label={esSupervisor ? 'Hora de Fin 🔒' : 'Hora de Fin *'}
                  valor={value || '12:00'}
                  deshabilitado={esSupervisor}
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
            label={
              esSupervisor
                ? 'Supervisor de Campo Designado 🔒 (Solo lectura)'
                : esAgronomo
                ? 'Supervisor de Campo Responsable *'
                : 'Responsable / Supervisor'
            }
            placeholder="Seleccionar supervisor de campo..."
            valor={responsableIdActual || ''}
            opciones={opcionesResponsables}
            deshabilitado={esSupervisor}
            onChange={onChange}
            error={errors.usuarioResponsableId?.message}
          />
        )}
      />
    </View>
  );
};
