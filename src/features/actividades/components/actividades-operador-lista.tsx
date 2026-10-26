import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
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
import { ActividadItem, EstadoActividadTipo, extraerRolYZona } from '../types/actividad.types';
import { useOperadorJornadaStore } from '../stores/operador-jornada.store';
import { useAuthStore } from '@/features/autenticacion';

export interface ActividadesOperadorListaProps {
  actividades: ActividadItem[];
  cargando?: boolean;
  onVerDetalle: (actividad: ActividadItem) => void;
  onCambiarEstado?: (actividad: ActividadItem, nuevoEstado?: EstadoActividadTipo) => void;
}

/**
 * @description Vista adaptada para el Operador de Campo. Presenta cada labor destacando
 * específicamente la tarea que le fue asignada por el supervisor, el avance colaborativo de la cuadrilla
 * y el botón para iniciar/completar su labor (la actividad general solo se cierra cuando
 * todas las tareas de los operadores se completan).
 */
export const ActividadesOperadorLista: React.FC<ActividadesOperadorListaProps> = ({
  actividades,
  cargando = false,
  onVerDetalle,
  onCambiarEstado,
}) => {
  const usuario = useAuthStore((s) => s.usuario);
  const {
    subtareasPorActividad,
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

  // Sincronizar cuadrillas y zonas asignadas con el store de persistencia local
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
    iniciarTareaOperador(act.id, tareaId);
    if (act.estado === 'PENDIENTE' && onCambiarEstado) {
      onCambiarEstado(act, 'EN_PROGRESO');
    }
  };

  const handleFinalizarMiTarea = (act: ActividadItem, tareaId: string) => {
    if (!usuario?.id) return;
    const nombreUsuario =
      usuario.nombreCompleto || `${usuario.nombres} ${usuario.apellidos}`.trim() || 'Operador';
    const resultado = completarTareaOperador(act.id, tareaId, nombreUsuario);

    // Si todas las tareas de la actividad fueron completadas, marcar la actividad macro como COMPLETADA
    if (resultado.todasCompletadas && onCambiarEstado) {
      onCambiarEstado(act, 'COMPLETADA');
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
    const resultado = completarZonaOperador(act.id, usuario.id);
    if (resultado.todasCompletadas && onCambiarEstado) {
      onCambiarEstado(act, 'COMPLETADA');
    }
  };

  const obtenerVarianteEstado = (
    estado: EstadoActividadTipo,
  ): 'exito' | 'info' | 'alerta' | 'peligro' | 'neutro' => {
    switch (estado) {
      case 'COMPLETADA':
        return 'exito';
      case 'EN_PROGRESO':
        return 'info';
      case 'PENDIENTE':
        return 'alerta';
      case 'CANCELADA':
        return 'peligro';
      default:
        return 'neutro';
    }
  };

  const formatearEstadoTexto = (estado: EstadoActividadTipo): string => {
    switch (estado) {
      case 'COMPLETADA':
        return 'Completada';
      case 'EN_PROGRESO':
        return 'En Progreso';
      case 'PENDIENTE':
        return 'Pendiente';
      case 'CANCELADA':
        return 'Cancelada';
      default:
        return estado;
    }
  };

  if (actividades.length === 0 && !cargando) {
    return (
      <View style={styles.cajaVacia}>
        <Text style={styles.textoVacio}>No tienes labores asignadas programadas por el momento.</Text>
      </View>
    );
  }

  return (
    <View style={styles.contenedor}>
      {actividades.map((act) => {
        const subtareas = subtareasPorActividad[act.id] || [];
        const hallazgos = hallazgosPorActividad[act.id] || [];
        const puntoGuardado = puntosAvancePorActividad[act.id];

        // Tareas específicas asignadas a este operador
        const misTareas = subtareas.filter((t) => t.responsableId === usuario?.id);
        const tieneTareasEspecificas = subtareas.length > 0;
        const progresoTareas = obtenerProgresoTareas(act.id);

        // Fallback de zona de operario
        const miAsignacion = usuario?.id ? obtenerEstadoZonaOperador(act.id, usuario.id) : undefined;
        const miTrabajador = act.trabajadores?.find((t) => t.usuarioId === usuario?.id);
        const { rol: rolExtraido, zona: zonaExtraida } = extraerRolYZona(miTrabajador?.rolEnActividad);

        const miZonaTexto = miAsignacion?.zonaTrabajo || zonaExtraida || 'Zona de labor asignada';
        const miRolTexto = miAsignacion?.rolEnActividad || rolExtraido || 'Operador de campo';
        const miEstadoZona =
          miAsignacion?.estado || (act.estado === 'COMPLETADA' ? 'COMPLETADA' : 'PENDIENTE');

        const totalCuadrilla = act.trabajadores?.length || act.cantidadTrabajadores || 1;
        const progresoCuadrilla = obtenerProgresoActividad(act.id, totalCuadrilla);

        return (
          <View key={act.id} style={styles.tarjetaLabor}>
            {/* BLOQUE DESTACADO: LA TAREA QUE SE LE DIO AL OPERADOR POR EL SUPERVISOR */}
            {misTareas.length > 0 ? (
              <View style={styles.cajaZonaPersonal}>
                <View style={styles.cabeceraZonaPersonal}>
                  <View style={styles.filaTituloZonaPersonal}>
                    <ListTodo size={16} color={Palette.forestGreen} />
                    <Text style={styles.etiquetaZonaPersonal}>
                      {misTareas.length === 1 ? 'Tu Tarea Asignada:' : `Tus Tareas Asignadas (${misTareas.length}):`}
                    </Text>
                  </View>
                  <Badge
                    texto={
                      misTareas.every((t) => t.completada)
                        ? '✓ Tareas Finalizadas'
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

                {misTareas.map((tarea) => (
                  <View key={tarea.id} style={styles.tarjetaTareaOperadorCard}>
                    <View style={{ flex: 1, gap: 2 }}>
                      <Text
                        style={[
                          styles.textoTituloTareaOperador,
                          tarea.completada && styles.textoTituloTareaOperadorCompletada,
                        ]}
                      >
                        {tarea.completada ? '✓ ' : '○ '}
                        {tarea.titulo}
                      </Text>
                      {tarea.zonaTrabajo ? (
                        <Text style={styles.textoZonaOperadorCard}>
                          📍 Zona: <Text style={{ fontWeight: '700' }}>{tarea.zonaTrabajo}</Text>
                        </Text>
                      ) : null}
                      {tarea.descripcion ? (
                        <Text style={styles.textoIndicacionTareaCard}>
                          📝 {tarea.descripcion}
                        </Text>
                      ) : null}
                      {tarea.completada && tarea.completadaEn ? (
                        <Text style={styles.textoCompletadoMini}>
                          Finalizada a las{' '}
                          {new Date(tarea.completadaEn).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </Text>
                      ) : null}
                    </View>

                    <View style={styles.columnaAccionTareaCard}>
                      {!tarea.completada ? (
                        tarea.estado === 'EN_PROGRESO' ? (
                          <Boton
                            titulo="✓ Finalizar"
                            variante="primario"
                            tamano="sm"
                            onPress={() => handleFinalizarMiTarea(act, tarea.id)}
                          />
                        ) : (
                          <Boton
                            titulo="▶ Iniciar"
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
              </View>
            ) : (
              /* Fallback si el supervisor aún no ha desglosado tareas específicas a su nombre */
              <View style={styles.cajaZonaPersonal}>
                <View style={styles.cabeceraZonaPersonal}>
                  <View style={styles.filaTituloZonaPersonal}>
                    <Compass size={16} color={Palette.forestGreen} />
                    <Text style={styles.etiquetaZonaPersonal}>Tu Zona / Subárea Asignada:</Text>
                  </View>
                  <Badge
                    texto={
                      miEstadoZona === 'COMPLETADA'
                        ? '✓ Finalizada'
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

                <Text style={styles.textoNombreZona}>📍 {miZonaTexto}</Text>
                <Text style={styles.textoRolEnZona}>Rol operativo: {miRolTexto}</Text>
                {tieneTareasEspecificas ? (
                  <Text style={styles.textoAvisoSinTareas}>
                    Las tareas desglosadas por el supervisor en esta actividad corresponden a otros compañeros de la cuadrilla.
                  </Text>
                ) : (
                  <Text style={styles.textoAvisoSinTareas}>
                    El supervisor aún no ha desglosado tareas individuales con responsable específico para esta labor.
                  </Text>
                )}
              </View>
            )}

            {/* Contexto General de la Actividad Macro */}
            <View style={styles.cabeceraTarjeta}>
              <View style={{ flex: 1 }}>
                <View style={styles.filaCodigoTipo}>
                  <Text style={styles.codigoLabor}>{act.codigo}</Text>
                  <Text style={styles.tipoLabor}>{act.tipo.replace(/_/g, ' ')}</Text>
                </View>
                <Text style={styles.tituloLabor}>{act.titulo}</Text>
              </View>

              <Badge
                texto={`Labor General: ${formatearEstadoTexto(act.estado)}`}
                variante={obtenerVarianteEstado(act.estado)}
              />
            </View>

            {/* Ubicación y Parcela */}
            <View style={styles.filaUbicacion}>
              <MapPin size={15} color={Palette.forestGreen} />
              <Text style={styles.textoUbicacion}>
                <Text style={{ fontWeight: '700' }}>{act.parcelaNombre || 'Parcela'}</Text>
                {act.sectorNombre ? ` · ${act.sectorNombre}` : ''}
                {act.cultivoNombre ? ` (${act.cultivoNombre})` : ''}
              </Text>
            </View>

            {/* DESCRIPCIÓN OPERATIVA */}
            <View style={styles.cajaDescripcionDestacada}>
              <View style={styles.filaTituloDescripcion}>
                <FileText size={15} color={Palette.forestGreen} />
                <Text style={styles.etiquetaDescripcion}>Indicaciones Operativas:</Text>
              </View>
              <Text style={styles.cuerpoDescripcion}>
                {act.descripcion && act.descripcion.trim().length > 0
                  ? act.descripcion
                  : 'Sin indicaciones adicionales especificadas por el supervisor o agrónomo.'}
              </Text>
            </View>

            {/* AVANCE DE LA CUADRILLA */}
            <View style={styles.cajaProgresoCuadrilla}>
              <View style={styles.filaCabeceraProgreso}>
                <View style={styles.filaIconoTextoProgreso}>
                  <Users size={14} color={Palette.forestGreen} />
                  <Text style={styles.tituloProgresoCuadrilla}>
                    {tieneTareasEspecificas ? (
                      <>
                        Avance de Cuadrilla:{' '}
                        <Text style={{ fontWeight: '800', color: Palette.forestGreen }}>
                          {progresoTareas.tareasCompletadas} de {progresoTareas.totalTareas} tareas
                        </Text>{' '}
                        completadas ({progresoTareas.porcentaje}%)
                      </>
                    ) : (
                      <>
                        Avance de Cuadrilla:{' '}
                        <Text style={{ fontWeight: '800', color: Palette.forestGreen }}>
                          {progresoCuadrilla.zonasCompletadas} de {progresoCuadrilla.totalZonas} operarios
                        </Text>{' '}
                        completaron su zona ({progresoCuadrilla.porcentaje}%)
                      </>
                    )}
                  </Text>
                </View>
              </View>

              {/* Barra de progreso */}
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

              {/* Nota explicativa de completado colaborativo */}
              <Text style={styles.notaProgresoColaborativo}>
                {(tieneTareasEspecificas ? progresoTareas.todasCompletadas : progresoCuadrilla.todasCompletadas)
                  ? '🎉 Toda la cuadrilla ha finalizado todas las tareas. Labor general cerrada.'
                  : misTareas.length > 0 && misTareas.every((t) => t.completada)
                    ? '✓ Has completado tus tareas asignadas. Esperando que tus compañeros de cuadrilla completen las suyas para cerrar la labor general.'
                    : miEstadoZona === 'COMPLETADA'
                      ? '✓ Tu zona está finalizada. Esperando que tus compañeros de cuadrilla completen las suyas para cerrar la labor general.'
                      : 'Cada operario debe marcar completadas sus tareas asignadas para cerrar la labor general.'}
              </Text>
            </View>

            {/* Fecha y Resumen de Insumos */}
            <View style={styles.filaMetas}>
              <View style={styles.itemMeta}>
                <Calendar size={13} color="#6B7280" />
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
                  <Package size={13} color="#6B7280" />
                  <Text style={styles.textoMeta}>
                    {act.cantidadRecursos} {act.cantidadRecursos === 1 ? 'insumo' : 'insumos'}
                  </Text>
                </View>
              )}
            </View>

            {/* Resumen del Turno del Operador (Pills de avance) */}
            <View style={styles.filaResumenTurno}>
              {subtareas.length > 0 && (
                <View style={styles.pillResumen}>
                  <CheckCircle2 size={13} color={Palette.forestGreen} />
                  <Text style={styles.textoPillResumen}>
                    {subtareas.filter((s) => s.completada).length}/{subtareas.length} tareas del turno
                  </Text>
                </View>
              )}

              {hallazgos.length > 0 && (
                <View style={[styles.pillResumen, styles.pillAlerta]}>
                  <AlertTriangle size={13} color="#D97706" />
                  <Text style={[styles.textoPillResumen, { color: '#B45309' }]}>
                    {hallazgos.length} {hallazgos.length === 1 ? 'novedad' : 'novedades'}
                  </Text>
                </View>
              )}

              {puntoGuardado && (
                <View style={[styles.pillResumen, styles.pillPuntoGps]}>
                  <Navigation size={13} color={Palette.forestGreen} />
                  <Text style={styles.textoPillResumen} numberOfLines={1} ellipsizeMode="tail">
                    📍 {puntoGuardado.referencia}
                  </Text>
                </View>
              )}
            </View>

            {/* Acciones principales del Operador */}
            <View style={styles.filaAcciones}>
              {/* Si no tiene tareas específicas desglosadas, permitir iniciar/completar zona */}
              {!tieneTareasEspecificas && miEstadoZona === 'PENDIENTE' && (
                <Boton
                  titulo="▶ Iniciar mi jornada en esta zona"
                  variante="primario"
                  tamano="sm"
                  onPress={() => handleIniciarMiZona(act)}
                />
              )}

              {!tieneTareasEspecificas && miEstadoZona === 'EN_PROGRESO' && (
                <Boton
                  titulo="✓ Finalizar mi zona de trabajo"
                  variante="primario"
                  tamano="sm"
                  onPress={() => handleFinalizarMiZona(act)}
                />
              )}

              {((tieneTareasEspecificas &&
                misTareas.length > 0 &&
                misTareas.every((t) => t.completada) &&
                !progresoTareas.todasCompletadas) ||
                (!tieneTareasEspecificas &&
                  miEstadoZona === 'COMPLETADA' &&
                  !progresoCuadrilla.todasCompletadas)) && (
                <View style={styles.pillZonaFinalizadaEsperando}>
                  <CheckCircle2 size={13} color="#059669" />
                  <Text style={styles.textoZonaFinalizadaEsperando}>
                    Tus tareas están listas (esperando cuadrilla)
                  </Text>
                </View>
              )}

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
    gap: 14,
  },
  cajaVacia: {
    padding: 30,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
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
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  cajaZonaPersonal: {
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#86EFAC',
    borderRadius: 10,
    padding: 12,
    gap: 6,
  },
  cabeceraZonaPersonal: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    marginBottom: 2,
  },
  filaTituloZonaPersonal: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  etiquetaZonaPersonal: {
    fontSize: 11,
    fontWeight: '800',
    color: Palette.forestGreen,
    textTransform: 'uppercase',
  },
  textoNombreZona: {
    fontSize: 15,
    fontWeight: '800',
    color: '#14532D',
  },
  textoRolEnZona: {
    fontSize: 12,
    color: '#166534',
    fontWeight: '500',
  },
  textoAvisoSinTareas: {
    fontSize: 11,
    color: '#4B5563',
    fontStyle: 'italic',
    marginTop: 2,
  },
  tarjetaTareaOperadorCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D1E7DD',
    borderRadius: 8,
    padding: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 10,
    marginTop: 4,
  },
  textoTituloTareaOperador: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1B4332',
  },
  textoTituloTareaOperadorCompletada: {
    textDecorationLine: 'line-through',
    color: '#6B7280',
  },
  textoZonaOperadorCard: {
    fontSize: 11,
    color: '#14532D',
  },
  textoIndicacionTareaCard: {
    fontSize: 11,
    color: '#4B5563',
    fontStyle: 'italic',
    marginTop: 2,
  },
  textoCompletadoMini: {
    fontSize: 10,
    color: Palette.forestGreen,
    fontWeight: '600',
    marginTop: 2,
  },
  columnaAccionTareaCard: {
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  cabeceraTarjeta: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
  },
  filaCodigoTipo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 2,
  },
  codigoLabor: {
    fontSize: 12,
    fontWeight: '700',
    color: Palette.forestGreen,
    fontFamily: Platform.OS === 'web' ? 'monospace' : undefined,
  },
  tipoLabor: {
    fontSize: 11,
    fontWeight: '600',
    color: '#6B7280',
    textTransform: 'uppercase',
  },
  tituloLabor: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
  },
  filaUbicacion: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  textoUbicacion: {
    fontSize: 13,
    color: '#374151',
  },
  cajaDescripcionDestacada: {
    backgroundColor: '#F8FAF5',
    borderLeftWidth: 3.5,
    borderLeftColor: Palette.forestGreen,
    padding: 10,
    borderRadius: 8,
    gap: 4,
  },
  filaTituloDescripcion: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  etiquetaDescripcion: {
    fontSize: 11,
    fontWeight: '700',
    color: Palette.forestGreen,
    textTransform: 'uppercase',
  },
  cuerpoDescripcion: {
    fontSize: 13,
    color: '#2D3748',
    lineHeight: 18,
  },
  cajaProgresoCuadrilla: {
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    padding: 10,
    gap: 6,
  },
  filaCabeceraProgreso: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  filaIconoTextoProgreso: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  tituloProgresoCuadrilla: {
    fontSize: 12,
    color: '#374151',
    fontWeight: '600',
  },
  barraProgresoFondo: {
    height: 7,
    backgroundColor: '#E5E7EB',
    borderRadius: 4,
    overflow: 'hidden',
  },
  barraProgresoRelleno: {
    height: '100%',
    backgroundColor: Palette.forestGreen,
    borderRadius: 4,
  },
  notaProgresoColaborativo: {
    fontSize: 11,
    color: '#6B7280',
    fontStyle: 'italic',
  },
  filaMetas: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  itemMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  textoMeta: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
  },
  filaResumenTurno: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  pillResumen: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#EDF5E8',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 6,
  },
  pillAlerta: {
    backgroundColor: '#FEF3C7',
  },
  pillPuntoGps: {
    backgroundColor: '#E6F4EA',
    maxWidth: 220,
  },
  textoPillResumen: {
    fontSize: 11,
    fontWeight: '600',
    color: Palette.forestGreen,
  },
  filaAcciones: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    gap: 10,
    marginTop: 4,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    paddingTop: 12,
    flexWrap: 'wrap',
  },
  pillZonaFinalizadaEsperando: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  textoZonaFinalizadaEsperando: {
    fontSize: 11,
    fontWeight: '700',
    color: '#065F46',
  },
});
