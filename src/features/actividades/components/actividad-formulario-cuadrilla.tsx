import React, { useState, useMemo } from 'react';
import { View, Text, Pressable, ScrollView } from 'react-native';
import { Check, User, Users, Search, ChevronLeft, ChevronRight, UserCheck } from 'lucide-react-native';
import { Palette } from '@/constants/theme';
import { Usuario } from '@/features/usuarios/types/usuario.types';
import { Input, Badge } from '@/shared/components/ui';
import { TipoActividadTipo, esLaborCampo } from '../types/actividad.types';
import { styles } from './actividad-formulario-cuadrilla.styles';

export interface TrabajadorAsignadoInput {
  usuarioId: string;
  rolEnActividad?: string;
}

export interface ActividadFormularioCuadrillaProps {
  usuariosDisponibles: Usuario[];
  trabajadoresSeleccionados: TrabajadorAsignadoInput[];
  tipoActual: TipoActividadTipo;
  responsableId?: string;
  nombreResponsable?: string;
  onAlternarTrabajador: (usuarioId: string) => void;
  onCambiarRol: (usuarioId: string, rol: string) => void;
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
): EvaluacionTrabajador => {
  if (esLaborCampo(tipo)) {
    if (rol === 'OPERADOR') {
      let roles: string[] = ['Operador', 'Ayudante'];
      if (tipo === 'RIEGO') roles = ['Regador', 'Controlador Válvulas', 'Operador Bombeo', 'Apoyo'];
      else if (tipo === 'PODA') roles = ['Podador', 'Recogedor', 'Desinfectador', 'Operador'];
      else if (tipo === 'COSECHA') roles = ['Cosechador', 'Seleccionador', 'Pesador', 'Estibador'];
      else if (tipo === 'FERTILIZACION') roles = ['Aplicador', 'Preparador Mezcla', 'Cargador', 'Operador'];
      else if (tipo === 'CONTROL_PLAGAS') roles = ['Fumigador', 'Preparador Caldo', 'Guía', 'Operador'];
      else if (tipo === 'DESHIERBE') roles = ['Deshierbador', 'Limpieza', 'Operador'];
      return {
        esRecomendado: true,
        score: 100,
        etiquetaIdoneidad: '⭐ Recomendado (Labor de campo)',
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
  onAlternarTrabajador,
  onCambiarRol,
}) => {
  const [busqueda, setBusqueda] = useState('');
  const [rolFiltro, setRolFiltro] = useState<string>('TODOS');
  const [pagina, setPagina] = useState(1);
  const [limite, setLimite] = useState<number>(10);

  // 1. Excluir al encargado/responsable si ya fue seleccionado
  const usuariosSinEncargado = useMemo(() => {
    return usuariosDisponibles.filter((u) => u.id !== responsableId);
  }, [usuariosDisponibles, responsableId]);

  // 2. Evaluar idoneidad y ordenar por relevancia
  const usuariosEvaluados = useMemo(() => {
    const lista = usuariosSinEncargado.map((usuario) => ({
      usuario,
      evaluacion: evaluarTrabajadorParaLabor(usuario.rol, tipoActual),
    }));

    // Filtrar por texto de búsqueda
    const filtradosBusqueda = lista.filter(({ usuario }) => {
      if (!busqueda.trim()) return true;
      const q = busqueda.toLowerCase();
      const nombreCompleto = `${usuario.nombres} ${usuario.apellidos}`.toLowerCase();
      return (
        nombreCompleto.includes(q) ||
        usuario.correo.toLowerCase().includes(q) ||
        (usuario.telefono && usuario.telefono.includes(q))
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
  }, [usuariosSinEncargado, tipoActual, busqueda, rolFiltro, trabajadoresSeleccionados]);

  // Generación dinámica de tabs según los roles de usuarios registrados
  const rolesDisponibles = useMemo(() => {
    const setRoles = new Set<string>();
    usuariosSinEncargado.forEach((u) => {
      if (u.rol) setRoles.add(u.rol);
    });
    return ['TODOS', 'RECOMENDADOS', ...Array.from(setRoles)];
  }, [usuariosSinEncargado]);

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
        <View style={styles.badgeContador}>
          <Text style={styles.textoContador}>
            {trabajadoresSeleccionados.length} seleccionados
          </Text>
        </View>
      </View>

      <Text style={styles.subtitulo}>
        Seleccione y filtre el personal para esta labor. Los trabajadores recomendados aparecen primero y los perfiles de oficina al final.
      </Text>

      {/* Banner informativo si ya se seleccionó encargado */}
      {Boolean(responsableId && nombreResponsable) && (
        <View style={styles.bannerEncargado}>
          <UserCheck size={14} color="#1E40AF" />
          <Text style={styles.textoBannerEncargado}>
            Encargado de la labor: <Text style={{ fontWeight: '700' }}>{nombreResponsable}</Text> (excluido de la cuadrilla operativa)
          </Text>
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
            {usuariosPaginados.map(({ usuario, evaluacion }) => {
              const asignado = trabajadoresSeleccionados.find((t) => t.usuarioId === usuario.id);
              const estaSeleccionado = Boolean(asignado);

              return (
                <View
                  key={usuario.id}
                  style={[
                    styles.tarjetaTrabajador,
                    estaSeleccionado && styles.tarjetaTrabajadorActiva,
                  ]}
                >
                  <Pressable
                    onPress={() => onAlternarTrabajador(usuario.id)}
                    style={styles.contenidoTarjeta}
                  >
                    <View
                      style={[
                        styles.casillaVerificacion,
                        estaSeleccionado && styles.casillaVerificacionActiva,
                      ]}
                    >
                      {estaSeleccionado && <Check size={14} color="#FFFFFF" />}
                    </View>

                    <View style={styles.avatar}>
                      <User size={15} color={Palette.forestGreen} />
                    </View>

                    <View style={styles.datosUsuario}>
                      <Text style={styles.nombreUsuario}>
                        {usuario.nombres} {usuario.apellidos}
                      </Text>
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
                              onPress={() => onCambiarRol(usuario.id, rol)}
                              style={[styles.chipRol, rolActivo && styles.chipRolActivo]}
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
