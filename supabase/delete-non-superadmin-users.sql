-- ==============================================================================
-- SCRIPT DE LIMPIEZA TOTAL: Borra todos los usuarios EXCEPTO al SuperAdmin
-- Ejecutar en Supabase -> SQL Editor
-- ==============================================================================

DO $$
DECLARE
    super_admin_email TEXT := 'fibeeconsultoradigital@gmail.com';
    super_admin_id UUID;
    deleted_count INT := 0;
BEGIN
    -- 1. Obtener el UUID del SuperAdmin si existe
    SELECT id INTO super_admin_id 
    FROM auth.users 
    WHERE lower(email) = lower(super_admin_email) 
    LIMIT 1;

    IF super_admin_id IS NOT NULL THEN
        RAISE NOTICE 'SuperAdmin encontrado con ID: %', super_admin_id;

        -- a) Eliminar historial de contactos de otros usuarios
        DELETE FROM public.contact_history 
        WHERE contact_id IN (
            SELECT id FROM public.contacts 
            WHERE workspace_id IN (
                SELECT id FROM public.workspaces WHERE owner_id != super_admin_id
            )
        );

        -- b) Eliminar contactos de espacios de trabajo que no son del SuperAdmin
        DELETE FROM public.contacts 
        WHERE workspace_id NOT IN (
            SELECT id FROM public.workspaces WHERE owner_id = super_admin_id
        );

        -- c) Eliminar miembros de equipos/invitaciones donde el espacio o usuario no sea SuperAdmin
        DELETE FROM public.workspace_members 
        WHERE workspace_id IN (
            SELECT id FROM public.workspaces WHERE owner_id != super_admin_id
        ) OR (user_id IS NOT NULL AND user_id != super_admin_id);

        -- d) Eliminar espacios de trabajo creados por otros usuarios
        DELETE FROM public.workspaces 
        WHERE owner_id != super_admin_id;

        -- e) Eliminar perfiles de otros usuarios
        DELETE FROM public.profiles 
        WHERE id != super_admin_id;

        -- f) Eliminar usuarios de auth.users excepto el SuperAdmin
        DELETE FROM auth.users 
        WHERE id != super_admin_id;

        GET DIAGNOSTICS deleted_count = ROW_COUNT;
        RAISE NOTICE '✅ Limpieza completada. Se eliminaron % usuario(s) secundarios. SuperAdmin preservado.', deleted_count;
    ELSE
        RAISE NOTICE '⚠️ No se encontró al SuperAdmin (%). Limpiando la base de datos por completo...', super_admin_email;

        DELETE FROM public.contact_history;
        DELETE FROM public.contacts;
        DELETE FROM public.workspace_members;
        DELETE FROM public.workspaces;
        DELETE FROM public.profiles;
        DELETE FROM auth.users;

        RAISE NOTICE '✅ Limpieza completa realizada. La base de datos quedó en blanco para registros limpios.';
    END IF;
END $$;
