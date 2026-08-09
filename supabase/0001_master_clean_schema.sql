-- ==============================================================================
-- TOCA - MIGRACIÓN MAESTRA UNIFICADA Y SEGURA (0001_master_clean_schema.sql)
-- Ejecutar en Supabase -> SQL Editor
-- Resuelve inconsistencias, fija `SET search_path = public` en SECURITY DEFINER,
-- y asegura RLS correcto para workspaces, miembros, perfiles y contactos.
-- ==============================================================================

-- 1. Extensión para UUIDs
create extension if not exists "uuid-ossp";

-- 2. Tabla Profiles con columnas tipadas
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  full_name text,
  avatar_url text,
  plan text not null default 'Panal' check (plan in ('Néctar', 'Panal', 'Colmena', 'Apiario', 'SuperAdmin')),
  created_at timestamptz default timezone('utc'::text, now()) not null,
  updated_at timestamptz default timezone('utc'::text, now()) not null
);

-- 3. Tabla Workspaces
create table if not exists public.workspaces (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  sector text default 'Otro',
  description text default '',
  tone text default 'Amigable',
  promotion text default '',
  timezone text default 'America/Lima',
  owner_id uuid references auth.users(id) on delete cascade not null,
  created_at timestamptz default timezone('utc'::text, now()) not null,
  updated_at timestamptz default timezone('utc'::text, now()) not null
);

-- 4. Tabla Workspace Members (Miembros e Invitaciones)
create table if not exists public.workspace_members (
  id uuid primary key default uuid_generate_v4(),
  workspace_id uuid references public.workspaces(id) on delete cascade not null,
  user_id uuid references auth.users(id) on delete cascade,
  invite_email text not null,
  role text not null default 'Colaborador' check (role in ('Propietario', 'Administrador', 'Colaborador')),
  status text not null default 'Pendiente' check (status in ('Pendiente', 'Activo', 'Rechazado')),
  created_at timestamptz default timezone('utc'::text, now()) not null,
  updated_at timestamptz default timezone('utc'::text, now()) not null
);

-- 5. Tabla Contacts
create table if not exists public.contacts (
  id bigint primary key generated always as identity,
  workspace_id uuid references public.workspaces(id) on delete cascade not null,
  name text not null,
  phone text,
  whatsapp text,
  notes text,
  context text,
  status text default 'Por Contactar',
  touch_count int default 0,
  created_at timestamptz default timezone('utc'::text, now()) not null,
  updated_at timestamptz default timezone('utc'::text, now()) not null
);

-- ==============================================================================
-- FUNCIONES AUXILIARES SEGURAS (CON SET search_path = public)
-- ==============================================================================

-- Comprobar si el usuario actual pertenece al workspace
create or replace function public.is_member_of_workspace(p_workspace_id uuid, p_user_id uuid)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
begin
  return exists (
    select 1 from public.workspaces w where w.id = p_workspace_id and w.owner_id = p_user_id
    union
    select 1 from public.workspace_members wm where wm.workspace_id = p_workspace_id and wm.user_id = p_user_id and wm.status = 'Activo'
  );
end;
$$;

-- Trigger para registrar perfiles automáticamente al registrarse un usuario
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name, avatar_url, plan)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name', split_part(new.email, '@', 1)) || '|plan:Panal|agents:0|packs:0|status:Activo|pay:2026-07-01|factura:true',
    new.raw_user_meta_data ->> 'avatar_url',
    'Panal'
  )
  on conflict (id) do update set
    email = excluded.email,
    updated_at = now();
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- RPC: Crear Espacio de Trabajo con Bypass seguro de RLS
create or replace function public.create_user_workspace(
  p_name text,
  p_sector text default 'Otro',
  p_description text default '',
  p_tone text default 'Amigable',
  p_promotion text default '',
  p_timezone text default 'America/Lima'
)
returns table (
  id uuid,
  name text,
  sector text,
  description text,
  tone text,
  promotion text,
  timezone text,
  owner_id uuid,
  created_at timestamptz
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_workspace public.workspaces%rowtype;
begin
  if v_user_id is null then
    raise exception 'No autenticado';
  end if;

  insert into public.workspaces (
    name, sector, description, tone, promotion, timezone, owner_id
  )
  values (
    p_name, p_sector, p_description, p_tone, p_promotion, p_timezone, v_user_id
  )
  returning * into v_workspace;

  insert into public.workspace_members (
    workspace_id, user_id, invite_email, role, status
  )
  values (
    v_workspace.id, v_user_id, (select email from auth.users where id = v_user_id), 'Propietario', 'Activo'
  )
  on conflict do nothing;

  return query
  select 
    v_workspace.id,
    v_workspace.name,
    v_workspace.sector,
    v_workspace.description,
    v_workspace.tone,
    v_workspace.promotion,
    v_workspace.timezone,
    v_workspace.owner_id,
    v_workspace.created_at;
end;
$$;

-- RPC Admin: Obtener todos los usuarios
create or replace function public.get_all_users()
returns table (
  u_id uuid,
  u_email varchar,
  u_full_name text,
  u_plan text,
  u_created_at timestamptz,
  u_contacts_count int,
  u_agents_count int
)
language plpgsql
security definer
set search_path = public
as $$
begin
  if lower(auth.jwt() ->> 'email') = 'fibeeconsultoradigital@gmail.com' then
    return query
    select 
      u.id,
      u.email::varchar,
      coalesce(p.full_name, split_part(u.email, '@', 1))::text,
      coalesce(p.plan, 'Panal')::text,
      u.created_at,
      (
        select count(*)::int 
        from public.contacts c 
        where c.workspace_id in (select w.id from public.workspaces w where w.owner_id = u.id)
      )::int as u_contacts_count,
      (
        select count(*)::int 
        from public.workspace_members wm 
        where wm.workspace_id in (select w.id from public.workspaces w where w.owner_id = u.id)
      )::int as u_agents_count
    from auth.users u
    left join public.profiles p on u.id = p.id
    order by u.created_at desc;
  else
    raise exception 'Unauthorized';
  end if;
end;
$$;

-- RPC Admin: Borrar usuario permanentemente
create or replace function public.admin_delete_user(p_target_user_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if (select email from auth.users where id = auth.uid()) = 'fibeeconsultoradigital@gmail.com' then
    delete from public.contacts where workspace_id in (select id from public.workspaces where owner_id = p_target_user_id);
    delete from public.workspace_members where workspace_id in (select id from public.workspaces where owner_id = p_target_user_id) or user_id = p_target_user_id;
    delete from public.workspaces where owner_id = p_target_user_id;
    delete from public.profiles where id = p_target_user_id;
    delete from auth.users where id = p_target_user_id;
  else
    raise exception 'Unauthorized';
  end if;
end;
$$;

-- ==============================================================================
-- REGLAS RLS Y PERMISOS SEGUROS
-- ==============================================================================

alter table public.profiles enable row level security;
alter table public.workspaces enable row level security;
alter table public.workspace_members enable row level security;
alter table public.contacts enable row level security;

-- Policies para Profiles
drop policy if exists "profiles_select_own_or_admin" on public.profiles;
create policy "profiles_select_own_or_admin" on public.profiles for select
using (auth.uid() = id or lower(auth.jwt() ->> 'email') = 'fibeeconsultoradigital@gmail.com');

drop policy if exists "profiles_update_own_or_admin" on public.profiles;
create policy "profiles_update_own_or_admin" on public.profiles for update
using (auth.uid() = id or lower(auth.jwt() ->> 'email') = 'fibeeconsultoradigital@gmail.com');

-- Policies para Workspaces
drop policy if exists "workspaces_access_policy" on public.workspaces;
create policy "workspaces_access_policy" on public.workspaces for select
using (is_member_of_workspace(id, auth.uid()) or lower(auth.jwt() ->> 'email') = 'fibeeconsultoradigital@gmail.com');

drop policy if exists "workspaces_insert_policy" on public.workspaces;
create policy "workspaces_insert_policy" on public.workspaces for insert
with check (owner_id = auth.uid() or lower(auth.jwt() ->> 'email') = 'fibeeconsultoradigital@gmail.com');

drop policy if exists "workspaces_update_policy" on public.workspaces;
create policy "workspaces_update_policy" on public.workspaces for update
using (owner_id = auth.uid() or lower(auth.jwt() ->> 'email') = 'fibeeconsultoradigital@gmail.com');

drop policy if exists "workspaces_delete_policy" on public.workspaces;
create policy "workspaces_delete_policy" on public.workspaces for delete
using (owner_id = auth.uid() or lower(auth.jwt() ->> 'email') = 'fibeeconsultoradigital@gmail.com');

-- Policies para Members
drop policy if exists "members_access_policy" on public.workspace_members;
create policy "members_access_policy" on public.workspace_members for all
using (
  user_id = auth.uid() 
  or lower(invite_email) = lower(auth.jwt() ->> 'email') 
  or is_member_of_workspace(workspace_id, auth.uid())
  or lower(auth.jwt() ->> 'email') = 'fibeeconsultoradigital@gmail.com'
);

-- Policies para Contacts
drop policy if exists "contacts_access_policy" on public.contacts;
create policy "contacts_access_policy" on public.contacts for all
using (is_member_of_workspace(workspace_id, auth.uid()) or lower(auth.jwt() ->> 'email') = 'fibeeconsultoradigital@gmail.com');

-- Grants de seguridad acotados
grant usage on schema public to authenticated;
grant select, insert, update, delete on all tables in schema public to authenticated;
grant usage, select on all sequences in schema public to authenticated;
