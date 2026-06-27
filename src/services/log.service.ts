import { supabase } from '../lib/supabase';

export type LogAction = 
  | 'login'
  | 'logout'
  | 'project_create'
  | 'project_update'
  | 'project_delete'
  | 'project_view'
  | 'session_create'
  | 'session_update'
  | 'session_delete'
  | 'bug_create'
  | 'bug_update'
  | 'bug_delete'
  | 'subscription_change'
  | 'admin_user_update'
  | 'admin_plan_change'
  | 'settings_update';

export interface LogDetails {
  [key: string]: any;
}

class LogService {
  async add(
    action: LogAction,
    entityType?: string,
    entityId?: string,
    details?: LogDetails
  ): Promise<void> {
    try {
      // Récupérer l'utilisateur courant
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) return;

      // Récupérer l'IP et le user-agent (côté client uniquement)
      const ipAddress = 'client-side';
      const userAgent = navigator.userAgent;

      await supabase.from('logs').insert({
        user_id: user.id,
        user_email: user.email,
        action,
        entity_type: entityType,
        entity_id: entityId,
        details,
        ip_address: ipAddress,
        user_agent: userAgent
      });
    } catch (error) {
      console.error('Error adding log:', error);
    }
  }

  async getLogs(filters?: {
    userId?: string;
    action?: LogAction;
    startDate?: Date;
    endDate?: Date;
    limit?: number;
  }): Promise<any[]> {
    let query = supabase
      .from('logs')
      .select('*')
      .order('created_at', { ascending: false });

    if (filters?.userId) {
      query = query.eq('user_id', filters.userId);
    }
    if (filters?.action) {
      query = query.eq('action', filters.action);
    }
    if (filters?.startDate) {
      query = query.gte('created_at', filters.startDate.toISOString());
    }
    if (filters?.endDate) {
      query = query.lte('created_at', filters.endDate.toISOString());
    }
    if (filters?.limit) {
      query = query.limit(filters.limit);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching logs:', error);
      return [];
    }
    return data || [];
  }

  async getLogsByUser(userId: string): Promise<any[]> {
    return this.getLogs({ userId });
  }

  async getLogsByAction(action: LogAction): Promise<any[]> {
    return this.getLogs({ action });
  }
}

export const logService = new LogService();