# Toca v2 - Prototipo Interactivo del Dashboard de Ventas

Este repositorio contiene la versión interactiva terminada del Dashboard de Inicio para **Toca v2**. Es un prototipo de alta fidelidad construido en HTML, CSS y JavaScript vainilla (sin dependencias ni frameworks) diseñado para servir de guía visual y funcional de cara al desarrollo en producción.
---

## 📂 Estructura del Proyecto

El proyecto está organizado de manera modular siguiendo las buenas prácticas de desarrollo web, separando la estructura, estilos y lógica en archivos independientes:
- 📁 **`css/`**: Contiene los estilos de la aplicación.
  - 📄 **[styles.css](file:///C:/Users/perro/.gemini/antigravity/scratch/toca-dashboard/css/styles.css)**: Sistema de diseño completo, variables, fuentes, resets, componentes CSS y animaciones.
- 📁 **`js/`**: Contiene la lógica del prototipo.
  - 📄 **[app.js](file:///C:/Users/perro/.gemini/antigravity/scratch/toca-dashboard/js/app.js)**: Base de datos semilla, controladores de eventos, lógica de renderizado, atajos de teclado y sugerencias con IA.
- 📄 **[index.html](file:///C:/Users/perro/.gemini/antigravity/scratch/toca-dashboard/index.html)**: Estructura markup principal que vincula el CSS y JS externos.

---

## 📖 Documentación de Flujos y Reglas de Negocio

Para asegurar la correcta implementación técnica de los flujos de la aplicación, consulta los siguientes manuales detallados:
- 📄 **[Manual de Flujo de Inicio (Dashboard)](docs/flujo_inicio.md):** Detalles sobre bandejas de pendientes (clasificadas por niveles de urgencia e inactividad), bandeja de espera con acordeón colapsable, y el flujo de los prospectos y clientes.
- 📄 **[Manual de Flujo de Clientes y Prospectos](docs/flujo_clientes_prospectos.md):** Detalles sobre el diseño de las tarjetas (insignias, barras de progreso de embudo) y la ficha lateral de contacto con su historial y configuraciones.
- 📄 **[Manual de Arquitectura de Conexiones](docs/flujo_conexiones.md):** Detalles sobre cómo se conectan y sincronizan en tiempo real las pestañas de Clientes y Prospectos con el tablero operativo de Inicio.

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
- **Cierre Rápido con Teclado (Esc):** Presionar la tecla `Escape` (`Esc`) cierra automáticamente el panel lateral abierto, así como el modal de "Nuevo Contacto" si estuviera visible.
- **Acciones y Modo de Solo Lectura para Contactos Archivados:** Si la ficha lateral se abre para un contacto con `archived: true`:
  - Se muestra un banner informativo indicando que el contacto está archivado y su seguimiento pausado. Para **Clientes**, se incluye la fecha de baja (`Dado de baja el: DD MMM.`).
  - Se eliminan del encabezado y de las tarjetas todas las etiquetas de urgencia (`Urgente`, `Atención`, `1 DÍA`, etc.), fechas de próximo toque (`Próximo: ...`) e indicadores de frecuencia de ciclo, ya que el contacto está inactivo.
  - Todos los campos de datos básicos (Nombre, WhatsApp, Empresa) se bloquean en modo lectura (`disabled`).
  - Se oculta la sección de configuración de próximo toque/frecuencia de seguimiento y el botón de guardar.
  - Se oculta el botón para agregar nuevo contexto en la línea de tiempo, pero se mantiene visible el historial cronológico acumulado hasta su baja.
  - En la cabecera y el pie de la columna derecha se muestran únicamente los botones de `Restaurar` (reactivación) y `Eliminar` (borrado permanente con confirmación).

### 5. Estructura de Tarjetas y Buscadores en Clientes y Prospectos (Pestañas Secundarias)
Para estas pestañas, las reglas de tarjetas y buscadores se modificaron para actuar como base de datos histórica:
- **Interactividad Completa (Clickable Card):** Toda la tarjeta `.minimal-card` es clickable (`onclick="openContactDetailPanel(id)"`). Los botones internos (como el de WhatsApp) usan `event.stopPropagation()` para evitar abrir el detalle accidentalmente.
- **Sin barra vertical izquierda:** Se elimina la barra de urgencia vertical izquierda en estas tarjetas, ya que cada una cuenta con etiquetas semánticas explícitas de estado.
- **Buscador en Tiempo Real (Discreto):** Se añade un campo de texto discreto (`.search-input-discrete`) de `220px` de ancho en la parte superior derecha que filtra la lista al instante.
- **Dimensionamiento de Tarjetas de Clientes:** Altura fija de `136px`, distribuida en dos columnas: la izquierda contiene el Nombre/Empresa arriba y los badges apilados de WhatsApp y próximo contacto abajo; la derecha contiene la etiqueta `CLIENTE` arriba, el badge de frecuencia de ciclo abajo de esta, y la píldora de vigencia e urgencia (`⚠️ 1D RETRASO` o `⏱ HOY`) en la esquina inferior derecha. Posee iconos vectoriales SVG en lugar de emojis en los badges. *Si el cliente está archivado, se ocultan el badge de ciclo, la fecha de próximo contacto y la píldora de urgencia.*
- **Dimensionamiento de Tarjetas de Prospectos:** Altura fija de `168px`, distribuida en filas secuenciales: Nombre/Empresa y etiqueta `PROSPECTO` en la cabecera, una franja gris horizontal de contexto a todo lo ancho en el centro, y una fila inferior que contiene los badges inline de WhatsApp y próximo contacto al lado de la píldora de urgencia/vigencia (ej. `⏱ HOY`) abajo a la izquierda. Se elimina la barra lineal de progreso del embudo de la tarjeta para mayor limpieza. *Si el prospecto está archivado, se ocultan la fecha de próximo contacto y la píldora de urgencia.*
- **Píldora de Archivados:** En ambas pestañas se añade la píldora de filtro `📁 Archivados` para acceder a los contactos marcados con `archived: true`.

