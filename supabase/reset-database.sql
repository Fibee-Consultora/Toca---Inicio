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
  plan text not null default 'Panal'
    check (plan in ('Néctar', 'Panal', 'Colmena', 'Apiario')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles
  add column if not exists plan text not null default 'Panal';

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
    coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name', split_part(new.email, '@', 1)),
    new.raw_user_meta_data ->> 'avatar_url',
    'Panal'
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

-- =============================================================================
-- Listo. Ahora:
-- 1. Entra a https://toca.fibee.pro con fibeeconsultoradigital@gmail.com
-- 2. Verás el tab Admin debajo de Estadísticas
-- =============================================================================
