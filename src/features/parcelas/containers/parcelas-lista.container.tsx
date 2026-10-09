import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { useRouter, type Href } from 'expo-router';
import { Plus, Search, ListTree, PlusCircle, Sprout, Map as MapIcon } from 'lucide-react-native';
import { Palette } from '@/constants/theme';
import { AppLayout } from '@/shared/components/layout/app-layout';
import { Boton, Input, Card } from '@/shared/components/ui';
import { Paginacion } from '@/shared/components/ui/paginacion';
import { ParcelasTabla } from '../components/parcelas-tabla';
import { ParcelasSkeleton } from '../components/parcelas-skeleton';
import { MapaGeneralParcelas } from '@/shared/components/mapa';
import {
  useParcelasQuery,
  useCambiarEstadoParcelaMutation,
  useEliminarParcelaMutation,
} from '../api/parcelas.api';
import { ParcelaItem, EstadoParcelaTipo } from '../types/parcela.types';

/**
 * @description Contenedor orquestador del listado de parcelas con soporte para vista en tabla y vista satelital GIS multicapa.
 */
export const ParcelasListaContainer: React.FC = () => {
  const router = useRouter();
  const [vistaModo, setVistaModo] = useState<'tabla' | 'mapa'>('tabla');
  const [busqueda, setBusqueda] = useState('');
  const [pagina, setPagina] = useState(1);
  const [limite, setLimite] = useState(10);

  const { data, isLoading, isFetching } = useParcelasQuery({
    busqueda: busqueda.trim() || undefined,
    pagina,
    limite,
  });

  // Consulta para el visor satelital general (carga hasta 100 parcelas georreferenciadas)
  const { data: todasLasParcelasData } = useParcelasQuery({
    limite: 100,
  });

  const cambiarEstadoMutation = useCambiarEstadoParcelaMutation();
  const eliminarMutation = useEliminarParcelaMutation();

  const handleCambiarEstado = (parcela: ParcelaItem) => {
    const ordenEstados: EstadoParcelaTipo[] = [
      'ACTIVA',
      'EN_PREPARACION',
      'EN_DESCANSO',
      'COSECHADA',
      'INACTIVA',
    ];
    const indiceActual = ordenEstados.indexOf(parcela.estado);
    const siguienteEstado = ordenEstados[(indiceActual + 1) % ordenEstados.length];

    cambiarEstadoMutation.mutate({
      id: parcela.id,
      estado: siguienteEstado,
    });
  };

  const handleVerDetalle = (parcela: ParcelaItem) => {
    router.push(`/parcelas/${parcela.id}` as Href);
  };

  const handleEditar = (parcela: ParcelaItem) => {
    router.push(`/parcelas/${parcela.id}/editar` as Href);
  };

  const handleEliminar = (parcela: ParcelaItem) => {
    eliminarMutation.mutate(parcela.id);
  };

  return (
    <AppLayout
      titulo="Gestión de Parcelas"
      subtitulo="Delimitación geoespacial, cálculo de hectáreas y monitoreo agronómico de lotes"
      accionEncabezado={
        <Boton
          titulo="Nueva Parcela"
          variante="primario"
          iconoIzquierda={<Plus size={18} color={Palette.white} />}
          onPress={() => router.push('/parcelas/nuevo' as Href)}
        />
      }
    >
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Barra de Submódulos y Vistas */}
        <View style={styles.barraSubmodulos}>
          <Pressable
            onPress={() => setVistaModo('tabla')}
            style={[styles.tabSubmodulo, vistaModo === 'tabla' && styles.tabSubmoduloActivo]}
          >
            <ListTree size={16} color={vistaModo === 'tabla' ? Palette.forestGreen : '#6B7280'} />
            <Text
              style={[
                styles.textoTabSubmodulo,
                vistaModo === 'tabla' && styles.textoTabSubmoduloActivo,
              ]}
            >
              Vista Tabla ({data?.total ?? 0})
            </Text>
          </Pressable>

          <Pressable
            onPress={() => setVistaModo('mapa')}
            style={[styles.tabSubmodulo, vistaModo === 'mapa' && styles.tabSubmoduloActivo]}
          >
            <MapIcon size={16} color={vistaModo === 'mapa' ? Palette.forestGreen : '#6B7280'} />
            <Text
              style={[
                styles.textoTabSubmodulo,
                vistaModo === 'mapa' && styles.textoTabSubmoduloActivo,
              ]}
            >
              Mapa Satelital Completo
            </Text>
          </Pressable>

          <Pressable
            onPress={() => router.push('/parcelas/nuevo' as Href)}
            style={({ pressed }) => [styles.tabSubmodulo, pressed && styles.tabSubmoduloPresionado]}
          >
            <PlusCircle size={16} color="#6B7280" />
            <Text style={styles.textoTabSubmodulo}>Registrar parcela</Text>
          </Pressable>

          <Pressable
            onPress={() => router.push('/cultivos/nuevo' as Href)}
            style={({ pressed }) => [styles.tabSubmodulo, pressed && styles.tabSubmoduloPresionado]}
          >
            <Sprout size={16} color="#6B7280" />
            <Text style={styles.textoTabSubmodulo}>Registrar cultivo</Text>
          </Pressable>
        </View>

        {/* Vista Alternada: Modo Mapa Satelital o Modo Tabla */}
        {vistaModo === 'mapa' ? (
          <MapaGeneralParcelas
            parcelas={todasLasParcelasData?.items || data?.items || []}
            altura={620}
            titulo="Catastro Geoespacial Integral de Predios"
            subtitulo="Visualización simultánea de todas las parcelas con código, área, cultivo y delimitación perimetral"
          />
        ) : (
          <>
            {/* Barra de Búsqueda y Filtros con Ancho Completo */}
            <Card estilo={styles.tarjetaFiltros}>
              <View style={styles.buscadorWrapper}>
                <Input
                  placeholder="Buscar por código, nombre de lote o valle..."
                  value={busqueda}
                  onChangeText={(texto) => {
                    setBusqueda(texto);
                    setPagina(1);
                  }}
                  iconoIzquierda={<Search size={18} color="#6B7280" />}
                  contenedorEstilo={styles.inputBuscador}
                />
              </View>
            </Card>

            {/* Tabla de Parcelas con Ancho Completo y Paginación */}
            {isLoading ? (
              <ParcelasSkeleton />
            ) : (
              <View style={styles.contenedorTabla}>
                <ParcelasTabla
                  parcelas={data?.items || []}
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
          </>
        )}
      </ScrollView>
    </AppLayout>
  );
};

const styles = StyleSheet.create({
  scrollContent: {
    paddingHorizontal: 16,
    paddingVertical: 18,
    gap: 16,
    width: '100%',
  },
  barraSubmodulos: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FFFFFF',
    padding: 6,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#D0DEC8',
    alignSelf: 'flex-start',
  },
  tabSubmodulo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 8,
  },
  tabSubmoduloActivo: {
    backgroundColor: '#EDF4E8',
    borderWidth: 1,
    borderColor: '#C3D8B8',
  },
  tabSubmoduloPresionado: {
    opacity: 0.7,
  },
  textoTabSubmodulo: {
    fontSize: 13,
    fontWeight: '600',
    color: '#4B5563',
  },
  textoTabSubmoduloActivo: {
    color: Palette.forestGreen,
    fontWeight: '700',
  },
  tarjetaFiltros: {
    padding: 14,
    width: '100%',
  },
  buscadorWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
  },
  inputBuscador: {
    flex: 1,
    marginBottom: 0,
  },
  contenedorTabla: {
    width: '100%',
    gap: 16,
  },
});

