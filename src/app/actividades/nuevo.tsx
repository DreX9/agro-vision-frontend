import React from 'react';
import { Redirect } from 'expo-router';

/**
 * @description Ruta heredada que redirige al flujo oficial /actividades/nueva.
 */
export default function NuevoActividadAliasScreen() {
  return <Redirect href="/actividades/nueva" />;
}
