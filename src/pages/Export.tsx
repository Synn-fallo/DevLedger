import { useState, useEffect } from 'react';
import { 
  FileText, Download, Calendar, Filter, FileSpreadsheet, 
  Clock, Database, CheckCircle2, X, ChevronDown, Loader2,
  TrendingUp, Users, Heart, MessageCircle, Eye
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { useSettings } from '../contexts/SettingsContext';
import { useSubscription } from '../contexts/SubscriptionContext';
import { metricsService } from '../services/metrics.service';
import { DateRangePicker } from '../components/dashboard/DateRangePicker';
import { getDateRange, periodOptions, type PeriodKey, type DateRange } from '../lib/dateUtils';

interface Project {
  id: string;
  name: string;
  status: string;
  reference: string | null;
  total_time_minutes?: number;
  total_tokens?: number;
  session_count?: number;
  successful_deployments?: number;
}

interface Session {
  id: string;
  date: string;
  project_id: string;
  project_name?: string;
  reference: string | null;
  time_bolt: number;
  time_chatgpt: number;
  time_deepseek: number;
  time_other: number;
  tokens_consumed: number;
  deployment_status: string;
  observations: string;
}

interface Bug {
  id: string;
  title: string;
  description: string;
  category: string;
  status: string;
  difficulty: number | null;
  reference: string | null;
  created_at: string;
}

interface ExportHistoryItem {
  id: string;
  name: string;
  format: 'pdf' | 'csv' | 'excel';
  date: Date;
  size: string;
  url: string;
}

export function Export() {
  const { user } = useAuth();
  const { settings } = useSettings();
  const { isPro, isEnterprise } = useSubscription();
  const canExportCSV = isPro || isEnterprise;
  const canExportExcel = isPro || isEnterprise;
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [projects, setProjects] = useState<Project[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [bugs, setBugs] = useState<Bug[]>([]);
  const [exportHistory, setExportHistory] = useState<ExportHistoryItem[]>([]);
  const [metricsStats, setMetricsStats] = useState({
    totalViews: 0,
    totalLikes: 0,
    totalComments: 0,
    projectsMetrics: [] as Array<{ projectId: string; projectName: string; views: number; likes: number; comments: number }>
  });
  
  // État des filtres
  const [exportType, setExportType] = useState<'pdf' | 'csv' | 'excel'>('pdf');
  const [selectedPeriod, setSelectedPeriod] = useState<PeriodKey>('this_month');
  const [customRange, setCustomRange] = useState<DateRange | null>(null);
  const [dateRange, setDateRange] = useState<DateRange>({ startDate: new Date(), endDate: new Date(), label: 'Ce mois' });
  const [selectedProjects, setSelectedProjects] = useState<string[]>([]);
  const [selectAllProjects, setSelectAllProjects] = useState(false);
  const [includeSessions, setIncludeSessions] = useState(true);
  const [includeBugs, setIncludeBugs] = useState(true);
  const [includeMetrics, setIncludeMetrics] = useState(true);
  const [includeAnalytics, setIncludeAnalytics] = useState(true);
  const [includeProjectDetails, setIncludeProjectDetails] = useState(true);
  const [exportProgress, setExportProgress] = useState(0);
  const [exportError, setExportError] = useState<string | null>(null);

  // Mettre à jour la plage de dates
  useEffect(() => {
    updateDateRange();
  }, [selectedPeriod, customRange, settings?.stats_period_type]);

  const updateDateRange = () => {
    if (selectedPeriod === 'custom' && customRange) {
      setDateRange(customRange);
    } else {
      const range = getDateRange(selectedPeriod, new Date(), settings?.stats_period_type || 'calendar');
      setDateRange(range);
    }
  };

  useEffect(() => {
    loadData();
    loadExportHistory();
  }, [user]);

  useEffect(() => {
    if (dateRange.startDate && dateRange.endDate && user) {
      loadMetricsData();
    }
  }, [user, dateRange]);

  const loadData = async () => {
    if (!user) return;

    try {
      setLoading(true);

      // Charger les projets avec leurs statistiques
      const { data: projectsData } = await supabase
        .from('project_stats')
        .select('*')
        .eq('user_id', user.id);

      // Charger toutes les sessions
      const { data: sessionsData } = await supabase
        .from('sessions')
        .select(`
          *,
          projects!inner(name)
        `)
        .order('date', { ascending: false });

      // Charger les bugs
      const { data: bugsData } = await supabase
        .from('bug_reports')
        .select('*')
        .order('created_at', { ascending: false });

      if (projectsData) {
        const projectsWithRef = projectsData.map(p => ({
          ...p,
          reference: (p as any).reference || null
        }));
        setProjects(projectsWithRef);
        setSelectedProjects(projectsWithRef.map(p => p.id));
        setSelectAllProjects(true);
      }

      if (sessionsData) {
        const formattedSessions = sessionsData.map(s => ({
          ...s,
          project_name: s.projects?.name || 'Projet inconnu',
          reference: (s as any).reference || null
        }));
        setSessions(formattedSessions);
      }

      if (bugsData) {
        setBugs(bugsData);
      }

    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadMetricsData = async () => {
    if (!user) return;
    const metrics = await metricsService.getUserMetrics(user.id);
    setMetricsStats(metrics);
  };

  const loadExportHistory = async () => {
    // Simuler un historique d'exports (à remplacer par une vraie table en base)
    setExportHistory([
      {
        id: '1',
        name: 'Rapport mensuel',
        format: 'pdf',
        date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
        size: '2.4 MB',
        url: '#'
      },
      {
        id: '2',
        name: 'Données brutes',
        format: 'csv',
        date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
        size: '856 KB',
        url: '#'
      },
      {
        id: '3',
        name: 'Export complet',
        format: 'excel',
        date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        size: '3.1 MB',
        url: '#'
      }
    ]);
  };

  const getFilteredData = () => {
    const startDateStr = dateRange.startDate.toISOString().split('T')[0];
    const endDateStr = dateRange.endDate.toISOString().split('T')[0];

    // Filtrer les sessions par date
    let filteredSessions = [...sessions];
    
    filteredSessions = filteredSessions.filter(s => 
      s.date >= startDateStr && s.date <= endDateStr
    );

    // Filtrer les bugs par date
    let filteredBugs = [...bugs];
    filteredBugs = filteredBugs.filter(b => 
      b.created_at >= startDateStr && b.created_at <= endDateStr
    );

    // Filtrer par projets sélectionnés
    if (selectedProjects.length > 0) {
      filteredSessions = filteredSessions.filter(s => 
        selectedProjects.includes(s.project_id)
      );
      filteredBugs = filteredBugs.filter(b => 
        selectedProjects.includes(b.project_id)
      );
    }

    // Filtrer les projets sélectionnés
    const filteredProjects = projects.filter(p => 
      selectedProjects.includes(p.id)
    );

    // Filtrer les métriques par projet
    const filteredMetrics = metricsStats.projectsMetrics.filter(m =>
      selectedProjects.includes(m.projectId)
    );

    return { filteredProjects, filteredSessions, filteredBugs, filteredMetrics };
  };

  const generateCSV = (data: any[], headers: string[]) => {
    const csvRows = [];
    csvRows.push(headers.join(','));
    
    for (const row of data) {
      const values = headers.map(header => {
        const value = row[header] || '';
        return `"${value.toString().replace(/"/g, '""')}"`;
      });
      csvRows.push(values.join(','));
    }
    
    return csvRows.join('\n');
  };

  const downloadFile = (content: string, filename: string, type: string) => {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleExport = async (format: 'pdf' | 'csv' | 'excel') => {
    setExporting(true);
    setExportProgress(0);
    setExportError(null);

    try {
      const { filteredProjects, filteredSessions, filteredBugs, filteredMetrics } = getFilteredData();

      // Simuler la progression
      const progressInterval = setInterval(() => {
        setExportProgress(prev => Math.min(prev + 10, 90));
      }, 200);

      // Préparer les données selon le format
      const timestamp = new Date().toISOString().split('T')[0];
      const filename = `devledger-export-${timestamp}`;

      switch (format) {
        case 'csv': {
          // Export des projets
          if (includeProjectDetails) {
            const projectHeaders = ['Nom', 'Statut', 'Référence', 'Temps (h)', 'Tokens', 'Sessions', 'Déploiements réussis'];
            const projectData = filteredProjects.map(p => ({
              'Nom': p.name,
              'Statut': p.status,
              'Référence': p.reference || '',
              'Temps (h)': (p.total_time_minutes / 60).toFixed(2),
              'Tokens': p.total_tokens || 0,
              'Sessions': p.session_count || 0,
              'Déploiements réussis': p.successful_deployments || 0
            }));
            const projectCSV = generateCSV(projectData, projectHeaders);
            downloadFile(projectCSV, `${filename}-projets.csv`, 'text/csv');
          }

          // Export des sessions
          if (includeSessions && filteredSessions.length > 0) {
            const sessionHeaders = [
              'Date', 'Projet', 'Référence', 'Temps Bolt', 'Temps ChatGPT', 
              'Temps DeepSeek', 'Temps Autre', 'Temps Total', 'Tokens', 'Statut', 'Observations'
            ];
            const sessionData = filteredSessions.map(s => ({
              'Date': s.date,
              'Projet': s.project_name,
              'Référence': s.reference || '',
              'Temps Bolt': s.time_bolt,
              'Temps ChatGPT': s.time_chatgpt,
              'Temps DeepSeek': s.time_deepseek,
              'Temps Autre': s.time_other,
              'Temps Total': s.time_bolt + s.time_chatgpt + s.time_deepseek + s.time_other,
              'Tokens': s.tokens_consumed,
              'Statut': s.deployment_status === 'ok' ? 'Succès' : 'Échec',
              'Observations': s.observations || ''
            }));
            const sessionCSV = generateCSV(sessionData, sessionHeaders);
            downloadFile(sessionCSV, `${filename}-sessions.csv`, 'text/csv');
          }

          // Export des bugs
          if (includeBugs && filteredBugs.length > 0) {
            const bugHeaders = ['Titre', 'Catégorie', 'Statut', 'Difficulté', 'Référence', 'Créé le'];
            const bugData = filteredBugs.map(b => ({
              'Titre': b.title,
              'Catégorie': b.category,
              'Statut': b.status,
              'Difficulté': b.difficulty || '',
              'Référence': b.reference || '',
              'Créé le': new Date(b.created_at).toLocaleDateString('fr-FR')
            }));
            const bugCSV = generateCSV(bugData, bugHeaders);
            downloadFile(bugCSV, `${filename}-bugs.csv`, 'text/csv');
          }

          // Export des métriques
          if (includeMetrics && filteredMetrics.length > 0) {
            const metricsHeaders = ['Projet', 'Vues', 'Likes', 'Commentaires'];
            const metricsData = filteredMetrics.map(m => ({
              'Projet': m.projectName,
              'Vues': m.views,
              'Likes': m.likes,
              'Commentaires': m.comments
            }));
            const metricsCSV = generateCSV(metricsData, metricsHeaders);
            downloadFile(metricsCSV, `${filename}-metriques.csv`, 'text/csv');
          }
          break;
        }

        case 'excel': {
          const allData = [];
          
          if (includeProjectDetails && filteredProjects.length > 0) {
            allData.push(['--- PROJETS ---']);
            allData.push(['Nom', 'Statut', 'Référence', 'Temps (h)', 'Tokens', 'Sessions', 'Déploiements']);
            filteredProjects.forEach(p => {
              allData.push([
                p.name,
                p.status,
                p.reference || '',
                (p.total_time_minutes / 60).toFixed(2),
                p.total_tokens || 0,
                p.session_count || 0,
                p.successful_deployments || 0
              ]);
            });
            allData.push([]);
          }

          if (includeSessions && filteredSessions.length > 0) {
            allData.push(['--- SESSIONS ---']);
            allData.push(['Date', 'Projet', 'Référence', 'Temps Bolt', 'Temps ChatGPT', 'Temps DeepSeek', 'Temps Autre', 'Temps Total', 'Tokens', 'Statut', 'Observations']);
            filteredSessions.forEach(s => {
              allData.push([
                s.date,
                s.project_name || '',
                s.reference || '',
                s.time_bolt,
                s.time_chatgpt,
                s.time_deepseek,
                s.time_other,
                s.time_bolt + s.time_chatgpt + s.time_deepseek + s.time_other,
                s.tokens_consumed,
                s.deployment_status === 'ok' ? 'Succès' : 'Échec',
                s.observations || ''
              ]);
            });
            allData.push([]);
          }

          if (includeBugs && filteredBugs.length > 0) {
            allData.push(['--- BUGS ---']);
            allData.push(['Titre', 'Catégorie', 'Statut', 'Difficulté', 'Référence', 'Créé le']);
            filteredBugs.forEach(b => {
              allData.push([
                b.title,
                b.category,
                b.status,
                b.difficulty || '',
                b.reference || '',
                new Date(b.created_at).toLocaleDateString('fr-FR')
              ]);
            });
            allData.push([]);
          }

          if (includeMetrics && filteredMetrics.length > 0) {
            allData.push(['--- MÉTRIQUES PUBLIQUES ---']);
            allData.push(['Projet', 'Vues', 'Likes', 'Commentaires']);
            filteredMetrics.forEach(m => {
              allData.push([m.projectName, m.views, m.likes, m.comments]);
            });
          }

          const excelContent = allData.map(row => row.join('\t')).join('\n');
          downloadFile(excelContent, `${filename}.xls`, 'application/vnd.ms-excel');
          break;
        }

        case 'pdf': {
          const totalTime = filteredProjects.reduce((sum, p) => sum + (p.total_time_minutes || 0), 0);
          const totalTokens = filteredProjects.reduce((sum, p) => sum + (p.total_tokens || 0), 0);
          const totalSessions = filteredSessions.length;
          const totalBugs = filteredBugs.length;
          const totalValue = (totalTime / 60 * (settings?.hourly_rate || 0)) + 
                           (totalTokens * (settings?.token_price || 0));
          const totalViews = filteredMetrics.reduce((sum, m) => sum + m.views, 0);
          const totalLikes = filteredMetrics.reduce((sum, m) => sum + m.likes, 0);
          const totalComments = filteredMetrics.reduce((sum, m) => sum + m.comments, 0);

          const htmlContent = `
            <!DOCTYPE html>
            <html>
            <head>
              <title>DevLedger - Rapport d'activité</title>
              <style>
                body { font-family: Arial, sans-serif; margin: 40px; }
                h1 { color: #2563eb; }
                h2 { color: #374151; margin-top: 30px; }
                h3 { color: #4b5563; margin-top: 20px; }
                table { border-collapse: collapse; width: 100%; margin: 20px 0; }
                th { background: #f3f4f6; text-align: left; padding: 12px; }
                td { padding: 8px 12px; border-bottom: 1px solid #e5e7eb; }
                .summary { background: #eff6ff; padding: 20px; border-radius: 8px; margin: 20px 0; }
                .summary-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 20px; }
                .stat { text-align: center; }
                .stat-value { font-size: 24px; font-weight: bold; color: #2563eb; }
                .stat-label { color: #6b7280; margin-top: 5px; }
                .footer { margin-top: 50px; color: #9ca3af; text-align: center; font-size: 12px; }
                .page-break { page-break-before: always; }
                .reference { font-family: monospace; font-size: 11px; color: #6b7280; }
              </style>
            </head>
            <body>
              <h1>DevLedger - Rapport d'activité</h1>
              <p>Généré le ${new Date().toLocaleDateString('fr-FR')}</p>
              <p>Période : ${dateRange.label} (${dateRange.startDate.toLocaleDateString('fr-FR')} au ${dateRange.endDate.toLocaleDateString('fr-FR')})</p>

              <div class="summary">
                <h2>Résumé</h2>
                <div class="summary-grid">
                  <div class="stat">
                    <div class="stat-value">${(totalTime / 60).toFixed(1)}h</div>
                    <div class="stat-label">Temps total</div>
                  </div>
                  <div class="stat">
                    <div class="stat-value">${totalTokens.toLocaleString()}</div>
                    <div class="stat-label">Tokens consommés</div>
                  </div>
                  <div class="stat">
                    <div class="stat-value">${totalValue.toLocaleString()} ${settings?.currency}</div>
                    <div class="stat-label">Valeur totale</div>
                  </div>
                  <div class="stat">
                    <div class="stat-value">${totalSessions}</div>
                    <div class="stat-label">Sessions</div>
                  </div>
                </div>
              </div>

              ${includeMetrics && (totalViews > 0 || totalLikes > 0 || totalComments > 0) ? `
                <div class="summary" style="background: #f0fdf4;">
                  <h2>Impact public</h2>
                  <div class="summary-grid">
                    <div class="stat">
                      <div class="stat-value">${totalViews}</div>
                      <div class="stat-label">👁️ Vues</div>
                    </div>
                    <div class="stat">
                      <div class="stat-value">${totalLikes}</div>
                      <div class="stat-label">❤️ Likes</div>
                    </div>
                    <div class="stat">
                      <div class="stat-value">${totalComments}</div>
                      <div class="stat-label">💬 Commentaires</div>
                    </div>
                    <div class="stat">
                      <div class="stat-value">${totalBugs}</div>
                      <div class="stat-label">🐛 Bugs</div>
                    </div>
                  </div>
                </div>
              ` : ''}

              ${includeProjectDetails ? `
                <h2>Projets (${filteredProjects.length})</h2>
                <table>
                  <thead>
                    <tr>
                      <th>Nom</th>
                      <th>Statut</th>
                      <th>Référence</th>
                      <th>Temps</th>
                      <th>Tokens</th>
                      <th>Sessions</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${filteredProjects.map(p => `
                      <tr>
                        <td>${p.name}</td>
                        <td>${p.status}</td>
                        <td class="reference">${p.reference || '—'}</td>
                        <td>${(p.total_time_minutes / 60).toFixed(1)}h</td>
                        <td>${p.total_tokens?.toLocaleString() || 0}</td>
                        <td>${p.session_count || 0}</td>
                      </tr>
                    `).join('')}
                  </tbody>
                </table>
              ` : ''}

              ${includeSessions && filteredSessions.length > 0 ? `
                <h2>Sessions (${filteredSessions.length})</h2>
                <table>
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Projet</th>
                      <th>Référence</th>
                      <th>Temps Bolt</th>
                      <th>Temps ChatGPT</th>
                      <th>Temps DeepSeek</th>
                      <th>Temps Total</th>
                      <th>Tokens</th>
                      <th>Statut</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${filteredSessions.slice(0, 50).map(s => `
                      <tr>
                        <td>${new Date(s.date).toLocaleDateString('fr-FR')}</td>
                        <td>${s.project_name}</td>
                        <td class="reference">${s.reference || '—'}</td>
                        <td>${s.time_bolt}min</td>
                        <td>${s.time_chatgpt}min</td>
                        <td>${s.time_deepseek}min</td>
                        <td>${(s.time_bolt + s.time_chatgpt + s.time_deepseek + s.time_other)}min</td>
                        <td>${s.tokens_consumed}</td>
                        <td>${s.deployment_status === 'ok' ? '✅' : '❌'}</td>
                      </tr>
                    `).join('')}
                  </tbody>
                </table>
                ${filteredSessions.length > 50 ? '<p>... et ' + (filteredSessions.length - 50) + ' sessions supplémentaires</p>' : ''}
              ` : ''}

              ${includeBugs && filteredBugs.length > 0 ? `
                <h2>Bugs (${filteredBugs.length})</h2>
                <table>
                  <thead>
                    <tr>
                      <th>Titre</th>
                      <th>Catégorie</th>
                      <th>Statut</th>
                      <th>Difficulté</th>
                      <th>Référence</th>
                      <th>Créé le</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${filteredBugs.slice(0, 30).map(b => `
                      <tr>
                        <td>${b.title}</td>
                        <td>${b.category}</td>
                        <td>${b.status}</td>
                        <td>${b.difficulty || '—'}</td>
                        <td class="reference">${b.reference || '—'}</td>
                        <td>${new Date(b.created_at).toLocaleDateString('fr-FR')}</td>
                      </tr>
                    `).join('')}
                  </tbody>
                </table>
                ${filteredBugs.length > 30 ? '<p>... et ' + (filteredBugs.length - 30) + ' bugs supplémentaires</p>' : ''}
              ` : ''}

              ${includeMetrics && filteredMetrics.length > 0 ? `
                <h2>Métriques publiques</h2>
                <table>
                  <thead>
                    <tr>
                      <th>Projet</th>
                      <th>👁️ Vues</th>
                      <th>❤️ Likes</th>
                      <th>💬 Commentaires</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${filteredMetrics.map(m => `
                      <tr>
                        <td>${m.projectName}</td>
                        <td>${m.views}</td>
                        <td>${m.likes}</td>
                        <td>${m.comments}</td>
                      </tr>
                    `).join('')}
                  </tbody>
                </table>
              ` : ''}

              <div class="footer">
                <p>Export généré par DevLedger - Taux horaire: ${settings?.hourly_rate} ${settings?.currency}/h - Prix du token: ${settings?.token_price} ${settings?.currency}</p>
              </div>
            </body>
            </html>
          `;

          downloadFile(htmlContent, `${filename}.html`, 'text/html');
          break;
        }
      }

      clearInterval(progressInterval);
      setExportProgress(100);
      
      // Ajouter à l'historique
      const newExport: ExportHistoryItem = {
        id: Date.now().toString(),
        name: `Export ${new Date().toLocaleDateString()}`,
        format,
        date: new Date(),
        size: '~' + Math.round((filteredProjects.length + filteredSessions.length + filteredBugs.length) * 0.5) + ' KB',
        url: '#'
      };
      setExportHistory(prev => [newExport, ...prev].slice(0, 10));

      setTimeout(() => {
        setExporting(false);
        setExportProgress(0);
      }, 1000);

    } catch (error) {
      console.error('Export error:', error);
      setExportError('Une erreur est survenue lors de l\'export');
      setExporting(false);
      setExportProgress(0);
    }
  };

  const handleSelectAllProjects = () => {
    if (selectAllProjects) {
      setSelectedProjects([]);
    } else {
      setSelectedProjects(projects.map(p => p.id));
    }
    setSelectAllProjects(!selectAllProjects);
  };

  const { filteredProjects, filteredSessions, filteredBugs, filteredMetrics } = getFilteredData();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Chargement des données...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* En-tête */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Export</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          Exportez vos données aux formats PDF, CSV ou Excel
        </p>
      </div>

      {/* Aperçu des données à exporter */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
        <div className="flex items-start space-x-3">
          <Database className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5" />
          <div>
            <h3 className="text-sm font-medium text-blue-800 dark:text-blue-300">
              Aperçu des données à exporter
            </h3>
            <p className="text-sm text-blue-700 dark:text-blue-400 mt-1">
              {filteredProjects.length} projet{filteredProjects.length !== 1 ? 's' : ''} · 
              {filteredSessions.length} session{filteredSessions.length !== 1 ? 's' : ''} · 
              {filteredBugs.length} bug{filteredBugs.length !== 1 ? 's' : ''}
              {includeMetrics && filteredMetrics.length > 0 && ` · ${filteredMetrics.reduce((sum, m) => sum + m.views, 0)} vues`}
            </p>
          </div>
        </div>
      </div>

      {/* Options d'export */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Format PDF */}
        <div className={`bg-white dark:bg-gray-800 rounded-xl p-6 border-2 transition-colors cursor-pointer ${
          exportType === 'pdf' ? 'border-blue-500' : 'border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-700'
        }`} onClick={() => setExportType('pdf')}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Export PDF</h2>
            <FileText className="w-5 h-5 text-red-500" />
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            Rapport formaté, idéal pour l'impression et le partage
          </p>
          <div className="text-xs text-gray-500 dark:text-gray-400 mb-4">
            ✓ Résumé exécutif<br />
            ✓ Tableaux des projets<br />
            ✓ Détail des sessions (50 max)<br />
            {includeMetrics && <span>✓ Métriques publiques<br /></span>}
            {includeBugs && <span>✓ Liste des bugs<br /></span>}
          </div>
          <button
            onClick={(e) => { e.stopPropagation(); handleExport('pdf'); }}
            disabled={exporting || filteredProjects.length === 0}
            className="w-full flex items-center justify-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {exporting && exportType === 'pdf' ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Download className="w-4 h-4 mr-2" />
            )}
            {exporting && exportType === 'pdf' ? 'Génération...' : 'Exporter en PDF'}
          </button>
        </div>

        {/* Format CSV */}
        <div className={`bg-white dark:bg-gray-800 rounded-xl p-6 border-2 transition-colors cursor-pointer ${
          exportType === 'csv' ? 'border-blue-500' : 'border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-700'
        }`} onClick={() => setExportType('csv')}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Export CSV</h2>
            <FileSpreadsheet className="w-5 h-5 text-green-500" />
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            Données brutes pour analyse dans Excel, Sheets ou traitement
          </p>
          <div className="text-xs text-gray-500 dark:text-gray-400 mb-4">
            ✓ Fichier projets séparé<br />
            ✓ Fichier sessions séparé<br />
            {includeBugs && <span>✓ Fichier bugs séparé<br /></span>}
            {includeMetrics && <span>✓ Fichier métriques séparé<br /></span>}
            ✓ Compatible tous tableurs
          </div>
          {!canExportCSV && (
            <div className="mb-3 p-2 bg-yellow-50 dark:bg-yellow-900/20 rounded text-xs text-yellow-700 dark:text-yellow-400">
              🔒 Disponible avec l'abonnement Pro
            </div>
          )}
          <button
            onClick={(e) => { e.stopPropagation(); handleExport('csv'); }}
            disabled={exporting || filteredProjects.length === 0 || !canExportCSV}
            className={`w-full flex items-center justify-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors ${!canExportCSV ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            {exporting && exportType === 'csv' ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Download className="w-4 h-4 mr-2" />
            )}
            {exporting && exportType === 'csv' ? 'Génération...' : 'Exporter en CSV'}
          </button>
        </div>

        {/* Format Excel */}
        <div className={`bg-white dark:bg-gray-800 rounded-xl p-6 border-2 transition-colors cursor-pointer ${
          exportType === 'excel' ? 'border-blue-500' : 'border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-700'
        }`} onClick={() => setExportType('excel')}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Export Excel</h2>
            <Database className="w-5 h-5 text-blue-500" />
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            Fichier unique avec onglets séparés (projets, sessions, bugs, métriques)
          </p>
          <div className="text-xs text-gray-500 dark:text-gray-400 mb-4">
            ✓ Un seul fichier structuré<br />
            ✓ Compatible Excel<br />
            ✓ Format tabulé
          </div>
          {!canExportExcel && (
            <div className="mb-3 p-2 bg-yellow-50 dark:bg-yellow-900/20 rounded text-xs text-yellow-700 dark:text-yellow-400">
              🔒 Disponible avec l'abonnement Pro
            </div>
          )}
          <button
            onClick={(e) => { e.stopPropagation(); handleExport('excel'); }}
            disabled={exporting || filteredProjects.length === 0 || !canExportExcel}
            className={`w-full flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors ${!canExportExcel ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            {exporting && exportType === 'excel' ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Download className="w-4 h-4 mr-2" />
            )}
            {exporting && exportType === 'excel' ? 'Génération...' : 'Exporter en Excel'}
          </button>
        </div>
      </div>

      {/* Barre de progression */}
      {exporting && (
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-600 dark:text-gray-400">Génération de l'export...</span>
            <span className="text-sm font-medium text-gray-900 dark:text-white">{exportProgress}%</span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${exportProgress}%` }}
            />
          </div>
        </div>
      )}

      {/* Message d'erreur */}
      {exportError && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <div className="flex items-start space-x-3">
            <X className="w-5 h-5 text-red-600 dark:text-red-400 mt-0.5" />
            <p className="text-sm text-red-700 dark:text-red-300">{exportError}</p>
          </div>
        </div>
      )}

      {/* Options avancées */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Options d'export
        </h2>

        <div className="space-y-6">
          {/* Période */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Période
            </label>
            <DateRangePicker
              selectedPeriod={selectedPeriod}
              onPeriodChange={setSelectedPeriod}
              customRange={customRange}
              onCustomRangeChange={setCustomRange}
              periodOptions={periodOptions}
            />
            <p className="text-xs text-gray-500 mt-1">
              Période actuelle : {dateRange.label} ({dateRange.startDate.toLocaleDateString('fr-FR')} au {dateRange.endDate.toLocaleDateString('fr-FR')})
            </p>
          </div>

          {/* Projets */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Projets à inclure ({selectedProjects.length}/{projects.length})
              </label>
              <button
                onClick={handleSelectAllProjects}
                className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300"
              >
                {selectAllProjects ? 'Tout désélectionner' : 'Tout sélectionner'}
              </button>
            </div>
            <div className="space-y-2 max-h-60 overflow-y-auto p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
              {projects.map((project) => (
                <label key={project.id} className="flex items-center justify-between p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded cursor-pointer">
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={selectedProjects.includes(project.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedProjects([...selectedProjects, project.id]);
                        } else {
                          setSelectedProjects(selectedProjects.filter(id => id !== project.id));
                          setSelectAllProjects(false);
                        }
                      }}
                      className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700 dark:text-gray-300">{project.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {project.reference && (
                      <span className="text-xs font-mono text-gray-400">{project.reference}</span>
                    )}
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {project.session_count || 0} sessions
                    </span>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Contenu à inclure */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Contenu à inclure
            </label>
            <div className="space-y-2">
              <label className="flex items-center space-x-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={includeSessions}
                  onChange={(e) => setIncludeSessions(e.target.checked)}
                  className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  Sessions de travail ({filteredSessions.length})
                </span>
              </label>
              <label className="flex items-center space-x-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={includeProjectDetails}
                  onChange={(e) => setIncludeProjectDetails(e.target.checked)}
                  className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  Détails des projets ({filteredProjects.length})
                </span>
              </label>
              <label className="flex items-center space-x-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={includeBugs}
                  onChange={(e) => setIncludeBugs(e.target.checked)}
                  className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  Rapports de bugs ({filteredBugs.length})
                </span>
              </label>
              <label className="flex items-center space-x-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={includeMetrics}
                  onChange={(e) => setIncludeMetrics(e.target.checked)}
                  className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  Métriques publiques (vues, likes, commentaires)
                </span>
              </label>
              <label className="flex items-center space-x-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={includeAnalytics}
                  onChange={(e) => setIncludeAnalytics(e.target.checked)}
                  className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  Analyses et statistiques (PDF uniquement)
                </span>
              </label>
            </div>
          </div>

          {/* Métriques publiques - résumé */}
          {includeMetrics && filteredMetrics.length > 0 && (
            <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <h3 className="text-sm font-semibold text-blue-800 dark:text-blue-300 mb-2">Métriques exportées</h3>
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <Eye className="w-4 h-4 mx-auto text-blue-600 dark:text-blue-400" />
                  <p className="text-lg font-bold text-blue-800 dark:text-blue-300">{filteredMetrics.reduce((sum, m) => sum + m.views, 0)}</p>
                  <p className="text-xs text-blue-600 dark:text-blue-400">Vues totales</p>
                </div>
                <div>
                  <Heart className="w-4 h-4 mx-auto text-red-500" />
                  <p className="text-lg font-bold text-blue-800 dark:text-blue-300">{filteredMetrics.reduce((sum, m) => sum + m.likes, 0)}</p>
                  <p className="text-xs text-blue-600 dark:text-blue-400">Likes reçus</p>
                </div>
                <div>
                  <MessageCircle className="w-4 h-4 mx-auto text-green-500" />
                  <p className="text-lg font-bold text-blue-800 dark:text-blue-300">{filteredMetrics.reduce((sum, m) => sum + m.comments, 0)}</p>
                  <p className="text-xs text-blue-600 dark:text-blue-400">Commentaires</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Historique des exports */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Exports récents
        </h2>
        <div className="space-y-3">
          {exportHistory.map((item) => (
            <div key={item.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-900 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
              <div className="flex items-center space-x-3">
                {item.format === 'pdf' && <FileText className="w-5 h-5 text-red-500" />}
                {item.format === 'csv' && <FileSpreadsheet className="w-5 h-5 text-green-500" />}
                {item.format === 'excel' && <Database className="w-5 h-5 text-blue-500" />}
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">{item.name}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {item.date.toLocaleDateString('fr-FR')} • {item.size}
                  </p>
                </div>
              </div>
              <button className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 transition-colors">
                <Download className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}