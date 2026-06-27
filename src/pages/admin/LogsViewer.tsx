import { useEffect, useState } from 'react';
import { AdminLayout } from '../../components/admin/AdminLayout';
import { DataTable } from '../../components/admin/DataTable';
import { logService, LogAction } from '../../services/log.service';

interface Log {
  id: string;
  user_id: string;
  user_email: string;
  action: string;
  entity_type: string | null;
  entity_id: string | null;
  details: any;
  ip_address: string;
  created_at: string;
}

interface LogsViewerProps {
  currentPage?: string;
  onNavigate?: (page: string) => void;
}

const actionLabels: Record<string, string> = {
  login: '🔐 Connexion',
  logout: '🚪 Déconnexion',
  project_create: '📁 Création projet',
  project_update: '✏️ Modification projet',
  project_delete: '🗑️ Suppression projet',
  project_view: '👁️ Consultation projet',
  session_create: '⏱️ Création session',
  session_update: '✏️ Modification session',
  session_delete: '🗑️ Suppression session',
  bug_create: '🐛 Création bug',
  bug_update: '✏️ Modification bug',
  bug_delete: '🗑️ Suppression bug',
  subscription_change: '💳 Changement abonnement',
  admin_user_update: '👤 Modification utilisateur',
  admin_plan_change: '📊 Changement de plan',
  settings_update: '⚙️ Modification configuration'
};

// Fonction pour récupérer la référence d'une entité
const fetchEntityReference = async (entityType: string | null, entityId: string | null): Promise<string> => {
  if (!entityType || !entityId) return '—';
  
  try {
    let reference = null;
    
    switch (entityType) {
      case 'project':
        const { data: project } = await supabase
          .from('projects')
          .select('reference')
          .eq('id', entityId)
          .single();
        reference = project?.reference;
        break;
        
      case 'session':
        const { data: session } = await supabase
          .from('sessions')
          .select('reference')
          .eq('id', entityId)
          .single();
        reference = session?.reference;
        break;
        
      case 'bug':
        const { data: bug } = await supabase
          .from('bug_reports')
          .select('reference')
          .eq('id', entityId)
          .single();
        reference = bug?.reference;
        break;
        
      default:
        return '—';
    }
    
    return reference || '—';
  } catch (error) {
    console.error('Error fetching reference:', error);
    return '—';
  }
};

export function LogsViewer({ currentPage, onNavigate }: LogsViewerProps) {
  const [logs, setLogs] = useState<Log[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionFilter, setActionFilter] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState<string>('all');
  const [logsWithReferences, setLogsWithReferences] = useState<any[]>([]);

  useEffect(() => {
    loadLogs();
  }, [actionFilter, dateFilter]);

  useEffect(() => {
    // Enrichir les logs avec les références
    const enrichLogs = async () => {
      const enriched = await Promise.all(
        logs.map(async (log) => {
          const reference = await fetchEntityReference(log.entity_type, log.entity_id);
          let detailsText = '';
          
          // Construire le texte des détails
          if (log.details) {
            try {
              const details = typeof log.details === 'string' ? JSON.parse(log.details) : log.details;
              if (details.name) detailsText = `${details.name}`;
              if (details.changes) detailsText += ` | Modifications: ${Object.keys(details.changes).join(', ')}`;
              if (details.project_name) detailsText = `${details.project_name}`;
            } catch {
              detailsText = String(log.details).substring(0, 100);
            }
          }
          
          // Ajouter la référence au texte des détails
          if (reference && reference !== '—') {
            detailsText = detailsText ? `${detailsText} [${reference}]` : `[${reference}]`;
          }
          
          return {
            ...log,
            displayDetails: detailsText || '—',
            reference
          };
        })
      );
      setLogsWithReferences(enriched);
    };
    
    enrichLogs();
  }, [logs]);

  const loadLogs = async () => {
    setLoading(true);
    
    let filters: any = {};
    if (actionFilter !== 'all') {
      filters.action = actionFilter as LogAction;
    }
    
    const data = await logService.getLogs(filters);
    setLogs(data);
    setLoading(false);
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleString('fr-FR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const columns = [
    { key: 'created_at' as const, header: 'Date', sortable: true },
    { key: 'user_email' as const, header: 'Utilisateur', sortable: true },
    { key: 'action' as const, header: 'Action', sortable: true },
    { key: 'entity_type' as const, header: 'Type', sortable: true },
    { key: 'displayDetails' as const, header: 'Détails', sortable: false }
  ];

  const actionsList = [
    { value: 'all', label: 'Toutes les actions' },
    ...Object.entries(actionLabels).map(([value, label]) => ({ value, label }))
  ];

  if (loading) {
    return (
      <AdminLayout title="Logs" currentPage={currentPage} onNavigate={onNavigate}>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Logs" currentPage={currentPage} onNavigate={onNavigate}>
      <div className="space-y-4">
        {/* Filtres */}
        <div className="flex gap-4 bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700">
          <select
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
          >
            {actionsList.map(action => (
              <option key={action.value} value={action.value}>{action.label}</option>
            ))}
          </select>
          
          <select
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
          >
            <option value="all">Toutes les dates</option>
            <option value="today">Aujourd'hui</option>
            <option value="week">Cette semaine</option>
            <option value="month">Ce mois</option>
          </select>
        </div>

        {/* Tableau des logs */}
        <DataTable
          data={logsWithReferences}
          columns={columns.map(col => ({
            ...col,
            render: (value: any, row: any) => {
              if (col.key === 'created_at') {
                return formatDate(value);
              }
              if (col.key === 'action') {
                return actionLabels[value] || value;
              }
              if (col.key === 'displayDetails') {
                return (
                  <div className="text-sm">
                    {value}
                    {row.reference && row.reference !== '—' && (
                      <span className="ml-2 text-xs font-mono text-gray-400 bg-gray-100 dark:bg-gray-700 px-1 py-0.5 rounded">
                        {row.reference}
                      </span>
                    )}
                  </div>
                );
              }
              return value || '—';
            }
          }))}
          searchPlaceholder="Rechercher par utilisateur..."
          searchFields={['user_email', 'action']}
          itemsPerPage={20}
        />
      </div>
    </AdminLayout>
  );
}