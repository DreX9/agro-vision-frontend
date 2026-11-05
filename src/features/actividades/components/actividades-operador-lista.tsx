import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Platform, Alert, useWindowDimensions } from 'react-native';
import {
  Calendar,
  MapPin,
  FileText,
  CheckCircle2,
  AlertTriangle,
  Navigation,
  ArrowRight,
  Package,
  Users,
  Compass,
  ListTodo,
} from 'lucide-react-native';
import { Palette } from '@/constants/theme';
import { Badge, Boton } from '@/shared/components/ui';
import { ActividadItem, EstadoActividadTipo, extraerRolYZona, obtenerInfoTipoLabor } from '../types/actividad.types';
import { useOperadorJornadaStore } from '../stores/operador-jornada.store';
import { useAuthStore } from '@/features/autenticacion';
import { useMisSubActividadesQuery, useCompletarSubActividadMutation } from '../api/actividades.api';

export interface ActividadesOperadorListaProps {
  actividades: ActividadItem[];
  cargando?: boolean;
  onVerDetalle: (actividad: ActividadItem) => void;
  onCambiarEstado?: (actividad: ActividadItem, nuevoEstado?: EstadoActividadTipo) => void;
}


export interface TareaMapeada {
  id: string;
  titulo: string;
  descripcion: string;
  estado: string;
  completada: boolean;
  completadaEn: string | null;
  zonaTrabajo: string;
}

export const ActividadesOperadorLista: React.FC<ActividadesOperadorListaProps> = ({
  actividades,
  cargando = false,
  onVerDetalle,
  onCambiarEstado,
}) => {
  const usuario = useAuthStore((s) => s.usuario);
  const esSupervisor = usuario?.rol === 'SUPERVISOR' || usuario?.rol === 'ADMINISTRADOR';


  const { data: tareasBackend, refetch: recargarTareasBackend } = useMisSubActividadesQuery();
  const { mutateAsync: completarTareaApi } = useCompletarSubActividadMutation();

  const {
    hallazgosPorActividad,
    puntosAvancePorActividad,
    sincronizarZonasDesdeTrabajadores,
    obtenerEstadoZonaOperador,
    iniciarZonaOperador,
    completarZonaOperador,
    obtenerProgresoActividad,
    iniciarTareaOperador,
    completarTareaOperador,
    obtenerProgresoTareas,
  } = useOperadorJornadaStore();

  useEffect(() => {
    actividades.forEach((act) => {
      if (act.trabajadores && act.trabajadores.length > 0) {
        sincronizarZonasDesdeTrabajadores(
          act.id,
          act.trabajadores.map((t) => ({
            usuarioId: t.usuarioId,
            nombres: t.nombres,
            apellidos: t.apellidos,
            rolEnActividad: t.rolEnActividad,
            zonaTrabajo: t.zonaTrabajo || undefined,
          })),
        );
      }
    });
  }, [actividades, sincronizarZonasDesdeTrabajadores]);

  const handleIniciarMiTarea = (act: ActividadItem, tareaId: string) => {
    if (!usuario?.id) return;
    iniciarTareaOperador(act.id, tareaId); // Efecto visual local
    if (act.estado === 'PENDIENTE' && onCambiarEstado) {
      onCambiarEstado(act, 'EN_PROGRESO');
    }
  };

  const handleFinalizarMiTarea = async (act: ActividadItem, tareaId: string) => {
    if (!usuario?.id) return;
    try {
      
      await completarTareaApi(tareaId);
      
      
      const nombreUsuario = usuario.nombreCompleto || `${usuario.nombres} ${usuario.apellidos}`.trim() || 'Operador';
      completarTareaOperador(act.id, tareaId, nombreUsuario);
      
    
      recargarTareasBackend();
      
      Alert.alert('¡Excelente!', 'Tarea marcada como completada en el sistema.');
    } catch (error) {
      Alert.alert('Error', 'Hubo un problema de conexión al completar la tarea.');
    }
  };

  const handleIniciarMiZona = (act: ActividadItem) => {
    if (!usuario?.id) return;
    iniciarZonaOperador(act.id, usuario.id);
    if (act.estado === 'PENDIENTE' && onCambiarEstado) {
      onCambiarEstado(act, 'EN_PROGRESO');
    }
  };

  const handleFinalizarMiZona = (act: ActividadItem) => {
    if (!usuario?.id) return;
    completarZonaOperador(act.id, usuario.id);
  };

  const obtenerVarianteEstado = (estado: EstadoActividadTipo): 'exito' | 'info' | 'alerta' | 'peligro' | 'neutro' => {
    switch (estado) {
      case 'COMPLETADA': return 'exito';
      case 'EN_PROGRESO': return 'info';
      case 'PENDIENTE': return 'alerta';
      case 'CANCELADA': return 'peligro';
      default: return 'neutro';
    }
  };

  const formatearEstadoTexto = (estado: EstadoActividadTipo): string => {
    switch (estado) {
      case 'COMPLETADA': return 'Completada';
      case 'EN_PROGRESO': return 'En Progreso';
      case 'PENDIENTE': return 'Pendiente';
      case 'CANCELADA': return 'Cancelada';
      default: return estado;
    }
  };

  const { width } = useWindowDimensions();
  // 3 columnas en pantallas anchas (>= 1180px), 2 columnas en medianas (>= 768px), 1 columna en móviles
  const numColumnas = width >= 1180 ? 3 : width >= 768 ? 2 : 1;

  if (actividades.length === 0 && !cargando) {
    return (
      <View style={styles.cajaVacia}>
        <Text style={styles.textoVacio}>No tienes labores asignadas programadas por el momento.</Text>
      </View>
    );
  }

  const anchoTarjetaStyle = Platform.select({
    web: {
      width:
        numColumnas === 3
          ? 'calc((100% - 32px) / 3)'
          : numColumnas === 2
            ? 'calc((100% - 16px) / 2)'
            : '100%',
      maxWidth:
        numColumnas === 3
          ? 'calc((100% - 32px) / 3)'
          : numColumnas === 2
            ? 'calc((100% - 16px) / 2)'
            : '100%',
      flexGrow: 0,
      flexShrink: 0,
    } as any,
    default: {
      width: numColumnas === 3 ? '31.5%' : numColumnas === 2 ? '48.5%' : '100%',
      maxWidth: numColumnas === 3 ? '31.5%' : numColumnas === 2 ? '48.5%' : '100%',
      flexGrow: 0,
      flexShrink: 0,
    },
  });

  return (
    <View style={styles.contenedor}>
      {actividades.map((act) => {
        const tareasBackendActividad = tareasBackend?.filter((t: any) => t.actividadId === act.id) || [];

        const misTareas: TareaMapeada[] = tareasBackendActividad.map((t: any) => ({
          id: t.id,
          titulo: t.descripcion,
          descripcion: '',
          estado: t.estado,
          completada: t.estado === 'COMPLETADA',
          completadaEn: t.fechaCompletado,
          zonaTrabajo: t.descripcion,
        }));

        const hallazgos = hallazgosPorActividad[act.id] || [];
        const puntoGuardado = puntosAvancePorActividad[act.id];

        const tieneTareasEspecificas = misTareas.length > 0;
        const progresoTareas = obtenerProgresoTareas(act.id);
        const totalCuadrilla = act.trabajadores?.length || act.cantidadTrabajadores || 1;
        const progresoCuadrilla = obtenerProgresoActividad(act.id, totalCuadrilla);

        const estadoEfectivo: EstadoActividadTipo = (() => {
          if (tieneTareasEspecificas) {
            if (!progresoTareas.todasCompletadas) {
              if (act.estado === 'COMPLETADA') {
                return progresoTareas.tareasCompletadas > 0 ? 'EN_PROGRESO' : 'PENDIENTE';
              }
              return act.estado;
            }
            return act.estado;
          } else if (!progresoCuadrilla.todasCompletadas) {
            if (act.estado === 'COMPLETADA') {
              return progresoCuadrilla.zonasCompletadas > 0 ? 'EN_PROGRESO' : 'PENDIENTE';
            }
            return act.estado;
          }
          return act.estado;
        })();

        const misTareasCompletadas = misTareas.length > 0 && misTareas.every((t) => t.completada);
        const misTareasEnProgreso = misTareas.some((t) => t.estado === 'EN_PROGRESO');

        const miTrabajador = act.trabajadores?.find((t) => t.usuarioId === usuario?.id);
        const esOperarioAsignado = Boolean(miTrabajador) || (!esSupervisor && Boolean(usuario?.id));

        const miAsignacion = usuario?.id ? obtenerEstadoZonaOperador(act.id, usuario.id) : undefined;
        const { rol: rolExtraido, zona: zonaExtraida } = extraerRolYZona(miTrabajador?.rolEnActividad);

        const miZonaTexto = miAsignacion?.zonaTrabajo || zonaExtraida || 'Zona asignada en campo';
        const miRolTexto = miAsignacion?.rolEnActividad || rolExtraido || 'Operador de campo';

        const miEstadoZona: 'PENDIENTE' | 'EN_PROGRESO' | 'COMPLETADA' = misTareas.length > 0
          ? misTareasCompletadas
            ? 'COMPLETADA'
            : misTareasEnProgreso
              ? 'EN_PROGRESO'
              : 'PENDIENTE'
          : miAsignacion?.estado || (estadoEfectivo === 'COMPLETADA' ? 'COMPLETADA' : 'PENDIENTE');

        const infoLabor = obtenerInfoTipoLabor(act.tipo);
        const tieneTituloPersonalizado = Boolean(act.titulo && act.titulo.trim() !== act.codigo.trim());

        const textoBadgeEstado =
          ((tieneTareasEspecificas && progresoTareas.todasCompletadas) ||
            (!tieneTareasEspecificas && progresoCuadrilla.todasCompletadas)) &&
          estadoEfectivo !== 'COMPLETADA'
            ? 'Por Validar'
            : formatearEstadoTexto(estadoEfectivo);

        const varianteBadgeEstado =
          ((tieneTareasEspecificas && progresoTareas.todasCompletadas) ||
            (!tieneTareasEspecificas && progresoCuadrilla.todasCompletadas)) &&
          estadoEfectivo !== 'COMPLETADA'
            ? 'alerta'
            : obtenerVarianteEstado(estadoEfectivo);

        return (
          <View key={act.id} style={[styles.tarjetaLabor, anchoTarjetaStyle]}>
            <View style={styles.cuerpoSuperiorTarjeta}>
              {/* Cabecera Destacada de Labor Agrícola (Idéntica distinción a creación) */}
              <View
                style={[
                  styles.cabeceraLaborDestacada,
                  { backgroundColor: infoLabor.tema.bg, borderColor: infoLabor.tema.border },
                ]}
              >
                <View style={styles.filaLaborSuperior}>
                  {/* Icono temático de la labor en círculo destacado */}
                  <View style={[styles.circuloIconoLabor, { backgroundColor: infoLabor.tema.badgeBg }]}>
                    <Text style={styles.emojiLabor}>{infoLabor.icono}</Text>
                  </View>

                  {/* Nombre oficial de la labor y subtítulo descriptivo */}
                  <View style={styles.infoLaborColumna}>
                    <Text style={[styles.nombreLaborDestacado, { color: infoLabor.tema.text }]}>
                      {infoLabor.label}
                    </Text>
                    <Text style={styles.descripcionLaborSubtexto} numberOfLines={1} ellipsizeMode="tail">
                      {tieneTituloPersonalizado ? act.titulo : infoLabor.descripcion}
                    </Text>
                  </View>

                  {/* Badge de Estado General */}
                  <Badge texto={textoBadgeEstado} variante={varianteBadgeEstado} />
                </View>

                {/* Código técnico de labor en tag secundario para trazabilidad */}
                <View style={styles.filaCodigoTag}>
                  <Text style={styles.textoEtiquetaCodigo}>CÓDIGO:</Text>
                  <Text style={styles.codigoLaborMonospace}>{act.codigo}</Text>
                </View>
              </View>

              {/* Ubicación: Parcela, Sector y Variedad */}
              <View style={styles.filaUbicacion}>
                <MapPin size={14} color={Palette.forestGreen} />
                <Text style={styles.textoUbicacion} numberOfLines={1}>
                  <Text style={{ fontWeight: '700', color: '#1B4332' }}>
                    {act.parcelaNombre || 'Parcela'}
                  </Text>
                  {act.sectorNombre ? ` · ${act.sectorNombre}` : ''}
                  {act.cultivoNombre ? ` (${act.cultivoNombre})` : ''}
                </Text>
              </View>

              {/* Supervisor o Responsable asignado (referencia operativa clara) */}
              {act.usuarioResponsableNombre ? (
                <View style={styles.filaSupervisor}>
                  <Users size={12} color="#6B7280" />
                  <Text style={styles.textoSupervisor} numberOfLines={1}>
                    Supervisor: {act.usuarioResponsableNombre}
                  </Text>
                </View>
              ) : null}

              {/* Indicaciones Operativas */}
              <View style={styles.cajaDescripcionDestacada}>
                <View style={styles.filaTituloDescripcion}>
                  <FileText size={12} color={Palette.forestGreen} />
                  <Text style={styles.etiquetaDescripcion}>Indicaciones Operativas:</Text>
                </View>
                <Text style={styles.cuerpoDescripcion} numberOfLines={2} ellipsizeMode="tail">
                  {act.descripcion && act.descripcion.trim().length > 0
                    ? act.descripcion
                    : 'Sin indicaciones adicionales especificadas por el supervisor o agrónomo.'}
                </Text>
              </View>

              {/* BLOQUE DESTACADO PERSONAL (SÓLO SI EL USUARIO ES OPERARIO ASIGNADO O TIENE ROL OPERADOR) */}
              {esOperarioAsignado && (
                misTareas.length > 0 ? (
                  <View style={styles.cajaZonaPersonal}>
                    <View style={styles.cabeceraZonaPersonal}>
                      <View style={styles.filaTituloZonaPersonal}>
                        <ListTodo size={13} color={Palette.forestGreen} />
                        <Text style={styles.etiquetaZonaPersonal}>
                          {misTareas.length === 1 ? 'Tu Tarea Asignada:' : `Tus Tareas (${misTareas.length}):`}
                        </Text>
                      </View>
                      <Badge
                        texto={
                          misTareas.every((t) => t.completada)
                            ? 'Finalizadas'
                            : misTareas.some((t) => t.estado === 'EN_PROGRESO')
                              ? 'En Terreno'
                              : 'Por Iniciar'
                        }
                        variante={
                          misTareas.every((t) => t.completada)
                            ? 'exito'
                            : misTareas.some((t) => t.estado === 'EN_PROGRESO')
                              ? 'info'
                              : 'alerta'
                        }
                      />
                    </View>

                    {misTareas.slice(0, 3).map((tarea) => (
                      <View key={tarea.id} style={styles.tarjetaTareaOperadorCard}>
                        <View style={{ flex: 1, gap: 2 }}>
                          <Text
                            style={[
                              styles.textoTituloTareaOperador,
                              tarea.completada && styles.textoTituloTareaOperadorCompletada,
                            ]}
                            numberOfLines={1}
                          >
                            {tarea.completada ? '✓ ' : '○ '}
                            {tarea.titulo}
                          </Text>
                        </View>

                        <View style={styles.columnaAccionTareaCard}>
                          {!tarea.completada ? (
                            tarea.estado === 'EN_PROGRESO' ? (
                              <Boton
                                titulo="Finalizar"
                                variante="primario"
                                tamano="sm"
                                onPress={() => handleFinalizarMiTarea(act, tarea.id)}
                              />
                            ) : (
                              <Boton
                                titulo="Iniciar"
                                variante="secundario"
                                tamano="sm"
                                onPress={() => handleIniciarMiTarea(act, tarea.id)}
                              />
                            )
                          ) : (
                            <Badge texto="Completada" variante="exito" />
                          )}
                        </View>
                      </View>
                    ))}
                    {misTareas.length > 3 && (
                      <Text style={styles.textoMasTareasMini}>
                        +{misTareas.length - 3} tareas más en bitácora
                      </Text>
                    )}
                  </View>
                ) : (
                  <View style={styles.cajaZonaPersonalMini}>
                    <View style={styles.filaTituloZonaPersonal}>
                      <Compass size={13} color={Palette.forestGreen} />
                      <Text style={styles.etiquetaZonaPersonal}>Tu Zona:</Text>
                      <Text style={styles.textoNombreZonaMini} numberOfLines={1}>
                        {miZonaTexto}
                      </Text>
                    </View>
                    <Badge
                      texto={
                        miEstadoZona === 'COMPLETADA'
                          ? 'Finalizada'
                          : miEstadoZona === 'EN_PROGRESO'
                            ? 'En Terreno'
                            : 'Por Iniciar'
                      }
                      variante={
                        miEstadoZona === 'COMPLETADA'
                          ? 'exito'
                          : miEstadoZona === 'EN_PROGRESO'
                            ? 'info'
                            : 'alerta'
                      }
                    />
                  </View>
                )
              )}

              {/* AVANCE DE LA CUADRILLA */}
              <View style={styles.cajaProgresoCuadrilla}>
                <View style={styles.filaCabeceraProgreso}>
                  <View style={styles.filaIconoTextoProgreso}>
                    <Users size={13} color={Palette.forestGreen} />
                    <Text style={styles.tituloProgresoCuadrilla}>Avance de Cuadrilla</Text>
                  </View>
                  <Text style={styles.porcentajeProgresoCuadrilla}>
                    {tieneTareasEspecificas ? progresoTareas.porcentaje : progresoCuadrilla.porcentaje}%
                  </Text>
                </View>

                <View style={styles.barraProgresoFondo}>
                  <View
                    style={[
                      styles.barraProgresoRelleno,
                      {
                        width: `${Math.min(
                          100,
                          Math.max(
                            0,
                            tieneTareasEspecificas ? progresoTareas.porcentaje : progresoCuadrilla.porcentaje,
                          ),
                        )}%`,
                      },
                    ]}
                  />
                </View>

                <Text style={styles.notaProgresoColaborativo} numberOfLines={1}>
                  {tieneTareasEspecificas
                    ? `${progresoTareas.tareasCompletadas} de ${progresoTareas.totalTareas} tareas completadas`
                    : `${progresoCuadrilla.zonasCompletadas} de ${progresoCuadrilla.totalZonas} operarios completaron su zona`}
                </Text>
              </View>

              {/* Metadatos: Fecha, Insumos, Operarios, Alertas */}
              <View style={styles.filaMetas}>
                <View style={styles.itemMeta}>
                  <Calendar size={12} color="#6B7280" />
                  <Text style={styles.textoMeta}>
                    {new Date(act.fechaInicio).toLocaleDateString('es-PE', {
                      day: '2-digit',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </Text>
                </View>

                {act.cantidadRecursos > 0 && (
                  <View style={styles.itemMeta}>
                    <Package size={12} color="#6B7280" />
                    <Text style={styles.textoMeta}>
                      {act.cantidadRecursos} {act.cantidadRecursos === 1 ? 'insumo' : 'insumos'}
                    </Text>
                  </View>
                )}

                {act.cantidadTrabajadores ? (
                  <View style={styles.itemMeta}>
                    <Users size={12} color="#6B7280" />
                    <Text style={styles.textoMeta}>
                      {act.cantidadTrabajadores} {act.cantidadTrabajadores === 1 ? 'operario' : 'operarios'}
                    </Text>
                  </View>
                ) : null}

                {hallazgos.length > 0 && (
                  <View style={[styles.itemMeta, styles.itemMetaAlerta]}>
                    <AlertTriangle size={12} color="#D97706" />
                    <Text style={[styles.textoMeta, { color: '#B45309', fontWeight: '600' }]}>
                      {hallazgos.length} {hallazgos.length === 1 ? 'alerta' : 'alertas'}
                    </Text>
                  </View>
                )}

                {puntoGuardado && (
                  <View style={[styles.itemMeta, styles.itemMetaGps]}>
                    <Navigation size={12} color={Palette.forestGreen} />
                    <Text style={[styles.textoMeta, { color: Palette.forestGreen }]} numberOfLines={1}>
                      📍 {puntoGuardado.referencia}
                    </Text>
                  </View>
                )}
              </View>
            </View>

            {/* Acciones de la Tarjeta / Botones Inferiores */}
            <View style={styles.filaAcciones}>
              {/* Botón Supervisor: Validar si la cuadrilla finalizó sus tareas */}
              {((tieneTareasEspecificas && progresoTareas.todasCompletadas) ||
                (!tieneTareasEspecificas && progresoCuadrilla.todasCompletadas)) &&
                estadoEfectivo !== 'COMPLETADA' &&
                esSupervisor && (
                  <Boton
                    titulo="✓ Validar y Finalizar"
                    variante="primario"
                    tamano="sm"
                    iconoIzquierda={<CheckCircle2 size={13} color={Palette.white} />}
                    onPress={() => onCambiarEstado?.(act, 'COMPLETADA')}
                  />
                )}

              {/* Botones Operario: Iniciar / Finalizar jornada */}
              {esOperarioAsignado && !tieneTareasEspecificas && miEstadoZona === 'PENDIENTE' && (
                <Boton
                  titulo="▶ Iniciar jornada"
                  variante="primario"
                  tamano="sm"
                  onPress={() => handleIniciarMiZona(act)}
                />
              )}

              {esOperarioAsignado && !tieneTareasEspecificas && miEstadoZona === 'EN_PROGRESO' && (
                <Boton
                  titulo="✓ Finalizar zona"
                  variante="primario"
                  tamano="sm"
                  onPress={() => handleFinalizarMiZona(act)}
                />
              )}

              {/* Botón Bitácora & Tareas (Acceso a detalles completos) */}
              <Boton
                titulo="Bitácora & Tareas"
                variante="secundario"
                tamano="sm"
                iconoDerecha={<ArrowRight size={13} color={Palette.forestGreen} />}
                onPress={() => onVerDetalle(act)}
              />
            </View>
          </View>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  contenedor: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    alignItems: 'stretch',
    width: '100%',
  },
  cajaVacia: {
    padding: 30,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    width: '100%',
  },
  textoVacio: {
    fontSize: 14,
    color: '#6B7280',
    fontStyle: 'italic',
  },
  tarjetaLabor: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#D7E3CF',
    padding: 16,
    gap: 12,
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  cuerpoSuperiorTarjeta: {
    gap: 10,
    flex: 1,
  },
  cabeceraLaborDestacada: {
    borderWidth: 1,
    borderRadius: 10,
    padding: 10,
    gap: 6,
  },
  filaLaborSuperior: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  circuloIconoLabor: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emojiLabor: {
    fontSize: 18,
  },
  infoLaborColumna: {
    flex: 1,
    gap: 1,
  },
  nombreLaborDestacado: {
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
  descripcionLaborSubtexto: {
    fontSize: 11,
    color: '#4B5563',
    fontWeight: '500',
  },
  filaCodigoTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingTop: 4,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 0, 0, 0.06)',
  },
  textoEtiquetaCodigo: {
    fontSize: 9,
    fontWeight: '700',
    color: '#6B7280',
    letterSpacing: 0.5,
  },
  codigoLaborMonospace: {
    fontSize: 11,
    fontWeight: '700',
    color: '#374151',
    fontFamily: Platform.OS === 'web' ? 'monospace' : undefined,
  },
  filaUbicacion: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  textoUbicacion: {
    fontSize: 13,
    color: '#374151',
    flex: 1,
  },
  filaSupervisor: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: -2,
  },
  textoSupervisor: {
    fontSize: 11,
    color: '#6B7280',
    fontStyle: 'italic',
  },
  cajaDescripcionDestacada: {
    backgroundColor: '#F8FAF5',
    borderLeftWidth: 3,
    borderLeftColor: Palette.forestGreen,
    paddingVertical: 7,
    paddingHorizontal: 9,
    borderRadius: 6,
    gap: 2,
  },
  filaTituloDescripcion: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  etiquetaDescripcion: {
    fontSize: 10,
    fontWeight: '700',
    color: Palette.forestGreen,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  cuerpoDescripcion: {
    fontSize: 12,
    color: '#374151',
    lineHeight: 16,
  },
  cajaZonaPersonal: {
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#86EFAC',
    borderRadius: 8,
    padding: 10,
    gap: 6,
  },
  cajaZonaPersonalMini: {
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#86EFAC',
    borderRadius: 8,
    padding: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  cabeceraZonaPersonal: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  filaTituloZonaPersonal: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    flex: 1,
  },
  etiquetaZonaPersonal: {
    fontSize: 11,
    fontWeight: '800',
    color: Palette.forestGreen,
  },
  textoNombreZonaMini: {
    fontSize: 12,
    fontWeight: '700',
    color: '#14532D',
    flex: 1,
  },
  tarjetaTareaOperadorCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D1E7DD',
    borderRadius: 6,
    padding: 6,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
  },
  textoTituloTareaOperador: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1B4332',
  },
  textoTituloTareaOperadorCompletada: {
    textDecorationLine: 'line-through',
    color: '#6B7280',
  },
  columnaAccionTareaCard: {
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  textoMasTareasMini: {
    fontSize: 10,
    color: Palette.forestGreen,
    fontStyle: 'italic',
    textAlign: 'center',
  },
  cajaProgresoCuadrilla: {
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    padding: 9,
    gap: 5,
  },
  filaCabeceraProgreso: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  filaIconoTextoProgreso: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  tituloProgresoCuadrilla: {
    fontSize: 11,
    color: '#374151',
    fontWeight: '700',
  },
  porcentajeProgresoCuadrilla: {
    fontSize: 12,
    color: Palette.forestGreen,
    fontWeight: '800',
  },
  barraProgresoFondo: {
    height: 6,
    backgroundColor: '#E5E7EB',
    borderRadius: 3,
    overflow: 'hidden',
  },
  barraProgresoRelleno: {
    height: '100%',
    backgroundColor: Palette.forestGreen,
    borderRadius: 3,
  },
  notaProgresoColaborativo: {
    fontSize: 11,
    color: '#6B7280',
  },
  filaMetas: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  itemMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#F3F4F6',
    paddingVertical: 3,
    paddingHorizontal: 7,
    borderRadius: 5,
  },
  itemMetaAlerta: {
    backgroundColor: '#FEF3C7',
  },
  itemMetaGps: {
    backgroundColor: '#E6F4EA',
    maxWidth: 160,
  },
  textoMeta: {
    fontSize: 11,
    color: '#4B5563',
    fontWeight: '500',
  },
  filaAcciones: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    gap: 8,
    marginTop: 'auto',
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    paddingTop: 10,
    flexWrap: 'wrap',
  },
});