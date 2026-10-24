import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useRouter, type Href } from 'expo-router';
import { AppLayout } from '@/shared/components/layout/app-layout';
import { ActividadFormulario } from '../components/actividad-formulario';
import { ActividadesSkeleton } from '../components/actividades-skeleton';
import { useParcelasQuery } from '@/features/parcelas/api/parcelas.api';
import { useUsuariosQuery } from '@/features/usuarios/api/usuarios.api';
import { useInsumosQuery } from '../api/insumos.api';
import { useCrearActividadMutation } from '../api/actividades.api';
import { ActividadFormValores } from '../schemas/actividad.schema';
import { useAuthStore } from '@/features/autenticacion';

/**
 * @description Contenedor orquestador para el registro de una nueva actividad agrícola.
 */
export const CrearActividadContainer: React.FC = () => {
  const router = useRouter();
  const usuario = useAuthStore((s) => s.usuario);

  React.useEffect(() => {
    if (usuario && usuario.rol !== 'ADMINISTRADOR' && usuario.rol !== 'AGRONOMO') {
      router.replace('/actividades' as Href);
    }
  }, [usuario, router]);

  const { data: datosParcelas, isLoading: cargandoParcelas } = useParcelasQuery({ limite: 100 });
  const { data: datosUsuarios, isLoading: cargandoUsuarios } = useUsuariosQuery({ limite: 100 });
  const { data: insumos = [], isLoading: cargandoInsumos } = useInsumosQuery();
  const crearMutation = useCrearActividadMutation();

  const handleGuardar = (valores: ActividadFormValores) => {
    const fechaSolo = valores.fechaInicio.split('T')[0];
    const horaIni = valores.horaInicio || '07:00';
    const horaFin = valores.horaFin || '12:00';

    const fechaInicioIso = new Date(`${fechaSolo}T${horaIni}:00`).toISOString();
    const fechaFinSolo = valores.fechaFin ? valores.fechaFin.split('T')[0] : fechaSolo;
    const fechaFinIso = new Date(`${fechaFinSolo}T${horaFin}:00`).toISOString();

    const trabajadoresFormateados = valores.trabajadores.map((t) => {
      const tHoraIni = t.horaInicio || horaIni;
      const tHoraFin = t.horaFin || horaFin;
      return {
        usuarioId: t.usuarioId,
        rolEnActividad: t.rolEnActividad,
        horaInicio: new Date(`${fechaSolo}T${tHoraIni}:00`).toISOString(),
        horaFin: new Date(`${fechaFinSolo}T${tHoraFin}:00`).toISOString(),
        horasAsignadas: t.horasAsignadas || valores.duracionHoras || 5,
      };
    });

    crearMutation.mutate(
      {
        codigo: valores.codigo || undefined,
        titulo: valores.titulo,
        tipo: valores.tipo,
        parcelaId: valores.parcelaId,
        sectorId: valores.sectorId || undefined,
        fechaInicio: fechaInicioIso,
        fechaFin: fechaFinIso,
        usuarioResponsableId: valores.usuarioResponsableId || undefined,
        descripcion: valores.descripcion || undefined,
        observaciones: valores.observaciones || undefined,
        estado: valores.estado,
        trabajadores: trabajadoresFormateados,
        recursos: valores.recursos,
      },
      {
        onSuccess: () => {
          router.replace('/actividades' as Href);
        },
      },
    );
  };

  const handleCancelar = () => {
    router.back();
  };

  const cargando = cargandoParcelas || cargandoUsuarios || cargandoInsumos;

  return (
    <AppLayout
      titulo="Programar Nueva Actividad Agrícola"
      subtitulo={
        usuario?.rol === 'AGRONOMO'
          ? 'Planificación técnica de labor, insumos y designación de supervisión en campo'
          : 'Asigne la labor a una parcela, configure la cuadrilla de operarios y planifique los insumos requeridos'
      }
    >
      {cargando ? (
        <ActividadesSkeleton />
      ) : (
        <View style={styles.contenedor}>
          <ActividadFormulario
            parcelas={datosParcelas?.items || []}
            usuarios={datosUsuarios?.elementos || []}
            insumos={insumos}
            modo="crear"
            esAgronomo={usuario?.rol === 'AGRONOMO'}
            guardando={crearMutation.isPending}
            onSubmit={handleGuardar}
            onCancelar={handleCancelar}
          />
        </View>
      )}
    </AppLayout>
  );
};

const styles = StyleSheet.create({
  contenedor: { flex: 1 },
});
