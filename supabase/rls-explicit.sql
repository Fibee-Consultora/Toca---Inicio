-- =============================================================================
-- TOCA — Políticas RLS Explícitas para solucionar problemas de inserción
-- Ejecutar en: Supabase Dashboard → SQL Editor → Run
-- =============================================================================

-- 1. Eliminar políticas previas para evitar duplicados o conflictos
do $$
declare
  pol record;
begin
  for pol in 
    select policyname, tablename 
    from pg_policies 
    where schemaname = 'public' and tablename in ('workspace_members', 'workspace_team')
  loop
    execute format('drop policy if exists %I on public.%I', pol.policyname, pol.tablename);
  end loop;
end;
$$;

-- 2. Asegurar que RLS esté habilitado
alter table public.workspace_members enable row level security;
alter table public.workspace_team enable row level security;

-- 3. Crear la función helper con 'security definer' para evitar recursión infinita
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

-- =============================================================================
-- POLÍTICAS PARA WORKSPACE_MEMBERS (Explícitas por comando)
-- =============================================================================

-- SELECT: El usuario puede ver su propia fila de miembro, la invitación que le hicieron a su correo, o los miembros del workspace del cual es parte
create policy "workspace_members_select_policy" on public.workspace_members
for select
using (
  user_id = auth.uid() or 
  invite_email = auth.jwt() ->> 'email' or
  public.is_member_of_workspace(workspace_id, auth.uid())
);

-- INSERT: Solo un miembro/dueño activo del workspace puede invitar a un nuevo miembro
create policy "workspace_members_insert_policy" on public.workspace_members
for insert
with check (
  public.is_member_of_workspace(workspace_id, auth.uid())
);

-- UPDATE: Un miembro puede actualizar su propia fila (ej. al aceptar), su invitación por correo, o el dueño/miembro puede modificarla
create policy "workspace_members_update_policy" on public.workspace_members
for update
using (
  user_id = auth.uid() or 
  invite_email = auth.jwt() ->> 'email' or
  public.is_member_of_workspace(workspace_id, auth.uid())
)
with check (
  user_id = auth.uid() or 
  invite_email = auth.jwt() ->> 'email' or
  public.is_member_of_workspace(workspace_id, auth.uid())
);

-- DELETE: Solo un miembro/dueño del workspace puede eliminar a un miembro
create policy "workspace_members_delete_policy" on public.workspace_members
for delete
using (
  public.is_member_of_workspace(workspace_id, auth.uid())
);

-- =============================================================================
-- POLÍTICAS PARA WORKSPACE_TEAM (Explícitas por comando)
-- =============================================================================

-- SELECT: Cualquier miembro del workspace puede ver la lista de equipo
create policy "workspace_team_select_policy" on public.workspace_team
for select
using (
  public.is_member_of_workspace(workspace_id, auth.uid())
);

-- INSERT: Solo un miembro del workspace puede agregar un miembro del equipo
create policy "workspace_team_insert_policy" on public.workspace_team
for insert
with check (
  public.is_member_of_workspace(workspace_id, auth.uid())
);

-- UPDATE: Solo un miembro del workspace puede actualizar la información del equipo
create policy "workspace_team_update_policy" on public.workspace_team
for update
using (
  public.is_member_of_workspace(workspace_id, auth.uid())
)
with check (
  public.is_member_of_workspace(workspace_id, auth.uid())
);

-- DELETE: Solo un miembro del workspace puede eliminar un miembro del equipo
create policy "workspace_team_delete_policy" on public.workspace_team
for delete
using (
  public.is_member_of_workspace(workspace_id, auth.uid())
);

-- Otorgar permisos
grant all on public.workspace_members to authenticated;
grant all on public.workspace_team to authenticated;
