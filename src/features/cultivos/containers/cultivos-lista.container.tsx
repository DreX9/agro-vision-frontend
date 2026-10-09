import React, { useState } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { useRouter, type Href } from 'expo-router';
import { Search, Plus } from 'lucide-react-native';
import { AppLayout } from '@/shared/components/layout/app-layout';
import { Input, Card, Boton } from '@/shared/components/ui';
import { CultivosTabla } from '../components/cultivos-tabla';
import { CultivosSkeleton } from '../components/cultivos-skeleton';
import {
  useCultivosQuery,
  useCambiarEstadoCultivoMutation,
  useEliminarCultivoMutation,
} from '../api/cultivos.api';
import { CultivoItem } from '../types/cultivo.types';

/**
 * @description Contenedor orquestador del catálogo y mantenimiento de cultivos agrícolas.
 */
export const CultivosListaContainer: React.FC = () => {
  const router = useRouter();
  const [busqueda, setBusqueda] = useState('');
  const { data: cultivos = [], isLoading, isFetching } = useCultivosQuery();
  const cambiarEstadoMutation = useCambiarEstadoCultivoMutation();
  const eliminarMutation = useEliminarCultivoMutation();

  const handleVerDetalle = (c: CultivoItem) => {
    router.push(`/cultivos/${c.id}` as Href);
  };

  const handleEditar = (c: CultivoItem) => {
    router.push(`/cultivos/${c.id}/editar` as Href);
  };

  const handleCambiarEstado = (c: CultivoItem) => {
    cambiarEstadoMutation.mutate({
      id: c.id,
      activo: !c.activo,
    });
  };

  const handleEliminar = (c: CultivoItem) => {
    eliminarMutation.mutate(c.id);
  };

  const cultivosFiltrados = cultivos.filter((c) => {
    if (!busqueda.trim()) return true;
    const termino = busqueda.toLowerCase();
    return (
      c.nombre.toLowerCase().includes(termino) ||
      (c.nombreCientifico && c.nombreCientifico.toLowerCase().includes(termino))
    );
  });

  return (
    <AppLayout
      titulo="Catálogo de Cultivos"
      subtitulo="Gestión de especies agrícolas, variedades comerciales y codificación cromática"
      accionEncabezado={
        <Boton
          titulo="Nuevo Cultivo"
          iconoIzquierda={<Plus size={16} color="#FFFFFF" />}
          variante="primario"
          onPress={() => router.push('/cultivos/nuevo' as Href)}
        />
      }
    >
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <Card estilo={styles.tarjetaFiltros}>
          <Input
            placeholder="Buscar cultivo por nombre común o científico..."
            value={busqueda}
            onChangeText={setBusqueda}
            iconoIzquierda={<Search size={18} color="#6B7280" />}
            contenedorEstilo={styles.inputBuscador}
          />
        </Card>

        {isLoading ? (
          <CultivosSkeleton />
        ) : (
          <View style={styles.contenedorTabla}>
            <CultivosTabla
              cultivos={cultivosFiltrados}
              cargando={isFetching}
              onVerDetalle={handleVerDetalle}
              onEditar={handleEditar}
              onCambiarEstado={handleCambiarEstado}
              onEliminar={handleEliminar}
            />
          </View>
        )}
      </ScrollView>
    </AppLayout>
  );
};

const styles = StyleSheet.create({
  scrollContent: {
    padding: 24,
    gap: 20,
    maxWidth: 1200,
    width: '100%',
    alignSelf: 'center',
  },
  tarjetaFiltros: {
    padding: 16,
  },
  inputBuscador: {
    flex: 1,
  },
  contenedorTabla: {
    gap: 16,
  },
});
