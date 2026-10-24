import React, { useState, useMemo } from 'react';
import { View, Text, Pressable, ScrollView } from 'react-native';
import { Check, User, Users, Search, ChevronLeft, ChevronRight, Clock, AlertTriangle, Lock } from 'lucide-react-native';
import { Palette } from '@/constants/theme';
import { Usuario } from '@/features/usuarios/types/usuario.types';
import { Input, Badge } from '@/shared/components/ui';
import { TipoActividadTipo, esLaborCampo, ConflictoDisponibilidad } from '../types/actividad.types';
import { useValidarDisponibilidadQuery } from '../api/actividades.api';
import { styles } from './actividad-formulario-cuadrilla.styles';

export interface TrabajadorAsignadoInput {
  usuarioId: string;
  rolEnActividad?: string;
  horaInicio?: string;
  horaFin?: string;
  horasAsignadas?: number;
}

export interface ActividadFormularioCuadrillaProps {
  usuariosDisponibles: Usuario[];
  trabajadoresSeleccionados: TrabajadorAsignadoInput[];
  tipoActual: TipoActividadTipo;
  responsableId?: string;
  nombreResponsable?: string;
  turnoHorasLabor?: {
    inicio: string;
    fin: string;
    duracion: number;
  };
  onAlternarTrabajador: (usuarioId: string) => void;
  onCambiarRol: (usuarioId: string, rol: string) => void;
  onCambiarHoras?: (usuarioId: string, horas: number) => void;
  esSupervisor?: boolean;
  esAgronomo?: boolean;
  parcelaId?: string;
  fechaLabor?: string;
  fechaFinLabor?: string;
  actividadId?: string;
}

export interface EvaluacionTrabajador {
  esRecomendado: boolean;
  score: number;
  etiquetaIdoneidad: string;
  tipoAviso: 'recomendado' | 'neutro' | 'no_recomendado';
  rolesSugeridos: string[];
}

/**
 * @description Evalúa la idoneidad y prioridad de un trabajador según su rol y el tipo de labor.
 * Labores operativas de campo priorizan Operadores y relegan Administradores.
 * Labores administrativas y técnicas priorizan Agrónomos y Supervisores.
 */
export const evaluarTrabajadorParaLabor = (
  rol: string,
  tipo: TipoActividadTipo,
  especialidad?: string | null,
): EvaluacionTrabajador => {
  if (esLaborCampo(tipo)) {
    if (rol === 'OPERADOR') {
      let roles: string[] = ['Operador', 'Ayudante'];
      let etiqueta = '⭐ Recomendado (Labor de campo)';
      let score = 100;

      if (tipo === 'RIEGO') {
        roles = ['Regador', 'Controlador Válvulas', 'Operador Bombeo', 'Apoyo'];
        if (especialidad === 'REGADOR') {
          score = 120;
          etiqueta = '⭐ Especialista en Riego';
        }
      } else if (tipo === 'PODA') {
        roles = ['Podador', 'Recogedor', 'Desinfectador', 'Operador'];
        if (especialidad === 'PODADOR') {
          score = 120;
          etiqueta = '⭐ Especialista Podador';
        }
      } else if (tipo === 'COSECHA') {
        roles = ['Cosechador', 'Seleccionador', 'Pesador', 'Estibador'];
        if (especialidad === 'COSECHADOR') {
          score = 120;
          etiqueta = '⭐ Especialista Cosechador';
        }
      } else if (tipo === 'FERTILIZACION' || tipo === 'CONTROL_PLAGAS') {
        roles = tipo === 'CONTROL_PLAGAS' 
          ? ['Fumigador', 'Preparador Caldo', 'Guía', 'Operador']
          : ['Aplicador', 'Preparador Mezcla', 'Cargador', 'Operador'];
        if (especialidad === 'FUMIGADOR_APLICADOR') {
          score = 120;
          etiqueta = '⭐ Especialista Fitosanitario / Aplicador';
        }
      } else if (tipo === 'DESHIERBE') {
        roles = ['Deshierbador', 'Limpieza', 'Operador'];
      }

      if (especialidad === 'TRACTORISTA_MAQUINISTA') {
        score = Math.max(score, 110);
        etiqueta = '🚜 Operador de Maquinaria';
      }

      return {
        esRecomendado: true,
        score,
        etiquetaIdoneidad: etiqueta,
        tipoAviso: 'recomendado',
        rolesSugeridos: roles,
      };
    }
    if (rol === 'SUPERVISOR') {
      return {
        esRecomendado: false,
        score: 60,
        etiquetaIdoneidad: 'Coordinación de campo',
        tipoAviso: 'neutro',
        rolesSugeridos: ['Capataz', 'Jefe Cuadrilla', 'Verificador'],
      };
    }
    if (rol === 'AGRONOMO') {
      return {
        esRecomendado: false,
        score: 40,
        etiquetaIdoneidad: 'Asistencia técnica',
        tipoAviso: 'neutro',
        rolesSugeridos: ['Asesor Técnico', 'Fiscalizador'],
      };
    }
    if (rol === 'ADMINISTRADOR') {
      return {
        esRecomendado: false,
        score: 10,
        etiquetaIdoneidad: '⚠️ Perfil oficina / admin',
        tipoAviso: 'no_recomendado',
        rolesSugeridos: ['Coordinador', 'Registro'],
      };
    }
  } else {
    // Labores Administrativas y Técnicas
    if (tipo === 'MONITOREO_FITOSANITARIO') {
      if (rol === 'AGRONOMO') {
        return {
          esRecomendado: true,
          score: 100,
          etiquetaIdoneidad: '⭐ Especialista Fitosanitario',
          tipoAviso: 'recomendado',
          rolesSugeridos: ['Evaluador de Plagas', 'Muestreador', 'Anotador'],
        };
      }
      if (rol === 'SUPERVISOR') {
        return {
          esRecomendado: true,
          score: 90,
          etiquetaIdoneidad: '⭐ Evaluador de Campo',
          tipoAviso: 'recomendado',
          rolesSugeridos: ['Muestreador', 'Anotador', 'Verificador'],
        };
      }
      if (rol === 'OPERADOR') {
        return {
          esRecomendado: false,
          score: 50,
          etiquetaIdoneidad: 'Apoyo en toma de muestras',
          tipoAviso: 'neutro',
          rolesSugeridos: ['Toma de Muestras', 'Apoyo'],
        };
      }
      if (rol === 'ADMINISTRADOR') {
        return {
          esRecomendado: false,
          score: 30,
          etiquetaIdoneidad: 'Registro Documental',
          tipoAviso: 'neutro',
          rolesSugeridos: ['Registro', 'Control'],
        };
      }
    }
    if (tipo === 'AUDITORIA_CALIDAD') {
      if (rol === 'AGRONOMO') {
        return {
          esRecomendado: true,
          score: 100,
          etiquetaIdoneidad: '⭐ Inspector de Calidad',
          tipoAviso: 'recomendado',
          rolesSugeridos: ['Auditor Calidad', 'Inspector', 'Muestreador'],
        };
      }
      if (rol === 'SUPERVISOR') {
        return {
          esRecomendado: true,
          score: 90,
          etiquetaIdoneidad: '⭐ Auditor de Campo',
          tipoAviso: 'recomendado',
          rolesSugeridos: ['Auditor Campo', 'Verificador BPM'],
        };
      }
      if (rol === 'ADMINISTRADOR') {
        return {
          esRecomendado: false,
          score: 50,
          etiquetaIdoneidad: 'Control y Archivo',
          tipoAviso: 'neutro',
          rolesSugeridos: ['Control Documental', 'Registro'],
        };
      }
      if (rol === 'OPERADOR') {
        return {
          esRecomendado: false,
          score: 30,
          etiquetaIdoneidad: 'Apoyo de Muestreo',
          tipoAviso: 'neutro',
          rolesSugeridos: ['Muestreador', 'Apoyo'],
        };
      }
    }
    if (tipo === 'SUPERVISION_TECNICA') {
      if (rol === 'SUPERVISOR') {
        return {
          esRecomendado: true,
          score: 100,
          etiquetaIdoneidad: '⭐ Supervisor Principal',
          tipoAviso: 'recomendado',
          rolesSugeridos: ['Supervisor Campo', 'Fiscalizador', 'Jefe Cuadrilla'],
        };
      }
      if (rol === 'AGRONOMO') {
        return {
          esRecomendado: true,
          score: 90,
          etiquetaIdoneidad: '⭐ Fiscalizador Agrónomo',
          tipoAviso: 'recomendado',
          rolesSugeridos: ['Fiscalizador Técnico', 'Asesor'],
        };
      }
      if (rol === 'OPERADOR') {
        return {
          esRecomendado: false,
          score: 40,
          etiquetaIdoneidad: 'Líder de Cuadrilla',
          tipoAviso: 'neutro',
          rolesSugeridos: ['Líder de Fila', 'Apoyo'],
        };
      }
      if (rol === 'ADMINISTRADOR') {
        return {
          esRecomendado: false,
          score: 20,
          etiquetaIdoneidad: 'Control de Horarios',
          tipoAviso: 'no_recomendado',
          rolesSugeridos: ['Control Asistencia'],
        };
      }
    }
    if (tipo === 'GESTION_ADMINISTRATIVA') {
      if (rol === 'ADMINISTRADOR') {
        return {
          esRecomendado: true,
          score: 100,
          etiquetaIdoneidad: '⭐ Gestión y Costos',
          tipoAviso: 'recomendado',
          rolesSugeridos: ['Planificador', 'Controlador de Costos', 'Logística'],
        };
      }
      if (rol === 'SUPERVISOR') {
        return {
          esRecomendado: true,
          score: 85,
          etiquetaIdoneidad: '⭐ Logística de Campo',
          tipoAviso: 'recomendado',
          rolesSugeridos: ['Encargado Despacho', 'Logística'],
        };
      }
      if (rol === 'AGRONOMO') {
        return {
          esRecomendado: true,
          score: 80,
          etiquetaIdoneidad: '⭐ Planificación Agronómica',
          tipoAviso: 'recomendado',
          rolesSugeridos: ['Planificador Agronómico'],
        };
      }
      if (rol === 'OPERADOR') {
        return {
          esRecomendado: false,
          score: 20,
          etiquetaIdoneidad: 'Apoyo Administrativo',
          tipoAviso: 'no_recomendado',
          rolesSugeridos: ['Apoyo Auxiliar'],
        };
      }
    }
  }

  return {
    esRecomendado: rol === 'OPERADOR',
    score: rol === 'OPERADOR' ? 80 : 50,
    etiquetaIdoneidad: rol === 'OPERADOR' ? 'Operario' : 'Personal técnico',
    tipoAviso: 'neutro',
    rolesSugeridos: ['Operador', 'Apoyo'],
  };
};

/**
 * @description Formatea el nombre del rol a una etiqueta plural amigable.
 */
const formatearEtiquetaRol = (rol: string): string => {
  if (rol === 'TODOS') return 'Todos';
  if (rol === 'RECOMENDADOS') return '⭐ Recomendados';
  if (rol === 'OPERADOR') return 'Operadores';
  if (rol === 'SUPERVISOR') return 'Supervisores';
  if (rol === 'AGRONOMO') return 'Agrónomos';
  if (rol === 'ADMINISTRADOR') return 'Administradores';
  return `${rol.charAt(0) + rol.slice(1).toLowerCase()}s`;
};

/**
 * @description Selector responsivo de cuadrilla con exclusión automática del encargado,
 * recomendación contextual por tipo de labor (ej. Riego -> Operadores arriba, Administradores al final)
 * y tabs dinámicos de roles.
 */
export const ActividadFormularioCuadrilla: React.FC<ActividadFormularioCuadrillaProps> = ({
  usuariosDisponibles,
  trabajadoresSeleccionados,
  tipoActual,
  responsableId,
  nombreResponsable,
  turnoHorasLabor,
  onAlternarTrabajador,
  onCambiarRol,
  onCambiarHoras,
  esSupervisor = false,
  esAgronomo = false,
  parcelaId,
  fechaLabor,
  fechaFinLabor,
  actividadId,
}) => {
  const [busqueda, setBusqueda] = useState('');
  const [rolFiltro, setRolFiltro] = useState<string>('TODOS');
  const [pagina, setPagina] = useState(1);
  const [limite, setLimite] = useState<number>(10);
  const [mostrarOcupados, setMostrarOcupados] = useState(false);

  // 1. Excluir al encargado de la labor, excluir permanentemente a Administradores (perfil de oficina),
  // y si es Supervisor, limitar estrictamente a Operadores
  const usuariosCandidatos = useMemo(() => {
    return usuariosDisponibles.filter((u) => {
      if (u.id === responsableId) return false;
      // Regla de negocio: Los administradores NO pertenecen a cuadrillas operativas de campo
      if (u.rol === 'ADMINISTRADOR') return false;
      // Regla de jerarquía: El supervisor SOLO coordina a Operadores de campo
      if (esSupervisor) {
        return u.rol === 'OPERADOR';
      }
      return true;
    });
  }, [usuariosDisponibles, responsableId, esSupervisor]);

  // Horarios de la labor para la validación de disponibilidad
  const fechaBase = (fechaLabor || new Date().toISOString()).split('T')[0];
  const horaIni = turnoHorasLabor?.inicio || '07:00';
  const horaFin = turnoHorasLabor?.fin || '12:00';

  const fechaInicioIso = useMemo(() => {
    try {
      return new Date(`${fechaBase}T${horaIni}:00`).toISOString();
    } catch {
      return new Date().toISOString();
    }
  }, [fechaBase, horaIni]);

  const fechaFinIso = useMemo(() => {
    try {
      const fechaFinBase = (fechaFinLabor || fechaBase).split('T')[0];
      return new Date(`${fechaFinBase}T${horaFin}:00`).toISOString();
    } catch {
      return new Date().toISOString();
    }
  }, [fechaFinLabor, fechaBase, horaFin]);

  const trabajadoresAValidar = useMemo(() => {
    return usuariosCandidatos.map((u) => ({
      usuarioId: u.id,
      horaInicio: fechaInicioIso,
      horaFin: fechaFinIso,
    }));
  }, [usuariosCandidatos, fechaInicioIso, fechaFinIso]);

  // Consulta en tiempo real de disponibilidad contra la base de datos
  const { data: resultadoDisponibilidad } = useValidarDisponibilidadQuery({
    parcelaId,
    fechaInicio: fechaInicioIso,
    fechaFin: fechaFinIso,
    trabajadores: trabajadoresAValidar,
    excluirActividadId: actividadId,
    habilitado: Boolean(parcelaId && trabajadoresAValidar.length > 0),
  });

  const mapaConflictos = useMemo(() => {
    const map = new Map<string, ConflictoDisponibilidad>();
    if (resultadoDisponibilidad?.conflictos) {
      resultadoDisponibilidad.conflictos.forEach((c) => {
        map.set(c.usuarioId, c);
      });
    }
    return map;
  }, [resultadoDisponibilidad]);

  // 2. Filtrado de disponibilidad horaria:
  // Por defecto, los trabajadores ocupados en otras labores en el mismo horario NO aparecen
  const usuariosFiltradosDisponibilidad = useMemo(() => {
    return usuariosCandidatos.filter((u) => {
      const estaSeleccionado = trabajadoresSeleccionados.some((t) => t.usuarioId === u.id);
      if (estaSeleccionado) return true;
      if (!mostrarOcupados && mapaConflictos.has(u.id)) {
        return false; // Excluido porque no puede hacer dos trabajos a la vez
      }
      return true;
    });
  }, [usuariosCandidatos, trabajadoresSeleccionados, mapaConflictos, mostrarOcupados]);

  // 3. Evaluar idoneidad y ordenar por relevancia
  const usuariosEvaluados = useMemo(() => {
    const lista = usuariosFiltradosDisponibilidad.map((usuario) => ({
      usuario,
      evaluacion: evaluarTrabajadorParaLabor(usuario.rol, tipoActual, usuario.especialidad),
      conflicto: mapaConflictos.get(usuario.id),
    }));

    // Filtrar por texto de búsqueda
    const filtradosBusqueda = lista.filter(({ usuario }) => {
      if (!busqueda.trim()) return true;
      const q = busqueda.toLowerCase();
      const nombreCompleto = `${usuario.nombres} ${usuario.apellidos}`.toLowerCase();
      return (
        nombreCompleto.includes(q) ||
        usuario.correo.toLowerCase().includes(q) ||
        (usuario.telefono && usuario.telefono.includes(q)) ||
        (usuario.codigoEmpleado && usuario.codigoEmpleado.toLowerCase().includes(q)) ||
        (usuario.numeroDocumento && usuario.numeroDocumento.includes(q)) ||
        (usuario.cuadrilla && usuario.cuadrilla.toLowerCase().includes(q)) ||
        (usuario.especialidad && usuario.especialidad.toLowerCase().includes(q))
      );
    });

    // Filtrar por tab seleccionado
    const filtradosTab = filtradosBusqueda.filter(({ usuario, evaluacion }) => {
      if (rolFiltro === 'TODOS') return true;
      if (rolFiltro === 'RECOMENDADOS') return evaluacion.esRecomendado;
      return usuario.rol === rolFiltro;
    });

    // Ordenar: seleccionados primero -> mayor score de recomendación -> administradores al final -> alfabético
    return [...filtradosTab].sort((a, b) => {
      const aSel = trabajadoresSeleccionados.some((t) => t.usuarioId === a.usuario.id);
      const bSel = trabajadoresSeleccionados.some((t) => t.usuarioId === b.usuario.id);
      if (aSel && !bSel) return -1;
      if (!aSel && bSel) return 1;
      if (b.evaluacion.score !== a.evaluacion.score) {
        return b.evaluacion.score - a.evaluacion.score;
      }
      return a.usuario.apellidos.localeCompare(b.usuario.apellidos);
    });
  }, [usuariosFiltradosDisponibilidad, tipoActual, busqueda, rolFiltro, trabajadoresSeleccionados, mapaConflictos]);

  // Generación dinámica de tabs según los roles disponibles
  const rolesDisponibles = useMemo(() => {
    if (esSupervisor) {
      // Para supervisores se ocultan pestañas de Agrónomos y Administradores
      return ['TODOS', 'RECOMENDADOS'];
    }
    const setRoles = new Set<string>();
    usuariosFiltradosDisponibilidad.forEach((u) => {
      if (u.rol) setRoles.add(u.rol);
    });
    return ['TODOS', 'RECOMENDADOS', ...Array.from(setRoles)];
  }, [usuariosFiltradosDisponibilidad, esSupervisor]);

  // Paginación
  const totalUsuarios = usuariosEvaluados.length;
  const totalPaginas = Math.max(1, Math.ceil(totalUsuarios / limite));
  const paginaAjustada = Math.min(pagina, totalPaginas);

  const usuariosPaginados = useMemo(() => {
    const inicio = (paginaAjustada - 1) * limite;
    return usuariosEvaluados.slice(inicio, inicio + limite);
  }, [usuariosEvaluados, paginaAjustada, limite]);

  const desdeRegistro = totalUsuarios === 0 ? 0 : (paginaAjustada - 1) * limite + 1;
  const hastaRegistro = Math.min(paginaAjustada * limite, totalUsuarios);

  const handleCambiarRolFiltro = (nuevoRol: string) => {
    setRolFiltro(nuevoRol);
    setPagina(1);
  };

  const handleCambiarBusqueda = (texto: string) => {
    setBusqueda(texto);
    setPagina(1);
  };

  const handleCambiarLimite = (nuevoLimite: number) => {
    setLimite(nuevoLimite);
    setPagina(1);
  };

  return (
    <View style={styles.contenedor}>
      <View style={styles.cabecera}>
        <View style={styles.filaTitulo}>
          <Users size={16} color={Palette.forestGreen} />
          <Text style={styles.titulo}>Cuadrilla de Trabajadores Asignada</Text>
        </View>
        <View style={[styles.badgeContador, esAgronomo && { backgroundColor: '#FEF3C7' }]}>
          <Text style={[styles.textoContador, esAgronomo && { color: '#92400E' }]}>
            {esAgronomo ? '🔒 Delegado a Supervisión' : `${trabajadoresSeleccionados.length} seleccionados`}
          </Text>
        </View>
      </View>

      <Text style={styles.subtitulo}>
        {esSupervisor
          ? 'Seleccione los operarios de campo disponibles para esta labor.'
          : esAgronomo
          ? 'Conformación de cuadrilla a cargo del Supervisor en terreno.'
          : 'Seleccione y filtre el personal para esta labor.'}
      </Text>

      {/* Banner de filtro por cruce de horario */}
      {mapaConflictos.size > 0 && (
        <View style={styles.bannerConflictosHorario}>
          <View style={styles.contenidoBannerConflictos}>
            <Clock size={15} color="#92400E" />
            <Text style={styles.textoBannerConflictosHorario}>
              {mapaConflictos.size} trabajador{mapaConflictos.size > 1 ? 'es' : ''} ocupado{mapaConflictos.size > 1 ? 's' : ''} en otras labores ({horaIni} - {horaFin}) {mostrarOcupados ? 'visibles' : 'ocultos automáticamente'}.
            </Text>
          </View>
          <Pressable
            onPress={() => setMostrarOcupados(!mostrarOcupados)}
            style={styles.botonToggleOcupados}
          >
            <Text style={styles.textoBotonToggleOcupados}>
              {mostrarOcupados ? 'Ocultar Ocupados' : `Ver Ocupados (${mapaConflictos.size})`}
            </Text>
          </Pressable>
        </View>
      )}

      {/* Barra de búsqueda y tabs dinámicos por rol */}
      <View style={styles.filtrosBarra}>
        <Input
          placeholder="Buscar trabajador por nombre, correo..."
          value={busqueda}
          onChangeText={handleCambiarBusqueda}
          iconoIzquierda={<Search size={15} color="#6B7280" />}
        />

        <View style={styles.filaRoles}>
          {rolesDisponibles.map((r) => {
            const activo = rolFiltro === r;
            return (
              <Pressable
                key={r}
                onPress={() => handleCambiarRolFiltro(r)}
                style={[styles.chipFiltro, activo && styles.chipFiltroActivo]}
              >
                <Text style={[styles.textoChipFiltro, activo && styles.textoChipFiltroActivo]}>
                  {formatearEtiquetaRol(r)}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      {/* Lista de trabajadores con scroll y altura controlada */}
      <ScrollView
        style={styles.listaScroll}
        nestedScrollEnabled
        showsVerticalScrollIndicator={false}
      >
        {usuariosEvaluados.length === 0 ? (
          <View style={styles.vacioContainer}>
            <Text style={styles.textoVacio}>No se encontraron trabajadores con ese criterio.</Text>
          </View>
        ) : (
          <View style={styles.grillaTrabajadores}>
            {usuariosPaginados.map(({ usuario, evaluacion, conflicto }) => {
              const asignado = trabajadoresSeleccionados.find((t) => t.usuarioId === usuario.id);
              const estaSeleccionado = Boolean(asignado);
              const tieneConflicto = Boolean(conflicto && !estaSeleccionado);

              return (
                <View
                  key={usuario.id}
                  style={[
                    styles.tarjetaTrabajador,
                    estaSeleccionado && styles.tarjetaTrabajadorActiva,
                    Boolean(conflicto) && styles.tarjetaTrabajadorConflicto,
                  ]}
                >
                  <Pressable
                    disabled={esAgronomo || tieneConflicto}
                    onPress={() => {
                      if (esAgronomo || tieneConflicto) return;
                      onAlternarTrabajador(usuario.id);
                    }}
                    style={[
                      styles.contenidoTarjeta,
                      (tieneConflicto || esAgronomo) && { opacity: esAgronomo ? 0.85 : 0.7 },
                    ]}
                  >
                    <View
                      style={[
                        styles.casillaVerificacion,
                        estaSeleccionado && styles.casillaVerificacionActiva,
                        tieneConflicto && { backgroundColor: '#FEE2E2', borderColor: '#FCA5A5' },
                        esAgronomo && !estaSeleccionado && !tieneConflicto && { backgroundColor: '#F3F4F6', borderColor: '#D1D5DB' },
                      ]}
                    >
                      {estaSeleccionado && <Check size={14} color="#FFFFFF" />}
                      {tieneConflicto && <AlertTriangle size={12} color="#DC2626" />}
                      {esAgronomo && !estaSeleccionado && !tieneConflicto && <Lock size={10} color="#9CA3AF" />}
                    </View>

                    <View style={styles.avatar}>
                      <User size={15} color={Palette.forestGreen} />
                    </View>

                    <View style={styles.datosUsuario}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                        <Text style={styles.nombreUsuario}>
                          {usuario.nombres} {usuario.apellidos}
                        </Text>
                        {usuario.codigoEmpleado ? (
                          <View style={{ backgroundColor: '#EBF2E5', paddingHorizontal: 5, paddingVertical: 1, borderRadius: 4, borderWidth: 1, borderColor: '#D4E3CA' }}>
                            <Text style={{ fontSize: 10, fontWeight: '700', color: Palette.forestGreen }}>
                              {usuario.codigoEmpleado}
                            </Text>
                          </View>
                        ) : null}
                      </View>
                      <View style={styles.filaMeta}>
                        <Badge
                          texto={usuario.rol}
                          variante={
                            usuario.rol === 'OPERADOR'
                              ? 'info'
                              : usuario.rol === 'AGRONOMO'
                              ? 'exito'
                              : usuario.rol === 'SUPERVISOR'
                              ? 'info'
                              : 'alerta'
                          }
                        />

                        {/* Especialidad agrícola del operario */}
                        {usuario.especialidad ? (
                          <Text style={{ fontSize: 11, fontWeight: '600', color: Palette.forestGreen }}>
                            🌱 {usuario.especialidad.replace(/_/g, ' ')}
                          </Text>
                        ) : null}

                        {/* Cuadrilla habitual */}
                        {usuario.cuadrilla ? (
                          <Text style={{ fontSize: 11, color: '#4B5563', fontWeight: '500' }}>
                            👥 {usuario.cuadrilla}
                          </Text>
                        ) : null}

                        {/* Distintivo de idoneidad/recomendación según la labor */}
                        {evaluacion.tipoAviso === 'recomendado' && (
                          <View style={styles.badgeRecomendado}>
                            <Text style={styles.textoBadgeRecomendado}>
                              {evaluacion.etiquetaIdoneidad}
                            </Text>
                          </View>
                        )}
                        {evaluacion.tipoAviso === 'no_recomendado' && (
                          <View style={styles.badgeNoRecomendado}>
                            <Text style={styles.textoBadgeNoRecomendado}>
                              {evaluacion.etiquetaIdoneidad}
                            </Text>
                          </View>
                        )}
                        {evaluacion.tipoAviso === 'neutro' && (
                          <Text style={{ fontSize: 10, color: '#6B7280' }}>
                            {evaluacion.etiquetaIdoneidad}
                          </Text>
                        )}

                        {usuario.telefono && (
                          <Text style={styles.textoTelefono}>{usuario.telefono}</Text>
                        )}
                      </View>

                      {/* Notificación de conflicto de horario con otra labor */}
                      {conflicto ? (
                        <View style={styles.badgeConflicto}>
                          <AlertTriangle size={12} color="#DC2626" />
                          <Text style={styles.textoBadgeConflicto} numberOfLines={2}>
                            {conflicto.mensaje}
                          </Text>
                        </View>
                      ) : null}
                    </View>
                  </Pressable>

                  {/* Asignación de rol específico según la labor */}
                  {estaSeleccionado && (
                    <View style={styles.seccionRolLaborCompacta}>
                      <Text style={styles.etiquetaRolLabor}>Función:</Text>
                      <View style={styles.filaRolesSugeridos}>
                        {evaluacion.rolesSugeridos.map((rol) => {
                          const rolActivo = (asignado?.rolEnActividad || evaluacion.rolesSugeridos[0]) === rol;
                          return (
                            <Pressable
                              key={rol}
                              disabled={esAgronomo}
                              onPress={() => !esAgronomo && onCambiarRol(usuario.id, rol)}
                              style={[styles.chipRol, rolActivo && styles.chipRolActivo, esAgronomo && { opacity: 0.8 }]}
                            >
                              <Text
                                style={[styles.textoChipRol, rolActivo && styles.textoChipRolActivo]}
                              >
                                {rol}
                              </Text>
                            </Pressable>
                          );
                        })}
                      </View>

                      {/* Horario y Horas asignadas a este trabajador */}
                      <View style={{ marginTop: 8, paddingTop: 6, borderTopWidth: 1, borderTopColor: '#E5E7EB', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 6 }}>
                        <Text style={{ fontSize: 11, fontWeight: '700', color: Palette.forestGreen }}>
                          ⏱️ Turno: {asignado?.horaInicio || turnoHorasLabor?.inicio || '07:00'} - {asignado?.horaFin || turnoHorasLabor?.fin || '12:00'}
                        </Text>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                          <Text style={{ fontSize: 11, color: '#4B5563', fontWeight: '600' }}>Horas:</Text>
                          {[2, 3, 4, 5, 8].map((h) => {
                            const horasActuales = asignado?.horasAsignadas ?? turnoHorasLabor?.duracion ?? 5;
                            const esHorasActivo = horasActuales === h;
                            return (
                              <Pressable
                                key={h}
                                disabled={esAgronomo}
                                onPress={() => !esAgronomo && onCambiarHoras && onCambiarHoras(usuario.id, h)}
                                style={{
                                  paddingHorizontal: 7,
                                  paddingVertical: 2,
                                  borderRadius: 6,
                                  backgroundColor: esHorasActivo ? Palette.forestGreen : '#F3F4F6',
                                  opacity: esAgronomo ? 0.75 : 1,
                                }}
                              >
                                <Text style={{ fontSize: 11, fontWeight: '700', color: esHorasActivo ? '#FFFFFF' : '#374151' }}>
                                  {h}h
                                </Text>
                              </Pressable>
                            );
                          })}
                        </View>
                      </View>
                    </View>
                  )}
                </View>
              );
            })}
          </View>
        )}
      </ScrollView>

      {/* Pie de página con selector 10/20 y controles de paginación */}
      {totalUsuarios > 0 && (
        <View style={styles.piePaginacion}>
          <View style={styles.selectorLimite}>
            <Text style={styles.etiquetaLimite}>Ver:</Text>
            {[10, 20].map((cant) => (
              <Pressable
                key={cant}
                onPress={() => handleCambiarLimite(cant)}
                style={[styles.botonLimite, limite === cant && styles.botonLimiteActivo]}
              >
                <Text
                  style={[
                    styles.textoBotonLimite,
                    limite === cant && styles.textoBotonLimiteActivo,
                  ]}
                >
                  {cant}
                </Text>
              </Pressable>
            ))}
          </View>

          <Text style={styles.indicadorPaginacion}>
            {desdeRegistro}-{hastaRegistro} de {totalUsuarios}
          </Text>

          <View style={styles.controlesPaginacion}>
            <Pressable
              onPress={() => setPagina((p) => Math.max(1, p - 1))}
              disabled={paginaAjustada <= 1}
              style={[
                styles.botonPagina,
                paginaAjustada <= 1 && styles.botonPaginaDeshabilitado,
              ]}
            >
              <ChevronLeft size={14} color="#374151" />
              <Text style={styles.textoBotonPagina}>Ant.</Text>
            </Pressable>

            <Pressable
              onPress={() => setPagina((p) => Math.min(totalPaginas, p + 1))}
              disabled={paginaAjustada >= totalPaginas}
              style={[
                styles.botonPagina,
                paginaAjustada >= totalPaginas && styles.botonPaginaDeshabilitado,
              ]}
            >
              <Text style={styles.textoBotonPagina}>Sig.</Text>
              <ChevronRight size={14} color="#374151" />
            </Pressable>
          </View>
        </View>
      )}
    </View>
  );
};
