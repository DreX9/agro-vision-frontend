import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView } from 'react-native';
import {
  Info,
  Users,
  Calendar,
  MapPin,
  User,
  Package,
  Clock,
  Phone,
  ClipboardCheck,
  ClipboardList,
  Pencil,
  CheckCircle2,
} from 'lucide-react-native';
import { Palette } from '@/constants/theme';
import { Badge, Boton, Input, Select, type SelectOpcion } from '@/shared/components/ui';
import { ActividadDetalle, EstadoActividadTipo } from '../types/actividad.types';
import { OperadorJornadaPanel } from './operador-jornada-panel';
import { useAuthStore } from '@/features/autenticacion';

export interface ActividadDetalleTabsProps {
  actividad: ActividadDetalle;
  onGuardarSeguimiento?: (datos: {
    estado: EstadoActividadTipo;
    descripcion?: string;
    observaciones?: string;
  }) => void;
  guardandoSeguimiento?: boolean;
  editandoSeguimientoDirecto?: boolean;
  onCerrarEdicionSeguimiento?: () => void;
}

const OPCIONES_ESTADO: SelectOpcion[] = [
  { label: '🟡 Pendiente (Programada para campo)', valor: 'PENDIENTE' },
  { label: '🔵 En Progreso (Cuadrilla operando en campo)', valor: 'EN_PROGRESO' },
  { label: '🟢 Completada (Labor finalizada en terreno)', valor: 'COMPLETADA' },
  { label: '🔴 Cancelada (Labor suspendida o anulada)', valor: 'CANCELADA' },
];

/**
 * @description Vista con pestañas (Tabs) para inspeccionar la ficha técnica, la cuadrilla asignada,
 * actualizar el seguimiento y acceder a la bitácora de turno del operador (subtareas, hallazgos, GPS).
 */
export const ActividadDetalleTabs: React.FC<ActividadDetalleTabsProps> = ({
  actividad,
  onGuardarSeguimiento,
  guardandoSeguimiento = false,
  editandoSeguimientoDirecto = false,
  onCerrarEdicionSeguimiento,
}) => {
  const usuario = useAuthStore((s) => s.usuario);
  const esOperador = usuario?.rol === 'OPERADOR';
  const [tabActivo, setTabActivo] = useState<'info' | 'cuadrilla' | 'jornada'>(
    esOperador ? 'jornada' : 'info',
  );
  const [editandoSeguimiento, setEditandoSeguimiento] = useState(false);
  const [estadoForm, setEstadoForm] = useState<EstadoActividadTipo>(actividad.estado);
  const [descripcionForm, setDescripcionForm] = useState(actividad.descripcion || '');
  const [observacionesForm, setObservacionesForm] = useState(actividad.observaciones || '');

  useEffect(() => {
    setEstadoForm(actividad.estado);
    setDescripcionForm(actividad.descripcion || '');
    setObservacionesForm(actividad.observaciones || '');
  }, [actividad]);

  useEffect(() => {
    if (editandoSeguimientoDirecto) {
      setTabActivo('info');
      setEditandoSeguimiento(true);
    }
  }, [editandoSeguimientoDirecto]);

  const handleCancelarEdicion = () => {
    setEstadoForm(actividad.estado);
    setDescripcionForm(actividad.descripcion || '');
    setObservacionesForm(actividad.observaciones || '');
    setEditandoSeguimiento(false);
    if (onCerrarEdicionSeguimiento) onCerrarEdicionSeguimiento();
  };

  const handleGuardar = () => {
    if (onGuardarSeguimiento) {
      onGuardarSeguimiento({
        estado: estadoForm,
        descripcion: descripcionForm,
        observaciones: observacionesForm,
      });
      setEditandoSeguimiento(false);
      if (onCerrarEdicionSeguimiento) onCerrarEdicionSeguimiento();
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

  return (
    <View style={styles.contenedor}>
      {/* Selector de pestañas */}
      <View style={styles.barraTabs}>
        <Pressable
          onPress={() => setTabActivo('info')}
          style={[styles.botonTab, tabActivo === 'info' && styles.botonTabActivo]}
        >
          <Info size={16} color={tabActivo === 'info' ? Palette.forestGreen : '#6B7280'} />
          <Text style={[styles.textoTab, tabActivo === 'info' && styles.textoTabActivo]}>
            Información General e Insumos
          </Text>
        </Pressable>

        <Pressable
          onPress={() => setTabActivo('cuadrilla')}
          style={[styles.botonTab, tabActivo === 'cuadrilla' && styles.botonTabActivo]}
        >
          <Users size={16} color={tabActivo === 'cuadrilla' ? Palette.forestGreen : '#6B7280'} />
          <Text style={[styles.textoTab, tabActivo === 'cuadrilla' && styles.textoTabActivo]}>
            Cuadrilla ({actividad.trabajadores.length})
          </Text>
        </Pressable>

        <Pressable
          onPress={() => setTabActivo('jornada')}
          style={[styles.botonTab, tabActivo === 'jornada' && styles.botonTabActivo]}
        >
          <ClipboardList size={16} color={tabActivo === 'jornada' ? Palette.forestGreen : '#6B7280'} />
          <Text style={[styles.textoTab, tabActivo === 'jornada' && styles.textoTabActivo]}>
            Bitácora y Turno del Operador
          </Text>
        </Pressable>
      </View>

      {/* Contenido según pestaña */}
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.contenidoScroll}
        showsVerticalScrollIndicator={false}
      >
        {tabActivo === 'info' ? (
          <View style={styles.bloqueTab}>
            {/* Cabecera de la labor */}
            <View style={styles.tarjetaFicha}>
              <View style={styles.cabeceraFicha}>
                <View>
                  <Text style={styles.codigoLabor}>{actividad.codigo}</Text>
                  <Text style={styles.tituloLabor}>{actividad.titulo}</Text>
                </View>
                <Badge
                  texto={actividad.estado}
                  variante={obtenerVarianteEstado(actividad.estado)}
                />
              </View>

              <View style={styles.grillaMetadatos}>
                <View style={styles.itemMeta}>
                  <MapPin size={16} color={Palette.forestGreen} />
                  <View>
                    <Text style={styles.etiquetaMeta}>Parcela y Cultivo</Text>
                    <Text style={styles.valorMeta}>
                      {actividad.parcelaNombre || 'Parcela'} {actividad.cultivoNombre ? `(${actividad.cultivoNombre})` : ''}
                    </Text>
                  </View>
                </View>

                <View style={styles.itemMeta}>
                  <User size={16} color={Palette.forestGreen} />
                  <View>
                    <Text style={styles.etiquetaMeta}>Responsable Técnico</Text>
                    <Text style={styles.valorMeta}>
                      {actividad.usuarioResponsableNombre || 'Sin asignar'}
                    </Text>
                  </View>
                </View>

                <View style={styles.itemMeta}>
                  <Calendar size={16} color={Palette.forestGreen} />
                  <View>
                    <Text style={styles.etiquetaMeta}>Fecha de Inicio</Text>
                    <Text style={styles.valorMeta}>
                      {new Date(actividad.fechaInicio).toLocaleDateString('es-PE', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric',
                      })}
                    </Text>
                  </View>
                </View>

                <View style={styles.itemMeta}>
                  <Clock size={16} color={Palette.forestGreen} />
                  <View>
                    <Text style={styles.etiquetaMeta}>Fecha Fin / Límite</Text>
                    <Text style={styles.valorMeta}>
                      {actividad.fechaFin
                        ? new Date(actividad.fechaFin).toLocaleDateString('es-PE', {
                            day: 'numeric',
                            month: 'long',
                            year: 'numeric',
                          })
                        : 'No especificada'}
                    </Text>
                  </View>
                </View>
              </View>
            </View>

            {/* Tarjeta Interactiva: Seguimiento, Estado y Control Operativo */}
            <View style={styles.tarjetaFicha}>
              <View style={styles.cabeceraSeguimiento}>
                <View style={styles.filaTituloSeguimiento}>
                  <ClipboardCheck size={18} color={Palette.forestGreen} />
                  <Text style={styles.tituloSeccion}>Seguimiento, Estado y Control Operativo</Text>
                </View>
                {!editandoSeguimiento && Boolean(onGuardarSeguimiento) && (
                  <Boton
                    titulo="Actualizar Estado / Notas"
                    variante="secundario"
                    iconoIzquierda={<Pencil size={14} color={Palette.forestGreen} />}
                    onPress={() => setEditandoSeguimiento(true)}
                  />
                )}
              </View>

              {!editandoSeguimiento ? (
                <View style={styles.cuerpoSeguimiento}>
                  <View style={styles.filaEstadoActual}>
                    <Text style={styles.etiquetaEstadoActual}>Estado actual:</Text>
                    <Badge
                      texto={formatearEstadoTexto(actividad.estado)}
                      variante={obtenerVarianteEstado(actividad.estado)}
                    />
                  </View>

                  <View style={styles.cajaTexto}>
                    <Text style={styles.subtituloTexto}>Descripción operativa:</Text>
                    <Text style={actividad.descripcion ? styles.cuerpoTexto : styles.textoVacio}>
                      {actividad.descripcion || 'Sin descripción operativa registrada.'}
                    </Text>
                  </View>

                  <View style={styles.cajaTexto}>
                    <Text style={styles.subtituloTexto}>Condiciones climáticas / Observaciones de campo:</Text>
                    <Text style={actividad.observaciones ? styles.cuerpoTexto : styles.textoVacio}>
                      {actividad.observaciones || 'Sin observaciones o advertencias registradas.'}
                    </Text>
                  </View>
                </View>
              ) : (
                <View style={styles.formularioSeguimiento}>
                  <Select
                    label="Estado de la Actividad *"
                    valor={estadoForm}
                    opciones={OPCIONES_ESTADO}
                    onChange={(v) => setEstadoForm(v as EstadoActividadTipo)}
                  />

                  <Input
                    label="Descripción Operativa"
                    placeholder="Detalles sobre dosis de aplicación, sectores o indicaciones..."
                    value={descripcionForm}
                    onChangeText={setDescripcionForm}
                    multiline
                    numberOfLines={3}
                  />

                  <Input
                    label="Condiciones Climáticas o Seguridad"
                    placeholder="Ej. Realizar en horario matutino sin presencia de viento fuerte..."
                    value={observacionesForm}
                    onChangeText={setObservacionesForm}
                    multiline
                    numberOfLines={3}
                  />

                  <View style={styles.filaBotonesSeguimiento}>
                    <Boton
                      titulo="Cancelar"
                      variante="secundario"
                      onPress={handleCancelarEdicion}
                    />
                    <Boton
                      titulo="Guardar Seguimiento"
                      variante="primario"
                      iconoIzquierda={<CheckCircle2 size={16} color={Palette.white} />}
                      cargando={guardandoSeguimiento}
                      onPress={handleGuardar}
                    />
                  </View>
                </View>
              )}
            </View>

            {/* Insumos y Recursos */}
            <View style={styles.tarjetaFicha}>
              <Text style={styles.tituloSeccion}>Insumos y Equipos Requeridos</Text>
              {actividad.recursos.length === 0 ? (
                <Text style={styles.textoVacio}>No se planificaron insumos para esta labor.</Text>
              ) : (
                <View style={styles.listaRecursos}>
                  {actividad.recursos.map((r) => (
                    <View key={r.id} style={styles.filaRecurso}>
                      <View style={styles.iconoRecurso}>
                        <Package size={16} color={Palette.forestGreen} />
                      </View>
                      <View style={styles.infoRecurso}>
                        <Text style={styles.nombreRecurso}>{r.nombreInsumo}</Text>
                        <Text style={styles.categoriaRecurso}>{r.categoriaInsumo}</Text>
                      </View>
                      <View style={styles.badgeCantidad}>
                        <Text style={styles.textoCantidad}>
                          {r.cantidadEstimada} {r.unidadMedida}
                        </Text>
                      </View>
                    </View>
                  ))}
                </View>
              )}
            </View>
          </View>
        ) : tabActivo === 'cuadrilla' ? (
          /* Tab Cuadrilla */
          <View style={styles.bloqueTab}>
            <View style={styles.tarjetaFicha}>
              <Text style={styles.tituloSeccion}>Personal y Operarios Asignados</Text>
              {actividad.trabajadores.length === 0 ? (
                <Text style={styles.textoVacio}>No se han asignado trabajadores a esta actividad.</Text>
              ) : (
                <View style={styles.listaTrabajadores}>
                  {actividad.trabajadores.map((t) => (
                    <View key={t.id} style={styles.tarjetaOperario}>
                      <View style={styles.avatarOperario}>
                        <User size={18} color={Palette.forestGreen} />
                      </View>
                      <View style={styles.detallesOperario}>
                        <Text style={styles.nombreOperario}>
                          {t.nombres} {t.apellidos}
                        </Text>
                        <Text style={styles.rolOperario}>
                          Rol: {t.rolEnActividad || 'Operador de campo'}
                        </Text>
                        {t.telefono ? (
                          <View style={styles.filaTelefono}>
                            <Phone size={12} color="#6B7280" />
                            <Text style={styles.telefonoOperario}>{t.telefono}</Text>
                          </View>
                        ) : null}
                      </View>
                    </View>
                  ))}
                </View>
              )}
            </View>
          </View>
        ) : (
          /* Tab Bitácora y Turno del Operador */
          <OperadorJornadaPanel actividad={actividad} />
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  contenedor: { flex: 1 },
  scroll: { flex: 1, width: '100%' },
  barraTabs: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2EBDC',
    paddingHorizontal: 16,
  },
  botonTab: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  botonTabActivo: { borderBottomColor: Palette.forestGreen },
  textoTab: { fontSize: 13, fontWeight: '600', color: '#6B7280' },
  textoTabActivo: { color: Palette.forestGreen, fontWeight: '800' },
  contenidoScroll: { padding: 16, gap: 16, maxWidth: 900, width: '100%', alignSelf: 'center' },
  bloqueTab: { gap: 16 },
  tarjetaFicha: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#D0DEC8',
    padding: 18,
    gap: 14,
  },
  cabeceraFicha: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  codigoLabor: { fontSize: 12, fontWeight: '700', color: Palette.forestGreen },
  tituloLabor: { fontSize: 18, fontWeight: '800', color: '#111827' },
  grillaMetadatos: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#F0F4EC',
  },
  itemMeta: { flexDirection: 'row', alignItems: 'center', gap: 10, minWidth: 220 },
  etiquetaMeta: { fontSize: 11, color: '#6B7280', fontWeight: '500' },
  valorMeta: { fontSize: 13, fontWeight: '700', color: '#1F2937' },
  cajaTexto: { gap: 4 },
  subtituloTexto: { fontSize: 12, fontWeight: '700', color: '#374151' },
  cuerpoTexto: { fontSize: 13, color: '#4B5563', lineHeight: 18 },
  tituloSeccion: { fontSize: 15, fontWeight: '800', color: Palette.forestGreen },
  textoVacio: { fontSize: 13, color: '#9CA3AF', fontStyle: 'italic' },
  listaRecursos: { gap: 8 },
  filaRecurso: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAF8',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    gap: 12,
  },
  iconoRecurso: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#EDF4E8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoRecurso: { flex: 1 },
  nombreRecurso: { fontSize: 13, fontWeight: '700', color: '#111827' },
  categoriaRecurso: { fontSize: 11, color: '#6B7280' },
  badgeCantidad: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D0DEC8',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 6,
  },
  textoCantidad: { fontSize: 12, fontWeight: '700', color: Palette.forestGreen },
  listaTrabajadores: { gap: 10 },
  tarjetaOperario: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#F9FAF8',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  avatarOperario: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#EAEFE7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  detallesOperario: { flex: 1 },
  nombreOperario: { fontSize: 13, fontWeight: '700', color: '#1F2937' },
  rolOperario: { fontSize: 11, color: '#4B5563', fontWeight: '500' },
  filaTelefono: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
  telefonoOperario: { fontSize: 11, color: '#6B7280' },
  cabeceraSeguimiento: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 12,
  },
  filaTituloSeguimiento: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  cuerpoSeguimiento: {
    gap: 12,
  },
  filaEstadoActual: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  etiquetaEstadoActual: {
    fontSize: 12,
    fontWeight: '700',
    color: '#4B5563',
  },
  formularioSeguimiento: {
    gap: 12,
    marginTop: 6,
  },
  filaBotonesSeguimiento: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 10,
    marginTop: 8,
  },
});
