import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { useRouter, type Href } from 'expo-router';
import { Plus, Search, UserCheck, ListFilter, LayoutGrid, List } from 'lucide-react-native';
import { Palette } from '@/constants/theme';
import { AppLayout } from '@/shared/components/layout/app-layout';
import { Boton, Input, Card, ModalConfirmacion, type DetalleConfirmacion } from '@/shared/components/ui';
import { Paginacion } from '@/shared/components/ui/paginacion';
import { ActividadesTabla } from '../components/actividades-tabla';
import { ActividadesOperadorLista } from '../components/actividades-operador-lista';
import { ActividadesSkeleton } from '../components/actividades-skeleton';
import {
  useActividadesQuery,
  useCambiarEstadoActividadMutation,
  useEliminarActividadMutation,
} from '../api/actividades.api';
import { ActividadItem, EstadoActividadTipo } from '../types/actividad.types';
import { useAuthStore } from '@/features/autenticacion';

/**
 * @description Contenedor orquestador de la lista de actividades agrícolas con filtros y paginación según RBAC.
 */
export const ActividadesListaContainer: React.FC = () => {
  const router = useRouter();
  const usuario = useAuthStore((s) => s.usuario);
  const rol = usuario?.rol || 'OPERADOR';
  const esAdmin = rol === 'ADMINISTRADOR';
  const esAgronomo = rol === 'AGRONOMO';
  const esSupervisor = rol === 'SUPERVISOR';
  const esOperador = rol === 'OPERADOR';
  const puedeCrear = esAdmin || esAgronomo;

  const [busqueda, setBusqueda] = useState('');
  const [pagina, setPagina] = useState(1);
  const [limite, setLimite] = useState(10);
  const [soloMisLabores, setSoloMisLabores] = useState(esSupervisor);
  const [modoVista, setModoVista] = useState<'tarjetas' | 'tabla'>(
    esOperador ? 'tarjetas' : 'tabla',
  );
  const [actividadAEliminar, setActividadAEliminar] = useState<ActividadItem | null>(null);
  const [modalExitoEliminacion, setModalExitoEliminacion] = useState<string | null>(null);

  const { data, isLoading, isFetching } = useActividadesQuery({
    busqueda: busqueda.trim() || undefined,
    usuarioResponsableId: soloMisLabores && usuario?.id ? usuario.id : undefined,
    pagina,
    limite,
  });

  const cambiarEstadoMutation = useCambiarEstadoActividadMutation();
  const eliminarMutation = useEliminarActividadMutation();

  const handleCambiarEstado = (
    actividad: ActividadItem,
    nuevoEstado?: EstadoActividadTipo,
  ) => {
    const estadoDestino =
      nuevoEstado ||
      (() => {
        const ordenEstados: EstadoActividadTipo[] = [
          'PENDIENTE',
          'EN_PROGRESO',
          'COMPLETADA',
          'CANCELADA',
        ];
        const indiceActual = ordenEstados.indexOf(actividad.estado);
        return ordenEstados[(indiceActual + 1) % ordenEstados.length];
      })();

    cambiarEstadoMutation.mutate({
      id: actividad.id,
      estado: estadoDestino,
    });
  };

  const handleVerDetalle = (actividad: ActividadItem) => {
    router.push(`/actividades/${actividad.id}` as Href);
  };

  const handleEditar = (actividad: ActividadItem) => {
    router.push(`/actividades/${actividad.id}/editar` as Href);
  };

  const handleEliminar = (actividad: ActividadItem) => {
    if (!esAdmin) return;
    setActividadAEliminar(actividad);
  };

  const confirmarEliminar = () => {
    if (!actividadAEliminar || !esAdmin) return;
    const act = actividadAEliminar;

    eliminarMutation.mutate(act.id, {
      onSuccess: () => {
        setActividadAEliminar(null);
        setModalExitoEliminacion(
          `La actividad "${act.codigo} - ${act.titulo}" ha sido eliminada correctamente.`,
        );
      },
    });
  };

  const subtituloSegunRol = esOperador
    ? 'Tus labores de campo del turno, checklist de tareas, reporte de novedades y punto de avance GPS'
    : esSupervisor
      ? 'Gestión de cuadrillas de operarios, asignación de turnos y control de avance en terreno'
      : esAgronomo
        ? 'Planificación y prescripción agronómica de riego, fertilización, poda y fitosanidad'
        : 'Planificación integral de labores de campo, asignación de cuadrillas y control de insumos';

  return (
    <AppLayout
      titulo={esOperador ? 'Mis Labores de Campo' : 'Actividades Agrícolas'}
      subtitulo={subtituloSegunRol}
      accionEncabezado={
        puedeCrear ? (
          <Boton
            titulo="Nueva Actividad"
            variante="primario"
            iconoIzquierda={<Plus size={18} color={Palette.white} />}
            onPress={() => router.push('/actividades/nuevo' as Href)}
          />
        ) : null
      }
    >
      <ScrollView
        style={styles.scroll}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
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

          <View style={styles.filaFiltrosInferior}>
            {/* Selector de Modo de Vista */}
            <View style={styles.filaSelectorVista}>
              <Pressable
                onPress={() => setModoVista('tarjetas')}
                style={[
                  styles.botonModoVista,
                  modoVista === 'tarjetas' && styles.botonModoVistaActivo,
                ]}
              >
                <LayoutGrid
                  size={15}
                  color={modoVista === 'tarjetas' ? Palette.white : '#4B5563'}
                />
                <Text
                  style={[
                    styles.textoModoVista,
                    modoVista === 'tarjetas' && styles.textoModoVistaActivo,
                  ]}
                >
                  Tarjetas de Campo
                </Text>
              </Pressable>

              <Pressable
                onPress={() => setModoVista('tabla')}
                style={[
                  styles.botonModoVista,
                  modoVista === 'tabla' && styles.botonModoVistaActivo,
                ]}
              >
                <List
                  size={15}
                  color={modoVista === 'tabla' ? Palette.white : '#4B5563'}
                />
                <Text
                  style={[
                    styles.textoModoVista,
                    modoVista === 'tabla' && styles.textoModoVistaActivo,
                  ]}
                >
                  Tabla Completa
                </Text>
              </Pressable>
            </View>

            {/* Filtro rápido para Supervisor / Responsable */}
            {esSupervisor && (
              <View style={styles.filaFiltrosRoles}>
                <Pressable
                  onPress={() => {
                    setSoloMisLabores(true);
                    setPagina(1);
                  }}
                  style={[styles.botonFiltroRol, soloMisLabores && styles.botonFiltroRolActivo]}
                >
                  <UserCheck size={15} color={soloMisLabores ? Palette.white : Palette.forestGreen} />
                  <Text
                    style={[
                      styles.textoFiltroRol,
                      soloMisLabores && styles.textoFiltroRolActivo,
                    ]}
                  >
                    Mis labores a cargo
                  </Text>
                </Pressable>

                <Pressable
                  onPress={() => {
                    setSoloMisLabores(false);
                    setPagina(1);
                  }}
                  style={[styles.botonFiltroRol, !soloMisLabores && styles.botonFiltroRolActivo]}
                >
                  <ListFilter size={15} color={!soloMisLabores ? Palette.white : '#4B5563'} />
                  <Text
                    style={[
                      styles.textoFiltroRol,
                      !soloMisLabores && styles.textoFiltroRolActivo,
                    ]}
                  >
                    Todas las labores
                  </Text>
                </Pressable>
              </View>
            )}
          </View>
        </Card>

        {isLoading ? (
          <ActividadesSkeleton />
        ) : (
          <View style={styles.contenedorTabla}>
            {modoVista === 'tarjetas' ? (
              <ActividadesOperadorLista
                actividades={data?.items || []}
                cargando={isFetching}
                onVerDetalle={handleVerDetalle}
                onCambiarEstado={handleCambiarEstado}
              />
            ) : (
              <ActividadesTabla
                actividades={data?.items || []}
                cargando={isFetching}
                onVerDetalle={handleVerDetalle}
                onEditar={handleEditar}
                onCambiarEstado={handleCambiarEstado}
                onEliminar={esAdmin ? handleEliminar : undefined}
                idActividadCambiandoEstado={
                  cambiarEstadoMutation.isPending
                    ? (cambiarEstadoMutation.variables as { id: string })?.id
                    : undefined
                }
              />
            )}

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

      {/* Modal de Confirmación para Eliminar Actividad */}
      <ModalConfirmacion
        visible={Boolean(actividadAEliminar)}
        tipo="peligro"
        titulo="¿Eliminar Actividad Agrícola?"
        mensaje={`Está a punto de eliminar la actividad "${actividadAEliminar?.titulo}". Los recursos asignados e insumos serán desvinculados.`}
        detalles={
          actividadAEliminar
            ? [
                {
                  etiqueta: 'Código de Labor',
                  valor: actividadAEliminar.codigo || '-',
                },
                {
                  etiqueta: 'Tipo de Actividad',
                  valor: actividadAEliminar.tipo,
                },
                {
                  etiqueta: 'Parcela',
                  valor: actividadAEliminar.parcelaNombre || 'No asignada',
                },
                {
                  etiqueta: 'Estado Actual',
                  valor: actividadAEliminar.estado,
                },
              ]
            : undefined
        }
        textoConfirmar="Eliminar Actividad"
        textoCancelar="Cancelar"
        cargando={eliminarMutation.isPending}
        onConfirmar={confirmarEliminar}
        onCancelar={() => setActividadAEliminar(null)}
      />

      {/* Modal Informativo de Éxito */}
      <ModalConfirmacion
        visible={Boolean(modalExitoEliminacion)}
        tipo="exito"
        titulo="Actividad Eliminada"
        mensaje={modalExitoEliminacion || ''}
        textoConfirmar="Aceptar"
        onConfirmar={() => setModalExitoEliminacion(null)}
      />
    </AppLayout>
  );
};

const styles = StyleSheet.create({
  scroll: {
    flex: 1,
    width: '100%',
  },
  scrollContent: {
    padding: 24,
    gap: 20,
    maxWidth: 1200,
    width: '100%',
    alignSelf: 'center',
  },
  tarjetaFiltros: { padding: 16, gap: 12 },
  inputBuscador: { width: '100%' },
  filaFiltrosRoles: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  botonFiltroRol: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    backgroundColor: '#F9FAFB',
  },
  botonFiltroRolActivo: {
    backgroundColor: Palette.forestGreen,
    borderColor: Palette.forestGreen,
  },
  textoFiltroRol: {
    fontSize: 12,
    fontWeight: '600',
    color: '#4B5563',
  },
  textoFiltroRolActivo: {
    color: Palette.white,
  },
  filaFiltrosInferior: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 12,
  },
  filaSelectorVista: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    padding: 3,
    gap: 4,
  },
  botonModoVista: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
  },
  botonModoVistaActivo: {
    backgroundColor: Palette.forestGreen,
  },
  textoModoVista: {
    fontSize: 12,
    fontWeight: '600',
    color: '#4B5563',
  },
  textoModoVistaActivo: {
    color: Palette.white,
  },
  contenedorTabla: { gap: 16 },
});
