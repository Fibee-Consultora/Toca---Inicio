-- =============================================================================
-- TOCA — Eliminar restricciones de CHECK de roles obsoletas
-- Ejecutar en: Supabase Dashboard → SQL Editor → Run
-- =============================================================================

-- 1. Consultar la definición actual de la restricción para tener registro en los logs
SELECT conname, pg_get_constraintdef(oid) AS constraint_definition
FROM pg_constraint
WHERE conname IN ('workspace_members_role_check', 'workspace_team_role_check');

-- 2. Eliminar las restricciones de CHECK que bloquean la inserción de roles
ALTER TABLE public.workspace_members DROP CONSTRAINT IF EXISTS workspace_members_role_check;
ALTER TABLE public.workspace_team DROP CONSTRAINT IF EXISTS workspace_team_role_check;

-- 3. Si existieran restricciones por tipo de datos enum, asegurar compatibilidad
-- (Normalmente con el DROP CONSTRAINT es suficiente si eran de tipo text)
