import { supabase } from '../lib/supabase';

export interface TechnicalHelpRequest {
  id: string;
  project_id: string;
  project_name?: string;
  title: string;
  description: string;
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  created_at: string;
  updated_at: string;
  resolved_at: string | null;
  responses?: TechnicalHelpResponse[];
}

export interface TechnicalHelpResponse {
  id: string;
  request_id: string;
  responder_email: string;
  responder_name: string;
  solution: string;
  is_accepted: boolean;
  created_at: string;
}

class TechnicalHelpService {
  // ==================== REQUÊTES ====================
  
  async createRequest(
    projectId: string,
    title: string,
    description: string
  ): Promise<TechnicalHelpRequest | null> {
    const { data, error } = await supabase
      .from('technical_help_requests')
      .insert({
        project_id: projectId,
        title,
        description
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating technical help request:', error);
      return null;
    }
    return data as TechnicalHelpRequest;
  }

  async getRequestsForProject(projectId: string): Promise<TechnicalHelpRequest[]> {
    const { data, error } = await supabase
      .from('technical_help_requests')
      .select('*')
      .eq('project_id', projectId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching help requests:', error);
      return [];
    }
    return data as TechnicalHelpRequest[];
  }

  async getOpenRequests(): Promise<TechnicalHelpRequest[]> {
    const { data, error } = await supabase
      .from('technical_help_requests')
      .select('*, projects(name)')
      .eq('status', 'open')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching open help requests:', error);
      return [];
    }

    return (data || []).map(request => ({
      ...request,
      project_name: (request.projects as any)?.name || 'Projet inconnu'
    })) as TechnicalHelpRequest[];
  }

  async getRequestById(requestId: string): Promise<TechnicalHelpRequest | null> {
    const { data, error } = await supabase
      .from('technical_help_requests')
      .select('*, projects(id, name, user_id)')
      .eq('id', requestId)
      .single();

    if (error) {
      console.error('Error fetching help request:', error);
      return null;
    }

    return {
      ...data,
      project_name: (data.projects as any)?.name || 'Projet inconnu'
    } as TechnicalHelpRequest;
  }

  async updateRequestStatus(
    requestId: string,
    status: 'open' | 'in_progress' | 'resolved' | 'closed'
  ): Promise<boolean> {
    const updateData: any = { status };
    if (status === 'resolved') {
      updateData.resolved_at = new Date().toISOString();
    }

    const { error } = await supabase
      .from('technical_help_requests')
      .update(updateData)
      .eq('id', requestId);

    if (error) {
      console.error('Error updating help request status:', error);
      return false;
    }
    return true;
  }

  // ==================== RÉPONSES ====================
  
  async addResponse(
    requestId: string,
    responderName: string,
    responderEmail: string,
    solution: string
  ): Promise<TechnicalHelpResponse | null> {
    const { data, error } = await supabase
      .from('technical_help_responses')
      .insert({
        request_id: requestId,
        responder_name: responderName,
        responder_email: responderEmail,
        solution
      })
      .select()
      .single();

    if (error) {
      console.error('Error adding response:', error);
      return null;
    }
    return data as TechnicalHelpResponse;
  }

  async getResponses(requestId: string): Promise<TechnicalHelpResponse[]> {
    const { data, error } = await supabase
      .from('technical_help_responses')
      .select('*')
      .eq('request_id', requestId)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching responses:', error);
      return [];
    }
    return data as TechnicalHelpResponse[];
  }

  async acceptResponse(responseId: string): Promise<boolean> {
    const { error } = await supabase
      .from('technical_help_responses')
      .update({ is_accepted: true })
      .eq('id', responseId);

    if (error) {
      console.error('Error accepting response:', error);
      return false;
    }
    return true;
  }

  async getAcceptedResponse(requestId: string): Promise<TechnicalHelpResponse | null> {
    const { data, error } = await supabase
      .from('technical_help_responses')
      .select('*')
      .eq('request_id', requestId)
      .eq('is_accepted', true)
      .maybeSingle();

    if (error) {
      console.error('Error fetching accepted response:', error);
      return null;
    }
    return data as TechnicalHelpResponse | null;
  }
}

export const technicalHelpService = new TechnicalHelpService();