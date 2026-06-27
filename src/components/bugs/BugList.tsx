import { useState, useMemo } from 'react';
import { Bug, Plus, Trash2, Edit2, Paperclip, Eye, Search, ChevronUp, ChevronDown } from 'lucide-react';
import type { BugReport, BugStatus, BugCategory } from '../../lib/database.types';
import { BugStatusLabels, BugCategoryLabels, BugDifficultyLabels } from '../../lib/database.types';
import { formatDate } from '../../lib/dateUtils';

interface BugListProps {
  bugs: BugReport[];
  onEdit: (bug: BugReport) => void;
  onDelete: (bugId: string) => void;
  onViewDetails: (bug: BugReport) => void;
  canEdit: boolean;
  onAdd: () => void;
  showProjectName?: boolean;
  getProjectName?: (projectId: string) => string;
}

type SortField = 'created_at' | 'status' | 'difficulty' | 'actual_time_minutes';
type SortOrder = 'asc' | 'desc';

const statusColors: Record<BugStatus, string> = {
  open: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300',
  in_progress: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300',
  resolved: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300',
  closed: 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
};

// Fonction pour extraire le suffixe (ex: PROJ-001/BUG-0001 → BUG-0001)
const getShortReference = (reference: string | null): string => {
  if (!reference) return '—';
  const parts = reference.split('/');
  return parts[parts.length - 1] || '—';
};

export function BugList({ 
  bugs, 
  onEdit, 
  onDelete, 
  onViewDetails, 
  canEdit, 
  onAdd,
  showProjectName = false,
  getProjectName
}: BugListProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState<SortField>('created_at');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [statusFilter, setStatusFilter] = useState<BugStatus | 'all'>('all');
  const [categoryFilter, setCategoryFilter] = useState<BugCategory | 'all'>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const formatTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours === 0) return `${mins} min`;
    return `${hours}h ${mins}m`;
  };

  const getAttachmentsCount = (attachments: any) => {
    if (!attachments) return 0;
    if (Array.isArray(attachments)) return attachments.length;
    return 0;
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
  };

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return null;
    return sortOrder === 'asc' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />;
  };

  const filteredAndSortedBugs = useMemo(() => {
    let filtered = [...bugs];

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(b =>
        b.title.toLowerCase().includes(term) ||
        b.description.toLowerCase().includes(term) ||
        (b.reference || '').toLowerCase().includes(term)
      );
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(b => b.status === statusFilter);
    }

    if (categoryFilter !== 'all') {
      filtered = filtered.filter(b => b.category === categoryFilter);
    }

    filtered.sort((a, b) => {
      let aVal: any, bVal: any;
      switch (sortField) {
        case 'created_at':
          aVal = new Date(a.created_at).getTime();
          bVal = new Date(b.created_at).getTime();
          break;
        case 'status':
          aVal = a.status;
          bVal = b.status;
          break;
        case 'difficulty':
          aVal = a.difficulty || 0;
          bVal = b.difficulty || 0;
          break;
        case 'actual_time_minutes':
          aVal = a.actual_time_minutes;
          bVal = b.actual_time_minutes;
          break;
        default:
          aVal = a.created_at;
          bVal = b.created_at;
      }
      if (sortOrder === 'asc') return aVal > bVal ? 1 : -1;
      return aVal < bVal ? 1 : -1;
    });

    return filtered;
  }, [bugs, searchTerm, sortField, sortOrder, statusFilter, categoryFilter]);

  const totalPages = Math.ceil(filteredAndSortedBugs.length / itemsPerPage);
  const paginatedBugs = filteredAndSortedBugs.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Rechercher par titre, référence, description..."
            className="w-full pl-9 pr-4 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
          />
        </div>
        
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as BugStatus | 'all')}
          className="px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
        >
          <option value="all">Tous les statuts</option>
          <option value="open">🔴 Ouvert</option>
          <option value="in_progress">🟡 En cours</option>
          <option value="resolved">🟢 Résolu</option>
          <option value="closed">⚪ Fermé</option>
        </select>

        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value as BugCategory | 'all')}
          className="px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
        >
          <option value="all">Toutes catégories</option>
          <option value="ui">🎨 UI/UX</option>
          <option value="api">🔌 API</option>
          <option value="database">🗄️ Base de données</option>
          <option value="logic">⚙️ Logique métier</option>
          <option value="performance">⚡ Performance</option>
          <option value="security">🔒 Sécurité</option>
          <option value="other">📦 Autre</option>
        </select>
      </div>

      <div className="hidden md:grid grid-cols-12 gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-700 rounded-lg text-sm font-medium">
        <div className="col-span-2 cursor-pointer flex items-center gap-1" onClick={() => handleSort('created_at')}>
          Date <SortIcon field="created_at" />
        </div>
        <div className="col-span-2">Référence</div>
        <div className="col-span-3">Titre</div>
        <div className="col-span-2 cursor-pointer flex items-center gap-1" onClick={() => handleSort('status')}>
          Statut <SortIcon field="status" />
        </div>
        <div className="col-span-2 cursor-pointer flex items-center gap-1" onClick={() => handleSort('difficulty')}>
          Difficulté <SortIcon field="difficulty" />
        </div>
        <div className="col-span-1 text-center">Actions</div>
      </div>

      {paginatedBugs.length === 0 ? (
        <div className="text-center py-8 text-gray-500 dark:text-gray-400">Aucun bug trouvé</div>
      ) : (
        paginatedBugs.map((bug) => {
          const attachmentsCount = getAttachmentsCount(bug.attachments);
          
          return (
            <div
              key={bug.id}
              className="grid grid-cols-1 md:grid-cols-12 gap-2 p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
            >
              <div className="md:col-span-2 text-sm text-gray-700 dark:text-gray-300">
                {formatDate(bug.created_at, 'date')}
              </div>
              <div className="md:col-span-2 text-sm font-mono text-gray-500">
                {getShortReference(bug.reference)}
              </div>
              <div className="md:col-span-3">
                <div className="font-medium text-gray-900 dark:text-white truncate">{bug.title}</div>
                <div className="text-xs text-gray-500 mt-1 line-clamp-1">{bug.description}</div>
              </div>
              <div className="md:col-span-2">
                <span className={`text-xs px-2 py-1 rounded-full ${statusColors[bug.status]}`}>
                  {BugStatusLabels[bug.status]}
                </span>
              </div>
              <div className="md:col-span-2 text-sm text-gray-700 dark:text-gray-300">
                {bug.difficulty ? BugDifficultyLabels[bug.difficulty] : '—'}
              </div>
              <div className="md:col-span-1 flex justify-center gap-2">
                <button
                  onClick={() => onViewDetails(bug)}
                  className="p-1 text-gray-500 hover:text-blue-600 rounded"
                  title="Voir détails"
                >
                  <Eye className="w-4 h-4" />
                </button>
                {canEdit && (
                  <>
                    <button
                      onClick={() => onEdit(bug)}
                      className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                      title="Modifier"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => onDelete(bug.id)}
                      className="p-1 text-red-600 hover:bg-red-50 rounded"
                      title="Supprimer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </>
                )}
              </div>
              {attachmentsCount > 0 && (
                <div className="md:col-span-12 text-xs text-gray-400 flex items-center gap-1">
                  <Paperclip className="w-3 h-3" />
                  {attachmentsCount} fichier(s) joint(s)
                </div>
              )}
            </div>
          );
        })
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-4">
          <button
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="px-3 py-1 text-sm border rounded-lg disabled:opacity-50"
          >
            ◀ Précédent
          </button>
          <span className="text-sm">Page {currentPage} / {totalPages}</span>
          <button
            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className="px-3 py-1 text-sm border rounded-lg disabled:opacity-50"
          >
            Suivant ▶
          </button>
        </div>
      )}
    </div>
  );
}