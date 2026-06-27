import { Bug } from 'lucide-react';

interface BugSectionProps {
  onNavigate: (page: string) => void;
}

export function BugSection({ onNavigate }: BugSectionProps) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 mt-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Bug className="w-5 h-5" />
            Rapports de bugs
          </h2>
          <p className="text-sm text-gray-500 mt-1">Gérez tous les bugs de ce projet</p>
        </div>
        <button onClick={() => onNavigate('bugs')} className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg">
          Voir tous les bugs →
        </button>
      </div>
    </div>
  );
}