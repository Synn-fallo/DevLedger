// /src/pages/Priorities.tsx
import { useEffect, useState, useMemo, useCallback } from 'react';
import { 
  ExternalLink, Eye, Calendar, Clock, Zap, 
  ChevronDown, ChevronUp, Search, X, Flag,
  ChevronLeft, ChevronRight, ArrowUpDown, Check,
  LayoutGrid, List, Save
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { priorityColors, priorityLabels, priorityIcons } from '../lib/priority';
import { sortOptions, sortOptionsByGroup, groupLabels, groupOrder, defaultSortOption } from '../lib/sortOptions';
import { 
  Priority, ProjectWithStats, UserPreferences, defaultPreferences, 
  priorityRank, Filters 
} from '../types/preferences';
import type { Project } from '../lib/database.types';

interface ProjectsProps {
  onNavigate: (page: string, projectId?: string) => void;
}

const priorityOrder: Priority[] = ['critical', 'high', 'medium', 'low', 'on-hold'];
const ITEMS_PER_PAGE = 12;

export function Priorities({ onNavigate }: ProjectsProps) {
  const { user } = useAuth();
  const [projects, setProjects] = useState<ProjectWithStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingPrefs, setSavingPrefs] = useState(false);
  const [updating, setUpdating] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [expandedProjects, setExpandedProjects] = useState<Set<string>>(new Set());
  const [showSortMenu, setShowSortMenu] = useState(false);
  
  // États des préférences
  const [sortBy, setSortBy] = useState<string>(defaultSortOption);
  const [selectedPriority, setSelectedPriority] = useState<Priority | 'all'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'detailed' | 'compact'>('detailed');
  const [preferencesLoaded, setPreferencesLoaded] = useState(false);

  // ========================================
  // CHARGEMENT DES DONNÉES
  // ========================================

  useEffect(() => {
    if (user) {
      loadUserPreferences();
      loadProjects();
    }
  }, [user]);

  // Charger les préférences utilisateur
  const loadUserPreferences = async () => {
    if (!user) return;

    try {
      const { data } = await supabase
        .from('user_preferences')
        .select('preferences')
        .eq('user_id', user.id)
        .eq('page', 'priorities')
        .maybeSingle();

      if (data?.preferences) {
        const prefs = data.preferences as UserPreferences;
        setSortBy(prefs.sortBy || defaultSortOption);
        setSelectedPriority(prefs.filters?.priority || 'all');
        setSearchTerm(prefs.filters?.search || '');
        setViewMode(prefs.viewMode || 'detailed');
        
        // Mettre à jour le compteur de visites
        await updateVisitCount();
      }
    } catch (error) {
      console.error('Error loading preferences:', error);
    } finally {
      setPreferencesLoaded(true);
    }
  };

  // Mettre à jour le compteur de visites
  const updateVisitCount = async () => {
    if (!user) return;

    const { data } = await supabase
      .from('user_preferences')
      .select('visit_count')
      .eq('user_id', user.id)
      .eq('page', 'priorities')
      .maybeSingle();

    const newCount = (data?.visit_count || 0) + 1;

    await supabase
      .from('user_preferences')
      .upsert({
        user_id: user.id,
        page: 'priorities',
        visit_count: newCount,
        last_visit: new Date().toISOString()
      }, {
        onConflict: 'user_id,page'
      });
  };

  // Sauvegarder les préférences
  const saveUserPreferences = useCallback(async () => {
    if (!user || !preferencesLoaded) return;

    setSavingPrefs(true);

    const preferences: UserPreferences = {
      sortBy,
      filters: {
        priority: selectedPriority,
        search: searchTerm
      },
      viewMode,
      lastUsed: new Date().toISOString(),
      visitCount: 0
    };

    try {
      await supabase
        .from('user_preferences')
        .upsert({
          user_id: user.id,
          page: 'priorities',
          preferences
        }, {
          onConflict: 'user_id,page'
        });
    } catch (error) {
      console.error('Error saving preferences:', error);
    } finally {
      setSavingPrefs(false);
    }
  }, [user, sortBy, selectedPriority, searchTerm, viewMode, preferencesLoaded]);

  // Sauvegarde automatique avec debounce
  useEffect(() => {
    const timeout = setTimeout(() => {
      saveUserPreferences();
    }, 1000);

    return () => clearTimeout(timeout);
  }, [sortBy, selectedPriority, searchTerm, viewMode, saveUserPreferences]);

  // Charger les projets
  const loadProjects = async () => {
    if (!user) return;

    try {
      setLoading(true);
      
      const { data: projectsData } = await supabase
        .from('projects')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (!projectsData || projectsData.length === 0) {
        setProjects([]);
        setLoading(false);
        return;
      }

      const { data: allSessions } = await supabase
        .from('sessions')
        .select('project_id, time_bolt, time_chatgpt, time_perplexity, time_other, tokens_consumed, date')
        .in('project_id', projectsData.map(p => p.id));

      const sessionsByProject = new Map();
      
      allSessions?.forEach(session => {
        if (!sessionsByProject.has(session.project_id)) {
          sessionsByProject.set(session.project_id, []);
        }
        sessionsByProject.get(session.project_id).push(session);
      });

      const projectsWithStats: ProjectWithStats[] = projectsData.map(project => {
        const projectSessions = sessionsByProject.get(project.id) || [];
        
        const totalTime = projectSessions.reduce((sum, s) => 
          sum + (s.time_bolt || 0) + (s.time_chatgpt || 0) + 
          (s.time_perplexity || 0) + (s.time_other || 0), 0
        );

        const totalTokens = projectSessions.reduce((sum, s) => 
          sum + (s.tokens_consumed || 0), 0
        );

        const lastActivity = projectSessions.length > 0
          ? projectSessions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0].date
          : project.created_at;

        return {
          ...project,
          total_time_minutes: totalTime,
          total_tokens: totalTokens,
          session_count: projectSessions.length,
          last_activity: lastActivity
        };
      });

      setProjects(projectsWithStats);
    } catch (error) {
      console.error('Error loading projects:', error);
    } finally {
      setLoading(false);
    }
  };

  // ========================================
  // ACTIONS SUR LES PROJETS
  // ========================================

  const updateProjectPriority = async (projectId: string, newPriority: Priority) => {
    setUpdating(projectId);
    
    const { error } = await supabase
      .from('projects')
      .update({ priority: newPriority, updated_at: new Date() })
      .eq('id', projectId);

    if (!error) {
      setProjects(prev => prev.map(p => 
        p.id === projectId ? { ...p, priority: newPriority } : p
      ));
    }

    setUpdating(null);
  };

  const handleLinkClick = (e: React.MouseEvent, url: string) => {
    e.stopPropagation();
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const toggleProject = (projectId: string) => {
    setExpandedProjects(prev => {
      const newSet = new Set(prev);
      if (newSet.has(projectId)) {
        newSet.delete(projectId);
      } else {
        newSet.add(projectId);
      }
      return newSet;
    });
  };

  const resetToDefault = async () => {
    setSortBy(defaultSortOption);
    setSelectedPriority('all');
    setSearchTerm('');
    setViewMode('detailed');
    setCurrentPage(1);
    
    // Optionnel : supprimer les préférences pour repartir à zéro
    if (user) {
      await supabase
        .from('user_preferences')
        .delete()
        .eq('user_id', user.id)
        .eq('page', 'priorities');
    }
  };

  // ========================================
  // FILTRAGE ET TRI
  // ========================================

  // Filtrer les projets
  const filteredProjects = useMemo(() => {
    return projects.filter(project => {
      const matchesSearch = searchTerm === '' || 
        project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (project.description && project.description.toLowerCase().includes(searchTerm.toLowerCase()));
      
      const matchesPriority = selectedPriority === 'all' || project.priority === selectedPriority;
      
      return matchesSearch && matchesPriority;
    });
  }, [projects, searchTerm, selectedPriority]);

  // Trier les projets
  const sortedProjects = useMemo(() => {
    const option = sortOptions.find(o => o.id === sortBy);
    if (!option) return filteredProjects;

    return [...filteredProjects].sort((a, b) => {
      let valA: any;
      let valB: any;

      switch (option.field) {
        case 'created_at':
          valA = new Date(a.created_at).getTime();
          valB = new Date(b.created_at).getTime();
          break;
        case 'name':
          valA = a.name.toLowerCase();
          valB = b.name.toLowerCase();
          break;
        case 'last_activity':
          valA = new Date(a.last_activity || a.created_at).getTime();
          valB = new Date(b.last_activity || b.created_at).getTime();
          break;
        case 'priority_order':
          valA = priorityRank[a.priority as Priority] || 99;
          valB = priorityRank[b.priority as Priority] || 99;
          break;
        case 'total_time':
          valA = a.total_time_minutes || 0;
          valB = b.total_time_minutes || 0;
          break;
        case 'tokens':
          valA = a.total_tokens || 0;
          valB = b.total_tokens || 0;
          break;
        case 'sessions':
          valA = a.session_count || 0;
          valB = b.session_count || 0;
          break;
        default:
          return 0;
      }

      if (option.direction === 'asc') {
        return valA > valB ? 1 : -1;
      } else {
        return valA < valB ? 1 : -1;
      }
    });
  }, [filteredProjects, sortBy]);

  // Pagination
  const paginatedProjects = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return sortedProjects.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [sortedProjects, currentPage]);

  const totalPages = Math.ceil(sortedProjects.length / ITEMS_PER_PAGE);

  // Réinitialiser la page quand les filtres changent
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedPriority, sortBy]);

  // Statistiques par priorité
  const priorityStats = useMemo(() => {
    return priorityOrder.reduce((acc, priority) => {
      acc[priority] = projects.filter(p => p.priority === priority).length;
      return acc;
    }, {} as Record<Priority, number>);
  }, [projects]);

  // ========================================
  // FORMATAGE
  // ========================================

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  const formatTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h${mins > 0 ? ` ${mins}m` : ''}`;
  };

  const currentSortOption = sortOptions.find(o => o.id === sortBy);

  // ========================================
  // RENDU
  // ========================================

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Chargement des priorités...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* En-tête avec barre d'outils */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Priorités</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            {projects.length} projets · Gérez vos priorités
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Sélecteur de tri */}
          <div className="relative">
            <button
              onClick={() => setShowSortMenu(!showSortMenu)}
              className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              <ArrowUpDown className="w-4 h-4 text-gray-500" />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                {currentSortOption?.icon} {currentSortOption?.label || 'Trier'}
              </span>
              <ChevronDown className="w-4 h-4 text-gray-500" />
            </button>

            {/* Menu déroulant de tri */}
            {showSortMenu && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setShowSortMenu(false)}
                />
                <div className="absolute right-0 mt-2 w-72 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 z-50 py-2">
                  {groupOrder.map(group => (
                    <div key={group}>
                      <div className="px-4 py-2 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider bg-gray-50 dark:bg-gray-700/50">
                        {groupLabels[group]}
                      </div>
                      {sortOptionsByGroup[group]?.map(option => (
                        <button
                          key={option.id}
                          onClick={() => {
                            setSortBy(option.id);
                            setShowSortMenu(false);
                          }}
                          className={`w-full text-left px-4 py-2 text-sm flex items-center gap-3 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors ${
                            sortBy === option.id
                              ? 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20'
                              : 'text-gray-700 dark:text-gray-300'
                          }`}
                        >
                          <span className="text-lg">{option.icon}</span>
                          <span className="flex-1">{option.label}</span>
                          {sortBy === option.id && (
                            <Check className="w-4 h-4" />
                          )}
                        </button>
                      ))}
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Barre de recherche */}
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Rechercher un projet..."
              className="w-full pl-9 pr-8 py-2 border border-gray-300 dark:border-gray-600 rounded-lg
                       bg-white dark:bg-gray-800 text-gray-900 dark:text-white
                       focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Sélecteur de vue */}
          <div className="flex gap-1 border border-gray-300 dark:border-gray-600 rounded-lg p-1 bg-white dark:bg-gray-800">
            <button
              onClick={() => setViewMode('detailed')}
              className={`p-2 rounded-md transition-colors ${
                viewMode === 'detailed'
                  ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
                  : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
              }`}
              title="Vue détaillée"
            >
              <List className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('compact')}
              className={`p-2 rounded-md transition-colors ${
                viewMode === 'compact'
                  ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
                  : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
              }`}
              title="Vue compacte"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
          </div>

          {/* Indicateur de sauvegarde */}
          {savingPrefs && (
            <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
              <Save className="w-3 h-3 animate-pulse" />
              <span>Sauvegarde...</span>
            </div>
          )}
        </div>
      </div>

      {/* Badge de tri actif */}
      <div className="flex items-center gap-2 text-sm">
        <span className="text-gray-600 dark:text-gray-400">Tri actuel :</span>
        <span className="px-3 py-1 bg-gray-100 dark:bg-gray-800 rounded-full text-gray-700 dark:text-gray-300 flex items-center gap-1">
          {currentSortOption?.icon} {currentSortOption?.label}
        </span>
        {(sortBy !== defaultSortOption || searchTerm || selectedPriority !== 'all') && (
          <button
            onClick={resetToDefault}
            className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
          >
            Réinitialiser
          </button>
        )}
      </div>

      {/* Filtres rapides par priorité */}
      <div className="flex flex-wrap items-center gap-2">
        <button
          onClick={() => setSelectedPriority('all')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            selectedPriority === 'all'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
          }`}
        >
          Tous ({projects.length})
        </button>
        
        {priorityOrder.map(priority => (
          <button
            key={priority}
            onClick={() => setSelectedPriority(priority)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              selectedPriority === priority
                ? priority === 'critical' ? 'bg-red-600 text-white' :
                  priority === 'high' ? 'bg-orange-600 text-white' :
                  priority === 'medium' ? 'bg-yellow-600 text-white' :
                  priority === 'low' ? 'bg-green-600 text-white' :
                  'bg-gray-600 text-white'
                : priorityColors[priority].split(' ')[0] + ' ' + priorityColors[priority].split(' ')[1]
            }`}
          >
            {priorityIcons[priority]} {priorityLabels[priority]} ({priorityStats[priority] || 0})
          </button>
        ))}
      </div>

      {/* Compteur de résultats */}
      <p className="text-sm text-gray-600 dark:text-gray-400">
        {sortedProjects.length} projet{sortedProjects.length !== 1 ? 's' : ''} trouvé{sortedProjects.length !== 1 ? 's' : ''}
        {sortedProjects.length !== projects.length && (
          <span> (sur {projects.length} total)</span>
        )}
      </p>

      {/* Liste des projets */}
      {sortedProjects.length === 0 ? (
        <div className="text-center py-12">
          <Flag className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            Aucun projet trouvé
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            {searchTerm || selectedPriority !== 'all' 
              ? 'Essayez d\'autres filtres' 
              : 'Commencez par créer un projet'}
          </p>
        </div>
      ) : (
        <>
          <div className={`grid gap-6 ${
            viewMode === 'detailed' 
              ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3' 
              : 'grid-cols-1 md:grid-cols-3 lg:grid-cols-4'
          }`}>
            {paginatedProjects.map((project) => {
              const mainLink = project.deploy_link || project.dev_link;
              const isExpanded = expandedProjects.has(project.id);
              const priority = project.priority as Priority;

              return viewMode === 'detailed' ? (
                // Vue détaillée (carte complète)
                <div
                  key={project.id}
                  className={`bg-white dark:bg-gray-800 rounded-xl p-6 border-2 transition-all
                    ${updating === project.id ? 'opacity-50' : ''}
                    ${priority === 'critical' ? 'border-red-200 dark:border-red-900/30' :
                      priority === 'high' ? 'border-orange-200 dark:border-orange-900/30' :
                      priority === 'medium' ? 'border-yellow-200 dark:border-yellow-900/30' :
                      priority === 'low' ? 'border-green-200 dark:border-green-900/30' :
                      'border-gray-200 dark:border-gray-700'}
                    hover:shadow-lg transition-shadow`}
                >
                  {/* En-tête avec nom et icônes */}
                  <div className="flex items-start justify-between mb-3">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white truncate flex-1 pr-2">
                      {project.name}
                    </h3>
                    <div className="flex gap-1">
                      {mainLink && (
                        <button
                          onClick={(e) => handleLinkClick(e, mainLink)}
                          className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                          title="Voir l'application"
                        >
                          <ExternalLink className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                        </button>
                      )}
                      <button
                        onClick={() => onNavigate('project', project.id)}
                        className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                        title="Voir les détails"
                      >
                        <Eye className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                      </button>
                      <button
                        onClick={() => toggleProject(project.id)}
                        className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                      >
                        {isExpanded ? (
                          <ChevronUp className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                        ) : (
                          <ChevronDown className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Sélecteur de priorité */}
                  <div className="mb-4">
                    <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">
                      Priorité
                    </label>
                    <select
                      value={project.priority}
                      onChange={(e) => updateProjectPriority(project.id, e.target.value as Priority)}
                      disabled={updating === project.id}
                      className={`w-full px-3 py-1.5 text-sm rounded-lg border
                        ${priority === 'critical' ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 text-red-700 dark:text-red-300' :
                          priority === 'high' ? 'bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800 text-orange-700 dark:text-orange-300' :
                          priority === 'medium' ? 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800 text-yellow-700 dark:text-yellow-300' :
                          priority === 'low' ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800 text-green-700 dark:text-green-300' :
                          'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300'}
                        focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                    >
                      <option value="critical" className="text-red-700 dark:text-red-300 bg-white dark:bg-gray-800">🔴 Critique</option>
                      <option value="high" className="text-orange-700 dark:text-orange-300 bg-white dark:bg-gray-800">🟠 Haute</option>
                      <option value="medium" className="text-yellow-700 dark:text-yellow-300 bg-white dark:bg-gray-800">🟡 Moyenne</option>
                      <option value="low" className="text-green-700 dark:text-green-300 bg-white dark:bg-gray-800">🟢 Basse</option>
                      <option value="on-hold" className="text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800">⚪ En attente</option>
                    </select>
                  </div>

                  {/* Description */}
                  <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2 mb-4 min-h-[40px]">
                    {project.description || 'Pas de description'}
                  </p>

                  {/* Informations compactes */}
                  <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500 dark:text-gray-400 mb-3">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {formatTime(project.total_time_minutes || 0)}
                    </span>
                    <span className="flex items-center gap-1">
                      <Zap className="w-3 h-3" />
                      {project.total_tokens || 0}
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {formatDate(project.last_activity || project.created_at)}
                    </span>
                  </div>

                  {/* Détails étendus */}
                  {isExpanded && (
                    <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-700 text-sm space-y-2">
                      <p className="text-xs text-gray-500 dark:text-gray-500">
                        {project.session_count} session{project.session_count !== 1 ? 's' : ''} · 
                        Créé le {formatDate(project.created_at)}
                      </p>
                      {project.updated_at !== project.created_at && (
                        <p className="text-xs text-gray-500 dark:text-gray-500">
                          Modifié le {formatDate(project.updated_at)}
                        </p>
                      )}
                    </div>
                  )}

                  {/* Indicateur de priorité (petit badge) */}
                  <div className={`mt-3 text-xs px-2 py-1 rounded inline-flex items-center gap-1
                    ${priority === 'critical' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300' :
                      priority === 'high' ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300' :
                      priority === 'medium' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300' :
                      priority === 'low' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300' :
                      'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
                    }`}>
                    {priorityIcons[priority]} {priorityLabels[priority]}
                  </div>
                </div>
              ) : (
                // Vue compacte (carte simplifiée)
                <div
                  key={project.id}
                  className={`bg-white dark:bg-gray-800 rounded-lg p-4 border-l-4 transition-all cursor-pointer
                    ${priority === 'critical' ? 'border-red-500 hover:bg-red-50 dark:hover:bg-red-900/10' :
                      priority === 'high' ? 'border-orange-500 hover:bg-orange-50 dark:hover:bg-orange-900/10' :
                      priority === 'medium' ? 'border-yellow-500 hover:bg-yellow-50 dark:hover:bg-yellow-900/10' :
                      priority === 'low' ? 'border-green-500 hover:bg-green-50 dark:hover:bg-green-900/10' :
                      'border-gray-500 hover:bg-gray-50 dark:hover:bg-gray-700/50'}
                    hover:shadow-md transition-all`}
                  onClick={() => onNavigate('project', project.id)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-gray-900 dark:text-white truncate">
                        {project.name}
                      </h3>
                      <div className="flex items-center gap-2 mt-1 text-xs text-gray-500 dark:text-gray-400">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {formatTime(project.total_time_minutes || 0)}
                        </span>
                        <span className="flex items-center gap-1">
                          <Zap className="w-3 h-3" />
                          {project.total_tokens || 0}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 ml-4">
                      {mainLink && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleLinkClick(e, mainLink);
                          }}
                          className="p-1.5 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full"
                        >
                          <ExternalLink className="w-4 h-4 text-gray-500" />
                        </button>
                      )}
                      <span className="text-lg">{priorityIcons[priority]}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-8">
              <button
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="p-2 rounded-lg border border-gray-300 dark:border-gray-600
                         hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50
                         disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              
              <span className="px-4 py-2 text-gray-700 dark:text-gray-300">
                Page {currentPage} sur {totalPages}
              </span>
              
              <button
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="p-2 rounded-lg border border-gray-300 dark:border-gray-600
                         hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50
                         disabled:cursor-not-allowed transition-colors"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}