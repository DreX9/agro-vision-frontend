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
import { TipoActividadTipo } from '../types/actividad.types';
import { actividadSchema, type ActividadFormValores } from '../schemas/actividad.schema';
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
      fechaInicio: valoresIniciales?.fechaInicio || new Date().toISOString().split('T')[0],
      fechaFin: valoresIniciales?.fechaFin || '',
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
  const responsableIdActual = watch('usuarioResponsableId');

  const alternarTrabajador = (usuarioId: string) => {
    setCuadrilla((prev) => {
      const nueva = prev.some((t) => t.usuarioId === usuarioId)
        ? prev.filter((t) => t.usuarioId !== usuarioId)
        : [...prev, { usuarioId, rolEnActividad: 'Operador' }];
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
  const opcionesResponsables = usuarios.map((u) => ({
    label: `${u.nombres} ${u.apellidos} (${u.rol})`,
    valor: u.id,
  }));

  const bloqueLabor = (
    <ActividadFormularioLabor
      control={control}
      errors={errors}
      tipoActual={tipoActual}
      parcelaIdActual={parcelaIdActual}
      responsableIdActual={responsableIdActual}
      opcionesParcelas={opcionesParcelas}
      opcionesResponsables={opcionesResponsables}
      onCambiarTipo={(t) => setValue('tipo', t)}
    />
  );

  const bloqueCuadrilla = (
    <View style={styles.tarjeta}>
      <ActividadFormularioCuadrilla
        usuariosDisponibles={usuarios}
        trabajadoresSeleccionados={cuadrilla}
        onAlternarTrabajador={alternarTrabajador}
        onCambiarRol={cambiarRolTrabajador}
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

      {/* Barra de Acciones Flotante Fija que Acompaña el Scroll */}
      <View style={styles.barraAccionesFlotanteWrapper}>
        <View style={styles.barraAccionesCard}>
          <Boton titulo="Cancelar" variante="secundario" onPress={onCancelar} disabled={guardando} />

          <View style={styles.grupoBotonesDerecha}>
            {tabActivo === 'labor_cuadrilla' ? (
              <Boton
                titulo="Siguiente: Insumos"
                iconoDerecha={<ArrowRight size={16} color="#FFFFFF" />}
                onPress={() => setTabActivo('insumos_notas')}
              />
            ) : (
              <Boton
                titulo="Anterior"
                variante="outline"
                iconoIzquierda={<ArrowLeft size={16} color={Palette.forestGreen} />}
                onPress={() => setTabActivo('labor_cuadrilla')}
              />
            )}

            <Boton
              titulo={modo === 'crear' ? 'Registrar Actividad' : 'Guardar Cambios'}
              variante="primario"
              onPress={handleSubmit(onSubmit)}
              cargando={guardando}
            />
          </View>
        </View>
      </View>
    </View>
  );
};
