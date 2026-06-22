# Toca v2 - Prototipo Interactivo del Dashboard de Ventas

Este repositorio contiene la versión interactiva terminada del Dashboard de Inicio para **Toca v2**. Es un prototipo de alta fidelidad construido en HTML, CSS y JavaScript vainilla (sin dependencias ni frameworks) diseñado para servir de guía visual y funcional de cara al desarrollo en producción.
---

## 📖 Documentación de Flujos y Reglas de Negocio

Para asegurar la correcta implementación técnica de los flujos de la aplicación, consulta los siguientes manuales detallados:
- 📄 **[Manual de Flujo de Inicio (Dashboard)](docs/flujo_inicio.md):** Detalles sobre bandejas de pendientes (clasificadas por niveles de urgencia e inactividad), bandeja de espera con acordeón colapsable, y el flujo de los prospectos y clientes.
- 📄 **[Manual de Flujo de Clientes y Prospectos](docs/flujo_clientes_prospectos.md):** Detalles sobre el diseño de las tarjetas (insignias, barras de progreso de embudo) y la ficha lateral de contacto con su historial y configuraciones.

---

## 🚀 Guía de Inicio Rápido

Para visualizar e interactuar con el prototipo:
1. Clona este repositorio o descarga la carpeta.
2. Abre el archivo `index.html` directamente en cualquier navegador de tu preferencia.
3. Para una experiencia idónea que soporte la simulación de consultas externas (WhatsApp Web, copiado al portapapeles, etc.), se recomienda ejecutar un servidor local rápido. Por ejemplo:
   - Con Python: `python -m http.server 8000`
   - Con Node.js: `npx serve` o `npm install -g serve` seguido de `serve`

---

## 🎨 Especificaciones de Diseño y Estilos (UI/UX)

La interfaz se migró a un **Tema Claro (Light Mode)** premium que combina contrastes oscuros y acentos de marca:

### 1. Paleta de Colores
- **Fondo de la Aplicación:** `#F6F6F4` (Gris claro que unifica el fondo de la pantalla).
- **Tarjetas (Cards):** `#FFFFFF` (Blanco puro, bordes redondeados de `16px`, sombras difusas muy suaves).
- **Botones y Acentos Primarios:** `#FFCC06` (Amarillo Toca con textos en `#0A0A0A` para legibilidad).
- **Barra Lateral Izquierda (Sidebar):** `#0A0A0A` (Gris muy oscuro/negro). Las pestañas activas toman el acento `#FFCC06` con texto `#0A0A0A`.

### 2. Tipografías Usadas (Google Fonts)
- **Títulos y Cabeceras:** `Outfit` (sans-serif, pesos semibold/bold).
- **Textos de Cuerpo, Botones y Formularios:** `Inter` (sans-serif, pesos regular/medium/semibold).

---

## 🛠 Características Técnicas Clave de los Componentes

### 1. Dimensionamiento Uniforme y Truncamiento de Nombres (Tarjetas)
- **Estructura Vertical:** Las tarjetas diarias (`.minimal-card`) siguen una disposición en columnas de dos filas:
  - **Fila Superior:** Nombre completo a la izquierda (en negrita) y Nombre de Empresa debajo; etiqueta pill de tipo (`Cliente` o `Prospecto`) a la derecha.
  - **Fila Inferior:** Badge de urgencia/tiempo a la izquierda y botones de acción agrupados a la derecha.
- **Altura Fija Obligatoria:** Todas las tarjetas tienen una altura forzada de `136px` (`box-sizing: border-box`), lo que asegura una rejilla y cuadrícula perfectamente simétricas sin saltos por volumen de texto.
- **Prevención de Corte de Nombres:**
  - No se emplean saltos `<br>` arbitrarios.
  - Se configuró la clase `.minimal-card-name` y `.minimal-card-company` con:
    ```css
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    display: block;
    max-width: 100%;
    ```
    Junto a `min-width: 0` en el contenedor padre, esto asegura que nombres largos se mantengan en una sola línea y terminen con `...` en lugar de romper letras individuales verticalmente.

### 2. Filtros de Urgencia Semánticos (Imagen 2)
- Filtros con bordes eliminados y formas de píldoras redondeadas (`border-radius: 999px`) con fondos y textos suaves:
  - **urgentes:** Fondo `#FDE8E8`, texto `#9B1C1C` y dot `#E02424`.
  - **Atención:** Fondo `#FEF3C7`, texto `#92400E` y dot `#D97706`.
  - **Al día:** Fondo `#DEF7EC`, texto `#03543F` y dot `#059669`.
  - **Todos:** Fondo `#F3F4F6` con texto `#1F2937`.
- **Efecto de Atenuación de Inactivos:** Al hacer clic en un filtro de urgencia, los demás filtros inactivos reducen su opacidad a `0.45` (`opacity: 0.45`), destacando visualmente el grupo seleccionado de manera interactiva.

### 3. Botones de Acción Premium (Imagen 3)
- **Botón Sugerencias IA (`.btn-sug-ia`):** Botón amarillo píldora brillante (`#FFCC06`), texto `#0A0A0A` en negrita extra, bordes redondeados (`border-radius: 999px`), sin bordes, con el icono `✨` al inicio.
- **Botón Hecho (`.btn-hecho-check`):** Botón píldora blanco, borde gris claro (`1px solid #d1d5db`), texto `#0A0A0A` en negrita extra, bordes redondeados, con el texto exacto `Hecho ✓`.
- **Ausencia de Tuerca (`⚙️`):** Se eliminó el botón de engranaje de todas las tarjetas diarias y de espera para optimizar el espacio horizontal. Para abrir la ficha de detalles de cualquier contacto, el usuario hace clic directo en el enlace del nombre.

### 4. Ficha de Detalles Lateral (Slide Panel)
- **Ocupación de Pantalla Completa Sin Scroll General:** La ficha lateral (`.slide-panel`) ocupa el alto completo del viewport (`top: 0; bottom: 0;`), pero tiene bloqueado el scroll vertical en su cuerpo principal (`overflow-y: hidden`) mediante paddings muy compactos y layouts reducidos.
- **Línea de Tiempo con Scroll Interno:** El contenedor del historial de interacciones (`#detail-timeline`) es el único elemento que puede escrolear. Está limitado a un `max-height: 220px; overflow-y: auto;` para que la ficha en si permanezca estática y los botones principales de guardado estén siempre a la vista.
- **Regla del Negocio (Sin Reconversión):** Los clientes una vez ganados **no pueden volver a ser prospectos** (se removió el botón "Mover a Prospecto" y el JavaScript asociado). Los clientes se mantienen en el flujo recurrente o se archivan.
