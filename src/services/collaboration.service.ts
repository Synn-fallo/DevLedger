import { supabase } from '../lib/supabase';

export interface CollaborationRequest {
  id: string;
  project_id: string;
  project_name?: string;
  requester_email: string;
  requester_name: string;
  message: string;
  status: 'pending' | 'accepted' | 'rejected' | 'cancelled';
  created_at: string;
  updated_at: string;
  unread_count?: number;
}

export interface CollaborationMessage {
  id: string;
  request_id: string;
  sender_email: string;
  sender_name: string;
  message: string;
  is_read: boolean;
  created_at: string;
}

class CollaborationService {
  // ==================== DEMANDES ====================
  
  async createRequest(
    projectId: string,
    requesterName: string,
    requesterEmail: string,
    message: string
  ): Promise<CollaborationRequest | null> {
    const { data, error } = await supabase
      .from('collaboration_requests')
      .insert({
        project_id: projectId,
        requester_name: requesterName,
        requester_email: requesterEmail,
        message
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating collaboration request:', error);
      return null;
    }
    return data as CollaborationRequest;
  }

  async getRequestsForProject(projectId: string): Promise<CollaborationRequest[]> {
    const { data, error } = await supabase
      .from('collaboration_requests')
      .select('*')
      .eq('project_id', projectId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching collaboration requests:', error);
      return [];
    }
    return data as CollaborationRequest[];
  }

  async getRequestsForUser(userId: string): Promise<CollaborationRequest[]> {
    // Récupérer d'abord les projets de l'utilisateur
    const { data: projects } = await supabase
      .from('projects')
      .select('id, name')
      .eq('user_id', userId);

    if (!projects || projects.length === 0) {
      return [];
    }

    const projectIds = projects.map(p => p.id);
    
    const { data, error } = await supabase
      .from('collaboration_requests')
      .select('*')
      .in('project_id', projectIds)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching collaboration requests for user:', error);
      return [];
    }

    // Ajouter le nom du projet
    const requestsWithProjectName = (data || []).map(request => ({
      ...request,
      project_name: projects.find(p => p.id === request.project_id)?.name || 'Projet inconnu'
    }));

    // Ajouter le nombre de messages non lus
    const requestsWithUnread = await Promise.all(
      requestsWithProjectName.map(async (request) => {
        const unreadCount = await this.getUnreadCount(request.id);
        return { ...request, unread_count: unreadCount };
      })
    );

    return requestsWithUnread;
  }

  async getRequestsForRequester(email: string): Promise<CollaborationRequest[]> {
    const { data, error } = await supabase
      .from('collaboration_requests')
      .select('*, projects(name)')
      .eq('requester_email', email)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching collaboration requests for requester:', error);
      return [];
    }

    return (data || []).map(request => ({
      ...request,
      project_name: (request.projects as any)?.name || 'Projet inconnu'
    })) as CollaborationRequest[];
  }

  async updateRequestStatus(
    requestId: string,
    status: 'pending' | 'accepted' | 'rejected' | 'cancelled'
  ): Promise<boolean> {
    const { error } = await supabase
      .from('collaboration_requests')
      .update({ status })
      .eq('id', requestId);

    if (error) {
      console.error('Error updating collaboration request status:', error);
      return false;
    }
    return true;
  }

  // ==================== MESSAGES ====================
  
  async sendMessage(
    requestId: string,
    senderName: string,
    senderEmail: string,
    message: string
  ): Promise<CollaborationMessage | null> {
    const { data, error } = await supabase
      .from('collaboration_messages')
      .insert({
        request_id: requestId,
        sender_name: senderName,
        sender_email: senderEmail,
        message
      })
      .select()
      .single();

    if (error) {
      console.error('Error sending message:', error);
      return null;
    }
    return data as CollaborationMessage;
  }

  async getMessages(requestId: string): Promise<CollaborationMessage[]> {
    const { data, error } = await supabase
      .from('collaboration_messages')
      .select('*')
      .eq('request_id', requestId)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching messages:', error);
      return [];
    }
    return data as CollaborationMessage[];
  }

  async markMessagesAsRead(requestId: string, userEmail: string): Promise<void> {
    const { error } = await supabase
      .from('collaboration_messages')
      .update({ is_read: true })
      .eq('request_id', requestId)
      .neq('sender_email', userEmail)
      .eq('is_read', false);

    if (error) {
      console.error('Error marking messages as read:', error);
    }
  }

  async getUnreadCount(requestId: string): Promise<number> {
    const { count, error } = await supabase
      .from('collaboration_messages')
      .select('*', { count: 'exact', head: true })
      .eq('request_id', requestId)
      .eq('is_read', false);

    if (error) {
      console.error('Error getting unread count:', error);
      return 0;
    }
    return count || 0;
  }

  // ==================== NOTIFICATIONS ====================
  
  async getPendingRequestsCount(userId: string): Promise<number> {
    const { data: projects } = await supabase
      .from('projects')
      .select('id')
      .eq('user_id', userId);

    if (!projects || projects.length === 0) {
      return 0;
    }

    const projectIds = projects.map(p => p.id);
    
    const { count, error } = await supabase
      .from('collaboration_requests')
      .select('*', { count: 'exact', head: true })
      .in('project_id', projectIds)
      .eq('status', 'pending');

    if (error) {
      console.error('Error getting pending requests count:', error);
      return 0;
    }
    return count || 0;
  }
}

export const collaborationService = new CollaborationService();