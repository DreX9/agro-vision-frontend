import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ActivityIndicator,
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
  HelpCircle,
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

/**
 * @description Panel integral de trabajo de campo para el Operador agrícola.
 * Permite gestionar subtareas, reportar hallazgos de campo y guardar la ubicación GPS
 * de avance de la jornada para retomar las labores al día siguiente.
 */
export const OperadorJornadaPanel: React.FC<OperadorJornadaPanelProps> = ({ actividad }) => {
  const usuario = useAuthStore((s) => s.usuario);
  const nombreUsuario = usuario
    ? usuario.nombreCompleto || `${usuario.nombres} ${usuario.apellidos}`.trim()
    : 'Operador de Campo';

  const {
    obtenerSubtareas,
    toggleSubtarea,
    agregarSubtarea,
    eliminarSubtarea,
    agregarHallazgo,
    eliminarHallazgo,
    guardarPuntoAvance,
    subtareasPorActividad,
    hallazgosPorActividad,
    puntosAvancePorActividad,
  } = useOperadorJornadaStore();

  // Subtareas
  const [nuevaSubtareaTitulo, setNuevaSubtareaTitulo] = useState('');
  const [mostrandoAgregarSubtarea, setMostrandoAgregarSubtarea] = useState(false);

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

  const subtareas = subtareasPorActividad[actividad.id] || [];
  const hallazgos = hallazgosPorActividad[actividad.id] || [];
  const puntoGuardado = puntosAvancePorActividad[actividad.id];

  const totalSubtareas = subtareas.length;
  const subtareasCompletadas = subtareas.filter((s) => s.completada).length;
  const porcentajeAvance =
    totalSubtareas > 0 ? Math.round((subtareasCompletadas / totalSubtareas) * 100) : 0;

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

  const handleCrearSubtarea = () => {
    if (!nuevaSubtareaTitulo.trim()) return;
    agregarSubtarea(actividad.id, nuevaSubtareaTitulo);
    setNuevaSubtareaTitulo('');
    setMostrandoAgregarSubtarea(false);
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

          <Boton
            titulo="Guardar Punto de Avance de la Jornada"
            variante="primario"
            iconoIzquierda={<Navigation size={16} color={Palette.white} />}
            onPress={handleGuardarPuntoAvance}
          />
        </View>
      </View>

      {/* SECCIÓN 2: Checklist de Subtareas de la Jornada */}
      <View style={styles.tarjetaModulo}>
        <View style={styles.cabeceraModulo}>
          <View style={styles.iconoModulo}>
            <CheckCircle2 size={18} color={Palette.forestGreen} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.tituloModulo}>Checklist de Subtareas del Turno</Text>
            <Text style={styles.subtituloModulo}>
              Marca las tareas conforme las vayas finalizando durante la jornada.
            </Text>
          </View>
          <Boton
            titulo="+ Subtarea"
            variante="secundario"
            onPress={() => setMostrandoAgregarSubtarea(!mostrandoAgregarSubtarea)}
          />
        </View>

        {/* Barra de progreso */}
        <View style={styles.contenedorProgreso}>
          <View style={styles.filaTextoProgreso}>
            <Text style={styles.textoProgresoDetalle}>
              {subtareasCompletadas} de {totalSubtareas} tareas finalizadas
            </Text>
            <Text style={styles.porcentajeProgreso}>{porcentajeAvance}%</Text>
          </View>
          <View style={styles.barraFondo}>
            <View style={[styles.barraRelleno, { width: `${porcentajeAvance}%` }]} />
          </View>
        </View>

        {/* Formulario agregar subtarea rápida */}
        {mostrandoAgregarSubtarea && (
          <View style={styles.cajaAgregarSubtarea}>
            <Input
              label="Nueva tarea operativa para el turno"
              placeholder="Ej: Calibrar presión de manguera secundaria..."
              value={nuevaSubtareaTitulo}
              onChangeText={setNuevaSubtareaTitulo}
            />
            <View style={styles.filaBotonesSubtarea}>
              <Boton
                titulo="Cancelar"
                variante="secundario"
                onPress={() => setMostrandoAgregarSubtarea(false)}
              />
              <Boton
                titulo="Agregar a la lista"
                variante="primario"
                iconoIzquierda={<Plus size={16} color={Palette.white} />}
                onPress={handleCrearSubtarea}
              />
            </View>
          </View>
        )}

        {/* Lista de subtareas */}
        <View style={styles.listaSubtareas}>
          {subtareas.map((sub) => (
            <Pressable
              key={sub.id}
              style={({ pressed }) => [
                styles.itemSubtarea,
                sub.completada && styles.itemSubtareaCompletada,
                pressed && styles.itemSubtareaPresionada,
              ]}
              onPress={() => toggleSubtarea(actividad.id, sub.id, nombreUsuario)}
            >
              <View style={styles.checkCirculo}>
                {sub.completada ? (
                  <CheckCircle2 size={20} color={Palette.success} strokeWidth={2.4} />
                ) : (
                  <Circle size={20} color="#9CA3AF" />
                )}
              </View>
              <View style={{ flex: 1 }}>
                <Text
                  style={[
                    styles.textoSubtarea,
                    sub.completada && styles.textoSubtareaCompletada,
                  ]}
                >
                  {sub.titulo}
                </Text>
                {sub.completada && sub.completadaEn && (
                  <Text style={styles.metaSubtarea}>
                    Finalizada por {sub.completadaPor || 'Operador'} ·{' '}
                    {new Date(sub.completadaEn).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </Text>
                )}
              </View>
              <Pressable
                onPress={() => eliminarSubtarea(actividad.id, sub.id)}
                style={styles.botonBorrarSubtarea}
              >
                <Trash2 size={14} color="#9CA3AF" />
              </Pressable>
            </Pressable>
          ))}
        </View>
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
              ¿Encontraste plagas, fugas de riego, herramientas rotas o malezas? Repórtalo aquí.
            </Text>
          </View>
          <Boton
            titulo={mostrandoFormHallazgo ? 'Cerrar' : '+ Reportar'}
            variante={mostrandoFormHallazgo ? 'secundario' : 'primario'}
            onPress={() => setMostrandoFormHallazgo(!mostrandoFormHallazgo)}
          />
        </View>

        {mostrandoFormHallazgo && (
          <View style={styles.formularioHallazgo}>
            <Select
              label="Tipo de Novedad o Anomalía *"
              valor={tipoHallazgo}
              opciones={OPCIONES_TIPO_HALLAZGO}
              onChange={(v) => setTipoHallazgo(v as TipoHallazgoJornada)}
            />

            <Select
              label="Nivel de Severidad *"
              valor={severidadHallazgo}
              opciones={OPCIONES_SEVERIDAD}
              onChange={(v) => setSeveridadHallazgo(v as SeveridadHallazgo)}
            />

            <Input
              label="Descripción de lo Encontrado *"
              placeholder="Describe lo observado (ej: Gotero roto con fuga de agua severa en la línea 3)..."
              multiline
              numberOfLines={3}
              value={descripcionHallazgo}
              onChangeText={setDescripcionHallazgo}
            />

            <Input
              label="Referencia o Ubicación en el Lote"
              placeholder="Ej: Hilera 12, surco 5, cerca de poste 3..."
              value={referenciaHallazgo}
              onChangeText={setReferenciaHallazgo}
            />

            <View style={styles.filaGps}>
              <Boton
                titulo={obteniendoGpsHallazgo ? 'Obteniendo GPS...' : '📍 Capturar GPS de la novedad'}
                variante="secundario"
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

            <Boton
              titulo="Enviar Reporte de Novedad"
              variante="primario"
              iconoIzquierda={<Send size={16} color={Palette.white} />}
              onPress={handleRegistrarHallazgo}
            />
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
  cajaAgregarSubtarea: {
    backgroundColor: '#F8FAF6',
    borderWidth: 1,
    borderColor: '#D4E3CC',
    borderRadius: 8,
    padding: 12,
    gap: 8,
  },
  filaBotonesSubtarea: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
  },
  listaSubtareas: {
    gap: 8,
  },
  itemSubtarea: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
    cursor: Platform.OS === 'web' ? ('pointer' as const) : undefined,
  },
  itemSubtareaCompletada: {
    backgroundColor: '#F7FAF5',
    borderColor: '#D4DEC9',
  },
  itemSubtareaPresionada: {
    opacity: 0.8,
  },
  checkCirculo: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  textoSubtarea: {
    fontSize: 13,
    color: '#1F2937',
    fontWeight: '500',
  },
  textoSubtareaCompletada: {
    color: '#6B7280',
    textDecorationLine: 'line-through',
  },
  metaSubtarea: {
    fontSize: 11,
    color: Palette.forestGreen,
    marginTop: 2,
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
