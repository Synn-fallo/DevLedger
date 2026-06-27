import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

interface OwnerSubscriptionStatus {
  isActive: boolean;
  plan: string | null;
  endsAt: Date | null;
  loading: boolean;
  error: Error | null;
}

/**
 * Hook pour vérifier si le propriétaire d'un projet a un abonnement actif
 * @param ownerId - L'ID du propriétaire du projet
 * @returns Statut de l'abonnement du propriétaire
 */
export function useProjectOwnerSubscription(ownerId: string | undefined): OwnerSubscriptionStatus {
  const [status, setStatus] = useState<OwnerSubscriptionStatus>({
    isActive: true,
    plan: null,
    endsAt: null,
    loading: true,
    error: null
  });

  useEffect(() => {
    const checkOwnerSubscription = async () => {
      if (!ownerId) {
        setStatus(prev => ({ ...prev, loading: false, isActive: true }));
        return;
      }

      try {
        const { data, error } = await supabase
          .from('users_settings')
          .select('subscription_plan, subscription_ends_at')
          .eq('id', ownerId)
          .single();

        if (error) {
          console.error('Error checking owner subscription:', error);
          setStatus(prev => ({ ...prev, loading: false, isActive: true, error }));
          return;
        }

        const plan = data?.subscription_plan || 'free';
        const endsAt = data?.subscription_ends_at ? new Date(data.subscription_ends_at) : null;
        
        // L'abonnement est actif si :
        // - Le plan est free (pas d'expiration)
        // - Le plan est enterprise (pas d'expiration)
        // - Le plan est pro ET la date d'expiration est dans le futur
        let isActive = true;
        if (plan === 'pro' && endsAt) {
          isActive = endsAt > new Date();
        } else if (plan === 'pro' && !endsAt) {
          isActive = false; // Pro sans date d'expiration = inactif
        }
        // free et enterprise restent true

        setStatus({
          isActive,
          plan,
          endsAt,
          loading: false,
          error: null
        });
      } catch (err) {
        setStatus(prev => ({ ...prev, loading: false, isActive: true, error: err as Error }));
      }
    };

    checkOwnerSubscription();
  }, [ownerId]);

  return status;
}