# Arquitectura del Flujo: Conexión entre Inicio, Clientes y Prospectos

Este documento detalla la lógica de interacción y sincronización de datos entre el tablero operativo de **Inicio** y los repositorios históricos de **Clientes** y **Prospectos** en **Toca v2**.

---

## 1. El Ecosistema de Toca v2: Roles Lógicos

En **Toca v2**, la interfaz se divide de manera clara entre pantallas de **operación diaria** y pantallas de **administración/búsqueda**:

```mermaid
graph TD
    subgraph Pantallas Históricas (Búsqueda)
        C[Pestaña Clientes]
        P[Pestaña Prospectos]
    end

    subgraph Tablero Operativo (Acción Diaria)
        I[Inicio: Toques del Día]
        W[Inicio: Esperando Respuesta]
    end

    C -->|Filtra/Edita| I
    P -->|Filtra/Edita| I
    P -->|Cerrar Lead| C
    I -->|Hecho| W
    W -->|Actualizar/Reagendar| I
```

### A. Inicio: El Tablero Operativo Diario
* **Propósito:** Mostrar únicamente los contactos que requieren una acción **hoy**. Es la pantalla de trabajo diario donde el usuario vacía su bandeja ("Inbox Zero").
* **Estructura:**
  * **Toques del Día:** Contactos activos cuya fecha sugerida de contacto (`suggestedDate`) es menor o igual a hoy.
  * **Esperando Respuesta:** Contactos con los que ya se interactuó y están en espera de que contesten.

### B. Clientes y Prospectos: Las Bases de Datos Históricas
* **Propósito:** Servir como archivo general. Muestran el 100% de los contactos (activos y archivados), permitiendo buscarlos por nombre o empresa, filtrar por estado, registrar nuevos contactos y acceder a su historial completo sin importar si tienen una tarea pendiente hoy o no.

---

## 2. Conectividad y Sincronización del Flujo

Cualquier cambio realizado en las pestañas históricas impacta directamente sobre lo que se muestra en el tablero operativo de **Inicio**:

### 1. El Ciclo de Vida del Contacto (De Inicio a Esperando Respuesta)
1. Un contacto (Cliente o Prospecto) aparece en **Inicio -> Toques del Día** porque su fecha sugerida de contacto llegó a su vencimiento.
2. El usuario hace clic en `Hecho ✓` en la tarjeta de Inicio:
   * El contacto cambia su estado a `Esperando respuesta`.
   * Desaparece de **Toques del Día**.
   * Aparece en la sección inferior de **Esperando Respuesta** con un cronómetro de días transcurridos.
3. Este cambio de estado se refleja de inmediato en los contadores y filtros de las pestañas de **Clientes** o **Prospectos**.

### 2. Sincronización desde la Ficha de Detalles Lateral
Al hacer clic en cualquier tarjeta de Clientes o Prospectos, se abre la **Ficha de Detalles Lateral** (de solo lectura si está archivado, o completamente editable si está activo). Las ediciones modifican el tablero de Inicio en tiempo real:
* **Modificación de la Fecha Sugerida:** Si se cambia la fecha de próximo contacto en la ficha lateral, el contacto saldrá o entrará de **Toques del Día** en la pantalla de Inicio de forma automática.
* **Registro de nuevo Contexto:** Si se añade una nota en la línea de tiempo (`+ Contexto`), el sistema actualiza el campo de contexto general, lo que regenera automáticamente las **Sugerencias de Mensajes con IA** en la tarjeta del contacto en Inicio.

### 3. Conversión de Prospecto a Cliente ("Cerrar Lead")
Cuando un lead en la pestaña de **Prospectos** se concreta exitosamente:
1. En la ficha de detalles, el usuario pulsa `🏁 Cerrar lead` (cabecera) o `🏆 ¡Cerrar Trato!` (formulario).
2. El contacto cambia de tipo a `Cliente`:
   * Se le asigna por defecto un flujo constante con ciclo recurrente de `28 días`.
   * Desaparece de la pestaña **Prospectos**.
   * Aparece en la pestaña **Clientes**.
   * Su fecha de próximo contacto se programa para dentro de 28 días, por lo que saldrá de la vista de Inicio actual y reingresará automáticamente a **Toques del Día** cuando venza el nuevo ciclo.

### 4. Lógica de Contactos Archivados (Inactivos)
Cuando un usuario decide archivar un contacto (Cliente o Prospecto):
* **Pérdida de Urgencia y Agendamiento:** El contacto se marca con `archived = true` y pierde todas sus alertas activas. En su tarjeta ya no se muestra la fecha sugerida, ni el ciclo de días, ni píldoras de urgencia.
* **Exclusión de Inicio:** Al estar archivado, el contacto se retira por completo de la pantalla de **Inicio** (no aparecerá en toques del día ni en esperando respuesta).
* **Filtro Archivados:** Solo es visible en las pestañas secundarias seleccionando el filtro de `📁 Archivados`.
* **Fecha de Baja (Clientes):** Si es un cliente, el sistema registra la fecha exacta en la que se le dio de baja (`archivedDate`), mostrándola en la ficha lateral para auditoría histórica.
* **Recuperación (Restaurar):** Al pulsar `Restaurar`, el contacto recupera sus campos de seguimiento y vuelve a ingresar de forma automática al flujo de Inicio basándose en sus fechas guardadas.

---

## 3. Resumen de Flujo de Datos

La siguiente tabla resume cómo interactúan los estados y variables de las pestañas secundarias con el Tablero de Inicio:

| Acción en Clientes/Prospectos | Variable Afectada | Impacto Directo en Pantalla de Inicio |
| :--- | :--- | :--- |
| **Registrar nuevo contacto** | Crea objeto en `contacts` | Aparece en **Toques del Día** si su fecha es hoy o anterior. |
| **Archivar contacto** | `contact.archived = true` | Se elimina inmediatamente de **Toques del Día** y **Esperando Respuesta**. |
| **Cerrar Lead (Prospecto)** | `contact.type = 'Cliente'` | Se recalcula su fecha en base al ciclo de 28 días y sale de los pendientes de hoy. |
| **Modificar fecha próximo toque** | `contact.suggestedDate` | Determina si el contacto ingresa hoy a **Toques del Día** (si la fecha es $\le$ hoy). |
| **Añadir nota de Contexto** | `contact.context` | Cambia el texto base para la redacción de plantillas de **Sugerencias de IA** en Inicio. |
