---
name: economia-y-estrategia-comercial
description: Habilidad experta para análisis económico, diseño de estrategias comerciales, estructuración de precios de suscripciones SaaS, definición de límites de uso y mitigación de canibalización de planes.
---

# 📈 Economía y Estrategia Comercial (SaaS B2B)

Esta guía formaliza las mejores prácticas y principios de precios para estructurar el modelo comercial de **Toca** (línea de productos **Fibee**), optimizando la monetización por medio de un balance entre el número de agentes, la base de contactos activos y los adicionales sin canibalizar los planes superiores.

---

## 🎯 1. Principios de Diseño de Precios (Pricing Strategy)

Para maximizar los ingresos recurrentes (MRR) y optimizar la conversión, aplicamos las siguientes directrices:

1. **Charm Pricing (Precios Psicológicos):**
   - Los precios de los planes siempre deben terminar en **9** (por ejemplo, S/. 69, S/. 119, S/. 199). Esto reduce la barrera psicológica de cobro frente a los números redondos (70, 120, 200).
   
2. **El "Foco" en el Plan Regular (Decoy & Anchor Effect):**
   - El plan intermedio (**Panal**) debe ser el objetivo de conversión. Debe configurarse para capturar al menos al **50% de la base de clientes**.
   - Para incentivar esto, el plan básico (**Néctar**) tiene límites de uso ajustados (50 contactos), mientras que el plan superior (**Colmena**) sirve como un ancla de alto valor, haciendo que el plan intermedio parezca la opción más costo-efectiva.

3. **Métrica de Valor (Value Metrics):**
   - Combinamos una métrica de **ancho** (número de agentes de ventas) con una métrica de **profundidad/uso** (número de contactos activos en seguimiento). Esto alinea el costo de la herramienta con el crecimiento de la empresa del cliente.

---

## 📊 2. Arquitectura de Planes (Néctar / Panal / Colmena)

Basado en nuestra estrategia comercial, estructuramos los siguientes planes:

| Plan | Tarifa Mensual | Límite Agentes | Límite Contactos | Diferenciador Clave | Enlace Acción |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Néctar** 🌸 | **S/. 69** | 1 Agente | Hasta 50 | QR estándar | Solicitar Plan Néctar |
| **Panal** 🍯 | **S/. 119** *(Activo)* | Hasta 3 agentes | Hasta 200 | Copiloto IA + API oficial | Plan Activo (Prototype) |
| **Colmena** 🐝 | **S/. 199** | Hasta 8 agentes | Hasta 600 | IA + Reportes Avanzados | Solicitar Plan Colmena |
| **Reina** 👑 | **A Medida (Custom)** | Ilimitados | Ilimitados | IA Personalizada + Soporte | WhatsApp Asesor |

---

## 📈 3. Economía de Adicionales (Add-ons) y Anti-Canibalización

Para permitir a los clientes ampliar levemente su plan sin verse forzados a saltar de tier de inmediato, se introducen adicionales. Estos adicionales están diseñados con un **Tope de 2 por plan** para obligar al upgrade cuando el uso crece.

### A. Agentes de Ventas Adicionales
- **Precio sugerido:** **S/. 29 / mes** por agente extra.
- **Lógica:** Si un usuario de *Néctar (S/. 69)* añade 2 agentes adicionales, su tarifa sube a S/. 127, lo que supera el costo de *Panal (S/. 119)*. Esto empuja al usuario a migrar a Panal de forma automática.

### B. Contactos Adicionales
- **Para Plan Néctar:** Packs de **+50 contactos por S/. 19 / mes** (Máx. 2 packs).
  - 1 Pack: S/. 69 + S/. 19 = S/. 88 (100 contactos).
  - 2 Packs: S/. 69 + S/. 38 = S/. 107 (150 contactos).
  - 3 Packs (Bloqueado): Obliga a migrar a *Panal (S/. 119)* para tener 200 contactos.
- **Para Plan Panal:** Packs de **+100 contactos por S/. 29 / mes** (Máx. 2 packs).
  - 1 Pack: S/. 119 + S/. 29 = S/. 148 (300 contactos).
  - 2 Packs: S/. 119 + S/. 58 = S/. 177 (400 contactos).
  - 3 Packs (Bloqueado): Obliga a migrar a *Colmena (S/. 199)* para tener 600 contactos.
