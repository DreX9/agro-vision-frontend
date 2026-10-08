import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useRouter, type Href } from 'expo-router';
import { AppLayout } from '@/shared/components/layout/app-layout';
import { ParcelaFormulario } from '../components/parcela-formulario';
import { useCultivosQuery } from '@/features/cultivos/api/cultivos.api';
import { useCrearParcelaMutation } from '../api/parcelas.api';
import { useAuthStore } from '@/features/autenticacion';
import { ParcelaFormValores } from '../schemas/parcela.schema';
import { ParcelasSkeleton } from '../components/parcelas-skeleton';

/**
 * @description Contenedor orquestador para el registro de una nueva parcela con delimitación satelital.
 */
export const CrearParcelaContainer: React.FC = () => {
  const router = useRouter();
  const usuarioActual = useAuthStore((s) => s.usuario);
  const { data: cultivos = [], isLoading: cargandoCultivos } = useCultivosQuery();
  const crearMutation = useCrearParcelaMutation();

  const handleGuardar = (valores: ParcelaFormValores) => {
    crearMutation.mutate(
      {
        codigo: valores.codigo || undefined,
        nombre: valores.nombre,
        areaHectareas: valores.areaHectareas,
        cultivoId: valores.cultivoId,
        variedad: valores.variedad,
        usuarioResponsableId: valores.usuarioResponsableId || usuarioActual?.id,
        ubicacion: valores.ubicacion,
        departamento: valores.departamento,
        provincia: valores.provincia,
        distrito: valores.distrito,
        estado: valores.estado,
        delimitacionGeoJson: valores.delimitacionGeoJson,
        latitudCentro: valores.latitudCentro ?? undefined,
        longitudCentro: valores.longitudCentro ?? undefined,
      },
      {
        onSuccess: () => {
          router.replace('/parcelas' as Href);
        },
      },
    );
  };

  const handleCancelar = () => {
    router.back();
  };

  return (
    <AppLayout
      titulo="Registrar Nueva Parcela"
      subtitulo="Dibuje el perímetro en el mapa satelital para calcular el área e ingrese los datos de cultivo"
    >
      {cargandoCultivos ? (
        <ParcelasSkeleton />
      ) : (
        <View style={styles.contenedor}>
          <ParcelaFormulario
            cultivos={cultivos}
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
