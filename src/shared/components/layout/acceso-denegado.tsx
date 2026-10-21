import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useRouter, type Href } from 'expo-router';
import {
  ShieldAlert,
  ArrowLeft,
  Lock,
  User,
  AlertTriangle,
  LogOut,
  Clock,
} from 'lucide-react-native';
import { Palette } from '@/constants/theme';
import {
  obtenerRolesPermitidosParaRuta,
  MATRIZ_ROLES,
  RolSistema,
} from '@/shared/constants/roles-permisos';
import { useAuthStore } from '@/features/autenticacion';

export interface AccesoDenegadoProps {
  rol?: string | null;
  ruta?: string;
  onVolver?: () => void;
}

/**
 * @description Vista de seguridad 403 (Forbidden / RBAC) mostrada cuando un usuario
 * intenta ingresar de forma directa a una URL o módulo no autorizado para su rol.
 */
export const AccesoDenegado: React.FC<AccesoDenegadoProps> = ({
  rol,
  ruta = '/',
  onVolver,
}) => {
  const router = useRouter();
  const cerrarSesion = useAuthStore((s) => s.cerrarSesion);
  const [segundosRestantes, setSegundosRestantes] = useState(6);

  const rolActual = (rol || 'OPERADOR') as RolSistema;
  const defRolActual = MATRIZ_ROLES[rolActual] || MATRIZ_ROLES.OPERADOR;
  const rolesPermitidos = obtenerRolesPermitidosParaRuta(ruta);

  const handleRegresar = () => {
    if (onVolver) {
      onVolver();
    } else {
      router.replace('/' as Href);
    }
  };

  // Redirección suave y automática al Dashboard tras el contador
  useEffect(() => {
    if (segundosRestantes <= 0) {
      handleRegresar();
      return;
    }

    const timer = setTimeout(() => {
      setSegundosRestantes((prev) => Math.max(0, prev - 1));
    }, 1000);

    return () => clearTimeout(timer);
  }, [segundosRestantes]);

  return (
    <View style={styles.contenedor}>
      <View style={styles.tarjeta}>
        {/* Cabecera con icono de seguridad */}
        <View style={styles.iconoEnvoltorio}>
          <ShieldAlert size={42} color="#DC2626" />
        </View>

        <View style={styles.badgeCodigo}>
          <Lock size={12} color="#991B1B" />
          <Text style={styles.textoBadgeCodigo}>HTTP 403 • ACCESO RESTRINGIDO (RBAC)</Text>
        </View>

        <Text style={styles.titulo}>Acceso No Autorizado</Text>
        <Text style={styles.subtitulo}>
          No cuentas con los permisos requeridos para visualizar o gestionar este módulo del sistema.
        </Text>

        {/* Ficha técnica del intento de acceso */}
        <View style={styles.cajaDetalles}>
          <View style={styles.filaDetalle}>
            <Text style={styles.etiquetaDetalle}>Ruta solicitada:</Text>
            <Text style={styles.valorRuta} numberOfLines={1}>
              {ruta}
            </Text>
          </View>

          <View style={styles.separador} />

          <View style={styles.filaDetalle}>
            <Text style={styles.etiquetaDetalle}>Tu rol en sesión:</Text>
            <View style={styles.chipRolActual}>
              <User size={12} color="#B45309" />
              <Text style={styles.textoRolActual}>{defRolActual.etiqueta} ({rolActual})</Text>
            </View>
          </View>

          <View style={styles.separador} />

          <View style={styles.filaDetalle}>
            <Text style={styles.etiquetaDetalle}>Roles autorizados:</Text>
            <View style={styles.contenedorRolesPermitidos}>
              {rolesPermitidos.length > 0 ? (
                rolesPermitidos.map((r) => (
                  <View key={r} style={styles.chipRolPermitido}>
                    <Text style={styles.textoRolPermitido}>
                      {MATRIZ_ROLES[r]?.etiqueta || r}
                    </Text>
                  </View>
                ))
              ) : (
                <Text style={styles.textoSinRoles}>Solo Administrador del Sistema</Text>
              )}
            </View>
          </View>
        </View>

        {/* Aviso de auditoría y política */}
        <View style={styles.avisoSeguridad}>
          <AlertTriangle size={15} color="#D97706" style={{ marginTop: 1 }} />
          <Text style={styles.textoAvisoSeguridad}>
            Por directiva de seguridad y control de acceso (Spring Security / RBAC), el ingreso directo mediante enlace está bloqueado para proteger la integridad operativa del fundo.
          </Text>
        </View>

        {/* Contador de redirección */}
        <View style={styles.filaContador}>
          <Clock size={13} color="#6B7280" />
          <Text style={styles.textoContador}>
            Redireccionando automáticamente a tu Dashboard en {segundosRestantes}s...
          </Text>
        </View>

        {/* Botones de acción */}
        <View style={styles.acciones}>
          <Pressable onPress={handleRegresar} style={styles.botonVolver}>
            <ArrowLeft size={16} color="#FFFFFF" />
            <Text style={styles.textoBotonVolver}>Volver a Mi Dashboard</Text>
          </Pressable>

          <Pressable onPress={cerrarSesion} style={styles.botonCerrarSesion}>
            <LogOut size={15} color="#4B5563" />
            <Text style={styles.textoBotonCerrarSesion}>Cambiar de Cuenta</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  contenedor: {
    flex: 1,
    minHeight: 520,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  tarjeta: {
    width: '100%',
    maxWidth: 580,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 28,
    borderWidth: 1,
    borderColor: '#FEE2E2',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 16,
    elevation: 3,
    alignItems: 'center',
  },
  iconoEnvoltorio: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: '#FEE2E2',
    borderWidth: 2,
    borderColor: '#FECACA',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 14,
  },
  badgeCodigo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FEF2F2',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#FECACA',
    marginBottom: 12,
  },
  textoBadgeCodigo: {
    fontSize: 11,
    fontWeight: '700',
    color: '#991B1B',
    letterSpacing: 0.4,
  },
  titulo: {
    fontSize: 22,
    fontWeight: '800',
    color: '#111827',
    marginBottom: 6,
    textAlign: 'center',
  },
  subtitulo: {
    fontSize: 13.5,
    color: '#4B5563',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 20,
  },
  cajaDetalles: {
    width: '100%',
    backgroundColor: '#F9FAFB',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    padding: 14,
    marginBottom: 16,
  },
  filaDetalle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 8,
  },
  etiquetaDetalle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
  },
  valorRuta: {
    fontSize: 12,
    fontFamily: 'monospace',
    fontWeight: '600',
    color: '#1F2937',
    backgroundColor: '#E5E7EB',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  chipRolActual: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  textoRolActual: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#92400E',
  },
  contenedorRolesPermitidos: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  chipRolPermitido: {
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  textoRolPermitido: {
    fontSize: 11,
    fontWeight: '600',
    color: '#065F46',
  },
  textoSinRoles: {
    fontSize: 12,
    color: '#9CA3AF',
    fontStyle: 'italic',
  },
  separador: {
    height: 1,
    backgroundColor: '#E5E7EB',
    marginVertical: 10,
  },
  avisoSeguridad: {
    flexDirection: 'row',
    gap: 8,
    backgroundColor: '#FFFBEB',
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FDE68A',
    width: '100%',
    marginBottom: 14,
  },
  textoAvisoSeguridad: {
    flex: 1,
    fontSize: 11.5,
    color: '#92400E',
    lineHeight: 16,
  },
  filaContador: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 16,
  },
  textoContador: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
  },
  acciones: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flexWrap: 'wrap',
    justifyContent: 'center',
    width: '100%',
  },
  botonVolver: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: Palette.forestGreen,
    paddingHorizontal: 18,
    paddingVertical: 11,
    borderRadius: 8,
    shadowColor: Palette.forestGreen,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  },
  textoBotonVolver: {
    color: '#FFFFFF',
    fontSize: 13.5,
    fontWeight: '700',
  },
  botonCerrarSesion: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingHorizontal: 14,
    paddingVertical: 11,
    borderRadius: 8,
  },
  textoBotonCerrarSesion: {
    color: '#4B5563',
    fontSize: 13,
    fontWeight: '600',
  },
});
