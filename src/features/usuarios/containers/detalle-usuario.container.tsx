import React from 'react';
import { View, StyleSheet, Pressable, Text } from 'react-native';
import { useRouter, type Href } from 'expo-router';
import { ArrowLeft, Pencil } from 'lucide-react-native';
import { Palette } from '@/constants/theme';
import { AppLayout } from '@/shared/components/layout/app-layout';
import { Boton } from '@/shared/components/ui';
import { UsuarioDetalleFicha } from '../components/usuario-detalle-ficha';
import { UsuariosSkeleton } from '../components/usuarios-skeleton';
import { useUsuarioPorIdQuery } from '../api/usuarios.api';

export interface DetalleUsuarioContainerProps {
  id: string;
}

/**
 * @description Contenedor para la ficha de perfil de un usuario del sistema.
 */
export const DetalleUsuarioContainer: React.FC<DetalleUsuarioContainerProps> = ({ id }) => {
  const router = useRouter();
  const { data: usuario, isLoading } = useUsuarioPorIdQuery(id);

  if (isLoading) {
    return (
      <AppLayout titulo="Ficha de Usuario" subtitulo="Cargando perfil institucional...">
        <UsuariosSkeleton />
      </AppLayout>
    );
  }

  if (!usuario) {
    return (
      <AppLayout titulo="Usuario No Encontrado" subtitulo="El usuario solicitado no existe o fue dado de baja.">
        <View style={styles.contenedorVacio}>
          <Text style={styles.textoVacio}>No se encontró la información del usuario solicitado.</Text>
          <Boton
            titulo="Volver al listado de usuarios"
            variante="secundario"
            onPress={() => router.push('/usuarios' as Href)}
          />
        </View>
      </AppLayout>
    );
  }

  return (
    <AppLayout
      titulo={`Ficha de Usuario: ${usuario.nombreCompleto || `${usuario.nombres} ${usuario.apellidos}`}`}
      subtitulo={`Perfil institucional • Rol ${usuario.rol}`}
      accionEncabezado={
        <View style={styles.accionesEncabezado}>
          <Pressable
            onPress={() => router.push('/usuarios' as Href)}
            style={({ pressed }) => [styles.botonVolver, pressed && styles.botonVolverPresionado]}
          >
            <ArrowLeft size={16} color={Palette.forestGreen} />
            <Text style={styles.textoVolver}>Volver al listado</Text>
          </Pressable>

          <Boton
            titulo="Editar Usuario"
            variante="primario"
            iconoIzquierda={<Pencil size={16} color={Palette.white} />}
            onPress={() => router.push(`/usuarios/${id}/editar` as Href)}
          />
        </View>
      }
    >
      <View style={styles.contenedor}>
        <UsuarioDetalleFicha usuario={usuario} />
      </View>
    </AppLayout>
  );
};

const styles = StyleSheet.create({
  contenedor: { flex: 1, paddingBottom: 30 },
  accionesEncabezado: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  botonVolver: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: '#EBF2E5',
  },
  botonVolverPresionado: { opacity: 0.8 },
  textoVolver: { fontSize: 13, fontWeight: '600', color: Palette.forestGreen },
  contenedorVacio: { padding: 30, alignItems: 'center', gap: 16 },
  textoVacio: { fontSize: 14, color: '#6B7280' },
});
