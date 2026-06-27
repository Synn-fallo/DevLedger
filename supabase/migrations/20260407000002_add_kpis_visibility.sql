-- =====================================================
-- MIGRATION: Ajout de show_kpis dans users_settings et projects
-- Date: 2026-04-07
-- =====================================================

BEGIN;

-- 1. Ajout de la colonne show_kpis dans users_settings (global)
ALTER TABLE users_settings 
ADD COLUMN IF NOT EXISTS show_kpis BOOLEAN DEFAULT TRUE;

-- 2. Ajout de la colonne show_kpis dans projects (override par projet)
ALTER TABLE projects 
ADD COLUMN IF NOT EXISTS show_kpis BOOLEAN DEFAULT NULL;

-- 3. Commentaires
COMMENT ON COLUMN users_settings.show_kpis IS 'Afficher les KPIs (Temps, Tokens, Valeur) globalement';
COMMENT ON COLUMN projects.show_kpis IS 'Afficher les KPIs pour ce projet (NULL = utilise global, TRUE = afficher, FALSE = masquer)';

COMMIT;