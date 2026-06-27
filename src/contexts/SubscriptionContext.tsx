import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './AuthContext';

interface SubscriptionContextType {
  plan: 'free' | 'pro' | 'enterprise';
  projectsLimit: number | null;
  collaboratorsLimit: number | null;
  isPro: boolean;
  isEnterprise: boolean;
  isFree: boolean;
  isSubscriptionActive: boolean; // NOUVEAU
  subscriptionEndsAt: Date | null; // NOUVEAU
  canCreateProject: (currentProjectsCount: number) => boolean;
  canAddCollaborator: (currentCollaboratorsCount: number) => boolean;
  loading: boolean;
  refreshSubscription: () => Promise<void>;
}

const SubscriptionContext = createContext<SubscriptionContextType | undefined>(undefined);

export function SubscriptionProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [plan, setPlan] = useState<'free' | 'pro' | 'enterprise'>('free');
  const [projectsLimit, setProjectsLimit] = useState<number | null>(10);
  const [collaboratorsLimit, setCollaboratorsLimit] = useState<number | null>(2);
  const [subscriptionEndsAt, setSubscriptionEndsAt] = useState<Date | null>(null);
  const [loading, setLoading] = useState(true);

  const loadSubscription = async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from('users_settings')
      .select('subscription_plan, projects_limit, collaborators_limit, subscription_ends_at')
      .eq('id', user.id)
      .single();

    if (error) {
      console.error('Error loading subscription:', error);
      setLoading(false);
      return;
    }

    if (data) {
      setPlan(data.subscription_plan as 'free' | 'pro' | 'enterprise');
      setProjectsLimit(data.projects_limit);
      setCollaboratorsLimit(data.collaborators_limit);
      setSubscriptionEndsAt(data.subscription_ends_at ? new Date(data.subscription_ends_at) : null);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadSubscription();
  }, [user]);

  const refreshSubscription = async () => {
    setLoading(true);
    await loadSubscription();
  };

  const isPro = plan === 'pro';
  const isEnterprise = plan === 'enterprise';
  const isFree = plan === 'free';
  
  // Vérifie si l'abonnement Pro est actif (non expiré)
  // Pour free/enterprise, retourne true (pas de notion d'expiration pour ces plans)
  const isSubscriptionActive = (): boolean => {
    if (isFree) return true;
    if (isEnterprise) return true;
    if (!subscriptionEndsAt) return false;
    return subscriptionEndsAt > new Date();
  };

  const canCreateProject = (currentProjectsCount: number): boolean => {
    if (isPro || isEnterprise) return true;
    if (projectsLimit === null) return true;
    return currentProjectsCount < projectsLimit;
  };

  const canAddCollaborator = (currentCollaboratorsCount: number): boolean => {
    if (isPro || isEnterprise) return true;
    if (collaboratorsLimit === null) return true;
    return currentCollaboratorsCount < collaboratorsLimit;
  };

  return (
    <SubscriptionContext.Provider value={{
      plan,
      projectsLimit,
      collaboratorsLimit,
      isPro,
      isEnterprise,
      isFree,
      isSubscriptionActive: isSubscriptionActive(),
      subscriptionEndsAt,
      canCreateProject,
      canAddCollaborator,
      loading,
      refreshSubscription
    }}>
      {children}
    </SubscriptionContext.Provider>
  );
}

export function useSubscription() {
  const context = useContext(SubscriptionContext);
  if (context === undefined) {
    throw new Error('useSubscription must be used within a SubscriptionProvider');
  }
  return context;
}