---
name: naming-dictionary
description: "Trigger: naming frontend, nombres componentes, nomenclatura, español ubicuo frontend. Diccionario de convenciones de nombrado para Agro Vision Frontend."
license: Apache-2.0
metadata:
  author: "agro-vision-team"
  version: "1.0"
---

# Diccionario de Nomenclatura Frontend

## Reglas Inviolables
* **Lenguaje Ubicuo en Español:** Carpetas, archivos de features, componentes de negocio y rutas en español técnico.
* **Componentes:** PascalCase descriptivo (`ParcelaCard.tsx`, `CultivoHeader.tsx`, `DiagnosticoVisor.tsx`, `ParcelasSkeleton.tsx`).
* **Contenedores:** Sufijo `Container` (`ParcelasContainer.tsx`, `DetalleCultivoContainer.tsx`).
* **Hooks:** Prefijo `use` en camelCase (`useParcelasQuery`, `useRegistrarCultivoMutation`, `useDiagnosticoIA`).
* **Esquemas:** Sufijo `.schema.ts` (`parcela.schema.ts`, `cultivo.schema.ts`).
* **Tipos:** Sufijo `.types.ts` (`parcela.types.ts`, `sensores.types.ts`).