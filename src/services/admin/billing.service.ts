import { supabase } from '../../lib/supabase';

export interface UserPlanData {
  subscription_plan: 'free' | 'pro' | 'enterprise';
  subscription_ends_at: string | null;
  projects_limit: number | null;
  collaborators_limit: number | null;
}

/**
 * Service de gestion des abonnements pour l'administration
 */
export const billingService = {
  /**
   * Enregistre un événement d'abonnement dans subscription_events
   */
  async recordEvent({
    userId,
    eventType,
    newPlan,
    validUntil,
    amount = 0,
    paymentMethod = 'admin',
    paymentReference,
    adminId,
    notes,
    metadata
  }: {
    userId: string;
    eventType: 'admin_activate' | 'admin_deactivate' | 'admin_extend' | 'payment_success' | 'payment_failed' | 'expiration';
    newPlan: 'free' | 'pro' | 'enterprise';
    validUntil?: Date;
    amount?: number;
    paymentMethod?: 'admin' | 'stripe' | 'mobile_money';
    paymentReference?: string;
    adminId?: string;
    notes?: string;
    metadata?: any;
  }): Promise<{ success: boolean; error?: string; eventId?: string }> {
    try {
      const { data, error } = await supabase
        .from('subscription_events')
        .insert({
          user_id: userId,
          event_type: eventType,
          new_plan: newPlan,
          valid_until: validUntil?.toISOString(),
          amount_xof: amount,
          payment_method: paymentMethod,
          payment_reference: paymentReference,
          admin_id: adminId,
          notes,
          metadata
        })
        .select('id')
        .single();

      if (error) {
        console.error('Error recording subscription event:', error);
        return { success: false, error: error.message };
      }

      return { success: true, eventId: data.id };
    } catch (err) {
      console.error('Unexpected error in recordEvent:', err);
      return { success: false, error: err instanceof Error ? err.message : 'Unknown error' };
    }
  },

  /**
   * Définit le plan d'abonnement d'un utilisateur
   */
  async setUserPlan(
    userId: string, 
    plan: 'free' | 'pro' | 'enterprise', 
    durationDays: number = 30, 
    adminId?: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      let updateData: Partial<UserPlanData> = {
        subscription_plan: plan
      };

      let eventType: 'admin_activate' | 'admin_deactivate' = 'admin_activate';
      let validUntil: Date | undefined;
      let amount = 0;

      if (plan === 'free') {
        updateData = {
          subscription_plan: 'free',
          subscription_ends_at: null,
          projects_limit: 10,
          collaborators_limit: 2
        };
        eventType = 'admin_deactivate';
      } else if (plan === 'pro') {
        validUntil = new Date(Date.now() + durationDays * 24 * 60 * 60 * 1000);
        updateData = {
          subscription_plan: 'pro',
          subscription_ends_at: validUntil.toISOString(),
          projects_limit: null,
          collaborators_limit: null
        };
        eventType = 'admin_activate';
      } else if (plan === 'enterprise') {
        updateData = {
          subscription_plan: 'enterprise',
          subscription_ends_at: null,
          projects_limit: null,
          collaborators_limit: null
        };
        eventType = 'admin_activate';
      }

      // Mise à jour directe de users_settings (le trigger fera le reste)
      const { error } = await supabase
        .from('users_settings')
        .update(updateData)
        .eq('id', userId);

      if (error) {
        console.error('Error setting user plan:', error);
        return { success: false, error: error.message };
      }

      // Enregistrer l'événement dans l'historique
      await this.recordEvent({
        userId,
        eventType,
        newPlan: plan,
        validUntil,
        amount,
        paymentMethod: 'admin',
        adminId,
        notes: `Changement manuel vers ${plan} par admin`,
        metadata: { duration_days: durationDays }
      });

      return { success: true };
    } catch (err) {
      console.error('Unexpected error in setUserPlan:', err);
      return { success: false, error: err instanceof Error ? err.message : 'Unknown error' };
    }
  },

  /**
   * Prolonge l'abonnement Pro d'un utilisateur
   */
  async extendProSubscription(
    userId: string, 
    additionalDays: number = 30, 
    adminId?: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      // Récupérer la date d'expiration actuelle
      const { data, error: fetchError } = await supabase
        .from('users_settings')
        .select('subscription_ends_at')
        .eq('id', userId)
        .single();

      if (fetchError) {
        return { success: false, error: fetchError.message };
      }

      let newEndDate: Date;
      if (data?.subscription_ends_at) {
        newEndDate = new Date(data.subscription_ends_at);
        newEndDate.setDate(newEndDate.getDate() + additionalDays);
      } else {
        newEndDate = new Date();
        newEndDate.setDate(newEndDate.getDate() + additionalDays);
      }

      const { error: updateError } = await supabase
        .from('users_settings')
        .update({
          subscription_ends_at: newEndDate.toISOString(),
          subscription_plan: 'pro',
          projects_limit: null,
          collaborators_limit: null
        })
        .eq('id', userId);

      if (updateError) {
        return { success: false, error: updateError.message };
      }

      // Enregistrer l'événement de prolongation
      await this.recordEvent({
        userId,
        eventType: 'admin_extend',
        newPlan: 'pro',
        validUntil: newEndDate,
        amount: 0,
        paymentMethod: 'admin',
        adminId,
        notes: `Prolongation de ${additionalDays} jours par admin`,
        metadata: { additional_days: additionalDays, previous_end_date: data?.subscription_ends_at }
      });

      return { success: true };
    } catch (err) {
      console.error('Unexpected error in extendProSubscription:', err);
      return { success: false, error: err instanceof Error ? err.message : 'Unknown error' };
    }
  },

  /**
   * Enregistre une expiration automatique d'abonnement
   */
  async recordExpiration(userId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const result = await this.recordEvent({
        userId,
        eventType: 'expiration',
        newPlan: 'free',
        amount: 0,
        paymentMethod: 'admin',
        notes: 'Expiration automatique de l\'abonnement Pro'
      });

      return { success: result.success, error: result.error };
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : 'Unknown error' };
    }
  },

  /**
   * Récupère l'historique complet d'un utilisateur
   */
  async getUserSubscriptionHistory(userId: string): Promise<{ data: any[] | null; error?: string }> {
    try {
      const { data, error } = await supabase
        .from('subscription_events')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        return { data: null, error: error.message };
      }

      return { data };
    } catch (err) {
      return { data: null, error: err instanceof Error ? err.message : 'Unknown error' };
    }
  },

  /**
   * Récupère les périodes calculées d'un utilisateur
   */
  async getUserPeriods(userId: string): Promise<{ data: any[] | null; error?: string }> {
    try {
      const { data, error } = await supabase
        .rpc('get_user_periods', { user_uuid: userId });

      if (error) {
        return { data: null, error: error.message };
      }

      return { data };
    } catch (err) {
      return { data: null, error: err instanceof Error ? err.message : 'Unknown error' };
    }
  },

  /**
   * Récupère les informations d'abonnement d'un utilisateur
   */
  async getUserSubscription(userId: string): Promise<{ data: UserPlanData | null; error?: string }> {
    try {
      const { data, error } = await supabase
        .from('users_settings')
        .select('subscription_plan, subscription_ends_at, projects_limit, collaborators_limit')
        .eq('id', userId)
        .single();

      if (error) {
        return { data: null, error: error.message };
      }

      return { data: data as UserPlanData };
    } catch (err) {
      return { data: null, error: err instanceof Error ? err.message : 'Unknown error' };
    }
  }
};