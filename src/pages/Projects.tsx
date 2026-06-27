import { useEffect, useState, useMemo, useCallback } from 'react';
import { 
  Plus, Search, FolderKanban, ChevronLeft, ChevronRight, 
  ExternalLink, Github, Calendar, Eye, ChevronDown, ChevronUp,
  Link as LinkIcon, Mail, Database, CheckCircle, User, Users
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { VisibilityBadge } from '../components/VisibilityBadge';
import { useSubscription } from '../contexts/SubscriptionContext';
import { useProjectLimit } from '../hooks/useProjectLimit';
import { logService } from '../services/log.service';
import type { Project } from '../lib/database.types';

interface ProjectsProps {
  onNavigate: (page: string, projectId?: string) => void;
}

const statusColors: Record<string, string> = {
  idea: 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300',
  development: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
  paused: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300',
  deployed: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300',
  archived: 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300',
  abandoned: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300'
};

const statusLabels: Record<string, string> = {
  idea: 'Idée',
  development: 'En développement',
  paused: 'En pause',
  deployed: 'Déployé',
  archived: 'Archivé',
  abandoned: 'Abandonné'
};

const ITEMS_PER_PAGE = 12;

export function Projects({ onNavigate }: ProjectsProps) {
  const { user } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [visibilityFilter, setVisibilityFilter] = useState<string>('all');
  const [showCompleted, setShowCompleted] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [creating, setCreating] = useState(false);
  const { canCreate, remaining, limit, isUnlimited } = useProjectLimit();

  const [newProject, setNewProject] = useState({
    name: '',
    description: '',
    deploy_link: '',
    dev_link: '',
    github_link: '',
    dev_account: '',
    old_access_link: '',
    db_connected: false
  });

  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    deployed: 0,
    public: 0,
    shared: 0,
    private: 0,
    owned: 0,
    fromOthers: 0
  });

  useEffect(() => {
    loadProjects();
  }, [user]);

  const loadProjects = async () => {
    if (!user) {
      console.log('❌ loadProjects: user non défini');
      setLoading(false);
      return;
    }

    console.log('=== loadProjects DEBUG ===');
    console.log('1. user.id:', user.id);
    console.log('2. user.email:', user.email);

    // Essayer d'abord avec la requête directe (sans RPC)
    const { data: directData, error: directError } = await supabase
      .from('projects')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    console.log('3. directData (mes projets):', directData?.length || 0);
    console.log('4. directError:', directError);

    if (directData && directData.length > 0) {
      console.log('✅ Projets trouvés directement:', directData.map(p => ({ id: p.id, name: p.name, visibility: p.visibility })));
      setProjects(directData);
      
      // Calculer les stats
      const ownedProjects = directData.filter(p => p.user_id === user.id);
      const publicFromOthers = directData.filter(p => p.visibility === 'public' && p.user_id !== user.id);
      const sharedFromOthers = directData.filter(p => p.visibility === 'shared' && p.user_id !== user.id);

      setStats({
        total: directData.length,
        active: directData.filter(p => p.status === 'development').length,
        deployed: directData.filter(p => p.status === 'deployed').length,
        public: directData.filter(p => p.visibility === 'public').length,
        shared: directData.filter(p => p.visibility === 'shared').length,
        private: directData.filter(p => p.visibility === 'private' && p.user_id === user.id).length,
        owned: ownedProjects.length,
        fromOthers: publicFromOthers.length + sharedFromOthers.length
      });

      setLoading(false);
      return;
    }

    // Si pas de projets directs, essayer la RPC
    console.log('⚠️ Aucun projet direct, tentative RPC...');
    const { data: rpcData, error: rpcError } = await supabase
      .rpc('get_accessible_projects', { user_email: user.email });

    console.log('5. rpcData:', rpcData?.length || 0);
    console.log('6. rpcError:', rpcError);

    if (rpcError) {
      console.error('Error loading projects via RPC:', rpcError);
      setLoading(false);
      return;
    }

    if (!rpcData) {
      setProjects([]);
      setLoading(false);
      return;
    }

    setProjects(rpcData);

    // Calculer les stats
    const ownedProjects = rpcData.filter(p => p.user_id === user.id);
    const publicFromOthers = rpcData.filter(p => p.visibility === 'public' && p.user_id !== user.id);
    const sharedFromOthers = rpcData.filter(p => 
      p.visibility === 'shared' && 
      p.user_id !== user.id
    );

    setStats({
      total: rpcData.length,
      active: rpcData.filter(p => p.status === 'development').length,
      deployed: rpcData.filter(p => p.status === 'deployed').length,
      public: rpcData.filter(p => p.visibility === 'public').length,
      shared: rpcData.filter(p => p.visibility === 'shared').length,
      private: rpcData.filter(p => p.visibility === 'private' && p.user_id === user.id).length,
      owned: ownedProjects.length,
      fromOthers: publicFromOthers.length + sharedFromOthers.length
    });

    setLoading(false);
  };

  const filteredProjects = useMemo(() => {
    let filtered = projects;

    if (searchTerm) {
      filtered = filtered.filter(project =>
        project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (project.description && project.description.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(project => project.status === statusFilter);
    }

    if (visibilityFilter !== 'all') {
      filtered = filtered.filter(project => (project.visibility || 'private') === visibilityFilter);
    }

    if (showCompleted) {
      filtered = filtered.filter(project => project.status === 'deployed');
    }

    return filtered;
  }, [projects, searchTerm, statusFilter, visibilityFilter, showCompleted]);

  const paginatedProjects = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredProjects.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [filteredProjects, currentPage]);

  const totalPages = Math.ceil(filteredProjects.length / ITEMS_PER_PAGE);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter, visibilityFilter, showCompleted]);

  const resetForm = () => {
    setNewProject({
      name: '',
      description: '',
      deploy_link: '',
      dev_link: '',
      github_link: '',
      dev_account: '',
      old_access_link: '',
      db_connected: false
    });
    setShowAdvanced(false);
  };

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !newProject.name.trim()) return;

    setCreating(true);

    const { data, error } = await supabase
      .from('projects')
      .insert({
        user_id: user.id,
        name: newProject.name.trim(),
        description: newProject.description.trim(),
        deploy_link: newProject.deploy_link || null,
        dev_link: newProject.dev_link || null,
        github_link: newProject.github_link || null,
        dev_account: newProject.dev_account || null,
        old_access_link: newProject.old_access_link || null,
        db_connected: newProject.db_connected,
        status: 'idea',
        visibility: 'private'
      })
      .select();

    if (!error && data && data.length > 0) {
      // Ajouter un log pour la création du projet
      await logService.add('project_create', 'project', data[0].id, { name: newProject.name });
      resetForm();
      setShowCreateModal(false);
      loadProjects();
    }

    setCreating(false);
  };

  const handlePageChange = useCallback((page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const handleLinkClick = (e: React.MouseEvent, url: string) => {
    e.stopPropagation();
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const handleDetailsClick = (e: React.MouseEvent, projectId: string) => {
    e.stopPropagation();
    onNavigate('project', projectId);
  };

  const toggleCompletedFilter = () => {
    setShowCompleted(!showCompleted);
    if (!showCompleted) {
      setStatusFilter('all');
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  const isOwnProject = (project: Project) => {
    return project.user_id === user?.id;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Chargement des projets...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Projets</h1>
          <div className="flex flex-wrap gap-4 mt-2 text-sm">
            <span className="text-gray-600 dark:text-gray-400">
              Total: <strong className="text-gray-900 dark:text-white">{stats.total}</strong>
            </span>
            <span className="text-blue-600 dark:text-blue-400">
              Actifs: <strong>{stats.active}</strong>
            </span>
            <span className="text-green-600 dark:text-green-400">
              Déployés: <strong>{stats.deployed}</strong>
            </span>
            <span className="text-emerald-600 dark:text-emerald-400">
              🌍 Publics: <strong>{stats.public}</strong>
            </span>
            <span className="text-purple-600 dark:text-purple-400">
              👥 Partagés: <strong>{stats.shared}</strong>
            </span>
            <span className="text-gray-500 dark:text-gray-500">
              🔒 Privés: <strong>{stats.private}</strong>
            </span>
            <span className="text-purple-600 dark:text-purple-400">
              👤 Mes projets: <strong>{stats.owned}</strong>
            </span>
            {stats.fromOthers > 0 && (
              <span className="text-orange-600 dark:text-orange-400">
                🤝 Autres: <strong>{stats.fromOthers}</strong>
              </span>
            )}
          </div>
        </div>

        <div className="flex flex-col items-end gap-1">
          <button
            onClick={() => {
              if (!canCreate) {
                alert(`Limite atteinte (${limit} projets maximum). Passez à Pro pour créer plus de projets.`);
                return;
              }
              resetForm();
              setShowCreateModal(true);
            }}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
          >
            <Plus className="w-5 h-5" />
            Créer un projet
          </button>
          {!isUnlimited && (
            <span className="text-xs text-gray-500">
              {remaining} / {limit} projets restants
            </span>
          )}
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 dark:text-gray-500" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Rechercher un projet..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg
                     bg-white dark:bg-gray-800 text-gray-900 dark:text-white
                     focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        
        <div className="flex flex-wrap gap-2">
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              if (e.target.value !== 'all') {
                setShowCompleted(false);
              }
            }}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg
                     bg-white dark:bg-gray-800 text-gray-900 dark:text-white
                     focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">Tous les statuts</option>
            {Object.entries(statusLabels).map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>

          <select
            value={visibilityFilter}
            onChange={(e) => setVisibilityFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg
                     bg-white dark:bg-gray-800 text-gray-900 dark:text-white
                     focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">Toutes visibilités</option>
            <option value="public">🌍 Public</option>
            <option value="shared">👥 Partagé</option>
            <option value="private">🔒 Privé</option>
          </select>

          <button
            onClick={toggleCompletedFilter}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap
              ${showCompleted 
                ? 'bg-green-600 text-white' 
                : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
              }`}
          >
            <CheckCircle className="w-4 h-4" />
            <span>Achevés ({stats.deployed})</span>
          </button>
        </div>
      </div>

      <p className="text-sm text-gray-600 dark:text-gray-400">
        {filteredProjects.length} projet{filteredProjects.length !== 1 ? 's' : ''} trouvé{filteredProjects.length !== 1 ? 's' : ''}
        {filteredProjects.length !== stats.total && (
          <span> (sur {stats.total} total)</span>
        )}
        {showCompleted && <span className="ml-2 text-green-600">✓ Filtré: Achevés uniquement</span>}
        {visibilityFilter !== 'all' && (
          <span className="ml-2 text-blue-600">✓ Visibilité: {visibilityFilter === 'public' ? '🌍 Public' : visibilityFilter === 'shared' ? '👥 Partagé' : '🔒 Privé'}</span>
        )}
      </p>

      {filteredProjects.length === 0 ? (
        <div className="text-center py-12">
          <FolderKanban className="w-16 h-16 text-gray-400 dark:text-gray-600 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            {searchTerm || statusFilter !== 'all' || visibilityFilter !== 'all' || showCompleted ? 'Aucun projet trouvé' : 'Aucun projet'}
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            {searchTerm || statusFilter !== 'all' || visibilityFilter !== 'all' || showCompleted
              ? 'Essayez d\'autres filtres' 
              : 'Créez votre premier projet pour commencer'}
          </p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {paginatedProjects.map((project) => {
              const hasDeployLink = !!(project.deploy_link || project.dev_link);
              const mainLink = project.deploy_link || project.dev_link;
              const hasGithubLink = !!project.github_link;
              const hasAnyLink = hasDeployLink || hasGithubLink;
              const isUpdated = project.created_at !== project.updated_at;
              const isOwner = isOwnProject(project);
              const visibility = project.visibility || 'private';

              return (
                <div
                  key={project.id}
                  className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 relative group flex flex-col h-full transition-colors hover:border-gray-300 dark:hover:border-gray-600"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white truncate">
                          {project.name}
                        </h3>
                        {project.reference && (
                          <span className="text-xs font-mono bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded">
                            {project.reference}
                          </span>
                        )}
                        {!isOwner && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400 flex-shrink-0">
                            <User className="w-3 h-3 mr-1" />
                            Invité
                          </span>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex-shrink-0 ml-2">
                      <VisibilityBadge visibility={visibility as 'private' | 'shared' | 'public'} />
                    </div>
                  </div>

                  <div className="mb-3">
                    <span className={`text-xs px-3 py-1 rounded-full ${statusColors[project.status]}`}>
                      {statusLabels[project.status]}
                    </span>
                  </div>

                  <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2 mb-4 flex-grow">
                    {project.description || 'Pas de description'}
                  </p>

                  <div className="space-y-1 mb-4 text-xs text-gray-500 dark:text-gray-400">
                    <div className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      <span>Créé le {formatDate(project.created_at)}</span>
                    </div>
                    {isUpdated && (
                      <div className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        <span>Modifié le {formatDate(project.updated_at)}</span>
                      </div>
                    )}
                  </div>

                  {hasAnyLink && (
                    <div className="flex gap-1 mb-3 opacity-0 group-hover:opacity-100 transition-opacity">
                      {hasGithubLink && (
                        <button
                          onClick={(e) => handleLinkClick(e, project.github_link!)}
                          className="p-1.5 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                          title="Voir le code source"
                        >
                          <Github className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  )}

                  <div className="flex gap-2 pt-3 border-t border-gray-200 dark:border-gray-700">
                    <button
                      onClick={(e) => handleDetailsClick(e, project.id)}
                      className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors text-sm font-medium"
                    >
                      <Eye className="w-4 h-4" />
                      Détails
                    </button>
                    
                    {hasDeployLink ? (
                      <button
                        onClick={(e) => handleLinkClick(e, mainLink!)}
                        className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-sm font-medium"
                        title="Ouvrir l'application"
                      >
                        <ExternalLink className="w-4 h-4" />
                        Voir l'app
                      </button>
                    ) : (
                      <button
                        disabled
                        className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400 rounded-lg cursor-not-allowed text-sm font-medium opacity-50"
                        title="Aucun lien disponible"
                      >
                        <ExternalLink className="w-4 h-4" />
                        Voir l'app
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-8">
              <button
                onClick={() => handlePageChange(currentPage - 1)}
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
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="p-2 rounded-lg border border-gray-300 dark:border-gray-600
                         hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50
                         disabled:cursor-not-allowed transition-colors text-gray-700 dark:text-gray-300"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          )}
        </>
      )}

      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 w-full max-w-2xl my-8">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              Nouveau Projet
            </h2>

            <form onSubmit={handleCreateProject} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Nom du projet *
                </label>
                <input
                  type="text"
                  value={newProject.name}
                  onChange={(e) => setNewProject({ ...newProject, name: e.target.value })}
                  required
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg
                           bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                           focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Mon projet"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Description
                </label>
                <textarea
                  value={newProject.description}
                  onChange={(e) => setNewProject({ ...newProject, description: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg
                           bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                           focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Description du projet..."
                />
              </div>

              <button
                type="button"
                onClick={() => setShowAdvanced(!showAdvanced)}
                className="flex items-center gap-2 text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors"
              >
                {showAdvanced ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                {showAdvanced ? 'Masquer les options avancées' : 'Afficher les options avancées'}
              </button>

              {showAdvanced && (
                <div className="space-y-4 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-200 dark:border-gray-700">
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                    <LinkIcon className="w-4 h-4" />
                    Liens et accès
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Lien de déploiement
                      </label>
                      <input
                        type="url"
                        value={newProject.deploy_link}
                        onChange={(e) => setNewProject({ ...newProject, deploy_link: e.target.value })}
                        placeholder="https://..."
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg
                                 bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                                 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Lien de développement
                      </label>
                      <input
                        type="url"
                        value={newProject.dev_link}
                        onChange={(e) => setNewProject({ ...newProject, dev_link: e.target.value })}
                        placeholder="https://..."
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg
                                 bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                                 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Lien GitHub
                      </label>
                      <input
                        type="url"
                        value={newProject.github_link}
                        onChange={(e) => setNewProject({ ...newProject, github_link: e.target.value })}
                        placeholder="https://github.com/..."
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg
                                 bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                                 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Compte de développement
                      </label>
                      <input
                        type="email"
                        value={newProject.dev_account}
                        onChange={(e) => setNewProject({ ...newProject, dev_account: e.target.value })}
                        placeholder="email@exemple.com"
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg
                                 bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                                 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Ancien lien d'accès
                      </label>
                      <input
                        type="url"
                        value={newProject.old_access_link}
                        onChange={(e) => setNewProject({ ...newProject, old_access_link: e.target.value })}
                        placeholder="https://..."
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg
                                 bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                                 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>

                    <div className="md:col-span-2">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={newProject.db_connected}
                          onChange={(e) => setNewProject({ ...newProject, db_connected: e.target.checked })}
                          className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                        />
                        <span className="text-sm text-gray-700 dark:text-gray-300">Base de données connectée</span>
                      </label>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    resetForm();
                    setShowCreateModal(false);
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={creating || !newProject.name.trim()}
                  className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {creating ? 'Création...' : 'Créer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}