import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { useRouter, type Href } from 'expo-router';
import axios from 'axios';
import { AppLayout } from '@/shared/components/layout/app-layout';
import { ParcelaFormulario, mostrarAlerta } from '../components/parcela-formulario';
import { useCultivosQuery } from '@/features/cultivos/api/cultivos.api';
import { useParcelaPorIdQuery, useActualizarParcelaMutation, useParcelasQuery } from '../api/parcelas.api';
import { ParcelaFormValores } from '../schemas/parcela.schema';
import { ParcelasSkeleton } from '../components/parcelas-skeleton';
import { type CoordenadaPunto } from '@/shared/utils/geometria';
import { ModalConfirmacion, type DetalleConfirmacion } from '@/shared/components/ui';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export interface EditarParcelaContainerProps {
  id: string;
}

/**
 * @description Contenedor orquestador para la edición de parcelas existentes y ajuste de perímetro.
 */
export const EditarParcelaContainer: React.FC<EditarParcelaContainerProps> = ({ id }) => {
  const router = useRouter();
  const [errorMensaje, setErrorMensaje] = useState<string | null>(null);
  const [valoresAConfirmar, setValoresAConfirmar] = useState<ParcelaFormValores | null>(null);
  const [modalExitoVisible, setModalExitoVisible] = useState<boolean>(false);

  const { data: parcela, isLoading: cargandoParcela } = useParcelaPorIdQuery(id);
  const { data: cultivos = [], isLoading: cargandoCultivos } = useCultivosQuery();
  const { data: respuestaParcelas } = useParcelasQuery({ limite: 100 });
  const parcelasExistentes = respuestaParcelas?.items || [];
  const actualizarMutation = useActualizarParcelaMutation();

  const handleSolicitarGuardar = (valores: ParcelaFormValores) => {
    setErrorMensaje(null);
    setValoresAConfirmar(valores);
  };

  const ejecutarActualizacion = () => {
    if (!valoresAConfirmar) return;

    const valores = valoresAConfirmar;
    const cultivoIdValido =
      valores.cultivoId && UUID_REGEX.test(valores.cultivoId)
        ? valores.cultivoId
        : undefined;

    const responsableIdValido =
      valores.usuarioResponsableId && UUID_REGEX.test(valores.usuarioResponsableId)
        ? valores.usuarioResponsableId
        : undefined;

    actualizarMutation.mutate(
      {
        id,
        datos: {
          nombre: valores.nombre.trim(),
          areaHectareas: valores.areaHectareas,
          colorHex: valores.colorHex,
          cultivoId: cultivoIdValido,
          variedad: valores.variedad?.trim() || undefined,
          usuarioResponsableId: responsableIdValido,
          ubicacion: valores.ubicacion?.trim() || undefined,
          departamento: valores.departamento?.trim() || undefined,
          provincia: valores.provincia?.trim() || undefined,
          distrito: valores.distrito?.trim() || undefined,
          estado: valores.estado,
          delimitacionGeoJson: valores.delimitacionGeoJson,
          latitudCentro: valores.latitudCentro ?? undefined,
          longitudCentro: valores.longitudCentro ?? undefined,
        },
      },
      {
        onSuccess: () => {
          setValoresAConfirmar(null);
          setModalExitoVisible(true);
        },
        onError: (error: unknown) => {
          setValoresAConfirmar(null);
          let mensaje = 'No se pudo actualizar la parcela. Intente nuevamente.';
          if (axios.isAxiosError(error) && error.response?.data?.message) {
            const dataMsg = error.response.data.message;
            mensaje = Array.isArray(dataMsg) ? dataMsg.join('\n') : String(dataMsg);
          } else if (error instanceof Error) {
            mensaje = error.message;
          }
          setErrorMensaje(mensaje);
          mostrarAlerta('Error al actualizar parcela', mensaje);
        },
      },
    );
  };

  const handleCancelar = () => {
    router.back();
  };

  if (cargandoParcela || cargandoCultivos) {
    return (
      <AppLayout titulo="Editar Parcela" subtitulo="Cargando información del lote...">
        <ParcelasSkeleton />
      </AppLayout>
    );
  }

  if (!parcela) {
    return (
      <AppLayout titulo="Parcela No Encontrada" subtitulo="El lote solicitado no existe o fue eliminado.">
        <View />
      </AppLayout>
    );
  }

  const puntosExistentes: CoordenadaPunto[] = Array.isArray(parcela.delimitacionGeoJson)
    ? (parcela.delimitacionGeoJson as CoordenadaPunto[])
    : [];

  const cultivoSeleccionado = cultivos.find((c) => c.id === valoresAConfirmar?.cultivoId);

  const detallesConfirmacion: DetalleConfirmacion[] = valoresAConfirmar
    ? [
        {
          etiqueta: 'Código de Parcela',
          valor: parcela.codigo,
        },
        {
          etiqueta: 'Nombre',
          valor: valoresAConfirmar.nombre,
        },
        {
          etiqueta: 'Superficie Calculada',
          valor: `${Number(valoresAConfirmar.areaHectareas).toFixed(2)} ha`,
        },
        {
          etiqueta: 'Color Distintivo',
          valor: valoresAConfirmar.colorHex || parcela.colorHex || '#15803D',
          colorIndicador: valoresAConfirmar.colorHex || parcela.colorHex || '#15803D',
        },
        {
          etiqueta: 'Cultivo',
          valor: cultivoSeleccionado ? cultivoSeleccionado.nombre : 'Sin cultivo asignado',
        },
      ]
    : [];

  return (
    <AppLayout
      titulo={`Editar Parcela: ${parcela.codigo} - ${parcela.nombre}`}
      subtitulo="Modifique el perímetro, cultivo o datos agronómicos del lote"
    >
      <View style={styles.contenedor}>
        <ParcelaFormulario
          cultivos={cultivos}
          parcelasExistentes={parcelasExistentes}
          idParcelaActual={id}
          modo="editar"
          valoresIniciales={{
            codigo: parcela.codigo,
            nombre: parcela.nombre,
            areaHectareas: Number(parcela.areaHectareas),
            cultivoId: parcela.cultivoId || undefined,
            colorHex: parcela.colorHex || undefined,
            variedad: parcela.variedad || '',
            ubicacion: parcela.ubicacion || '',
            departamento: parcela.departamento || '',
            provincia: parcela.provincia || '',
            distrito: parcela.distrito || '',
            estado: parcela.estado,
            delimitacionGeoJson: parcela.delimitacionGeoJson,
            latitudCentro: parcela.latitudCentro,
            longitudCentro: parcela.longitudCentro,
          }}
          puntosIniciales={puntosExistentes}
          guardando={actualizarMutation.isPending}
          errorMensaje={errorMensaje}
          onSubmit={handleSolicitarGuardar}
          onCancelar={handleCancelar}
        />
      </View>

      {/* Modal de Confirmación Previo a Guardar */}
      <ModalConfirmacion
        visible={Boolean(valoresAConfirmar)}
        tipo="confirmacion"
        titulo="¿Guardar Cambios en la Parcela?"
        mensaje={`Se actualizarán los datos agronómicos y el perímetro espacial de la parcela "${parcela.codigo}".`}
        detalles={detallesConfirmacion}
        textoConfirmar="Guardar Cambios"
        textoCancelar="Continuar Editando"
        cargando={actualizarMutation.isPending}
        onConfirmar={ejecutarActualizacion}
        onCancelar={() => setValoresAConfirmar(null)}
      />

      {/* Modal Informativo de Éxito */}
      <ModalConfirmacion
        visible={modalExitoVisible}
        tipo="exito"
        titulo="¡Parcela Actualizada con Éxito!"
        mensaje={`Las modificaciones en la parcela "${parcela.codigo} - ${parcela.nombre}" han sido guardadas satisfactoriamente.`}
        textoConfirmar="Ir al Listado de Parcelas"
        onConfirmar={() => {
          setModalExitoVisible(false);
          router.replace('/parcelas' as Href);
        }}
      />
    </AppLayout>
  );
};

const styles = StyleSheet.create({
  contenedor: { flex: 1, paddingBottom: 30 },
});
