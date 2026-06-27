import { useEffect, useState, useMemo } from 'react';
import { 
  TrendingUp, Clock, FolderKanban, Zap, CheckCircle2, Activity,
  Calendar, ArrowUp, ArrowDown, Award, Target, Rocket, Users,
  Brain, Sparkles, BarChart3, PieChart, Download, RefreshCw, Eye
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { useSettings } from '../contexts/SettingsContext';
import { useSubscription } from '../contexts/SubscriptionContext';
import { DateRangePicker } from '../components/dashboard/DateRangePicker';
import { getDateRange, periodOptions, type PeriodKey, type DateRange } from '../lib/dateUtils';
import { metricsService } from '../services/metrics.service';
import { collaborationService } from '../services/collaboration.service';

interface DashboardStats {
  totalValue: number;
  totalTime: number;
  totalProjects: number;
  activeProjects: number;
  completedProjects: number;
  totalTokens: number;
  totalSessions: number;
  successRate: number;
  avgSessionDuration: number;
  valuePerHour: number;
  valuePerToken: number;
}

interface ActivityItem {
  id: string;
  type: 'project' | 'session';
  projectName: string;
  projectId: string;
  description: string;
  date: string;
  value?: number;
}

interface GroupedActivity {
  projectId: string;
  projectName: string;
  activities: ActivityItem[];
  lastActivity: ActivityItem;
  count: number;
}

interface DashboardProps {
  onNavigate?: (page: string) => void;
}

export function Dashboard({ onNavigate }: DashboardProps) {
  const { user } = useAuth();
  const { settings } = useSettings();
  const { isPro, isEnterprise } = useSubscription();
  const canAccessAdvanced = isPro || isEnterprise;
  const [stats, setStats] = useState<DashboardStats>({
    totalValue: 0,
    totalTime: 0,
    totalProjects: 0,
    activeProjects: 0,
    completedProjects: 0,
    totalTokens: 0,
    totalSessions: 0,
    successRate: 0,
    avgSessionDuration: 0,
    valuePerHour: 0,
    valuePerToken: 0
  });
  const [groupedActivity, setGroupedActivity] = useState<GroupedActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState<PeriodKey>('this_month');
  const [customRange, setCustomRange] = useState<DateRange | null>(null);
  const [dateRange, setDateRange] = useState<DateRange>({ startDate: new Date(), endDate: new Date(), label: 'Ce mois' });
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [metricsStats, setMetricsStats] = useState({
    totalViews: 0,
    totalLikes: 0,
    totalComments: 0,
    projectsMetrics: [] as Array<{ projectId: string; projectName: string; views: number; likes: number; comments: number }>
  });
  const [collaborationRequests, setCollaborationRequests] = useState<any[]>([]);
  const [pendingRequestsCount, setPendingRequestsCount] = useState(0);

  // Mettre à jour la plage de dates quand la période ou le type change
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

  const loadStats = async () => {
    if (!user) return;

    try {
      setRefreshing(true);
      setLoading(true);
      
      const startDateStr = dateRange.startDate.toISOString().split('T')[0];
      const endDateStr = dateRange.endDate.toISOString().split('T')[0];

      // Récupérer d'abord les projets de l'utilisateur
      const { data: userProjects } = await supabase
        .from('projects')
        .select('id, name, status, created_at')
        .eq('user_id', user.id);

      const projectIds = userProjects?.map(p => p.id) || [];

      if (projectIds.length === 0) {
        setStats({
          totalValue: 0,
          totalTime: 0,
          totalProjects: 0,
          activeProjects: 0,
          completedProjects: 0,
          totalTokens: 0,
          totalSessions: 0,
          successRate: 0,
          avgSessionDuration: 0,
          valuePerHour: 0,
          valuePerToken: 0
        });
        setGroupedActivity([]);
        setLoading(false);
        setRefreshing(false);
        return;
      }

      // Charger les sessions des projets de l'utilisateur dans la période
      const { data: periodSessions } = await supabase
        .from('sessions')
        .select(`
          id,
          date,
          time_bolt,
          time_chatgpt,
          time_deepseek,
          time_other,
          tokens_consumed,
          deployment_status,
          project_id
        `)
        .in('project_id', projectIds)
        .gte('date', startDateStr)
        .lte('date', endDateStr)
        .order('date', { ascending: false });

      // Calculer les statistiques des projets
      const totalProjects = userProjects?.length || 0;
      const activeProjects = userProjects?.filter(p => p.status === 'development').length || 0;
      const completedProjects = userProjects?.filter(p => p.status === 'deployed').length || 0;

      // Calculer les statistiques pour la période
      if (periodSessions && periodSessions.length > 0) {
        const totalTime = periodSessions.reduce((sum, s) => 
          sum + (s.time_bolt || 0) + (s.time_chatgpt || 0) + (s.time_deepseek || 0) + (s.time_other || 0), 0
        );
        const totalTokens = periodSessions.reduce((sum, s) => sum + (s.tokens_consumed || 0), 0);
        const totalSessions = periodSessions.length;
        const successfulDeployments = periodSessions.filter(s => s.deployment_status === 'ok').length;

        const hourlyRate = settings?.hourly_rate || 0;
        const tokenPrice = settings?.token_price || 0;

        const totalValue = (totalTime / 60 * hourlyRate) + (totalTokens * tokenPrice);
        const avgSessionDuration = totalSessions > 0 ? totalTime / totalSessions : 0;
        const valuePerHour = totalTime > 0 ? (totalValue / (totalTime / 60)) : 0;
        const valuePerToken = totalTokens > 0 ? totalValue / totalTokens : 0;

        setStats({
          totalValue,
          totalTime,
          totalProjects,
          activeProjects,
          completedProjects,
          totalTokens,
          totalSessions,
          successRate: totalSessions > 0 ? (successfulDeployments / totalSessions * 100) : 0,
          avgSessionDuration,
          valuePerHour,
          valuePerToken
        });
      } else {
        setStats({
          totalValue: 0,
          totalTime: 0,
          totalProjects,
          activeProjects,
          completedProjects,
          totalTokens: 0,
          totalSessions: 0,
          successRate: 0,
          avgSessionDuration: 0,
          valuePerHour: 0,
          valuePerToken: 0
        });
      }

      // Charger les métriques des projets publics
      const userMetrics = await metricsService.getUserMetrics(user.id);
      setMetricsStats({
        totalViews: userMetrics.totalViews,
        totalLikes: userMetrics.totalLikes,
        totalComments: userMetrics.totalComments,
        projectsMetrics: userMetrics.projectsMetrics
      });

      // Charger les demandes de collaboration
      const requests = await collaborationService.getRequestsForUser(user.id);
      setCollaborationRequests(requests.slice(0, 5));
      const pendingCount = requests.filter(r => r.status === 'pending').length;
      setPendingRequestsCount(pendingCount);

      // Construire l'activité groupée par projet
      const activityMap = new Map<string, ActivityItem[]>();

      // Ajouter les projets créés dans la période
      const projectsInPeriod = userProjects?.filter(p => 
        p.created_at >= startDateStr && p.created_at <= endDateStr
      ) || [];

      projectsInPeriod.forEach(project => {
        const projectActivity: ActivityItem = {
          id: `project-${project.id}`,
          type: 'project',
          projectName: project.name,
          projectId: project.id,
          description: 'Projet créé',
          date: project.created_at
        };

        if (!activityMap.has(project.id)) {
          activityMap.set(project.id, []);
        }
        activityMap.get(project.id)?.push(projectActivity);
      });

      // Ajouter les sessions avec les noms des projets
      const sessionsWithProjectNames = await Promise.all(
        (periodSessions || []).map(async (session) => {
          const project = userProjects?.find(p => p.id === session.project_id);
          return {
            ...session,
            project_name: project?.name || 'Projet inconnu'
          };
        })
      );

      sessionsWithProjectNames.forEach(session => {
        const totalTime = (session.time_bolt || 0) + (session.time_chatgpt || 0) + 
                         (session.time_deepseek || 0) + (session.time_other || 0);
        
        const sessionActivity: ActivityItem = {
          id: `session-${session.id}`,
          type: 'session',
          projectName: session.project_name,
          projectId: session.project_id,
          description: `Session de ${Math.round(totalTime / 60 * 10) / 10}h · ${session.tokens_consumed} tokens · ${session.deployment_status === 'ok' ? '✅' : '❌'}`,
          date: session.date,
          value: session.tokens_consumed
        };

        if (!activityMap.has(session.project_id)) {
          activityMap.set(session.project_id, []);
        }
        activityMap.get(session.project_id)?.push(sessionActivity);
      });

      // Grouper par projet et trier
      const grouped: GroupedActivity[] = [];
      
      activityMap.forEach((activities, projectId) => {
        // Trier les activités par date (plus récent en premier)
        activities.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        
        const project = userProjects?.find(p => p.id === projectId);
        grouped.push({
          projectId,
          projectName: project?.name || activities[0]?.projectName || 'Projet inconnu',
          activities,
          lastActivity: activities[0],
          count: activities.length
        });
      });

      // Trier les groupes par date de dernière activité (plus récent en premier)
      grouped.sort((a, b) => 
        new Date(b.lastActivity.date).getTime() - new Date(a.lastActivity.date).getTime()
      );

      setGroupedActivity(grouped.slice(0, 5));
      
    } catch (error) {
      console.error('Error loading dashboard stats:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (dateRange.startDate && dateRange.endDate && user) {
      loadStats();
    }
  }, [user, settings, dateRange]);

  const handleRefresh = () => {
    loadStats();
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'decimal',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(Math.round(value));
  };

  const formatTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = Math.floor(minutes % 60);
    return `${hours}h ${mins}m`;
  };

  const formatShortTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    return `${hours}h`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Calcul des tendances (simulées pour l'instant)
  const trends = useMemo(() => ({
    value: '+12%',
    time: '+8%',
    tokens: '+5%',
    success: '+3%'
  }), []);

  const statCards = [
    {
      title: 'Valeur Totale',
      value: `${formatCurrency(stats.totalValue)} ${settings?.currency || 'XOF'}`,
      subValue: `${formatCurrency(stats.valuePerHour)}/h`,
      trend: trends.value,
      trendUp: true,
      icon: TrendingUp,
      color: 'text-green-600 dark:text-green-400',
      bgColor: 'bg-green-100 dark:bg-green-900/30'
    },
    {
      title: 'Temps Total',
      value: formatTime(stats.totalTime),
      subValue: `${stats.totalSessions} sessions`,
      trend: trends.time,
      trendUp: true,
      icon: Clock,
      color: 'text-blue-600 dark:text-blue-400',
      bgColor: 'bg-blue-100 dark:bg-blue-900/30'
    },
    {
      title: 'Projets',
      value: `${stats.activeProjects} / ${stats.totalProjects}`,
      subValue: `${stats.completedProjects} terminés`,
      icon: FolderKanban,
      color: 'text-purple-600 dark:text-purple-400',
      bgColor: 'bg-purple-100 dark:bg-purple-900/30'
    },
    {
      title: 'Tokens IA',
      value: formatCurrency(stats.totalTokens),
      subValue: `${formatCurrency(stats.valuePerToken)}/token`,
      trend: trends.tokens,
      trendUp: true,
      icon: Zap,
      color: 'text-yellow-600 dark:text-yellow-400',
      bgColor: 'bg-yellow-100 dark:bg-yellow-900/30'
    },
    {
      title: 'Taux de Réussite',
      value: `${stats.successRate.toFixed(1)}%`,
      subValue: `${stats.totalSessions} sessions`,
      trend: trends.success,
      trendUp: true,
      icon: CheckCircle2,
      color: 'text-emerald-600 dark:text-emerald-400',
      bgColor: 'bg-emerald-100 dark:bg-emerald-900/30'
    },
    {
      title: 'Productivité',
      value: formatShortTime(stats.avgSessionDuration),
      subValue: 'moy./session',
      icon: Activity,
      color: 'text-indigo-600 dark:text-indigo-400',
      bgColor: 'bg-indigo-100 dark:bg-indigo-900/30'
    }
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Chargement du tableau de bord...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* En-tête avec actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Dashboard</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            {new Date().toLocaleDateString('fr-FR', { 
              weekday: 'long', 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <DateRangePicker
            selectedPeriod={selectedPeriod}
            onPeriodChange={setSelectedPeriod}
            customRange={customRange}
            onCustomRangeChange={setCustomRange}
            periodOptions={periodOptions}
          />
          
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="p-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            title="Actualiser"
          >
            <RefreshCw className={`w-5 h-5 ${refreshing ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Affichage de la période sélectionnée */}
      <div className="text-sm text-gray-500">
        Période : {dateRange.label} ({dateRange.startDate.toLocaleDateString('fr-FR')} au {dateRange.endDate.toLocaleDateString('fr-FR')})
        {settings?.stats_period_type === 'calendar' ? ' 📅 Calendaire' : ' 🔄 Glissante'}
      </div>

      {/* Cartes de statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {statCards.map((card) => {
          const Icon = card.icon;
          return (
            <div
              key={card.title}
              className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-shadow"
            >
              <div className="flex items-start justify-between">
                <div className="space-y-2">
                  <p className="text-sm text-gray-600 dark:text-gray-400">{card.title}</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {card.value}
                  </p>
                  <div className="flex items-center gap-2">
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {card.subValue}
                    </p>
                    {card.trend && (
                      <span className={`flex items-center text-xs ${
                        card.trendUp ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {card.trendUp ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />}
                        {card.trend}
                      </span>
                    )}
                  </div>
                </div>
                <div className={`p-3 rounded-lg ${card.bgColor}`}>
                  <Icon className={`w-6 h-6 ${card.color}`} />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Section Activité Récente - GROUPÉE PAR PROJET */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Activité récente groupée */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <Activity className="w-5 h-5" />
              Activité Récente
            </h2>
          </div>

          <div className="space-y-4">
            {groupedActivity.length > 0 ? (
              groupedActivity.slice(0, 5).map((group) => (
                <div key={group.projectId} className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
                  {/* En-tête du projet */}
                  <div className="bg-gray-50 dark:bg-gray-700/50 px-4 py-3 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <FolderKanban className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                      <span className="text-sm font-medium text-gray-900 dark:text-white">
                        {group.projectName}
                      </span>
                    </div>
                    <span className="text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-2 py-1 rounded-full">
                      {group.count} activité{group.count > 1 ? 's' : ''}
                    </span>
                  </div>
                  
                  {/* Dernière activité */}
                  <div className="p-4">
                    <div className="flex items-start gap-3">
                      <div className={`p-2 rounded-full ${
                        group.lastActivity.type === 'project' 
                          ? 'bg-blue-100 dark:bg-blue-900/30' 
                          : 'bg-green-100 dark:bg-green-900/30'
                      }`}>
                        {group.lastActivity.type === 'project' 
                          ? <FolderKanban className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                          : <Clock className="w-4 h-4 text-green-600 dark:text-green-400" />
                        }
                      </div>
                      <div className="flex-1">
                        <p className="text-sm text-gray-900 dark:text-white">
                          {group.lastActivity.description}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          {formatDate(group.lastActivity.date)}
                        </p>
                      </div>
                      {group.lastActivity.value && group.lastActivity.value > 0 && (
                        <span className="text-xs font-medium text-yellow-600 dark:text-yellow-400">
                          +{group.lastActivity.value} tokens
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-center text-gray-500 dark:text-gray-400 py-8">
                Aucune activité récente
              </p>
            )}
          </div>
        </div>

        {/* Objectifs et progrès */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <Target className="w-5 h-5" />
              Objectifs
            </h2>
            {canAccessAdvanced && (
              <button 
                onClick={() => setShowAdvanced(!showAdvanced)}
                className="px-3 py-1 text-sm bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-lg hover:bg-blue-200 dark:hover:bg-blue-800/50 transition-colors"
              >
                {showAdvanced ? 'Mode Simple' : 'Mode Avancé'}
              </button>
            )}
          </div>

          <div className="space-y-6">
            {/* Objectif valeur */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm text-gray-600 dark:text-gray-400">Objectif mensuel</span>
                <span className="text-sm font-medium text-gray-900 dark:text-white">
                  {formatCurrency(stats.totalValue)} / 1 000 000 {settings?.currency}
                </span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
                <div 
                  className="bg-green-600 h-2.5 rounded-full transition-all duration-500"
                  style={{ width: `${Math.min((stats.totalValue / 1000000) * 100, 100)}%` }}
                />
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {Math.round((stats.totalValue / 1000000) * 100)}% atteint
              </p>
            </div>

            {/* Objectif temps */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm text-gray-600 dark:text-gray-400">Heures travaillées</span>
                <span className="text-sm font-medium text-gray-900 dark:text-white">
                  {formatShortTime(stats.totalTime)} / 100h
                </span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
                <div 
                  className="bg-blue-600 h-2.5 rounded-full transition-all duration-500"
                  style={{ width: `${Math.min((stats.totalTime / 60) / 100 * 100, 100)}%` }}
                />
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {Math.round((stats.totalTime / 60) / 100 * 100)}% atteint
              </p>
            </div>

            {/* Badges / Réalisations */}
            <div className="grid grid-cols-2 gap-3 pt-4">
              <div className="flex items-center gap-2 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                <Rocket className="w-4 h-4 text-purple-600" />
                <div>
                  <p className="text-xs text-gray-600 dark:text-gray-400">Projets actifs</p>
                  <p className="text-sm font-bold text-gray-900 dark:text-white">{stats.activeProjects}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                <Award className="w-4 h-4 text-yellow-600" />
                <div>
                  <p className="text-xs text-gray-600 dark:text-gray-400">Sessions réussies</p>
                  <p className="text-sm font-bold text-gray-900 dark:text-white">
                    {Math.round(stats.totalSessions * stats.successRate / 100)}
                  </p>
                </div>
              </div>
            </div>

            {/* Mode Avancé - Statistiques supplémentaires */}
            {showAdvanced && canAccessAdvanced && (
              <div className="pt-4 border-t border-gray-200 dark:border-gray-700 space-y-3">
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Statistiques avancées</h3>
                <div className="grid grid-cols-2 gap-3">
                  <div className="text-center p-2 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                    <p className="text-xs text-gray-500 dark:text-gray-400">Valeur/heure</p>
                    <p className="text-sm font-bold text-gray-900 dark:text-white">
                      {formatCurrency(stats.valuePerHour)} {settings?.currency}
                    </p>
                  </div>
                  <div className="text-center p-2 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                    <p className="text-xs text-gray-500 dark:text-gray-400">Valeur/token</p>
                    <p className="text-sm font-bold text-gray-900 dark:text-white">
                      {formatCurrency(stats.valuePerToken)} {settings?.currency}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Métriques des projets publics */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2 mb-4">
          <Eye className="w-5 h-5" />
          Impact public
        </h2>
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="text-center">
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{metricsStats.totalViews}</p>
            <p className="text-xs text-gray-500">Vues totales</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-red-500">{metricsStats.totalLikes}</p>
            <p className="text-xs text-gray-500">Likes reçus</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-blue-500">{metricsStats.totalComments}</p>
            <p className="text-xs text-gray-500">Commentaires</p>
          </div>
        </div>
        
        {metricsStats.projectsMetrics.length > 0 && (
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">Détail par projet</h3>
            {metricsStats.projectsMetrics.slice(0, 5).map((metric) => (
              <div key={metric.projectId} className="flex items-center justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400 truncate max-w-[150px]">{metric.projectName}</span>
                <div className="flex gap-4">
                  <span className="text-gray-500">👁️ {metric.views}</span>
                  <span className="text-red-500">❤️ {metric.likes}</span>
                  <span className="text-blue-500">💬 {metric.comments}</span>
                </div>
              </div>
            ))}
          </div>
        )}
        
        <button 
          onClick={() => onNavigate?.('public-projects')}
          className="block text-center mt-4 text-sm text-blue-600 hover:underline w-full"
        >
          Voir tous les projets publics →
        </button>
      </div>

      {/* Demandes de collaboration */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Users className="w-5 h-5" />
            Demandes de collaboration
            {pendingRequestsCount > 0 && (
              <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">
                {pendingRequestsCount} nouvelle{s}
              </span>
            )}
          </h2>
          <Link
            to="/collaborations"
            className="text-sm text-blue-600 hover:underline"
          >
            Voir tout
          </Link>
        </div>
        
        {collaborationRequests.length === 0 ? (
          <p className="text-center text-gray-500 py-8">
            Aucune demande de collaboration pour le moment
          </p>
        ) : (
          <div className="space-y-3">
            {collaborationRequests.map((request) => (
              <div key={request.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-gray-900 dark:text-white">{request.project_name}</p>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      request.status === 'pending' 
                        ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300'
                        : request.status === 'accepted'
                        ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300'
                        : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
                    }`}>
                      {request.status === 'pending' ? 'En attente' : request.status === 'accepted' ? 'Acceptée' : 'Refusée'}
                    </span>
                    {request.unread_count > 0 && (
                      <span className="bg-blue-500 text-white text-xs px-2 py-0.5 rounded-full">
                        {request.unread_count} nouveau{x}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    De : {request.requester_name} ({request.requester_email})
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {new Date(request.created_at).toLocaleDateString('fr-FR')}
                  </p>
                </div>
                <Link
                  to={`/collaboration/${request.id}`}
                  className="px-3 py-1.5 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                >
                  Voir
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Conseils et astuces */}
      <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl p-6 text-white">
        <div className="flex items-start gap-4">
          <Brain className="w-8 h-8 flex-shrink-0 opacity-90" />
          <div>
            <h3 className="text-lg font-semibold mb-2">Astuce du jour</h3>
            <p className="text-blue-100 mb-3">
              Vous avez {stats.activeProjects} projet{stats.activeProjects > 1 ? 's' : ''} en cours de développement.
              {stats.successRate < 50 
                ? ' Essayez de valider plus fréquemment vos sessions pour améliorer votre taux de réussite.'
                : ' Continuez sur cette lancée ! Votre taux de réussite est excellent.'}
            </p>
            <button className="px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg text-sm font-medium transition-colors">
              Voir les recommandations
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}