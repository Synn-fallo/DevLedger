import { Search, X } from 'lucide-react';
import type { BugStatus, BugCategory } from '../../lib/database.types';
import { BugStatusLabels, BugCategoryLabels } from '../../lib/database.types';

interface BugFiltersProps {
  projects: Array<{ id: string; name: string }>;
  selectedProjectId: string | null;
  onProjectChange: (projectId: string | null) => void;
  selectedStatus: BugStatus | 'all';
  onStatusChange: (status: BugStatus | 'all') => void;
  selectedCategory: BugCategory | 'all';
  onCategoryChange: (category: BugCategory | 'all') => void;
  selectedDifficulty: number | 'all';
  onDifficultyChange: (difficulty: number | 'all') => void;
  searchTerm: string;
  onSearchChange: (term: string) => void;
  onReset: () => void;
}

const difficultyOptions = [
  { value: 1, label: '😊 Facile' },
  { value: 2, label: '🤔 Moyen' },
  { value: 3, label: '😓 Difficile' },
  { value: 4, label: '💀 Très difficile' },
  { value: 5, label: '🔥 Extrême' }
];

export function BugFilters({
  projects,
  selectedProjectId,
  onProjectChange,
  selectedStatus,
  onStatusChange,
  selectedCategory,
  onCategoryChange,
  selectedDifficulty,
  onDifficultyChange,
  searchTerm,
  onSearchChange,
  onReset
}: BugFiltersProps) {
  const hasActiveFilters = selectedProjectId !== null || selectedStatus !== 'all' || selectedCategory !== 'all' || selectedDifficulty !== 'all' || searchTerm !== '';

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
      <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
        {/* Recherche */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Rechercher..."
            className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Projet */}
        <select
          value={selectedProjectId || ''}
          onChange={(e) => onProjectChange(e.target.value || null)}
          className="px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
        >
          <option value="">Tous les projets</option>
          {projects.map(project => (
            <option key={project.id} value={project.id}>{project.name}</option>
          ))}
        </select>

        {/* Statut */}
        <select
          value={selectedStatus}
          onChange={(e) => onStatusChange(e.target.value as BugStatus | 'all')}
          className="px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
        >
          <option value="all">Tous les statuts</option>
          {Object.entries(BugStatusLabels).map(([value, label]) => (
            <option key={value} value={value}>{label}</option>
          ))}
        </select>

        {/* Catégorie */}
        <select
          value={selectedCategory}
          onChange={(e) => onCategoryChange(e.target.value as BugCategory | 'all')}
          className="px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
        >
          <option value="all">Toutes catégories</option>
          {Object.entries(BugCategoryLabels).map(([value, label]) => (
            <option key={value} value={value}>{label}</option>
          ))}
        </select>

        {/* Difficulté */}
        <select
          value={selectedDifficulty === 'all' ? 'all' : selectedDifficulty}
          onChange={(e) => onDifficultyChange(e.target.value === 'all' ? 'all' : Number(e.target.value))}
          className="px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
        >
          <option value="all">Toutes difficultés</option>
          {difficultyOptions.map(opt => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      </div>

      {hasActiveFilters && (
        <div className="mt-3 flex justify-end">
          <button
            onClick={onReset}
            className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
          >
            <X className="w-3 h-3" />
            Réinitialiser les filtres
          </button>
        </div>
      )}
    </div>
  );
}