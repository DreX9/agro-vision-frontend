import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useRouter, type Href } from 'expo-router';
import { AppLayout } from '@/shared/components/layout/app-layout';
import { ActividadFormulario } from '../components/actividad-formulario';
import { ActividadesSkeleton } from '../components/actividades-skeleton';
import { useParcelasQuery } from '@/features/parcelas/api/parcelas.api';
import { useUsuariosQuery } from '@/features/usuarios/api/usuarios.api';
import { useAuthStore } from '@/features/autenticacion';
import { useInsumosQuery } from '../api/insumos.api';
import { useActividadPorIdQuery, useActualizarActividadMutation } from '../api/actividades.api';
import { ActividadFormValores } from '../schemas/actividad.schema';

export interface EditarActividadContainerProps {
  id: string;
}

/**
 * @description Contenedor orquestador para editar una actividad agrícola existente.
 */
export const EditarActividadContainer: React.FC<EditarActividadContainerProps> = ({ id }) => {
  const router = useRouter();
  const usuario = useAuthStore((s) => s.usuario);
  const esSupervisor = usuario?.rol === 'SUPERVISOR';
  const { data: actividad, isLoading: cargandoActividad } = useActividadPorIdQuery(id);
  const { data: datosParcelas, isLoading: cargandoParcelas } = useParcelasQuery({ limite: 100 });
  const { data: datosUsuarios, isLoading: cargandoUsuarios } = useUsuariosQuery({ limite: 100 });
  const { data: insumos = [], isLoading: cargandoInsumos } = useInsumosQuery();
  const actualizarMutation = useActualizarActividadMutation();

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

    // Segmentación estricta por rol:
    // Si es Supervisor, se conservan intactos los parámetros agronómicos/técnicos asignados
    // y se actualiza la cuadrilla, notas de campo y estado.
    const datosPayload = esSupervisor && actividad
      ? {
          titulo: actividad.titulo,
          tipo: actividad.tipo,
          parcelaId: actividad.parcelaId,
          sectorId: actividad.sectorId || undefined,
          fechaInicio: actividad.fechaInicio,
          fechaFin: actividad.fechaFin || undefined,
          usuarioResponsableId: actividad.usuarioResponsableId || undefined,
          descripcion: valores.descripcion || undefined,
          observaciones: valores.observaciones || undefined,
          estado: valores.estado,
          trabajadores: trabajadoresFormateados,
          recursos: valores.recursos,
        }
      : {
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
        };

    actualizarMutation.mutate(
      {
        id,
        datos: datosPayload,
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

  const cargando = cargandoActividad || cargandoParcelas || cargandoUsuarios || cargandoInsumos;

  if (cargando) {
    return (
      <AppLayout titulo="Editar Actividad" subtitulo="Cargando labor agrícola...">
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

  const esAgronomo = usuario?.rol === 'AGRONOMO';

  return (
    <AppLayout
      titulo={`Editar Actividad: ${actividad.codigo} - ${actividad.titulo}`}
      subtitulo={
        esSupervisor
          ? 'Modo Supervisión: Conformación de cuadrilla de operarios y control en terreno'
          : esAgronomo
          ? 'Modo Agronomía: Modifique la prescripción técnica, insumos requeridos o designación de supervisión'
          : 'Modifique los datos, cuadrilla asignada o insumos requeridos'
      }
    >
      <View style={styles.contenedor}>
        <ActividadFormulario
          parcelas={datosParcelas?.items || []}
          usuarios={datosUsuarios?.elementos || []}
          insumos={insumos}
          modo="editar"
          esSupervisor={esSupervisor}
          esAgronomo={esAgronomo}
          actividadId={id}
          valoresIniciales={{
            codigo: actividad.codigo,
            titulo: actividad.titulo,
            tipo: actividad.tipo,
            parcelaId: actividad.parcelaId,
            sectorId: actividad.sectorId || '',
            fechaInicio: actividad.fechaInicio.split('T')[0],
            horaInicio: (() => {
              const d = new Date(actividad.fechaInicio);
              return !isNaN(d.getTime())
                ? `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
                : '07:00';
            })(),
            fechaFin: actividad.fechaFin ? actividad.fechaFin.split('T')[0] : '',
            horaFin: (() => {
              if (!actividad.fechaFin) return '12:00';
              const d = new Date(actividad.fechaFin);
              return !isNaN(d.getTime())
                ? `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
                : '12:00';
            })(),
            duracionHoras: 5,
            usuarioResponsableId: actividad.usuarioResponsableId || '',
            descripcion: actividad.descripcion || '',
            observaciones: actividad.observaciones || '',
            estado: actividad.estado,
            trabajadores: actividad.trabajadores.map((t) => ({
              usuarioId: t.usuarioId,
              rolEnActividad: t.rolEnActividad || undefined,
              horaInicio: t.horaInicio
                ? (() => {
                    const d = new Date(t.horaInicio);
                    return !isNaN(d.getTime())
                      ? `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
                      : undefined;
                  })()
                : undefined,
              horaFin: t.horaFin
                ? (() => {
                    const d = new Date(t.horaFin);
                    return !isNaN(d.getTime())
                      ? `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
                      : undefined;
                  })()
                : undefined,
              horasAsignadas: t.horasAsignadas ? Number(t.horasAsignadas) : undefined,
            })),
            recursos: actividad.recursos.map((r) => ({
              insumoId: r.insumoId,
              cantidadEstimada: r.cantidadEstimada,
              unidadMedida: r.unidadMedida,
              notas: r.notas || undefined,
            })),
          }}
          guardando={actualizarMutation.isPending}
          onSubmit={handleGuardar}
          onCancelar={handleCancelar}
        />
      </View>
    </AppLayout>
  );
};

const styles = StyleSheet.create({
  contenedor: { flex: 1 },
});
