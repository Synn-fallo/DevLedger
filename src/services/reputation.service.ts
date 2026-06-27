import { supabase } from '../lib/supabase';

export interface UserReputation {
  id: string;
  user_id: string;
  points: number;
  level: number;
  solutions_accepted: number;
  solutions_proposed: number;
  helpful_votes_received: number;
  helpful_votes_given: number;
}

export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  required_points: number;
  category: string;
}

class ReputationService {
  // ==================== RÉPUTATION ====================
  
  async getUserReputation(userId: string): Promise<UserReputation | null> {
    let { data, error } = await supabase
      .from('user_reputation')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error && error.code === 'PGRST116') {
      // Créer une entrée si elle n'existe pas
      const { data: newData, error: insertError } = await supabase
        .from('user_reputation')
        .insert({ user_id: userId, points: 0, level: 1 })
        .select()
        .single();
      
      if (insertError) {
        console.error('Error creating reputation:', insertError);
        return null;
      }
      return newData as UserReputation;
    }

    if (error) {
      console.error('Error fetching reputation:', error);
      return null;
    }
    return data as UserReputation;
  }

  async addPoints(userId: string, points: number, reason: string): Promise<void> {
    // Récupérer la réputation actuelle
    const reputation = await this.getUserReputation(userId);
    if (!reputation) return;

    const newPoints = reputation.points + points;
    const newLevel = Math.floor(newPoints / 100) + 1;

    await supabase
      .from('user_reputation')
      .update({ 
        points: newPoints, 
        level: newLevel,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', userId);

    // Vérifier les nouveaux badges
    await this.checkAndAwardBadges(userId, newPoints);
  }

  async incrementSolutionsProposed(userId: string): Promise<void> {
    const reputation = await this.getUserReputation(userId);
    if (!reputation) return;

    await supabase
      .from('user_reputation')
      .update({ 
        solutions_proposed: reputation.solutions_proposed + 1,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', userId);
    
    // Ajouter des points pour la proposition
    await this.addPoints(userId, 5, 'Proposition de solution');
  }

  async incrementSolutionsAccepted(userId: string): Promise<void> {
    const reputation = await this.getUserReputation(userId);
    if (!reputation) return;

    await supabase
      .from('user_reputation')
      .update({ 
        solutions_accepted: reputation.solutions_accepted + 1,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', userId);
    
    // Ajouter des points pour la solution acceptée
    await this.addPoints(userId, 25, 'Solution acceptée');
  }

  // ==================== BADGES ====================
  
  async getAvailableBadges(): Promise<Badge[]> {
    const { data, error } = await supabase
      .from('badges')
      .select('*')
      .order('required_points', { ascending: true });

    if (error) {
      console.error('Error fetching badges:', error);
      return [];
    }
    return data as Badge[];
  }

  async getUserBadges(userId: string): Promise<Badge[]> {
    const { data, error } = await supabase
      .from('user_badges')
      .select('badges(*)')
      .eq('user_id', userId);

    if (error) {
      console.error('Error fetching user badges:', error);
      return [];
    }
    return (data || []).map(item => item.badges as unknown as Badge);
  }

  async checkAndAwardBadges(userId: string, points: number): Promise<void> {
    const badges = await this.getAvailableBadges();
    const userBadges = await this.getUserBadges(userId);
    const userBadgeIds = new Set(userBadges.map(b => b.id));

    for (const badge of badges) {
      if (!userBadgeIds.has(badge.id) && points >= (badge.required_points || 0)) {
        await supabase
          .from('user_badges')
          .insert({ user_id: userId, badge_id: badge.id });
      }
    }
  }

  // ==================== VOTES ====================
  
  async voteSolution(responseId: string, isHelpful: boolean): Promise<{ success: boolean; alreadyVoted: boolean }> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return { success: false, alreadyVoted: false };

      // Vérifier si déjà voté
      const { data: existing } = await supabase
        .from('solution_votes')
        .select('id')
        .eq('response_id', responseId)
        .eq('user_id', user.id)
        .maybeSingle();

      if (existing) {
        return { success: false, alreadyVoted: true };
      }

      // Ajouter le vote
      const { error } = await supabase
        .from('solution_votes')
        .insert({
          response_id: responseId,
          user_id: user.id,
          is_helpful: isHelpful
        });

      if (error) throw error;

      // Récupérer le propriétaire de la solution pour lui ajouter des points
      const { data: response } = await supabase
        .from('technical_help_responses')
        .select('responder_email')
        .eq('id', responseId)
        .single();

      if (response && response.responder_email) {
        const { data: responderUser } = await supabase
          .from('auth.users')
          .select('id')
          .eq('email', response.responder_email)
          .single();

        if (responderUser) {
          await this.addPoints(responderUser.id, isHelpful ? 2 : 0, 'Vote utile sur solution');
          
          // Mettre à jour le compteur de votes reçus
          const reputation = await this.getUserReputation(responderUser.id);
          if (reputation && isHelpful) {
            await supabase
              .from('user_reputation')
              .update({ helpful_votes_received: reputation.helpful_votes_received + 1 })
              .eq('user_id', responderUser.id);
          }
        }
      }

      // Mettre à jour le compteur de votes donnés pour l'utilisateur actuel
      const currentReputation = await this.getUserReputation(user.id);
      if (currentReputation) {
        await supabase
          .from('user_reputation')
          .update({ helpful_votes_given: currentReputation.helpful_votes_given + 1 })
          .eq('user_id', user.id);
        
        // Ajouter des points pour avoir voté
        await this.addPoints(user.id, 1, 'Vote utile');
      }

      return { success: true, alreadyVoted: false };
    } catch (error) {
      console.error('Error voting:', error);
      return { success: false, alreadyVoted: false };
    }
  }

  async getVoteCounts(responseId: string): Promise<{ helpful: number; notHelpful: number }> {
    const { data, error } = await supabase
      .from('solution_votes')
      .select('is_helpful')
      .eq('response_id', responseId);

    if (error) {
      console.error('Error getting vote counts:', error);
      return { helpful: 0, notHelpful: 0 };
    }

    return {
      helpful: data.filter(v => v.is_helpful === true).length,
      notHelpful: data.filter(v => v.is_helpful === false).length
    };
  }

  async hasUserVoted(responseId: string): Promise<boolean> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;

    const { data, error } = await supabase
      .from('solution_votes')
      .select('id')
      .eq('response_id', responseId)
      .eq('user_id', user.id)
      .maybeSingle();

    if (error) return false;
    return !!data;
  }
}

export const reputationService = new ReputationService();