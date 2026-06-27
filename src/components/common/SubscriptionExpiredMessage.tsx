import { AlertTriangle } from 'lucide-react';

interface SubscriptionExpiredMessageProps {
  className?: string;
}

export function SubscriptionExpiredMessage({ className = '' }: SubscriptionExpiredMessageProps) {
  return (
    <div className={`flex flex-col items-center justify-center p-8 text-center ${className}`}>
      <div className="w-16 h-16 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center mb-4">
        <AlertTriangle className="w-8 h-8 text-amber-600 dark:text-amber-400" />
      </div>
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
        Abonnement expiré
      </h3>
      <p className="text-gray-600 dark:text-gray-400 max-w-md">
        Veuillez contacter le propriétaire de cette application pour renouveler l'accès.
      </p>
    </div>
  );
}