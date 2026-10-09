import React, { useState } from 'react';
import { StyleSheet, ScrollView, Pressable, Text, View } from 'react-native';
import { useRouter, type Href } from 'expo-router';
import { ArrowLeft } from 'lucide-react-native';
import axios from 'axios';
import { Palette } from '@/constants/theme';
import { AppLayout } from '@/shared/components/layout/app-layout';
import { UsuarioFormulario } from '../components/usuario-formulario';

import { UsuarioFormularioValores } from '../schemas/crear-usuario.schema';
import { useCrearUsuarioMutation } from '../api/usuarios.api';



/**
 * @description Contenedor para la página dedicada de registro de nuevos usuarios.
 */
export const UsuarioRegistroContainer: React.FC = () => {
  const router = useRouter();
  const [errorMensaje, setErrorMensaje] = useState<string | null>(null);

  const crearMutation = useCrearUsuarioMutation();

  const handleEnviar = (datos: UsuarioFormularioValores) => {
    setErrorMensaje(null);

    if (!datos.password) {
      setErrorMensaje('La contraseña es requerida para nuevos usuarios.');
      return;
    }

    crearMutation.mutate(
      {
        ...datos,
        password: datos.password,
      },
      {
        onSuccess: () => {
          router.push('/usuarios' as Href);
        },
        onError: (error: unknown) => {
          if (axios.isAxiosError(error) && error.response?.data?.message) {
            setErrorMensaje(String(error.response.data.message));
          } else {
            setErrorMensaje('Ocurrió un error al registrar el usuario. Revisa los datos.');
          }
        },
      },
    );
  };


  const handleCancelar = () => {
    router.push('/usuarios' as Href);
  };

  return (
    <AppLayout
      titulo="Registrar Nuevo Usuario"
      subtitulo="Formulario de alta para personal técnico y administrativo"
      accionEncabezado={
        <Pressable
          onPress={handleCancelar}
          style={({ pressed }) => [styles.botonVolver, pressed && styles.botonVolverPresionado]}
        >
          <ArrowLeft size={18} color={Palette.forestGreen} />
          <Text style={styles.textoVolver}>Volver al listado</Text>
        </Pressable>
      }
    >
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <UsuarioFormulario
          onEnviar={handleEnviar}
          onCancelar={handleCancelar}
          estaCargando={crearMutation.isPending}
          errorMensaje={errorMensaje}
        />
      </ScrollView>
    </AppLayout>
  );
};

const styles = StyleSheet.create({
  scrollContent: {
    paddingBottom: 40,
  },
  botonVolver: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 8,
    backgroundColor: '#EBF2E5',
  },
  botonVolverPresionado: {
    opacity: 0.8,
  },
  textoVolver: {
    fontSize: 14,
    fontWeight: '600',
    color: Palette.forestGreen,
  },
});
