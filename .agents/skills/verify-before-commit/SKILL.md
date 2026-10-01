---
name: verify-before-commit
description: "Trigger: verificar frontend, pre-commit frontend, check types, lint frontend. Checklist de verificación de calidad para Agro Vision Frontend."
license: Apache-2.0
metadata:
  author: "agro-vision-team"
  version: "1.0"
---

# Checklist de Verificación de Calidad Frontend

## Pipeline de Validación
Ejecutar antes de finalizar tareas en el frontend:

```bash
# 1. Verificación de tipos TypeScript estricta
pnpm tsc --noEmit

# 2. Linter de Expo
pnpm run lint
```

## Checklist de Reglas de Gobierno
- [ ] **Límite de 300 líneas:** Ningún archivo supera 300 líneas.
- [ ] **Cero `any`:** Todos los tipos están debidamente tipados.
- [ ] **Mobile First:** La vista se renderiza correctamente en dispositivos móviles táctiles y escala a web.
- [ ] **Skeletons:** Hay esqueletos visuales para todos los estados de carga de lectura.
- [ ] **JSDoc:** Componentes y hooks documentados con bloques estructurados `/** ... */`.