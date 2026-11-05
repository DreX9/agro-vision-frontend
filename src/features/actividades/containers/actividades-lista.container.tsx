import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, useWindowDimensions } from 'react-native';
import { useRouter, type Href } from 'expo-router';
import {
  Plus,
  Search,
  UserCheck,
  ListFilter,
  LayoutGrid,
  List,
  Filter,
  X,
  Calendar,
} from 'lucide-react-native';
import { Palette } from '@/constants/theme';
import { AppLayout } from '@/shared/components/layout/app-layout';
import {
  Boton,
  Input,
  Select,
  Card,
  ModalConfirmacion,
  type DetalleConfirmacion,
} from '@/shared/components/ui';
import { Paginacion } from '@/shared/components/ui/paginacion';
import { ActividadesTabla } from '../components/actividades-tabla';
import { ActividadesOperadorLista } from '../components/actividades-operador-lista';
import { ActividadesSkeleton } from '../components/actividades-skeleton';
import {
  useActividadesQuery,
  useCambiarEstadoActividadMutation,
  useEliminarActividadMutation,
} from '../api/actividades.api';
import { useParcelasQuery } from '@/features/parcelas/api/parcelas.api';
import { useUsuariosQuery } from '@/features/usuarios/api/usuarios.api';
import { Usuario } from '@/features/usuarios/types/usuario.types';
import { ActividadItem, EstadoActividadTipo } from '../types/actividad.types';
import { useAuthStore } from '@/features/autenticacion';

/**
 * @description Contenedor orquestador de la lista de actividades agrícolas con filtros avanzados
 * (Estado, Parcela, Supervisor, Rango de fechas) y acciones operativas.
 */
export const ActividadesListaContainer: React.FC = () => {
  const router = useRouter();
  const usuario = useAuthStore((s) => s.usuario);
  const { width } = useWindowDimensions();
  const esPantallaAmplia = width >= 800;

  const rol = usuario?.rol || 'OPERADOR';
  const esAdmin = rol === 'ADMINISTRADOR';
  const esAgronomo = rol === 'AGRONOMO';
  const esSupervisor = rol === 'SUPERVISOR';
  const esOperador = rol === 'OPERADOR';
  const puedeCrear = esAdmin || esAgronomo;

  const [busqueda, setBusqueda] = useState('');
  const [filtroEstado, setFiltroEstado] = useState<string>('');
  const [filtroParcela, setFiltroParcela] = useState<string>('');
  const [filtroSupervisor, setFiltroSupervisor] = useState<string>(
    esSupervisor && usuario?.id ? usuario.id : '',
  );
  const [fechaDesde, setFechaDesde] = useState<string>('');
  const [fechaHasta, setFechaHasta] = useState<string>('');
  const [mostrarFiltrosAvanzados, setMostrarFiltrosAvanzados] = useState(false);

  const [pagina, setPagina] = useState(1);
  const [limite, setLimite] = useState(10);
  const [modoVista, setModoVista] = useState<'tarjetas' | 'tabla'>(
    esOperador ? 'tarjetas' : 'tabla',
  );

  // Estados de modales
  const [actividadAEliminar, setActividadAEliminar] = useState<ActividadItem | null>(null);
  const [actividadACancelar, setActividadACancelar] = useState<ActividadItem | null>(null);
  const [modalFeedback, setModalFeedback] = useState<string | null>(null);

  // Consultas
  const { data, isLoading, isFetching } = useActividadesQuery({
    busqueda: busqueda.trim() || undefined,
    estado: filtroEstado || undefined,
    parcelaId: filtroParcela || undefined,
    usuarioResponsableId: filtroSupervisor || undefined,
    fechaDesde: fechaDesde || undefined,
    fechaHasta: fechaHasta || undefined,
    pagina,
    limite,
  });

  const { data: datosParcelas } = useParcelasQuery({ limite: 100 });
  const { data: datosSupervisores } = useUsuariosQuery({ rol: 'SUPERVISOR', limite: 100 });

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

  const handleCancelar = (actividad: ActividadItem) => {
    setActividadACancelar(actividad);
  };

  const confirmarCancelar = () => {
    if (!actividadACancelar) return;
    const act = actividadACancelar;

    cambiarEstadoMutation.mutate(
      {
        id: act.id,
        estado: 'CANCELADA',
      },
      {
        onSuccess: () => {
          setActividadACancelar(null);
          setModalFeedback(`La actividad "${act.codigo} - ${act.titulo}" ha sido marcada como Cancelada.`);
        },
      },
    );
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
        setModalFeedback(
          `La actividad "${act.codigo} - ${act.titulo}" ha sido eliminada del sistema.`,
        );
      },
    });
  };

  const limpiarFiltros = () => {
    setBusqueda('');
    setFiltroEstado('');
    setFiltroParcela('');
    setFiltroSupervisor(esSupervisor && usuario?.id ? usuario.id : '');
    setFechaDesde('');
    setFechaHasta('');
    setPagina(1);
  };

  const hayFiltrosActivos =
    Boolean(busqueda) ||
    Boolean(filtroEstado) ||
    Boolean(filtroParcela) ||
    Boolean(fechaDesde) ||
    Boolean(fechaHasta) ||
    (!esSupervisor && Boolean(filtroSupervisor));

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
            titulo="Programar Actividad"
            variante="primario"
            iconoIzquierda={<Plus size={18} color={Palette.white} />}
            onPress={() => router.push('/actividades/nueva' as Href)}
          />
        ) : null
      }
    >
      <ScrollView
        style={styles.scroll}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Panel de Filtros */}
        <Card estilo={styles.tarjetaFiltros}>
          <View style={[styles.filaFiltrosPrincipal, !esPantallaAmplia && styles.columnaSimple]}>
            <View style={{ flex: 2 }}>
              <Input
                placeholder="Buscar por código (ACT-001), labor o descripción..."
                value={busqueda}
                onChangeText={(texto) => {
                  setBusqueda(texto);
                  setPagina(1);
                }}
                iconoIzquierda={<Search size={18} color="#6B7280" />}
              />
            </View>

            <View style={{ flex: 1.2 }}>
              <Select
                placeholder="Estado..."
                opciones={[
                  { label: 'Todos los estados', valor: '' },
                  { label: '🟡 Programada (Pendiente)', valor: 'PENDIENTE' },
                  { label: '🔵 En Ejecución', valor: 'EN_PROGRESO' },
                  { label: '🟢 Completada', valor: 'COMPLETADA' },
                  { label: '🔴 Cancelada', valor: 'CANCELADA' },
                ]}
                valor={filtroEstado}
                onChange={(val) => {
                  setFiltroEstado(val);
                  setPagina(1);
                }}
              />
            </View>

            <View style={styles.filaBotonesFiltroBarra}>
              <Pressable
                style={[
                  styles.botonToggleFiltros,
                  (mostrarFiltrosAvanzados || hayFiltrosActivos) && styles.botonToggleFiltrosActivo,
                ]}
                onPress={() => setMostrarFiltrosAvanzados((prev) => !prev)}
              >
                <Filter size={16} color={mostrarFiltrosAvanzados || hayFiltrosActivos ? Palette.forestGreen : '#6B7280'} />
                <Text
                  style={[
                    styles.textoToggleFiltros,
                    (mostrarFiltrosAvanzados || hayFiltrosActivos) && styles.textoToggleFiltrosActivo,
                  ]}
                >
                  Filtros {hayFiltrosActivos ? '•' : ''}
                </Text>
              </Pressable>

              {hayFiltrosActivos && (
                <Pressable style={styles.botonLimpiarFiltros} onPress={limpiarFiltros}>
                  <X size={14} color="#6B7280" />
                  <Text style={styles.textoLimpiarFiltros}>Limpiar</Text>
                </Pressable>
              )}
            </View>
          </View>

          {/* Filtros avanzados desplegables (Parcela, Supervisor, Rango de Fechas) */}
          {mostrarFiltrosAvanzados && (
            <View style={styles.panelFiltrosAvanzados}>
              <View style={[styles.filaFiltrosGrid, !esPantallaAmplia && styles.columnaSimple]}>
                <View style={{ flex: 1 }}>
                  <Select
                    label="Parcela"
                    placeholder="Todas las parcelas..."
                    opciones={[
                      { label: 'Todas las parcelas', valor: '' },
                      ...(datosParcelas?.items || []).map((p) => ({
                        label: `${p.codigo} - ${p.nombre}`,
                        valor: p.id,
                      })),
                    ]}
                    valor={filtroParcela}
                    onChange={(val) => {
                      setFiltroParcela(val);
                      setPagina(1);
                    }}
                  />
                </View>

                <View style={{ flex: 1 }}>
                  <Select
                    label="Supervisor Asignado"
                    placeholder="Todos los supervisores..."
                    opciones={[
                      { label: 'Todos los supervisores', valor: '' },
                      ...(datosSupervisores?.elementos || []).map((s: Usuario) => ({
                        label: `${s.nombres} ${s.apellidos}`,
                        valor: s.id,
                      })),
                    ]}
                    valor={filtroSupervisor}
                    onChange={(val) => {
                      setFiltroSupervisor(val);
                      setPagina(1);
                    }}
                  />
                </View>

                <View style={{ flex: 1 }}>
                  <Input
                    label="Fecha Desde"
                    placeholder="AAAA-MM-DD"
                    value={fechaDesde}
                    onChangeText={(val) => {
                      setFechaDesde(val);
                      setPagina(1);
                    }}
                    iconoIzquierda={<Calendar size={14} color="#6B7280" />}
                  />
                </View>

                <View style={{ flex: 1 }}>
                  <Input
                    label="Fecha Hasta"
                    placeholder="AAAA-MM-DD"
                    value={fechaHasta}
                    onChangeText={(val) => {
                      setFechaHasta(val);
                      setPagina(1);
                    }}
                    iconoIzquierda={<Calendar size={14} color="#6B7280" />}
                  />
                </View>
              </View>
            </View>
          )}

          {/* Selector de Modo de Vista (Tarjetas vs Tabla) */}
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
                Tabla de Datos
              </Text>
            </Pressable>
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
                onCancelar={handleCancelar}
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

      {/* Modal de Confirmación para Cancelar Actividad */}
      <ModalConfirmacion
        visible={Boolean(actividadACancelar)}
        tipo="peligro"
        titulo="¿Cancelar Actividad Agrícola?"
        mensaje={`Está a punto de cancelar la labor "${actividadACancelar?.titulo}". La actividad quedará registrada como Cancelada para trazabilidad.`}
        textoConfirmar="Sí, Cancelar Labor"
        textoCancelar="Volver"
        detalles={
          actividadACancelar
            ? [
                { etiqueta: 'Código', valor: actividadACancelar.codigo },
                { etiqueta: 'Labor', valor: actividadACancelar.tipo },
                { etiqueta: 'Parcela', valor: actividadACancelar.parcelaNombre || '-' },
                { etiqueta: 'Estado actual', valor: actividadACancelar.estado },
              ]
            : []
        }
        onConfirmar={confirmarCancelar}
        onCancelar={() => setActividadACancelar(null)}
      />

      {/* Modal de Confirmación para Eliminar Actividad */}
      <ModalConfirmacion
        visible={Boolean(actividadAEliminar)}
        tipo="peligro"
        titulo="¿Eliminar Actividad Agrícola?"
        mensaje={`Está a punto de eliminar permanentemente la actividad "${actividadAEliminar?.titulo}".`}
        textoConfirmar="Eliminar Definitivamente"
        onConfirmar={confirmarEliminar}
        onCancelar={() => setActividadAEliminar(null)}
      />

      {/* Modal de Feedback */}
      <ModalConfirmacion
        visible={Boolean(modalFeedback)}
        titulo="Información"
        mensaje={modalFeedback || ''}
        textoConfirmar="Aceptar"
        onConfirmar={() => setModalFeedback(null)}
        onCancelar={() => setModalFeedback(null)}
      />
    </AppLayout>
  );
};

const styles = StyleSheet.create({
  scroll: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
    gap: 16,
  },
  tarjetaFiltros: {
    padding: 16,
    gap: 12,
  },
  filaFiltrosPrincipal: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
  },
  columnaSimple: {
    flexDirection: 'column',
  },
  filaBotonesFiltroBarra: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  botonToggleFiltros: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
  },
  botonToggleFiltrosActivo: {
    borderColor: Palette.forestGreen,
    backgroundColor: '#F0FDF4',
  },
  textoToggleFiltros: {
    fontSize: 13,
    color: '#374151',
    fontWeight: '500',
  },
  textoToggleFiltrosActivo: {
    color: Palette.forestGreen,
    fontWeight: '600',
  },
  botonLimpiarFiltros: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 8,
    paddingHorizontal: 8,
  },
  textoLimpiarFiltros: {
    fontSize: 12,
    color: '#6B7280',
  },
  panelFiltrosAvanzados: {
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  filaFiltrosGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  filaSelectorVista: {
    flexDirection: 'row',
    gap: 8,
    alignSelf: 'flex-start',
    marginTop: 4,
  },
  botonModoVista: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  botonModoVistaActivo: {
    backgroundColor: Palette.forestGreen,
    borderColor: Palette.forestGreen,
  },
  textoModoVista: {
    fontSize: 12,
    fontWeight: '600',
    color: '#4B5563',
  },
  textoModoVistaActivo: {
    color: Palette.white,
  },
  contenedorTabla: {
    gap: 16,
  },
});
