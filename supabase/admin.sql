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
    delete from auth.users where id = user_id;
  else
    raise exception 'Unauthorized';
  end if;
end;
$$;

-- RPC temporal para inspeccionar columnas de cualquier tabla
create or replace function public.get_table_columns(tbl text)
returns table(col text)
language plpgsql
security definer
as $$
begin
  return query select column_name::text from information_schema.columns where table_schema = 'public' and table_name = tbl;
end;
$$;
