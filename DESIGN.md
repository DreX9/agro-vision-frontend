# Sistema de Diseño — Agro Vision Frontend

## 1. Filosofía Visual
Agro Vision combina la precisión tecnológica de la visión computacional y la telemetría IoT con la calidez y naturaleza del sector agronómico. La interfaz debe transmitir confiabilidad, modernidad, alta legibilidad bajo luz solar en campo (móvil) y profundidad analítica en oficina (web).

---

## 2. Paleta de Colores Institucional

### Modo Claro (Predeterminado para Campo y Gestión)
* **Verde Bosque / Identidad y Navegación (`#546B41`):** Color principal. Se utiliza en el sidebar, encabezados importantes, botones primarios y elementos de navegación activos.
* **Verde Salvia / Agricultura y Positivo (`#99AD7A`):** Color secundario. Aplicado en tarjetas, estados positivos, indicadores de cultivo saludable y elementos destacados.
* **Beige Tierra / Acento Agronómico (`#DCCCAC`):** Color de acento moderado. Empleado en tarjetas especiales, separadores, etiquetas de suelo y detalles sutiles de agricultura.
* **Crema / Fondo General (`#FFF8EC`):** Fondo general de las páginas, aportando calidez, naturalidad y reduciendo la fatiga visual bajo iluminación solar.
* **Blanco / Superficies y Tarjetas (`#FFFFFF`):** Usado en cards, formularios, tablas y contenedores elevados para lograr un contraste nítido sobre el fondo crema.
* **Bordes y Divisores (`#D9DDCF`):** Líneas delimitadoras sutiles y bordes de componentes.
* **Texto Principal (`#111827`):** Negro óptico de máxima nitidez, contraste y legibilidad.
* **Texto Secundario / Muted (`#4B5563`):** Gris oscuro para subtítulos, metadatos y etiquetas secundarias.

### Estados Semánticos
* **Éxito (Success):** `#4F8A3D` (Parámetros óptimos, cosechas registradas, operaciones exitosas).
* **Alerta (Warning):** `#D89B2B` (Estrés hídrico leve, umbrales de advertencia, recordatorios).
* **Peligro (Error):** `#C94C4C` (Detección de plagas, anomalías críticas, errores de validación).
* **Informativo (Info):** `#4A7FA5` (Telemetría de sensores, sincronizaciones, notas técnicas).

### Modo Oscuro (Estaciones de Monitoreo)
* **Fondo Profundo:** `#161F12` (Verde noche profundo).
* **Superficie de Tarjetas:** `#222D1D` con bordes `#33422C`.
* **Verde Identidad / Primario:** `#7A9663`.
* **Verde Salvia / Secundario:** `#99AD7A`.
* **Texto Principal:** `#F9FAF8`.
* **Texto Secundario:** `#9CA3AF`.

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