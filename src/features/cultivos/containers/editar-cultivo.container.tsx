import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useRouter, useLocalSearchParams, type Href } from 'expo-router';
import { AppLayout } from '@/shared/components/layout/app-layout';
import { CultivoFormulario } from '../components/cultivo-formulario';
import { useCultivosQuery, useActualizarCultivoMutation } from '../api/cultivos.api';
import { CultivoFormValores } from '../schemas/cultivo.schema';
import { CultivosSkeleton } from '../components/cultivos-skeleton';

/**
 * @description Contenedor orquestador para editar un cultivo existente en el catálogo.
 */
export const EditarCultivoContainer: React.FC = () => {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: cultivos = [], isLoading } = useCultivosQuery();
  const actualizarMutation = useActualizarCultivoMutation();

  const cultivo = cultivos.find((c) => c.id === id);

  const handleGuardar = (valores: CultivoFormValores) => {
    if (!id) return;
    actualizarMutation.mutate(
      {
        id,
        nombre: valores.nombre,
        nombreCientifico: valores.nombreCientifico || undefined,
        variedadesDefault: valores.variedadesDefault,
        colorHex: valores.colorHex,
        activo: valores.activo,
      },
      {
        onSuccess: () => {
          router.replace('/cultivos' as Href);
        },
      },
    );
  };

  const handleCancelar = () => {
    router.back();
  };

  return (
    <AppLayout
      titulo="Editar Cultivo"
      subtitulo={cultivo ? `Modificando ${cultivo.nombre}` : 'Cargando cultivo...'}
    >
      <View style={styles.contenedor}>
        {isLoading || !cultivo ? (
          <CultivosSkeleton />
        ) : (
          <CultivoFormulario
            modo="editar"
            valoresIniciales={{
              nombre: cultivo.nombre,
              nombreCientifico: cultivo.nombreCientifico || '',
              variedadesDefault: cultivo.variedadesDefault,
              colorHex: cultivo.colorHex || '#2E7D32',
              activo: cultivo.activo,
            }}
            guardando={actualizarMutation.isPending}
            onSubmit={handleGuardar}
            onCancelar={handleCancelar}
          />
        )}
      </View>
    </AppLayout>
  );
};

const styles = StyleSheet.create({
  contenedor: { flex: 1, paddingBottom: 24 },
});
