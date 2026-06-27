// /src/types/preferences.ts
import { sortOptions, SortOption } from '../lib/sortOptions';

export type Priority = 'critical' | 'high' | 'medium' | 'low' | 'on-hold';
export type ViewMode = 'compact' | 'detailed';

export interface Filters {
  priority: Priority | 'all';
  search: string;
}

export interface UserPreferences {
  // Tri
  sortBy: string; // ID de l'option de tri
  
  // Filtres
  filters: Filters;
  
  // Affichage
  viewMode: ViewMode;
  
  // Colonnes (pour vue détaillée)
  visibleColumns?: string[];
  
  // Métadonnées
  lastUsed: string; // ISO date
  visitCount: number;
}

export interface UserPreferencesDB {
  id: string;
  user_id: string;
  page: string;
  preferences: UserPreferences;
  created_at: string;
  updated_at: string;
  last_visit: string | null;
  visit_count: number;
}

// Ordre de priorité pour le tri
export const priorityRank: Record<Priority, number> = {
  critical: 1,
  high: 2,
  medium: 3,
  low: 4,
  'on-hold': 5
};

// Configuration par défaut
export const defaultPreferences: UserPreferences = {
  sortBy: 'priority_desc',
  filters: {
    priority: 'all',
    search: ''
  },
  viewMode: 'detailed',
  lastUsed: new Date().toISOString(),
  visitCount: 0
};

// Types pour les statistiques
export interface ProjectStats {
  total_time_minutes: number;
  total_tokens: number;
  session_count: number;
  last_activity: string;
}

// Interface étendue pour les projets avec stats
import { Project } from './database.types';
export interface ProjectWithStats extends Project, ProjectStats {
  // Propriétés supplémentaires pour le tri
  priority_order?: number;
}