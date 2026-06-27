import { useState, useMemo } from 'react';
import { Calendar, Edit2, Trash2, Search, ChevronUp, ChevronDown, Eye } from 'lucide-react';

interface SessionListProps {
  sessions: any[];
  canEdit: boolean;
  onEdit: (session: any) => void;
  onDelete: (sessionId: string) => void;
  onAdd: () => void;
  onViewDetails: (session: any) => void;
}

type SortField = 'date' | 'duration' | 'tokens';
type SortOrder = 'asc' | 'desc';

// Fonction pour extraire le suffixe (ex: PROJ-001/SESS-0001 → SESS-0001)
const getShortReference = (reference: string | null): string => {
  if (!reference) return '—';
  const parts = reference.split('/');
  return parts[parts.length - 1] || '—';
};

export function SessionList({ sessions, canEdit, onEdit, onDelete, onAdd, onViewDetails }: SessionListProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState<SortField>('date');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [statusFilter, setStatusFilter] = useState<'all' | 'ok' | 'nok'>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR');
  };

  const formatDuration = (session: any) => {
    const total = session.time_bolt + session.time_chatgpt + (session as any).time_deepseek + session.time_other;
    return `${total} min`;
  };

  const filteredAndSortedSessions = useMemo(() => {
    let filtered = [...sessions];

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(s =>
        (s.title || '').toLowerCase().includes(term) ||
        (s.observations || '').toLowerCase().includes(term) ||
        ((s as any).activities_summary || '').toLowerCase().includes(term) ||
        ((s as any).reference || '').toLowerCase().includes(term)
      );
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(s => s.deployment_status === statusFilter);
    }

    filtered.sort((a, b) => {
      let aVal: any, bVal: any;
      switch (sortField) {
        case 'date':
          aVal = new Date(a.date).getTime();
          bVal = new Date(b.date).getTime();
          break;
        case 'duration':
          aVal = a.time_bolt + a.time_chatgpt + (a as any).time_deepseek + a.time_other;
          bVal = b.time_bolt + b.time_chatgpt + (b as any).time_deepseek + b.time_other;
          break;
        case 'tokens':
          aVal = a.tokens_consumed;
          bVal = b.tokens_consumed;
          break;
        default:
          aVal = a.date;
          bVal = b.date;
      }
      if (sortOrder === 'asc') return aVal > bVal ? 1 : -1;
      return aVal < bVal ? 1 : -1;
    });

    return filtered;
  }, [sessions, searchTerm, sortField, sortOrder, statusFilter]);

  const totalPages = Math.ceil(filteredAndSortedSessions.length / itemsPerPage);
  const paginatedSessions = filteredAndSortedSessions.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

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

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Rechercher par titre, référence, activité..."
            className="w-full pl-9 pr-4 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
          />
        </div>
        
        <div className="flex gap-2">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as 'all' | 'ok' | 'nok')}
            className="px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">Tous les déploiements</option>
            <option value="ok">✅ Déployé</option>
            <option value="nok">❌ Non déployé</option>
          </select>
        </div>
      </div>

      <div className="hidden md:grid grid-cols-12 gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-700 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300">
        <div className="col-span-2 cursor-pointer flex items-center gap-1" onClick={() => handleSort('date')}>
          Date <SortIcon field="date" />
        </div>
        <div className="col-span-2">Référence</div>
        <div className="col-span-2 cursor-pointer flex items-center gap-1" onClick={() => handleSort('duration')}>
          Durée <SortIcon field="duration" />
        </div>
        <div className="col-span-2 cursor-pointer flex items-center gap-1" onClick={() => handleSort('tokens')}>
          Tokens <SortIcon field="tokens" />
        </div>
        <div className="col-span-2">Statut</div>
        <div className="col-span-2 text-center">Actions</div>
      </div>

      <div className="space-y-3">
        {paginatedSessions.length === 0 ? (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">Aucune session trouvée</div>
        ) : (
          paginatedSessions.map((session) => (
            <div
              key={session.id}
              className="grid grid-cols-1 md:grid-cols-12 gap-2 p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
            >
              <div className="md:col-span-2 text-sm text-gray-700 dark:text-gray-300">
                {formatDate(session.date)}
              </div>
              <div className="md:col-span-2 text-sm font-mono text-gray-500">
                {getShortReference((session as any).reference)}
              </div>
              <div className="md:col-span-2 text-sm text-gray-700 dark:text-gray-300">
                {formatDuration(session)}
              </div>
              <div className="md:col-span-2 text-sm text-gray-700 dark:text-gray-300">
                {session.tokens_consumed.toLocaleString()}
              </div>
              <div className="md:col-span-2">
                <span className={`text-xs px-2 py-1 rounded ${
                  session.deployment_status === 'ok'
                    ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300'
                    : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300'
                }`}>
                  {session.deployment_status === 'ok' ? '✅ Déployé' : '❌ Non déployé'}
                </span>
              </div>
              <div className="md:col-span-2 flex justify-center gap-2">
                <button
                  onClick={() => onViewDetails(session)}
                  className="p-1 text-gray-500 hover:text-blue-600 rounded"
                  title="Voir détails"
                >
                  <Eye className="w-4 h-4" />
                </button>
                {canEdit && (
                  <>
                    <button
                      onClick={() => onEdit(session)}
                      className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                      title="Modifier"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => onDelete(session.id)}
                      className="p-1 text-red-600 hover:bg-red-50 rounded"
                      title="Supprimer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-4">
          <button
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="px-3 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded-lg disabled:opacity-50"
          >
            ◀ Précédent
          </button>
          <span className="text-sm text-gray-600 dark:text-gray-400">Page {currentPage} / {totalPages}</span>
          <button
            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className="px-3 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded-lg disabled:opacity-50"
          >
            Suivant ▶
          </button>
        </div>
      )}
    </div>
  );
}