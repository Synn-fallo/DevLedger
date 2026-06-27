/*
================================================================================
DevLedger - Complete Database Schema for Migration
================================================================================
Version: 1.0
Date: 2026-03-05
Description: Complete PostgreSQL schema for DevLedger productivity OS
Compatible with: PostgreSQL 13+, Supabase, AWS RDS, Azure Database, etc.

This file contains the complete database schema for migrating DevLedger
from one database to another. Import this file to recreate all tables,
indexes, views, functions, and triggers.

================================================================================
MIGRATION INSTRUCTIONS:
1. Create a new empty PostgreSQL database
2. Run this entire SQL script from top to bottom
3. Verify all tables, indexes, views are created
4. Test with sample data before migrating production data
5. Use pg_dump for data migration: pg_dump source_db > backup.sql

================================================================================
TABLE OF CONTENTS:
1. Extensions
2. Schemas
3. Tables (Core Data)
4. Row Level Security (RLS)
5. Functions & Triggers
6. Indexes
7. Views
================================================================================
*/

-- ============================================================================
-- 1. EXTENSIONS
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";


-- ============================================================================
-- 2. SCHEMAS
-- ============================================================================

CREATE SCHEMA IF NOT EXISTS public;


-- ============================================================================
-- 3. CORE DATA TABLES
-- ============================================================================

-- 3.1 Users Settings Table
-- Stores user preferences and configuration
CREATE TABLE IF NOT EXISTS public.users_settings (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  hourly_rate numeric DEFAULT 0 CHECK (hourly_rate >= 0),
  token_price numeric DEFAULT 0 CHECK (token_price >= 0),
  currency text DEFAULT 'XOF' NOT NULL,
  display_mode text DEFAULT 'simple' CHECK (display_mode IN ('simple', 'advanced')),
  theme text DEFAULT 'dark' CHECK (theme IN ('dark', 'light')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

COMMENT ON TABLE public.users_settings IS 'User preferences and configuration for DevLedger';
COMMENT ON COLUMN public.users_settings.id IS 'Foreign key to auth.users, primary key';
COMMENT ON COLUMN public.users_settings.hourly_rate IS 'User hourly rate for project valuation (currency specified in currency field)';
COMMENT ON COLUMN public.users_settings.token_price IS 'Price per AI token for cost calculation';
COMMENT ON COLUMN public.users_settings.currency IS 'Currency code (ISO 4217): XOF, EUR, USD, GBP, CAD, etc.';
COMMENT ON COLUMN public.users_settings.display_mode IS 'UI display mode: simple (essential info) or advanced (detailed analytics)';
COMMENT ON COLUMN public.users_settings.theme IS 'Color scheme: dark (developer default) or light (modern SaaS)';


-- 3.2 Projects Table
-- Core projects tracking
CREATE TABLE IF NOT EXISTS public.projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text DEFAULT '',
  status text DEFAULT 'idea' CHECK (status IN ('idea', 'development', 'paused', 'deployed', 'archived', 'abandoned')),
  dev_account text DEFAULT '',
  dev_link text DEFAULT '',
  deploy_link text DEFAULT '',
  old_access_link text DEFAULT '',
  github_link text DEFAULT '',
  db_connected boolean DEFAULT false,
  general_observations text DEFAULT '',
  other_observations text DEFAULT '',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

COMMENT ON TABLE public.projects IS 'Developer projects with metadata and status tracking';
COMMENT ON COLUMN public.projects.id IS 'Unique project identifier (UUID)';
COMMENT ON COLUMN public.projects.user_id IS 'Owner user ID (foreign key to auth.users)';
COMMENT ON COLUMN public.projects.status IS 'Project lifecycle status';
COMMENT ON COLUMN public.projects.db_connected IS 'Whether project has connected database';


-- 3.3 Sessions Table
-- Work session tracking (Production Log Engine)
CREATE TABLE IF NOT EXISTS public.sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  date date NOT NULL DEFAULT CURRENT_DATE,
  time_bolt numeric DEFAULT 0 CHECK (time_bolt >= 0),
  time_chatgpt numeric DEFAULT 0 CHECK (time_chatgpt >= 0),
  time_perplexity numeric DEFAULT 0 CHECK (time_perplexity >= 0),
  time_other numeric DEFAULT 0 CHECK (time_other >= 0),
  other_tool_name text DEFAULT '',
  tokens_consumed numeric DEFAULT 0 CHECK (tokens_consumed >= 0),
  deployment_status text DEFAULT 'nok' CHECK (deployment_status IN ('ok', 'nok')),
  observations text DEFAULT '',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

COMMENT ON TABLE public.sessions IS 'Work sessions per project with time and token tracking';
COMMENT ON COLUMN public.sessions.id IS 'Unique session identifier (UUID)';
COMMENT ON COLUMN public.sessions.project_id IS 'Associated project (foreign key)';
COMMENT ON COLUMN public.sessions.date IS 'Session work date';
COMMENT ON COLUMN public.sessions.time_bolt IS 'Time spent on Bolt.new (minutes)';
COMMENT ON COLUMN public.sessions.time_chatgpt IS 'Time spent on ChatGPT (minutes)';
COMMENT ON COLUMN public.sessions.time_perplexity IS 'Time spent on Perplexity (minutes)';
COMMENT ON COLUMN public.sessions.time_other IS 'Time spent on other tools (minutes)';
COMMENT ON COLUMN public.sessions.tokens_consumed IS 'Total AI tokens consumed in session';
COMMENT ON COLUMN public.sessions.deployment_status IS 'Deployment result: ok or nok';


-- ============================================================================
-- 4. ROW LEVEL SECURITY (RLS)
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE public.users_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sessions ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- 4.1 Users Settings Policies
-- ============================================================================

CREATE POLICY "Users can view own settings" ON public.users_settings
  FOR SELECT TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own settings" ON public.users_settings
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own settings" ON public.users_settings
  FOR UPDATE TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can delete own settings" ON public.users_settings
  FOR DELETE TO authenticated
  USING (auth.uid() = id);

-- ============================================================================
-- 4.2 Projects Policies
-- ============================================================================

CREATE POLICY "Users can view own projects" ON public.projects
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own projects" ON public.projects
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own projects" ON public.projects
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own projects" ON public.projects
  FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

-- ============================================================================
-- 4.3 Sessions Policies
-- ============================================================================

CREATE POLICY "Users can view sessions of own projects" ON public.sessions
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.projects
      WHERE public.projects.id = public.sessions.project_id
      AND public.projects.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert sessions for own projects" ON public.sessions
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.projects
      WHERE public.projects.id = public.sessions.project_id
      AND public.projects.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update sessions of own projects" ON public.sessions
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.projects
      WHERE public.projects.id = public.sessions.project_id
      AND public.projects.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.projects
      WHERE public.projects.id = public.sessions.project_id
      AND public.projects.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete sessions of own projects" ON public.sessions
  FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.projects
      WHERE public.projects.id = public.sessions.project_id
      AND public.projects.user_id = auth.uid()
    )
  );


-- ============================================================================
-- 5. FUNCTIONS & TRIGGERS
-- ============================================================================

-- 5.1 Automatic updated_at Timestamp Function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION public.update_updated_at_column() IS 'Automatically update updated_at timestamp on row modification';

-- 5.2 Trigger for users_settings
CREATE TRIGGER update_users_settings_updated_at
  BEFORE UPDATE ON public.users_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- 5.3 Trigger for projects
CREATE TRIGGER update_projects_updated_at
  BEFORE UPDATE ON public.projects
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- 5.4 Trigger for sessions
CREATE TRIGGER update_sessions_updated_at
  BEFORE UPDATE ON public.sessions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();


-- ============================================================================
-- 6. INDEXES
-- ============================================================================

-- 6.1 Users Settings Indexes
CREATE INDEX IF NOT EXISTS idx_users_settings_id ON public.users_settings(id);

-- 6.2 Projects Indexes
CREATE INDEX IF NOT EXISTS idx_projects_user_id ON public.projects(user_id);
CREATE INDEX IF NOT EXISTS idx_projects_status ON public.projects(status);
CREATE INDEX IF NOT EXISTS idx_projects_created_at ON public.projects(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_projects_user_status ON public.projects(user_id, status);

-- 6.3 Sessions Indexes
CREATE INDEX IF NOT EXISTS idx_sessions_project_id ON public.sessions(project_id);
CREATE INDEX IF NOT EXISTS idx_sessions_date ON public.sessions(date DESC);
CREATE INDEX IF NOT EXISTS idx_sessions_project_date ON public.sessions(project_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_sessions_deployment ON public.sessions(project_id, deployment_status);


-- ============================================================================
-- 7. VIEWS
-- ============================================================================

-- 7.1 Project Statistics View
-- Aggregated statistics for all projects per user
CREATE OR REPLACE VIEW public.project_stats AS
SELECT
  p.id,
  p.user_id,
  p.name,
  p.status,
  COALESCE(SUM(s.time_bolt + s.time_chatgpt + s.time_perplexity + s.time_other), 0) as total_time_minutes,
  COALESCE(SUM(s.tokens_consumed), 0) as total_tokens,
  COUNT(s.id) as session_count,
  COUNT(CASE WHEN s.deployment_status = 'ok' THEN 1 END) as successful_deployments,
  MAX(s.date) as last_session_date,
  p.created_at,
  p.updated_at
FROM public.projects p
LEFT JOIN public.sessions s ON p.id = s.project_id
GROUP BY p.id, p.user_id, p.name, p.status, p.created_at, p.updated_at;

COMMENT ON VIEW public.project_stats IS 'Aggregated project statistics including time, tokens, and deployment success rate';

-- 7.2 User Dashboard View
-- Overall user statistics
CREATE OR REPLACE VIEW public.user_dashboard_stats AS
SELECT
  ps.id as user_id,
  COUNT(DISTINCT p.id) as total_projects,
  COUNT(DISTINCT CASE WHEN p.status = 'development' THEN p.id END) as active_projects,
  COALESCE(SUM(COALESCE(s_stats.total_time_minutes, 0)), 0) as total_time_minutes,
  COALESCE(SUM(COALESCE(s_stats.total_tokens, 0)), 0) as total_tokens,
  COALESCE(SUM(COALESCE(s_stats.session_count, 0)), 0) as total_sessions,
  COALESCE(SUM(COALESCE(s_stats.successful_deployments, 0)), 0) as total_successful_deployments,
  ps.hourly_rate,
  ps.token_price,
  ps.currency,
  ps.created_at,
  ps.updated_at
FROM public.users_settings ps
LEFT JOIN public.projects p ON ps.id = p.user_id
LEFT JOIN public.project_stats s_stats ON p.id = s_stats.id
GROUP BY ps.id, ps.hourly_rate, ps.token_price, ps.currency, ps.created_at, ps.updated_at;

COMMENT ON VIEW public.user_dashboard_stats IS 'Complete user dashboard statistics with aggregated metrics';


-- ============================================================================
-- 8. MIGRATION VERIFICATION QUERIES
-- ============================================================================

-- Run these queries to verify migration success:
-- SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';
-- SELECT COUNT(*) FROM information_schema.views WHERE table_schema = 'public';
-- SELECT COUNT(*) FROM information_schema.indexes WHERE table_schema = 'public';
-- SELECT * FROM pg_policies WHERE schemaname = 'public';

-- ============================================================================
-- END OF MIGRATION SCHEMA
-- ============================================================================
