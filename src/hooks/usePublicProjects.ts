import { useState, useEffect, useCallback, useRef } from 'react';
import { metricsService, type PublicProjectWithMetrics, type PaginatedResult, type SortOption, type FilterCategory } from '../services/metrics.service';
import { supabase } from '../lib/supabase';

interface UsePublicProjectsOptions {
  pageSize?: number;
  initialSearchTerm?: string;
  initialCategoryFilter?: FilterCategory;
  initialSortBy?: SortOption;
  debounceDelay?: number;
}

export function usePublicProjects(options: UsePublicProjectsOptions = {}) {
  const {
    pageSize = 20,
    initialSearchTerm = '',
    initialCategoryFilter = 'all',
    initialSortBy = 'recent',
    debounceDelay = 300
  } = options;

  // États
  const [projects, setProjects] = useState<PublicProjectWithMetrics[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [searchTerm, setSearchTerm] = useState(initialSearchTerm);
  const [categoryFilter, setCategoryFilter] = useState<FilterCategory>(initialCategoryFilter);
  const [sortBy, setSortBy] = useState<SortOption>(initialSortBy);
  const [userId, setUserId] = useState<string | null>(null);

  // Ref pour le debounce
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isMountedRef = useRef(true);

  // Charger l'utilisateur connecté
  useEffect(() => {
    const loadUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (isMountedRef.current) {
        setUserId(user?.id || null);
      }
    };
    loadUser();

    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // Fonction de chargement des projets
  const loadProjects = useCallback(async (
    page: number,
    search: string,
    category: FilterCategory,
    sort: SortOption
  ) => {
    if (!isMountedRef.current) return;
    
    setLoading(true);
    setError(null);

    try {
      const result: PaginatedResult<PublicProjectWithMetrics> = await metricsService.getProjectsWithMetricsPaginated(
        page,
        pageSize,
        search,
        category,
        sort,
        userId
      );

      if (isMountedRef.current) {
        setProjects(result.data);
        setTotalCount(result.totalCount);
        setTotalPages(result.totalPages);
        setCurrentPage(result.page);
      }
    } catch (err) {
      console.error('Error loading public projects:', err);
      if (isMountedRef.current) {
        setError('Une erreur est survenue lors du chargement des projets');
      }
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
      }
    }
  }, [pageSize, userId]);

  // Rechargement quand la page, la recherche, le filtre ou le tri change
  useEffect(() => {
    // Debounce sur la recherche seulement
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    const executeLoad = () => {
      // Reset à la page 1 quand les filtres changent
      const targetPage = (searchTerm !== initialSearchTerm || 
                          categoryFilter !== initialCategoryFilter || 
                          sortBy !== initialSortBy) ? 1 : currentPage;
      
      if (targetPage !== currentPage && (searchTerm !== initialSearchTerm || 
                                          categoryFilter !== initialCategoryFilter || 
                                          sortBy !== initialSortBy)) {
        setCurrentPage(1);
      }
      
      loadProjects(targetPage, searchTerm, categoryFilter, sortBy);
    };

    debounceTimerRef.current = setTimeout(executeLoad, debounceDelay);

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [searchTerm, categoryFilter, sortBy, currentPage, loadProjects, initialSearchTerm, initialCategoryFilter, initialSortBy]);

  // Changement de page
  const goToPage = useCallback((page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  }, [totalPages]);

  // Page suivante
  const nextPage = useCallback(() => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  }, [currentPage, totalPages]);

  // Page précédente
  const prevPage = useCallback(() => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  }, [currentPage]);

  // Mise à jour du like (optimiste)
  const updateLike = useCallback(async (projectId: string, currentLiked: boolean) => {
    if (!userId) {
      // Rediriger vers connexion
      window.location.href = '/auth';
      return false;
    }

    // Mise à jour optimiste de l'UI
    setProjects(prevProjects =>
      prevProjects.map(project =>
        project.id === projectId
          ? {
              ...project,
              likes: currentLiked ? project.likes - 1 : project.likes + 1,
              user_has_liked: !currentLiked
            }
          : project
      )
    );

    try {
      if (currentLiked) {
        await metricsService.removeLike(projectId);
      } else {
        await metricsService.addLike(projectId);
      }
      return true;
    } catch (err) {
      // Rollback en cas d'erreur
      setProjects(prevProjects =>
        prevProjects.map(project =>
          project.id === projectId
            ? {
                ...project,
                likes: currentLiked ? project.likes + 1 : project.likes - 1,
                user_has_liked: currentLiked
              }
            : project
        )
      );
      console.error('Error updating like:', err);
      return false;
    }
  }, [userId]);

  return {
    // Données
    projects,
    loading,
    error,
    
    // Pagination
    currentPage,
    totalPages,
    totalCount,
    goToPage,
    nextPage,
    prevPage,
    
    // Filtres et tri
    searchTerm,
    setSearchTerm,
    categoryFilter,
    setCategoryFilter,
    sortBy,
    setSortBy,
    
    // Actions
    updateLike,
    refresh: () => loadProjects(currentPage, searchTerm, categoryFilter, sortBy),
    
    // Utilitaires
    hasNextPage: currentPage < totalPages,
    hasPrevPage: currentPage > 1,
    pageSize
  };
}