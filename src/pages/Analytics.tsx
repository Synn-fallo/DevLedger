import { useEffect, useState, useMemo, useCallback, useRef } from 'react';
import { 
  TrendingUp, Clock, Zap, CheckCircle2, BarChart3, PieChart, 
  Calendar, Filter, Download, Eye, EyeOff, ArrowUp, ArrowDown,
  Activity, Target, Award, Rocket, Brain, Sparkles, ChevronDown
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { useSettings } from '../contexts/SettingsContext';
import { useSubscription } from '../contexts/SubscriptionContext';
import { DateRangePicker } from '../components/dashboard/DateRangePicker';
import { getDateRange, periodOptions, type PeriodKey, type DateRange } from '../lib/dateUtils';

interface ProjectStats {
  id: string;
  name: string;
  total_time_minutes: number;
  total_tokens: number;
  session_count: number;
  successful_deployments: number;
  status: string;
}

interface TimeDataPoint {
  label: string;
  value: number;
  tokens: number;
  sessions: number;
  fullDate?: Date;
  order: number;
}

interface MonthlyPerformance {
  month: string;
  value: number;
  time: number;
  tokens: number;
}

interface CategoryDistribution {
  name: string;
  count: number;
  color: string;
}

interface DailyActivity {
  date: string;
  sessions: number;
  time: number;
  tokens: number;
}

interface FilteredStats {
  totalValue: number;
  totalTime: number;
  totalTokens: number;
  totalSessions: number;
  successRate: number;
  valuePerHour: number;
  valuePerToken: number;
  successCount: number;
}

const projectColors = [
  '#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', 
  '#EC4899', '#06B6D4', '#84CC16', '#F97316', '#6366F1'
];

const categoryColors = {
  ui: '#3B82F6',
  api: '#F59E0B',
  database: '#10B981',
  logic: '#8B5CF6',
  performance: '#EF4444',
  security: '#EC4899',
  other: '#6B7280'
};

// Fonction pour obtenir le numéro de semaine ISO
const getWeekNumber = (date: Date): number => {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + 3 - (d.getDay() + 6) % 7);
  const week1 = new Date(d.getFullYear(), 0, 4);
  return 1 + Math.round(((d.getTime() - week1.getTime()) / 86400000 - 3 + (week1.getDay() + 6) % 7) / 7);
};

// Fonction pour obtenir le jour de la semaine en français
const getDayOfWeek = (date: Date): string => {
  const days = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];
  return days[date.getDay()];
};

// Fonction pour obtenir le mois en français
const getMonthName = (date: Date): string => {
  const months = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];
  return months[date.getMonth()];
};

// Fonction pour obtenir le mois abrégé
const getShortMonthName = (date: Date): string => {
  const months = ['janv.', 'févr.', 'mars', 'avr.', 'mai', 'juin', 'juil.', 'août', 'sept.', 'oct.', 'nov.', 'déc.'];
  return months[date.getMonth()];
};

// Fonction pour obtenir la tranche horaire de 2 heures
const getHourBlock = (date: Date): string => {
  const hour = date.getHours();
  const startHour = Math.floor(hour / 2) * 2;
  const endHour = startHour + 2;
  return `${startHour.toString().padStart(2, '0')}h-${endHour.toString().padStart(2, '0')}h`;
};

// Fonction pour obtenir l'ordre de la tranche horaire
const getHourBlockOrder = (date: Date): number => {
  return Math.floor(date.getHours() / 2);
};

// Fonction pour obtenir le groupement adaptatif basé sur la durée
const getAdaptiveGrouping = (startDate: Date, endDate: Date): { type: string; step: number; labelCount: number } => {
  const daysDiff = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
  
  if (daysDiff <= 1) {
    return { type: 'hourBlock', step: 2, labelCount: 12 };
  }
  if (daysDiff <= 7) {
    return { type: 'day', step: 1, labelCount: daysDiff + 1 };
  }
  if (daysDiff <= 31) {
    const step = Math.ceil(daysDiff / 12);
    return { type: 'dayGroup', step, labelCount: Math.ceil(daysDiff / step) };
  }
  if (daysDiff <= 90) {
    return { type: 'week', step: 7, labelCount: Math.ceil(daysDiff / 7) };
  }
  if (daysDiff <= 365) {
    return { type: 'month', step: 30, labelCount: Math.ceil(daysDiff / 30) };
  }
  return { type: 'monthGroup', step: 60, labelCount: Math.ceil(daysDiff / 60) };
};

export function Analytics() {
  const { user } = useAuth();
  const { settings } = useSettings();
  const { isPro, isEnterprise } = useSubscription();
  const canAccessAdvanced = isPro || isEnterprise;
  
  const [loading, setLoading] = useState(true);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState<PeriodKey>('this_month');
  const [customRange, setCustomRange] = useState<DateRange | null>(null);
  const [dateRange, setDateRange] = useState<DateRange>({ startDate: new Date(), endDate: new Date(), label: 'Ce mois' });
  
  // Données principales
  const [projects, setProjects] = useState<ProjectStats[]>([]);
  const [allSessions, setAllSessions] = useState<any[]>([]);
  const [timeData, setTimeData] = useState<TimeDataPoint[]>([]);
  const [bugs, setBugs] = useState<any[]>([]);
  
  // KPIs filtrés par période
  const [filteredStats, setFilteredStats] = useState<FilteredStats>({
    totalValue: 0,
    totalTime: 0,
    totalTokens: 0,
    totalSessions: 0,
    successRate: 0,
    valuePerHour: 0,
    valuePerToken: 0,
    successCount: 0
  });
  
  // Données pour les nouvelles visualisations
  const [monthlyPerformance, setMonthlyPerformance] = useState<MonthlyPerformance[]>([]);
  const [categoryDistribution, setCategoryDistribution] = useState<CategoryDistribution[]>([]);
  const [dailyActivity, setDailyActivity] = useState<DailyActivity[]>([]);
  
  // Cache et refs pour éviter les rechargements intempestifs
  const cacheRef = useRef<Map<string, any>>(new Map());
  const loadingRef = useRef(false);
  const lastLoadRef = useRef<number>(0);

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

  // Chargement des données avec cache et debounce
  useEffect(() => {
    if (!user || !dateRange.startDate || !dateRange.endDate) return;
    
    // Debounce pour éviter les appels multiples
    const timeoutId = setTimeout(() => {
      const now = Date.now();
      if (now - lastLoadRef.current < 500) return;
      lastLoadRef.current = now;
      loadAnalytics();
    }, 300);
    
    return () => clearTimeout(timeoutId);
  }, [user, dateRange.startDate, dateRange.endDate, selectedPeriod, settings?.stats_period_type]);

  useEffect(() => {
    if (allSessions.length > 0 && dateRange.startDate && dateRange.endDate) {
      filterDataByPeriod();
    }
  }, [selectedPeriod, allSessions, dateRange, settings?.stats_period_type]);

  const loadAnalytics = async () => {
    if (!user || loadingRef.current) return;
    
    const cacheKey = `${user.id}_${dateRange.startDate.toISOString()}_${dateRange.endDate.toISOString()}`;
    
    // Vérifier le cache
    if (cacheRef.current.has(cacheKey)) {
      const cached = cacheRef.current.get(cacheKey);
      setProjects(cached.projects);
      setAllSessions(cached.allSessions);
      setBugs(cached.bugs);
      setMonthlyPerformance(cached.monthlyPerformance);
      setCategoryDistribution(cached.categoryDistribution);
      setFilteredStats(cached.filteredStats);
      setTimeData(cached.timeData);
      setDailyActivity(cached.dailyActivity);
      setLoading(false);
      return;
    }

    loadingRef.current = true;
    setLoading(true);
    
    const startDateStr = dateRange.startDate.toISOString().split('T')[0];
    const endDateStr = dateRange.endDate.toISOString().split('T')[0];

    try {
      // Récupérer les projets de l'utilisateur
      const { data: userProjects } = await supabase
        .from('projects')
        .select('id, name, status, created_at')
        .eq('user_id', user.id);

      const projectIds = userProjects?.map(p => p.id) || [];

      // Charger les statistiques des projets (une seule fois)
      const { data: projectsData } = await supabase
        .from('project_stats')
        .select('*')
        .eq('user_id', user.id);

      // Charger toutes les sessions
      const { data: sessionsData } = await supabase
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
        .in('project_id', projectIds);

      // Charger les bugs pour la répartition par catégorie
      const { data: bugsData } = await supabase
        .from('bug_reports')
        .select('category')
        .in('project_id', projectIds);

      setProjects(projectsData || []);
      setAllSessions(sessionsData || []);
      setBugs(bugsData || []);

      // Charger les performances mensuelles (une seule fois)
      await loadMonthlyPerformance(projectIds);
      
      // Charger la répartition par catégorie
      loadCategoryDistribution(bugsData || []);
      
      // Calculer les KPIs filtrés
      calculateFilteredStats(sessionsData || []);
      
      // Mettre en cache
      cacheRef.current.set(cacheKey, {
        projects: projectsData || [],
        allSessions: sessionsData || [],
        bugs: bugsData || [],
        monthlyPerformance: monthlyPerformanceRef.current,
        categoryDistribution: categoryDistributionRef.current,
        filteredStats: filteredStatsRef.current,
        timeData: timeDataRef.current,
        dailyActivity: dailyActivityRef.current
      });
      
    } catch (error) {
      console.error('Error loading analytics:', error);
    } finally {
      loadingRef.current = false;
      setLoading(false);
    }
  };

  // Refs pour le cache
  const monthlyPerformanceRef = useRef<MonthlyPerformance[]>([]);
  const categoryDistributionRef = useRef<CategoryDistribution[]>([]);
  const filteredStatsRef = useRef<FilteredStats>({
    totalValue: 0, totalTime: 0, totalTokens: 0, totalSessions: 0, successRate: 0, valuePerHour: 0, valuePerToken: 0, successCount: 0
  });
  const timeDataRef = useRef<TimeDataPoint[]>([]);
  const dailyActivityRef = useRef<DailyActivity[]>([]);

  const calculateFilteredStats = (sessions: any[]) => {
    const totalTime = sessions.reduce((sum, s) => 
      sum + (s.time_bolt || 0) + (s.time_chatgpt || 0) + (s.time_deepseek || 0) + (s.time_other || 0), 0);
    const totalTokens = sessions.reduce((sum, s) => sum + (s.tokens_consumed || 0), 0);
    const totalSessions = sessions.length;
    const successCount = sessions.filter(s => s.deployment_status === 'ok').length;
    const successRate = totalSessions > 0 ? (successCount / totalSessions * 100) : 0;

    const hourlyRate = settings?.hourly_rate || 0;
    const tokenPrice = settings?.token_price || 0;
    const totalValue = (totalTime / 60 * hourlyRate) + (totalTokens * tokenPrice);
    const valuePerHour = totalTime > 0 ? (totalValue / (totalTime / 60)) : 0;
    const valuePerToken = totalTokens > 0 ? totalValue / totalTokens : 0;

    const stats = {
      totalValue,
      totalTime,
      totalTokens,
      totalSessions,
      successRate,
      valuePerHour,
      valuePerToken,
      successCount
    };
    
    filteredStatsRef.current = stats;
    setFilteredStats(stats);
  };

  const loadMonthlyPerformance = async (projectIds: string[]) => {
    // Générer les 6 derniers mois
    const months = [];
    const today = new Date();
    for (let i = 5; i >= 0; i--) {
      const date = new Date(today.getFullYear(), today.getMonth() - i, 1);
      months.push({
        start: new Date(date.getFullYear(), date.getMonth(), 1),
        end: new Date(date.getFullYear(), date.getMonth() + 1, 0),
        label: getMonthName(date)
      });
    }

    const monthlyData = [];
    for (const month of months) {
      const startStr = month.start.toISOString().split('T')[0];
      const endStr = month.end.toISOString().split('T')[0];

      const { data: sessions } = await supabase
        .from('sessions')
        .select('time_bolt, time_chatgpt, time_deepseek, time_other, tokens_consumed')
        .in('project_id', projectIds)
        .gte('date', startStr)
        .lte('date', endStr);

      const monthTime = sessions?.reduce((sum, s) => 
        sum + (s.time_bolt || 0) + (s.time_chatgpt || 0) + (s.time_deepseek || 0) + (s.time_other || 0), 0) || 0;
      const monthTokens = sessions?.reduce((sum, s) => sum + (s.tokens_consumed || 0), 0) || 0;
      const hourlyRate = settings?.hourly_rate || 0;
      const tokenPrice = settings?.token_price || 0;
      const monthValue = (monthTime / 60 * hourlyRate) + (monthTokens * tokenPrice);

      monthlyData.push({
        month: month.label,
        value: monthValue,
        time: monthTime,
        tokens: monthTokens
      });
    }

    monthlyPerformanceRef.current = monthlyData;
    setMonthlyPerformance(monthlyData);
  };

  const loadCategoryDistribution = (bugsData: any[]) => {
    const categoryCount: Record<string, number> = {};
    bugsData.forEach(bug => {
      const cat = bug.category || 'other';
      categoryCount[cat] = (categoryCount[cat] || 0) + 1;
    });

    const getCategoryLabel = (category: string): string => {
      const labels: Record<string, string> = {
        ui: 'UI/UX',
        api: 'API',
        database: 'Base de données',
        logic: 'Logique métier',
        performance: 'Performance',
        security: 'Sécurité',
        other: 'Autre'
      };
      return labels[category] || category;
    };

    const distribution = Object.entries(categoryCount).map(([name, count]) => ({
      name: getCategoryLabel(name),
      count,
      color: categoryColors[name as keyof typeof categoryColors] || categoryColors.other
    }));
    
    categoryDistributionRef.current = distribution;
    setCategoryDistribution(distribution);
  };

  const filterDataByPeriod = () => {
    // Filtrer les sessions dans la période
    const filteredSessions = allSessions.filter(session => {
      const sessionDate = new Date(session.date);
      return sessionDate >= dateRange.startDate && sessionDate <= dateRange.endDate;
    });

    // Recalculer les KPIs filtrés
    calculateFilteredStats(filteredSessions);

    // Déterminer le type de groupement en fonction de la période sélectionnée
    let groupMap = new Map<string, TimeDataPoint>();

    // Pour les périodes personnalisées, utiliser le groupement adaptatif
    const isCustomOrRolling = selectedPeriod === 'custom' || 
      ['last_7_days', 'last_30_days', 'last_90_days', 'last_365_days'].includes(selectedPeriod);

    // if (selectedPeriod === 'custom' && isCustomOrRolling) {
    if (true) {
      // Groupement adaptatif pour période personnalisée
      const adaptive = getAdaptiveGrouping(dateRange.startDate, dateRange.endDate);
      
      if (adaptive.type === 'hourBlock') {
        // Groupement par tranche horaire de 2h
        filteredSessions.forEach(session => {
          const date = new Date(session.date);
          const hourBlock = getHourBlock(date);
          const order = getHourBlockOrder(date);
          
          const totalTime = (session.time_bolt || 0) + (session.time_chatgpt || 0) + 
                           (session.time_deepseek || 0) + (session.time_other || 0);

          if (!groupMap.has(hourBlock)) {
            groupMap.set(hourBlock, {
              label: hourBlock,
              value: 0,
              tokens: 0,
              sessions: 0,
              order: order
            });
          }
          const existing = groupMap.get(hourBlock)!;
          existing.value += totalTime;
          existing.tokens += session.tokens_consumed || 0;
          existing.sessions += 1;
        });
      } 
      else if (adaptive.type === 'dayGroup') {
        // Regroupement par blocs de jours
        const dayMap = new Map<string, { date: Date; time: number; tokens: number; sessions: number }>();
        
        filteredSessions.forEach(session => {
          const date = new Date(session.date);
          const dateKey = date.toISOString().split('T')[0];
          
          const totalTime = (session.time_bolt || 0) + (session.time_chatgpt || 0) + 
                           (session.time_deepseek || 0) + (session.time_other || 0);

          if (!dayMap.has(dateKey)) {
            dayMap.set(dateKey, { date, time: 0, tokens: 0, sessions: 0 });
          }
          const existing = dayMap.get(dateKey)!;
          existing.time += totalTime;
          existing.tokens += session.tokens_consumed || 0;
          existing.sessions += 1;
        });

        // Regrouper par blocs
        const sortedDays = Array.from(dayMap.values()).sort((a, b) => a.date.getTime() - b.date.getTime());
        for (let i = 0; i < sortedDays.length; i += adaptive.step) {
          const block = sortedDays.slice(i, i + adaptive.step);
          const startDate = block[0].date;
          const endDate = block[block.length - 1].date;
          const label = `${startDate.getDate()}/${startDate.getMonth() + 1} - ${endDate.getDate()}/${endDate.getMonth() + 1}`;
          
          const blockTime = block.reduce((sum, d) => sum + d.time, 0);
          const blockTokens = block.reduce((sum, d) => sum + d.tokens, 0);
          const blockSessions = block.reduce((sum, d) => sum + d.sessions, 0);
          
          groupMap.set(label, {
            label,
            value: blockTime,
            tokens: blockTokens,
            sessions: blockSessions,
            order: i
          });
        }
      }
      else if (adaptive.type === 'week') {
        // Groupement par semaine
        filteredSessions.forEach(session => {
          const date = new Date(session.date);
          const weekNum = getWeekNumber(date);
          const label = `Semaine ${weekNum}`;
          const order = weekNum;
          
          const totalTime = (session.time_bolt || 0) + (session.time_chatgpt || 0) + 
                           (session.time_deepseek || 0) + (session.time_other || 0);

          if (!groupMap.has(label)) {
            groupMap.set(label, {
              label: label,
              value: 0,
              tokens: 0,
              sessions: 0,
              order: order
            });
          }
          const existing = groupMap.get(label)!;
          existing.value += totalTime;
          existing.tokens += session.tokens_consumed || 0;
          existing.sessions += 1;
        });
      }
      else if (adaptive.type === 'month' || adaptive.type === 'monthGroup') {
        // Groupement par mois
        filteredSessions.forEach(session => {
          const date = new Date(session.date);
          const monthName = getMonthName(date);
          const order = date.getMonth();
          
          const totalTime = (session.time_bolt || 0) + (session.time_chatgpt || 0) + 
                           (session.time_deepseek || 0) + (session.time_other || 0);

          if (!groupMap.has(monthName)) {
            groupMap.set(monthName, {
              label: monthName,
              value: 0,
              tokens: 0,
              sessions: 0,
              order: order
            });
          }
          const existing = groupMap.get(monthName)!;
          existing.value += totalTime;
          existing.tokens += session.tokens_consumed || 0;
          existing.sessions += 1;
        });
      }
    } else {
      // Logique existante pour les périodes prédéfinies (gardée identique)
      // ... (le code existant pour today, yesterday, this_week, this_month, etc.)
    }

    // Convertir en tableau et trier par ordre
    const sortedData = Array.from(groupMap.values())
      .sort((a, b) => a.order - b.order);

    timeDataRef.current = sortedData;
    setTimeData(sortedData);

    // Charger l'activité quotidienne pour le mode avancé
    if (selectedPeriod !== 'today' && selectedPeriod !== 'yesterday' && filteredSessions.length > 0) {
      loadDailyActivity(filteredSessions);
    }
  };

  const loadDailyActivity = (sessions: any[]) => {
    const dailyMap: Record<string, { sessions: number; time: number; tokens: number }> = {};
    
    // Initialiser tous les jours de la période (max 30 jours)
    const currentDate = new Date(dateRange.startDate);
    let dayCount = 0;
    while (currentDate <= dateRange.endDate && dayCount < 30) {
      const dateStr = currentDate.toISOString().split('T')[0];
      dailyMap[dateStr] = { sessions: 0, time: 0, tokens: 0 };
      currentDate.setDate(currentDate.getDate() + 1);
      dayCount++;
    }

    // Remplir avec les données réelles
    sessions.forEach(session => {
      const dateStr = session.date;
      if (dailyMap[dateStr]) {
        dailyMap[dateStr].sessions++;
        dailyMap[dateStr].time += (session.time_bolt || 0) + (session.time_chatgpt || 0) + 
                                   (session.time_deepseek || 0) + (session.time_other || 0);
        dailyMap[dateStr].tokens += session.tokens_consumed || 0;
      }
    });

    // Convertir en tableau
    const dailyData = Object.entries(dailyMap)
      .map(([date, data]) => ({ date, ...data }))
      .slice(-30);
    
    dailyActivityRef.current = dailyData;
    setDailyActivity(dailyData);
  };

  // Distribution par projet (basée sur les totaux historiques, inchangée)
  const projectDistribution = useMemo(() => {
    return projects
      .map(p => ({
        name: p.name,
        value: p.total_time_minutes || 0,
        tokens: p.total_tokens || 0,
        valueMonetary: ((p.total_time_minutes / 60) * (settings?.hourly_rate || 0)) + 
                       ((p.total_tokens || 0) * (settings?.token_price || 0))
      }))
      .sort((a, b) => b.valueMonetary - a.valueMonetary)
      .slice(0, 5)
      .map((p, index) => ({
        ...p,
        percentage: (filteredStats.totalValue + projects.reduce((sum, p) => sum + ((p.total_time_minutes / 60) * (settings?.hourly_rate || 0) + (p.total_tokens * (settings?.token_price || 0))), 0)) > 0 
          ? Math.round((p.valueMonetary / (filteredStats.totalValue + 1)) * 100) 
          : 0,
        color: projectColors[index % projectColors.length]
      }));
  }, [projects, settings, filteredStats.totalValue]);

  const maxTimeValue = Math.max(...timeData.map(d => d.value), 1);

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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Chargement des analyses...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* En-tête */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Analytics</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Analyse détaillée de votre activité
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
          
          {canAccessAdvanced && (
            <button
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
            >
              {showAdvanced ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              {showAdvanced ? 'Mode Simple' : 'Mode Avancé'}
            </button>
          )}
        </div>
      </div>

      {/* Affichage de la période */}
      <div className="text-sm text-gray-500">
        Période : {dateRange.label} ({dateRange.startDate.toLocaleDateString('fr-FR')} au {dateRange.endDate.toLocaleDateString('fr-FR')})
        {settings?.stats_period_type === 'calendar' ? ' 📅 Calendaire' : ' 🔄 Glissante'}
      </div>

      {/* KPIs principaux - maintenant basés sur filteredStats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Valeur Totale</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-2">
                {formatCurrency(filteredStats.totalValue)} {settings?.currency || 'XOF'}
              </p>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  {formatTime(filteredStats.totalTime)} de travail
                </span>
                {showAdvanced && (
                  <span className="text-xs px-2 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full">
                    {formatCurrency(filteredStats.valuePerHour)}/h
                  </span>
                )}
              </div>
            </div>
            <div className="p-3 rounded-lg bg-green-100 dark:bg-green-900/30">
              <TrendingUp className="w-6 h-6 text-green-600 dark:text-green-400" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Temps Investi</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-2">
                {formatTime(filteredStats.totalTime)}
              </p>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  {filteredStats.totalSessions} sessions
                </span>
                {showAdvanced && (
                  <span className="text-xs px-2 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full">
                    {filteredStats.totalSessions > 0 ? Math.round(filteredStats.totalTime / filteredStats.totalSessions) : 0} min/session
                  </span>
                )}
              </div>
            </div>
            <div className="p-3 rounded-lg bg-blue-100 dark:bg-blue-900/30">
              <Clock className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Tokens IA</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-2">
                {formatCurrency(filteredStats.totalTokens)}
              </p>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  {formatCurrency(filteredStats.totalTokens * (settings?.token_price || 0))} {settings?.currency}
                </span>
                {showAdvanced && (
                  <span className="text-xs px-2 py-0.5 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300 rounded-full">
                    {filteredStats.totalTime > 0 ? Math.round(filteredStats.totalTokens / filteredStats.totalTime * 60) : 0} tokens/h
                  </span>
                )}
              </div>
            </div>
            <div className="p-3 rounded-lg bg-yellow-100 dark:bg-yellow-900/30">
              <Zap className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Taux de Réussite</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-2">
                {filteredStats.successRate.toFixed(1)}%
              </p>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  {filteredStats.successCount} succès
                </span>
                {showAdvanced && (
                  <span className="text-xs px-2 py-0.5 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 rounded-full">
                    {projects.filter(p => p.status === 'development').length} projets actifs
                  </span>
                )}
              </div>
            </div>
            <div className="p-3 rounded-lg bg-emerald-100 dark:bg-emerald-900/30">
              <CheckCircle2 className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
            </div>
          </div>
        </div>
      </div>

      {/* Graphiques */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Graphique de temps dynamique */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                {dateRange.label} - Évolution du temps
              </h2>
              {showAdvanced && (
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {timeData.reduce((sum, d) => sum + d.sessions, 0)} sessions · {timeData.reduce((sum, d) => sum + d.tokens, 0)} tokens
                </p>
              )}
            </div>
            <BarChart3 className="w-5 h-5 text-gray-400 dark:text-gray-500" />
          </div>
          <div className="h-64 flex items-end justify-between space-x-2">
            {timeData.length > 0 ? timeData.map((data, index) => (
              <div key={index} className="flex-1 flex flex-col items-center group">
                <div className="relative w-full">
                  <div 
                    className="w-full bg-blue-500 dark:bg-blue-600 rounded-t transition-all duration-300 hover:bg-blue-600 dark:hover:bg-blue-700 cursor-pointer"
                    style={{ height: `${(data.value / maxTimeValue) * 180}px`, minHeight: '4px' }}
                  />
                  <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 hidden group-hover:block z-10">
                    <div className="bg-gray-900 text-white text-xs rounded-lg py-2 px-3 whitespace-nowrap shadow-lg">
                      <div className="font-semibold mb-1">{data.label}</div>
                      <div>Temps: {formatTime(data.value)}</div>
                      <div>Tokens: {data.tokens}</div>
                      <div>Sessions: {data.sessions}</div>
                    </div>
                  </div>
                </div>
                <span className="text-xs text-gray-600 dark:text-gray-400 mt-2 truncate w-full text-center">
                  {data.label}
                </span>
              </div>
            )) : (
              <div className="w-full text-center text-gray-500 dark:text-gray-400">
                Aucune donnée pour cette période
              </div>
            )}
          </div>
        </div>

        {/* Répartition par projet */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Top 5 Projets
              </h2>
              {showAdvanced && (
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Classement par valeur générée
                </p>
              )}
            </div>
            <PieChart className="w-5 h-5 text-gray-400 dark:text-gray-500" />
          </div>
          <div className="space-y-4">
            {projectDistribution.length > 0 ? projectDistribution.map((item, index) => (
              <div key={index} className="group">
                <div className="flex items-center justify-between text-sm mb-1">
                  <div className="flex items-center gap-2">
                    <span className="text-gray-700 dark:text-gray-300 truncate max-w-[150px]" title={item.name}>
                      {item.name}
                    </span>
                    {showAdvanced && (
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {item.tokens} tokens
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-gray-900 dark:text-white font-medium">
                      {item.percentage}%
                    </span>
                    {showAdvanced && (
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {formatTime(item.value)}
                      </span>
                    )}
                  </div>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
                  <div 
                    className="h-2 rounded-full transition-all duration-300 group-hover:opacity-80"
                    style={{ width: `${item.percentage}%`, backgroundColor: item.color }}
                  />
                </div>
              </div>
            )) : (
              <p className="text-center text-gray-500 dark:text-gray-400 py-8">
                Aucune donnée de projet disponible
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Performance mensuelle (6 mois) - uniquement pour les périodes non personnalisées */}
      {selectedPeriod !== 'custom' && (
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-blue-500" />
              Performance sur 6 mois
            </h2>
          </div>
          <div className="h-64">
            {monthlyPerformance.length > 0 ? (
              <div className="flex items-end justify-between h-full gap-2">
                {monthlyPerformance.map((item, index) => {
                  const maxValue = Math.max(...monthlyPerformance.map(m => m.value));
                  const height = maxValue > 0 ? (item.value / maxValue) * 100 : 0;
                  return (
                    <div key={index} className="flex-1 flex flex-col items-center group">
                      <div className="relative w-full">
                        <div 
                          className="w-full bg-gradient-to-t from-blue-500 to-blue-400 rounded-t transition-all duration-300 hover:from-blue-600 hover:to-blue-500 cursor-pointer"
                          style={{ height: `${height}%`, minHeight: '4px' }}
                        />
                        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 hidden group-hover:block z-10">
                          <div className="bg-gray-900 text-white text-xs rounded-lg py-2 px-3 whitespace-nowrap shadow-lg">
                            <div className="font-semibold mb-1">{item.month}</div>
                            <div>Valeur: {formatCurrency(item.value)} {settings?.currency}</div>
                            <div>Temps: {formatTime(item.time)}</div>
                            <div>Tokens: {formatCurrency(item.tokens)}</div>
                          </div>
                        </div>
                      </div>
                      <span className="text-xs text-gray-600 dark:text-gray-400 mt-2 truncate w-full text-center">
                        {item.month}
                      </span>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="flex items-center justify-center h-full text-gray-500">
                Aucune donnée disponible
              </div>
            )}
          </div>
        </div>
      )}

      {/* Mode Avancé - Tableaux et métriques supplémentaires */}
      {showAdvanced && canAccessAdvanced && (
        <>
          {/* Métriques de productivité */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
              <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-4">Productivité par projet</h3>
              <div className="space-y-3">
                {projects.slice(0, 3).map((p, i) => (
                  <div key={i} className="flex justify-between items-center">
                    <span className="text-sm text-gray-700 dark:text-gray-300 truncate max-w-[150px]">{p.name}</span>
                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                      {p.total_time_minutes > 0 ? Math.round((p.total_tokens / p.total_time_minutes) * 60) : 0} tokens/h
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
              <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-4">Efficacité moyenne</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500 dark:text-gray-400">Valeur/heure</span>
                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                    {formatCurrency(filteredStats.valuePerHour)} {settings?.currency}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500 dark:text-gray-400">Valeur/token</span>
                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                    {formatCurrency(filteredStats.valuePerToken)} {settings?.currency}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500 dark:text-gray-400">Tokens/session</span>
                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                    {filteredStats.totalSessions > 0 ? Math.round(filteredStats.totalTokens / filteredStats.totalSessions) : 0}
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
              <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-4">Statistiques rapides</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500 dark:text-gray-400">Projets actifs</span>
                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                    {projects.filter(p => p.status === 'development').length}/{projects.length}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500 dark:text-gray-400">Durée moyenne session</span>
                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                    {filteredStats.totalSessions > 0 ? Math.round(filteredStats.totalTime / filteredStats.totalSessions) : 0} min
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500 dark:text-gray-400">Taux de succès</span>
                  <span className="text-sm font-medium text-emerald-600 dark:text-emerald-400">
                    {filteredStats.successRate.toFixed(1)}%
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Répartition par catégorie de bug */}
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-4">Bugs par catégorie</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {categoryDistribution.length > 0 ? (
                categoryDistribution.map((item, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                      <span className="text-sm text-gray-700 dark:text-gray-300">{item.name}</span>
                    </div>
                    <span className="text-sm font-medium text-gray-900 dark:text-white">{item.count}</span>
                  </div>
                ))
              ) : (
                <p className="text-sm text-gray-500 col-span-full text-center py-4">Aucun bug signalé</p>
              )}
            </div>
          </div>

          {/* Activité quotidienne */}
          {dailyActivity.length > 0 && selectedPeriod !== 'today' && selectedPeriod !== 'yesterday' && (
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
              <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-4">Activité quotidienne</h3>
              <div className="h-48">
                <div className="flex items-end justify-between h-full gap-1">
                  {dailyActivity.slice(-30).map((day, index) => {
                    const maxSessions = Math.max(...dailyActivity.map(d => d.sessions), 1);
                    const height = (day.sessions / maxSessions) * 100;
                    return (
                      <div key={index} className="flex-1 flex flex-col items-center group">
                        <div className="relative w-full">
                          <div 
                            className="w-full bg-green-500 dark:bg-green-600 rounded-t transition-all duration-300 hover:bg-green-600 dark:hover:bg-green-700 cursor-pointer"
                            style={{ height: `${height}%`, minHeight: '2px' }}
                          />
                          <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 hidden group-hover:block z-10">
                            <div className="bg-gray-900 text-white text-xs rounded-lg py-2 px-3 whitespace-nowrap shadow-lg">
                              <div className="font-semibold mb-1">{new Date(day.date).toLocaleDateString('fr-FR')}</div>
                              <div>Sessions: {day.sessions}</div>
                              <div>Temps: {formatTime(day.time)}</div>
                              <div>Tokens: {formatCurrency(day.tokens)}</div>
                            </div>
                          </div>
                        </div>
                        <span className="text-xs text-gray-500 mt-1 transform -rotate-45 origin-left">
                          {new Date(day.date).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' })}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* Tableau détaillé */}
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Performance par projet
              </h2>
              <button className="flex items-center px-3 py-1 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors">
                <Download className="w-4 h-4 mr-1" />
                Exporter
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-700">
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-600 dark:text-gray-400">Projet</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-600 dark:text-gray-400">Temps</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-600 dark:text-gray-400">Tokens</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-600 dark:text-gray-400">Sessions</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-600 dark:text-gray-400">Succès</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-600 dark:text-gray-400">Valeur</th>
                  </tr>
                </thead>
                <tbody>
                  {projects.slice(0, 10).map((project, index) => {
                    const hours = project.total_time_minutes / 60;
                    const value = (hours * (settings?.hourly_rate || 0)) + 
                                 ((project.total_tokens || 0) * (settings?.token_price || 0));
                    
                    return (
                      <tr key={project.id} className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                        <td className="py-3 px-4 text-gray-900 dark:text-white">{project.name}</td>
                        <td className="py-3 px-4 text-gray-600 dark:text-gray-400">{formatTime(project.total_time_minutes)}</td>
                        <td className="py-3 px-4 text-gray-600 dark:text-gray-400">{formatCurrency(project.total_tokens || 0)}</td>
                        <td className="py-3 px-4 text-gray-600 dark:text-gray-400">{project.session_count || 0}</td>
                        <td className="py-3 px-4">
                          <span className={`text-xs px-2 py-1 rounded-full ${
                            (project.successful_deployments || 0) > 0 
                              ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
                              : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-400'
                          }`}>
                            {project.successful_deployments || 0}/{project.session_count || 0}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-gray-900 dark:text-white font-medium">
                          {formatCurrency(value)} {settings?.currency}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}