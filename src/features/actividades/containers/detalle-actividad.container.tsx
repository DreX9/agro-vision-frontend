import React, { useState } from 'react';
import { View, StyleSheet, Pressable, Text } from 'react-native';
import { useRouter, type Href } from 'expo-router';
import { ArrowLeft, Pencil, ClipboardCheck } from 'lucide-react-native';
import { Palette } from '@/constants/theme';
import { AppLayout } from '@/shared/components/layout/app-layout';
import { Boton } from '@/shared/components/ui';
import { ActividadDetalleTabs } from '../components/actividad-detalle-tabs';
import { ActividadesSkeleton } from '../components/actividades-skeleton';
import { useActividadPorIdQuery, useActualizarActividadMutation } from '../api/actividades.api';
import { EstadoActividadTipo } from '../types/actividad.types';

import { useAuthStore } from '@/features/autenticacion';

export interface DetalleActividadContainerProps {
  id: string;
}

/**
 * @description Contenedor para la ficha técnica, bitácora y visualización de cuadrilla/insumos de una actividad.
 */
export const DetalleActividadContainer: React.FC<DetalleActividadContainerProps> = ({ id }) => {
  const router = useRouter();
  const usuario = useAuthStore((s) => s.usuario);
  const rol = usuario?.rol || 'OPERADOR';
  const puedeEditar = rol === 'ADMINISTRADOR' || rol === 'SUPERVISOR' || rol === 'AGRONOMO';
  const esOperador = rol === 'OPERADOR';

  const [editandoSeguimiento, setEditandoSeguimiento] = useState(false);
  const { data: actividad, isLoading } = useActividadPorIdQuery(id);
  const actualizarMutation = useActualizarActividadMutation();

  const handleGuardarSeguimiento = (datos: {
    estado: EstadoActividadTipo;
    descripcion?: string;
    observaciones?: string;
  }) => {
    actualizarMutation.mutate(
      {
        id,
        datos: {
          estado: datos.estado,
          descripcion: datos.descripcion,
          observaciones: datos.observaciones,
        },
      },
      {
        onSuccess: () => {
          setEditandoSeguimiento(false);
        },
      },
    );
  };

  if (isLoading) {
    return (
      <AppLayout titulo="Ficha de Actividad" subtitulo="Cargando detalles de la labor...">
        <ActividadesSkeleton />
      </AppLayout>
    );
  }

  if (!actividad) {
    return (
      <AppLayout titulo="Actividad No Encontrada" subtitulo="La labor solicitada no existe o fue eliminada.">
        <View />
      </AppLayout>
    );
  }

  const subtitulo = esOperador
    ? actividad.descripcion || `${actividad.parcelaNombre || 'Parcela'} · ${actividad.tipo.replace(/_/g, ' ')}`
    : actividad.titulo;

  return (
    <AppLayout
      titulo={`Labor: ${actividad.codigo}`}
      subtitulo={subtitulo}
      accionEncabezado={
        <View style={styles.accionesEncabezado}>
          <Pressable
            onPress={() => router.push('/actividades' as Href)}
            style={({ pressed }) => [styles.botonVolver, pressed && styles.botonVolverPresionado]}
          >
            <ArrowLeft size={16} color={Palette.forestGreen} />
            <Text style={styles.textoVolver}>Volver al listado</Text>
          </Pressable>

          {!esOperador && (
            <Boton
              titulo="Actualizar Seguimiento"
              variante="secundario"
              iconoIzquierda={<ClipboardCheck size={16} color={Palette.forestGreen} />}
              onPress={() => setEditandoSeguimiento(true)}
            />
          )}

          {puedeEditar && (
            <Boton
              titulo="Editar Labor Completa"
              variante="primario"
              iconoIzquierda={<Pencil size={16} color={Palette.white} />}
              onPress={() => router.push(`/actividades/${id}/editar` as Href)}
            />
          )}
        </View>
      }
    >
      <View style={styles.contenedor}>
        <ActividadDetalleTabs
          actividad={actividad}
          onGuardarSeguimiento={handleGuardarSeguimiento}
          guardandoSeguimiento={actualizarMutation.isPending}
          editandoSeguimientoDirecto={editandoSeguimiento}
          onCerrarEdicionSeguimiento={() => setEditandoSeguimiento(false)}
        />
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
});
