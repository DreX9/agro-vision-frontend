---
name: create-feature-module
description: "Trigger: nuevo módulo frontend, crear feature, nuevo bounded context frontend, agregar feature. Procedimiento para crear un módulo en src/features/ con Expo y React Native."
license: Apache-2.0
metadata:
  author: "agro-vision-team"
  version: "1.0"
---

# Procedimiento: Crear Módulo de Feature en Frontend

## Activation Contract
Activar al crear una nueva área funcional o módulo de negocio en `src/features/<modulo>/`.

## Reglas Inviolables
* **Límite de 300 líneas** por archivo.
* **Lenguaje Ubicuo en Español:** Nombres de módulos en español canónico (`parcelas`, `cultivos`, `monitoreo`, `diagnosticos`).
* Estructura modular estándar con `api/`, `components/`, `containers/`, `schemas/`, `types/` e `index.ts`.
* Toda lista de lectura debe contar con su componente Skeleton respectivo.

## Pasos de Ejecución
1. Crear la carpeta del módulo: `src/features/<modulo>/`.
2. Definir los tipos de dominio en `types/<modulo>.types.ts`.
3. Definir las claves y hooks de TanStack Query en `api/<modulo>.api.ts`.
4. Definir los esquemas de validación Zod en `schemas/<modulo>.schema.ts`.
5. Crear componentes presentacionales y su Skeleton en `components/`.
6. Crear el contenedor que orquesta los datos en `containers/<Modulo>Container.tsx`.
7. Crear la pantalla correspondiente en `app/` consumiendo el contenedor.
8. Exportar la interfaz pública en `src/features/<modulo>/index.ts`.