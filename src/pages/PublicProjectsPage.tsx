import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, ChevronLeft, ChevronRight, Calendar, Heart, MessageCircle, Eye } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { metricsService } from '../services/metrics.service';
import { PublicProjectCard } from '../components/public/PublicProjectCard';

interface PublicProject {
  id: string;
  name: string;
  description: string;
  views: number;
  likes: number;
  comments: number;
  userHasLiked?: boolean;
  created_at: string;
}

type SortOption = 'recent' | 'views' | 'likes' | 'comments';
type FilterCategory = 'all' | 'development' | 'deployed' | 'idea';

const inspiringMessages = [
  "Des idées, des projets, une communauté. Commencez votre exploration.",
  "Chaque projet raconte une histoire. La vôtre commence ici.",
  "Des développeurs comme vous partagent leur travail. Et si vous rejoigniez l'aventure ?",
  "Explorez, inspirez-vous, créez à votre tour."
];

export function PublicProjectsPage() {
  const [projects, setProjects] = useState<PublicProject[]>([]);
  const [filteredProjects, setFilteredProjects] = useState<PublicProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('recent');
  const [categoryFilter, setCategoryFilter] = useState<FilterCategory>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [userId, setUserId] = useState<string | null>(null);
  const itemsPerPage = 12;

  const [randomMessage] = useState(() => 
    inspiringMessages[Math.floor(Math.random() * inspiringMessages.length)]
  );

  useEffect(() => {
    loadUser();
    loadProjects();
  }, []);

  useEffect(() => {
    filterAndSortProjects();
    setCurrentPage(1);
  }, [projects, searchTerm, sortBy, categoryFilter]);

  const loadUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    setUserId(user?.id || null);
  };

  const loadProjects = async () => {
    setLoading(true);
    
    const { data: projectsData } = await supabase
      .from('projects')
      .select('id, name, description, created_at, status')
      .eq('visibility', 'public')
      .order('created_at', { ascending: false });

    if (!projectsData || projectsData.length === 0) {
      setProjects([]);
      setLoading(false);
      return;
    }

    // OPTIMISATION PHASE 1 : Batch des métriques (remplace les N appels individuels)
    const projectIds = projectsData.map(p => p.id);
    const metricsMap = await metricsService.getProjectsMetricsBatch(projectIds, userId);

    const projectsWithMetrics = projectsData.map((project) => {
      const metrics = metricsMap.get(project.id) || { views: 0, likes: 0, comments: 0, userHasLiked: false };
      return {
        id: project.id,
        name: project.name,
        description: project.description || '',
        views: metrics.views,
        likes: metrics.likes,
        comments: metrics.comments,
        userHasLiked: metrics.userHasLiked,
        created_at: project.created_at,
        status: project.status
      };
    });

    setProjects(projectsWithMetrics);
    setLoading(false);
  };

  const filterAndSortProjects = () => {
    let filtered = [...projects];

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(p =>
        p.name.toLowerCase().includes(term) ||
        p.description.toLowerCase().includes(term)
      );
    }

    if (categoryFilter !== 'all') {
      filtered = filtered.filter(p => p.status === categoryFilter);
    }

    switch (sortBy) {
      case 'views':
        filtered.sort((a, b) => b.views - a.views);
        break;
      case 'likes':
        filtered.sort((a, b) => b.likes - a.likes);
        break;
      case 'comments':
        filtered.sort((a, b) => b.comments - a.comments);
        break;
      case 'recent':
      default:
        filtered.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        break;
    }

    setFilteredProjects(filtered);
  };

  const handleLike = async (projectId: string) => {
    if (!userId) {
      window.location.href = '/auth';
      return;
    }

    const project = projects.find(p => p.id === projectId);
    if (!project) return;

    if (project.userHasLiked) {
      await metricsService.removeLike(projectId);
      project.userHasLiked = false;
      project.likes--;
    } else {
      await metricsService.addLike(projectId);
      project.userHasLiked = true;
      project.likes++;
    }

    setProjects([...projects]);
  };

  const totalPages = Math.ceil(filteredProjects.length / itemsPerPage);
  const paginatedProjects = filteredProjects.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const categoryLabels = {
    all: 'Tous les projets',
    development: 'En développement',
    deployed: 'Déployés',
    idea: 'Idées'
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="flex-1">
      <div className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
        <div className="max-w-7xl mx-auto px-4 py-10">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white">Projets publics</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2 max-w-2xl">
            Découvrez les projets partagés par la communauté DevLedger. Explorez, likez et commentez les réalisations des développeurs.
          </p>
          <div className="mt-5 flex items-start gap-3">
            <div className="w-0.5 h-8 bg-blue-400/50 rounded-full mt-0.5"></div>
            <p className="text-gray-500 dark:text-gray-400 text-sm italic leading-relaxed max-w-2xl">
              ✨ {randomMessage}
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700 mb-8">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Rechercher un projet par nom ou description..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value as FilterCategory)}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">📁 {categoryLabels.all}</option>
              <option value="development">🔄 {categoryLabels.development}</option>
              <option value="deployed">✅ {categoryLabels.deployed}</option>
              <option value="idea">💡 {categoryLabels.idea}</option>
            </select>
            
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortOption)}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
            >
              <option value="recent">📅 Les plus récents</option>
              <option value="views">👁️ Les plus vus</option>
              <option value="likes">❤️ Les plus likés</option>
              <option value="comments">💬 Les plus commentés</option>
            </select>
          </div>
        </div>

        <div className="mb-4">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {filteredProjects.length} projet{filteredProjects.length !== 1 ? 's' : ''} trouvé{filteredProjects.length !== 1 ? 's' : ''}
          </p>
        </div>

        {paginatedProjects.length === 0 ? (
          <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
            <p className="text-gray-500 dark:text-gray-400">Aucun projet public trouvé</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {paginatedProjects.map((project) => (
                <PublicProjectCard
                  key={project.id}
                  project={project}
                  onLike={handleLike}
                />
              ))}
            </div>

            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-8">
                <button
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="p-2 rounded-lg border border-gray-300 dark:border-gray-600 disabled:opacity-50 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <span className="px-4 py-2 text-gray-700 dark:text-gray-300">
                  Page {currentPage} sur {totalPages}
                </span>
                <button
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="p-2 rounded-lg border border-gray-300 dark:border-gray-600 disabled:opacity-50 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}