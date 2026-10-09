import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useRouter, type Href } from 'expo-router';
import { AppLayout } from '@/shared/components/layout/app-layout';
import { ActividadFormulario } from '../components/actividad-formulario';
import { ActividadesSkeleton } from '../components/actividades-skeleton';
import { useParcelasQuery } from '@/features/parcelas/api/parcelas.api';
import { useUsuariosQuery } from '@/features/usuarios/api/usuarios.api';
import { useInsumosQuery } from '../api/insumos.api';
import { useCrearActividadMutation } from '../api/actividades.api';
import { ActividadFormValores } from '../schemas/actividad.schema';

/**
 * @description Contenedor orquestador para el registro de una nueva actividad agrícola.
 */
export const CrearActividadContainer: React.FC = () => {
  const router = useRouter();
  const { data: datosParcelas, isLoading: cargandoParcelas } = useParcelasQuery({ limite: 100 });
  const { data: datosUsuarios, isLoading: cargandoUsuarios } = useUsuariosQuery({ limite: 100 });
  const { data: insumos = [], isLoading: cargandoInsumos } = useInsumosQuery();
  const crearMutation = useCrearActividadMutation();

  const handleGuardar = (valores: ActividadFormValores) => {
    crearMutation.mutate(
      {
        codigo: valores.codigo || undefined,
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

  const cargando = cargandoParcelas || cargandoUsuarios || cargandoInsumos;

  return (
    <AppLayout
      titulo="Programar Nueva Actividad Agrícola"
      subtitulo="Asigne la labor a una parcela, configure la cuadrilla de operarios y planifique los insumos requeridos"
    >
      {cargando ? (
        <ActividadesSkeleton />
      ) : (
        <View style={styles.contenedor}>
          <ActividadFormulario
            parcelas={datosParcelas?.items || []}
            usuarios={datosUsuarios?.elementos || []}
            insumos={insumos}
            modo="crear"
            guardando={crearMutation.isPending}
            onSubmit={handleGuardar}
            onCancelar={handleCancelar}
          />
        </View>
      )}
    </AppLayout>
  );
};

const styles = StyleSheet.create({
  contenedor: { flex: 1, paddingBottom: 30 },
});
