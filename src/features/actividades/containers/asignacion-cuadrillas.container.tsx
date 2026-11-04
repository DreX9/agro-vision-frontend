import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Modal,
  TextInput,
  useWindowDimensions,
} from 'react-native';
import { useRouter, type Href } from 'expo-router';
import {
  Users,
  Search,
  CheckCircle2,
  AlertCircle,
  Calendar,
  MapPin,
  Clock,
  UserCheck,
  Play,
  X,
  Filter,
  Check,
  ShieldAlert,
  AlertTriangle,
  Sprout,
  Sparkles,
} from 'lucide-react-native';
import { Palette } from '@/constants/theme';
import { AppLayout } from '@/shared/components/layout/app-layout';
import { Boton, Input, Select, Badge, Card, ModalConfirmacion } from '@/shared/components/ui';
import { ActividadesSkeleton } from '../components/actividades-skeleton';
import {
  useActividadesQuery,
  useActualizarActividadMutation,
  useCambiarEstadoActividadMutation,
} from '../api/actividades.api';
import { useParcelasQuery } from '@/features/parcelas/api/parcelas.api';
import { useUsuariosQuery } from '@/features/usuarios/api/usuarios.api';
import {
  ActividadItem,
  extraerJornalesRequeridos,
  TrabajadorAsignado,
} from '../types/actividad.types';
import { Usuario } from '@/features/usuarios/types/usuario.types';
import { useAuthStore } from '@/features/autenticacion';

type TabEstadoCuadrilla = 'PROGRAMADAS' | 'EN_EJECUCION' | 'TODAS';

/**
 * @description Vista operativa "Asignación y cuadrillas" (/actividades/cuadrillas)
 * para que el supervisor conforme cuadrillas de operarios a labores programadas.
 */
export const AsignacionCuadrillasContainer: React.FC = () => {
  const router = useRouter();
  const usuarioActual = useAuthStore((s) => s.usuario);
  const { width } = useWindowDimensions();
  const esPantallaAmplia = width >= 800;

  // Filtros
  const [tabEstado, setTabEstado] = useState<TabEstadoCuadrilla>('PROGRAMADAS');
  const [busqueda, setBusqueda] = useState('');
  const [filtroParcela, setFiltroParcela] = useState('');
  const [filtroSupervisor, setFiltroSupervisor] = useState(
    usuarioActual?.rol === 'SUPERVISOR' ? usuarioActual.id : '',
  );

  // Control de permisos por rol
  const rolUsuario = usuarioActual?.rol || 'OPERADOR';
  const puedeProgramarLabor = rolUsuario === 'ADMINISTRADOR' || rolUsuario === 'AGRONOMO';

  // Modal de Asignación de Cuadrilla
  const [actividadSeleccionada, setActividadSeleccionada] = useState<ActividadItem | null>(null);
  const [operariosSeleccionadosIds, setOperariosSeleccionadosIds] = useState<string[]>([]);
  const [busquedaOperario, setBusquedaOperario] = useState('');
  const [modalExito, setModalExito] = useState<string | null>(null);
  const [modalError, setModalError] = useState<string | null>(null);

  // Consultas
  const estadoQuery =
    tabEstado === 'PROGRAMADAS'
      ? 'PENDIENTE'
      : tabEstado === 'EN_EJECUCION'
        ? 'EN_PROGRESO'
        : undefined;

  const { data: datosActividades, isLoading: cargandoActividades } = useActividadesQuery({
    busqueda: busqueda.trim() || undefined,
    parcelaId: filtroParcela || undefined,
    usuarioResponsableId: filtroSupervisor || undefined,
    estado: estadoQuery,
    limite: 50,
  });

  // Consulta global de actividades para detección proactiva de solapamientos
  const { data: todasLasActividadesData } = useActividadesQuery({ limite: 100 });

  const { data: datosParcelas } = useParcelasQuery({ limite: 100 });
  const { data: datosSupervisores } = useUsuariosQuery({ rol: 'SUPERVISOR', limite: 100 });
  const { data: datosOperarios, isLoading: cargandoOperarios } = useUsuariosQuery({
    rol: 'OPERADOR',
    limite: 100,
  });

  const actualizarMutation = useActualizarActividadMutation();
  const cambiarEstadoMutation = useCambiarEstadoActividadMutation();

  const actividades = useMemo(() => {
    return datosActividades?.items || [];
  }, [datosActividades]);

  const todasLasActividades = useMemo(() => {
    return todasLasActividadesData?.items || [];
  }, [todasLasActividadesData]);

  // Mapa de conflictos de operarios asignados en otras labores para la misma fecha
  const conflictosOperarios = useMemo(() => {
    if (!actividadSeleccionada) return new Map<string, { labor: string; parcela: string }>();
    const mapa = new Map<string, { labor: string; parcela: string }>();
    const fechaLabor = actividadSeleccionada.fechaInicio ? actividadSeleccionada.fechaInicio.split('T')[0] : '';

    for (const act of todasLasActividades) {
      if (act.id === actividadSeleccionada.id) continue;
      if (act.estado === 'CANCELADA') continue;
      const fechaAct = act.fechaInicio ? act.fechaInicio.split('T')[0] : '';
      if (fechaAct !== fechaLabor) continue;

      if (act.trabajadores && Array.isArray(act.trabajadores)) {
        for (const t of act.trabajadores) {
          mapa.set(t.usuarioId, {
            labor: act.codigo || act.titulo,
            parcela: act.parcelaNombre || 'otra parcela',
          });
        }
      }
    }
    return mapa;
  }, [actividadSeleccionada, todasLasActividades]);

  const operariosTotales = useMemo(() => {
    return (datosOperarios?.elementos || []).filter((u: Usuario) => u.activo !== false);
  }, [datosOperarios]);

  const operariosFiltradosModal = useMemo(() => {
    if (!busquedaOperario.trim()) return operariosTotales;
    const q = busquedaOperario.toLowerCase();
    return operariosTotales.filter(
      (op: Usuario) =>
        `${op.nombres} ${op.apellidos}`.toLowerCase().includes(q) ||
        (op.codigoEmpleado && op.codigoEmpleado.toLowerCase().includes(q)) ||
        (op.numeroDocumento && op.numeroDocumento.includes(q)),
    );
  }, [operariosTotales, busquedaOperario]);

  // Al abrir el modal de asignación para una actividad
  const handleAbrirAsignacion = (actividad: ActividadItem) => {
    setActividadSeleccionada(actividad);
    const idsActuales = (actividad.trabajadores || []).map((t) => t.usuarioId);
    setOperariosSeleccionadosIds(idsActuales);
    setBusquedaOperario('');
  };

  const alternarSeleccionOperario = (usuarioId: string) => {
    setOperariosSeleccionadosIds((prev) =>
      prev.includes(usuarioId) ? prev.filter((id) => id !== usuarioId) : [...prev, usuarioId],
    );
  };

  const handleGuardarCuadrilla = (avanzarAEnEjecucion = false) => {
    if (!actividadSeleccionada) return;

    const fechaInicioAct = actividadSeleccionada.fechaInicio;
    const fechaFinAct = actividadSeleccionada.fechaFin || actividadSeleccionada.fechaInicio;

    const trabajadoresFormateados = operariosSeleccionadosIds.map((uid) => {
      return {
        usuarioId: uid,
        rolEnActividad: 'Operario de Campo',
        horaInicio: fechaInicioAct,
        horaFin: fechaFinAct,
        horasAsignadas: 5,
      };
    });

    actualizarMutation.mutate(
      {
        id: actividadSeleccionada.id,
        datos: {
          trabajadores: trabajadoresFormateados,
          estado: avanzarAEnEjecucion ? 'EN_PROGRESO' : actividadSeleccionada.estado,
        },
      },
      {
        onSuccess: () => {
          const nombreAct = actividadSeleccionada.titulo || actividadSeleccionada.codigo;
          const cant = operariosSeleccionadosIds.length;
          setActividadSeleccionada(null);
          setModalExito(
            avanzarAEnEjecucion
              ? `¡Cuadrilla confirmada (${cant} operarios) y labor iniciada en estado EN EJECUCIÓN para "${nombreAct}"!`
              : `Cuadrilla actualizada exitosamente (${cant} operarios) para la labor "${nombreAct}".`,
          );
        },
        onError: (err: any) => {
          const mensaje =
            err?.response?.data?.message ||
            (err?.response?.data?.error ? `${err.response.data.error}: ${err.response.data.message}` : null) ||
            err?.message ||
            'Conflicto de disponibilidad detectado al asignar operarios a la cuadrilla.';
          const mensajeTexto = Array.isArray(mensaje) ? mensaje.join('\n\n') : String(mensaje);
          setModalError(mensajeTexto);
        },
      },
    );
  };

  const handleIniciarJornadaDirecto = (actividad: ActividadItem) => {
    cambiarEstadoMutation.mutate(
      {
        id: actividad.id,
        estado: 'EN_PROGRESO',
      },
      {
        onSuccess: () => {
          setModalExito(`La labor "${actividad.titulo}" ha pasado a estado EN EJECUCIÓN.`);
        },
        onError: (err: any) => {
          const mensaje = err?.response?.data?.message || err?.message || 'Error al iniciar la jornada.';
          setModalError(Array.isArray(mensaje) ? mensaje.join('\n\n') : String(mensaje));
        },
      },
    );
  };

  return (
    <AppLayout
      titulo="Asignación y Cuadrillas de Campo"
      subtitulo="Gestión operativa para que el supervisor asigne operarios nominales a las labores en estado Programada antes de iniciar la jornada."
      accionEncabezado={
        puedeProgramarLabor ? (
          <Boton
            titulo="Programar Nueva Labor"
            variante="secundario"
            onPress={() => router.push('/actividades/nueva' as Href)}
          />
        ) : undefined
      }
    >
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContenido}
        showsVerticalScrollIndicator={false}
      >
        {/* Selector de Pestañas / Estados */}
        <View style={styles.filaTabs}>
          <Pressable
            style={[styles.tabBoton, tabEstado === 'PROGRAMADAS' && styles.tabBotonActivo]}
            onPress={() => setTabEstado('PROGRAMADAS')}
          >
            <Clock size={16} color={tabEstado === 'PROGRAMADAS' ? Palette.forestGreen : '#6B7280'} />
            <Text
              style={[styles.tabTexto, tabEstado === 'PROGRAMADAS' && styles.tabTextoActivo]}
            >
              Labores Programadas (Pendientes de Cuadrilla)
            </Text>
          </Pressable>

          <Pressable
            style={[styles.tabBoton, tabEstado === 'EN_EJECUCION' && styles.tabBotonActivo]}
            onPress={() => setTabEstado('EN_EJECUCION')}
          >
            <Play size={16} color={tabEstado === 'EN_EJECUCION' ? '#0284C7' : '#6B7280'} />
            <Text
              style={[styles.tabTexto, tabEstado === 'EN_EJECUCION' && styles.tabTextoActivo]}
            >
              En Ejecución (Cuadrilla en Terreno)
            </Text>
          </Pressable>

          <Pressable
            style={[styles.tabBoton, tabEstado === 'TODAS' && styles.tabBotonActivo]}
            onPress={() => setTabEstado('TODAS')}
          >
            <Filter size={16} color={tabEstado === 'TODAS' ? Palette.text : '#6B7280'} />
            <Text style={[styles.tabTexto, tabEstado === 'TODAS' && styles.tabTextoActivo]}>
              Todas las Labores
            </Text>
          </Pressable>
        </View>

        {/* Tarjeta de Filtros de Búsqueda */}
        <Card estilo={styles.tarjetaFiltros}>
          <View style={[styles.filaFiltros, !esPantallaAmplia && styles.columnaSimple]}>
            <View style={{ flex: 2 }}>
              <Input
                placeholder="Buscar por código, título o labor..."
                value={busqueda}
                onChangeText={setBusqueda}
                iconoIzquierda={<Search size={16} color="#6B7280" />}
              />
            </View>

            <View style={{ flex: 1.5 }}>
              <Select
                placeholder="Todas las parcelas..."
                opciones={[
                  { label: 'Todas las parcelas', valor: '' },
                  ...(datosParcelas?.items || []).map((p) => ({
                    label: `${p.codigo} - ${p.nombre}`,
                    valor: p.id,
                  })),
                ]}
                valor={filtroParcela}
                onChange={setFiltroParcela}
              />
            </View>

            <View style={{ flex: 1.5 }}>
              <Select
                placeholder="Todos los supervisores..."
                opciones={[
                  { label: 'Todos los supervisores', valor: '' },
                  ...(datosSupervisores?.elementos || []).map((s: Usuario) => ({
                    label: `${s.nombres} ${s.apellidos}`,
                    valor: s.id,
                  })),
                ]}
                valor={filtroSupervisor}
                onChange={setFiltroSupervisor}
              />
            </View>
          </View>
        </Card>

        {/* Listado de Actividades */}
        {cargandoActividades ? (
          <ActividadesSkeleton />
        ) : actividades.length === 0 ? (
          <Card estilo={styles.tarjetaVacia}>
            <Users size={44} color="#9CA3AF" />
            <Text style={styles.tituloVacio}>No hay labores en este estado</Text>
            <Text style={styles.subtituloVacio}>
              {tabEstado === 'PROGRAMADAS'
                ? 'Todas las labores cuentan con cuadrilla completa o no hay actividades pendientes de asignación.'
                : 'No se encontraron actividades con los filtros seleccionados.'}
            </Text>
          </Card>
        ) : (
          <View style={styles.gridActividades}>
            {actividades.map((act) => {
              const requeridos = extraerJornalesRequeridos(act);
              const asignados = act.trabajadores?.length || 0;
              const estaCompleta = asignados >= requeridos;
              const esProgramada = act.estado === 'PENDIENTE';
              const esEnEjecucion = act.estado === 'EN_PROGRESO';

              return (
                <Card key={act.id} estilo={styles.tarjetaLabor}>
                  {/* Encabezado de la Tarjeta */}
                  <View style={styles.cabeceraTarjeta}>
                    <View style={styles.filaCodigoTipo}>
                      <Badge texto={act.tipo} variante="neutro" />
                      <Text style={styles.codigoLabor}>{act.codigo}</Text>
                    </View>
                    <Badge
                      texto={
                        esProgramada
                          ? '🟡 PROGRAMADA'
                          : esEnEjecucion
                            ? '🔵 EN EJECUCIÓN'
                            : act.estado
                      }
                      variante={esProgramada ? 'alerta' : esEnEjecucion ? 'info' : 'neutro'}
                    />
                  </View>

                  {/* Título de la Labor */}
                  <Text style={styles.tituloLabor} numberOfLines={2}>
                    {act.titulo}
                  </Text>

                  {/* Metadatos Agronómicos y de Campo */}
                  <View style={styles.seccionDetallesCampo}>
                    <View style={styles.filaDatoDetalle}>
                      <MapPin size={14} color="#6B7280" />
                      <Text style={styles.textoDatoDetalle}>
                        {act.parcelaNombre || 'Parcela'} {act.sectorCodigo ? `• Sector ${act.sectorCodigo}` : ''}
                      </Text>
                    </View>

                    <View style={styles.filaDatoDetalle}>
                      <Calendar size={14} color="#6B7280" />
                      <Text style={styles.textoDatoDetalle}>
                        {act.fechaInicio.split('T')[0]}
                      </Text>
                    </View>

                    <View style={styles.filaDatoDetalle}>
                      <UserCheck size={14} color="#6B7280" />
                      <Text style={styles.textoDatoDetalle}>
                        Supervisor: {act.usuarioResponsableNombre || 'No asignado'}
                      </Text>
                    </View>
                  </View>

                  {/* Badge de Requerimiento de Cuadrilla */}
                  <View style={styles.seccionCuadrillaBadge}>
                    <View
                      style={[
                        styles.badgeOperariosContenedor,
                        asignados === 0
                          ? styles.badgeOperariosCero
                          : estaCompleta
                            ? styles.badgeOperariosCompleto
                            : styles.badgeOperariosIncompleto,
                      ]}
                    >
                      <Users
                        size={15}
                        color={
                          asignados === 0
                            ? '#DC2626'
                            : estaCompleta
                              ? Palette.forestGreen
                              : '#D97706'
                        }
                      />
                      <Text
                        style={[
                          styles.textoBadgeOperarios,
                          asignados === 0
                            ? styles.textoOperariosCero
                            : estaCompleta
                              ? styles.textoOperariosCompleto
                              : styles.textoOperariosIncompleto,
                        ]}
                      >
                        Operarios: {asignados} / {requeridos} requeridos
                      </Text>
                    </View>
                  </View>

                  {/* Operarios ya asignados (Chips) */}
                  {asignados > 0 && (
                    <View style={styles.listaChipsOperarios}>
                      {act.trabajadores?.map((t) => (
                        <View key={t.usuarioId} style={styles.chipOperarioAsignado}>
                          <Text style={styles.textoChipOperario}>
                            {t.nombres} {t.apellidos.charAt(0)}.
                          </Text>
                        </View>
                      ))}
                    </View>
                  )}

                  {/* Botones Operativos de Acción */}
                  <View style={styles.filaAccionesTarjeta}>
                    <Boton
                      titulo={asignados === 0 ? 'Conformar Cuadrilla' : 'Modificar Cuadrilla'}
                      variante={asignados === 0 ? 'primario' : 'outline'}
                      tamano="sm"
                      iconoIzquierda={<Users size={14} color={asignados === 0 ? '#FFFFFF' : '#374151'} />}
                      onPress={() => handleAbrirAsignacion(act)}
                      estilo={{ flex: 1 }}
                    />

                    {esProgramada && asignados > 0 && (
                      <Boton
                        titulo="▶ Iniciar Jornada"
                        variante="secundario"
                        tamano="sm"
                        cargando={cambiarEstadoMutation.isPending}
                        onPress={() => handleIniciarJornadaDirecto(act)}
                        estilo={{ flex: 1 }}
                      />
                    )}
                  </View>
                </Card>
              );
            })}
          </View>
        )}
      </ScrollView>

      {/* =========================================================================
          MODAL DE ASIGNACIÓN Y CONFORMACIÓN DE CUADRILLA
         ========================================================================= */}
      {actividadSeleccionada && (
        <Modal
          visible={Boolean(actividadSeleccionada)}
          transparent
          animationType="fade"
          onRequestClose={() => setActividadSeleccionada(null)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalCard}>
              {/* Encabezado del Modal */}
              <View style={styles.modalCabecera}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.modalTitulo}>Conformación de Cuadrilla de Campo</Text>
                  <Text style={styles.modalSubtitulo} numberOfLines={1}>
                    {actividadSeleccionada.codigo} - {actividadSeleccionada.titulo}
                  </Text>
                </View>
                <Pressable
                  onPress={() => setActividadSeleccionada(null)}
                  style={styles.modalBotonCerrar}
                >
                  <X size={20} color="#6B7280" />
                </Pressable>
              </View>

              {/* Resumen del Objetivo Técnico */}
              <View style={styles.bannerObjetivoCuadrilla}>
                <View style={styles.filaObjetivoHeader}>
                  <Text style={styles.etiquetaObjetivo}>
                    Objetivo de Jornales Requeridos:
                  </Text>
                  <Text style={styles.valorObjetivo}>
                    {extraerJornalesRequeridos(actividadSeleccionada)} operarios
                  </Text>
                </View>
                <Text style={styles.subtextoObjetivo}>
                  Seleccione los operarios nominales disponibles para cumplir con el turno en{' '}
                  {actividadSeleccionada.parcelaNombre || 'la parcela'}.
                </Text>
              </View>

              {/* Buscador de Operarios de Campo */}
              <View style={{ paddingHorizontal: 20, paddingTop: 10 }}>
                <Input
                  placeholder="Buscar operario por nombre o código..."
                  value={busquedaOperario}
                  onChangeText={setBusquedaOperario}
                  iconoIzquierda={<Search size={16} color="#6B7280" />}
                />
              </View>

              {/* Contador de Selección */}
              <View style={styles.filaContadorModal}>
                <Text style={styles.textoContadorSeleccionados}>
                  Seleccionados: <Text style={{ fontWeight: '700' }}>{operariosSeleccionadosIds.length}</Text> de{' '}
                  {extraerJornalesRequeridos(actividadSeleccionada)} requeridos
                </Text>
                {operariosSeleccionadosIds.length >= extraerJornalesRequeridos(actividadSeleccionada) ? (
                  <Badge texto="✓ Cuadrilla Completa" variante="exito" />
                ) : (
                  <Badge
                    texto={`Faltan ${extraerJornalesRequeridos(actividadSeleccionada) - operariosSeleccionadosIds.length}`}
                    variante="alerta"
                  />
                )}
              </View>

              {/* Lista de Operarios de Campo Disponibles */}
              <ScrollView style={styles.scrollOperariosModal} showsVerticalScrollIndicator={false}>
                {cargandoOperarios ? (
                  <Text style={styles.textoCargandoOperarios}>Cargando operarios de campo...</Text>
                ) : operariosFiltradosModal.length === 0 ? (
                  <Text style={styles.textoSinOperarios}>
                    No se encontraron operarios registrados con rol OPERADOR.
                  </Text>
                ) : (
                  <View style={styles.listaOperariosModal}>
                    {operariosFiltradosModal.map((op: Usuario) => {
                      const estaSeleccionado = operariosSeleccionadosIds.includes(op.id);
                      return (
                        <Pressable
                          key={op.id}
                          onPress={() => alternarSeleccionOperario(op.id)}
                          style={[
                            styles.itemOperarioModal,
                            estaSeleccionado && styles.itemOperarioModalSeleccionado,
                          ]}
                        >
                          <View
                            style={[
                              styles.checkboxOperario,
                              estaSeleccionado && styles.checkboxOperarioActivo,
                            ]}
                          >
                            {estaSeleccionado && <Check size={14} color="#FFFFFF" strokeWidth={3} />}
                          </View>

                          <View style={{ flex: 1 }}>
                            <Text
                              style={[
                                styles.nombreOperarioModal,
                                estaSeleccionado && styles.nombreOperarioModalSeleccionado,
                              ]}
                            >
                              {op.nombres} {op.apellidos}
                            </Text>
                            <Text style={styles.datosOperarioModal}>
                              {op.codigoEmpleado || 'OP-000'} {op.telefono ? `• Tel: ${op.telefono}` : ''}
                            </Text>

                            {conflictosOperarios.has(op.id) && (
                              <View style={styles.badgeConflictoOperario}>
                                <AlertTriangle size={12} color="#DC2626" />
                                <Text style={styles.textoConflictoOperario}>
                                  Asignado a {conflictosOperarios.get(op.id)?.labor} ({conflictosOperarios.get(op.id)?.parcela})
                                </Text>
                              </View>
                            )}
                          </View>

                          <Badge texto="Operador" variante="neutro" />
                        </Pressable>
                      );
                    })}
                  </View>
                )}
              </ScrollView>

              {/* Advertencia si hay operarios con solapamiento seleccionados */}
              {operariosSeleccionadosIds.some((id) => conflictosOperarios.has(id)) && (
                <View style={styles.alertaConflictoModal}>
                  <AlertCircle size={16} color="#DC2626" />
                  <Text style={styles.textoAlertaConflictoModal}>
                    Advertencia: Ha seleccionado operarios que ya figuran en otra labor para esta fecha. Si hay cruce de horarios, el sistema rechazará la asignación.
                  </Text>
                </View>
              )}

              {/* Acciones del Modal */}
              <View style={styles.modalAcciones}>
                <Boton
                  titulo="Cancelar"
                  variante="outline"
                  tamano="sm"
                  onPress={() => setActividadSeleccionada(null)}
                />

                <Boton
                  titulo="Guardar Cuadrilla"
                  variante="secundario"
                  tamano="sm"
                  cargando={actualizarMutation.isPending}
                  onPress={() => handleGuardarCuadrilla(false)}
                />

                <Boton
                  titulo="Confirmar e Iniciar (EN EJECUCIÓN)"
                  variante="primario"
                  tamano="sm"
                  cargando={actualizarMutation.isPending}
                  onPress={() => handleGuardarCuadrilla(true)}
                  iconoIzquierda={<Play size={14} color="#FFFFFF" />}
                />
              </View>
            </View>
          </View>
        </Modal>
      )}

      {/* Modal de Feedback / Éxito */}
      <ModalConfirmacion
        visible={Boolean(modalExito)}
        titulo="Operación Exitosa"
        mensaje={modalExito || ''}
        textoConfirmar="Aceptar"
        tipo="exito"
        onConfirmar={() => setModalExito(null)}
        onCancelar={() => setModalExito(null)}
      />

      {/* Modal de Error / Conflicto de Disponibilidad */}
      <ModalConfirmacion
        visible={Boolean(modalError)}
        titulo="Conflicto de Disponibilidad"
        mensaje={modalError || ''}
        textoConfirmar="Entendido"
        tipo="peligro"
        onConfirmar={() => setModalError(null)}
        onCancelar={() => setModalError(null)}
      />
    </AppLayout>
  );
};

const styles = StyleSheet.create({
  scroll: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  scrollContenido: {
    padding: 16,
    paddingBottom: 40,
    gap: 16,
  },
  filaTabs: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    padding: 4,
    gap: 6,
    flexWrap: 'wrap',
  },
  tabBoton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 8,
  },
  tabBotonActivo: {
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#DCFCE7',
  },
  tabTexto: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6B7280',
  },
  tabTextoActivo: {
    color: Palette.forestGreen,
  },
  tarjetaFiltros: {
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  filaFiltros: {
    flexDirection: 'row',
    gap: 12,
  },
  columnaSimple: {
    flexDirection: 'column',
  },
  tarjetaVacia: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
    gap: 10,
  },
  tituloVacio: {
    fontSize: 16,
    fontWeight: '700',
    color: '#374151',
  },
  subtituloVacio: {
    fontSize: 13,
    color: '#9CA3AF',
    textAlign: 'center',
    maxWidth: 400,
  },
  gridActividades: {
    gap: 14,
  },
  tarjetaLabor: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    padding: 18,
    gap: 12,
  },
  cabeceraTarjeta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  filaCodigoTipo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  codigoLabor: {
    fontSize: 12,
    fontWeight: '700',
    color: '#4B5563',
    fontFamily: 'monospace',
  },
  tituloLabor: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
  },
  seccionDetallesCampo: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  filaDatoDetalle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  textoDatoDetalle: {
    fontSize: 12,
    color: '#4B5563',
  },
  seccionCuadrillaBadge: {
    marginTop: 2,
  },
  badgeOperariosContenedor: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  badgeOperariosCero: {
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FCA5A5',
  },
  badgeOperariosIncompleto: {
    backgroundColor: '#FFFBEB',
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  badgeOperariosCompleto: {
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#BBF7D0',
  },
  textoBadgeOperarios: {
    fontSize: 12,
    fontWeight: '700',
  },
  textoOperariosCero: {
    color: '#B91C1C',
  },
  textoOperariosIncompleto: {
    color: '#B45309',
  },
  textoOperariosCompleto: {
    color: '#15803D',
  },
  listaChipsOperarios: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  chipOperarioAsignado: {
    paddingVertical: 3,
    paddingHorizontal: 8,
    backgroundColor: '#F3F4F6',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  textoChipOperario: {
    fontSize: 11,
    color: '#374151',
    fontWeight: '500',
  },
  filaAccionesTarjeta: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 6,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    paddingTop: 12,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modalCard: {
    width: '100%',
    maxWidth: 640,
    maxHeight: '90%',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.18,
    shadowRadius: 16,
    elevation: 10,
  },
  modalCabecera: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
    backgroundColor: '#FAFAFA',
  },
  modalTitulo: {
    fontSize: 17,
    fontWeight: '700',
    color: '#111827',
  },
  modalSubtitulo: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  modalBotonCerrar: {
    padding: 6,
    borderRadius: 6,
  },
  bannerObjetivoCuadrilla: {
    marginHorizontal: 20,
    marginTop: 14,
    padding: 12,
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#DCFCE7',
    borderRadius: 10,
    gap: 4,
  },
  filaObjetivoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  etiquetaObjetivo: {
    fontSize: 12,
    fontWeight: '600',
    color: '#166534',
  },
  valorObjetivo: {
    fontSize: 14,
    fontWeight: '800',
    color: Palette.forestGreen,
  },
  subtextoObjetivo: {
    fontSize: 11,
    color: '#15803D',
  },
  filaContadorModal: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  textoContadorSeleccionados: {
    fontSize: 13,
    color: '#374151',
  },
  scrollOperariosModal: {
    maxHeight: 280,
    paddingHorizontal: 20,
  },
  textoCargandoOperarios: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
    paddingVertical: 20,
  },
  textoSinOperarios: {
    fontSize: 12,
    color: '#9CA3AF',
    textAlign: 'center',
    paddingVertical: 20,
  },
  listaOperariosModal: {
    gap: 8,
    paddingBottom: 10,
  },
  itemOperarioModal: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    borderRadius: 10,
    borderWidth: 1.2,
    borderColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
  },
  itemOperarioModalSeleccionado: {
    borderColor: Palette.forestGreen,
    backgroundColor: '#F0FDF4',
  },
  checkboxOperario: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: '#D1D5DB',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
  },
  checkboxOperarioActivo: {
    backgroundColor: Palette.forestGreen,
    borderColor: Palette.forestGreen,
  },
  nombreOperarioModal: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
  },
  nombreOperarioModalSeleccionado: {
    color: '#15803D',
  },
  datosOperarioModal: {
    fontSize: 11,
    color: '#6B7280',
    marginTop: 2,
  },
  modalAcciones: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    backgroundColor: '#FAFAFA',
    flexWrap: 'wrap',
  },
  badgeConflictoOperario: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginTop: 4,
    alignSelf: 'flex-start',
  },
  textoConflictoOperario: {
    fontSize: 11,
    color: '#DC2626',
    fontWeight: '500',
  },
  alertaConflictoModal: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    borderRadius: 8,
    padding: 10,
    marginHorizontal: 20,
    marginBottom: 10,
  },
  textoAlertaConflictoModal: {
    fontSize: 12,
    color: '#991B1B',
    flex: 1,
  },
});
