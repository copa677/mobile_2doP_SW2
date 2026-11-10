# DESIGN.md — GymPulse Executive Design System

## Design Mode
- **Mode:** `Operate` (App UI / Executive Dashboard).
- **Tone:** Sofisticado, atlético pero corporativo, enfocado en legibilidad de datos, contraste impecable y velocidad de escaneo.
- **Anti-patterns prohibidos:** Gradientes púrpuras genéricos de IA, tipografías default no curadas, tablas interminables en pantalla móvil, gráficos sobrecargados sin etiquetas legibles.

## Color Palette (Dark Theme First, Light Theme Compatible)

### Backgrounds & Surfaces
- `bg-base`: `#0B0F17` (Negro carbón azulado profundo, no negro puro #000000 para evitar fatiga visual).
- `surface-elevated-1`: `#141C2B` (Tarjetas de métricas, contenedores de KPIs).
- `surface-elevated-2`: `#1D263B` (Bordes interactivos, inputs de búsqueda y filtros).
- `surface-glass`: `rgba(20, 28, 43, 0.75)` (Efectos de desenfoque de navegación y cabeceras).

### Accents & Semantic States
- `accent-primary`: `#22C55E` (Verde fitness enérgico / Crecimiento / KPIs positivos).
- `accent-secondary`: `#0EA5E9` (Azul cian eléctrico / Métricas operativas y clases).
- `accent-warning`: `#F59E0B` (Ámbar cálido / Socios en riesgo de abandono / Cuotas por vencer).
- `accent-danger`: `#EF4444` (Rojo coral / Churn / Caída drástica de ingresos).

### Typography Hierarchy
- `font-display`: Monospace o Sans-Serif condensada con tracking ajustado para números de KPIs (`700` o `800` weight).
- `font-body`: Sistema nativo (`SF Pro` en iOS, `Inter` / `Roboto` en Android), con excelente altura de línea (`1.4` a `1.5`).
- Tamaños estándar:
  - Hero KPI: `32px` - `36px` (`font-bold`)
  - Subtítulo / Encabezado de tarjeta: `16px` - `18px` (`font-semibold`)
  - Narrativa del SLM: `14px` - `15px` (`font-regular`, color `#E2E8F0`)
  - Metadatos / Etiquetas secundarias: `12px` (`font-medium`, color `#94A3B8`)

## Mobile Layout & Chart Guidelines
1. **Vertical Hierarchy:**
   - Barra superior: Estado del SLM (Indicador sutil: "Modelo Qwen local listo", selector de fecha rápida).
   - Zona Superior: Entrada de consulta o chips de reportes frecuentes (*"Resumen de hoy"*, *"Socios en riesgo"*, *"Finanzas del mes"*).
   - Zona Media: Tarjetas de resumen cuantitativo con mini-gráficos (`Sparklines`, Barras o Donas compactas).
   - Zona Inferior: Narrativa ejecutiva generada por el SLM, con bullets claros y llamadas a la acción sugeridas.
2. **Interactive States & Transitions:**
   - Cuando el SLM invoca una herramienta: Pulsación sutil y badge con el nombre de la acción (*"Consultando asistencia..."*).
   - Streaming: Efecto suave de aparición de texto token a token sin saltos abruptos de layout.
   - Fallback: Si el modelo no responde en 5 segundos, banner no intrusivo: *"Mostrando reporte estructurado directo"*.
