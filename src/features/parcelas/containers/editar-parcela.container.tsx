import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useRouter, type Href } from 'expo-router';
import { AppLayout } from '@/shared/components/layout/app-layout';
import { ParcelaFormulario } from '../components/parcela-formulario';
import { useCultivosQuery } from '@/features/cultivos/api/cultivos.api';
import { useParcelaPorIdQuery, useActualizarParcelaMutation } from '../api/parcelas.api';
import { ParcelaFormValores } from '../schemas/parcela.schema';
import { ParcelasSkeleton } from '../components/parcelas-skeleton';
import { type CoordenadaPunto } from '@/shared/utils/geometria';

export interface EditarParcelaContainerProps {
  id: string;
}

/**
 * @description Contenedor orquestador para la edición de parcelas existentes y ajuste de perímetro.
 */
export const EditarParcelaContainer: React.FC<EditarParcelaContainerProps> = ({ id }) => {
  const router = useRouter();
  const { data: parcela, isLoading: cargandoParcela } = useParcelaPorIdQuery(id);
  const { data: cultivos = [], isLoading: cargandoCultivos } = useCultivosQuery();
  const actualizarMutation = useActualizarParcelaMutation();

  const handleGuardar = (valores: ParcelaFormValores) => {
    actualizarMutation.mutate(
      {
        id,
        datos: {
          nombre: valores.nombre,
          areaHectareas: valores.areaHectareas,
          cultivoId: valores.cultivoId,
          variedad: valores.variedad,
          usuarioResponsableId: valores.usuarioResponsableId || undefined,
          ubicacion: valores.ubicacion,
          departamento: valores.departamento,
          provincia: valores.provincia,
          distrito: valores.distrito,
          estado: valores.estado,
          delimitacionGeoJson: valores.delimitacionGeoJson,
          latitudCentro: valores.latitudCentro ?? undefined,
          longitudCentro: valores.longitudCentro ?? undefined,
        },
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

  if (cargandoParcela || cargandoCultivos) {
    return (
      <AppLayout titulo="Editar Parcela" subtitulo="Cargando información del lote...">
        <ParcelasSkeleton />
      </AppLayout>
    );
  }

  if (!parcela) {
    return (
      <AppLayout titulo="Parcela No Encontrada" subtitulo="El lote solicitado no existe o fue eliminado.">
        <View />
      </AppLayout>
    );
  }

  const puntosExistentes: CoordenadaPunto[] = Array.isArray(parcela.delimitacionGeoJson)
    ? (parcela.delimitacionGeoJson as CoordenadaPunto[])
    : [];

  return (
    <AppLayout
      titulo={`Editar Parcela: ${parcela.codigo} - ${parcela.nombre}`}
      subtitulo="Modifique el perímetro, cultivo o datos agronómicos del lote"
    >
      <View style={styles.contenedor}>
        <ParcelaFormulario
          cultivos={cultivos}
          modo="editar"
          valoresIniciales={{
            codigo: parcela.codigo,
            nombre: parcela.nombre,
            areaHectareas: Number(parcela.areaHectareas),
            cultivoId: parcela.cultivoId,
            variedad: parcela.variedad || '',
            ubicacion: parcela.ubicacion || '',
            departamento: parcela.departamento || '',
            provincia: parcela.provincia || '',
            distrito: parcela.distrito || '',
            estado: parcela.estado,
            delimitacionGeoJson: parcela.delimitacionGeoJson,
            latitudCentro: parcela.latitudCentro,
            longitudCentro: parcela.longitudCentro,
          }}
          puntosIniciales={puntosExistentes}
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
