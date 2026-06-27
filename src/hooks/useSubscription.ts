import { useSubscription } from '../contexts/SubscriptionContext';

export function useSubscription() {
  const subscription = useSubscription();
  return subscription;
}