import { Clock, Zap } from 'lucide-react';

interface ProjectKPIsProps {
  totalTime: number;
  totalTokens: number;
  totalValue: number;
  currency: string;
  formatTime: (minutes: number) => string;
  showKpis: boolean;
  visibility: string;
}

export function ProjectKPIs({ 
  totalTime, 
  totalTokens, 
  totalValue, 
  currency, 
  formatTime, 
  showKpis,
  visibility 
}: ProjectKPIsProps) {
  // Pour les projets publics, si showKpis est false, on affiche ***
  const shouldShow = showKpis;
  const isPublic = visibility === 'public';
  const isShared = visibility === 'shared';

  const displayValue = (value: string | number) => {
    if (!shouldShow && isPublic) return '***';
    if (!shouldShow && isShared) return '***';
    return value;
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-3 mb-2">
          <Clock className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          <span className="text-sm text-gray-600 dark:text-gray-400">Temps Total</span>
        </div>
        <p className="text-2xl font-bold text-gray-900 dark:text-white">
          {displayValue(formatTime(totalTime))}
        </p>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-3 mb-2">
          <Zap className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
          <span className="text-sm text-gray-600 dark:text-gray-400">Tokens IA</span>
        </div>
        <p className="text-2xl font-bold text-gray-900 dark:text-white">
          {displayValue(totalTokens.toLocaleString())}
        </p>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-3 mb-2">
          <span className="text-sm text-gray-600 dark:text-gray-400">Valeur Totale</span>
        </div>
        <p className="text-2xl font-bold text-gray-900 dark:text-white">
          {displayValue(`${totalValue.toLocaleString()} ${currency}`)}
        </p>
      </div>
    </div>
  );
}