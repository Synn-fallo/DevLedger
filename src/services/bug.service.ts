import { supabase } from '../lib/supabase';
import { storageService, type Attachment } from './storage.service';
import type { BugReport, BugStatus, BugCategory, BugEnvironment } from '../lib/database.types';

export interface CreateBugData {
  project_id: string;
  session_id?: string;
  title: string;
  description: string;
  category?: BugCategory;
  environment?: BugEnvironment;
  browser?: string;
  device?: string;
  app_version?: string;
  estimated_time_minutes?: number;
  tags?: string[];
  attachments?: Attachment[];
  specific_observations?: string;
  steps_taken?: string;          // NOUVEAU
  hypothesis_tested?: string;    // NOUVEAU
  solution?: string;             // NOUVEAU
  actual_time_minutes?: number;  // NOUVEAU
}

export interface UpdateBugData {
  status?: BugStatus;
  difficulty?: number;
  steps_taken?: string;
  hypothesis_tested?: string;
  solution?: string;
  resources_links?: string[];
  actual_time_minutes?: number;
  resolved_at?: string;
  attachments?: Attachment[];
  tags?: string[];
  specific_observations?: string;
}

class BugService {
  // Récupérer tous les bugs accessibles à l'utilisateur (pour la page Bugs globale)
  async getBugsByUser(userId: string): Promise<BugReport[]> {
    // Récupérer les projets où l'utilisateur est propriétaire
    const { data: ownedProjects } = await supabase
      .from('projects')
      .select('id, visibility, bugs_visible')
      .eq('user_id', userId);

    // Récupérer les projets partagés où l'utilisateur est invité
    const { data: sharedProjects } = await supabase
      .from('project_shares')
      .select('project_id')
      .eq('invited_email', (await supabase.auth.getUser()).data.user?.email);

    const sharedProjectIds = (sharedProjects || []).map(s => s.project_id);

    // Construire les conditions d'accès aux bugs
    const projectConditions = [];

    // 1. Projets du propriétaire (toujours accessibles)
    if (ownedProjects && ownedProjects.length > 0) {
      projectConditions.push(`project_id.in.(${ownedProjects.map(p => p.id).join(',')})`);
    }

    // 2. Projets partagés avec bugs_visible = true
    if (sharedProjectIds.length > 0) {
      const { data: projectsWithVisibleBugs } = await supabase
        .from('projects')
        .select('id')
        .in('id', sharedProjectIds)
        .eq('bugs_visible', true);
      
      if (projectsWithVisibleBugs && projectsWithVisibleBugs.length > 0) {
        projectConditions.push(`project_id.in.(${projectsWithVisibleBugs.map(p => p.id).join(',')})`);
      }
    }

    // 3. Projets publics avec bugs_visible = true
    const { data: publicProjectsWithBugs } = await supabase
      .from('projects')
      .select('id')
      .eq('visibility', 'public')
      .eq('bugs_visible', true);

    if (publicProjectsWithBugs && publicProjectsWithBugs.length > 0) {
      projectConditions.push(`project_id.in.(${publicProjectsWithBugs.map(p => p.id).join(',')})`);
    }

    if (projectConditions.length === 0) {
      return [];
    }

    const { data, error } = await supabase
      .from('bug_reports')
      .select('*')
      .or(projectConditions.join(','))
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching bugs:', error);
      return [];
    }
    return data || [];
  }

  // Récupérer tous les bugs d'un projet (avec vérification des droits)
  async getBugsByProject(projectId: string): Promise<BugReport[]> {
    const { data, error } = await supabase
      .from('bug_reports')
      .select('*')
      .eq('project_id', projectId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching bugs:', error);
      return [];
    }
    return data || [];
  }

  // Créer un nouveau bug
  async createBug(data: CreateBugData): Promise<BugReport | null> {
    const { data: bug, error } = await supabase
      .from('bug_reports')
      .insert({
        project_id: data.project_id,
        session_id: data.session_id,
        title: data.title,
        description: data.description,
        category: data.category || 'other',
        environment: data.environment || 'development',
        browser: data.browser,
        device: data.device,
        app_version: data.app_version,
        estimated_time_minutes: data.estimated_time_minutes || 0,
        tags: data.tags || [],
        attachments: data.attachments || [],
        specific_observations: data.specific_observations || null,
        steps_taken: data.steps_taken || null,           // NOUVEAU
        hypothesis_tested: data.hypothesis_tested || null, // NOUVEAU
        solution: data.solution || null,                 // NOUVEAU
        actual_time_minutes: data.actual_time_minutes || 0, // NOUVEAU
        created_by: (await supabase.auth.getUser()).data.user?.id
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating bug:', error);
      return null;
    }
    return bug;
  }

  // Mettre à jour un bug
  async updateBug(bugId: string, data: UpdateBugData): Promise<BugReport | null> {
    const updateData: any = { ...data };
    
    if (data.status === 'resolved' && !data.resolved_at) {
      updateData.resolved_at = new Date().toISOString();
    }
    
    const { data: bug, error } = await supabase
      .from('bug_reports')
      .update(updateData)
      .eq('id', bugId)
      .select()
      .single();

    if (error) {
      console.error('Error updating bug:', error);
      return null;
    }
    return bug;
  }

  // Supprimer un bug (supprime aussi les fichiers associés)
  async deleteBug(bugId: string): Promise<boolean> {
    // Récupérer les pièces jointes pour les supprimer du storage
    const bug = await this.getBugById(bugId);
    if (bug?.attachments && Array.isArray(bug.attachments) && bug.attachments.length > 0) {
      for (const attachment of bug.attachments) {
        await storageService.deleteFile(attachment.path);
      }
    }

    const { error } = await supabase
      .from('bug_reports')
      .delete()
      .eq('id', bugId);

    if (error) {
      console.error('Error deleting bug:', error);
      return false;
    }
    return true;
  }

  // Récupérer un bug par son ID
  async getBugById(bugId: string): Promise<BugReport | null> {
    const { data, error } = await supabase
      .from('bug_reports')
      .select('*')
      .eq('id', bugId)
      .single();

    if (error) {
      console.error('Error fetching bug:', error);
      return null;
    }
    return data;
  }

  // Ajouter une pièce jointe à un bug
  async addAttachment(bugId: string, file: File): Promise<BugReport | null> {
    const bug = await this.getBugById(bugId);
    if (!bug) return null;

    const attachment = await storageService.uploadFile(bugId, file);
    if (!attachment) return null;

    const currentAttachments = (bug.attachments as Attachment[]) || [];
    const updatedAttachments = [...currentAttachments, attachment];

    return this.updateBug(bugId, { attachments: updatedAttachments });
  }

  // Supprimer une pièce jointe d'un bug
  async removeAttachment(bugId: string, filePath: string): Promise<BugReport | null> {
    const bug = await this.getBugById(bugId);
    if (!bug) return null;

    await storageService.deleteFile(filePath);

    const currentAttachments = (bug.attachments as Attachment[]) || [];
    const updatedAttachments = currentAttachments.filter(a => a.path !== filePath);

    return this.updateBug(bugId, { attachments: updatedAttachments });
  }

  // Récupérer les statistiques des bugs pour un projet
  async getBugStats(projectId: string): Promise<{
    total: number;
    open: number;
    inProgress: number;
    resolved: number;
    closed: number;
    avgDifficulty: number;
    totalTimeSpent: number;
  }> {
    const bugs = await this.getBugsByProject(projectId);
    
    const open = bugs.filter(b => b.status === 'open').length;
    const inProgress = bugs.filter(b => b.status === 'in_progress').length;
    const resolved = bugs.filter(b => b.status === 'resolved').length;
    const closed = bugs.filter(b => b.status === 'closed').length;
    
    const bugsWithDifficulty = bugs.filter(b => b.difficulty !== null);
    const avgDifficulty = bugsWithDifficulty.length > 0
      ? bugsWithDifficulty.reduce((sum, b) => sum + (b.difficulty || 0), 0) / bugsWithDifficulty.length
      : 0;
    
    const totalTimeSpent = bugs.reduce((sum, b) => sum + (b.actual_time_minutes || 0), 0);

    return {
      total: bugs.length,
      open,
      inProgress,
      resolved,
      closed,
      avgDifficulty,
      totalTimeSpent
    };
  }

  // Récupérer les statistiques globales (tous projets du user)
  async getGlobalBugStats(userId: string): Promise<{
    total: number;
    open: number;
    resolved: number;
    avgDifficulty: number;
    totalTimeSpent: number;
  }> {
    const bugs = await this.getBugsByUser(userId);
    
    const open = bugs.filter(b => b.status === 'open' || b.status === 'in_progress').length;
    const resolved = bugs.filter(b => b.status === 'resolved' || b.status === 'closed').length;
    
    const bugsWithDifficulty = bugs.filter(b => b.difficulty !== null);
    const avgDifficulty = bugsWithDifficulty.length > 0
      ? bugsWithDifficulty.reduce((sum, b) => sum + (b.difficulty || 0), 0) / bugsWithDifficulty.length
      : 0;
    
    const totalTimeSpent = bugs.reduce((sum, b) => sum + (b.actual_time_minutes || 0), 0);

    return {
      total: bugs.length,
      open,
      resolved,
      avgDifficulty,
      totalTimeSpent
    };
  }
}

export const bugService = new BugService();