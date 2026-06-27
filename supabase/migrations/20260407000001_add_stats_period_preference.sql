-- =====================================================
-- MIGRATION: Ajout de stats_period_type dans users_settings
-- Date: 2026-04-07
-- =====================================================

BEGIN;

-- Ajout de la colonne stats_period_type
ALTER TABLE users_settings 
ADD COLUMN IF NOT EXISTS stats_period_type VARCHAR(20) DEFAULT 'calendar';

-- Contrainte pour les valeurs valides
ALTER TABLE users_settings 
ADD CONSTRAINT check_stats_period_type 
CHECK (stats_period_type IN ('calendar', 'rolling'));

-- Commentaire
COMMENT ON COLUMN users_settings.stats_period_type IS 'Type de période pour les statistiques: calendar (calendaire) ou rolling (glissante)';

COMMIT;