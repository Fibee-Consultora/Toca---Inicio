-- =============================================================================
-- TOCA — Eliminar restricciones de CHECK de roles y estados obsoletas
-- Ejecutar en: Supabase Dashboard → SQL Editor → Run
-- =============================================================================

-- Eliminar restricciones de CHECK de roles
ALTER TABLE public.workspace_members DROP CONSTRAINT IF EXISTS workspace_members_role_check;
ALTER TABLE public.workspace_team DROP CONSTRAINT IF EXISTS workspace_team_role_check;

-- Eliminar restricciones de CHECK de estados
ALTER TABLE public.workspace_members DROP CONSTRAINT IF EXISTS workspace_members_status_check;
ALTER TABLE public.workspace_team DROP CONSTRAINT IF EXISTS workspace_team_status_check;
