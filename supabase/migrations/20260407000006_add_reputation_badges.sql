-- =====================================================
-- MIGRATION: Système de réputation et badges
-- Date: 2026-04-08
-- =====================================================

BEGIN;

-- 1. Table des réputations utilisateurs
CREATE TABLE IF NOT EXISTS user_reputation (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  points INTEGER DEFAULT 0,
  level INTEGER DEFAULT 1,
  solutions_accepted INTEGER DEFAULT 0,
  solutions_proposed INTEGER DEFAULT 0,
  helpful_votes_received INTEGER DEFAULT 0,
  helpful_votes_given INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id)
);

-- 2. Table des badges
CREATE TABLE IF NOT EXISTS badges (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100) NOT NULL,
  description TEXT,
  icon VARCHAR(50),
  required_points INTEGER,
  category VARCHAR(50),
  UNIQUE(name)
);

-- 3. Table des badges obtenus par les utilisateurs
CREATE TABLE IF NOT EXISTS user_badges (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  badge_id UUID NOT NULL REFERENCES badges(id) ON DELETE CASCADE,
  earned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, badge_id)
);

-- 4. Table des votes pour les solutions techniques
CREATE TABLE IF NOT EXISTS solution_votes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  response_id UUID NOT NULL REFERENCES technical_help_responses(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  ip_address VARCHAR(45),
  is_helpful BOOLEAN NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(response_id, user_id, ip_address)
);

-- 5. Badges prédéfinis
INSERT INTO badges (name, description, icon, required_points, category) VALUES
('Débutant', 'Premier pas dans la communauté', '🌟', 0, 'general'),
('Contributeur', 'A proposé une solution', '🤝', 10, 'help'),
('Expert', 'A proposé 10 solutions', '🎓', 100, 'help'),
('Résolveur', 'Solution acceptée', '✅', 50, 'help'),
('Star', 'A reçu 100 votes utiles', '⭐', 500, 'help'),
('Membre actif', 'A voté 50 fois', '💪', 200, 'engagement'),
('Bienveillant', 'A reçu 50 votes utiles', '❤️', 250, 'help'),
('Légende', 'A atteint 1000 points', '🏆', 1000, 'general');

-- 6. Index
CREATE INDEX IF NOT EXISTS idx_user_reputation_user_id ON user_reputation(user_id);
CREATE INDEX IF NOT EXISTS idx_user_reputation_points ON user_reputation(points DESC);
CREATE INDEX IF NOT EXISTS idx_user_badges_user_id ON user_badges(user_id);
CREATE INDEX IF NOT EXISTS idx_solution_votes_response_id ON solution_votes(response_id);
CREATE INDEX IF NOT EXISTS idx_solution_votes_is_helpful ON solution_votes(is_helpful);

-- 7. Trigger pour updated_at
CREATE OR REPLACE FUNCTION update_user_reputation_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_user_reputation_updated_at
BEFORE UPDATE ON user_reputation
FOR EACH ROW
EXECUTE FUNCTION update_user_reputation_updated_at();

-- 8. RLS
ALTER TABLE user_reputation ENABLE ROW LEVEL SECURITY;
ALTER TABLE badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE solution_votes ENABLE ROW LEVEL SECURITY;

-- Politiques
CREATE POLICY "Users can view their own reputation"
ON user_reputation FOR SELECT
USING (user_id = auth.uid());

CREATE POLICY "Anyone can view badges"
ON badges FOR SELECT
USING (true);

CREATE POLICY "Users can view their own badges"
ON user_badges FOR SELECT
USING (user_id = auth.uid());

CREATE POLICY "Anyone can view solution votes"
ON solution_votes FOR SELECT
USING (true);

CREATE POLICY "Authenticated users can vote"
ON solution_votes FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);

-- 9. Commentaires
COMMENT ON TABLE user_reputation IS 'Points de réputation des utilisateurs';
COMMENT ON TABLE badges IS 'Badges disponibles dans le système';
COMMENT ON TABLE user_badges IS 'Badges obtenus par les utilisateurs';
COMMENT ON TABLE solution_votes IS 'Votes d''utilité sur les solutions techniques';

COMMIT;