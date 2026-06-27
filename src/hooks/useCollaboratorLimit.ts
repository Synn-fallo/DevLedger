import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { useSubscription } from '../contexts/SubscriptionContext';

export function useCollaboratorLimit(projectId: string) {
  const { user } = useAuth();
  const { canAddCollaborator, collaboratorsLimit, isPro, isEnterprise, refreshSubscription } = useSubscription();
  const [currentCollaboratorsCount, setCurrentCollaboratorsCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user || !projectId) return;

    const loadCollaboratorsCount = async () => {
      const { count, error } = await supabase
        .from('project_shares')
        .select('*', { count: 'exact', head: true })
        .eq('project_id', projectId);

      if (error) {
        console.error('Error loading collaborators count:', error);
      } else {
        setCurrentCollaboratorsCount(count || 0);
      }
      setLoading(false);
    };

    loadCollaboratorsCount();
  }, [user, projectId]);

  const canAdd = canAddCollaborator(currentCollaboratorsCount);
  const remaining = collaboratorsLimit === null ? null : Math.max(0, collaboratorsLimit - currentCollaboratorsCount);

  return {
    canAdd,
    currentCollaboratorsCount,
    limit: collaboratorsLimit,
    remaining,
    isUnlimited: isPro || isEnterprise,
    loading,
    refresh: refreshSubscription
  };
}