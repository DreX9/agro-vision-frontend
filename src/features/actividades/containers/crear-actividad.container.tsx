import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { useRouter, type Href } from 'expo-router';
import { AppLayout } from '@/shared/components/layout/app-layout';
import { ModalConfirmacion } from '@/shared/components/ui';
import { ProgramarActividadFormulario } from '../components/programar-actividad-formulario';
import { ActividadesSkeleton } from '../components/actividades-skeleton';
import { useParcelasQuery } from '@/features/parcelas/api/parcelas.api';
import { useUsuariosQuery } from '@/features/usuarios/api/usuarios.api';
import { useInsumosQuery } from '../api/insumos.api';
import { useCrearActividadMutation } from '../api/actividades.api';
import { ProgramarActividadValores } from '../schemas/actividad.schema';
import { useAuthStore } from '@/features/autenticacion';

/**
 * @description Contenedor orquestador para la planificación y programación técnica de labores agrícolas (/actividades/nueva).
 */
export const CrearActividadContainer: React.FC = () => {
  const router = useRouter();
  const usuario = useAuthStore((s) => s.usuario);

  React.useEffect(() => {
    if (usuario && usuario.rol !== 'ADMINISTRADOR' && usuario.rol !== 'AGRONOMO') {
      router.replace('/actividades' as Href);
    }
  }, [usuario, router]);

  const { data: datosParcelas, isLoading: cargandoParcelas } = useParcelasQuery({ limite: 100 });
  const { data: datosUsuarios, isLoading: cargandoUsuarios } = useUsuariosQuery({ limite: 100 });
  const { data: insumos = [], isLoading: cargandoInsumos } = useInsumosQuery();
  const crearMutation = useCrearActividadMutation();
  const [modalError, setModalError] = useState<string | null>(null);

  const handleGuardar = (valores: ProgramarActividadValores) => {
    const fechaSolo = valores.fechaInicio.split('T')[0];
    const horaIni = valores.turno === 'TARDE' ? '13:00' : '07:00';
    const horaFin = valores.turno === 'JORNADA_COMPLETA' ? '16:00' : valores.turno === 'TARDE' ? '18:00' : '12:00';

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

    // Cálculo consolidado de periodos de seguridad
    const maxCarencia = valores.insumos?.reduce((max, i) => Math.max(max, i.diasCarencia || 0), 0) || undefined;
    const maxReingreso = valores.insumos?.reduce((max, i) => Math.max(max, i.horasReingreso || 0), 0) || undefined;

    // Metadatos de planificación guardados de forma estructurada en observaciones
    const observacionesPlanificacion = `[JORNALES_REQUERIDOS:${valores.jornalesRequeridos}] [TURNO:${valores.turno}] ${valores.notasPlanificacion || ''}`.trim();

    crearMutation.mutate(
      {
        codigo: valores.codigo || undefined,
        titulo: valores.titulo,
        tipo: valores.tipo,
        parcelaId: valores.parcelaId,
        sectorId: valores.sectorId,
        fechaInicio: fechaInicioIso,
        fechaFin: fechaFinIso,
        usuarioResponsableId: valores.usuarioResponsableId,
        descripcion: valores.notasPlanificacion || `Labor de ${valores.tipo} programada para ${valores.jornalesRequeridos} operarios.`,
        observaciones: observacionesPlanificacion,
        diasCarencia: maxCarencia,
        horasReingreso: maxReingreso,
        estado: 'PENDIENTE', // Enviado directamente con estado inicial 'PROGRAMADA' (PENDIENTE)
        recursos: recursosTotales,
        trabajadores: [], // Desacoplado: los operarios nominales se asignan en la vista operativa de cuadrillas
      },
      {
        onSuccess: () => {
          router.replace('/actividades' as Href);
        },
        onError: (err: any) => {
          const mensaje =
            err?.response?.data?.message ||
            (err?.response?.data?.error ? `${err.response.data.error}: ${err.response.data.message}` : null) ||
            err?.message ||
            'Error al programar la actividad.';
          setModalError(Array.isArray(mensaje) ? mensaje.join('\n\n') : String(mensaje));
        },
      },
    );
  };

  const handleCancelar = () => {
    router.replace('/actividades' as Href);
  };

  const cargando = cargandoParcelas || cargandoUsuarios || cargandoInsumos;

  return (
    <AppLayout
      titulo="Programar Actividad Agrícola"
      subtitulo="Planificación técnica de labor, zonificación de lote, prescripción de insumos y supervisor responsable"
    >
      {cargando ? (
        <View style={styles.cargandoContenedor}>
          <ActividadesSkeleton />
        </View>
      ) : (
        <ProgramarActividadFormulario
          parcelas={datosParcelas?.items || []}
          usuarios={datosUsuarios?.elementos || []}
          insumos={insumos}
          guardando={crearMutation.isPending}
          onSubmit={handleGuardar}
          onCancelar={handleCancelar}
        />
      )}

      {/* Modal de Error / Conflicto */}
      <ModalConfirmacion
        visible={Boolean(modalError)}
        titulo="Conflicto al Programar Actividad"
        mensaje={modalError || ''}
        textoConfirmar="Entendido"
        tipo="peligro"
        onConfirmar={() => setModalError(null)}
        onCancelar={() => setModalError(null)}
      />
    </AppLayout>
  );
};

const styles = StyleSheet.create({
  cargandoContenedor: {
    padding: 24,
  },
});
