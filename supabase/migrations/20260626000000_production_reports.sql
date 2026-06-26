-- =======================================================================
-- PRODUCTION OS - SUPABASE DATABASE MIGRATION SCHEMA (PRODUCTION REPORTS)
-- =======================================================================

CREATE TABLE IF NOT EXISTS public.production_reports (
    id TEXT PRIMARY KEY,
    project_id TEXT REFERENCES public.projects(id) ON DELETE CASCADE,
    type TEXT NOT NULL, -- 'camera', 'sound', 'dit', 'daily'
    created_at TIMESTAMPTZ DEFAULT now(),
    data JSONB NOT NULL DEFAULT '{}'::jsonb
);

-- Disable Row Level Security (RLS) to allow direct read/write access via the anon key
ALTER TABLE public.production_reports DISABLE ROW LEVEL SECURITY;
