# Arquitectura del Sistema - Agro Vision Frontend

## 1. Visión General
* **Plataforma:** Aplicación multiplataforma (Android y Web) para gestión agronómica, monitoreo satelital/IoT y diagnóstico con visión computacional.
* **Framework:** Expo SDK 57 con React Native 0.86 y React 19.2.
* **Enrutador:** Expo Router (Enrutamiento unificado basado en archivos para móvil y navegador).
* **Patrón de Arquitectura:** Modular Screaming Architecture con separación de responsabilidades Container / Presentational.
* **Gestor de Paquetes:** `pnpm`.

---

## 2. Estructura de Directorios

```text
agro-vision-frontend/
├── app/                                  # Enrutador basado en archivos (Expo Router)
│   ├── (auth)/                           # Flujos de autenticación (públicos)
│   │   ├── iniciar-sesion.tsx            # Pantalla de login
│   │   ├── registro.tsx                  # Registro de usuario
│   │   └── _layout.tsx                   # Layout de autenticación
│   ├── (tabs)/                           # Navegación principal
│   │   ├── index.tsx                     # Dashboard agronómico general
│   │   ├── parcelas.tsx                  # Listado y mapa de parcelas
│   │   ├── diagnostico.tsx               # Escaneo con cámara y análisis IA
│   │   ├── monitoreo.tsx                 # Telemetría de sensores IoT
│   │   ├── perfil.tsx                    # Ficha de usuario y configuración
│   │   └── _layout.tsx                   # Bottom Tabs en Android / Sidebar en Web
│   ├── parcelas/                         # Rutas dedicadas de parcelas
│   │   ├── [id].tsx                      # Detalle completo de parcela y sectores
│   │   └── nuevo.tsx                     # Formulario de registro de parcela
│   ├── cultivos/                         # Rutas dedicadas de cultivos
│   │   ├── [id].tsx                      # Ficha de cultivo y fenología
│   │   └── nuevo.tsx                     # Registro de siembra
│   ├── _layout.tsx                       # Root Layout (QueryClientProvider, AuthProvider, ThemeProvider)
│   └── +not-found.tsx                    # Pantalla 404
├── src/
│   ├── features/                         # Módulos de negocio (Bounded Contexts)
│   │   └── <modulo>/                     # Ej: parcelas, cultivos, monitoreo, diagnosticos, autenticacion
│   │       ├── api/                      # Query Keys, Custom Hooks TanStack Query v5
│   │       ├── components/               # Componentes presentacionales (Cards, Badges, Skeletons, Listas)
│   │       ├── containers/               # Orquestadores de datos y lógica
│   │       ├── schemas/                  # Validaciones de formularios con Zod
│   │       ├── types/                    # Tipos TypeScript del dominio
│   │       └── index.ts                  # Barrel export
│   └── shared/                           # UI Kit y utilidades transversales
│       ├── components/
│       │   ├── ui/                       # Boton, Input, Card, Badge, Skeleton, ModalSheet
│       │   └── layout/                   # ScreenContainer, AppHeader, ResponsiveLayout
│       ├── api/                          # Cliente HTTP (Axios) con interceptores y refresh token
│       ├── theme/                        # Tokens de diseño, colores agronómicos, tipografía
│       └── hooks/                        # useResponsive, useNetworkStatus, useDebounce
```

---

## 3. Los 4 Cuadrantes de Gestión de Estado

| Cuadrante | Herramienta | Propósito en Agro Vision |
| :--- | :--- | :--- |
| **Server State** | TanStack Query v5 | Caché de parcelas, cultivos, lecturas de sensores, diagnósticos remotos e invalidación optimista. |
| **Form State** | React Hook Form + Zod | Formularios de siembra, registro de parcelas, umbrales de sensores con validación tipada. |
| **Global UI State** | Zustand v5 | Sesión de usuario activo, parcela seleccionada globalmente, preferencia de tema claro/oscuro. |
| **Local UI State** | `useState` / `useReducer` | Estado de modales, bottom sheets, filtros efímeros de búsqueda y acordeones. |

---

## 4. Patrones de Diseño Clave

1. **Separación Container / Presentational:**
   * **Containers (`containers/`):** Consumen los hooks de TanStack Query, manejan mutaciones, orquestan estados globales y pasan props limpias a la UI.
   * **Presentational (`components/`):** Componentes puros sin llamadas directas a APIs, altamente testeables y reutilizables en múltiples vistas.
2. **Páginas Dedicadas vs Modales:**
   * Las operaciones principales (crear parcela, registrar cultivo, ver diagnóstico detallado) ocurren en rutas completas (`/nuevo`, `/[id]`).
   * Los modales y bottom sheets se reservan para selecciones rápidas o confirmaciones.
3. **Adaptabilidad Multiplataforma (Android + Web):**
   * En **Android:** Navegación táctil inferior (Bottom Tabs), pull-to-refresh en listas, bottom sheets y soporte para cámara nativa.
   * En **Web:** Layouts responsivos con sidebar lateral, rejillas multi-columna (dashboard con métricas y mapa simultáneo) y soporte de teclado/mouse.
4. **Skeletons por Módulo:**
   * Toda lista o panel cuenta con su propio esqueleto visual que replica las dimensiones reales para una experiencia de usuario fluida y sin saltos visuales.

---

## 5. Tech Stack Frontend

| Capa / Módulo | Tecnología |
| :--- | :--- |
| **Framework Base** | Expo SDK 57 (React Native 0.86) |
| **Enrutamiento** | Expo Router |
| **Lenguaje** | TypeScript 6.0 (Modo Estricto) |
| **Gestión de Datos** | TanStack Query v5 |
| **Formularios** | React Hook Form + Zod |
| **Estado Global** | Zustand v5 |
| **Cliente HTTP** | Axios con Interceptores |
| **Iconografía** | Expo Symbols / Lucide React Native |
| **Gestor de Paquetes** | `pnpm` |