import React, { useState } from 'react';
import { View, Text, ScrollView, Pressable, useWindowDimensions } from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Users, Wrench, ArrowRight, ArrowLeft } from 'lucide-react-native';
import { Palette } from '@/constants/theme';
import { Boton, Input } from '@/shared/components/ui';
import { ParcelaItem } from '@/features/parcelas/types/parcela.types';
import { Usuario } from '@/features/usuarios/types/usuario.types';
import { InsumoItem } from '../types/insumo.types';
import { actividadSchema, type ActividadFormValores } from '../schemas/actividad.schema';
import { useSectoresPorParcelaQuery } from '@/features/parcelas/api/sectores.api';
import { ActividadFormularioCuadrilla, TrabajadorAsignadoInput } from './actividad-formulario-cuadrilla';
import { ActividadFormularioRecursos, RecursoAsignadoInput } from './actividad-formulario-recursos';
import { ActividadFormularioLabor } from './actividad-formulario-labor';
import { styles } from './actividad-formulario.styles';

export interface ActividadFormularioProps {
  parcelas: ParcelaItem[];
  usuarios: Usuario[];
  insumos: InsumoItem[];
  valoresIniciales?: Partial<ActividadFormValores>;
  guardando?: boolean;
  modo?: 'crear' | 'editar';
  onSubmit: (valores: ActividadFormValores) => void;
  onCancelar: () => void;
}

/**
 * @description Formulario estructurado en tabs y 2 columnas para planificación de labores agrícolas.
 */
export const ActividadFormulario: React.FC<ActividadFormularioProps> = ({
  parcelas,
  usuarios,
  insumos,
  valoresIniciales,
  guardando = false,
  modo = 'crear',
  onSubmit,
  onCancelar,
}) => {
  const { width } = useWindowDimensions();
  const esEscritorio = width >= 980;

  const [tabActivo, setTabActivo] = useState<'labor_cuadrilla' | 'insumos_notas'>('labor_cuadrilla');
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

  // Consulta de sectores / áreas de cultivo correspondientes a la parcela seleccionada
  const { data: resumenSectores, isLoading: cargandoSectores } = useSectoresPorParcelaQuery(
    parcelaIdActual || undefined,
  );

  // Si cambia la parcela, limpiar sectorId para evitar asignaciones inconsistentes
  const parcelaIdAnteriorRef = React.useRef(parcelaIdActual);
  React.useEffect(() => {
    if (parcelaIdAnteriorRef.current && parcelaIdAnteriorRef.current !== parcelaIdActual) {
      setValue('sectorId', '');
    }
    parcelaIdAnteriorRef.current = parcelaIdActual;
  }, [parcelaIdActual, setValue]);

  const sectoresDisponibles = resumenSectores?.sectores || [];
  const opcionesSectores = React.useMemo(() => {
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
  React.useEffect(() => {
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
    setCuadrilla((prev) => {
      const nueva = prev.map((t) => (t.usuarioId === usuarioId ? { ...t, rolEnActividad: rol } : t));
      setValue('trabajadores', nueva);
      return nueva;
    });
  };

  const cambiarHorasTrabajador = (usuarioId: string, horas: number) => {
    setCuadrilla((prev) => {
      const nueva = prev.map((t) => (t.usuarioId === usuarioId ? { ...t, horasAsignadas: horas } : t));
      setValue('trabajadores', nueva);
      return nueva;
    });
  };

  const agregarRecurso = (insumo: InsumoItem) => {
    setRecursos((prev) => {
      if (prev.some((r) => r.insumoId === insumo.id)) return prev;
      const nueva = [...prev, { insumoId: insumo.id, cantidadEstimada: 1, unidadMedida: insumo.unidadMedida }];
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
      const nueva = prev.map((r) => (r.insumoId === insumoId ? { ...r, cantidadEstimada: cantidad } : r));
      setValue('recursos', nueva);
      return nueva;
    });
  };

  const opcionesParcelas = parcelas.map((p) => ({
    label: `${p.codigo ? `[${p.codigo}] ` : ''}${p.nombre}`,
    valor: p.id,
  }));

  // Priorizar y ordenar para destacar Supervisores de campo como encargados
  const opcionesResponsables = React.useMemo(() => {
    const ordenRoles: Record<string, number> = {
      SUPERVISOR: 1,
      AGRONOMO: 2,
      ADMINISTRADOR: 3,
      OPERADOR: 4,
    };

    return [...usuarios]
      .filter((u) => u.activo)
      .sort((a, b) => (ordenRoles[a.rol] || 99) - (ordenRoles[b.rol] || 99))
      .map((u) => ({
        label: `${u.rol === 'SUPERVISOR' ? '⭐ [SUPERVISOR] ' : `[${u.rol}] `}${u.nombres} ${u.apellidos}`,
        valor: u.id,
      }));
  }, [usuarios]);

  const responsableSeleccionado = usuarios.find((u) => u.id === responsableIdActual);
  const nombreResponsable = responsableSeleccionado
    ? `${responsableSeleccionado.nombres} ${responsableSeleccionado.apellidos}`
    : undefined;

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

  const bloqueCuadrilla = (
    <View style={styles.tarjeta}>
      <ActividadFormularioCuadrilla
        usuariosDisponibles={usuarios}
        trabajadoresSeleccionados={cuadrilla}
        tipoActual={tipoActual}
        responsableId={responsableIdActual}
        nombreResponsable={nombreResponsable}
        turnoHorasLabor={{
          inicio: horaInicioActual,
          fin: horaFinActual,
          duracion: duracionHorasActual,
        }}
        onAlternarTrabajador={alternarTrabajador}
        onCambiarRol={cambiarRolTrabajador}
        onCambiarHoras={cambiarHorasTrabajador}
      />
    </View>
  );

  const bloqueInsumos = (
    <View style={styles.tarjeta}>
      <ActividadFormularioRecursos
        insumosDisponibles={insumos}
        recursosSeleccionados={recursos}
        onAgregarRecurso={agregarRecurso}
        onEliminarRecurso={eliminarRecurso}
        onCambiarCantidad={cambiarCantidadRecurso}
      />
    </View>
  );

  const bloqueNotas = (
    <View style={styles.tarjeta}>
      <Text style={styles.tituloSeccion}>Observaciones y Notas Técnicas</Text>
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

  return (
    <View style={styles.contenedorPrincipal}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.contenedor}
        showsVerticalScrollIndicator={false}
      >
        {/* Selector de Pestañas / Tabs */}
      <View style={styles.barraTabs}>
        <Pressable
          onPress={() => setTabActivo('labor_cuadrilla')}
          style={[styles.botonTab, tabActivo === 'labor_cuadrilla' && styles.botonTabActivo]}
        >
          <Users size={16} color={tabActivo === 'labor_cuadrilla' ? Palette.forestGreen : '#6B7280'} />
          <Text style={[styles.textoTab, tabActivo === 'labor_cuadrilla' && styles.textoTabActivo]}>
            1. Labor Agrícola y Cuadrilla
          </Text>
        </Pressable>

        <Pressable
          onPress={() => setTabActivo('insumos_notas')}
          style={[styles.botonTab, tabActivo === 'insumos_notas' && styles.botonTabActivo]}
        >
          <Wrench size={16} color={tabActivo === 'insumos_notas' ? Palette.forestGreen : '#6B7280'} />
          <Text style={[styles.textoTab, tabActivo === 'insumos_notas' && styles.textoTabActivo]}>
            2. Insumos y Notas Técnicas
          </Text>
          {recursos.length > 0 && (
            <View style={styles.badgeTab}>
              <Text style={styles.textoBadgeTab}>{recursos.length}</Text>
            </View>
          )}
        </Pressable>
      </View>

      {/* Contenido según Tab y Layout (2 columnas en Web / 1 en móvil) */}
      {tabActivo === 'labor_cuadrilla' ? (
        esEscritorio ? (
          <View style={styles.filaDosColumnasLayout}>
            <View style={styles.columnaMitad}>{bloqueLabor}</View>
            <View style={styles.columnaMitad}>{bloqueCuadrilla}</View>
          </View>
        ) : (
          <View style={styles.layoutMovil}>
            {bloqueLabor}
            {bloqueCuadrilla}
          </View>
        )
      ) : esEscritorio ? (
        <View style={styles.filaDosColumnasLayout}>
          <View style={styles.columnaMitad}>{bloqueInsumos}</View>
          <View style={styles.columnaMitad}>{bloqueNotas}</View>
        </View>
      ) : (
        <View style={styles.layoutMovil}>
          {bloqueInsumos}
          {bloqueNotas}
        </View>
      )}
      </ScrollView>

      {/* Barra de Acciones Anclada al Pie (No Tapa el Contenido y es Compacta) */}
      <View style={styles.barraAccionesFooter}>
        <View style={styles.barraAccionesInner}>
          <Boton
            titulo="Cancelar"
            variante="secundario"
            onPress={onCancelar}
            disabled={guardando}
            estilo={styles.botonCompacto}
            estiloTexto={styles.textoBotonCompacto}
          />

          <View style={styles.grupoBotonesDerecha}>
            {tabActivo === 'labor_cuadrilla' ? (
              <Boton
                titulo="Siguiente: Insumos"
                iconoDerecha={<ArrowRight size={15} color="#FFFFFF" />}
                onPress={() => setTabActivo('insumos_notas')}
                estilo={styles.botonCompacto}
                estiloTexto={styles.textoBotonCompacto}
              />
            ) : (
              <Boton
                titulo="Anterior"
                variante="outline"
                iconoIzquierda={<ArrowLeft size={15} color={Palette.forestGreen} />}
                onPress={() => setTabActivo('labor_cuadrilla')}
                estilo={styles.botonCompacto}
                estiloTexto={styles.textoBotonCompacto}
              />
            )}

            <Boton
              titulo={modo === 'crear' ? 'Registrar Actividad' : 'Guardar Cambios'}
              variante="primario"
              onPress={handleSubmit(onSubmit)}
              cargando={guardando}
              estilo={styles.botonCompactoPrimario}
              estiloTexto={styles.textoBotonCompacto}
            />
          </View>
        </View>
      </View>
    </View>
  );
};
