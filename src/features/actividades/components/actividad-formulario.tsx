import React, { useState, useEffect, useMemo, useRef } from 'react';
import { View, Text, ScrollView, useWindowDimensions, Pressable } from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Users,
  Wrench,
  Check,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  FileText,
  ClipboardList,
} from 'lucide-react-native';
import { Palette } from '@/constants/theme';
import { Boton, Input, Select } from '@/shared/components/ui';
import { useAuthStore } from '@/features/autenticacion';
import { ParcelaItem } from '@/features/parcelas/types/parcela.types';
import { Usuario } from '@/features/usuarios/types/usuario.types';
import { InsumoItem } from '../types/insumo.types';
import { actividadSchema, type ActividadFormValores } from '../schemas/actividad.schema';
import { useSectoresPorParcelaQuery } from '@/features/parcelas/api/sectores.api';
import { ActividadFormularioCuadrilla, TrabajadorAsignadoInput } from './actividad-formulario-cuadrilla';
import { ActividadFormularioRecursos, RecursoAsignadoInput } from './actividad-formulario-recursos';
import { ActividadFormularioLabor } from './actividad-formulario-labor';
import { styles } from './actividad-formulario.styles';

export type TipoPasoActividad = 'labor' | 'insumos' | 'cuadrilla' | 'seguimiento';

export interface PasoConfig {
  id: TipoPasoActividad;
  numero: number;
  titulo: string;
  subtitulo: string;
  badge?: number;
}

export interface ActividadFormularioProps {
  parcelas: ParcelaItem[];
  usuarios: Usuario[];
  insumos: InsumoItem[];
  valoresIniciales?: Partial<ActividadFormValores>;
  guardando?: boolean;
  modo?: 'crear' | 'editar';
  esSupervisor?: boolean;
  esAgronomo?: boolean;
  actividadId?: string;
  onSubmit: (valores: ActividadFormValores) => void;
  onCancelar: () => void;
}

/**
 * @description Formulario en pasos (Wizard) para planificación y gestión de actividades agrícolas.
 * Muestra u oculta pasos según el rol del usuario:
 * - Administrador: Todos los pasos (Labor, Insumos, Cuadrilla, Seguimiento).
 * - Agrónomo: Labor Agrícola, Insumos y Estado/Prescripción (la Cuadrilla queda oculta).
 * - Supervisor: Cuadrilla Operativa y Seguimiento de campo (la prescripción técnica queda oculta).
 */
export const ActividadFormulario: React.FC<ActividadFormularioProps> = ({
  parcelas,
  usuarios,
  insumos,
  valoresIniciales,
  guardando = false,
  modo = 'crear',
  esSupervisor: esSupervisorProp,
  esAgronomo: esAgronomoProp,
  actividadId,
  onSubmit,
  onCancelar,
}) => {
  const usuarioActual = useAuthStore((s) => s.usuario);
  const esSupervisor = esSupervisorProp ?? (usuarioActual?.rol === 'SUPERVISOR');
  const esAgronomo = esAgronomoProp ?? (usuarioActual?.rol === 'AGRONOMO');
  const esAdmin = usuarioActual?.rol === 'ADMINISTRADOR';

  const [cuadrilla, setCuadrilla] = useState<TrabajadorAsignadoInput[]>(
    valoresIniciales?.trabajadores || [],
  );
  const [recursos, setRecursos] = useState<RecursoAsignadoInput[]>(
    valoresIniciales?.recursos || [],
  );

  const {
    control,
    handleSubmit,
    setValue,
    watch,
    trigger,
    formState: { errors },
  } = useForm<ActividadFormValores>({
    resolver: zodResolver(actividadSchema),
    defaultValues: {
      codigo: valoresIniciales?.codigo || '',
      titulo: valoresIniciales?.titulo || '',
      tipo: valoresIniciales?.tipo || 'FERTILIZACION',
      parcelaId: valoresIniciales?.parcelaId || (parcelas[0]?.id ?? ''),
      sectorId: valoresIniciales?.sectorId || '',
      fechaInicio: valoresIniciales?.fechaInicio || new Date().toISOString().split('T')[0],
      horaInicio: valoresIniciales?.horaInicio || '07:00',
      fechaFin: valoresIniciales?.fechaFin || '',
      horaFin: valoresIniciales?.horaFin || '12:00',
      duracionHoras: valoresIniciales?.duracionHoras || 5,
      usuarioResponsableId: valoresIniciales?.usuarioResponsableId || '',
      descripcion: valoresIniciales?.descripcion || '',
      observaciones: valoresIniciales?.observaciones || '',
      blancoBiologico: valoresIniciales?.blancoBiologico || '',
      metodoAplicacion: valoresIniciales?.metodoAplicacion || '',
      diasCarencia: valoresIniciales?.diasCarencia || undefined,
      horasReingreso: valoresIniciales?.horasReingreso || undefined,
      estado: valoresIniciales?.estado || 'PENDIENTE',
      trabajadores: valoresIniciales?.trabajadores || [],
      recursos: valoresIniciales?.recursos || [],
    },
  });

  const tipoActual = watch('tipo');
  const parcelaIdActual = watch('parcelaId');
  const sectorIdActual = watch('sectorId');
  const responsableIdActual = watch('usuarioResponsableId');
  const horaInicioActual = watch('horaInicio') || '07:00';
  const horaFinActual = watch('horaFin') || '12:00';
  const duracionHorasActual = watch('duracionHoras') || 5;

  // Definición dinámica de los pasos según el rol del usuario
  const pasosDisponibles = useMemo<PasoConfig[]>(() => {
    if (esSupervisor) {
      // Supervisor: solo gestiona Cuadrilla de operarios y Seguimiento / Estado
      return [
        {
          id: 'cuadrilla',
          numero: 1,
          titulo: '1. Cuadrilla Operativa',
          subtitulo: 'Asignar operarios y zonas',
          badge: cuadrilla.length,
        },
        {
          id: 'seguimiento',
          numero: 2,
          titulo: '2. Seguimiento y Estado',
          subtitulo: 'Estado y notas de campo',
        },
      ];
    }

    if (esAgronomo) {
      // Agrónomo: prescribe Labor, Insumos y Estado/Observaciones (Cuadrilla oculta)
      return [
        {
          id: 'labor',
          numero: 1,
          titulo: '1. Labor Agrícola',
          subtitulo: 'Labor, parcela, fecha y supervisor',
        },
        {
          id: 'insumos',
          numero: 2,
          titulo: '2. Insumos Planificados',
          subtitulo: 'Recursos y dosis estimadas',
          badge: recursos.length,
        },
        {
          id: 'seguimiento',
          numero: 3,
          titulo: '3. Estado y Prescripción',
          subtitulo: 'Estado inicial y advertencias',
        },
      ];
    }

    // Administrador: visualiza y gestiona todos los pasos completos
    return [
      {
        id: 'labor',
        numero: 1,
        titulo: '1. Labor Agrícola',
        subtitulo: 'Labor, parcela, fecha y supervisor',
      },
      {
        id: 'insumos',
        numero: 2,
        titulo: '2. Insumos Planificados',
        subtitulo: 'Recursos y dosis estimadas',
        badge: recursos.length,
      },
      {
        id: 'cuadrilla',
        numero: 3,
        titulo: '3. Cuadrilla Operativa',
        subtitulo: 'Operarios y turnos de campo',
        badge: cuadrilla.length,
      },
      {
        id: 'seguimiento',
        numero: 4,
        titulo: '4. Seguimiento y Estado',
        subtitulo: 'Estado de avance y notas',
      },
    ];
  }, [esSupervisor, esAgronomo, cuadrilla.length, recursos.length]);

  const [pasoActivoId, setPasoActivoId] = useState<TipoPasoActividad>(pasosDisponibles[0].id);

  // Garantizar consistencia si cambian los pasos disponibles
  useEffect(() => {
    if (!pasosDisponibles.some((p) => p.id === pasoActivoId)) {
      setPasoActivoId(pasosDisponibles[0].id);
    }
  }, [pasosDisponibles, pasoActivoId]);

  const indicePasoActivo = Math.max(
    0,
    pasosDisponibles.findIndex((p) => p.id === pasoActivoId),
  );
  const esPrimerPaso = indicePasoActivo === 0;
  const esUltimoPaso = indicePasoActivo === pasosDisponibles.length - 1;

  // Control de avance y validación de pasos
  const handleSiguiente = async () => {
    if (pasoActivoId === 'labor') {
      const valido = await trigger(['titulo', 'tipo', 'parcelaId', 'fechaInicio']);
      if (!valido) return;
    }
    if (!esUltimoPaso) {
      setPasoActivoId(pasosDisponibles[indicePasoActivo + 1].id);
    }
  };

  const handleAnterior = () => {
    if (!esPrimerPaso) {
      setPasoActivoId(pasosDisponibles[indicePasoActivo - 1].id);
    }
  };

  // Consulta de sectores correspondientes a la parcela seleccionada
  const { data: resumenSectores, isLoading: cargandoSectores } = useSectoresPorParcelaQuery(
    parcelaIdActual || undefined,
  );

  // Si cambia la parcela, limpiar sectorId para evitar asignaciones inconsistentes
  const parcelaIdAnteriorRef = useRef(parcelaIdActual);
  useEffect(() => {
    if (parcelaIdAnteriorRef.current && parcelaIdAnteriorRef.current !== parcelaIdActual) {
      setValue('sectorId', '');
    }
    parcelaIdAnteriorRef.current = parcelaIdActual;
  }, [parcelaIdActual, setValue]);

  const sectoresDisponibles = resumenSectores?.sectores || [];
  const opcionesSectores = useMemo(() => {
    return [
      {
        label:
          sectoresDisponibles.length > 0
            ? 'Toda la parcela (Lote completo)'
            : 'Toda la parcela (Sin áreas delimitadas)',
        valor: '',
      },
      ...sectoresDisponibles.map((s) => ({
        label: `[${s.codigo}] ${s.nombre} - ${s.cultivoNombre || 'Cultivo'}${s.variedad ? ` (${s.variedad})` : ''} - ${Number(s.areaHectareas).toFixed(2)} ha`,
        valor: s.id,
      })),
    ];
  }, [sectoresDisponibles]);

  // Si se selecciona un encargado/responsable, se excluye de la cuadrilla operativa
  useEffect(() => {
    if (responsableIdActual) {
      setCuadrilla((prev) => {
        if (prev.some((t) => t.usuarioId === responsableIdActual)) {
          const filtrada = prev.filter((t) => t.usuarioId !== responsableIdActual);
          setValue('trabajadores', filtrada);
          return filtrada;
        }
        return prev;
      });
    }
  }, [responsableIdActual, setValue]);

  const alternarTrabajador = (usuarioId: string) => {
    if (esAgronomo) return;
    setCuadrilla((prev) => {
      const nueva = prev.some((t) => t.usuarioId === usuarioId)
        ? prev.filter((t) => t.usuarioId !== usuarioId)
        : [
            ...prev,
            {
              usuarioId,
              rolEnActividad: 'Operador',
              horaInicio: horaInicioActual,
              horaFin: horaFinActual,
              horasAsignadas: duracionHorasActual,
            },
          ];
      setValue('trabajadores', nueva);
      return nueva;
    });
  };

  const cambiarRolTrabajador = (usuarioId: string, rol: string) => {
    if (esAgronomo) return;
    setCuadrilla((prev) => {
      const nueva = prev.map((t) => (t.usuarioId === usuarioId ? { ...t, rolEnActividad: rol } : t));
      setValue('trabajadores', nueva);
      return nueva;
    });
  };

  const cambiarZonaTrabajador = (usuarioId: string, zona: string) => {
    if (esAgronomo) return;
    setCuadrilla((prev) => {
      const nueva = prev.map((t) => (t.usuarioId === usuarioId ? { ...t, zonaTrabajo: zona } : t));
      setValue('trabajadores', nueva);
      return nueva;
    });
  };

  const cambiarHorasTrabajador = (usuarioId: string, horas: number) => {
    if (esAgronomo) return;
    setCuadrilla((prev) => {
      const nueva = prev.map((t) => (t.usuarioId === usuarioId ? { ...t, horasAsignadas: horas } : t));
      setValue('trabajadores', nueva);
      return nueva;
    });
  };

  const agregarRecurso = (insumo: InsumoItem) => {
    setRecursos((prev) => {
      if (prev.some((r) => r.insumoId === insumo.id)) return prev;
      const nueva = [
        ...prev,
        {
          insumoId: insumo.id,
          cantidadEstimada: 1,
          unidadMedida: insumo.unidadMedida,
          dosis: '',
        },
      ];
      setValue('recursos', nueva);
      return nueva;
    });
  };

  const eliminarRecurso = (insumoId: string) => {
    setRecursos((prev) => {
      const nueva = prev.filter((r) => r.insumoId !== insumoId);
      setValue('recursos', nueva);
      return nueva;
    });
  };

  const cambiarCantidadRecurso = (insumoId: string, cantidad: number) => {
    setRecursos((prev) => {
      const nueva = prev.map((r) =>
        r.insumoId === insumoId ? { ...r, cantidadEstimada: cantidad } : r,
      );
      setValue('recursos', nueva);
      return nueva;
    });
  };

  const cambiarDosisRecurso = (insumoId: string, dosis: string) => {
    setRecursos((prev) => {
      const nueva = prev.map((r) =>
        r.insumoId === insumoId ? { ...r, dosis } : r,
      );
      setValue('recursos', nueva);
      return nueva;
    });
  };

  const opcionesParcelas = parcelas.map((p) => ({
    label: `${p.codigo ? `[${p.codigo}] ` : ''}${p.nombre}`,
    valor: p.id,
  }));

  // Priorizar y ordenar para destacar Supervisores de campo como encargados
  const opcionesResponsables = useMemo(() => {
    const ordenRoles: Record<string, number> = {
      SUPERVISOR: 1,
      AGRONOMO: 2,
      ADMINISTRADOR: 3,
      OPERADOR: 4,
    };

    return [...usuarios]
      .filter((u) => {
        if (!u.activo) return false;
        if (u.rol === 'OPERADOR') return false;
        if (esAgronomo && u.rol === 'ADMINISTRADOR') return false;
        return true;
      })
      .sort((a, b) => (ordenRoles[a.rol] || 99) - (ordenRoles[b.rol] || 99))
      .map((u) => ({
        label: `${u.rol === 'SUPERVISOR' ? '⭐ [SUPERVISOR] ' : `[${u.rol}] `}${u.nombres} ${u.apellidos}`,
        valor: u.id,
      }));
  }, [usuarios, esAgronomo]);

  const responsableSeleccionado = usuarios.find((u) => u.id === responsableIdActual);
  const nombreResponsable = responsableSeleccionado
    ? `${responsableSeleccionado.nombres} ${responsableSeleccionado.apellidos}`
    : undefined;

  const generarTituloAutomatico = () => {
    const nombresLabor: Record<string, string> = {
      RIEGO: 'Riego',
      PODA: 'Poda',
      COSECHA: 'Cosecha',
      SIEMBRA: 'Siembra',
      FERTILIZACION: 'Fertilización',
      CONTROL_PLAGAS: 'Control Plagas',
      DESHIERBE: 'Deshierbe',
      MANTENIMIENTO: 'Mantenimiento',
      MONITOREO_FITOSANITARIO: 'Monitoreo Fitosanitario',
      AUDITORIA_CALIDAD: 'Auditoría Calidad',
      SUPERVISION_TECNICA: 'Supervisión Técnica',
      GESTION_ADMINISTRATIVA: 'Gestión Administrativa',
      OTRO: 'Actividad Agrícola',
    };
    const etiquetaLabor = nombresLabor[tipoActual] || tipoActual;
    const parcela = parcelas.find((p) => p.id === parcelaIdActual);
    const nombreParcela = parcela
      ? parcela.codigo
        ? `[${parcela.codigo}] ${parcela.nombre}`
        : parcela.nombre
      : 'Parcela';
    const sector = sectoresDisponibles.find((s) => s.id === sectorIdActual);
    const nombreSector = sector ? ` (${sector.nombre})` : '';
    const fecha = watch('fechaInicio') || new Date().toISOString().split('T')[0];
    const partesFecha = fecha.split('-');
    const fechaFormateada = partesFecha.length === 3 ? `${partesFecha[2]}/${partesFecha[1]}` : fecha;

    const blanco = watch('blancoBiologico')?.trim();
    const sufijoBlanco = blanco ? ` - ${blanco}` : '';

    setValue(
      'titulo',
      `${etiquetaLabor}${sufijoBlanco} - ${nombreParcela}${nombreSector} - ${fechaFormateada}`,
      { shouldValidate: true },
    );
  };

  // Bloque 1: Labor Agrícola
  const bloqueLabor = (
    <ActividadFormularioLabor
      control={control}
      errors={errors}
      tipoActual={tipoActual}
      parcelaIdActual={parcelaIdActual}
      sectorIdActual={sectorIdActual}
      opcionesSectores={opcionesSectores}
      cargandoSectores={cargandoSectores}
      sectoresDisponibles={sectoresDisponibles}
      onCambiarSector={(sId) => setValue('sectorId', sId)}
      responsableIdActual={responsableIdActual}
      opcionesParcelas={opcionesParcelas}
      opcionesResponsables={opcionesResponsables}
      onCambiarTipo={(t) => setValue('tipo', t)}
      horaInicioActual={horaInicioActual}
      horaFinActual={horaFinActual}
      esSupervisor={esSupervisor}
      esAgronomo={esAgronomo}
      onAutogenerarTitulo={generarTituloAutomatico}
      onCambiarHorario={(ini, fin) => {
        setValue('horaInicio', ini);
        setValue('horaFin', fin);
        const [h1, m1] = ini.split(':').map(Number);
        const [h2, m2] = fin.split(':').map(Number);
        const diff = Math.max(0, ((h2 || 0) * 60 + (m2 || 0) - ((h1 || 0) * 60 + (m1 || 0))) / 60);
        const dur = Number(diff.toFixed(1));
        setValue('duracionHoras', dur);
        setCuadrilla((prev) => {
          const nueva = prev.map((t) => ({
            ...t,
            horaInicio: ini,
            horaFin: fin,
            horasAsignadas: dur,
          }));
          setValue('trabajadores', nueva);
          return nueva;
        });
      }}
    />
  );

  // Bloque 2: Cuadrilla Operativa
  const bloqueCuadrilla = (
    <View style={styles.tarjeta}>
      <ActividadFormularioCuadrilla
        usuariosDisponibles={usuarios}
        trabajadoresSeleccionados={cuadrilla}
        tipoActual={tipoActual}
        responsableId={responsableIdActual}
        nombreResponsable={nombreResponsable}
        esSupervisor={esSupervisor}
        esAgronomo={esAgronomo}
        parcelaId={parcelaIdActual}
        fechaLabor={watch('fechaInicio')}
        fechaFinLabor={watch('fechaFin')}
        actividadId={actividadId}
        turnoHorasLabor={{
          inicio: horaInicioActual,
          fin: horaFinActual,
          duracion: duracionHorasActual,
        }}
        onAlternarTrabajador={alternarTrabajador}
        onCambiarRol={cambiarRolTrabajador}
        onCambiarHoras={cambiarHorasTrabajador}
        onCambiarZona={cambiarZonaTrabajador}
      />
    </View>
  );

  // Bloque 3: Insumos Planificados
  const bloqueInsumos = (
    <View style={styles.tarjeta}>
      <ActividadFormularioRecursos
        insumosDisponibles={insumos}
        recursosSeleccionados={recursos}
        onAgregarRecurso={agregarRecurso}
        onEliminarRecurso={eliminarRecurso}
        onCambiarCantidad={cambiarCantidadRecurso}
        onCambiarDosis={cambiarDosisRecurso}
      />
    </View>
  );

  // Bloque 4: Seguimiento, Estado y Observaciones
  const bloqueNotas = (
    <View style={styles.tarjeta}>
      <Text style={styles.tituloSeccion}>Seguimiento, Estado y Observaciones</Text>

      <Controller
        control={control}
        name="estado"
        render={({ field: { onChange, value } }) => (
          <Select
            label="Estado de la Actividad *"
            placeholder="Seleccionar estado de avance..."
            valor={value}
            opciones={[
              { label: '🟡 Pendiente (Programada para inicio)', valor: 'PENDIENTE' },
              { label: '🔵 En Progreso (Cuadrilla operando en campo)', valor: 'EN_PROGRESO' },
              { label: '🟢 Completada (Labor finalizada en terreno)', valor: 'COMPLETADA' },
              { label: '🔴 Cancelada', valor: 'CANCELADA' },
            ]}
            onChange={onChange}
            error={errors.estado?.message}
          />
        )}
      />

      <Controller
        control={control}
        name="descripcion"
        render={({ field: { onChange, value } }) => (
          <Input
            label="Descripción Operativa"
            placeholder="Detalles sobre dosis de aplicación, sectores o indicaciones..."
            multiline
            numberOfLines={3}
            value={value || ''}
            onChangeText={onChange}
          />
        )}
      />

      <Controller
        control={control}
        name="observaciones"
        render={({ field: { onChange, value } }) => (
          <Input
            label="Condiciones Climáticas o Seguridad"
            placeholder="Ej. Realizar en horario matutino sin presencia de viento fuerte..."
            multiline
            numberOfLines={2}
            value={value || ''}
            onChangeText={onChange}
          />
        )}
      />
    </View>
  );

  // Banner de contexto informativo para el Supervisor
  const bannerContextoSupervisor = (
    <View style={styles.bannerContextoLaborSupervisor}>
      <View style={styles.filaContextoSupervisor}>
        <FileText size={16} color={Palette.forestGreen} />
        <Text style={styles.tituloContextoSupervisor}>
          Labor prescrita:{' '}
          <Text style={{ fontWeight: '800' }}>
            {valoresIniciales?.titulo || watch('titulo') || 'Actividad Agrícola'}
          </Text>
        </Text>
      </View>
      <Text style={styles.textoContextoSupervisor}>
        Parcela:{' '}
        <Text style={{ fontWeight: '700' }}>
          {parcelas.find((p) => p.id === parcelaIdActual)?.nombre || 'Parcela'}
        </Text>
        {sectorIdActual
          ? ` · Sector: ${opcionesSectores.find((s) => s.valor === sectorIdActual)?.label?.split('] ')[1] || sectorIdActual}`
          : ''}
        {' · '}Turno:{' '}
        <Text style={{ fontWeight: '700' }}>
          {horaInicioActual} a {horaFinActual} ({duracionHorasActual}h)
        </Text>
      </Text>
      {watch('descripcion') ? (
        <Text style={styles.descripcionContextoSupervisor}>
          Indicaciones operativas: {watch('descripcion')}
        </Text>
      ) : null}
    </View>
  );

  return (
    <View style={styles.contenedorPrincipal}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.contenedor}
        showsVerticalScrollIndicator={false}
      >
        {/* Indicador Stepper de Pasos Interactivos */}
        <View style={styles.contenedorStepper}>
          {pasosDisponibles.map((paso, idx) => {
            const esActivo = paso.id === pasoActivoId;
            const esCompletado = idx < indicePasoActivo;

            return (
              <Pressable
                key={paso.id}
                style={[
                  styles.itemStepper,
                  esActivo && styles.itemStepperActivo,
                  esCompletado && styles.itemStepperCompletado,
                ]}
                onPress={() => setPasoActivoId(paso.id)}
              >
                <View
                  style={[
                    styles.circuloNumeroPaso,
                    esActivo && styles.circuloNumeroPasoActivo,
                    esCompletado && styles.circuloNumeroPasoCompletado,
                  ]}
                >
                  {esCompletado ? (
                    <Check size={14} color="#FFFFFF" strokeWidth={2.5} />
                  ) : (
                    <Text
                      style={[
                        styles.textoNumeroPaso,
                        esActivo && styles.textoNumeroPasoActivo,
                      ]}
                    >
                      {paso.numero}
                    </Text>
                  )}
                </View>

                <View style={styles.infoPasoStepper}>
                  <Text
                    style={[
                      styles.tituloPasoStepper,
                      esActivo && styles.tituloPasoStepperActivo,
                      esCompletado && styles.tituloPasoStepperCompletado,
                    ]}
                  >
                    {paso.titulo}
                  </Text>
                  <Text style={styles.subtituloPasoStepper} numberOfLines={1}>
                    {paso.subtitulo}
                  </Text>
                </View>

                {paso.badge !== undefined && paso.badge > 0 && (
                  <View style={styles.badgePaso}>
                    <Text style={styles.textoBadgePaso}>{paso.badge}</Text>
                  </View>
                )}
              </Pressable>
            );
          })}
        </View>

        {/* Contenido según el Paso Activo */}
        {pasoActivoId === 'labor' && (
          <View style={styles.bloqueCampo}>{bloqueLabor}</View>
        )}

        {pasoActivoId === 'insumos' && (
          <View style={styles.bloqueCampo}>{bloqueInsumos}</View>
        )}

        {pasoActivoId === 'cuadrilla' && (
          <View style={{ gap: 14 }}>
            {esSupervisor && bannerContextoSupervisor}
            {bloqueCuadrilla}
          </View>
        )}

        {pasoActivoId === 'seguimiento' && (
          <View style={styles.bloqueCampo}>{bloqueNotas}</View>
        )}
      </ScrollView>

      {/* Barra de navegación de pasos al pie */}
      <View style={styles.barraAccionesFooter}>
        <View style={styles.barraAccionesInner}>
          <View style={styles.grupoBotonesIzquierda}>
            {esPrimerPaso ? (
              <Boton
                titulo="Cancelar"
                variante="secundario"
                tamano="sm"
                onPress={onCancelar}
                disabled={guardando}
              />
            ) : (
              <Boton
                titulo="← Anterior"
                variante="secundario"
                tamano="sm"
                iconoIzquierda={<ArrowLeft size={14} color={Palette.forestGreen} />}
                onPress={handleAnterior}
                disabled={guardando}
              />
            )}
          </View>

          <Text style={styles.textoProgresoPasos}>
            Paso {indicePasoActivo + 1} de {pasosDisponibles.length}
          </Text>

          <View style={styles.grupoBotonesDerecha}>
            {!esUltimoPaso ? (
              <Boton
                titulo="Siguiente Paso →"
                variante="primario"
                tamano="sm"
                iconoDerecha={<ArrowRight size={14} color="#FFFFFF" />}
                onPress={handleSiguiente}
                disabled={guardando}
              />
            ) : (
              <Boton
                titulo={modo === 'crear' ? 'Registrar Actividad' : 'Guardar Cambios'}
                variante="primario"
                tamano="sm"
                iconoIzquierda={<CheckCircle2 size={14} color="#FFFFFF" />}
                onPress={handleSubmit(onSubmit)}
                cargando={guardando}
              />
            )}
          </View>
        </View>
      </View>
    </View>
  );
};
