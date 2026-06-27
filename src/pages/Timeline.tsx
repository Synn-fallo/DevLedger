import { useEffect, useState, useMemo, useCallback } from 'react';
import { 
  Clock, Calendar, Filter, ChevronLeft, ChevronRight, Search, X, 
  ChevronDown, ChevronUp, ArrowUpDown, ArrowUp, ArrowDown,
  CalendarDays, Activity
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

interface TimelineEvent {
  id: string;
  date: string;
  projectName: string;
  projectId: string;
  type: 'session' | 'project';
  details: string;
  duration?: number;
  tokens?: number;
  deploymentStatus?: string;
  observations?: string;
  timeDeepseek?: number;
}

interface ProjectWithSessions {
  projectId: string;
  projectName: string;
  projectDate: string;
  sessions: TimelineEvent[];
}

interface ProjectsProps {
  onNavigate: (page: string, projectId?: string) => void;
}

// Configuration
const ITEMS_PER_PAGE = 10;

// Type de tri principal
type SortOrder = 'desc' | 'asc';
// Mode de tri
type SortMode = 'creation' | 'activity';

export function Timeline({ onNavigate }: ProjectsProps) {
  const { user } = useAuth();
  const [events, setEvents] = useState<TimelineEvent[]>([]);
  const [projects, setProjects] = useState<ProjectWithSessions[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [expandedProjects, setExpandedProjects] = useState<Set<string>>(new Set());
  
  // États pour le tri
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [sortMode, setSortMode] = useState<SortMode>('creation'); // 'creation' par défaut
  
  // États des filtres
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProject, setSelectedProject] = useState<string>('all');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [dateRange, setDateRange] = useState<{ start: string; end: string }>({
    start: '',
    end: ''
  });
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    loadTimeline();
  }, [user]);

  const loadTimeline = async () => {
    if (!user) return;

    setLoading(true);
    
    // Charger tous les projets avec leurs dates de création
    const { data: projectsData } = await supabase
      .from('projects')
      .select('id, name, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (!projectsData) return;

    // Charger toutes les sessions
    const { data: sessionsData } = await supabase
      .from('sessions')
      .select(`
        id, 
        date, 
        project_id, 
        time_bolt, 
        time_chatgpt, 
        time_deepseek,
        time_other, 
        tokens_consumed, 
        deployment_status,
        observations
      `)
      .in('project_id', projectsData.map(p => p.id))
      .order('date', { ascending: false });

    // Organiser les données par projet
    const projectsWithSessions: ProjectWithSessions[] = projectsData.map(project => {
      const projectSessions = (sessionsData || [])
        .filter(s => s.project_id === project.id)
        .map(session => {
          const totalTime = session.time_bolt + session.time_chatgpt + 
                           session.time_deepseek + session.time_other;
          
          let details = `Session de travail`;
          if (totalTime > 0) details += ` · ${Math.round(totalTime)}min`;
          if (session.tokens_consumed > 0) details += ` · ${session.tokens_consumed} tokens`;
          if (session.deployment_status === 'ok') details += ` · ✅ Déploiement OK`;
          else if (session.deployment_status === 'nok') details += ` · ❌ Déploiement échoué`;
          
          return {
            id: `session-${session.id}`,
            date: session.date,
            projectName: project.name,
            projectId: project.id,
            type: 'session' as const,
            details,
            duration: totalTime,
            tokens: session.tokens_consumed,
            timeDeepseek: session.time_deepseek,
            deploymentStatus: session.deployment_status,
            observations: session.observations
          };
        });

      return {
        projectId: project.id,
        projectName: project.name,
        projectDate: project.created_at,
        sessions: projectSessions
      };
    });

    setProjects(projectsWithSessions);
    
    // Construire la liste plate des événements pour les filtres
    const allEvents: TimelineEvent[] = [];
    
    projectsData.forEach(project => {
      allEvents.push({
        id: `project-${project.id}`,
        date: project.created_at,
        projectName: project.name,
        projectId: project.id,
        type: 'project',
        details: 'Projet créé'
      });
    });

    (sessionsData || []).forEach(session => {
      const project = projectsData.find(p => p.id === session.project_id);
      const totalTime = session.time_bolt + session.time_chatgpt + 
                       session.time_deepseek + session.time_other;
      
      let details = `Session de travail`;
      if (totalTime > 0) details += ` · ${Math.round(totalTime)}min`;
      if (session.tokens_consumed > 0) details += ` · ${session.tokens_consumed} tokens`;
      if (session.deployment_status === 'ok') details += ` · ✅ Déploiement OK`;
      else if (session.deployment_status === 'nok') details += ` · ❌ Déploiement échoué`;
      
      allEvents.push({
        id: `session-${session.id}`,
        date: session.date,
        projectName: project?.name || 'Projet inconnu',
        projectId: session.project_id,
        type: 'session',
        details,
        duration: totalTime,
        tokens: session.tokens_consumed,
        timeDeepseek: session.time_deepseek,
        deploymentStatus: session.deployment_status,
        observations: session.observations
      });
    });

    // Tri initial sans appliquer le filtre
    allEvents.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    setEvents(allEvents);
    setLoading(false);
  };

  // Application des filtres
  const filteredEvents = useMemo(() => {
    return events.filter(event => {
      // Filtre par recherche
      if (searchTerm && !event.projectName.toLowerCase().includes(searchTerm.toLowerCase())) {
        return false;
      }

      // Filtre par projet
      if (selectedProject !== 'all' && event.projectId !== selectedProject) {
        return false;
      }

      // Filtre par type
      if (selectedType !== 'all' && event.type !== selectedType) {
        return false;
      }

      // Filtre par date de début
      if (dateRange.start && new Date(event.date) < new Date(dateRange.start)) {
        return false;
      }

      // Filtre par date de fin
      if (dateRange.end) {
        const endDate = new Date(dateRange.end);
        endDate.setHours(23, 59, 59);
        if (new Date(event.date) > endDate) {
          return false;
        }
      }

      return true;
    });
  }, [events, searchTerm, selectedProject, selectedType, dateRange]);

  // Filtrer les projets en fonction des événements filtrés
  const filteredProjects = useMemo(() => {
    const filteredProjectIds = new Set(filteredEvents.map(e => e.projectId));
    
    return projects
      .filter(p => filteredProjectIds.has(p.projectId))
      .map(project => ({
        ...project,
        sessions: project.sessions.filter(session => 
          filteredEvents.some(e => e.id === session.id)
        )
      }))
      .filter(project => project.sessions.length > 0 || filteredEvents.some(e => 
        e.projectId === project.projectId && e.type === 'project'
      ));
  }, [projects, filteredEvents]);

  // Application du tri sur les projets filtrés selon le mode choisi
  const sortedFilteredProjects = useMemo(() => {
    const sorted = [...filteredProjects];
    
    // Fonction de comparaison selon le mode de tri
    const compareProjects = (a: ProjectWithSessions, b: ProjectWithSessions) => {
      let dateA: Date;
      let dateB: Date;

      if (sortMode === 'creation') {
        // Tri par date de création uniquement
        dateA = new Date(a.projectDate);
        dateB = new Date(b.projectDate);
      } else {
        // Tri par dernière activité (création ou session la plus récente)
        const getLatestDate = (project: ProjectWithSessions) => {
          const projectDate = new Date(project.projectDate);
          const latestSessionDate = project.sessions.length > 0 
            ? new Date(Math.max(...project.sessions.map(s => new Date(s.date).getTime())))
            : null;
          
          return latestSessionDate && latestSessionDate > projectDate 
            ? latestSessionDate 
            : projectDate;
        };
        
        dateA = getLatestDate(a);
        dateB = getLatestDate(b);
      }

      if (sortOrder === 'desc') {
        return dateB.getTime() - dateA.getTime(); // Plus récent d'abord
      } else {
        return dateA.getTime() - dateB.getTime(); // Plus ancien d'abord
      }
    };

    sorted.sort(compareProjects);
    return sorted;
  }, [filteredProjects, sortOrder, sortMode]);

  // Pagination avec les projets triés
  const paginatedProjects = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return sortedFilteredProjects.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [sortedFilteredProjects, currentPage]);

  const totalPages = Math.ceil(sortedFilteredProjects.length / ITEMS_PER_PAGE);

  // Reset page quand les filtres ou le tri changent
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedProject, selectedType, dateRange, sortOrder, sortMode]);

  const resetFilters = useCallback(() => {
    setSearchTerm('');
    setSelectedProject('all');
    setSelectedType('all');
    setDateRange({ start: '', end: '' });
    setSortOrder('desc');
    setSortMode('creation'); // Reset du mode de tri
    setCurrentPage(1);
  }, []);

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

  const toggleSortOrder = () => {
    setSortOrder(prev => prev === 'desc' ? 'asc' : 'desc');
  };

  const toggleSortMode = () => {
    setSortMode(prev => prev === 'creation' ? 'activity' : 'creation');
  };

  const handleEventClick = (event: TimelineEvent) => {
    if (event.type === 'project') {
      onNavigate('project', event.projectId);
    } else {
      onNavigate('project', event.projectId);
    }
  };

  const hasActiveFilters = searchTerm || selectedProject !== 'all' || 
                          selectedType !== 'all' || dateRange.start || dateRange.end;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Chargement de la timeline...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* En-tête */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Timeline</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            {sortedFilteredProjects.length} projet{sortedFilteredProjects.length !== 1 ? 's' : ''} trouvé{sortedFilteredProjects.length !== 1 ? 's' : ''}
            {sortedFilteredProjects.length !== projects.length && (
              <span> (sur {projects.length} total)</span>
            )}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Sélecteur de mode de tri */}
          <button
            onClick={toggleSortMode}
            className="flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 
                     text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            title={sortMode === 'creation' ? 'Trier par dernière activité' : 'Trier par date de création'}
          >
            {sortMode === 'creation' ? (
              <>
                <CalendarDays className="w-5 h-5" />
                <span className="hidden sm:inline">Date de création</span>
              </>
            ) : (
              <>
                <Activity className="w-5 h-5" />
                <span className="hidden sm:inline">Dernière activité</span>
              </>
            )}
          </button>

          {/* Bouton d'ordre de tri (asc/desc) */}
          <button
            onClick={toggleSortOrder}
            className="flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 
                     text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            title={sortOrder === 'desc' ? 'Trier du plus ancien au plus récent' : 'Trier du plus récent au plus ancien'}
          >
            <ArrowUpDown className="w-5 h-5" />
            <span className="hidden sm:inline">
              {sortOrder === 'desc' ? 'Plus récent' : 'Plus ancien'}
            </span>
            {sortOrder === 'desc' ? (
              <ArrowDown className="w-4 h-4 ml-1" />
            ) : (
              <ArrowUp className="w-4 h-4 ml-1" />
            )}
          </button>

          {/* Bouton filtres */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-colors
              ${showFilters 
                ? 'bg-blue-600 border-blue-600 text-white hover:bg-blue-700' 
                : 'border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
              }`}
          >
            <Filter className="w-5 h-5" />
            Filtres
            {hasActiveFilters && (
              <span className="ml-1 px-2 py-0.5 bg-blue-500 text-white text-xs rounded-full">
                {Object.entries({searchTerm, selectedProject, selectedType, dateRange}).filter(([_, v]) => 
                  v && (typeof v === 'string' ? v !== 'all' && v !== '' : v.start || v.end)
                ).length}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Panneau de filtres */}
      {showFilters && (
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="font-semibold text-gray-900 dark:text-white">Filtres avancés</h3>
            {hasActiveFilters && (
              <button
                onClick={resetFilters}
                className="flex items-center gap-1 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
              >
                <X className="w-4 h-4" />
                Réinitialiser
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Recherche - Loupe à droite */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Recherche
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Nom du projet..."
                  className="w-full px-4 py-2 pr-9 border border-gray-300 dark:border-gray-600 rounded-lg
                           bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm
                           focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-gray-500" />
              </div>
            </div>

            {/* Filtre par projet */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Projet
              </label>
              <select
                value={selectedProject}
                onChange={(e) => setSelectedProject(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg
                         bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm
                         focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all" className="bg-white dark:bg-gray-700">Tous les projets</option>
                {projects.map(project => (
                  <option key={project.projectId} value={project.projectId} className="bg-white dark:bg-gray-700">
                    {project.projectName}
                  </option>
                ))}
              </select>
            </div>

            {/* Filtre par type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Type d'événement
              </label>
              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg
                         bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm
                         focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all" className="bg-white dark:bg-gray-700">Tous les types</option>
                <option value="project" className="bg-white dark:bg-gray-700">Créations de projet</option>
                <option value="session" className="bg-white dark:bg-gray-700">Sessions de travail</option>
              </select>
            </div>

            {/* Période */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Période
              </label>
              <div className="flex gap-2">
                <input
                  type="date"
                  value={dateRange.start}
                  onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                  className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg
                           bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm
                           focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <span className="text-gray-500 dark:text-gray-400">-</span>
                <input
                  type="date"
                  value={dateRange.end}
                  onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
                  className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg
                           bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm
                           focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Timeline */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
        {sortedFilteredProjects.length === 0 ? (
          <div className="text-center py-12">
            <Calendar className="w-16 h-16 text-gray-400 dark:text-gray-600 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              Aucun événement trouvé
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              {hasActiveFilters 
                ? 'Essayez de modifier vos filtres' 
                : 'Commencez par créer un projet ou enregistrer des sessions'}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {paginatedProjects.map(project => (
              <div key={project.projectId} className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
                {/* En-tête du projet - Cliquable pour navigation */}
                <div 
                  onClick={() => onNavigate('project', project.projectId)}
                  className="flex items-center gap-3 p-4 bg-gray-50 dark:bg-gray-700/50 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                >
                  <Calendar className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900 dark:text-white">
                      {project.projectName}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Créé le {new Date(project.projectDate).toLocaleDateString('fr-FR', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric'
                      })}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      {project.sessions.length} session{project.sessions.length !== 1 ? 's' : ''}
                    </span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleProject(project.projectId);
                      }}
                      className="p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-full transition-colors"
                    >
                      {expandedProjects.has(project.projectId) ? (
                        <ChevronUp className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                      ) : (
                        <ChevronDown className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Sessions en accordéon - triées selon le même mode que les projets */}
                {expandedProjects.has(project.projectId) && project.sessions.length > 0 && (
                  <div className="divide-y divide-gray-200 dark:divide-gray-700">
                    {[...project.sessions]
                      .sort((a, b) => {
                        if (sortOrder === 'desc') {
                          return new Date(b.date).getTime() - new Date(a.date).getTime(); // Plus récent d'abord
                        } else {
                          return new Date(a.date).getTime() - new Date(b.date).getTime(); // Plus ancien d'abord
                        }
                      })
                      .map(session => (
                        <div
                          key={session.id}
                          onClick={() => handleEventClick(session)}
                          className="flex gap-4 p-4 ml-12 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                        >
                          <div className="p-2 rounded-full bg-green-100 dark:bg-green-900/30">
                            <Clock className="w-4 h-4 text-green-600 dark:text-green-400" />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-1">
                              <span className="text-sm text-gray-500 dark:text-gray-400">
                                {new Date(session.date).toLocaleDateString('fr-FR', {
                                  day: 'numeric',
                                  month: 'long',
                                  year: 'numeric'
                                })}
                              </span>
                              {session.deploymentStatus && (
                                <span className={`text-xs px-2 py-0.5 rounded-full ${
                                  session.deploymentStatus === 'ok'
                                    ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300'
                                    : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300'
                                }`}>
                                  {session.deploymentStatus === 'ok' ? 'Succès' : 'Échec'}
                                </span>
                              )}
                            </div>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              {session.details}
                              {session.timeDeepseek && session.timeDeepseek > 0 && ` · DeepSeek: ${session.timeDeepseek}min`}
                            </p>
                            {session.observations && (
                              <p className="text-xs text-gray-500 dark:text-gray-500 mt-1 italic">
                                {session.observations}
                              </p>
                            )}
                          </div>
                        </div>
                      ))}
                  </div>
                )}

                {/* Message si aucune session */}
                {expandedProjects.has(project.projectId) && project.sessions.length === 0 && (
                  <div className="p-4 ml-12 text-center text-gray-500 dark:text-gray-400 italic">
                    Aucune session pour ce projet
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
            <button
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="p-2 rounded-lg border border-gray-300 dark:border-gray-600
                       hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50
                       disabled:cursor-not-allowed transition-colors text-gray-700 dark:text-gray-300"
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
                       disabled:cursor-not-allowed transition-colors text-gray-700 dark:text-gray-300"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}