import React, { useState, useMemo } from 'react';
import { View, Text, Pressable, ScrollView } from 'react-native';
import { Check, User, Users, Search, ChevronLeft, ChevronRight } from 'lucide-react-native';
import { Palette } from '@/constants/theme';
import { Usuario } from '@/features/usuarios/types/usuario.types';
import { Input, Badge } from '@/shared/components/ui';
import { styles } from './actividad-formulario-cuadrilla.styles';

export interface TrabajadorAsignadoInput {
  usuarioId: string;
  rolEnActividad?: string;
}

export interface ActividadFormularioCuadrillaProps {
  usuariosDisponibles: Usuario[];
  trabajadoresSeleccionados: TrabajadorAsignadoInput[];
  onAlternarTrabajador: (usuarioId: string) => void;
  onCambiarRol: (usuarioId: string, rol: string) => void;
}

const ROLES_SUGERIDOS = ['Operador', 'Fumigador', 'Podador', 'Cosechador', 'Regador'];

/**
 * @description Formatea el nombre del rol a una etiqueta plural amigable.
 */
const formatearEtiquetaRol = (rol: string): string => {
  if (rol === 'TODOS') return 'Todos';
  if (rol === 'OPERADOR') return 'Operadores';
  if (rol === 'SUPERVISOR') return 'Supervisores';
  if (rol === 'ADMINISTRADOR') return 'Administradores';
  return `${rol.charAt(0) + rol.slice(1).toLowerCase()}s`;
};

/**
 * @description Selector responsivo de cuadrilla con tabs dinámicos de roles, roles compactos y paginación 10/20.
 */
export const ActividadFormularioCuadrilla: React.FC<ActividadFormularioCuadrillaProps> = ({
  usuariosDisponibles,
  trabajadoresSeleccionados,
  onAlternarTrabajador,
  onCambiarRol,
}) => {
  const [busqueda, setBusqueda] = useState('');
  const [rolFiltro, setRolFiltro] = useState<string>('TODOS');
  const [pagina, setPagina] = useState(1);
  const [limite, setLimite] = useState<number>(10);

  // Generación dinámica de tabs según los roles de usuarios registrados
  const rolesDisponibles = useMemo(() => {
    const setRoles = new Set<string>();
    usuariosDisponibles.forEach((u) => {
      if (u.rol) setRoles.add(u.rol);
    });
    return ['TODOS', ...Array.from(setRoles)];
  }, [usuariosDisponibles]);

  // Filtrado de usuarios según búsqueda y rol seleccionado
  const usuariosFiltrados = useMemo(() => {
    return usuariosDisponibles.filter((u) => {
      const coincideRol = rolFiltro === 'TODOS' || u.rol === rolFiltro;
      if (!coincideRol) return false;
      if (!busqueda.trim()) return true;
      const q = busqueda.toLowerCase();
      const nombreCompleto = `${u.nombres} ${u.apellidos}`.toLowerCase();
      return (
        nombreCompleto.includes(q) ||
        u.correo.toLowerCase().includes(q) ||
        (u.telefono && u.telefono.includes(q))
      );
    });
  }, [usuariosDisponibles, busqueda, rolFiltro]);

  // Paginación interna de 10 en 10 o de 20 en 20
  const totalUsuarios = usuariosFiltrados.length;
  const totalPaginas = Math.max(1, Math.ceil(totalUsuarios / limite));
  const paginaAjustada = Math.min(pagina, totalPaginas);

  const usuariosPaginados = useMemo(() => {
    const inicio = (paginaAjustada - 1) * limite;
    return usuariosFiltrados.slice(inicio, inicio + limite);
  }, [usuariosFiltrados, paginaAjustada, limite]);

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
        Seleccione y filtre los operarios que integrarán la cuadrilla para esta labor agrícola.
      </Text>

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
        {usuariosFiltrados.length === 0 ? (
          <View style={styles.vacioContainer}>
            <Text style={styles.textoVacio}>No se encontraron trabajadores con ese criterio.</Text>
          </View>
        ) : (
          <View style={styles.grillaTrabajadores}>
            {usuariosPaginados.map((usuario) => {
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
                          variante={usuario.rol === 'OPERADOR' ? 'info' : 'exito'}
                        />
                        {usuario.telefono && (
                          <Text style={styles.textoTelefono}>{usuario.telefono}</Text>
                        )}
                      </View>
                    </View>
                  </Pressable>

                  {/* Asignación compacta de rol en esta labor */}
                  {estaSeleccionado && (
                    <View style={styles.seccionRolLaborCompacta}>
                      <Text style={styles.etiquetaRolLabor}>Labor:</Text>
                      <View style={styles.filaRolesSugeridos}>
                        {ROLES_SUGERIDOS.map((rol) => {
                          const rolActivo = (asignado?.rolEnActividad || 'Operador') === rol;
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
