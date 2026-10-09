import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import {
  User,
  Mail,
  Phone,
  Calendar,
  MapPin,
  ShieldCheck,
  CheckCircle2,
  Clock,
  Sparkles,
} from 'lucide-react-native';
import { Palette } from '@/constants/theme';
import { Badge } from '@/shared/components/ui';
import { Usuario, RolUsuarioTipo } from '../types/usuario.types';

export interface UsuarioDetalleFichaProps {
  usuario: Usuario;
}

/**
 * @description Vista estructurada y estilizada para la ficha de perfil de un usuario.
 */
export const UsuarioDetalleFicha: React.FC<UsuarioDetalleFichaProps> = ({ usuario }) => {
  const obtenerVarianteRol = (
    rol: RolUsuarioTipo,
  ): 'exito' | 'info' | 'alerta' | 'peligro' | 'neutro' => {
    switch (rol) {
      case 'ADMINISTRADOR':
        return 'peligro';
      case 'AGRONOMO':
        return 'exito';
      case 'SUPERVISOR':
        return 'info';
      case 'OPERADOR':
        return 'neutro';
      default:
        return 'neutro';
    }
  };

  const obtenerDescripcionRol = (rol: RolUsuarioTipo): string => {
    switch (rol) {
      case 'ADMINISTRADOR':
        return 'Acceso total a la administración de usuarios, auditoría, parámetros del sistema y catálogos globales.';
      case 'AGRONOMO':
        return 'Control técnico y agronómico, diseño de recetas, delimitación de parcelas y prescripción fitosanitaria.';
      case 'SUPERVISOR':
        return 'Asignación y monitoreo de cuadrillas de campo, seguimiento de labores agrícolas y control de ejecución.';
      case 'OPERADOR':
        return 'Ejecución de actividades agrícolas en campo, reporte de tiempos y cumplimiento de tareas asignadas.';
      default:
        return 'Usuario del sistema.';
    }
  };

  const iniciales = `${usuario.nombres.charAt(0)}${usuario.apellidos.charAt(0)}`.toUpperCase();

  return (
    <ScrollView contentContainerStyle={styles.contenidoScroll} showsVerticalScrollIndicator={false}>
      {/* Tarjeta Principal de Perfil */}
      <View style={styles.tarjetaFicha}>
        <View style={styles.cabeceraPerfil}>
          <View style={styles.avatarWrapper}>
            <View style={styles.avatarGrande}>
              <Text style={styles.textoIniciales}>{iniciales}</Text>
            </View>
            <View style={styles.infoBasica}>
              <Text style={styles.nombreCompleto}>
                {usuario.nombreCompleto || `${usuario.nombres} ${usuario.apellidos}`}
              </Text>
              <View style={styles.filaBadges}>
                <Badge texto={usuario.rol} variante={obtenerVarianteRol(usuario.rol)} />
                <Badge
                  texto={usuario.activo ? 'Usuario Activo' : 'Cuenta Suspendida'}
                  variante={usuario.activo ? 'exito' : 'peligro'}
                />
              </View>
            </View>
          </View>
        </View>

        {/* Grilla de Contacto e Identidad */}
        <View style={styles.grillaMetadatos}>
          <View style={styles.itemMeta}>
            <Mail size={16} color={Palette.forestGreen} />
            <View>
              <Text style={styles.etiquetaMeta}>Correo Institucional</Text>
              <Text style={styles.valorMeta}>{usuario.correo}</Text>
            </View>
          </View>

          <View style={styles.itemMeta}>
            <Phone size={16} color={Palette.forestGreen} />
            <View>
              <Text style={styles.etiquetaMeta}>Teléfono de Contacto</Text>
              <Text style={styles.valorMeta}>{usuario.telefono || 'Sin teléfono registrado'}</Text>
            </View>
          </View>

          <View style={styles.itemMeta}>
            <User size={16} color={Palette.forestGreen} />
            <View>
              <Text style={styles.etiquetaMeta}>Sexo Biológico</Text>
              <Text style={styles.valorMeta}>{usuario.sexo || 'No especificado'}</Text>
            </View>
          </View>

          <View style={styles.itemMeta}>
            <Calendar size={16} color={Palette.forestGreen} />
            <View>
              <Text style={styles.etiquetaMeta}>Fecha de Nacimiento</Text>
              <Text style={styles.valorMeta}>
                {usuario.fechaNacimiento
                  ? new Date(usuario.fechaNacimiento).toLocaleDateString('es-PE', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                    })
                  : 'No registrada'}
              </Text>
            </View>
          </View>
        </View>
      </View>

      {/* Tarjeta de Localización Domiciliaria */}
      <View style={styles.tarjetaFicha}>
        <View style={styles.cabeceraSeccion}>
          <MapPin size={16} color={Palette.forestGreen} />
          <Text style={styles.tituloSeccion}>Residencia y Ubicación Geográfica</Text>
        </View>

        <View style={styles.grillaMetadatos}>
          <View style={styles.itemMeta}>
            <MapPin size={16} color={Palette.forestGreen} />
            <View>
              <Text style={styles.etiquetaMeta}>Departamento</Text>
              <Text style={styles.valorMeta}>{usuario.departamento || 'No especificado'}</Text>
            </View>
          </View>

          <View style={styles.itemMeta}>
            <MapPin size={16} color={Palette.forestGreen} />
            <View>
              <Text style={styles.etiquetaMeta}>Provincia</Text>
              <Text style={styles.valorMeta}>{usuario.provincia || 'No especificada'}</Text>
            </View>
          </View>
        </View>

        {usuario.direccion ? (
          <View style={styles.cajaTexto}>
            <Text style={styles.subtituloTexto}>Dirección de Residencia:</Text>
            <Text style={styles.cuerpoTexto}>{usuario.direccion}</Text>
          </View>
        ) : null}
      </View>

      {/* Tarjeta de Permisos y Rol en el Sistema */}
      <View style={styles.tarjetaFicha}>
        <View style={styles.cabeceraSeccion}>
          <ShieldCheck size={16} color={Palette.forestGreen} />
          <Text style={styles.tituloSeccion}>Permisos y Alcance del Rol ({usuario.rol})</Text>
        </View>

        <View style={styles.cajaRol}>
          <Sparkles size={16} color={Palette.forestGreen} />
          <Text style={styles.descripcionRol}>{obtenerDescripcionRol(usuario.rol)}</Text>
        </View>

        <View style={styles.filaAuditoria}>
          <Clock size={14} color="#6B7280" />
          <Text style={styles.textoAuditoria}>
            Fecha de alta en plataforma:{' '}
            {new Date(usuario.createdAt).toLocaleDateString('es-PE', {
              day: 'numeric',
              month: 'long',
              year: 'numeric',
            })}
          </Text>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  contenidoScroll: { padding: 16, gap: 16, maxWidth: 900, width: '100%', alignSelf: 'center' },
  tarjetaFicha: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#D0DEC8',
    padding: 18,
    gap: 14,
  },
  cabeceraPerfil: {
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
    paddingBottom: 14,
  },
  avatarWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  avatarGrande: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#E8F5E9',
    borderWidth: 2,
    borderColor: '#C8E6C9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  textoIniciales: {
    fontSize: 22,
    fontWeight: '800',
    color: Palette.forestGreen,
  },
  infoBasica: {
    flex: 1,
    gap: 6,
  },
  nombreCompleto: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
  },
  filaBadges: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  grillaMetadatos: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  itemMeta: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    minWidth: 200,
    flex: 1,
  },
  etiquetaMeta: { fontSize: 11, fontWeight: '600', color: '#6B7280', textTransform: 'uppercase' },
  valorMeta: { fontSize: 13, fontWeight: '600', color: '#1F2937', marginTop: 2 },
  cabeceraSeccion: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  tituloSeccion: { fontSize: 15, fontWeight: '700', color: '#111827' },
  cajaTexto: {
    backgroundColor: '#F9FAFB',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  subtituloTexto: { fontSize: 12, fontWeight: '700', color: '#374151', marginBottom: 4 },
  cuerpoTexto: { fontSize: 13, color: '#4B5563', lineHeight: 18 },
  cajaRol: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    backgroundColor: '#F4F7F2',
    borderWidth: 1,
    borderColor: '#D0DEC8',
    padding: 14,
    borderRadius: 8,
  },
  descripcionRol: {
    flex: 1,
    fontSize: 13,
    color: '#273C2C',
    lineHeight: 19,
    fontWeight: '500',
  },
  filaAuditoria: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingTop: 4,
  },
  textoAuditoria: {
    fontSize: 12,
    color: '#6B7280',
  },
});
