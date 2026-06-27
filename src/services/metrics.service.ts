import { supabase } from '../lib/supabase';

export interface Comment {
  id: string;
  project_id: string;
  user_id: string | null;
  author_name: string;
  author_email: string;
  content: string;
  is_approved: boolean;
  created_at: string;
}

class MetricsService {
  // ==================== VUES ====================
  async addView(projectId: string): Promise<void> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const ipAddress = 'client-side';
      const userAgent = navigator.userAgent;

      await supabase.from('project_views').insert({
        project_id: projectId,
        user_id: user?.id || null,
        ip_address: ipAddress,
        user_agent: userAgent
      });
    } catch (error) {
      console.error('Error adding view:', error);
    }
  }

  async getViewsCount(projectId: string): Promise<number> {
    const { count, error } = await supabase
      .from('project_views')
      .select('*', { count: 'exact', head: true })
      .eq('project_id', projectId);

    if (error) {
      console.error('Error getting views count:', error);
      return 0;
    }
    return count || 0;
  }

  async getViewsByPeriod(projectId: string, startDate: Date, endDate: Date): Promise<number> {
    const { count, error } = await supabase
      .from('project_views')
      .select('*', { count: 'exact', head: true })
      .eq('project_id', projectId)
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString());

    if (error) {
      console.error('Error getting views by period:', error);
      return 0;
    }
    return count || 0;
  }

  // ==================== LIKES ====================
  async addLike(projectId: string): Promise<{ success: boolean; alreadyLiked: boolean }> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const ipAddress = 'client-side';

      const { data: existing } = await supabase
        .from('project_likes')
        .select('id')
        .eq('project_id', projectId)
        .eq('user_id', user?.id || null)
        .eq('ip_address', ipAddress)
        .maybeSingle();

      if (existing) {
        return { success: false, alreadyLiked: true };
      }

      const { error } = await supabase.from('project_likes').insert({
        project_id: projectId,
        user_id: user?.id || null,
        ip_address: ipAddress
      });

      if (error) throw error;
      return { success: true, alreadyLiked: false };
    } catch (error) {
      console.error('Error adding like:', error);
      return { success: false, alreadyLiked: false };
    }
  }

  async removeLike(projectId: string): Promise<boolean> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const ipAddress = 'client-side';

      const { error } = await supabase
        .from('project_likes')
        .delete()
        .eq('project_id', projectId)
        .eq('user_id', user?.id || null)
        .eq('ip_address', ipAddress);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error removing like:', error);
      return false;
    }
  }

  async getLikesCount(projectId: string): Promise<number> {
    const { count, error } = await supabase
      .from('project_likes')
      .select('*', { count: 'exact', head: true })
      .eq('project_id', projectId);

    if (error) {
      console.error('Error getting likes count:', error);
      return 0;
    }
    return count || 0;
  }

  async hasUserLiked(projectId: string): Promise<boolean> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const ipAddress = 'client-side';

      const { data, error } = await supabase
        .from('project_likes')
        .select('id')
        .eq('project_id', projectId)
        .eq('user_id', user?.id || null)
        .eq('ip_address', ipAddress)
        .maybeSingle();

      if (error) throw error;
      return !!data;
    } catch (error) {
      console.error('Error checking user like:', error);
      return false;
    }
  }

  // ==================== COMMENTAIRES ====================
  async addComment(projectId: string, authorName: string, authorEmail: string, content: string): Promise<Comment | null> {
    try {
      const { data, error } = await supabase
        .from('project_comments')
        .insert({
          project_id: projectId,
          author_name: authorName,
          author_email: authorEmail,
          content,
          is_approved: false
        })
        .select()
        .single();

      if (error) throw error;
      return data as Comment;
    } catch (error) {
      console.error('Error adding comment:', error);
      return null;
    }
  }

  async getComments(projectId: string, approvedOnly: boolean = true): Promise<Comment[]> {
    let query = supabase
      .from('project_comments')
      .select('*')
      .eq('project_id', projectId)
      .order('created_at', { ascending: false });

    if (approvedOnly) {
      query = query.eq('is_approved', true);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error getting comments:', error);
      return [];
    }
    return data as Comment[];
  }

  async approveComment(commentId: string): Promise<boolean> {
    const { error } = await supabase
      .from('project_comments')
      .update({ is_approved: true })
      .eq('id', commentId);

    if (error) {
      console.error('Error approving comment:', error);
      return false;
    }
    return true;
  }

  async deleteComment(commentId: string): Promise<boolean> {
    const { error } = await supabase
      .from('project_comments')
      .delete()
      .eq('id', commentId);

    if (error) {
      console.error('Error deleting comment:', error);
      return false;
    }
    return true;
  }

  async getCommentsCount(projectId: string, approvedOnly: boolean = true): Promise<number> {
    let query = supabase
      .from('project_comments')
      .select('*', { count: 'exact', head: true })
      .eq('project_id', projectId);

    if (approvedOnly) {
      query = query.eq('is_approved', true);
    }

    const { count, error } = await query;

    if (error) {
      console.error('Error getting comments count:', error);
      return 0;
    }
    return count || 0;
  }

  // ==================== BATCH OPTIMISATION (PHASE 1) ====================
  /**
   * Récupère les métriques pour plusieurs projets en BATCH (1 requête par table)
   * Élimine le problème N+1
   */
  async getProjectsMetricsBatch(
    projectIds: string[],
    userId?: string | null
  ): Promise<Map<string, { views: number; likes: number; comments: number; userHasLiked: boolean }>> {
    const result = new Map();
    
    if (projectIds.length === 0) return result;

    // Initialiser les résultats pour tous les projets
    projectIds.forEach(id => {
      result.set(id, { views: 0, likes: 0, comments: 0, userHasLiked: false });
    });

    // 1. Récupérer tous les compteurs de vues en une seule requête
    const { data: viewsData } = await supabase
      .from('project_views')
      .select('project_id')
      .in('project_id', projectIds);

    if (viewsData && viewsData.length > 0) {
      const viewsCount = new Map<string, number>();
      viewsData.forEach(view => {
        viewsCount.set(view.project_id, (viewsCount.get(view.project_id) || 0) + 1);
      });
      viewsCount.forEach((count, id) => {
        const current = result.get(id);
        if (current) {
          current.views = count;
          result.set(id, current);
        }
      });
    }

    // 2. Récupérer tous les compteurs de likes en une seule requête
    const { data: likesData } = await supabase
      .from('project_likes')
      .select('project_id')
      .in('project_id', projectIds);

    if (likesData && likesData.length > 0) {
      const likesCount = new Map<string, number>();
      likesData.forEach(like => {
        likesCount.set(like.project_id, (likesCount.get(like.project_id) || 0) + 1);
      });
      likesCount.forEach((count, id) => {
        const current = result.get(id);
        if (current) {
          current.likes = count;
          result.set(id, current);
        }
      });
    }

    // 3. Récupérer les likes de l'utilisateur connecté (si userId fourni)
    if (userId) {
      const { data: userLikes } = await supabase
        .from('project_likes')
        .select('project_id')
        .in('project_id', projectIds)
        .eq('user_id', userId);

      if (userLikes && userLikes.length > 0) {
        userLikes.forEach(like => {
          const current = result.get(like.project_id);
          if (current) {
            current.userHasLiked = true;
            result.set(like.project_id, current);
          }
        });
      }
    }

    // 4. Récupérer tous les compteurs de commentaires approuvés en une seule requête
    const { data: commentsData } = await supabase
      .from('project_comments')
      .select('project_id')
      .in('project_id', projectIds)
      .eq('is_approved', true);

    if (commentsData && commentsData.length > 0) {
      const commentsCount = new Map<string, number>();
      commentsData.forEach(comment => {
        commentsCount.set(comment.project_id, (commentsCount.get(comment.project_id) || 0) + 1);
      });
      commentsCount.forEach((count, id) => {
        const current = result.get(id);
        if (current) {
          current.comments = count;
          result.set(id, current);
        }
      });
    }

    return result;
  }

  // ==================== STATISTIQUES GLOBALES ====================
  async getProjectMetrics(projectId: string): Promise<{
    views: number;
    likes: number;
    comments: number;
    userHasLiked: boolean;
  }> {
    const [views, likes, comments, userHasLiked] = await Promise.all([
      this.getViewsCount(projectId),
      this.getLikesCount(projectId),
      this.getCommentsCount(projectId),
      this.hasUserLiked(projectId)
    ]);

    return { views, likes, comments, userHasLiked };
  }

  async getUserMetrics(userId: string): Promise<{
    totalViews: number;
    totalLikes: number;
    totalComments: number;
    projectsMetrics: Array<{ projectId: string; projectName: string; views: number; likes: number; comments: number }>;
  }> {
    const { data: projects } = await supabase
      .from('projects')
      .select('id, name')
      .eq('user_id', userId)
      .eq('visibility', 'public');

    if (!projects || projects.length === 0) {
      return { totalViews: 0, totalLikes: 0, totalComments: 0, projectsMetrics: [] };
    }

    const projectIds = projects.map(p => p.id);
    const metricsMap = await this.getProjectsMetricsBatch(projectIds, userId);

    const projectsMetrics = projects.map(project => {
      const metrics = metricsMap.get(project.id) || { views: 0, likes: 0, comments: 0, userHasLiked: false };
      return {
        projectId: project.id,
        projectName: project.name,
        views: metrics.views,
        likes: metrics.likes,
        comments: metrics.comments
      };
    });

    return {
      totalViews: projectsMetrics.reduce((sum, p) => sum + p.views, 0),
      totalLikes: projectsMetrics.reduce((sum, p) => sum + p.likes, 0),
      totalComments: projectsMetrics.reduce((sum, p) => sum + p.comments, 0),
      projectsMetrics
    };
  }
}

export const metricsService = new MetricsService();