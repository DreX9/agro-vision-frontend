import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useRouter, type Href } from 'expo-router';
import { AppLayout } from '@/shared/components/layout/app-layout';
import { ActividadFormulario } from '../components/actividad-formulario';
import { ActividadesSkeleton } from '../components/actividades-skeleton';
import { useParcelasQuery } from '@/features/parcelas/api/parcelas.api';
import { useUsuariosQuery } from '@/features/usuarios/api/usuarios.api';
import { useInsumosQuery } from '../api/insumos.api';
import { useActividadPorIdQuery, useActualizarActividadMutation } from '../api/actividades.api';
import { ActividadFormValores } from '../schemas/actividad.schema';

export interface EditarActividadContainerProps {
  id: string;
}

/**
 * @description Contenedor orquestador para editar una actividad agrícola existente.
 */
export const EditarActividadContainer: React.FC<EditarActividadContainerProps> = ({ id }) => {
  const router = useRouter();
  const { data: actividad, isLoading: cargandoActividad } = useActividadPorIdQuery(id);
  const { data: datosParcelas, isLoading: cargandoParcelas } = useParcelasQuery({ limite: 100 });
  const { data: datosUsuarios, isLoading: cargandoUsuarios } = useUsuariosQuery({ limite: 100 });
  const { data: insumos = [], isLoading: cargandoInsumos } = useInsumosQuery();
  const actualizarMutation = useActualizarActividadMutation();

  const handleGuardar = (valores: ActividadFormValores) => {
    actualizarMutation.mutate(
      {
        id,
        datos: {
          titulo: valores.titulo,
          tipo: valores.tipo,
          parcelaId: valores.parcelaId,
          fechaInicio: valores.fechaInicio,
          fechaFin: valores.fechaFin || undefined,
          usuarioResponsableId: valores.usuarioResponsableId || undefined,
          descripcion: valores.descripcion || undefined,
          observaciones: valores.observaciones || undefined,
          estado: valores.estado,
          trabajadores: valores.trabajadores,
          recursos: valores.recursos,
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
    router.back();
  };

  const cargando = cargandoActividad || cargandoParcelas || cargandoUsuarios || cargandoInsumos;

  if (cargando) {
    return (
      <AppLayout titulo="Editar Actividad" subtitulo="Cargando labor agrícola...">
        <ActividadesSkeleton />
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
      titulo={`Editar Actividad: ${actividad.codigo} - ${actividad.titulo}`}
      subtitulo="Modifique los datos, cuadrilla asignada o insumos requeridos"
    >
      <View style={styles.contenedor}>
        <ActividadFormulario
          parcelas={datosParcelas?.items || []}
          usuarios={datosUsuarios?.elementos || []}
          insumos={insumos}
          modo="editar"
          valoresIniciales={{
            codigo: actividad.codigo,
            titulo: actividad.titulo,
            tipo: actividad.tipo,
            parcelaId: actividad.parcelaId,
            fechaInicio: actividad.fechaInicio.split('T')[0],
            fechaFin: actividad.fechaFin ? actividad.fechaFin.split('T')[0] : '',
            usuarioResponsableId: actividad.usuarioResponsableId || '',
            descripcion: actividad.descripcion || '',
            observaciones: actividad.observaciones || '',
            estado: actividad.estado,
            trabajadores: actividad.trabajadores.map((t) => ({
              usuarioId: t.usuarioId,
              rolEnActividad: t.rolEnActividad || undefined,
            })),
            recursos: actividad.recursos.map((r) => ({
              insumoId: r.insumoId,
              cantidadEstimada: r.cantidadEstimada,
              unidadMedida: r.unidadMedida,
              notas: r.notas || undefined,
            })),
          }}
          guardando={actualizarMutation.isPending}
          onSubmit={handleGuardar}
          onCancelar={handleCancelar}
        />
      </View>
    </AppLayout>
  );
};

const styles = StyleSheet.create({
  contenedor: { flex: 1, paddingBottom: 30 },
});
