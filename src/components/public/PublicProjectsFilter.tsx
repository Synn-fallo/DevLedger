import { Search } from 'lucide-react';
import type { SortOption, FilterCategory } from '../../services/metrics.service';

interface PublicProjectsFilterProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  categoryFilter: FilterCategory;
  onCategoryChange: (value: FilterCategory) => void;
  sortBy: SortOption;
  onSortChange: (value: SortOption) => void;
  loading?: boolean;
}

const categoryLabels: Record<FilterCategory, string> = {
  all: 'Tous les projets',
  development: '🔄 En développement',
  deployed: '✅ Déployés',
  idea: '💡 Idées'
};

const sortLabels: Record<SortOption, string> = {
  recent: '📅 Les plus récents',
  views: '👁️ Les plus vus',
  likes: '❤️ Les plus likés',
  comments: '💬 Les plus commentés'
};

export function PublicProjectsFilter({
  searchTerm,
  onSearchChange,
  categoryFilter,
  onCategoryChange,
  sortBy,
  onSortChange,
  loading
}: PublicProjectsFilterProps) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700 mb-8">
      <div className="flex flex-col lg:flex-row gap-4">
        {/* Champ de recherche */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Rechercher un projet par nom ou description..."
            disabled={loading}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
          />
        </div>
        
        {/* Filtre par catégorie */}
        <select
          value={categoryFilter}
          onChange={(e) => onCategoryChange(e.target.value as FilterCategory)}
          disabled={loading}
          className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
        >
          {Object.entries(categoryLabels).map(([value, label]) => (
            <option key={value} value={value}>
              📁 {label}
            </option>
          ))}
        </select>
        
        {/* Tri */}
        <select
          value={sortBy}
          onChange={(e) => onSortChange(e.target.value as SortOption)}
          disabled={loading}
          className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
        >
          {Object.entries(sortLabels).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}