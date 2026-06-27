import { LucideIcon } from 'lucide-react';
import { FeatureList } from './FeatureList';

interface PlanCardProps {
  name: string;
  price: number | null;
  priceLabel: string;
  icon: LucideIcon;
  features: string[];
  buttonLabel: string;
  buttonVariant: 'primary' | 'secondary' | 'outline';
  onAction: () => void;
  isCurrent: boolean;
}

export function PlanCard({
  name,
  price,
  priceLabel,
  icon: Icon,
  features,
  buttonLabel,
  buttonVariant,
  onAction,
  isCurrent
}: PlanCardProps) {
  const buttonClasses = {
    primary: 'bg-blue-600 hover:bg-blue-700 text-white',
    secondary: 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 cursor-default',
    outline: 'border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800'
  };

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-xl border overflow-hidden transition-all ${
      isCurrent ? 'border-blue-500 shadow-lg ring-2 ring-blue-500/20' : 'border-gray-200 dark:border-gray-700'
    }`}>
      <div className="p-6 text-center border-b border-gray-200 dark:border-gray-700">
        <Icon className={`w-12 h-12 mx-auto mb-3 ${
          name === 'Freemium' ? 'text-gray-500' : name === 'Pro' ? 'text-blue-500' : 'text-purple-500'
        }`} />
        <h3 className="text-xl font-bold text-gray-900 dark:text-white">{name}</h3>
        <p className="text-2xl font-bold text-gray-900 dark:text-white mt-2">{priceLabel}</p>
        {price !== null && (
          <p className="text-xs text-gray-500 mt-1">+ taxes applicables</p>
        )}
      </div>

      <div className="p-6">
        <FeatureList features={features} />
        
        <button
          onClick={onAction}
          disabled={isCurrent && buttonVariant === 'secondary'}
          className={`w-full mt-6 px-4 py-2 rounded-lg font-medium transition-colors ${
            buttonClasses[buttonVariant]
          } ${isCurrent && buttonVariant === 'secondary' ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          {buttonLabel}
        </button>
      </div>
    </div>
  );
}