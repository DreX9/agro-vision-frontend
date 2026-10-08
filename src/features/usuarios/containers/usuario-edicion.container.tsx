import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useRouter, useLocalSearchParams, type Href } from 'expo-router';
import { AppLayout } from '@/shared/components/layout/app-layout';
import { UsuarioFormulario } from '../components/usuario-formulario';
import { UsuariosSkeleton } from '../components/usuarios-skeleton';
import { useUsuarioPorIdQuery, useActualizarUsuarioMutation } from '../api/usuarios.api';
import { UsuarioFormularioValores } from '../schemas/crear-usuario.schema';

/**
 * @description Contenedor orquestador para la edición de un usuario existente.
 */
export const UsuarioEdicionContainer: React.FC = () => {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();

  const { data: usuario, isLoading, error: errorCarga } = useUsuarioPorIdQuery(id);
  const actualizarMutation = useActualizarUsuarioMutation();

  const handleGuardar = (datos: UsuarioFormularioValores) => {
    if (!id) return;

    actualizarMutation.mutate(
      {
        id,
        datos: {
          nombres: datos.nombres,
          apellidos: datos.apellidos,
          correo: datos.correo,
          rol: datos.rol,
          password: datos.password && datos.password.trim() !== '' ? datos.password : undefined,
          sexo: datos.sexo,
          fechaNacimiento: datos.fechaNacimiento,
          telefono: datos.telefono,
          direccion: datos.direccion,
          departamento: datos.departamento,
          provincia: datos.provincia,
        },
      },
      {
        onSuccess: () => {
          router.push('/usuarios' as Href);
        },
      },
    );
  };

  const handleCancelar = () => {
    router.push('/usuarios' as Href);
  };

  const valoresIniciales: Partial<UsuarioFormularioValores> | undefined = usuario
    ? {
        nombres: usuario.nombres,
        apellidos: usuario.apellidos,
        correo: usuario.correo,
        rol: usuario.rol,
        sexo: usuario.sexo || undefined,
        fechaNacimiento: usuario.fechaNacimiento || '',
        telefono: usuario.telefono || '',
        direccion: usuario.direccion || '',
        departamento: usuario.departamento || '',
        provincia: usuario.provincia || '',
      }
    : undefined;

  return (
    <AppLayout
      titulo="Editar Usuario"
      subtitulo={usuario ? `Modificando datos de ${usuario.nombres} ${usuario.apellidos}` : 'Cargando información...'}
    >
      <View style={styles.contenedor}>
        {isLoading ? (
          <UsuariosSkeleton />
        ) : (
          <UsuarioFormulario
            modo="edicion"
            valoresIniciales={valoresIniciales}
            estaCargando={actualizarMutation.isPending}
            onEnviar={handleGuardar}
            onCancelar={handleCancelar}
            errorMensaje={
              errorCarga
                ? 'No se pudo cargar la información del usuario.'
                : actualizarMutation.error
                  ? 'Ocurrió un error al actualizar los datos del usuario.'
                  : null
            }
          />
        )}
      </View>
    </AppLayout>
  );
};

const styles = StyleSheet.create({
  contenedor: {
    paddingBottom: 40,
    width: '100%',
  },
});
