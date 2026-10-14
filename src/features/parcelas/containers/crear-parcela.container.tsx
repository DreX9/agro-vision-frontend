import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { useRouter, type Href } from 'expo-router';
import axios from 'axios';
import { AppLayout } from '@/shared/components/layout/app-layout';
import { ParcelaFormulario, mostrarAlerta } from '../components/parcela-formulario';
import { useCultivosQuery } from '@/features/cultivos/api/cultivos.api';
import { useCrearParcelaMutation, useParcelasQuery } from '../api/parcelas.api';
import { useAuthStore } from '@/features/autenticacion';
import { ParcelaFormValores } from '../schemas/parcela.schema';
import { ParcelasSkeleton } from '../components/parcelas-skeleton';
import { ModalConfirmacion, type DetalleConfirmacion } from '@/shared/components/ui';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * @description Contenedor orquestador para el registro de una nueva parcela con delimitación satelital.
 */
export const CrearParcelaContainer: React.FC = () => {
  const router = useRouter();
  const usuarioActual = useAuthStore((s) => s.usuario);
  const [errorMensaje, setErrorMensaje] = useState<string | null>(null);
  const [valoresAConfirmar, setValoresAConfirmar] = useState<ParcelaFormValores | null>(null);
  const [modalExitoVisible, setModalExitoVisible] = useState<boolean>(false);
  const [resumenCreado, setResumenCreado] = useState<{ codigo?: string; nombre: string } | null>(null);

  const { data: cultivos = [], isLoading: cargandoCultivos } = useCultivosQuery();
  const { data: respuestaParcelas, isLoading: cargandoParcelas } = useParcelasQuery({ limite: 100 });
  const parcelasExistentes = respuestaParcelas?.items || [];
  const crearMutation = useCrearParcelaMutation();

  const handleSolicitarGuardar = (valores: ParcelaFormValores) => {
    setErrorMensaje(null);
    setValoresAConfirmar(valores);
  };

  const ejecutarCreacion = () => {
    if (!valoresAConfirmar) return;

    const valores = valoresAConfirmar;
    const usuarioIdValido =
      usuarioActual?.id && UUID_REGEX.test(usuarioActual.id)
        ? usuarioActual.id
        : undefined;

    const cultivoIdValido =
      valores.cultivoId && UUID_REGEX.test(valores.cultivoId)
        ? valores.cultivoId
        : undefined;

    crearMutation.mutate(
      {
        codigo: valores.codigo?.trim() || undefined,
        nombre: valores.nombre.trim(),
        areaHectareas: valores.areaHectareas,
        colorHex: valores.colorHex,
        cultivoId: cultivoIdValido,
        variedad: valores.variedad?.trim() || undefined,
        usuarioResponsableId:
          valores.usuarioResponsableId && UUID_REGEX.test(valores.usuarioResponsableId)
            ? valores.usuarioResponsableId
            : usuarioIdValido,
        ubicacion: valores.ubicacion?.trim() || undefined,
        departamento: valores.departamento?.trim() || undefined,
        provincia: valores.provincia?.trim() || undefined,
        distrito: valores.distrito?.trim() || undefined,
        estado: valores.estado,
        delimitacionGeoJson: valores.delimitacionGeoJson,
        latitudCentro: valores.latitudCentro ?? undefined,
        longitudCentro: valores.longitudCentro ?? undefined,
      },
      {
        onSuccess: (data) => {
          const cod = data?.codigo || valores.codigo;
          const nom = data?.nombre || valores.nombre;
          setValoresAConfirmar(null);
          setResumenCreado({ codigo: cod, nombre: nom });
          setModalExitoVisible(true);
        },
        onError: (error: unknown) => {
          setValoresAConfirmar(null);
          let mensaje = 'No se pudo registrar la parcela. Intente nuevamente.';
          if (axios.isAxiosError(error) && error.response?.data?.message) {
            const dataMsg = error.response.data.message;
            mensaje = Array.isArray(dataMsg) ? dataMsg.join('\n') : String(dataMsg);
          } else if (error instanceof Error) {
            mensaje = error.message;
          }
          setErrorMensaje(mensaje);
          mostrarAlerta('Error al registrar parcela', mensaje);
        },
      },
    );
  };

  const handleCancelar = () => {
    router.back();
  };

  const estaCargando = cargandoCultivos || cargandoParcelas;

  const cultivoSeleccionado = cultivos.find((c) => c.id === valoresAConfirmar?.cultivoId);

  const detallesConfirmacion: DetalleConfirmacion[] = valoresAConfirmar
    ? [
        {
          etiqueta: 'Código del Lote',
          valor: valoresAConfirmar.codigo || 'Autogenerado correlativo',
        },
        {
          etiqueta: 'Nombre de Parcela',
          valor: valoresAConfirmar.nombre,
        },
        {
          etiqueta: 'Superficie Calculada',
          valor: `${Number(valoresAConfirmar.areaHectareas).toFixed(2)} ha`,
        },
        {
          etiqueta: 'Color Distintivo',
          valor: valoresAConfirmar.colorHex || '#15803D',
          colorIndicador: valoresAConfirmar.colorHex || '#15803D',
        },
        {
          etiqueta: 'Cultivo Asignado',
          valor: cultivoSeleccionado ? cultivoSeleccionado.nombre : 'Por asignar posteriormente',
        },
        ...(valoresAConfirmar.distrito || valoresAConfirmar.departamento
          ? [
              {
                etiqueta: 'Ubicación',
                valor: [valoresAConfirmar.distrito, valoresAConfirmar.departamento]
                  .filter(Boolean)
                  .join(', '),
              },
            ]
          : []),
      ]
    : [];

  return (
    <AppLayout
      titulo="Registrar Nueva Parcela"
      subtitulo="Dibuje el perímetro en el mapa satelital para registrar el área y asignarle un identificador único"
    >
      {estaCargando ? (
        <ParcelasSkeleton />
      ) : (
        <View style={styles.contenedor}>
          <ParcelaFormulario
            cultivos={cultivos}
            parcelasExistentes={parcelasExistentes}
            modo="crear"
            guardando={crearMutation.isPending}
            errorMensaje={errorMensaje}
            onSubmit={handleSolicitarGuardar}
            onCancelar={handleCancelar}
          />
        </View>
      )}

      {/* Modal de Confirmación Previo al Registro */}
      <ModalConfirmacion
        visible={Boolean(valoresAConfirmar)}
        tipo="confirmacion"
        titulo="¿Confirmar Registro de Parcela?"
        mensaje="Por favor verifique las especificaciones agronómicas y la delimitación perimetral antes de guardar la parcela."
        detalles={detallesConfirmacion}
        textoConfirmar="Confirmar y Registrar"
        textoCancelar="Volver a Revisar"
        cargando={crearMutation.isPending}
        onConfirmar={ejecutarCreacion}
        onCancelar={() => setValoresAConfirmar(null)}
      />

      {/* Modal Informativo de Éxito */}
      <ModalConfirmacion
        visible={modalExitoVisible}
        tipo="exito"
        titulo="¡Parcela Registrada con Éxito!"
        mensaje={`La parcela "${resumenCreado?.nombre}" ${
          resumenCreado?.codigo ? `(${resumenCreado.codigo})` : ''
        } ha sido delimitada y guardada satisfactoriamente en el sistema.`}
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
