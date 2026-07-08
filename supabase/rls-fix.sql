-- =============================================================================
-- TOCA — Solución al error de recursión infinita en RLS (workspace_members)
-- Ejecutar en: Supabase Dashboard → SQL Editor → Run
-- =============================================================================

-- 1. Eliminar dinámicamente cualquier política previa en estas tablas para evitar duplicados o conflictos
do $$
declare
  pol record;
begin
  for pol in 
    select policyname, tablename 
    from pg_policies 
    where schemaname = 'public' and tablename in ('workspace_members', 'contacts', 'workspaces', 'contact_history', 'workspace_team')
  loop
    execute format('drop policy if exists %I on public.%I', pol.policyname, pol.tablename);
  end loop;
end;
$$;

-- 2. Crear la función 'security definer' para verificar membresía de workspace
-- Nota: Al ser 'security definer', se ejecuta con los privilegios del creador (postgres),
-- saltando las políticas RLS internas y previniendo la recursión infinita.
create or replace function public.is_member_of_workspace(ws_id uuid, u_id uuid)
returns boolean
security definer
language plpgsql
as $$
begin
  return exists (
    select 1 
    from public.workspaces w 
    where w.id = ws_id and w.owner_id = u_id
  ) or exists (
    select 1 
    from public.workspace_members wm 
    where wm.workspace_id = ws_id and wm.user_id = u_id
  );
end;
$$;

-- 3. Habilitar RLS en todas las tablas
alter table public.workspaces enable row level security;
alter table public.workspace_members enable row level security;
alter table public.contacts enable row level security;
alter table public.contact_history enable row level security;
alter table public.workspace_team enable row level security;

-- 4. Crear políticas limpias sin recursión
create policy "workspaces_access_policy" on public.workspaces
for all
using (
  owner_id = auth.uid() or 
  exists (
    select 1 from public.workspace_members wm 
    where wm.workspace_id = id and wm.user_id = auth.uid()
  )
);

create policy "workspace_members_access_policy" on public.workspace_members
for all
using (
  user_id = auth.uid() or 
  public.is_member_of_workspace(workspace_id, auth.uid())
);

create policy "contacts_access_policy" on public.contacts
for all
using (
  public.is_member_of_workspace(workspace_id, auth.uid())
);

create policy "contact_history_access_policy" on public.contact_history
for all
using (
  exists (
    select 1 from public.contacts c 
    where c.id = contact_id and public.is_member_of_workspace(c.workspace_id, auth.uid())
  )
);

create policy "workspace_team_access_policy" on public.workspace_team
for all
using (
  public.is_member_of_workspace(workspace_id, auth.uid())
);

-- Otorgar permisos correspondientes a los roles
grant all on public.workspaces to authenticated;
grant all on public.workspace_members to authenticated;
grant all on public.contacts to authenticated;
grant all on public.contact_history to authenticated;
grant all on public.workspace_team to authenticated;
