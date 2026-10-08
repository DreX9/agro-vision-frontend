import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useRouter, type Href } from 'expo-router';
import { AppLayout } from '@/shared/components/layout/app-layout';
import { CultivoFormulario } from '../components/cultivo-formulario';
import { useCrearCultivoMutation } from '../api/cultivos.api';
import { CultivoFormValores } from '../schemas/cultivo.schema';

/**
 * @description Contenedor orquestador para el registro de un nuevo cultivo en el catálogo del sistema.
 */
export const CrearCultivoContainer: React.FC = () => {
  const router = useRouter();
  const crearMutation = useCrearCultivoMutation();

  const handleGuardar = (valores: CultivoFormValores) => {
    crearMutation.mutate(
      {
        nombre: valores.nombre,
        nombreCientifico: valores.nombreCientifico || undefined,
        variedadesDefault: valores.variedadesDefault,
        colorHex: valores.colorHex,
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
      titulo="Registrar Nuevo Cultivo"
      subtitulo="Ingrese los datos de la especie agrícola, variedades y color representativo"
    >
      <View style={styles.contenedor}>
        <CultivoFormulario
          modo="crear"
          guardando={crearMutation.isPending}
          onSubmit={handleGuardar}
          onCancelar={handleCancelar}
        />
      </View>
    </AppLayout>
  );
};

const styles = StyleSheet.create({
  contenedor: { flex: 1, paddingBottom: 24 },
});
