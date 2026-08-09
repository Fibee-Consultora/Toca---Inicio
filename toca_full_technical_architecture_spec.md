# 📘 Especificación Técnica Completa y Arquitectura de Código: TOCA BY FIBEE
> **Destinatario:** Claude 3.5 (Fable / Opus)
> **Propósito:** Auditoría exhaustiva de arquitectura de código, análisis de seguridad RLS, evaluación de producto y diseño del Motor de Inteligencia Artificial ("El Árbol de Clientes") para ventas por WhatsApp Web en LATAM.

---

# TABLA DE CONTENIDOS
1. Visión del Producto y Filosofía del "Árbol de Relaciones"
2. Arquitectura de Base de Datos y Seguridad (Supabase PostgreSQL + RLS + RPC)
3. Código Fuente del Backend (Funciones SQL PostgreSQL)
4. Lógica del Sistema Frontend y Estado Global JavaScript (`js/db.js`, `js/app.js`, `js/ui.js`)
5. Flujos de Trabajo Actuales (Multi-Tenant, Invitaciones, Borrado Duro, Impersonación)
6. El Desafío del Motor de IA ("El Corazón de Toca" con Claude 3 Haiku)
7. Visión de la Extensión de Chrome para WhatsApp Web
8. Solicitud de Evaluación Exhaustiva y Preguntas Estratégicas para Fable

---

# 1. Visión del Producto y Filosofía del "Árbol de Relaciones"

### El Problema de las PYMEs en LATAM
En Perú y Latinoamérica, más del 90% de las transacciones comerciales de pequeñas y medianas empresas (PYMEs), solopreneurs y equipos de ventas se realizan directamente a través de **WhatsApp Web**. Los vendedores atienden decenas o cientos de conversaciones simultáneas.

Los CRM tradicionales del mercado son rígidos: imponen embudos con 10 etapas complejas, tablas pesadas de Excel y formularios aburridos que rompen la velocidad del vendedor. Como resultado, los prospectos se enfrían, el vendedor olvida el contexto de conversaciones pasadas y se envían respuestas genéricas sin capacidad de cierre.

### La Filosofía de Toca: "El Árbol de Relaciones"
En **Toca by Fibee**, concebimos el sistema como un **Árbol Vivo**:

```
                  [ 🌲 EL TRONCO: TOCA ENGINE ]
     (Identidad de Marca, Tono de Voz, Oferta Clave, Reglas SaaS)
                                 │
     ┌───────────────────────────┼───────────────────────────┐
     ▼                           ▼                           ▼
[ 🌿 Rama Cliente A ]     [ 🌿 Rama Cliente B ]     [ 🌿 Rama Cliente C ]
- Sensible al precio      - Comprador mayorista     - Indeciso con la talla
- Duda de los envíos      - Exige factura rápida    - Pide testimonios/fotos
- Silencio: 3 días        - Silencio: 1 día         - Silencio: 7 días
```

- **El Tronco:** Representa la empresa / espacio de trabajo (`Workspace`). Almacena la configuración de la marca: el nombre, el sector, el tono de comunicación (*Amigable 😊, Profesional 💼, Directo/Comercial 🚀*), la oferta o promoción activa y las reglas comerciales.
- **Las Ramas:** Cada cliente/prospecto es una **rama viva e independiente**. Cada rama crece en su propia dirección, con su propia personalidad, sus dudas específicas, su nivel de urgencia y sus antecedentes de compra.
- **Los Toques del Día:** Categorización dinámica por urgencia de comunicación:
  - 🔴 **Urgentes / Prospectos:** Nuevos contactos o interesados que requieren respuesta inmediata.
  - 🟡 **Atención:** Clientes en proceso de seguimiento o negociación activa.
  - 🟢 **Al día:** Clientes cerrados o al día en su ciclo de conversación.

---

# 2. Arquitectura de Base de Datos y Seguridad (Supabase PostgreSQL + RLS + RPC)

El backend de Toca utiliza **Supabase PostgreSQL** configurado con políticas de seguridad en la capa de filas (**RLS - Row Level Security**) y funciones SQL personalizadas marcadas como `SECURITY DEFINER` para evitar bucles de recursión RLS.

### Esquema de Tablas en PostgreSQL:

1. **`profiles`**
   - `id` (UUID, Primary Key, emparejado con `auth.users.id`)
   - `email` (Text)
   - `full_name` (Text, contiene metadatos codificados como `Nombre|plan:Plan Panal|agents:2|packs:0|status:Activo|pay:2026-08-01|factura:true|active_workspaces:ws1,ws2`)
   - `plan` (Text)
   - `created_at` (Timestamp)
   - `updated_at` (Timestamp)

2. **`workspaces`**
   - `id` (UUID, Primary Key)
   - `name` (Text, ej: "POLOS PIERKUN", "CHORIZOS PIERKUN")
   - `sector` (Text)
   - `description` (Text)
   - `tone` (Text, ej: "Amigable", "Profesional")
   - `promotion` (Text, ej: "Envío gratis a todo el Perú")
   - `timezone` (Text)
   - `owner_id` (UUID, Foreign Key a `profiles.id`)
   - `created_at` (Timestamp)

3. **`workspace_members`** (Membresías de colaboración)
   - `id` (UUID, Primary Key)
   - `workspace_id` (UUID, Foreign Key a `workspaces.id`)
   - `user_id` (UUID, Foreign Key a `profiles.id`, nulo mientras esté pendiente)
   - `invite_email` (Text, correo del usuario invitado)
   - `role` (Text, ej: "Colaborador", "Agente")
   - `invited_by` (UUID, ID del usuario propietario que envió la invitación)
   - `status` (Text, ej: "Pendiente", "Activo", "Rechazado")
   - `created_at` (Timestamp)

4. **`workspace_team`** (Registro auxiliar de equipo)
   - `id` (UUID, Primary Key)
   - `workspace_id` (UUID, Foreign Key a `workspaces.id`)
   - `user_id` (UUID)
   - `name` (Text)
   - `email` (Text)
   - `role` (Text)
   - `status` (Text)
   - `created_at` (Timestamp)

5. **`contacts`** (Prospectos y Clientes)
   - `id` (UUID, Primary Key)
   - `workspace_id` (UUID, Foreign Key a `workspaces.id`)
   - `name` (Text, ej: "Javier Torres")
   - `company` (Text)
   - `phone` (Text)
   - `email` (Text)
   - `status` (Text, ej: "PROSPECTO", "ATENCION", "AL_DIA")
   - `priority` (Text, ej: "Alta", "Media", "Baja")
   - `notes` (Text)
   - `last_touch` (Timestamp)
   - `touch_history` (JSONB, arreglo de registros de toques históricos)
   - `created_at` (Timestamp)

---

# 3. Código Fuente del Backend (Funciones SQL en PostgreSQL)

A continuación se presentan los scripts SQL exactos desplegados en la base de datos de Supabase:

### A. Función RPC: `public.get_user_workspaces()`
Esta función resuelve todos los espacios de trabajo pertenecientes al usuario o a los que ha sido invitado, asignando roles dinámicos, aislando borradores no configurados del anfitrión y evitando errores RLS:

```sql
create or replace function public.get_user_workspaces()
returns table (
  id uuid,
  name text,
  sector text,
  description text,
  tone text,
  promotion text,
  timezone text,
  owner_id uuid,
  member_role text,
  member_status text,
  is_pending boolean
)
security definer
language plpgsql
as $$
declare
  u_id uuid := auth.uid();
  u_email text := lower(auth.jwt() ->> 'email');
begin
  -- 1. Vincular user_id a invitaciones pendientes por correo (sin forzar estado a 'Activo')
  if u_id is not null and u_email is not null then
    update public.workspace_members
    set user_id = u_id
    where lower(invite_email) = u_email and user_id is null;

    update public.workspace_team
    set user_id = u_id
    where lower(email) = u_email and user_id is null;
  end if;

  -- 2. Retornar espacios propios e invitados reales (omitiendo borradores vacíos del anfitrión)
  return query
  with host_owners as (
    select distinct w.owner_id
    from public.workspaces w
    join public.workspace_members wm on wm.workspace_id = w.id
    where (wm.user_id = u_id or (u_email is not null and lower(wm.invite_email) = u_email))
    union
    select distinct w.owner_id
    from public.workspaces w
    join public.workspace_team wt on wt.workspace_id = w.id
    where (wt.user_id = u_id or (u_email is not null and lower(wt.email) = u_email))
  ),
  host_has_custom as (
    select owner_id
    from public.workspaces
    where owner_id in (select owner_id from host_owners)
      and lower(trim(name)) not in ('mi negocio', 'mi negocio ')
  )
  select distinct
    w.id,
    w.name,
    w.sector,
    w.description,
    w.tone,
    w.promotion,
    w.timezone,
    w.owner_id,
    case when w.owner_id = u_id then 'Propietario' else coalesce(wm.role, wt.role, 'Colaborador')::text end as member_role,
    case when w.owner_id = u_id then 'Activo' else coalesce(wm.status, wt.status, 'Activo')::text end as member_status,
    (w.owner_id != u_id and coalesce(wm.status, wt.status, 'Activo') = 'Pendiente') as is_pending
  from public.workspaces w
  left join host_owners ho on ho.owner_id = w.owner_id
  left join public.workspace_members wm on wm.workspace_id = w.id and (wm.user_id = u_id or (u_email is not null and lower(wm.invite_email) = u_email))
  left join public.workspace_team wt on wt.workspace_id = w.id and (wt.user_id = u_id or (u_email is not null and lower(wt.email) = u_email))
  where w.owner_id = u_id 
     or (
       ho.owner_id is not null 
       and not (
         w.owner_id in (select owner_id from host_has_custom) 
         and lower(trim(w.name)) in ('mi negocio', 'mi negocio ')
       )
     );
end;
$$;
```

### B. Función de Seguridad RLS: `public.is_member_of_workspace()`
Verifica de forma recursiva si un usuario tiene permisos sobre un espacio de trabajo específico (para controlar lectura/escritura en la tabla `contacts`):

```sql
create or replace function public.is_member_of_workspace(ws_id uuid, u_id uuid)
returns boolean
security definer
language plpgsql
as $$
declare
  u_email text := lower(auth.jwt() ->> 'email');
begin
  return exists (
    -- Es el propietario directo
    select 1 
    from public.workspaces w 
    where w.id = ws_id and w.owner_id = u_id
  ) or exists (
    -- Tiene invitación en workspace_members
    select 1 
    from public.workspace_members wm 
    where wm.workspace_id = ws_id and (
      wm.user_id = u_id or 
      (u_email is not null and lower(wm.invite_email) = u_email)
    )
  ) or exists (
    -- Tiene invitación en workspace_team
    select 1 
    from public.workspace_team wt 
    where wt.workspace_id = ws_id and (
      wt.user_id = u_id or 
      (u_email is not null and lower(wt.email) = u_email)
    )
  ) or exists (
    -- Es invitado de un propietario que posee este workspace (acceso total a negocios del host)
    select 1
    from public.workspaces target_w
    join public.workspaces host_w on host_w.owner_id = target_w.owner_id
    left join public.workspace_members wm on wm.workspace_id = host_w.id and (wm.user_id = u_id or (u_email is not null and lower(wm.invite_email) = u_email))
    left join public.workspace_team wt on wt.workspace_id = host_w.id and (wt.user_id = u_id or (u_email is not null and lower(wt.email) = u_email))
    where target_w.id = ws_id and (wm.id is not null or wt.id is not null)
  );
end;
$$;
```

### C. Función de Borrado Duro Administrativo: `public.admin_hard_delete_user()`
Permite la eliminación definitiva en cascada de un usuario desde el panel SuperAdmin bypassing bloqueos RLS:

```sql
create or replace function public.admin_hard_delete_user(target_user_id uuid, target_email text)
returns void
security definer
language plpgsql
as $$
declare
  clean_email text := lower(trim(target_email));
begin
  -- Eliminar invitaciones y membresías asociadas al correo
  if clean_email is not null and clean_email != '' then
    delete from public.workspace_members where lower(invite_email) = clean_email;
    delete from public.workspace_team where lower(email) = clean_email;
  end if;

  -- Eliminar espacios, contactos y perfil asociados al UUID
  if target_user_id is not null then
    delete from public.workspace_members where user_id = target_user_id;
    delete from public.workspace_team where user_id = target_user_id;

    delete from public.contacts 
    where workspace_id in (select id from public.workspaces where owner_id = target_user_id);

    delete from public.workspaces where owner_id = target_user_id;
    delete from public.profiles where id = target_user_id;
  end if;
end;
$$;
```

---

# 4. Lógica del Sistema Frontend JavaScript (`js/db.js`, `js/app.js`, `js/ui.js`)

### A. Módulo de Base de Datos (`js/db.js`) - Carga e Integración RPC:
```javascript
async function loadWorkspaces() {
  const client = getClient();
  const { data: userRes } = await client.auth.getUser();
  const user = userRes?.user;
  if (!user) return [];

  // Invocación preferente al RPC SECURITY DEFINER
  try {
    const { data: rpcData, error: rpcError } = await client.rpc('get_user_workspaces');
    if (!rpcError && rpcData && Array.isArray(rpcData) && rpcData.length > 0) {
      let mapped = rpcData.map(w => {
        // Comparación insensible a mayúsculas/minúsculas entre owner_id y user.id
        const isOwner = Boolean(!w.owner_id || (user && String(w.owner_id).toLowerCase() === String(user.id).toLowerCase()));
        return {
          id: w.id,
          name: w.name,
          sector: w.sector,
          description: w.description,
          tone: w.tone,
          promotion: w.promotion,
          timezone: w.timezone,
          owner_id: w.owner_id,
          _role: isOwner ? 'Propietario' : (w.member_role || 'Colaborador'),
          _status: isOwner ? 'Activo' : (w.member_status || 'Activo'),
          _isPending: isOwner ? false : (w.is_pending === true)
        };
      });
      return mapped;
    }
  } catch (rpcErr) {
    console.warn("RPC get_user_workspaces fallback warning:", rpcErr);
  }

  // Fallback a consultas cliente directas...
  return list;
}
```

### B. Sincronización y Selección de Espacio por Defecto (`js/app.js`):
```javascript
async function syncWorkspacesFromSupabase(user) {
  if (isSyncingWorkspaces) return;
  isSyncingWorkspaces = true;
  try {
    let ws = await window.TocaDB.loadWorkspaces();
    
    // Scoping estricto de caché local para evitar heredar espacios de sesiones pasadas
    const hasLocalUuid = businesses.some(b => isNaN(b.id) && b.owner_id && user && String(b.owner_id).toLowerCase() === String(user.id).toLowerCase());
    
    if (ws.length === 0) {
      if (hasLocalUuid) {
        ws = businesses.filter(b => b.owner_id && user && String(b.owner_id).toLowerCase() === String(user.id).toLowerCase());
      }
      if (!ws || ws.length === 0) {
        const newWs = await window.TocaDB.insertWorkspace({
          name: 'Mi Negocio',
          sector: 'Otro',
          description: '',
          tone: 'Amigable',
          promotion: '',
          timezone: 'America/Lima',
          owner_id: user.id
        });
        ws = [newWs];
      }
    }
    
    businesses = ws.map(w => {
      const isOwner = Boolean(!w.owner_id || (user && String(w.owner_id).toLowerCase() === String(user.id).toLowerCase()));
      return {
        id: w.id,
        name: w.name || 'Mi Negocio',
        owner_id: w.owner_id,
        sector: w.sector || 'Otro',
        description: w.description || '',
        tone: w.tone || 'Amigable',
        promotion: w.promotion || '',
        timezone: w.timezone || 'America/Lima',
        _role: isOwner ? 'Propietario' : (w._role || 'Colaborador'),
        _status: isOwner ? 'Activo' : (w._status || 'Activo'),
        _isPending: isOwner ? false : !!w._isPending,
        _memberId: w._memberId || null
      };
    });
    
    localStorage.setItem(`toca_businesses_${user.id}`, JSON.stringify(businesses));
    
    // SELECCIÓN POR DEFECTO DEL ESPACIO PROPIO (owner_id === user.id)
    const savedId = localStorage.getItem(`toca_current_business_id_${user.id}`);
    const ownedBiz = businesses.find(b => !b.owner_id || (user && String(b.owner_id).toLowerCase() === String(user.id).toLowerCase()));
    const defaultBizId = ownedBiz ? ownedBiz.id : (businesses[0] ? businesses[0].id : null);
    
    if (!savedId || !businesses.some(b => String(b.id) === String(savedId))) {
      currentBusinessId = defaultBizId;
      if (currentBusinessId) {
        localStorage.setItem(`toca_current_business_id_${user.id}`, String(currentBusinessId));
      }
    } else {
      currentBusinessId = savedId;
    }
    businessProfile = businesses.find(b => String(b.id) === String(currentBusinessId)) || ownedBiz || businesses[0];
    localStorage.setItem('toca_business_profile', JSON.stringify(businessProfile));
    
    // Carga de contactos y renderizado...
  } finally {
    isSyncingWorkspaces = false;
  }
}
```

### C. Evaluación de Roles e Interfaz Modal (`js/ui.js`):
```javascript
function renderProfileModalContent() {
  const container = document.getElementById('profile-modal-body');
  if (!container) return;

  // Evaluación estricta por owner_id case-insensitive
  const isAgent = Boolean(businessProfile && businessProfile.owner_id && currentAuthUser && String(businessProfile.owner_id).toLowerCase() !== String(currentAuthUser.id).toLowerCase());

  // Ocultar pestañas de Plan y Equipo si es un espacio invitado (Colaborador)
  const btnPlan = document.getElementById('btn-profile-tab-plan');
  const btnEquipo = document.getElementById('btn-profile-tab-equipo');

  if (isAgent) {
    if (btnPlan) btnPlan.style.display = 'none';
    if (btnEquipo) btnEquipo.style.display = 'none';
  } else {
    if (btnPlan) btnPlan.style.display = 'inline-block';
    if (btnEquipo) btnEquipo.style.display = 'inline-block';
  }
  // Renderizado del modal...
}
```

---

# 5. El Desafío del Motor de IA ("El Corazón de Toca" con Claude 3 Haiku)

El gran salto cualitativo de Toca radica en reemplazar las sugerencias genéricas por un **Motor de Inteligencia Artificial Contextualizado** alimentado por **Claude 3 Haiku**.

### El Desafío de Ingeniería de Prompts (Context Assembly):
Para atender la métrica de costo y velocidad, **Claude 3 Haiku** debe recibir un contexto ensamblado dinámicamente que incluya:

```
[ CONTEXTO ENSAMBLADO PARA CLAUDE 3 HAIKU ]
├── 1. Identidad del Tronco (Workspace Profile)
│   ├── Tono de Marca: "Amigable 😊", "Profesional 💼", "Persuasivo 🚀"
│   └── Oferta / Promoción Clave: "Envío gratis a todo el Perú en compras > S/100"
├── 2. Ficha de la Rama (Contacto Individual)
│   ├── Nombre y Empresa: "Javier Torres - Importaciones SAC"
│   ├── Etapa: PROSPECTO / ATENCION / AL_DIA
│   └── Días en Silencio: 3 días desde el último contacto
├── 3. Memoria de Interacciones (Touch History)
│   └── Arreglo de toques pasados (evitar repetir frases enviadas anteriormente)
└── 4. Formato de Salida Requerido
    └── 3 alternativas cortas de mensaje formateadas para WhatsApp
```

### Métricas Exigidas:
- **Latencia:** Menor a 1.5 segundos por respuesta.
- **Costo por Token:** Mínimo consumo posible reduciendo tokens de entrada (sin enviar historias de chat irrelevantes de 500 líneas).
- **Personalización:** Que el mensaje se sienta humano, adaptado al país/región (Perú/LATAM) y al tono de la marca.

---

# 6. Visión del Módulo Extensión de Chrome para WhatsApp Web

### Requisitos Funcionales:
1. **Inyección en WhatsApp Web (`web.whatsapp.com`):**
   - Panel lateral desplegable (Sidepanel u Overlay sutil) que no entorpezca la interfaz original de WhatsApp.
2. **Detección Automática de Contacto:**
   - Detectar el número de teléfono o nombre del chat activo en WhatsApp Web.
   - Consultar la API de Supabase / Toca DB para extraer la ficha de la "rama" en tiempo real.
3. **Persistencia de Sesión:**
   - Sincronizar el `toca_current_business_id` y credenciales de autenticación usando `chrome.storage.local`.
4. **Inserción de Respuesta con 1 Clic:**
   - Permitir que el operador inserte la sugerencia generada por la IA directamente en el input de texto de WhatsApp Web con un solo clic o atajo de teclado.

---

# 7. Solicitud de Evaluación Exhaustiva y Preguntas Estratégicas para Fable

Estimado Claude Fable (Sonnet 3.5 / Opus):

Te pedimos que realices una **auditoría integral y destructiva** de esta especificación técnica y de nuestro modelo de producto. Queremos que nos des tu apreciación sincera, sugerencias disruptivas y un plan de desarrollo optimizado.

### Preguntas Específicas a Responder:

1. **Auditoría de Arquitectura y Código:**
   - ¿Ves alguna falla lógica, riesgo de seguridad RLS o cuello de botella en nuestro esquema de Supabase (`get_user_workspaces`, `is_member_of_workspace`, `admin_hard_delete_user`) o en el manejo de estado en JavaScript (`syncWorkspacesFromSupabase`)?

2. **Rediseño del Motor de IA ("El Cultivador de Ramas"):**
   - ¿Cómo estructurarías el prompt exacto y el pipeline de contexto (RAG ligero) para **Claude 3 Haiku** de forma que mantenga el menor consumo de tokens posible sin perder la memoria única de cada "rama" de cliente?
   - ¿Qué estrategia de caché o resumen de notas (Summary Chain) sugieres para clientes con historiales muy largos?

3. **Nuevo Paradigma de Interacción Operador-IA en WhatsApp Web:**
   - Olvídate de la idea tradicional de abrir un modal, pulsar un botón y copiar/pegar. **¿Cómo debería ser la interfaz e interacción idónea entre el vendedor y la IA dentro de WhatsApp Web?**
   - ¿Cómo implementar una experiencia de "Copiloto Invisible" o "Ghostwriting Predictivo" que minimice la fricción del vendedor?

4. **Sugerencias Disruptivas y Giros de Producto:**
   - Si tuvieras libertad total para rediseñar Toca desde cero manteniendo nuestro stack (Vanilla JS + Supabase + Haiku + Chrome Extension), **¿qué cambiarías o agregarías para hacer de Toca el CRM de WhatsApp definitivo en LATAM?**

5. **Hoja de Ruta de Desarrollo Paso a Paso (Roadmap):**
   - Entréganos una guía secuencial ordenada por fases para implementar el Motor de IA de Haiku y la Extensión de Chrome de forma limpia y escalable.

---
*Fin de la Especificación Técnica. Esperamos tu análisis exhaustivo en formato Markdown.*
