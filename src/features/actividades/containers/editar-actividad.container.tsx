import React, { useMemo } from 'react';
import { View, StyleSheet } from 'react-native';
import { useLocalSearchParams, useRouter, type Href } from 'expo-router';
import { AppLayout } from '@/shared/components/layout/app-layout';
import { ProgramarActividadFormulario } from '../components/programar-actividad-formulario';
import { ActividadesSkeleton } from '../components/actividades-skeleton';
import { useParcelasQuery } from '@/features/parcelas/api/parcelas.api';
import { useUsuariosQuery } from '@/features/usuarios/api/usuarios.api';
import { useInsumosQuery } from '../api/insumos.api';
import { useActividadPorIdQuery, useActualizarActividadMutation } from '../api/actividades.api';
import {
  type ProgramarActividadValores,
  type InsumoPlanificadoValores,
  type MaquinariaPlanificadaValores,
} from '../schemas/actividad.schema';
import {
  type TipoTurnoLabor,
  extraerJornalesRequeridos,
} from '../types/actividad.types';

/**
 * @description Contenedor orquestador para la edición de una actividad agrícola existente,
 * utilizando el formulario unificado de planificación técnica desacoplado de cuadrillas.
 */
export interface EditarActividadContainerProps {
  id?: string;
}

export const EditarActividadContainer: React.FC<EditarActividadContainerProps> = ({ id: idProp }) => {
  const router = useRouter();
  const params = useLocalSearchParams<{ id: string }>();
  const id = idProp || params.id;

  const { data: actividad, isLoading: cargandoActividad } = useActividadPorIdQuery(id);
  const { data: datosParcelas, isLoading: cargandoParcelas } = useParcelasQuery({ limite: 100 });
  const { data: datosUsuarios, isLoading: cargandoUsuarios } = useUsuariosQuery({ limite: 100 });
  const { data: insumos = [], isLoading: cargandoInsumos } = useInsumosQuery();
  const actualizarMutation = useActualizarActividadMutation();

  // Mapeo seguro de la labor existente hacia los valores iniciales del formulario desacoplado
  const valoresIniciales: Partial<ProgramarActividadValores> | undefined = useMemo(() => {
    if (!actividad) return undefined;

    const fechaSolo = actividad.fechaInicio ? actividad.fechaInicio.split('T')[0] : '';
    const fechaFinSolo = actividad.fechaFin ? actividad.fechaFin.split('T')[0] : fechaSolo;

    // Extracción del turno laboral
    let turnoInicial: TipoTurnoLabor = 'MANANA';
    if (actividad.observaciones) {
      const match = actividad.observaciones.match(/\[TURNO:(MANANA|TARDE|JORNADA_COMPLETA|PERSONALIZADO)\]/i);
      if (match && match[1]) {
        turnoInicial = match[1].toUpperCase() as TipoTurnoLabor;
      }
    } else if (actividad.fechaInicio) {
      const d = new Date(actividad.fechaInicio);
      if (!isNaN(d.getTime()) && d.getHours() >= 13) {
        turnoInicial = 'TARDE';
      }
    }

    // Extracción de notas de planificación limpias (sin tags de metadatos)
    const notasLimpia = (actividad.observaciones || '')
      .replace(/\[JORNALES_REQUERIDOS:\d+\]/gi, '')
      .replace(/\[TURNO:[A-Z_]+\]/gi, '')
      .trim() || actividad.descripcion || '';

    // Insumos consumibles planificados (fertilizantes, fitosanitarios, semillas)
    const insumosMapeados: InsumoPlanificadoValores[] = (actividad.recursos || [])
      .filter((r) => {
        const itemCatalogo = insumos.find((i) => i.id === r.insumoId);
        const cat = r.categoriaInsumo || itemCatalogo?.categoria || '';
        return cat !== 'MAQUINARIA' && cat !== 'HERRAMIENTA' && r.unidadMedida !== 'Unidad';
      })
      .map((r) => {
        const itemCatalogo = insumos.find((i) => i.id === r.insumoId);
        let dosisNum = 1.0;
        if (r.dosis) {
          const matchDosis = r.dosis.match(/([\d.]+)/);
          if (matchDosis && matchDosis[1]) {
            dosisNum = parseFloat(matchDosis[1]);
          }
        }
        return {
          insumoId: r.insumoId,
          nombreInsumo: r.nombreInsumo || itemCatalogo?.nombre || 'Insumo',
          categoria: r.categoriaInsumo || itemCatalogo?.categoria || 'FERTILIZANTE',
          dosisPorHa: dosisNum > 0 ? dosisNum : 1.0,
          unidadMedida: r.unidadMedida || itemCatalogo?.unidadMedida || 'Litros',
          totalCalculado: r.cantidadEstimada,
          diasCarencia: actividad.diasCarencia ?? null,
          horasReingreso: actividad.horasReingreso ?? null,
          notas: r.notas || null,
        };
      });

    // Maquinaria y herramientas planificadas
    const maquinariaMapeada: MaquinariaPlanificadaValores[] = (actividad.recursos || [])
      .filter((r) => {
        const itemCatalogo = insumos.find((i) => i.id === r.insumoId);
        const cat = r.categoriaInsumo || itemCatalogo?.categoria || '';
        return cat === 'MAQUINARIA' || cat === 'HERRAMIENTA' || r.unidadMedida === 'Unidad';
      })
      .map((r) => {
        const itemCatalogo = insumos.find((i) => i.id === r.insumoId);
        return {
          insumoId: r.insumoId,
          nombreEquipo: r.nombreInsumo || itemCatalogo?.nombre || 'Equipo',
          cantidad: Math.round(r.cantidadEstimada) || 1,
          unidadMedida: r.unidadMedida || itemCatalogo?.unidadMedida || 'Unidad',
          notas: r.notas || null,
        };
      });

    // Validar tipo contra las opciones permitidas
    const tiposValidos = [
      'FERTILIZACION',
      'CONTROL_PLAGAS',
      'RIEGO',
      'PODA',
      'SIEMBRA',
      'COSECHA',
      'DESHIERBE',
      'MANTENIMIENTO',
    ];
    const tipoValido = tiposValidos.includes(actividad.tipo)
      ? (actividad.tipo as ProgramarActividadValores['tipo'])
      : 'MANTENIMIENTO';

    return {
      tipo: tipoValido,
      parcelaId: actividad.parcelaId,
      sectorId: actividad.sectorId || '',
      codigo: actividad.codigo,
      titulo: actividad.titulo,
      notasPlanificacion: notasLimpia,
      fechaInicio: fechaSolo,
      fechaFin: fechaFinSolo,
      turno: turnoInicial,
      horasEstimadas: 5,
      usuarioResponsableId: actividad.usuarioResponsableId || '',
      jornalesRequeridos: extraerJornalesRequeridos(actividad),
      insumos: insumosMapeados,
      maquinaria: maquinariaMapeada,
    };
  }, [actividad, insumos]);

  const handleGuardar = (valores: ProgramarActividadValores) => {
    if (!id || !actividad) return;

    const fechaSolo = valores.fechaInicio.split('T')[0];
    const horaIni = valores.turno === 'TARDE' ? '13:00' : '07:00';
    const horaFin =
      valores.turno === 'JORNADA_COMPLETA' ? '16:00' : valores.turno === 'TARDE' ? '18:00' : '12:00';

    const fechaInicioIso = new Date(`${fechaSolo}T${horaIni}:00`).toISOString();
    const fechaFinSolo = valores.fechaFin ? valores.fechaFin.split('T')[0] : fechaSolo;
    const fechaFinIso = new Date(`${fechaFinSolo}T${horaFin}:00`).toISOString();

    // Recursos planificados: insumos + maquinaria
    const insumosMapeados = (valores.insumos || []).map((ins) => ({
      insumoId: ins.insumoId,
      cantidadEstimada: ins.totalCalculado,
      unidadMedida: ins.unidadMedida,
      dosis: `${ins.dosisPorHa} ${ins.unidadMedida}/ha`,
      notas: ins.notas || undefined,
    }));

    const maquinariaMapeada = (valores.maquinaria || []).map((maq) => ({
      insumoId: maq.insumoId,
      cantidadEstimada: maq.cantidad,
      unidadMedida: maq.unidadMedida || 'Unidad',
      notas: maq.notas || undefined,
    }));

    const recursosTotales = [...insumosMapeados, ...maquinariaMapeada];

    // Cálculo consolidado de periodos de seguridad fitosanitaria
    const maxCarencia = valores.insumos?.reduce((max, i) => Math.max(max, i.diasCarencia || 0), 0) || undefined;
    const maxReingreso = valores.insumos?.reduce((max, i) => Math.max(max, i.horasReingreso || 0), 0) || undefined;

    // Metadatos de planificación guardados de forma estructurada en observaciones
    const observacionesPlanificacion = `[JORNALES_REQUERIDOS:${valores.jornalesRequeridos}] [TURNO:${valores.turno}] ${valores.notasPlanificacion || ''}`.trim();

    // Conservar los trabajadores previamente asignados adaptando sus fechas al nuevo rango
    const trabajadoresConservados = (actividad.trabajadores || []).map((t) => ({
      usuarioId: t.usuarioId,
      rolEnActividad: t.rolEnActividad || undefined,
      horaInicio: fechaInicioIso,
      horaFin: fechaFinIso,
      horasAsignadas: valores.horasEstimadas || 5,
    }));

    actualizarMutation.mutate(
      {
        id,
        datos: {
          titulo: valores.titulo,
          tipo: valores.tipo,
          parcelaId: valores.parcelaId,
          sectorId: valores.sectorId || undefined,
          fechaInicio: fechaInicioIso,
          fechaFin: fechaFinIso,
          usuarioResponsableId: valores.usuarioResponsableId || undefined,
          descripcion: valores.notasPlanificacion || `Labor de ${valores.tipo} programada para ${valores.jornalesRequeridos} operarios.`,
          observaciones: observacionesPlanificacion,
          diasCarencia: maxCarencia,
          horasReingreso: maxReingreso,
          estado: actividad.estado,
          recursos: recursosTotales,
          trabajadores: trabajadoresConservados,
        },
      },
      {
        onSuccess: () => {
          router.replace('/actividades' as Href);
        },
      },
    );
  };

  const handleCancelar = () => {
    router.replace('/actividades' as Href);
  };

  const cargando = cargandoActividad || cargandoParcelas || cargandoUsuarios || cargandoInsumos;

  if (cargando) {
    return (
      <AppLayout titulo="Editar Actividad" subtitulo="Cargando datos de la labor agrícola...">
        <View style={styles.cargandoContenedor}>
          <ActividadesSkeleton />
        </View>
      </AppLayout>
    );
  }

  if (!actividad) {
    return (
      <AppLayout titulo="Actividad No Encontrada" subtitulo="La labor solicitada no existe o fue eliminada.">
        <View />
      </AppLayout>
    );
  }

  return (
    <AppLayout
      titulo={`Editar Planificación: ${actividad.codigo}`}
      subtitulo="Modifique los parámetros técnicos, sector, fechas e insumos de la labor agrícola"
    >
      <ProgramarActividadFormulario
        parcelas={datosParcelas?.items || []}
        usuarios={datosUsuarios?.elementos || []}
        insumos={insumos}
        modo="editar"
        textoBotonGuardar="Guardar Cambios de Planificación"
        valoresIniciales={valoresIniciales}
        guardando={actualizarMutation.isPending}
        onSubmit={handleGuardar}
        onCancelar={handleCancelar}
      />
    </AppLayout>
  );
};

const styles = StyleSheet.create({
  cargandoContenedor: {
    padding: 24,
  },
});
