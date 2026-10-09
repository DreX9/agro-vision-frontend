import React, { useState } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { useRouter, type Href } from 'expo-router';
import { UserPlus, Search } from 'lucide-react-native';
import { Palette } from '@/constants/theme';
import { AppLayout } from '@/shared/components/layout/app-layout';
import { Boton, Input, Card } from '@/shared/components/ui';
import { Paginacion } from '@/shared/components/ui/paginacion';
import { UsuariosTabla } from '../components/usuarios-tabla';
import { UsuariosSkeleton } from '../components/usuarios-skeleton';
import {
  useUsuariosQuery,
  useCambiarEstadoUsuarioMutation,
  useEliminarUsuarioMutation,
} from '../api/usuarios.api';
import { Usuario } from '../types/usuario.types';

/**
 * @description Contenedor orquestador del listado y mantenimiento de usuarios.
 */
export const UsuariosListaContainer: React.FC = () => {
  const router = useRouter();
  const [busqueda, setBusqueda] = useState('');
  const [pagina, setPagina] = useState(1);
  const [limite, setLimite] = useState(10);

  const { data, isLoading, isFetching } = useUsuariosQuery({
    busqueda: busqueda.trim() || undefined,
    pagina,
    limite,
  });

  const cambiarEstadoMutation = useCambiarEstadoUsuarioMutation();
  const eliminarMutation = useEliminarUsuarioMutation();

  const handleCambiarEstado = (usuario: Usuario) => {
    cambiarEstadoMutation.mutate({
      id: usuario.id,
      activo: !usuario.activo,
    });
  };

  const handleVerDetalle = (usuario: Usuario) => {
    router.push(`/usuarios/${usuario.id}` as Href);
  };

  const handleEditar = (usuario: Usuario) => {
    router.push(`/usuarios/${usuario.id}/editar` as Href);
  };

  const handleEliminar = (usuario: Usuario) => {
    eliminarMutation.mutate(usuario.id);
  };

  return (
    <AppLayout
      titulo="Mantenimiento de Usuarios"
      subtitulo="Gestión centralizada de operadores, supervisores y administradores"
      accionEncabezado={
        <Boton
          titulo="Nuevo Usuario"
          variante="primario"
          iconoIzquierda={<UserPlus size={18} color={Palette.white} />}
          onPress={() => router.push('/usuarios/nuevo' as Href)}
        />
      }
    >
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Barra de Búsqueda y Filtros */}
        <Card estilo={styles.tarjetaFiltros}>
          <View style={styles.buscadorWrapper}>
            <Input
              placeholder="Buscar por nombre, apellido o correo institucional..."
              value={busqueda}
              onChangeText={(texto) => {
                setBusqueda(texto);
                setPagina(1);
              }}
              iconoIzquierda={<Search size={18} color="#6B7280" />}
              contenedorEstilo={styles.inputBuscador}
            />
          </View>
        </Card>

        {/* Tabla de Usuarios o Skeleton */}
        {isLoading ? (
          <UsuariosSkeleton />
        ) : (
          <View style={styles.contenedorTabla}>
            <UsuariosTabla
              usuarios={data?.elementos || []}
              cargando={isFetching}
              onVerDetalle={handleVerDetalle}
              onEditar={handleEditar}
              onCambiarEstado={handleCambiarEstado}
              onEliminar={handleEliminar}
            />

            {/* Paginación Estandarizada Global */}
            {data && data.total > 0 && (
              <Paginacion
                paginaActual={data.pagina}
                totalPaginas={data.totalPaginas}
                totalElementos={data.total}
                elementosPorPagina={limite}
                opcionesLimite={[10, 20, 30]}
                onCambiarPagina={(p) => setPagina(p)}
                onCambiarLimite={(nuevoLimite) => {
                  setLimite(nuevoLimite);
                  setPagina(1);
                }}
              />
            )}
          </View>
        )}
      </ScrollView>
    </AppLayout>
  );
};

const styles = StyleSheet.create({
  scrollContent: {
    paddingBottom: 40,
    width: '100%',
  },
  tarjetaFiltros: {
    marginBottom: 20,
    padding: 16,
    width: '100%',
  },
  buscadorWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  inputBuscador: {
    marginBottom: 0,
    flex: 1,
  },
  contenedorTabla: {
    width: '100%',
  },
});


