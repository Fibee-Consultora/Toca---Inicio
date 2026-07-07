-- Panel Admin: plan por usuario
-- Ejecutar en Supabase → SQL Editor

alter table public.profiles
  add column if not exists plan text not null default 'Panal'
  check (plan in ('Néctar', 'Panal', 'Colmena', 'Apiario'));

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
