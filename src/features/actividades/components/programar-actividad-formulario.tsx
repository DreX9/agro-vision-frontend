import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Pressable,
  Platform,
  useWindowDimensions,
} from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Calendar,
  Clock,
  UserCheck,
  Users,
  MapPin,
  Sprout,
  Plus,
  Trash2,
  Tag,
  FileText,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Beaker,
  Truck,
  Wrench,
  ChevronDown,
  ChevronUp,
} from 'lucide-react-native';
import { Palette } from '@/constants/theme';
import { Boton, Input, Select, Badge, Card } from '@/shared/components/ui';
import { ParcelaItem } from '@/features/parcelas/types/parcela.types';
import { Usuario } from '@/features/usuarios/types/usuario.types';
import { InsumoItem } from '../types/insumo.types';
import {
  TipoActividadTipo,
  TipoTurnoLabor,
  generarCodigoActividad,
  laborRequiereInsumos,
} from '../types/actividad.types';
import {
  programarActividadSchema,
  type ProgramarActividadValores,
  type InsumoPlanificadoValores,
  type MaquinariaPlanificadaValores,
} from '../schemas/actividad.schema';
import { useSectoresPorParcelaQuery } from '@/features/parcelas/api/sectores.api';

export interface ProgramarActividadFormularioProps {
  parcelas: ParcelaItem[];
  usuarios: Usuario[];
  insumos: InsumoItem[];
  guardando?: boolean;
  onSubmit: (valores: ProgramarActividadValores) => void;
  onCancelar: () => void;
}

interface TipoLaborOpcion {
  valor: ProgramarActividadValores['tipo'];
  label: string;
  icono: string;
  descripcion: string;
}

const TIPOS_LABOR_DISPONIBLES: TipoLaborOpcion[] = [
  { valor: 'FERTILIZACION', label: 'Fertilización', icono: '🧪', descripcion: 'Nutrición foliar / edáfica' },
  { valor: 'RIEGO', label: 'Riego', icono: '💧', descripcion: 'Lámina de agua por goteo/aspersión' },
  { valor: 'PODA', label: 'Poda', icono: '✂️', descripcion: 'Formación, producción o sanitaria' },
  { valor: 'COSECHA', label: 'Cosecha', icono: '🧺', descripcion: 'Recolección y selección de fruta' },
  { valor: 'SIEMBRA', label: 'Siembra', icono: '🌱', descripcion: 'Plantación o trasplante de plantones' },
  { valor: 'CONTROL_PLAGAS', label: 'Control Plagas', icono: '🛡️', descripcion: 'Sanidad y fitoprotección' },
  { valor: 'DESHIERBE', label: 'Deshierbe', icono: '🌿', descripcion: 'Control manual o mecánico de malezas' },
  { valor: 'MANTENIMIENTO', label: 'Mantenimiento', icono: '🔧', descripcion: 'Infraestructura, cercos y riego' },
];

const TURNOS_DISPONIBLES: { valor: TipoTurnoLabor; label: string; horas: number; horario: string }[] = [
  { valor: 'MANANA', label: 'Mañana', horas: 5, horario: '07:00 - 12:00' },
  { valor: 'TARDE', label: 'Tarde', horas: 5, horario: '13:00 - 18:00' },
  { valor: 'JORNADA_COMPLETA', label: 'Jornada Completa', horas: 8, horario: '07:00 - 16:00' },
  { valor: 'PERSONALIZADO', label: 'Personalizado', horas: 4, horario: 'Horas a medida' },
];

/**
 * @description Formulario refactorizado en una sola vista con secciones colapsables (cards)
 * enfocado en la planificación técnica agronómica y asignación de actividades.
 */
export const ProgramarActividadFormulario: React.FC<ProgramarActividadFormularioProps> = ({
  parcelas,
  usuarios,
  insumos,
  guardando = false,
  onSubmit,
  onCancelar,
}) => {
  const { width } = useWindowDimensions();
  const esPantallaAmplia = width >= 800;

  // Estado de secciones colapsables
  const [colapsadoBloqueA, setColapsadoBloqueA] = useState(false);
  const [colapsadoBloqueB, setColapsadoBloqueB] = useState(false);
  const [colapsadoBloqueC, setColapsadoBloqueC] = useState(false);

  // Estado local para agregar insumos planificados
  const [insumoIdSeleccionado, setInsumoIdSeleccionado] = useState('');
  const [dosisInput, setDosisInput] = useState('2.0');
  const [listaInsumosPlanificados, setListaInsumosPlanificados] = useState<InsumoPlanificadoValores[]>([]);

  // Estado local para agregar maquinaria
  const [equipoIdSeleccionado, setEquipoIdSeleccionado] = useState('');
  const [cantidadEquipoInput, setCantidadEquipoInput] = useState('1');
  const [listaMaquinariaPlanificada, setListaMaquinariaPlanificada] = useState<MaquinariaPlanificadaValores[]>([]);

  // Supervisores filtrados
  const supervisoresDisponibles = useMemo(() => {
    return usuarios.filter(
      (u) => (u.rol === 'SUPERVISOR' || u.rol === 'ADMINISTRADOR') && u.activo !== false,
    );
  }, [usuarios]);

  const opcionesSupervisores = useMemo(() => {
    return supervisoresDisponibles.map((s) => ({
      label: `${s.nombres} ${s.apellidos} (${s.rol === 'SUPERVISOR' ? 'Supervisor' : 'Admin'})`,
      valor: s.id,
    }));
  }, [supervisoresDisponibles]);

  const fechaHoy = new Date().toISOString().split('T')[0];

  const {
    control,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<ProgramarActividadValores>({
    resolver: zodResolver(programarActividadSchema),
    defaultValues: {
      tipo: 'FERTILIZACION',
      parcelaId: parcelas[0]?.id || '',
      sectorId: '',
      codigo: '',
      titulo: '',
      notasPlanificacion: '',
      fechaInicio: fechaHoy,
      fechaFin: fechaHoy,
      turno: 'MANANA',
      horasEstimadas: 5,
      usuarioResponsableId: supervisoresDisponibles[0]?.id || '',
      jornalesRequeridos: 4,
      insumos: [],
      maquinaria: [],
    },
  });

  const tipoActual = watch('tipo');
  const parcelaIdActual = watch('parcelaId');
  const sectorIdActual = watch('sectorId');
  const fechaInicioActual = watch('fechaInicio');
  const turnoActual = watch('turno');
  const jornalesActual = watch('jornalesRequeridos');

  // Consulta de sectores por parcela seleccionada
  const { data: resumenSectores, isLoading: cargandoSectores } =
    useSectoresPorParcelaQuery(parcelaIdActual || undefined);

  const sectoresDisponibles = useMemo(() => {
    return resumenSectores?.sectores || [];
  }, [resumenSectores]);

  const opcionesSectores = useMemo(() => {
    return sectoresDisponibles.map((s) => ({
      label: `${s.codigo} - ${s.nombre} (${s.areaHectareas} ha)`,
      valor: s.id,
    }));
  }, [sectoresDisponibles]);

  const sectorSeleccionado = useMemo(() => {
    return sectoresDisponibles.find((s) => s.id === sectorIdActual);
  }, [sectoresDisponibles, sectorIdActual]);

  // Si cambia la parcela, auto-seleccionar el primer sector disponible
  useEffect(() => {
    if (sectoresDisponibles.length > 0 && !sectoresDisponibles.some((s) => s.id === sectorIdActual)) {
      setValue('sectorId', sectoresDisponibles[0].id, { shouldValidate: true });
    }
  }, [sectoresDisponibles, sectorIdActual, setValue]);

  // Generación automática del código/título de la actividad:
  // {TIPO_LABOR}-{CODIGO_SECTOR}-{FECHA_INICIO} (ej. FERT-P011-S01-20261019)
  const codigoAutogenerado = useMemo(() => {
    const codSector = sectorSeleccionado?.codigo || 'SEC';
    return generarCodigoActividad(tipoActual, codSector, fechaInicioActual);
  }, [tipoActual, sectorSeleccionado, fechaInicioActual]);

  useEffect(() => {
    setValue('titulo', codigoAutogenerado, { shouldValidate: true });
    setValue('codigo', codigoAutogenerado);
  }, [codigoAutogenerado, setValue]);

  // Sincronizar listas de insumos y maquinaria con el formulario
  useEffect(() => {
    setValue('insumos', listaInsumosPlanificados);
  }, [listaInsumosPlanificados, setValue]);

  useEffect(() => {
    setValue('maquinaria', listaMaquinariaPlanificada);
  }, [listaMaquinariaPlanificada, setValue]);

  // Insumo actualmente seleccionado en el selector
  const insumoSeleccionado = useMemo(() => {
    return insumos.find((i) => i.id === insumoIdSeleccionado);
  }, [insumos, insumoIdSeleccionado]);

  // Catálogo de insumos consumibles (fertilizantes, fitosanitarios)
  const insumosConsumibles = useMemo(() => {
    return insumos.filter(
      (i) => i.categoria === 'FERTILIZANTE' || i.categoria === 'FITOSANITARIO' || i.categoria === 'OTRO',
    );
  }, [insumos]);

  const opcionesInsumos = useMemo(() => {
    return insumosConsumibles.map((i) => ({
      label: `${i.nombre} (${i.categoria}) - Unidad: ${i.unidadMedida}`,
      valor: i.id,
    }));
  }, [insumosConsumibles]);

  // Catálogo de maquinaria y equipos
  const maquinariaDisponible = useMemo(() => {
    return insumos.filter(
      (i) => i.categoria === 'MAQUINARIA_EQUIPO' || i.categoria === 'HERRAMIENTA',
    );
  }, [insumos]);

  const opcionesMaquinaria = useMemo(() => {
    return maquinariaDisponible.map((m) => ({
      label: `${m.nombre} (${m.unidadMedida || 'Unidad'})`,
      valor: m.id,
    }));
  }, [maquinariaDisponible]);

  // Cálculo automático del total de insumo: Total = Dosis * Hectáreas
  const hectareasSector = sectorSeleccionado?.areaHectareas || 1;
  const dosisNumerica = parseFloat(dosisInput) || 0;
  const totalCalculadoInsumo = useMemo(() => {
    return Math.round(dosisNumerica * hectareasSector * 100) / 100;
  }, [dosisNumerica, hectareasSector]);

  // Periodos informativos precargados del insumo
  const diasCarenciaPrecargado = useMemo(() => {
    if (!insumoSeleccionado) return 0;
    if (insumoSeleccionado.categoria === 'FITOSANITARIO') return 7;
    return 0;
  }, [insumoSeleccionado]);

  const horasReingresoPrecargado = useMemo(() => {
    if (!insumoSeleccionado) return 0;
    if (insumoSeleccionado.categoria === 'FITOSANITARIO') return 24;
    return 4;
  }, [insumoSeleccionado]);

  // Handler para agregar insumo planificado
  const handleAgregarInsumo = () => {
    if (!insumoSeleccionado || dosisNumerica <= 0) return;

    // Evitar duplicados del mismo insumo
    if (listaInsumosPlanificados.some((i) => i.insumoId === insumoSeleccionado.id)) {
      return;
    }

    const nuevoItem: InsumoPlanificadoValores = {
      insumoId: insumoSeleccionado.id,
      nombreInsumo: insumoSeleccionado.nombre,
      categoria: insumoSeleccionado.categoria,
      dosisPorHa: dosisNumerica,
      unidadMedida: insumoSeleccionado.unidadMedida,
      totalCalculado: totalCalculadoInsumo,
      diasCarencia: diasCarenciaPrecargado,
      horasReingreso: horasReingresoPrecargado,
    };

    setListaInsumosPlanificados((prev) => [...prev, nuevoItem]);
    setInsumoIdSeleccionado('');
    setDosisInput('2.0');
  };

  const handleEliminarInsumo = (insumoId: string) => {
    setListaInsumosPlanificados((prev) => prev.filter((i) => i.insumoId !== insumoId));
  };

  // Handler para agregar maquinaria
  const handleAgregarMaquinaria = () => {
    const equipo = maquinariaDisponible.find((m) => m.id === equipoIdSeleccionado);
    const cant = parseInt(cantidadEquipoInput, 10) || 1;
    if (!equipo || cant <= 0) return;

    if (listaMaquinariaPlanificada.some((m) => m.insumoId === equipo.id)) {
      return;
    }

    const nuevoEquipo: MaquinariaPlanificadaValores = {
      insumoId: equipo.id,
      nombreEquipo: equipo.nombre,
      cantidad: cant,
      unidadMedida: equipo.unidadMedida || 'Unidad',
    };

    setListaMaquinariaPlanificada((prev) => [...prev, nuevoEquipo]);
    setEquipoIdSeleccionado('');
    setCantidadEquipoInput('1');
  };

  const handleEliminarMaquinaria = (equipoId: string) => {
    setListaMaquinariaPlanificada((prev) => prev.filter((m) => m.insumoId !== equipoId));
  };

  const requiereInsumos = laborRequiereInsumos(tipoActual);

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={styles.scrollContenido}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.contenedor}>
        {/* =========================================================================
            BLOQUE A: DATOS DE LA LABOR Y UBICACIÓN
           ========================================================================= */}
        <Card estilo={styles.tarjetaSeccion}>
          <Pressable
            style={styles.cabeceraSeccion}
            onPress={() => setColapsadoBloqueA((prev) => !prev)}
          >
            <View style={styles.filaTituloSeccion}>
              <View style={[styles.iconoSeccionContenedor, { backgroundColor: '#E8F5E9' }]}>
                <Sprout size={20} color={Palette.forestGreen} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.tituloSeccion}>Bloque A: Datos de la Labor y Ubicación</Text>
                <Text style={styles.subtituloSeccion}>
                  Seleccione el tipo de labor de campo, la parcela y el sector de cultivo
                </Text>
              </View>
            </View>
            {colapsadoBloqueA ? (
              <ChevronDown size={20} color="#6B7280" />
            ) : (
              <ChevronUp size={20} color="#6B7280" />
            )}
          </Pressable>

          {!colapsadoBloqueA && (
            <View style={styles.cuerpoSeccion}>
              {/* Chips de selección rápida de Tipo de Labor */}
              <View style={styles.grupoCampo}>
                <Text style={styles.etiquetaCampo}>Tipo de Labor Agrícola:</Text>
                <View style={styles.gridChipsLabor}>
                  {TIPOS_LABOR_DISPONIBLES.map((opc) => {
                    const estaSeleccionado = tipoActual === opc.valor;
                    return (
                      <Pressable
                        key={opc.valor}
                        onPress={() => setValue('tipo', opc.valor, { shouldValidate: true })}
                        style={[
                          styles.chipLabor,
                          estaSeleccionado && styles.chipLaborSeleccionado,
                        ]}
                      >
                        <Text style={styles.chipLaborIcono}>{opc.icono}</Text>
                        <View style={{ flex: 1 }}>
                          <Text
                            style={[
                              styles.chipLaborTexto,
                              estaSeleccionado && styles.chipLaborTextoSeleccionado,
                            ]}
                          >
                            {opc.label}
                          </Text>
                          <Text
                            style={[
                              styles.chipLaborDesc,
                              estaSeleccionado && styles.chipLaborDescSeleccionado,
                            ]}
                            numberOfLines={1}
                          >
                            {opc.descripcion}
                          </Text>
                        </View>
                      </Pressable>
                    );
                  })}
                </View>
              </View>

              {/* Parcela y Sector (Cascading Select) */}
              <View style={[styles.filaDosColumnas, !esPantallaAmplia && styles.columnaSimple]}>
                <View style={styles.columnaFlex}>
                  <Controller
                    control={control}
                    name="parcelaId"
                    render={({ field: { onChange, value } }) => (
                      <Select
                        label="Parcela de Campo"
                        placeholder="Seleccionar parcela..."
                        opciones={parcelas.map((p) => ({
                          label: `${p.codigo} - ${p.nombre}`,
                          valor: p.id,
                        }))}
                        valor={value}
                        onChange={onChange}
                        error={errors.parcelaId?.message}
                      />
                    )}
                  />
                </View>

                <View style={styles.columnaFlex}>
                  <Controller
                    control={control}
                    name="sectorId"
                    render={({ field: { onChange, value } }) => (
                      <Select
                        label="Sector / Lote de Cultivo"
                        placeholder={
                          cargandoSectores
                            ? 'Cargando sectores...'
                            : sectoresDisponibles.length === 0
                              ? 'Sin sectores configurados'
                              : 'Seleccionar sector...'
                        }
                        opciones={opcionesSectores}
                        valor={value}
                        onChange={onChange}
                        deshabilitado={sectoresDisponibles.length === 0 || cargandoSectores}
                        error={errors.sectorId?.message}
                      />
                    )}
                  />
                </View>
              </View>

              {/* Badges de solo lectura al seleccionar sector */}
              {sectorSeleccionado && (
                <View style={styles.panelSectorInformativo}>
                  <View style={styles.filaBadgesSector}>
                    <Badge
                      texto={`🌾 Cultivo: ${sectorSeleccionado.cultivoNombre || 'Sin cultivo'} ${
                        sectorSeleccionado.variedad ? `• ${sectorSeleccionado.variedad}` : ''
                      }`}
                      variante="exito"
                    />
                    <Badge
                      texto={`📐 Área: ${sectorSeleccionado.areaHectareas} ha`}
                      variante="info"
                    />
                    <Badge
                      texto={`🏷️ Sector: ${sectorSeleccionado.codigo}`}
                      variante="neutro"
                    />
                  </View>
                  <Text style={styles.textoAyudaSector}>
                    Parámetros agronómicos sincronizados automáticamente desde la delimitación del sector.
                  </Text>
                </View>
              )}

              {/* Identificador generado automáticamente */}
              <View style={styles.tarjetaIdentificadorGenerado}>
                <View style={styles.iconoTagWrapper}>
                  <Tag size={18} color={Palette.forestGreen} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.etiquetaIdentificador}>
                    Identificador de la Actividad (Autogenerado):
                  </Text>
                  <Text style={styles.codigoAutogeneradoTexto}>
                    {codigoAutogenerado}
                  </Text>
                  <Text style={styles.subtituloIdentificador}>
                    Formato estándar: {'{LABOR}-{SECTOR}-{FECHA}'} para trazabilidad de lote.
                  </Text>
                </View>
              </View>

              {/* Campo opcional: Notas de planificación */}
              <Controller
                control={control}
                name="notasPlanificacion"
                render={({ field: { onChange, value } }) => (
                  <Input
                    label="Notas de Planificación / Referencia (Opcional)"
                    placeholder="Ej. Aplicación foliar preventiva antes del inicio del riego por goteo."
                    value={value || ''}
                    onChangeText={onChange}
                    multiline
                    numberOfLines={2}
                    contenedorEstilo={{ marginTop: 6 }}
                  />
                )}
              />
            </View>
          )}
        </Card>

        {/* =========================================================================
            BLOQUE B: PROGRAMACIÓN Y RESPONSABLE
           ========================================================================= */}
        <Card estilo={styles.tarjetaSeccion}>
          <Pressable
            style={styles.cabeceraSeccion}
            onPress={() => setColapsadoBloqueB((prev) => !prev)}
          >
            <View style={styles.filaTituloSeccion}>
              <View style={[styles.iconoSeccionContenedor, { backgroundColor: '#E0F2FE' }]}>
                <Clock size={20} color="#0284C7" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.tituloSeccion}>Bloque B: Programación y Responsable</Text>
                <Text style={styles.subtituloSeccion}>
                  Defina el calendario, turno de trabajo, supervisor asignado y jornales estimados
                </Text>
              </View>
            </View>
            {colapsadoBloqueB ? (
              <ChevronDown size={20} color="#6B7280" />
            ) : (
              <ChevronUp size={20} color="#6B7280" />
            )}
          </Pressable>

          {!colapsadoBloqueB && (
            <View style={styles.cuerpoSeccion}>
              {/* Rango de Fechas */}
              <View style={[styles.filaDosColumnas, !esPantallaAmplia && styles.columnaSimple]}>
                <View style={styles.columnaFlex}>
                  <Controller
                    control={control}
                    name="fechaInicio"
                    render={({ field: { onChange, value } }) => (
                      <Input
                        label="Fecha de Inicio Programada"
                        placeholder="AAAA-MM-DD"
                        value={value}
                        onChangeText={onChange}
                        iconoIzquierda={<Calendar size={16} color="#6B7280" />}
                        error={errors.fechaInicio?.message}
                      />
                    )}
                  />
                </View>

                <View style={styles.columnaFlex}>
                  <Controller
                    control={control}
                    name="fechaFin"
                    render={({ field: { onChange, value } }) => (
                      <Input
                        label="Fecha de Fin Estimada (Opcional)"
                        placeholder="AAAA-MM-DD"
                        value={value || ''}
                        onChangeText={onChange}
                        iconoIzquierda={<Calendar size={16} color="#6B7280" />}
                      />
                    )}
                  />
                </View>
              </View>

              {/* Turno / Jornada Estimada */}
              <View style={styles.grupoCampo}>
                <Text style={styles.etiquetaCampo}>Turno / Jornada Estimada:</Text>
                <View style={styles.filaChipsTurno}>
                  {TURNOS_DISPONIBLES.map((t) => {
                    const estaSeleccionado = turnoActual === t.valor;
                    return (
                      <Pressable
                        key={t.valor}
                        onPress={() => {
                          setValue('turno', t.valor);
                          setValue('horasEstimadas', t.horas);
                        }}
                        style={[
                          styles.chipTurno,
                          estaSeleccionado && styles.chipTurnoSeleccionado,
                        ]}
                      >
                        <Text
                          style={[
                            styles.chipTurnoLabel,
                            estaSeleccionado && styles.chipTurnoLabelSeleccionado,
                          ]}
                        >
                          {t.label}
                        </Text>
                        <Text
                          style={[
                            styles.chipTurnoHorario,
                            estaSeleccionado && styles.chipTurnoHorarioSeleccionado,
                          ]}
                        >
                          {t.horario} ({t.horas}h)
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              </View>

              {/* Supervisor y Cantidad de Jornales Requeridos */}
              <View style={[styles.filaDosColumnas, !esPantallaAmplia && styles.columnaSimple]}>
                <View style={styles.columnaFlex}>
                  <Controller
                    control={control}
                    name="usuarioResponsableId"
                    render={({ field: { onChange, value } }) => (
                      <Select
                        label="Supervisor de Campo Asignado"
                        placeholder="Seleccionar supervisor..."
                        opciones={opcionesSupervisores}
                        valor={value}
                        onChange={onChange}
                        error={errors.usuarioResponsableId?.message}
                      />
                    )}
                  />
                </View>

                <View style={styles.columnaFlex}>
                  <Text style={styles.etiquetaCampo}>Cantidad de Operarios Requeridos:</Text>
                  <View style={styles.contenedorStepper}>
                    <Pressable
                      style={styles.botonStepper}
                      onPress={() => {
                        const actual = jornalesActual || 1;
                        if (actual > 1) {
                          setValue('jornalesRequeridos', actual - 1);
                        }
                      }}
                    >
                      <Text style={styles.textoBotonStepper}>-</Text>
                    </Pressable>

                    <View style={styles.valorStepperContenedor}>
                      <Users size={18} color={Palette.forestGreen} />
                      <Text style={styles.valorStepperTexto}>
                        {jornalesActual} operarios
                      </Text>
                    </View>

                    <Pressable
                      style={styles.botonStepper}
                      onPress={() => {
                        const actual = jornalesActual || 1;
                        setValue('jornalesRequeridos', actual + 1);
                      }}
                    >
                      <Text style={styles.textoBotonStepper}>+</Text>
                    </Pressable>
                  </View>
                  <Text style={styles.textoAyudaJornales}>
                    Estimación técnica. Los operarios nominales se asignan en la vista "Asignación y cuadrillas".
                  </Text>
                </View>
              </View>
            </View>
          )}
        </Card>

        {/* =========================================================================
            BLOQUE C: INSUMOS PLANIFICADOS (CONDICIONAL)
           ========================================================================= */}
        <Card style={styles.tarjetaSeccion}>
          <Pressable
            style={styles.cabeceraSeccion}
            onPress={() => setColapsadoBloqueC((prev) => !prev)}
          >
            <View style={styles.filaTituloSeccion}>
              <View style={[styles.iconoSeccionContenedor, { backgroundColor: '#FEF3C7' }]}>
                <Beaker size={20} color="#D97706" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.tituloSeccion}>Bloque C: Insumos Planificados y Maquinaria</Text>
                <Text style={styles.subtituloSeccion}>
                  {requiereInsumos
                    ? 'Cálculo de dosis por hectárea, periodos de carencia y equipamiento'
                    : 'Labor operativa: no requiere aplicación de insumos formulados'}
                </Text>
              </View>
            </View>
            {colapsadoBloqueC ? (
              <ChevronDown size={20} color="#6B7280" />
            ) : (
              <ChevronUp size={20} color="#6B7280" />
            )}
          </Pressable>

          {!colapsadoBloqueC && (
            <View style={styles.cuerpoSeccion}>
              {!requiereInsumos ? (
                <View style={styles.bannerNoRequiereInsumos}>
                  <CheckCircle2 size={18} color={Palette.forestGreen} />
                  <Text style={styles.textoNoRequiereInsumos}>
                    La labor seleccionada (<Text style={{ fontWeight: '700' }}>{tipoActual}</Text>) es de
                    carácter mecánico o agronómico manual. No requiere prescripción de insumos químicos o biológicos.
                  </Text>
                </View>
              ) : (
                <>
                  {/* Selector y agregador de insumos */}
                  <View style={styles.panelAgregarInsumo}>
                    <Text style={styles.subtituloPanelInsumo}>Prescribir Insumo del Catálogo:</Text>

                    <View style={[styles.filaDosColumnas, !esPantallaAmplia && styles.columnaSimple]}>
                      <View style={{ flex: 2 }}>
                        <Select
                          label="Insumo Fitosanitario / Fertilizante"
                          placeholder="Seleccionar insumo..."
                          opciones={opcionesInsumos}
                          valor={insumoIdSeleccionado}
                          onChange={setInsumoIdSeleccionado}
                        />
                      </View>

                      <View style={{ flex: 1 }}>
                        <Input
                          label={`Dosis (${insumoSeleccionado?.unidadMedida || 'Unidad'}/ha)`}
                          placeholder="2.0"
                          value={dosisInput}
                          onChangeText={setDosisInput}
                          keyboardType="numeric"
                        />
                      </View>
                    </View>

                    {insumoSeleccionado && (
                      <View style={styles.panelCalculoDosis}>
                        <View style={styles.filaCalculo}>
                          <Text style={styles.textoCalculoFormula}>
                            Cálculo: {dosisNumerica} {insumoSeleccionado.unidadMedida}/ha × {hectareasSector} ha =
                          </Text>
                          <Text style={styles.textoCalculoTotal}>
                            {totalCalculadoInsumo} {insumoSeleccionado.unidadMedida}
                          </Text>
                        </View>

                        <View style={styles.filaBadgesSeguridad}>
                          <Badge
                            texto={`⏳ Periodo de Carencia: ${diasCarenciaPrecargado} días`}
                            variante="alerta"
                          />
                          <Badge
                            texto={`🛡️ Reingreso Seguro: ${horasReingresoPrecargado} horas`}
                            variante="info"
                          />
                        </View>
                      </View>
                    )}

                    <View style={{ alignItems: 'flex-end', marginTop: 10 }}>
                      <Boton
                        titulo="+ Agregar Insumo"
                        variante="secundario"
                        tamano="sm"
                        disabled={!insumoSeleccionado || dosisNumerica <= 0}
                        onPress={handleAgregarInsumo}
                      />
                    </View>
                  </View>

                  {/* Lista de insumos ya agregados */}
                  {listaInsumosPlanificados.length > 0 ? (
                    <View style={styles.tablaInsumosContenedor}>
                      <Text style={styles.etiquetaCampo}>Insumos prescritos para esta labor:</Text>
                      {listaInsumosPlanificados.map((item) => (
                        <View key={item.insumoId} style={styles.filaInsumoItem}>
                          <View style={{ flex: 1 }}>
                            <Text style={styles.nombreInsumoTexto}>{item.nombreInsumo}</Text>
                            <Text style={styles.detalleInsumoTexto}>
                              Dosis: {item.dosisPorHa} {item.unidadMedida}/ha • Total: {item.totalCalculado} {item.unidadMedida}
                            </Text>
                            <View style={styles.badgesInsumoItem}>
                              <Badge texto={`Carencia: ${item.diasCarencia || 0}d`} variante="alerta" />
                              <Badge texto={`Reingreso: ${item.horasReingreso || 0}h`} variante="info" />
                            </View>
                          </View>
                          <Pressable
                            onPress={() => handleEliminarInsumo(item.insumoId)}
                            style={styles.botonEliminarItem}
                          >
                            <Trash2 size={16} color="#DC2626" />
                          </Pressable>
                        </View>
                      ))}
                    </View>
                  ) : (
                    <Text style={styles.textoSinInsumos}>
                      Aún no ha agregado insumos a la prescripción técnica.
                    </Text>
                  )}
                </>
              )}

              {/* Sección separada: Maquinaria y Equipamiento Requerido */}
              <View style={styles.seccionMaquinaria}>
                <View style={styles.filaTituloMaquinaria}>
                  <Wrench size={16} color="#4B5563" />
                  <Text style={styles.tituloMaquinaria}>Equipamiento y Maquinaria Requerida</Text>
                </View>

                <View style={[styles.filaDosColumnas, !esPantallaAmplia && styles.columnaSimple, { marginTop: 8 }]}>
                  <View style={{ flex: 2 }}>
                    <Select
                      placeholder="Seleccionar equipo (tractor, mochila, bomba)..."
                      opciones={opcionesMaquinaria}
                      valor={equipoIdSeleccionado}
                      onChange={setEquipoIdSeleccionado}
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Input
                      placeholder="Cantidad (ej. 2)"
                      value={cantidadEquipoInput}
                      onChangeText={setCantidadEquipoInput}
                      keyboardType="numeric"
                    />
                  </View>
                  <View style={{ justifyContent: 'center' }}>
                    <Boton
                      titulo="Agregar"
                      variante="secundario"
                      tamano="sm"
                      disabled={!equipoIdSeleccionado}
                      onPress={handleAgregarMaquinaria}
                    />
                  </View>
                </View>

                {listaMaquinariaPlanificada.length > 0 && (
                  <View style={styles.listaMaquinariaContenedor}>
                    {listaMaquinariaPlanificada.map((m) => (
                      <View key={m.insumoId} style={styles.chipMaquinariaItem}>
                        <Truck size={14} color={Palette.forestGreen} />
                        <Text style={styles.textoChipMaquinaria}>
                          {m.nombreEquipo} ({m.cantidad} {m.unidadMedida})
                        </Text>
                        <Pressable onPress={() => handleEliminarMaquinaria(m.insumoId)}>
                          <Trash2 size={14} color="#9CA3AF" />
                        </Pressable>
                      </View>
                    ))}
                  </View>
                )}
              </View>
            </View>
          )}
        </Card>

        {/* =========================================================================
            BOTONES DE ACCIÓN / GUARDADO
           ========================================================================= */}
        <View style={styles.filaAcciones}>
          <Boton
            titulo="Cancelar"
            variante="outline"
            onPress={onCancelar}
            disabled={guardando}
            estilo={{ minWidth: 120 }}
          />
          <Boton
            titulo="Programar Actividad (PROGRAMADA)"
            variante="primario"
            cargando={guardando}
            onPress={handleSubmit(onSubmit)}
            iconoIzquierda={<CheckCircle2 size={18} color="#FFFFFF" />}
            estilo={{ minWidth: 260 }}
          />
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  scroll: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  scrollContenido: {
    paddingBottom: 40,
  },
  contenedor: {
    width: '100%',
    maxWidth: 1040,
    alignSelf: 'center',
    paddingHorizontal: 16,
    paddingTop: 16,
    gap: 16,
  },
  tarjetaSeccion: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    padding: 0,
    overflow: 'hidden',
  },
  cabeceraSeccion: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#FAFAFA',
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  filaTituloSeccion: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  iconoSeccionContenedor: {
    width: 38,
    height: 38,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tituloSeccion: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
  },
  subtituloSeccion: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  cuerpoSeccion: {
    padding: 20,
    gap: 16,
  },
  grupoCampo: {
    gap: 8,
  },
  etiquetaCampo: {
    fontSize: 13,
    fontWeight: '600',
    color: '#374151',
  },
  gridChipsLabor: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chipLabor: {
    flexBasis: '23%',
    minWidth: 140,
    flexGrow: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
    backgroundColor: '#F9FAFB',
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
  },
  chipLaborSeleccionado: {
    backgroundColor: '#F0FDF4',
    borderColor: Palette.forestGreen,
  },
  chipLaborIcono: {
    fontSize: 20,
  },
  chipLaborTexto: {
    fontSize: 13,
    fontWeight: '600',
    color: '#374151',
  },
  chipLaborTextoSeleccionado: {
    color: Palette.forestGreen,
  },
  chipLaborDesc: {
    fontSize: 10,
    color: '#9CA3AF',
    marginTop: 1,
  },
  chipLaborDescSeleccionado: {
    color: '#15803D',
  },
  filaDosColumnas: {
    flexDirection: 'row',
    gap: 14,
  },
  columnaSimple: {
    flexDirection: 'column',
  },
  columnaFlex: {
    flex: 1,
  },
  panelSectorInformativo: {
    backgroundColor: '#F8FAF5',
    borderWidth: 1,
    borderColor: '#E2EBDC',
    borderRadius: 10,
    padding: 12,
    gap: 6,
  },
  filaBadgesSector: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  textoAyudaSector: {
    fontSize: 11,
    color: '#6B7280',
  },
  tarjetaIdentificadorGenerado: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#F0FDF4',
    borderWidth: 1.5,
    borderColor: '#BBF7D0',
    borderRadius: 10,
    padding: 14,
  },
  iconoTagWrapper: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#DCFCE7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  etiquetaIdentificador: {
    fontSize: 11,
    fontWeight: '600',
    color: '#166534',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  codigoAutogeneradoTexto: {
    fontSize: 17,
    fontWeight: '800',
    color: '#14532D',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    marginVertical: 2,
  },
  subtituloIdentificador: {
    fontSize: 11,
    color: '#15803D',
  },
  filaChipsTurno: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  chipTurno: {
    flex: 1,
    minWidth: 120,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    backgroundColor: '#F9FAFB',
    alignItems: 'center',
  },
  chipTurnoSeleccionado: {
    backgroundColor: '#F0F9FF',
    borderColor: '#0284C7',
  },
  chipTurnoLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#374151',
  },
  chipTurnoLabelSeleccionado: {
    color: '#0284C7',
  },
  chipTurnoHorario: {
    fontSize: 11,
    color: '#6B7280',
    marginTop: 2,
  },
  chipTurnoHorarioSeleccionado: {
    color: '#0369A1',
    fontWeight: '500',
  },
  contenedorStepper: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 48,
    borderWidth: 1.2,
    borderColor: '#D1D5DB',
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    overflow: 'hidden',
  },
  botonStepper: {
    width: 44,
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F3F4F6',
  },
  textoBotonStepper: {
    fontSize: 20,
    fontWeight: '600',
    color: '#374151',
  },
  valorStepperContenedor: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  valorStepperTexto: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1F2937',
  },
  textoAyudaJornales: {
    fontSize: 11,
    color: '#6B7280',
    marginTop: 4,
  },
  bannerNoRequiereInsumos: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 14,
    backgroundColor: '#F0FDF4',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#DCFCE7',
  },
  textoNoRequiereInsumos: {
    fontSize: 13,
    color: '#166534',
    flex: 1,
    lineHeight: 18,
  },
  panelAgregarInsumo: {
    backgroundColor: '#FAFAF9',
    borderWidth: 1,
    borderColor: '#E7E5E4',
    borderRadius: 10,
    padding: 14,
  },
  subtituloPanelInsumo: {
    fontSize: 12,
    fontWeight: '700',
    color: '#44403C',
    marginBottom: 8,
  },
  panelCalculoDosis: {
    marginTop: 10,
    padding: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    gap: 8,
  },
  filaCalculo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
  },
  textoCalculoFormula: {
    fontSize: 12,
    color: '#6B7280',
  },
  textoCalculoTotal: {
    fontSize: 14,
    fontWeight: '700',
    color: Palette.forestGreen,
  },
  filaBadgesSeguridad: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  tablaInsumosContenedor: {
    gap: 8,
  },
  filaInsumoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  nombreInsumoTexto: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1F2937',
  },
  detalleInsumoTexto: {
    fontSize: 12,
    color: '#4B5563',
    marginTop: 2,
  },
  badgesInsumoItem: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 6,
  },
  botonEliminarItem: {
    padding: 8,
    borderRadius: 6,
    backgroundColor: '#FEE2E2',
  },
  textoSinInsumos: {
    fontSize: 12,
    color: '#9CA3AF',
    fontStyle: 'italic',
    textAlign: 'center',
    paddingVertical: 8,
  },
  seccionMaquinaria: {
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    paddingTop: 14,
  },
  filaTituloMaquinaria: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  tituloMaquinaria: {
    fontSize: 13,
    fontWeight: '700',
    color: '#374151',
  },
  listaMaquinariaContenedor: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 10,
  },
  chipMaquinariaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 6,
    paddingHorizontal: 10,
    backgroundColor: '#F3F4F6',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  textoChipMaquinaria: {
    fontSize: 12,
    color: '#374151',
    fontWeight: '500',
  },
  filaAcciones: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
    marginTop: 8,
    flexWrap: 'wrap',
  },
});

