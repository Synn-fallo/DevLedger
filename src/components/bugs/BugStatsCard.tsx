import { Bug, Clock, AlertCircle, CheckCircle, TrendingUp } from 'lucide-react';

interface BugStatsCardProps {
  stats: {
    total: number;
    open: number;
    resolved: number;
    avgDifficulty: number;
    totalTimeSpent: number;
  };
  isLoading?: boolean;
}

export function BugStatsCard({ stats, isLoading = false }: BugStatsCardProps) {
  const formatTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours === 0) return `${mins} min`;
    return `${hours}h ${mins}m`;
  };

  if (isLoading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 animate-pulse">
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-4"></div>
        <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/2 mb-2"></div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
          <Bug className="w-5 h-5 text-red-500" />
          Suivi des bugs
        </h3>
        <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
          <span className="inline-block w-2 h-2 rounded-full bg-red-500"></span>
          <span className="ml-1">Ouvert</span>
          <span className="inline-block w-2 h-2 rounded-full bg-yellow-500 ml-2"></span>
          <span className="ml-1">En cours</span>
          <span className="inline-block w-2 h-2 rounded-full bg-green-500 ml-2"></span>
          <span className="ml-1">Résolu</span>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="text-center">
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.total}</p>
          <p className="text-xs text-gray-500 dark:text-gray-400">Total bugs</p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-bold text-red-600 dark:text-red-400">{stats.open}</p>
          <p className="text-xs text-gray-500 dark:text-gray-400">Ouverts</p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-bold text-green-600 dark:text-green-400">{stats.resolved}</p>
          <p className="text-xs text-gray-500 dark:text-gray-400">Résolus</p>
        </div>
        <div className="text-center">
          <div className="flex items-center justify-center gap-1">
            <TrendingUp className="w-4 h-4 text-gray-500" />
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.avgDifficulty.toFixed(1)}</p>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400">Difficulté moyenne</p>
        </div>
        <div className="text-center">
          <div className="flex items-center justify-center gap-1">
            <Clock className="w-4 h-4 text-gray-500" />
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{formatTime(stats.totalTimeSpent)}</p>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400">Temps total</p>
        </div>
      </div>
    </div>
  );
}