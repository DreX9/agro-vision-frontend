import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Platform,
} from 'react-native';
import {
  MapPin,
  CheckCircle2,
  Circle,
  Plus,
  AlertTriangle,
  Send,
  Navigation,
  Trash2,
  Compass,
  FileText,
  Wrench,
  Droplets,
  Bug,
  ShieldAlert,
  ListTodo,
  User,
  Play,
  Sparkles,
} from 'lucide-react-native';
import { Palette } from '@/constants/theme';
import { Badge, Boton, Input, Select, type SelectOpcion } from '@/shared/components/ui';
import { ActividadDetalle } from '../types/actividad.types';
import {
  useOperadorJornadaStore,
  TipoHallazgoJornada,
  SeveridadHallazgo,
} from '../stores/operador-jornada.store';
import { useAuthStore } from '@/features/autenticacion';
import { useCambiarEstadoActividadMutation } from '../api/actividades.api';

export interface OperadorJornadaPanelProps {
  actividad: ActividadDetalle;
}

const OPCIONES_TIPO_HALLAZGO: SelectOpcion[] = [
  { label: '🐛 Plaga o Enfermedad Detectada', valor: 'PLAGA' },
  { label: '💧 Falla en Sistema de Riego / Fuga', valor: 'RIEGO' },
  { label: '🌿 Maleza Excesiva o Invasiva', valor: 'MALEZA' },
  { label: '🛠️ Herramienta o Maquinaria Averiada', valor: 'HERRAMIENTA' },
  { label: '⚠️ Riesgo de Seguridad / Camino Bloqueado', valor: 'SEGURIDAD' },
  { label: '📝 Otro Hallazgo Operativo', valor: 'OTRO' },
];

const OPCIONES_SEVERIDAD: SelectOpcion[] = [
  { label: '🟢 Baja (Informativo / Para monitoreo)', valor: 'BAJA' },
  { label: '🟡 Media (Requiere atención en la semana)', valor: 'MEDIA' },
  { label: '🔴 Alta (Urgente / Afecta la labor o el cultivo)', valor: 'ALTA' },
];

const CHIPS_ZONA_SUGERIDAS = [
  'Hilera 1 a 10',
  'Hilera 11 a 20',
  'Hilera 21 a 30',
  'Sector Norte',
  'Sector Sur',
  'Cabecera Principal',
  'Válvula 1 y 2',
];

/**
 * @description Panel integral de trabajo de campo para el Operador agrícola y Supervisor.
 * Gestiona tareas asignadas individualmente a cada operario, reportes de hallazgos
 * y guardado de punto GPS para retomar la labor al día siguiente.
 */
export const OperadorJornadaPanel: React.FC<OperadorJornadaPanelProps> = ({ actividad }) => {
  const usuario = useAuthStore((s) => s.usuario);
  const nombreUsuario = usuario
    ? usuario.nombreCompleto || `${usuario.nombres} ${usuario.apellidos}`.trim()
    : 'Operador de Campo';

  const esOperador = usuario?.rol === 'OPERADOR';
  const esSupervisor =
    usuario?.rol === 'SUPERVISOR' ||
    usuario?.rol === 'ADMINISTRADOR' ||
    usuario?.rol === 'AGRONOMO' ||
    actividad.usuarioResponsableId === usuario?.id;

  const cambiarEstadoMutation = useCambiarEstadoActividadMutation();

  const {
    obtenerSubtareas,
    toggleSubtarea,
    eliminarSubtarea,
    crearTareaSupervisor,
    iniciarTareaOperador,
    completarTareaOperador,
    obtenerProgresoTareas,
    obtenerSugerenciasTareas,
    agregarHallazgo,
    eliminarHallazgo,
    guardarPuntoAvance,
    subtareasPorActividad,
    hallazgosPorActividad,
    puntosAvancePorActividad,
  } = useOperadorJornadaStore();

  // Filtro de vista para Operador
  const [filtroVista, setFiltroVista] = useState<'mis_tareas' | 'todas'>(
    esOperador ? 'mis_tareas' : 'todas',
  );

  // Formulario de asignación de tarea por supervisor
  const [mostrandoFormTarea, setMostrandoFormTarea] = useState(false);
  const [nuevaTareaTitulo, setNuevaTareaTitulo] = useState('');
  const [nuevaTareaDescripcion, setNuevaTareaDescripcion] = useState('');
  const [nuevaTareaZona, setNuevaTareaZona] = useState('');
  const [nuevaTareaOperarioId, setNuevaTareaOperarioId] = useState('');

  // Sugerencias según tipo de labor
  const sugerenciasTareas = obtenerSugerenciasTareas(actividad.tipo);

  // Opciones de operarios de la cuadrilla
  const opcionesOperarios: SelectOpcion[] = (actividad.trabajadores || []).map((t) => ({
    label: `${t.nombres} ${t.apellidos} ${t.rolEnActividad ? `(${t.rolEnActividad})` : ''}`,
    valor: t.usuarioId,
  }));

  // Punto de Avance GPS
  const [latitudAvance, setLatitudAvance] = useState<string>('');
  const [longitudAvance, setLongitudAvance] = useState<string>('');
  const [referenciaAvance, setReferenciaAvance] = useState<string>('');
  const [observacionAvance, setObservacionAvance] = useState<string>('');
  const [obteniendoGpsAvance, setObteniendoGpsAvance] = useState(false);
  const [mensajeExitoAvance, setMensajeExitoAvance] = useState<string | null>(null);

  // Reporte de Hallazgo
  const [mostrandoFormHallazgo, setMostrandoFormHallazgo] = useState(false);
  const [tipoHallazgo, setTipoHallazgo] = useState<TipoHallazgoJornada>('PLAGA');
  const [severidadHallazgo, setSeveridadHallazgo] = useState<SeveridadHallazgo>('MEDIA');
  const [descripcionHallazgo, setDescripcionHallazgo] = useState('');
  const [referenciaHallazgo, setReferenciaHallazgo] = useState('');
  const [latitudHallazgo, setLatitudHallazgo] = useState<string>('');
  const [longitudHallazgo, setLongitudHallazgo] = useState<string>('');
  const [obteniendoGpsHallazgo, setObteniendoGpsHallazgo] = useState(false);

  // Inicializar subtareas al cargar
  useEffect(() => {
    obtenerSubtareas(actividad.id, actividad.tipo);
  }, [actividad.id, actividad.tipo, obtenerSubtareas]);

  const todasLasTareas = subtareasPorActividad[actividad.id] || [];
  const misTareas = todasLasTareas.filter((t) => t.responsableId === usuario?.id);
  const hallazgos = hallazgosPorActividad[actividad.id] || [];
  const puntoGuardado = puntosAvancePorActividad[actividad.id];

  const progresoTareas = obtenerProgresoTareas(actividad.id);

  // Capturar GPS
  const capturarGps = (tipo: 'avance' | 'hallazgo') => {
    if (typeof window !== 'undefined' && 'geolocation' in navigator) {
      if (tipo === 'avance') setObteniendoGpsAvance(true);
      else setObteniendoGpsHallazgo(true);

      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const lat = pos.coords.latitude.toFixed(6);
          const lng = pos.coords.longitude.toFixed(6);
          if (tipo === 'avance') {
            setLatitudAvance(lat);
            setLongitudAvance(lng);
            setObteniendoGpsAvance(false);
          } else {
            setLatitudHallazgo(lat);
            setLongitudHallazgo(lng);
            setObteniendoGpsHallazgo(false);
          }
        },
        () => {
          // Fallback a coordenadas por defecto de la costa peruana si falla GPS
          const latDef = '-11.954200';
          const lngDef = '-76.985400';
          if (tipo === 'avance') {
            setLatitudAvance(latDef);
            setLongitudAvance(lngDef);
            setObteniendoGpsAvance(false);
          } else {
            setLatitudHallazgo(latDef);
            setLongitudHallazgo(lngDef);
            setObteniendoGpsHallazgo(false);
          }
        },
        { enableHighAccuracy: true, timeout: 8000 },
      );
    } else {
      if (tipo === 'avance') {
        setLatitudAvance('-11.954200');
        setLongitudAvance('-76.985400');
      } else {
        setLatitudHallazgo('-11.954200');
        setLongitudHallazgo('-76.985400');
      }
    }
  };

  const handleGuardarPuntoAvance = () => {
    if (!referenciaAvance.trim()) return;

    guardarPuntoAvance(actividad.id, {
      latitud: Number(latitudAvance) || -11.9542,
      longitud: Number(longitudAvance) || -76.9854,
      referencia: referenciaAvance.trim(),
      observacion: observacionAvance.trim() || undefined,
      guardadoPor: nombreUsuario,
    });

    setMensajeExitoAvance('¡Punto de avance registrado! Podrás continuar desde aquí en tu siguiente turno.');
    setTimeout(() => setMensajeExitoAvance(null), 4000);
  };

  const handleCrearTareaSupervisor = () => {
    if (!nuevaTareaTitulo.trim()) return;

    const trabajadorSel = actividad.trabajadores?.find(
      (t) => t.usuarioId === nuevaTareaOperarioId,
    );
    const nombreOp = trabajadorSel
      ? `${trabajadorSel.nombres} ${trabajadorSel.apellidos}`.trim()
      : undefined;

    crearTareaSupervisor(actividad.id, {
      titulo: nuevaTareaTitulo.trim(),
      descripcion: nuevaTareaDescripcion.trim() || undefined,
      zonaTrabajo: nuevaTareaZona.trim() || undefined,
      responsableId: nuevaTareaOperarioId || undefined,
      responsableNombre: nombreOp,
      creadaPor: nombreUsuario,
    });

    setNuevaTareaTitulo('');
    setNuevaTareaDescripcion('');
    setNuevaTareaZona('');
    setNuevaTareaOperarioId('');
    setMostrandoFormTarea(false);
  };

  const handleIniciarTarea = (tareaId: string) => {
    iniciarTareaOperador(actividad.id, tareaId);
    if (actividad.estado === 'PENDIENTE') {
      cambiarEstadoMutation.mutate({
        id: actividad.id,
        estado: 'EN_PROGRESO',
      });
    }
  };

  const handleFinalizarTarea = (tareaId: string) => {
    const res = completarTareaOperador(actividad.id, tareaId, nombreUsuario);
    if (res.todasCompletadas && actividad.estado !== 'COMPLETADA') {
      cambiarEstadoMutation.mutate({
        id: actividad.id,
        estado: 'COMPLETADA',
      });
    }
  };

  const handleToggleTarea = (subId: string) => {
    const res = toggleSubtarea(actividad.id, subId, nombreUsuario);
    if (res.todasCompletadas && actividad.estado !== 'COMPLETADA') {
      cambiarEstadoMutation.mutate({
        id: actividad.id,
        estado: 'COMPLETADA',
      });
    }
  };

  const handleRegistrarHallazgo = () => {
    if (!descripcionHallazgo.trim()) return;

    agregarHallazgo(actividad.id, {
      tipo: tipoHallazgo,
      severidad: severidadHallazgo,
      descripcion: descripcionHallazgo.trim(),
      referenciaCampo: referenciaHallazgo.trim() || undefined,
      latitud: latitudHallazgo ? Number(latitudHallazgo) : undefined,
      longitud: longitudHallazgo ? Number(longitudHallazgo) : undefined,
      reportadoPor: nombreUsuario,
    });

    setDescripcionHallazgo('');
    setReferenciaHallazgo('');
    setLatitudHallazgo('');
    setLongitudHallazgo('');
    setMostrandoFormHallazgo(false);
  };

  const obtenerIconoHallazgo = (tipo: TipoHallazgoJornada) => {
    switch (tipo) {
      case 'PLAGA':
        return <Bug size={16} color="#DC2626" />;
      case 'RIEGO':
        return <Droplets size={16} color="#2563EB" />;
      case 'HERRAMIENTA':
        return <Wrench size={16} color="#D97706" />;
      case 'SEGURIDAD':
        return <ShieldAlert size={16} color="#DC2626" />;
      default:
        return <AlertTriangle size={16} color="#D97706" />;
    }
  };

  return (
    <View style={styles.contenedor}>
      {/* Banner de Descripción Técnica e Instrucciones para el Operador */}
      <View style={styles.bannerInstrucciones}>
        <View style={styles.filaCabeceraInstrucciones}>
          <FileText size={18} color={Palette.forestGreen} />
          <Text style={styles.tituloInstrucciones}>Instrucciones Operativas de la Labor</Text>
        </View>
        <Text style={styles.textoDescripcion}>
          {actividad.descripcion ||
            'Sin descripción operativa detallada. Realiza la labor conforme al protocolo agronómico estándar.'}
        </Text>
        {actividad.observaciones ? (
          <View style={styles.cajaAdvertencia}>
            <AlertTriangle size={14} color="#D97706" />
            <Text style={styles.textoAdvertencia}>
              <Text style={{ fontWeight: '700' }}>Advertencias o clima: </Text>
              {actividad.observaciones}
            </Text>
          </View>
        ) : null}
      </View>

      {/* SECCIÓN 1: Punto de Avance GPS para Continuar Mañana */}
      <View style={styles.tarjetaModulo}>
        <View style={styles.cabeceraModulo}>
          <View style={styles.iconoModulo}>
            <Compass size={18} color={Palette.forestGreen} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.tituloModulo}>Guardar Ubicación para Continuar Mañana</Text>
            <Text style={styles.subtituloModulo}>
              Registra tu punto de corte de hoy para que la cuadrilla retome desde este lugar exacto.
            </Text>
          </View>
        </View>

        {puntoGuardado ? (
          <View style={styles.tarjetaPuntoExistente}>
            <View style={styles.filaPuntoTitulo}>
              <MapPin size={16} color={Palette.forestGreen} />
              <Text style={styles.tituloPuntoGuardado}>Punto de corte guardado para el próximo turno</Text>
            </View>
            <Text style={styles.referenciaPunto}>{puntoGuardado.referencia}</Text>
            <View style={styles.metaPunto}>
              <Text style={styles.coordenadasPunto}>
                GPS: {puntoGuardado.latitud.toFixed(6)}, {puntoGuardado.longitud.toFixed(6)}
              </Text>
              <Text style={styles.registroPunto}>
                Guardado por {puntoGuardado.guardadoPor} ·{' '}
                {new Date(puntoGuardado.guardadoEn).toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </Text>
            </View>
            {puntoGuardado.observacion && (
              <Text style={styles.notaPunto}>Nota: {puntoGuardado.observacion}</Text>
            )}
          </View>
        ) : null}

        <View style={styles.formularioPunto}>
          <View style={styles.filaGps}>
            <Boton
              titulo={obteniendoGpsAvance ? 'Obteniendo GPS...' : '📍 Capturar mi GPS actual'}
              variante="secundario"
              tamano="sm"
              cargando={obteniendoGpsAvance}
              onPress={() => capturarGps('avance')}
            />
            {latitudAvance ? (
              <View style={styles.badgeGpsCapturado}>
                <Text style={styles.textoGpsCapturado}>
                  {latitudAvance}, {longitudAvance}
                </Text>
              </View>
            ) : null}
          </View>

          <Input
            label="Referencia en campo (Hilera, surco o sector) *"
            placeholder="Ej: Hilera 28 del sector este, árbol 15..."
            value={referenciaAvance}
            onChangeText={setReferenciaAvance}
          />

          <Input
            label="Observación o pendiente para el siguiente turno"
            placeholder="Ej: Faltan 4 hileras por podar, se requiere más pasta cicatrizante..."
            value={observacionAvance}
            onChangeText={setObservacionAvance}
          />

          {mensajeExitoAvance && (
            <View style={styles.cajaExito}>
              <CheckCircle2 size={15} color={Palette.success} />
              <Text style={styles.textoExito}>{mensajeExitoAvance}</Text>
            </View>
          )}

          <View style={styles.filaAccionGuardar}>
            <Boton
              titulo="Guardar Punto de Avance"
              variante="primario"
              tamano="sm"
              iconoIzquierda={<Navigation size={14} color={Palette.white} />}
              onPress={handleGuardarPuntoAvance}
            />
          </View>
        </View>
      </View>

      {/* SECCIÓN 2: Tareas de Campo de la Cuadrilla / Tareas Asignadas */}
      <View style={styles.tarjetaModulo}>
        <View style={styles.cabeceraModulo}>
          <View style={styles.iconoModulo}>
            <ListTodo size={18} color={Palette.forestGreen} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.tituloModulo}>
              {esOperador ? 'Tareas Asignadas a Tu Turno' : 'Tareas de Campo de la Cuadrilla'}
            </Text>
            <Text style={styles.subtituloModulo}>
              {esOperador
                ? 'Revisa la labor que te designó el supervisor y márcala conforme avances.'
                : 'Desglosa la actividad en tareas individuales y designa al operario responsable.'}
            </Text>
          </View>

          {esSupervisor && (
            <Boton
              titulo={mostrandoFormTarea ? 'Cancelar' : '+ Asignar Tarea a Operador'}
              variante={mostrandoFormTarea ? 'secundario' : 'primario'}
              tamano="sm"
              iconoIzquierda={
                mostrandoFormTarea ? undefined : <Plus size={14} color={Palette.white} />
              }
              onPress={() => setMostrandoFormTarea(!mostrandoFormTarea)}
            />
          )}
        </View>

        {/* Selector de vista para el Operador */}
        {esOperador && (
          <View style={styles.filaFiltroTareasOperador}>
            <Pressable
              onPress={() => setFiltroVista('mis_tareas')}
              style={[
                styles.botonFiltroTarea,
                filtroVista === 'mis_tareas' && styles.botonFiltroTareaActivo,
              ]}
            >
              <Text
                style={[
                  styles.textoFiltroTarea,
                  filtroVista === 'mis_tareas' && styles.textoFiltroTareaActivo,
                ]}
              >
                📍 Mi Tarea Asignada ({misTareas.length})
              </Text>
            </Pressable>

            <Pressable
              onPress={() => setFiltroVista('todas')}
              style={[
                styles.botonFiltroTarea,
                filtroVista === 'todas' && styles.botonFiltroTareaActivo,
              ]}
            >
              <Text
                style={[
                  styles.textoFiltroTarea,
                  filtroVista === 'todas' && styles.textoFiltroTareaActivo,
                ]}
              >
                👥 Toda la Cuadrilla ({todasLasTareas.length})
              </Text>
            </Pressable>
          </View>
        )}

        {/* Barra de progreso colaborativo */}
        {todasLasTareas.length > 0 && (
          <View style={styles.contenedorProgreso}>
            <View style={styles.filaTextoProgreso}>
              <Text style={styles.textoProgresoDetalle}>
                Avance de Cuadrilla: {progresoTareas.tareasCompletadas} de {progresoTareas.totalTareas}{' '}
                tareas finalizadas
              </Text>
              <Text style={styles.porcentajeProgreso}>{progresoTareas.porcentaje}%</Text>
            </View>
            <View style={styles.barraFondo}>
              <View style={[styles.barraRelleno, { width: `${progresoTareas.porcentaje}%` }]} />
            </View>
          </View>
        )}

        {/* Aviso de labor completamente finalizada */}
        {progresoTareas.todasCompletadas && progresoTareas.totalTareas > 0 && (
          <View style={styles.cajaAlertaTodasCompletadas}>
            <Sparkles size={16} color={Palette.success} />
            <Text style={styles.textoAlertaTodasCompletadas}>
              🎉 ¡Todas las tareas de la cuadrilla han sido completadas! La labor general ha quedado
              marcada como COMPLETADA.
            </Text>
          </View>
        )}

        {/* Formulario de creación de tarea por el supervisor */}
        {mostrandoFormTarea && (
          <View style={styles.cajaFormularioTareaSupervisor}>
            <Text style={styles.subtituloFormularioTarea}>
              Designar Tarea Operativa y Operador Responsable
            </Text>

            {/* Sugerencias rápidas */}
            {sugerenciasTareas.length > 0 && (
              <View style={styles.contenedorSugerencias}>
                <Text style={styles.etiquetaSugerencias}>Sugerencias según la labor:</Text>
                <View style={styles.filaChipsSugerencias}>
                  {sugerenciasTareas.map((sug, i) => (
                    <Pressable
                      key={i}
                      onPress={() => setNuevaTareaTitulo(sug)}
                      style={[
                        styles.chipSugerencia,
                        nuevaTareaTitulo === sug && styles.chipSugerenciaActivo,
                      ]}
                    >
                      <Text
                        style={[
                          styles.textoChipSugerencia,
                          nuevaTareaTitulo === sug && styles.textoChipSugerenciaActivo,
                        ]}
                      >
                        + {sug}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </View>
            )}

            <Input
              label="Nombre / Título de la Tarea *"
              placeholder="Ej: Poda de ramas secas y chupones..."
              value={nuevaTareaTitulo}
              onChangeText={setNuevaTareaTitulo}
            />

            <Select
              label="Operador Responsable *"
              placeholder="Seleccionar operario de la cuadrilla..."
              valor={nuevaTareaOperarioId}
              opciones={opcionesOperarios}
              onChange={setNuevaTareaOperarioId}
            />

            <View style={styles.bloqueZonaTarea}>
              <Input
                label="Zona de Trabajo / Subárea"
                placeholder="Ej: Hilera 1 a 15, Válvula 3, Cabecera..."
                value={nuevaTareaZona}
                onChangeText={setNuevaTareaZona}
              />
              <View style={styles.filaChipsZona}>
                {CHIPS_ZONA_SUGERIDAS.map((chip) => (
                  <Pressable
                    key={chip}
                    onPress={() => setNuevaTareaZona(chip)}
                    style={[
                      styles.chipZona,
                      nuevaTareaZona === chip && styles.chipZonaActivo,
                    ]}
                  >
                    <Text
                      style={[
                        styles.textoChipZona,
                        nuevaTareaZona === chip && styles.textoChipZonaActivo,
                      ]}
                    >
                      {chip}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>

            <Input
              label="Instrucciones u Observaciones de la Tarea"
              placeholder="Ej: Desinfectar tijeras antes de cada planta, aplicar pasta cicatrizante..."
              value={nuevaTareaDescripcion}
              onChangeText={setNuevaTareaDescripcion}
              multiline
              numberOfLines={2}
            />

            <View style={styles.filaBotonesFormTarea}>
              <Boton
                titulo="Cancelar"
                variante="secundario"
                tamano="sm"
                onPress={() => setMostrandoFormTarea(false)}
              />
              <Boton
                titulo="Guardar y Asignar Tarea"
                variante="primario"
                tamano="sm"
                iconoIzquierda={<CheckCircle2 size={14} color={Palette.white} />}
                onPress={handleCrearTareaSupervisor}
              />
            </View>
          </View>
        )}

        {/* LISTADO DE TAREAS */}
        {esOperador && filtroVista === 'mis_tareas' ? (
          /* Vista específica del Operador: LA TAREA QUE SE LE DIO */
          misTareas.length === 0 ? (
            <View style={styles.cajaSinTareasAsignadas}>
              <ListTodo size={28} color="#9CA3AF" />
              <Text style={styles.tituloSinTareasAsignadas}>
                No tienes tareas asignadas a tu nombre
              </Text>
              <Text style={styles.subtituloSinTareasAsignadas}>
                El supervisor aún no ha desglosado una tarea específica designándote como responsable.
                Puedes consultar con tu supervisor o ver las labores de tus compañeros de cuadrilla.
              </Text>
              <Boton
                titulo="Ver Tareas de Toda la Cuadrilla"
                variante="secundario"
                tamano="sm"
                onPress={() => setFiltroVista('todas')}
              />
            </View>
          ) : (
            <View style={styles.listaSubtareas}>
              {misTareas.map((tarea) => (
                <View
                  key={tarea.id}
                  style={[
                    styles.tarjetaTareaOperador,
                    tarea.completada && styles.tarjetaTareaOperadorCompletada,
                    tarea.estado === 'EN_PROGRESO' && styles.tarjetaTareaOperadorEnProgreso,
                  ]}
                >
                  <View style={styles.filaCabeceraTarea}>
                    <View style={{ flex: 1 }}>
                      <Text
                        style={[
                          styles.tituloTareaItem,
                          tarea.completada && styles.tituloTareaItemCompletada,
                        ]}
                      >
                        {tarea.titulo}
                      </Text>
                    </View>
                    <Badge
                      texto={
                        tarea.completada
                          ? '✓ Completada'
                          : tarea.estado === 'EN_PROGRESO'
                            ? 'En Terreno'
                            : 'Por Iniciar'
                      }
                      variante={
                        tarea.completada
                          ? 'exito'
                          : tarea.estado === 'EN_PROGRESO'
                            ? 'info'
                            : 'alerta'
                      }
                    />
                  </View>

                  {tarea.zonaTrabajo ? (
                    <View style={styles.filaDetalleTarea}>
                      <MapPin size={13} color={Palette.forestGreen} />
                      <Text style={styles.textoDetalleTarea}>
                        Zona asignada: <Text style={{ fontWeight: '700' }}>{tarea.zonaTrabajo}</Text>
                      </Text>
                    </View>
                  ) : null}

                  {tarea.descripcion ? (
                    <View style={styles.filaDetalleTarea}>
                      <FileText size={13} color="#4B5563" />
                      <Text style={styles.textoIndicacionOperador}>{tarea.descripcion}</Text>
                    </View>
                  ) : null}

                  <View style={styles.pieAccionTarea}>
                    {!tarea.completada ? (
                      tarea.estado === 'EN_PROGRESO' ? (
                        <Boton
                          titulo="✓ Finalizar Mi Tarea"
                          variante="primario"
                          tamano="sm"
                          iconoIzquierda={<CheckCircle2 size={14} color={Palette.white} />}
                          onPress={() => handleFinalizarTarea(tarea.id)}
                        />
                      ) : (
                        <Boton
                          titulo="▶ Iniciar Mi Tarea"
                          variante="secundario"
                          tamano="sm"
                          iconoIzquierda={<Play size={14} color={Palette.forestGreen} />}
                          onPress={() => handleIniciarTarea(tarea.id)}
                        />
                      )
                    ) : (
                      <Text style={styles.textoFinalizadoOperador}>
                        ✓ Finalizada a las{' '}
                        {tarea.completadaEn
                          ? new Date(tarea.completadaEn).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit',
                            })
                          : ''}{' '}
                        por {tarea.completadaPor || 'Operador'}
                      </Text>
                    )}
                  </View>
                </View>
              ))}
            </View>
          )
        ) : (
          /* Vista de toda la cuadrilla (para supervisor o para operador consultando al equipo) */
          todasLasTareas.length === 0 ? (
            <View style={styles.cajaSinTareasAsignadas}>
              <ListTodo size={28} color="#9CA3AF" />
              <Text style={styles.tituloSinTareasAsignadas}>
                Aún no hay tareas desglosadas para esta labor
              </Text>
              <Text style={styles.subtituloSinTareasAsignadas}>
                {esSupervisor
                  ? 'Presiona "+ Asignar Tarea a Operador" para organizar el trabajo de la cuadrilla.'
                  : 'El supervisor aún no ha generado tareas individuales para esta actividad.'}
              </Text>
            </View>
          ) : (
            <View style={styles.listaSubtareas}>
              {todasLasTareas.map((tarea) => {
                const esMiTarea = tarea.responsableId === usuario?.id;
                return (
                  <View
                    key={tarea.id}
                    style={[
                      styles.tarjetaTareaOperador,
                      tarea.completada && styles.tarjetaTareaOperadorCompletada,
                      esMiTarea && styles.tarjetaTareaOperadorPropia,
                    ]}
                  >
                    <View style={styles.filaCabeceraTarea}>
                      <Pressable
                        onPress={() => handleToggleTarea(tarea.id)}
                        style={styles.checkCirculo}
                      >
                        {tarea.completada ? (
                          <CheckCircle2 size={20} color={Palette.success} strokeWidth={2.4} />
                        ) : (
                          <Circle size={20} color="#9CA3AF" />
                        )}
                      </Pressable>

                      <View style={{ flex: 1, gap: 2 }}>
                        <Text
                          style={[
                            styles.tituloTareaItem,
                            tarea.completada && styles.tituloTareaItemCompletada,
                          ]}
                        >
                          {tarea.titulo}
                        </Text>

                        <View style={styles.filaMetaResponsable}>
                          <User size={12} color="#6B7280" />
                          <Text style={styles.textoResponsableTarea}>
                            Responsable:{' '}
                            <Text style={{ fontWeight: '700' }}>
                              {tarea.responsableNombre || 'Sin asignar'}
                            </Text>
                            {esMiTarea ? ' (Tú)' : ''}
                          </Text>
                          {tarea.zonaTrabajo ? (
                            <Text style={styles.textoZonaMini}>· 📍 {tarea.zonaTrabajo}</Text>
                          ) : null}
                        </View>

                        {tarea.descripcion ? (
                          <Text style={styles.textoIndicacionOperadorMini}>
                            📝 {tarea.descripcion}
                          </Text>
                        ) : null}

                        {tarea.completada && tarea.completadaEn ? (
                          <Text style={styles.metaSubtarea}>
                            Finalizada por {tarea.completadaPor || 'Operador'} ·{' '}
                            {new Date(tarea.completadaEn).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </Text>
                        ) : null}
                      </View>

                      <View style={styles.accionesItemTarea}>
                        <Badge
                          texto={
                            tarea.completada
                              ? 'Completada'
                              : tarea.estado === 'EN_PROGRESO'
                                ? 'En Terreno'
                                : 'Pendiente'
                          }
                          variante={
                            tarea.completada
                              ? 'exito'
                              : tarea.estado === 'EN_PROGRESO'
                                ? 'info'
                                : 'alerta'
                          }
                        />

                        {esMiTarea && !tarea.completada && (
                          <Boton
                            titulo={tarea.estado === 'EN_PROGRESO' ? '✓ Finalizar' : '▶ Iniciar'}
                            variante={tarea.estado === 'EN_PROGRESO' ? 'primario' : 'secundario'}
                            tamano="sm"
                            onPress={() =>
                              tarea.estado === 'EN_PROGRESO'
                                ? handleFinalizarTarea(tarea.id)
                                : handleIniciarTarea(tarea.id)
                            }
                          />
                        )}

                        {esSupervisor && (
                          <Pressable
                            onPress={() => eliminarSubtarea(actividad.id, tarea.id)}
                            style={styles.botonBorrarSubtarea}
                          >
                            <Trash2 size={14} color="#9CA3AF" />
                          </Pressable>
                        )}
                      </View>
                    </View>
                  </View>
                );
              })}
            </View>
          )
        )}
      </View>

      {/* SECCIÓN 3: Reporte de Novedades y Hallazgos de Campo */}
      <View style={styles.tarjetaModulo}>
        <View style={styles.cabeceraModulo}>
          <View style={styles.iconoModulo}>
            <AlertTriangle size={18} color="#D97706" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.tituloModulo}>Reportar Novedades o Incidencias de Campo</Text>
            <Text style={styles.subtituloModulo}>
              Informa al supervisor si encuentras plagas, fallas de riego, o averías durante la labor.
            </Text>
          </View>
          <Boton
            titulo={mostrandoFormHallazgo ? 'Cancelar' : '+ Novedad'}
            variante={mostrandoFormHallazgo ? 'secundario' : 'outline'}
            tamano="sm"
            onPress={() => setMostrandoFormHallazgo(!mostrandoFormHallazgo)}
          />
        </View>

        {/* Formulario de reporte de hallazgo */}
        {mostrandoFormHallazgo && (
          <View style={styles.formularioHallazgo}>
            <Select
              label="Tipo de Incidencia o Hallazgo *"
              opciones={OPCIONES_TIPO_HALLAZGO}
              valor={tipoHallazgo}
              onChange={(val) => setTipoHallazgo(val as TipoHallazgoJornada)}
            />

            <Select
              label="Nivel de Severidad / Urgencia *"
              opciones={OPCIONES_SEVERIDAD}
              valor={severidadHallazgo}
              onChange={(val) => setSeveridadHallazgo(val as SeveridadHallazgo)}
            />

            <Input
              label="Descripción de lo encontrado *"
              placeholder="Ej: Fuga moderada en conector de manguera, hilera 12..."
              value={descripcionHallazgo}
              onChangeText={setDescripcionHallazgo}
              multiline
              numberOfLines={3}
            />

            <Input
              label="Referencia de ubicación en la parcela (opcional)"
              placeholder="Ej: Hilera 12 cerca al poste este..."
              value={referenciaHallazgo}
              onChangeText={setReferenciaHallazgo}
            />

            <View style={styles.filaGps}>
              <Boton
                titulo={
                  obteniendoGpsHallazgo ? 'Obteniendo GPS...' : '📍 Capturar GPS de la Incidencia'
                }
                variante="secundario"
                tamano="sm"
                cargando={obteniendoGpsHallazgo}
                onPress={() => capturarGps('hallazgo')}
              />
              {latitudHallazgo ? (
                <View style={styles.badgeGpsCapturado}>
                  <Text style={styles.textoGpsCapturado}>
                    {latitudHallazgo}, {longitudHallazgo}
                  </Text>
                </View>
              ) : null}
            </View>

            <View style={styles.filaAccionGuardar}>
              <Boton
                titulo="Enviar Reporte de Novedad"
                variante="primario"
                tamano="sm"
                iconoIzquierda={<Send size={14} color={Palette.white} />}
                onPress={handleRegistrarHallazgo}
              />
            </View>
          </View>
        )}

        {/* Lista de hallazgos registrados */}
        {hallazgos.length === 0 ? (
          <Text style={styles.textoVacioHallazgos}>
            No se han reportado incidencias durante la jornada.
          </Text>
        ) : (
          <View style={styles.listaHallazgos}>
            {hallazgos.map((h) => (
              <View key={h.id} style={styles.tarjetaHallazgoItem}>
                <View style={styles.cabeceraItemHallazgo}>
                  <View style={styles.filaIconoTipo}>
                    {obtenerIconoHallazgo(h.tipo)}
                    <Text style={styles.tituloTipoHallazgo}>{h.tipo}</Text>
                  </View>
                  <Badge
                    texto={h.severidad}
                    variante={
                      h.severidad === 'ALTA'
                        ? 'peligro'
                        : h.severidad === 'MEDIA'
                          ? 'alerta'
                          : 'info'
                    }
                  />
                </View>

                <Text style={styles.cuerpoDescripcionHallazgo}>{h.descripcion}</Text>

                <View style={styles.pieItemHallazgo}>
                  <View style={{ flex: 1 }}>
                    {h.referenciaCampo && (
                      <Text style={styles.textoLugarHallazgo}>📍 {h.referenciaCampo}</Text>
                    )}
                    <Text style={styles.metaOperadorHallazgo}>
                      Reportado por {h.reportadoPor} ·{' '}
                      {new Date(h.reportadoEn).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </Text>
                  </View>
                  <Pressable
                    onPress={() => eliminarHallazgo(actividad.id, h.id)}
                    style={styles.botonBorrarSubtarea}
                  >
                    <Trash2 size={14} color="#9CA3AF" />
                  </Pressable>
                </View>
              </View>
            ))}
          </View>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  contenedor: {
    gap: 16,
  },
  bannerInstrucciones: {
    backgroundColor: '#F2F7EE',
    borderWidth: 1,
    borderColor: '#D4E3CC',
    borderRadius: 12,
    padding: 16,
    gap: 8,
  },
  filaCabeceraInstrucciones: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  tituloInstrucciones: {
    fontSize: 14,
    fontWeight: '700',
    color: Palette.forestGreen,
  },
  textoDescripcion: {
    fontSize: 13,
    color: '#2D3748',
    lineHeight: 20,
  },
  cajaAdvertencia: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FEF3C7',
    padding: 8,
    borderRadius: 6,
    marginTop: 4,
  },
  textoAdvertencia: {
    fontSize: 12,
    color: '#92400E',
    flex: 1,
  },
  tarjetaModulo: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    padding: 16,
    gap: 14,
  },
  cabeceraModulo: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  iconoModulo: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: '#EBF3E5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tituloModulo: {
    fontSize: 15,
    fontWeight: '700',
    color: '#111827',
  },
  subtituloModulo: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  tarjetaPuntoExistente: {
    backgroundColor: '#F0F7ED',
    borderLeftWidth: 4,
    borderLeftColor: Palette.forestGreen,
    padding: 12,
    borderRadius: 8,
    gap: 4,
  },
  filaPuntoTitulo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  tituloPuntoGuardado: {
    fontSize: 12,
    fontWeight: '700',
    color: Palette.forestGreen,
    textTransform: 'uppercase',
  },
  referenciaPunto: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1F2937',
  },
  metaPunto: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 2,
  },
  coordenadasPunto: {
    fontSize: 11,
    color: '#4B5563',
    fontWeight: '600',
  },
  registroPunto: {
    fontSize: 11,
    color: '#6B7280',
  },
  notaPunto: {
    fontSize: 12,
    color: '#374151',
    fontStyle: 'italic',
    marginTop: 4,
  },
  formularioPunto: {
    gap: 10,
    marginTop: 4,
  },
  filaGps: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flexWrap: 'wrap',
  },
  badgeGpsCapturado: {
    backgroundColor: '#E5F3DF',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 6,
  },
  textoGpsCapturado: {
    fontSize: 11,
    fontWeight: '600',
    color: Palette.forestGreen,
  },
  cajaExito: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#EDF7ED',
    padding: 10,
    borderRadius: 8,
  },
  textoExito: {
    fontSize: 12,
    color: Palette.success,
    fontWeight: '600',
  },
  filaAccionGuardar: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    marginTop: 4,
  },
  filaFiltroTareasOperador: {
    flexDirection: 'row',
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    padding: 3,
    gap: 4,
  },
  botonFiltroTarea: {
    flex: 1,
    paddingVertical: 7,
    paddingHorizontal: 10,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  botonFiltroTareaActivo: {
    backgroundColor: '#FFFFFF',
    elevation: 1,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 1 },
    shadowRadius: 2,
  },
  textoFiltroTarea: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
  },
  textoFiltroTareaActivo: {
    color: Palette.forestGreen,
    fontWeight: '800',
  },
  contenedorProgreso: {
    backgroundColor: '#F9FAFB',
    padding: 12,
    borderRadius: 8,
    gap: 6,
  },
  filaTextoProgreso: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  textoProgresoDetalle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#374151',
  },
  porcentajeProgreso: {
    fontSize: 14,
    fontWeight: '700',
    color: Palette.forestGreen,
  },
  barraFondo: {
    height: 8,
    backgroundColor: '#E5E7EB',
    borderRadius: 4,
    overflow: 'hidden',
  },
  barraRelleno: {
    height: '100%',
    backgroundColor: Palette.forestGreen,
    borderRadius: 4,
  },
  cajaAlertaTodasCompletadas: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#EDF7ED',
    borderWidth: 1,
    borderColor: '#C8E6C9',
    padding: 10,
    borderRadius: 8,
  },
  textoAlertaTodasCompletadas: {
    fontSize: 12,
    fontWeight: '700',
    color: Palette.forestGreen,
    flex: 1,
  },
  cajaFormularioTareaSupervisor: {
    backgroundColor: '#F8FAF6',
    borderWidth: 1,
    borderColor: '#D4E3CC',
    borderRadius: 8,
    padding: 14,
    gap: 10,
  },
  subtituloFormularioTarea: {
    fontSize: 13,
    fontWeight: '700',
    color: Palette.forestGreen,
  },
  contenedorSugerencias: {
    gap: 6,
  },
  etiquetaSugerencias: {
    fontSize: 11,
    fontWeight: '600',
    color: '#6B7280',
  },
  filaChipsSugerencias: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  chipSugerencia: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D4DEC9',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 12,
  },
  chipSugerenciaActivo: {
    backgroundColor: Palette.forestGreen,
    borderColor: Palette.forestGreen,
  },
  textoChipSugerencia: {
    fontSize: 11,
    color: '#4B5563',
    fontWeight: '500',
  },
  textoChipSugerenciaActivo: {
    color: Palette.white,
    fontWeight: '700',
  },
  bloqueZonaTarea: {
    gap: 6,
  },
  filaChipsZona: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  chipZona: {
    backgroundColor: '#F3F4F6',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 6,
  },
  chipZonaActivo: {
    backgroundColor: '#E5F3DF',
    borderWidth: 1,
    borderColor: Palette.forestGreen,
  },
  textoChipZona: {
    fontSize: 11,
    color: '#4B5563',
  },
  textoChipZonaActivo: {
    color: Palette.forestGreen,
    fontWeight: '700',
  },
  filaBotonesFormTarea: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
    marginTop: 4,
  },
  cajaSinTareasAsignadas: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    gap: 8,
  },
  tituloSinTareasAsignadas: {
    fontSize: 14,
    fontWeight: '700',
    color: '#374151',
    textAlign: 'center',
  },
  subtituloSinTareasAsignadas: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 18,
    maxWidth: 420,
  },
  listaSubtareas: {
    gap: 8,
  },
  tarjetaTareaOperador: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    padding: 12,
    gap: 8,
  },
  tarjetaTareaOperadorCompletada: {
    backgroundColor: '#F7FAF5',
    borderColor: '#D4DEC9',
  },
  tarjetaTareaOperadorEnProgreso: {
    borderColor: '#93C5FD',
    backgroundColor: '#F0F7FF',
  },
  tarjetaTareaOperadorPropia: {
    borderLeftWidth: 4,
    borderLeftColor: Palette.forestGreen,
  },
  filaCabeceraTarea: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  tituloTareaItem: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
  },
  tituloTareaItemCompletada: {
    color: '#6B7280',
    textDecorationLine: 'line-through',
  },
  filaDetalleTarea: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  textoDetalleTarea: {
    fontSize: 12,
    color: '#374151',
  },
  textoIndicacionOperador: {
    fontSize: 12,
    color: '#4B5563',
    fontStyle: 'italic',
  },
  pieAccionTarea: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    marginTop: 4,
  },
  textoFinalizadoOperador: {
    fontSize: 11,
    fontWeight: '600',
    color: Palette.forestGreen,
  },
  filaMetaResponsable: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    flexWrap: 'wrap',
  },
  textoResponsableTarea: {
    fontSize: 12,
    color: '#4B5563',
  },
  textoZonaMini: {
    fontSize: 11,
    color: Palette.forestGreen,
    fontWeight: '600',
  },
  textoIndicacionOperadorMini: {
    fontSize: 11,
    color: '#6B7280',
    fontStyle: 'italic',
  },
  accionesItemTarea: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  checkCirculo: {
    paddingTop: 2,
  },
  metaSubtarea: {
    fontSize: 11,
    color: Palette.forestGreen,
    fontWeight: '500',
  },
  botonBorrarSubtarea: {
    padding: 6,
  },
  formularioHallazgo: {
    backgroundColor: '#FFFBEB',
    borderWidth: 1,
    borderColor: '#FDE68A',
    borderRadius: 8,
    padding: 14,
    gap: 10,
  },
  textoVacioHallazgos: {
    fontSize: 13,
    color: '#9CA3AF',
    fontStyle: 'italic',
    textAlign: 'center',
    paddingVertical: 12,
  },
  listaHallazgos: {
    gap: 10,
  },
  tarjetaHallazgoItem: {
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    padding: 12,
    gap: 6,
  },
  cabeceraItemHallazgo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  filaIconoTipo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  tituloTipoHallazgo: {
    fontSize: 12,
    fontWeight: '700',
    color: '#374151',
  },
  cuerpoDescripcionHallazgo: {
    fontSize: 13,
    color: '#1F2937',
    lineHeight: 18,
  },
  pieItemHallazgo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginTop: 4,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    paddingTop: 6,
  },
  textoLugarHallazgo: {
    fontSize: 11,
    fontWeight: '600',
    color: Palette.forestGreen,
  },
  metaOperadorHallazgo: {
    fontSize: 11,
    color: '#6B7280',
    marginTop: 2,
  },
});
