import React from 'react';
import { Redirect } from 'expo-router';

/**
 * @description Redirección al escáner fitosanitario desde el alias singular '/diagnostico'.
 */
export default function DiagnosticoSingularScreen() {
  return <Redirect href="/diagnosticos/escaner" />;
}
