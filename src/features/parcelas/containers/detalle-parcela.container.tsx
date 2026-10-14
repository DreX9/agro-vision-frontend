import React from 'react';
import { View, StyleSheet, Pressable, Text } from 'react-native';
import { useRouter, type Href } from 'expo-router';
import { ArrowLeft, Pencil } from 'lucide-react-native';
import { Palette } from '@/constants/theme';
import { AppLayout } from '@/shared/components/layout/app-layout';
import { Boton } from '@/shared/components/ui';
import { ParcelaDetalleTabs } from '../components/parcela-detalle-tabs';
import { ParcelasSkeleton } from '../components/parcelas-skeleton';
import { useParcelaPorIdQuery } from '../api/parcelas.api';

export interface DetalleParcelaContainerProps {
  id: string;
}

/**
 * @description Contenedor para la ficha técnica agronómica y visualización satelital de una parcela.
 */
export const DetalleParcelaContainer: React.FC<DetalleParcelaContainerProps> = ({ id }) => {
  const router = useRouter();
  const { data: parcela, isLoading } = useParcelaPorIdQuery(id);

  if (isLoading) {
    return (
      <AppLayout titulo="Ficha de Parcela" subtitulo="Cargando detalles del lote y perímetro...">
        <ParcelasSkeleton />
      </AppLayout>
    );
  }

  if (!parcela) {
    return (
      <AppLayout titulo="Parcela No Encontrada" subtitulo="El lote solicitado no existe o fue dado de baja.">
        <View style={styles.contenedorVacio}>
          <Text style={styles.textoVacio}>No se encontró la información de la parcela solicitada.</Text>
          <Boton
            titulo="Volver al listado de parcelas"
            variante="secundario"
            onPress={() => router.push('/parcelas' as Href)}
          />
        </View>
      </AppLayout>
    );
  }

  return (
    <AppLayout
      titulo={`Ficha Técnica: ${parcela.codigo}`}
      subtitulo={parcela.nombre}
      accionEncabezado={
        <View style={styles.accionesEncabezado}>
          <Pressable
            onPress={() => router.push('/parcelas' as Href)}
            style={({ pressed }) => [styles.botonVolver, pressed && styles.botonVolverPresionado]}
          >
            <ArrowLeft size={16} color={Palette.forestGreen} />
            <Text style={styles.textoVolver}>Volver al listado</Text>
          </Pressable>

          <Boton
            titulo="Editar Parcela"
            variante="primario"
            iconoIzquierda={<Pencil size={16} color={Palette.white} />}
            onPress={() => router.push(`/parcelas/${id}/editar` as Href)}
          />
        </View>
      }
    >
      <View style={styles.contenedor}>
        <ParcelaDetalleTabs parcela={parcela} />
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
