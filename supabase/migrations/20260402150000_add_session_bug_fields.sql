-- =====================================================
-- MIGRATION: Ajout des champs pour sessions et bugs
-- Date: 2025-04-02
-- =====================================================

-- 1. Ajout des colonnes à la table sessions
ALTER TABLE sessions 
ADD COLUMN IF NOT EXISTS title VARCHAR(255),
ADD COLUMN IF NOT EXISTS activities_summary TEXT,
ADD COLUMN IF NOT EXISTS general_observation TEXT;

-- 2. Ajout de la colonne à la table bug_reports
ALTER TABLE bug_reports 
ADD COLUMN IF NOT EXISTS specific_observations TEXT;

-- 3. Commentaires pour documentation
COMMENT ON COLUMN sessions.title IS 'Titre de la session de travail';
COMMENT ON COLUMN sessions.activities_summary IS 'Résumé structuré des activités menées pendant la session';
COMMENT ON COLUMN sessions.general_observation IS 'Observation générale : difficultés, apprentissages, points d''attention';
COMMENT ON COLUMN bug_reports.specific_observations IS 'Observations spécifiques au bug : ce qui a bloqué, la leçon à retenir';