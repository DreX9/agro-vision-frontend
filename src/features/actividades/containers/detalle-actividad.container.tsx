import React from 'react';
import { View, StyleSheet, Pressable, Text } from 'react-native';
import { useRouter, type Href } from 'expo-router';
import { ArrowLeft, Pencil } from 'lucide-react-native';
import { Palette } from '@/constants/theme';
import { AppLayout } from '@/shared/components/layout/app-layout';
import { Boton } from '@/shared/components/ui';
import { ActividadDetalleTabs } from '../components/actividad-detalle-tabs';
import { ActividadesSkeleton } from '../components/actividades-skeleton';
import { useActividadPorIdQuery } from '../api/actividades.api';

export interface DetalleActividadContainerProps {
  id: string;
}

/**
 * @description Contenedor para la ficha técnica y visualización de cuadrilla/insumos de una actividad.
 */
export const DetalleActividadContainer: React.FC<DetalleActividadContainerProps> = ({ id }) => {
  const router = useRouter();
  const { data: actividad, isLoading } = useActividadPorIdQuery(id);

  if (isLoading) {
    return (
      <AppLayout titulo="Ficha de Actividad" subtitulo="Cargando detalles de la labor...">
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
      titulo={`Ficha Técnica: ${actividad.codigo}`}
      subtitulo={actividad.titulo}
      accionEncabezado={
        <View style={styles.accionesEncabezado}>
          <Pressable
            onPress={() => router.push('/actividades' as Href)}
            style={({ pressed }) => [styles.botonVolver, pressed && styles.botonVolverPresionado]}
          >
            <ArrowLeft size={16} color={Palette.forestGreen} />
            <Text style={styles.textoVolver}>Volver al listado</Text>
          </Pressable>

          <Boton
            titulo="Editar Labor"
            variante="primario"
            iconoIzquierda={<Pencil size={16} color={Palette.white} />}
            onPress={() => router.push(`/actividades/${id}/editar` as Href)}
          />
        </View>
      }
    >
      <View style={styles.contenedor}>
        <ActividadDetalleTabs actividad={actividad} />
      </View>
    </AppLayout>
  );
};

const styles = StyleSheet.create({
  contenedor: { flex: 1, paddingBottom: 30 },
  accionesEncabezado: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  botonVolver: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: '#EBF2E5',
  },
  botonVolverPresionado: { opacity: 0.8 },
  textoVolver: { fontSize: 13, fontWeight: '600', color: Palette.forestGreen },
});
