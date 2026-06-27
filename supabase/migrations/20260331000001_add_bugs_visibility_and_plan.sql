-- =====================================================
-- MIGRATION: Ajout de bugs_visibility et development_plan
-- Date: 2025-03-31
-- =====================================================

-- 1. Ajouter les colonnes à la table projects
ALTER TABLE projects
ADD COLUMN bugs_visible BOOLEAN DEFAULT FALSE,
ADD COLUMN development_plan TEXT,
ADD COLUMN plan_updated_at TIMESTAMP WITH TIME ZONE;

-- 2. Créer un bucket de stockage pour les pièces jointes des bugs
-- (à exécuter manuellement dans l'interface Supabase si nécessaire)
-- INSERT INTO storage.buckets (id, name, public) VALUES ('bug-attachments', 'bug-attachments', false);

-- 3. Politiques RLS pour le bucket storage
-- (seront ajoutées après création du bucket)