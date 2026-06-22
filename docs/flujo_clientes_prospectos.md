# Manual de Flujo Funcional: Secciones Clientes y Prospectos (Modelo Refinado)

Este documento detalla el funcionamiento lógico y conceptual de las secciones de **Clientes** y **Prospectos** en **Toca v2**, rediseñados para maximizar la legibilidad y cumplir con los criterios de experiencia de usuario basados en la ficha de interacción histórica.

---

## 1. Diseño Simplificado de Tarjetas (Listado)
Para evitar el exceso de texto en pantalla y hacer la interfaz lo más intuitiva posible, se eliminaron las etiquetas textuales repetitivas (como "WhatsApp:", "Seguimiento:") y se reemplazaron por un sistema de insignias (badges) de lectura rápida:

- **Tarjeta de Cliente 👥**:
  - Muestra el nombre y la empresa del contacto.
  - Incorpora una etiqueta de vigencia rápida (`⏱ PENDIENTE HOY` en rojo o `📅 AL DÍA` en verde).
  - Muestra un grupo de insignias compactas con: el número de WhatsApp, la frecuencia de contacto (ej. `⏱ 28 días` o `Fecha Fija`), y la fecha abreviada del próximo toque (ej. `📅 21/06`).
  - Ofrece acciones para abrir chat directo de WhatsApp o gestionar su ficha.
- **Tarjeta de Prospecto 👤**:
  - Muestra el nombre y la empresa.
  - Incorpora una etiqueta de estado (`⚠️ RETRASADO` en rojo o `⏱ EN PROCESO` en amarillo).
  - Incorpora una **Barra de Progreso Visual** del embudo que marca los pasos (`Paso 1: Contacto Inicial`, `Paso 2: Seguimiento`, `Paso 3: Cierre`) de forma lineal.
  - Muestra insignias con el número de WhatsApp y la fecha abreviada del próximo toque.
  - Muestra el último contexto de interés en una franja discreta en la base de la tarjeta.

---

## 2. Nueva Ficha de Contacto (Detalles en Panel Deslizable)

Al hacer clic en el nombre de cualquier contacto, se despliega un panel deslizable de ancho completo estructurado en un formato de panel de control (Dashboard) compuesto por tres bloques lógicos principales:

### A. Tarjeta de Encabezado (Header Card)
Contiene la información de presentación inmediata del contacto:
- Avatar con iniciales, nombre completo y empresa.
- Tres insignias de estado:
  1. *Urgencia*: Estado de contacto (`• Urgente`, `• Atención` o `• Al día`).
  2. *Tiempo*: Ciclo de días restante o frecuencia configurada.
  3. *Interacciones*: Contador de interacciones registradas en el historial.
- **Botón de Acción Directa**:
  - En prospectos: `🏁 Cerrar lead` (inicia el paso a cliente).
  - En clientes: `🗑️ Archivar` (mueve a la papelera con undo de 9 segundos).

### B. Bloque Izquierdo: Historial de la Relación (Timeline)
Muestra un registro cronológico de todas las interacciones ocurridas con el contacto:
- **Línea de Tiempo**: Conectores verticales y viñetas que asocian fechas (ej. `22 MAY.`) con la descripción de lo sucedido (ej. *"Se le envió lista de precios mayorista"*).
- **Añadir Contexto**: Un botón destacado (`+ Añadir contexto`) que abre un formulario de texto rápido dentro de la misma tarjeta. Al escribir una nota y guardar:
  - El evento se inserta de inmediato en la parte superior del historial.
  - El sistema actualiza el contexto del contacto, lo que retroalimenta las sugerencias de mensajes con IA en la pantalla de Inicio.

### C. Bloque Derecho: Seguimiento y Datos
Aloja los campos editables y las configuraciones de contacto:
- **Próximo Toque**: Un selector de fecha de calendario para reprogramar el siguiente contacto. Se acompaña de la aclaración conceptual: *"Fechas editables. La IA las sugiere del contexto."*
- **Datos Básicos**: Campos de texto editables para cambiar el nombre, WhatsApp y Empresa del contacto.
- **Configuración de Seguimiento**:
  - En Clientes: Selector para alternar entre Flujo Constante (ciclo de días) o Fecha Fija de calendario.
  - En Prospectos: Visualización de las fechas agendadas para Seguimiento 1 y 2.
