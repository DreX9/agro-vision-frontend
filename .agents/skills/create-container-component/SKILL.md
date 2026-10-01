---
name: create-container-component
description: "Trigger: crear contenedor, container component, orquestador frontend, container presentational. Guía para separar lógica de datos y componentes visuales en React Native / Expo."
license: Apache-2.0
metadata:
  author: "agro-vision-team"
  version: "1.0"
---

# Procedimiento: Crear Componente Contenedor

## Activation Contract
Activar cuando se diseñe una pantalla o sección que requiera consultar datos de la API, manejar formularios o mutaciones.

## Reglas Inviolables
* Los **Containers** se ubican en `src/features/<modulo>/containers/`.
* El contenedor consume los hooks de TanStack Query, Zustand o React Hook Form.
* El contenedor NO define estilos visuales complejos ni renderiza vistas extensas directamente; delega en componentes presentacionales de `components/`.
* Si los datos están cargando, el contenedor renderiza el componente Skeleton.

### Plantilla de Contenedor

```tsx
import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useParcelasQuery } from '../api/parcelas.api';
import { ParcelasLista } from '../components/ParcelasLista';
import { ParcelasSkeleton } from '../components/ParcelasSkeleton';

/**
 * @description Contenedor que orquesta la carga y renderizado de la lista de parcelas.
 */
export function ParcelasContainer() {
  const { data: parcelas, isLoading, isError, refetch } = useParcelasQuery();

  if (isLoading) {
    return <ParcelasSkeleton />;
  }

  return (
    <View style={styles.contenedor}>
      <ParcelasLista 
        parcelas={parcelas ?? []} 
        onRecargar={refetch} 
      />
    </View>
  );
}

const styles = StyleSheet.create({
  contenedor: {
    flex: 1,
  },
});
```