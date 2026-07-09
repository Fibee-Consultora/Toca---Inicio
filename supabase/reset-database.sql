-- =============================================================================
-- TOCA — Reset completo de Supabase (empezar de cero)
-- Ejecutar en: Supabase Dashboard → SQL Editor → Run
--
-- ⚠️ BORRA TODOS los usuarios y datos. Úsalo solo si quieres empezar limpio.
-- =============================================================================

-- 1. Borrar datos de app (orden por dependencias)
delete from public.contact_history;
delete from public.contacts;
delete from public.workspace_team;
delete from public.workspace_members;
delete from public.workspaces;
delete from public.profiles;

-- 2. Borrar todas las cuentas de login (Google, etc.)
delete from auth.users;

-- =============================================================================
-- 3. Asegurar tabla profiles + columna plan
-- =============================================================================

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text,
  full_name text,
  avatar_url text,
  plan text not null default 'Néctar'
    check (plan in ('Néctar', 'Panal', 'Colmena', 'Apiario')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles
  add column if not exists plan text not null default 'Néctar';

-- Quitar check viejo si existe y recrear (por si la columna ya estaba sin check)
alter table public.profiles drop constraint if exists profiles_plan_check;
alter table public.profiles
  add constraint profiles_plan_check
  check (plan in ('Néctar', 'Panal', 'Colmena', 'Apiario'));

-- =============================================================================
-- 4. RLS profiles
-- =============================================================================

alter table public.profiles enable row level security;

drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own"
  on public.profiles for select
  using (auth.uid() = id);

drop policy if exists "profiles_upsert_own" on public.profiles;
drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own"
  on public.profiles for update
  using (auth.uid() = id);

-- Admin total: fibeeconsultoradigital@gmail.com
drop policy if exists "profiles_admin_select_all" on public.profiles;
create policy "profiles_admin_select_all"
  on public.profiles for select
  using (lower(auth.jwt() ->> 'email') = 'fibeeconsultoradigital@gmail.com');

drop policy if exists "profiles_admin_update_any" on public.profiles;
create policy "profiles_admin_update_any"
  on public.profiles for update
  using (lower(auth.jwt() ->> 'email') = 'fibeeconsultoradigital@gmail.com')
  with check (lower(auth.jwt() ->> 'email') = 'fibeeconsultoradigital@gmail.com');

drop policy if exists "profiles_admin_delete_any" on public.profiles;
create policy "profiles_admin_delete_any"
  on public.profiles for delete
  using (lower(auth.jwt() ->> 'email') = 'fibeeconsultoradigital@gmail.com');

-- =============================================================================
-- 5. Trigger: crear perfil al registrarse con Google
-- =============================================================================

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
    coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name', split_part(new.email, '@', 1)) || '|plan:Gratuito|agents:0|packs:0|status:Activo|pay:2026-07-01|factura:true',
    new.raw_user_meta_data ->> 'avatar_url',
    'Néctar'
  )
  on conflict (id) do update set
    email = excluded.email,
    full_name = coalesce(excluded.full_name, profiles.full_name),
    avatar_url = coalesce(excluded.avatar_url, profiles.avatar_url),
    updated_at = now();
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute function public.handle_new_user();

-- RPC: Obtener todos los usuarios registrados en Supabase Auth, cruzados con sus perfiles
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
      greatest(
        (
          select count(*)::int 
          from public.workspace_team wt 
          where wt.workspace_id in (select w.id from public.workspaces w where w.owner_id = u.id)
        ),
        (
          select count(*)::int 
          from public.workspace_members wm 
          where wm.workspace_id in (select w.id from public.workspaces w where w.owner_id = u.id)
        )
      )::int as u_agents_count
    from auth.users u
    left join public.profiles p on u.id = p.id
    order by u.created_at desc;
  else
    raise exception 'Unauthorized';
  end if;
end;
$$;

-- RPC: Eliminar cuenta permanentemente de auth.users (cascada a profiles)
create or replace function public.admin_delete_user(user_id uuid)
returns void
language plpgsql
security definer
as $$
begin
  if exists (select 1 from public.profiles where id = auth.uid() and plan = 'SuperAdmin') or (select email from auth.users where id = auth.uid()) = 'fibeeconsultoradigital@gmail.com' then
    -- 1. Eliminar historial de contactos
    delete from public.contact_history where contact_id in (
      select id from public.contacts where workspace_id in (
        select id from public.workspaces where owner_id = admin_delete_user.user_id
      )
    );
    -- 2. Eliminar contactos
    delete from public.contacts where workspace_id in (
      select id from public.workspaces where owner_id = admin_delete_user.user_id
    );
    -- 3. Eliminar miembros del equipo
    delete from public.workspace_members where workspace_id in (
      select id from public.workspaces where owner_id = admin_delete_user.user_id
    ) or user_id = admin_delete_user.user_id;
    -- 4. Eliminar equipos
    delete from public.workspace_team where workspace_id in (
      select id from public.workspaces where owner_id = admin_delete_user.user_id
    );
    -- 5. Eliminar marcas (workspaces)
    delete from public.workspaces where owner_id = admin_delete_user.user_id;
    -- 6. Eliminar perfil de usuario
    delete from public.profiles where id = admin_delete_user.user_id;
    -- 7. Eliminar de la autenticación de Supabase
    delete from auth.users where id = admin_delete_user.user_id;
  else
    raise exception 'Unauthorized';
  end if;
end;
$$;

-- =============================================================================
-- Listo. Ahora:
-- 1. Entra a https://toca.fibee.pro con fibeeconsultoradigital@gmail.com
-- 2. Verás el tab Admin debajo de Estadísticas
-- =============================================================================
