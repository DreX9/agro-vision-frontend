import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Modal,
  findNodeHandle,
  UIManager,
  Platform,
} from 'react-native';
import {
  MoreVertical,
  Pencil,
  UserCheck,
  UserX,
  Trash2,
  Phone,
  Mail,
  Eye,
} from 'lucide-react-native';
import { Palette } from '@/constants/theme';
import { Badge, Tabla, ColumnaTabla } from '@/shared/components/ui';
import { Usuario } from '../types/usuario.types';

export interface UsuariosTablaProps {
  usuarios: Usuario[];
  cargando?: boolean;
  onVerDetalle?: (usuario: Usuario) => void;
  onEditar?: (usuario: Usuario) => void;
  onCambiarEstado: (usuario: Usuario) => void;
  onEliminar?: (usuario: Usuario) => void;
}

interface PosicionMenu {
  top: number;
  left: number;
}

/**
 * @description Tabla responsiva de usuarios con menú contextual flotante desplegable anclado a los 3 puntos sin recortes.
 */
export const UsuariosTabla: React.FC<UsuariosTablaProps> = ({
  usuarios,
  cargando = false,
  onVerDetalle,
  onEditar,
  onCambiarEstado,
  onEliminar,
}) => {
  const [usuarioMenuActivo, setUsuarioMenuActivo] = useState<Usuario | null>(null);
  const [posicionMenu, setPosicionMenu] = useState<PosicionMenu>({ top: 0, left: 0 });

  const obtenerVarianteRol = (rol: string): 'exito' | 'info' | 'alerta' | 'neutro' => {
    switch (rol) {
      case 'ADMINISTRADOR':
        return 'exito';
      case 'AGRONOMO':
        return 'info';
      case 'SUPERVISOR':
        return 'alerta';
      default:
        return 'neutro';
    }
  };

  const abrirMenu = (u: Usuario, ref: View | null) => {
    if (!ref) {
      setUsuarioMenuActivo(u);
      return;
    }

    if (Platform.OS === 'web') {
      // En Web obtenemos las coordenadas directamente del elemento DOM
      const elemento = ref as unknown as HTMLElement;
      if (elemento && typeof elemento.getBoundingClientRect === 'function') {
        const rect = elemento.getBoundingClientRect();
        setPosicionMenu({
          top: rect.bottom + 4,
          left: Math.max(10, rect.right - 160),
        });
        setUsuarioMenuActivo(u);
        return;
      }
    }

    // En React Native móvil usamos measureInWindow
    ref.measureInWindow((x, y, width, height) => {
      setPosicionMenu({
        top: y + height + 4,
        left: Math.max(10, x + width - 160),
      });
      setUsuarioMenuActivo(u);
    });
  };

  const columnas: ColumnaTabla<Usuario>[] = [
    {
      id: 'nombre',
      encabezado: 'Usuario',
      flex: 2.2,
      anchoMinimo: 220,
      render: (u) => (
        <Pressable
          style={styles.columnaUsuario}
          onPress={() => (onVerDetalle || onEditar)?.(u)}
        >
          <View style={styles.avatarIniciales}>
            <Text style={styles.textoIniciales}>
              {`${u.nombres.charAt(0)}${u.apellidos.charAt(0)}`.toUpperCase()}
            </Text>
          </View>
          <View style={styles.infoUsuario}>
            <Text style={styles.nombreTexto} numberOfLines={1}>
              {u.nombreCompleto || `${u.nombres} ${u.apellidos}`}
            </Text>
            {u.telefono && (
              <View style={styles.telefonoFila}>
                <Phone size={11} color={Palette.textSecondary} />
                <Text style={styles.telefonoTexto}>{u.telefono}</Text>
              </View>
            )}
          </View>
        </Pressable>
      ),
    },
    {
      id: 'correo',
      encabezado: 'Correo Institucional',
      flex: 2.2,
      anchoMinimo: 220,
      render: (u) => (
        <View style={styles.correoFila}>
          <Mail size={13} color="#6B7280" />
          <Text style={styles.correoTexto} numberOfLines={1}>
            {u.correo}
          </Text>
        </View>
      ),
    },
    {
      id: 'rol',
      encabezado: 'Rol',
      flex: 1.3,
      anchoMinimo: 130,
      render: (u) => (
        <Badge texto={u.rol} variante={obtenerVarianteRol(u.rol)} />
      ),
    },
    {
      id: 'sexo',
      encabezado: 'Sexo',
      flex: 0.9,
      anchoMinimo: 90,
      render: (u) => (
        <Text style={styles.datoSecundarioTexto}>{u.sexo || '—'}</Text>
      ),
    },
    {
      id: 'fechaNacimiento',
      encabezado: 'Fecha Nac.',
      flex: 1.1,
      anchoMinimo: 110,
      render: (u) => (
        <Text style={styles.datoSecundarioTexto}>{u.fechaNacimiento || '—'}</Text>
      ),
    },
    {
      id: 'estado',
      encabezado: 'Estado',
      flex: 1.0,
      anchoMinimo: 100,
      render: (u) => (
        <Badge
          texto={u.activo ? 'Activo' : 'Inactivo'}
          variante={u.activo ? 'exito' : 'peligro'}
        />
      ),
    },
    {
      id: 'acciones',
      encabezado: 'Acciones',
      flex: 0.7,
      anchoMinimo: 80,
      alineacion: 'center',
      render: (u) => {
        let botonRef: View | null = null;
        const estaActivo = usuarioMenuActivo?.id === u.id;

        return (
          <View
            ref={(r) => {
              botonRef = r;
            }}
            style={styles.celdaAccionesWrapper}
          >
            <Pressable
              onPress={() => abrirMenu(u, botonRef)}
              style={({ pressed }) => [
                styles.botonTresPuntos,
                estaActivo && styles.botonTresPuntosActivo,
                pressed && styles.botonTresPuntosPresionado,
              ]}
            >
              <MoreVertical
                size={18}
                color={estaActivo ? Palette.forestGreen : '#4B5563'}
              />
            </Pressable>
          </View>
        );
      },
    },
  ];

  return (
    <>
      <Tabla
        columnas={columnas}
        datos={usuarios}
        claveExtractor={(u) => u.id}
        cargando={cargando}
        mensajeVacio="No se encontraron usuarios registrados con los filtros seleccionados."
      />

      {/* Menú Desplegable Flotante Transparente (Sin oscurecer la pantalla y sin cortes) */}
      {usuarioMenuActivo && (
        <Modal
          transparent
          animationType="none"
          visible={Boolean(usuarioMenuActivo)}
          onRequestClose={() => setUsuarioMenuActivo(null)}
        >
          <Pressable
            style={styles.modalTransparenteBackdrop}
            onPress={() => setUsuarioMenuActivo(null)}
          >
            <View
              style={[
                styles.menuFlotanteCard,
                { top: posicionMenu.top, left: posicionMenu.left },
              ]}
            >
              {/* Opción: Ver Detalle / Ficha */}
              {onVerDetalle && (
                <Pressable
                  style={({ pressed }) => [
                    styles.opcionItem,
                    pressed && styles.opcionItemPresionado,
                  ]}
                  onPress={() => {
                    const u = usuarioMenuActivo;
                    setUsuarioMenuActivo(null);
                    onVerDetalle(u);
                  }}
                >
                  <Eye size={15} color="#2563EB" />
                  <Text style={styles.opcionTexto}>Ver Ficha / Perfil</Text>
                </Pressable>
              )}

              {/* Opción: Editar */}
              <Pressable
                style={({ pressed }) => [
                  styles.opcionItem,
                  pressed && styles.opcionItemPresionado,
                ]}
                onPress={() => {
                  const u = usuarioMenuActivo;
                  setUsuarioMenuActivo(null);
                  if (onEditar) onEditar(u);
                }}
              >
                <Pencil size={15} color={Palette.forestGreen} />
                <Text style={styles.opcionTexto}>Editar</Text>
              </Pressable>

              {/* Opción: Desactivar / Activar */}
              <Pressable
                style={({ pressed }) => [
                  styles.opcionItem,
                  pressed && styles.opcionItemPresionado,
                ]}
                onPress={() => {
                  const u = usuarioMenuActivo;
                  setUsuarioMenuActivo(null);
                  onCambiarEstado(u);
                }}
              >
                {usuarioMenuActivo.activo ? (
                  <>
                    <UserX size={15} color={Palette.warning} />
                    <Text style={[styles.opcionTexto, { color: Palette.warning }]}>
                      Desactivar
                    </Text>
                  </>
                ) : (
                  <>
                    <UserCheck size={15} color={Palette.success} />
                    <Text style={[styles.opcionTexto, { color: Palette.success }]}>
                      Activar
                    </Text>
                  </>
                )}
              </Pressable>

              {/* Opción: Eliminar */}
              {onEliminar && (
                <Pressable
                  style={({ pressed }) => [
                    styles.opcionItem,
                    styles.opcionEliminar,
                    pressed && styles.opcionItemPresionado,
                  ]}
                  onPress={() => {
                    const u = usuarioMenuActivo;
                    setUsuarioMenuActivo(null);
                    onEliminar(u);
                  }}
                >
                  <Trash2 size={15} color={Palette.error} />
                  <Text style={[styles.opcionTexto, { color: Palette.error }]}>
                    Eliminar
                  </Text>
                </Pressable>
              )}
            </View>
          </Pressable>
        </Modal>
      )}
    </>
  );
};

const styles = StyleSheet.create({
  columnaUsuario: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatarIniciales: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#EBF2E5',
    borderWidth: 1,
    borderColor: '#D4E2CA',
    alignItems: 'center',
    justifyContent: 'center',
  },
  textoIniciales: {
    fontSize: 13,
    fontWeight: '700',
    color: Palette.forestGreen,
  },
  infoUsuario: {
    flex: 1,
  },
  nombreTexto: {
    fontSize: 14,
    fontWeight: '700',
    color: Palette.text,
  },
  telefonoFila: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  telefonoTexto: {
    fontSize: 12,
    color: Palette.textSecondary,
  },
  correoFila: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  correoTexto: {
    fontSize: 13,
    color: Palette.text,
  },
  datoSecundarioTexto: {
    fontSize: 13,
    color: Palette.textSecondary,
  },
  celdaAccionesWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  botonTresPuntos: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  botonTresPuntosActivo: {
    backgroundColor: '#EBF2E5',
  },
  botonTresPuntosPresionado: {
    backgroundColor: '#F3EFE6',
  },
  modalTransparenteBackdrop: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  menuFlotanteCard: {
    position: 'absolute',
    width: 155,
    backgroundColor: Palette.white,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingVertical: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 10,
  },
  opcionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 9,
    paddingHorizontal: 14,
  },
  opcionItemPresionado: {
    backgroundColor: '#F8FAFC',
  },
  opcionEliminar: {
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  opcionTexto: {
    fontSize: 13,
    fontWeight: '600',
    color: '#334155',
  },
});



