import React from 'react';
import { View, StyleSheet, Pressable, Text } from 'react-native';
import { useRouter, type Href } from 'expo-router';
import { ArrowLeft, Pencil } from 'lucide-react-native';
import { Palette } from '@/constants/theme';
import { AppLayout } from '@/shared/components/layout/app-layout';
import { Boton } from '@/shared/components/ui';
import { CultivoDetalleFicha } from '../components/cultivo-detalle-ficha';
import { CultivosSkeleton } from '../components/cultivos-skeleton';
import { useCultivoPorIdQuery } from '../api/cultivos.api';

export interface DetalleCultivoContainerProps {
  id: string;
}

/**
 * @description Contenedor para la ficha técnica de un cultivo en el catálogo.
 */
export const DetalleCultivoContainer: React.FC<DetalleCultivoContainerProps> = ({ id }) => {
  const router = useRouter();
  const { data: cultivo, isLoading } = useCultivoPorIdQuery(id);

  if (isLoading) {
    return (
      <AppLayout titulo="Ficha de Cultivo" subtitulo="Cargando especificaciones botánicas...">
        <CultivosSkeleton />
      </AppLayout>
    );
  }

  if (!cultivo) {
    return (
      <AppLayout titulo="Cultivo No Encontrado" subtitulo="El cultivo solicitado no existe o fue dado de baja.">
        <View style={styles.contenedorVacio}>
          <Text style={styles.textoVacio}>No se encontró la información del cultivo solicitado.</Text>
          <Boton
            titulo="Volver al catálogo"
            variante="secundario"
            onPress={() => router.push('/cultivos' as Href)}
          />
        </View>
      </AppLayout>
    );
  }

  return (
    <AppLayout
      titulo={`Ficha de Cultivo: ${cultivo.nombre}`}
      subtitulo={cultivo.nombreCientifico || 'Especie agrícola catalogada'}
      accionEncabezado={
        <View style={styles.accionesEncabezado}>
          <Pressable
            onPress={() => router.push('/cultivos' as Href)}
            style={({ pressed }) => [styles.botonVolver, pressed && styles.botonVolverPresionado]}
          >
            <ArrowLeft size={16} color={Palette.forestGreen} />
            <Text style={styles.textoVolver}>Volver al catálogo</Text>
          </Pressable>

          <Boton
            titulo="Editar Cultivo"
            variante="primario"
            iconoIzquierda={<Pencil size={16} color={Palette.white} />}
            onPress={() => router.push(`/cultivos/${id}/editar` as Href)}
          />
        </View>
      }
    >
      <View style={styles.contenedor}>
        <CultivoDetalleFicha cultivo={cultivo} />
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
  contenedorVacio: { padding: 30, alignItems: 'center', gap: 16 },
  textoVacio: { fontSize: 14, color: '#6B7280' },
});
