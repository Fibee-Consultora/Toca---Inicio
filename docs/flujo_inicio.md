# Manual de Flujo Lógico y Transición de Estados: Sección Inicio (Toca v2)

Este documento detalla, de manera exclusivamente textual y conceptual, cómo funciona la sección de **Inicio** (Dashboard) de la aplicación **Toca v2**. Explica detalladamente las secciones operativas de la pantalla y describe paso a paso el comportamiento y los flujos que siguen los **Prospectos** y los **Clientes**, omitiendo cualquier referencia a colores, estilos visuales, código o interfaces de diseño final.

---

## 1. Explicación de las Secciones Operativas

La pantalla de Inicio está diseñada para que el vendedor organice su día a día. Para ello, procesa la base de datos de contactos y los divide en dos bandejas lógicas:

### A. Bandeja de Pendientes de Contacto
Es la lista de tareas activas para el día de hoy o fechas anteriores (retrasadas). Los contactos se clasifican automáticamente en tres niveles de urgencia:
- **Urgencia Alta**: Contactos cuya fecha programada es hoy, es mañana o ya está vencida. Son la prioridad número uno del vendedor.
- **Urgencia Media**: Contactos programados para recibir comunicación en un plazo de entre 2 y 7 días futuros.
- **Urgencia Baja**: Contactos programados para dentro de 8 días o más.

*Nota de Organización*: Los contactos de cada urgencia se agrupan por separado y no se mezclan. El grupo de urgencia alta se muestra primero; a continuación, se inicia una fila o bloque nuevo e independiente para el grupo de urgencia media, y finalmente otro bloque para el grupo de urgencia baja. Si el primer grupo tiene pocos elementos, el segundo grupo no subirá a ocupar los espacios libres, respetando la separación visual de prioridades.

### B. Bandeja de Esperando Respuesta
Aquí se listan aquellos contactos con los que el vendedor ya entabló comunicación y está a la espera de recibir una contestación o retroalimentación. El sistema registra el tiempo transcurrido (días de espera) para que el vendedor lleve un control y evite que la conversación se enfríe.
- **Acordeón Colapsable**: El vendedor puede colapsar o expandir esta bandeja para optimizar el espacio de la pantalla.
- **Límite de Desplazamiento**: Para evitar que una acumulación excesiva de contactos empuje otras secciones fuera de la pantalla, esta bandeja tiene un límite de altura y cuenta con su propia barra de desplazamiento interna.

---

## 2. Flujo Completo de un Prospecto (Embudo de Ventas)

El objetivo con un Prospecto es guiarlo a través de conversaciones sucesivas hasta cerrar la primera venta.

1. **Registro**: Se crea el contacto como tipo Prospecto indicando sus datos, la necesidad comercial detectada y una fecha obligatoria para el primer contacto (Seguimiento 1). Opcionalmente se pueden pre-programar fechas estimadas para el segundo (Seguimiento 2) y tercer (Seguimiento 3) seguimiento.
2. **Aparición en Pendientes**: Cuando llega la fecha agendada, el prospecto aparece en los Pendientes de Contacto en su respectivo nivel de urgencia.
3. **Redacción Asistida**: El sistema propone sugerencias de mensajes personalizados de acuerdo a las notas que el vendedor registró sobre las necesidades del prospecto. Se ofrecen tres variaciones de tono (Cercano, Directo y Con gancho).
4. **Contacto y Espera**: El vendedor envía el mensaje (con opción de abrir WhatsApp de forma automatizada). Al confirmar la tarea (marcar como "Hecho"):
   - El prospecto cambia su estado a **Esperando Respuesta** y desaparece de la bandeja diaria.
   - **Sistema de Resguardo (Deshacer)**: Se inicia un temporizador de 9 segundos. Si el vendedor confirma la tarea por error, puede cancelarla durante este lapso y el contacto regresa a su posición y estado de urgencia anterior en la lista de pendientes.
5. **Resolución de Respuesta**: Cuando el prospecto responde, el vendedor registra el resultado seleccionando uno de los siguientes caminos:
   - **Conversar luego**: Si el prospecto respondió pero solicitó hablar en otro momento, se fija una fecha futura (que puede ser el Seguimiento 2 o 3 previamente configurados, o una fecha nueva). El prospecto regresa a los Pendientes de Contacto programado para esa fecha.
   - **🏆 Cerrar Trato**: El prospecto se convierte formalmente en **Cliente**. El sistema le activa el seguimiento por ciclo recurrente fijándolo por defecto en 28 días y calcula su próxima fecha sugerida (Hoy + 28 días), enviándolo de vuelta a los Pendientes de Contacto en esa fecha futura.
   - **Oferta nueva**: Si la propuesta original fue rechazada pero el prospecto se mantiene interesado en alternativas, regresa a los Pendientes de Contacto con un plazo de seguimiento corto de 15 días para presentarle otra opción comercial.
   - **Archivar**: Si decide no comprar o no hay acuerdo comercial, se retira al prospecto de la pantalla principal.

---

## 3. Flujo Completo de un Cliente (Fidelización y Recompra)

El objetivo con un Cliente es mantener un contacto continuo para asegurar que siga comprando o renueve sus contratos periódicamente.

1. **Registro**: Se crea el contacto como tipo Cliente y se define el método para calcular sus fechas de contacto:
   - **Ciclo Recurrente (Flujo Constante)**: Se elige un intervalo periódico de días (ej. cada 28 días). Cada vez que se resuelva un contacto con este cliente, el sistema calculará la siguiente fecha sumando esos días al día de hoy.
   - **Fecha Fija (Fecha Determinada)**: Se agenda un día exacto en el calendario (ej. fecha de vencimiento de contrato o suscripción anual). El sistema no calcula periodos cortos automáticos.
2. **Aparición en Pendientes**: Cuando se cumple el ciclo de días o llega la fecha fija del calendario, el cliente aparece en los Pendientes de Contacto.
3. **Redacción de Mensaje**: El sistema propone textos enfocados en servicio al cliente, satisfacción con compras anteriores o avisos de vencimiento.
4. **Contacto y Espera**: El vendedor envía el mensaje y marca la tarea como realizada. El cliente pasa a la bandeja de **Esperando Respuesta** (con la misma ventana de 9 segundos para deshacer la acción si hubo un error).
5. **Resolución de Respuesta (Confirmar Recompra)**: Cuando el cliente responde y se concreta la recompra o renovación, se actualiza el sistema:
   - *Si estaba en modo Ciclo Recurrente*: El sistema calcula la nueva fecha programada sumando la cantidad de días de su ciclo a la fecha actual y lo envía a los Pendientes de Contacto en esa fecha futura.
   - *Si estaba en modo Fecha Fija*: El sistema calcula el próximo contacto a **1 año completo (365 días)** asumiendo una suscripción anual recurrente, abriendo una alerta para que el vendedor pueda reajustar esta fecha si lo prefiere.
   - *Si pide ser contactado en otra fecha*: Se selecciona "Conversar luego" para reprogramarlo para un día de calendario específico.

---

## 4. Matriz de Diferencias en Flujos y Reglas de Negocio

| Criterio Lógico | Prospecto 👤 | Cliente 👥 |
| :--- | :--- | :--- |
| **Meta Principal** | Primera Venta (Conversión a Cliente) | Recompra recurrente o Renovación de contrato |
| **Planificación del Contacto** | Fechas individuales directas (Seguimiento 1, 2, 3) | Ciclo Recurrente (días fijos) o Fecha Fija (calendario) |
| **Enfoque del Mensaje IA** | Captación de interés, propuestas de valor y catálogo | Calidad del servicio, reposición de inventario y renovación |
| **Opción "Oferta Nueva"** | Permitida (mueve a pendientes del día en 15 días) | No permitida (se asume flujo de recompra directo) |
| **Comportamiento al Cerrar Trato** | Se transforma en Cliente (inicializa ciclo de 28 días) | Mantiene tipo y calcula próximo toque (+ciclo o +365 días si es anual) |
| **Transición Inversa en Ficha** | No aplica | No permitida (se mantiene como cliente o se archiva) |
| **Buscador** | Ubica al contacto, abre acordeones de espera si es necesario y enfoca la atención del usuario | Ubica al contacto, abre acordeones de espera si es necesario y enfoca la atención del usuario |
