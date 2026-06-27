import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { useSubscription } from '../contexts/SubscriptionContext';

export function useProjectLimit() {
  const { user } = useAuth();
  const { canCreateProject, projectsLimit, isPro, isEnterprise, refreshSubscription } = useSubscription();
  const [currentProjectsCount, setCurrentProjectsCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const loadProjectsCount = async () => {
      const { count, error } = await supabase
        .from('projects')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .not('status', 'eq', 'archived');

      if (error) {
        console.error('Error loading projects count:', error);
      } else {
        setCurrentProjectsCount(count || 0);
      }
      setLoading(false);
    };

    loadProjectsCount();
  }, [user]);

  const canCreate = canCreateProject(currentProjectsCount);
  const remaining = projectsLimit === null ? null : Math.max(0, projectsLimit - currentProjectsCount);

  return {
    canCreate,
    currentProjectsCount,
    limit: projectsLimit,
    remaining,
    isUnlimited: isPro || isEnterprise,
    loading,
    refresh: refreshSubscription
  };
}