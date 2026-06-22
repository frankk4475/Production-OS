-- =======================================================================
-- PRODUCTION OS - SUPABASE DATABASE SCHEMA
-- Execute this SQL inside your Supabase SQL Editor to create tables.
-- =======================================================================

-- 1. Create Projects Table
CREATE TABLE IF NOT EXISTS public.projects (
    id TEXT PRIMARY KEY,
    title JSONB NOT NULL DEFAULT '{"th": "", "en": ""}'::jsonb,
    status TEXT NOT NULL DEFAULT 'pre-prod',
    director JSONB NOT NULL DEFAULT '{"th": "", "en": ""}'::jsonb,
    producer JSONB NOT NULL DEFAULT '{"th": "", "en": ""}'::jsonb,
    client TEXT NOT NULL DEFAULT '-',
    current_weather TEXT NOT NULL DEFAULT 'Sunny',
    weather_detail TEXT NOT NULL DEFAULT '',
    start_date TEXT NOT NULL,
    deadline TEXT NOT NULL DEFAULT '',
    total_budget TEXT NOT NULL DEFAULT '฿0',
    completion_percentage INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Create Crew Table
CREATE TABLE IF NOT EXISTS public.crew (
    id TEXT PRIMARY KEY,
    name JSONB NOT NULL DEFAULT '{"th": "", "en": ""}'::jsonb,
    role TEXT NOT NULL DEFAULT '',
    role_th TEXT NOT NULL DEFAULT '',
    email TEXT NOT NULL DEFAULT '',
    phone TEXT NOT NULL DEFAULT '',
    booked_dates JSONB NOT NULL DEFAULT '[]'::jsonb,
    tasks JSONB NOT NULL DEFAULT '{"th": [], "en": []}'::jsonb
);

-- 3. Create Scenes Table
CREATE TABLE IF NOT EXISTS public.scenes (
    id TEXT PRIMARY KEY,
    project_id TEXT REFERENCES public.projects(id) ON DELETE CASCADE,
    scene_number TEXT NOT NULL,
    setting TEXT NOT NULL,
    int_ext TEXT NOT NULL DEFAULT 'INT',
    day_night TEXT NOT NULL DEFAULT 'DAY',
    description JSONB NOT NULL DEFAULT '{"th": "", "en": ""}'::jsonb,
    "cast" JSONB NOT NULL DEFAULT '{"th": "", "en": ""}'::jsonb,
    location JSONB NOT NULL DEFAULT '{"th": "", "en": ""}'::jsonb,
    props JSONB NOT NULL DEFAULT '{"th": "", "en": ""}'::jsonb,
    wardrobe JSONB NOT NULL DEFAULT '{"th": "", "en": ""}'::jsonb,
    tech_notes JSONB NOT NULL DEFAULT '{"th": "", "en": ""}'::jsonb,
    status TEXT NOT NULL DEFAULT 'pending'
);

-- 4. Create Events Table
CREATE TABLE IF NOT EXISTS public.events (
    id TEXT PRIMARY KEY,
    project_id TEXT REFERENCES public.projects(id) ON DELETE CASCADE,
    title JSONB NOT NULL DEFAULT '{"th": "", "en": ""}'::jsonb,
    date TEXT NOT NULL,
    time TEXT NOT NULL DEFAULT '',
    location JSONB NOT NULL DEFAULT '{"th": "", "en": ""}'::jsonb,
    scene_number TEXT NOT NULL DEFAULT '',
    crew_assigned JSONB NOT NULL DEFAULT '[]'::jsonb,
    notes JSONB NOT NULL DEFAULT '{"th": "", "en": ""}'::jsonb
);

-- 5. Create Shot List Table
CREATE TABLE IF NOT EXISTS public.shot_list (
    id TEXT PRIMARY KEY,
    project_id TEXT REFERENCES public.projects(id) ON DELETE CASCADE,
    scene_id TEXT,
    shot_number TEXT NOT NULL,
    size TEXT NOT NULL DEFAULT '',
    angle TEXT NOT NULL DEFAULT '',
    movement TEXT NOT NULL DEFAULT '',
    equipment TEXT NOT NULL DEFAULT '',
    description JSONB NOT NULL DEFAULT '{"th": "", "en": ""}'::jsonb,
    cast_assigned JSONB NOT NULL DEFAULT '[]'::jsonb
);

-- 6. Create Completed Tasks Table
CREATE TABLE IF NOT EXISTS public.completed_tasks (
    project_id TEXT REFERENCES public.projects(id) ON DELETE CASCADE,
    task_key TEXT NOT NULL,
    value BOOLEAN NOT NULL DEFAULT FALSE,
    PRIMARY KEY (project_id, task_key)
);

-- 7. Create Scripts Table
CREATE TABLE IF NOT EXISTS public.scripts (
    project_id TEXT REFERENCES public.projects(id) ON DELETE CASCADE PRIMARY KEY,
    blocks JSONB NOT NULL DEFAULT '[]'::jsonb
);

-- 8. Create Story Outlines Table
CREATE TABLE IF NOT EXISTS public.story_outlines (
    project_id TEXT REFERENCES public.projects(id) ON DELETE CASCADE PRIMARY KEY,
    plotlines JSONB NOT NULL DEFAULT '[]'::jsonb,
    characters JSONB NOT NULL DEFAULT '[]'::jsonb,
    beats JSONB NOT NULL DEFAULT '[]'::jsonb
);

-- 9. Create Users / Admin Table
CREATE TABLE IF NOT EXISTS public.users (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    password TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'Crew',
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Disable Row Level Security (RLS) to allow direct read/write access via the anon key
ALTER TABLE public.projects DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.crew DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.scenes DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.events DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.shot_list DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.completed_tasks DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.scripts DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.story_outlines DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;
