import React, { useState } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { useRouter, type Href } from 'expo-router';
import { Plus, Search } from 'lucide-react-native';
import { Palette } from '@/constants/theme';
import { AppLayout } from '@/shared/components/layout/app-layout';
import { Boton, Input, Card } from '@/shared/components/ui';
import { Paginacion } from '@/shared/components/ui/paginacion';
import { ActividadesTabla } from '../components/actividades-tabla';
import { ActividadesSkeleton } from '../components/actividades-skeleton';
import {
  useActividadesQuery,
  useCambiarEstadoActividadMutation,
  useEliminarActividadMutation,
} from '../api/actividades.api';
import { ActividadItem, EstadoActividadTipo } from '../types/actividad.types';

/**
 * @description Contenedor orquestador de la lista de actividades agrícolas con filtros y paginación.
 */
export const ActividadesListaContainer: React.FC = () => {
  const router = useRouter();
  const [busqueda, setBusqueda] = useState('');
  const [pagina, setPagina] = useState(1);
  const [limite, setLimite] = useState(10);

  const { data, isLoading, isFetching } = useActividadesQuery({
    busqueda: busqueda.trim() || undefined,
    pagina,
    limite,
  });

  const cambiarEstadoMutation = useCambiarEstadoActividadMutation();
  const eliminarMutation = useEliminarActividadMutation();

  const handleCambiarEstado = (actividad: ActividadItem) => {
    const ordenEstados: EstadoActividadTipo[] = [
      'PENDIENTE',
      'EN_PROGRESO',
      'COMPLETADA',
      'CANCELADA',
    ];
    const indiceActual = ordenEstados.indexOf(actividad.estado);
    const siguienteEstado = ordenEstados[(indiceActual + 1) % ordenEstados.length];

    cambiarEstadoMutation.mutate({
      id: actividad.id,
      estado: siguienteEstado,
    });
  };

  const handleVerDetalle = (actividad: ActividadItem) => {
    router.push(`/actividades/${actividad.id}` as Href);
  };

  const handleEditar = (actividad: ActividadItem) => {
    router.push(`/actividades/${actividad.id}/editar` as Href);
  };

  const handleEliminar = (actividad: ActividadItem) => {
    eliminarMutation.mutate(actividad.id);
  };

  return (
    <AppLayout
      titulo="Actividades Agrícolas"
      subtitulo="Planificación de labores de campo, asignación de cuadrillas y control de insumos"
      accionEncabezado={
        <Boton
          titulo="Nueva Actividad"
          variante="primario"
          iconoIzquierda={<Plus size={18} color={Palette.white} />}
          onPress={() => router.push('/actividades/nuevo' as Href)}
        />
      }
    >
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <Card estilo={styles.tarjetaFiltros}>
          <Input
            placeholder="Buscar por labor, código (ACT-001) o descripción..."
            value={busqueda}
            onChangeText={(texto) => {
              setBusqueda(texto);
              setPagina(1);
            }}
            iconoIzquierda={<Search size={18} color="#6B7280" />}
            contenedorEstilo={styles.inputBuscador}
          />
        </Card>

        {isLoading ? (
          <ActividadesSkeleton />
        ) : (
          <View style={styles.contenedorTabla}>
            <ActividadesTabla
              actividades={data?.items || []}
              cargando={isFetching}
              onVerDetalle={handleVerDetalle}
              onEditar={handleEditar}
              onCambiarEstado={handleCambiarEstado}
              onEliminar={handleEliminar}
            />

            {data && data.total > 0 && (
              <Paginacion
                paginaActual={data.pagina}
                totalPaginas={data.totalPaginas}
                totalElementos={data.total}
                elementosPorPagina={limite}
                opcionesLimite={[10, 20, 30]}
                onCambiarPagina={(nuevaPagina: number) => setPagina(nuevaPagina)}
                onCambiarLimite={(nuevoLimite: number) => {
                  setLimite(nuevoLimite);
                  setPagina(1);
                }}
              />
            )}
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
  tarjetaFiltros: { padding: 16 },
  inputBuscador: { flex: 1 },
  contenedorTabla: { gap: 16 },
});
