# Sistema de Diseño — Agro Vision Frontend

## 1. Filosofía Visual
Agro Vision combina la precisión tecnológica de la visión computacional y la telemetría IoT con la calidez y naturaleza del sector agronómico. La interfaz debe transmitir confiabilidad, modernidad, alta legibilidad bajo luz solar en campo (móvil) y profundidad analítica en oficina (web).

---

## 2. Paleta de Colores Institucional

### Modo Claro (Predeterminado para Campo)
* **Verde Bosque / Primario:** `#1B4332` (Encabezados, identidad, acciones principales).
* **Verde Hoja / Interactivo:** `#2D6A4F` (Botones de acción, enlaces activos, pestañas seleccionadas).
* **Verde Acento / Saludable:** `#52B788` (Indicadores de cultivo óptimo, badges de éxito, crecimiento).
* **Amarillo Solar / Alerta:** `#E9C46A` (Advertencias de estrés hídrico, umbrales de humedad bajos).
* **Rojo Plaga / Peligro:** `#E76F51` (Detección de enfermedades críticas, alertas fitosanitarias).
* **Fondo Neutro Claro:** `#F8FAF8` (Fondo de pantalla general para máximo contraste y legibilidad).
* **Superficie de Tarjetas:** `#FFFFFF` con bordes suaves `#E2E8F0` y sombras difuminadas.
* **Texto Principal:** `#1E293B` (Gris oscuro de alta legibilidad).
* **Texto Secundario:** `#64748B` (Subtítulos, fechas, etiquetas auxiliares).

### Modo Oscuro (Análisis y Estaciones de Monitoreo)
* **Fondo Profundo:** `#0B1E13` (Verde noche ultra-oscuro).
* **Superficie de Tarjetas:** `#132E20` con bordes `#1C3B2B`.
* **Acentos Luminosos:** `#74C69D` y `#81C784`.
* **Texto Principal:** `#F1F5F9`.
* **Texto Secundario:** `#94A3B8`.

---

## 3. Tipografía y Jerarquía

* **Familia Tipográfica:** Sans-Serif moderna y legible (`Inter`, `Roboto` o `System`).
* **Pesos y Usos Estándar:**
  * `Bold (700)`: Títulos principales de sección, nombres de parcelas y diagnósticos críticos.
  * `Semibold (600)`: Encabezados de tarjetas, métricas clave (ej. `24.5 °C`, `78% Humedad`), botones.
  * `Medium (500)`: Etiquetas de campos (labels), nombres de columnas y pestañas.
  * `Regular (400)`: Descripciones, notas técnicas y cuerpo general de texto.

---

## 4. Adaptabilidad Multiplataforma (Android vs Web)

### En Dispositivos Móviles (Android):
* **Navegación:** **Bottom Tabs** inferior fija con iconos descriptivos y etiquetas legibles.
* **Interacciones Táctiles:** Áreas de toque mínimas de `44x44 dp`, soporte para gestos (*pull-to-refresh* para recargar datos y *swipe* en tarjetas).
* **Modales y Acciones:** Uso de **Bottom Sheets** deslizantes desde la parte inferior para filtros y confirmaciones rápidas.
* **Cámara:** Visor a pantalla completa con guías de encuadre para hojas y cultivos.

### En Pantallas Amplias (Web / Tablet):
* **Navegación:** **Sidebar** lateral colapsable con accesos directos a todos los módulos.
* **Layouts de Dos Columnas:** Visualización simultánea del listado de parcelas y el panel de detalle con mapa interactivo y gráficos de telemetría.
* **Tablas y Rejillas:** Tablas de datos con ordenamiento rápido y tarjetas de métricas en cuadrícula responsive (`1 col` móvil -> `2 cols` tablet -> `4 cols` desktop).

---

## 5. Estados de Carga y Micro-interacciones

1. **Skeletons Screens (Obligatorios):**
   * Toda vista de lectura (`ParcelasSkeleton`, `CultivosSkeleton`, `MonitoreoCardsSkeleton`) debe mostrar bloques con animación suave de pulso mientras los datos cargan.
   * **Prohibido:** Spinners de pantalla completa que oculten el layout base.
2. **Botones con Estado de Carga:**
   * Al ejecutar una mutación (guardar parcela, iniciar análisis de imagen), el botón deshabilita la interacción y muestra un indicador de carga interno sin mover el layout.
3. **Badges de Estado:**
   * Cada estado agronómico (`Óptimo`, `Atención`, `Crítico`, `En Cosecha`, `Inactivo`) cuenta con un badge visual con color de fondo suave y texto en contraste.