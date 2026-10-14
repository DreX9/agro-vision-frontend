import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { useRouter, type Href } from 'expo-router';
import { AppLayout } from '@/shared/components/layout/app-layout';
import { CultivoFormulario } from '../components/cultivo-formulario';
import { useCrearCultivoMutation } from '../api/cultivos.api';
import { CultivoFormValores } from '../schemas/cultivo.schema';
import { ModalConfirmacion, type DetalleConfirmacion } from '@/shared/components/ui';

/**
 * @description Contenedor orquestador para el registro de un nuevo cultivo en el catálogo del sistema.
 */
export const CrearCultivoContainer: React.FC = () => {
  const router = useRouter();
  const [valoresAConfirmar, setValoresAConfirmar] = useState<CultivoFormValores | null>(null);
  const [modalExitoVisible, setModalExitoVisible] = useState<boolean>(false);
  const [cultivoCreado, setCultivoCreado] = useState<string>('');

  const crearMutation = useCrearCultivoMutation();

  const handleSolicitarGuardar = (valores: CultivoFormValores) => {
    setValoresAConfirmar(valores);
  };

  const ejecutarCreacion = () => {
    if (!valoresAConfirmar) return;
    const valores = valoresAConfirmar;

    crearMutation.mutate(
      {
        nombre: valores.nombre,
        nombreCientifico: valores.nombreCientifico || undefined,
        variedadesDefault: valores.variedadesDefault,
        colorHex: valores.colorHex,
      },
      {
        onSuccess: (data) => {
          setCultivoCreado(data?.nombre || valores.nombre);
          setValoresAConfirmar(null);
          setModalExitoVisible(true);
        },
        onError: () => {
          setValoresAConfirmar(null);
        },
      },
    );
  };

  const handleCancelar = () => {
    router.back();
  };

  const detallesConfirmacion: DetalleConfirmacion[] = valoresAConfirmar
    ? [
        {
          etiqueta: 'Nombre Común',
          valor: valoresAConfirmar.nombre,
        },
        {
          etiqueta: 'Nombre Científico',
          valor: valoresAConfirmar.nombreCientifico || 'No especificado',
        },
        {
          etiqueta: 'Variedades Comerciales',
          valor:
            valoresAConfirmar.variedadesDefault && valoresAConfirmar.variedadesDefault.length > 0
              ? valoresAConfirmar.variedadesDefault.join(', ')
              : 'Ninguna',
        },
        {
          etiqueta: 'Color Representativo',
          valor: valoresAConfirmar.colorHex || '#546B41',
          colorIndicador: valoresAConfirmar.colorHex || '#546B41',
        },
      ]
    : [];

  return (
    <AppLayout
      titulo="Registrar Nuevo Cultivo"
      subtitulo="Ingrese los datos de la especie agrícola, variedades y color representativo"
    >
      <View style={styles.contenedor}>
        <CultivoFormulario
          modo="crear"
          guardando={crearMutation.isPending}
          onSubmit={handleSolicitarGuardar}
          onCancelar={handleCancelar}
        />
      </View>

      {/* Modal de Confirmación Previo al Registro */}
      <ModalConfirmacion
        visible={Boolean(valoresAConfirmar)}
        tipo="confirmacion"
        titulo="¿Registrar Nuevo Cultivo?"
        mensaje="Verifique los datos de la especie vegetal antes de incorporarla al catálogo general."
        detalles={detallesConfirmacion}
        textoConfirmar="Registrar Cultivo"
        textoCancelar="Volver"
        cargando={crearMutation.isPending}
        onConfirmar={ejecutarCreacion}
        onCancelar={() => setValoresAConfirmar(null)}
      />

      {/* Modal Informativo de Éxito */}
      <ModalConfirmacion
        visible={modalExitoVisible}
        tipo="exito"
        titulo="¡Cultivo Registrado con Éxito!"
        mensaje={`El cultivo "${cultivoCreado}" ha sido dado de alta exitosamente en el catálogo agrícola.`}
        textoConfirmar="Ir al Catálogo"
        onConfirmar={() => {
          setModalExitoVisible(false);
          router.replace('/cultivos' as Href);
        }}
      />
    </AppLayout>
  );
};

const styles = StyleSheet.create({
  contenedor: { flex: 1, paddingBottom: 24 },
});
