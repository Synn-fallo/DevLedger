// /src/lib/sortOptions.ts
import { Priority } from '../types/preferences';

export interface SortOption {
  id: string;
  label: string;
  icon: string;
  field: 'created_at' | 'name' | 'last_activity' | 'priority_order' | 'total_time' | 'tokens' | 'sessions';
  direction: 'asc' | 'desc';
  group?: 'date' | 'alpha' | 'activity' | 'priority' | 'stats';
}

export const sortOptions: SortOption[] = [
  // 📅 Tri par date
  { 
    id: 'date_desc', 
    label: 'Plus récent', 
    icon: '📅', 
    field: 'created_at', 
    direction: 'desc',
    group: 'date'
  },
  { 
    id: 'date_asc', 
    label: 'Plus ancien', 
    icon: '📅', 
    field: 'created_at', 
    direction: 'asc',
    group: 'date'
  },
  
  // 🔤 Tri alphabétique
  { 
    id: 'name_asc', 
    label: 'A-Z', 
    icon: '🔤', 
    field: 'name', 
    direction: 'asc',
    group: 'alpha'
  },
  { 
    id: 'name_desc', 
    label: 'Z-A', 
    icon: '🔤', 
    field: 'name', 
    direction: 'desc',
    group: 'alpha'
  },
  
  // ⏱️ Tri par activité
  { 
    id: 'activity_desc', 
    label: 'Dernière activité', 
    icon: '⏱️', 
    field: 'last_activity', 
    direction: 'desc',
    group: 'activity'
  },
  { 
    id: 'activity_asc', 
    label: 'Première activité', 
    icon: '⏱️', 
    field: 'last_activity', 
    direction: 'asc',
    group: 'activity'
  },
  
  // 📊 Tri par priorité
  { 
    id: 'priority_asc', 
    label: 'Priorité ▲', 
    icon: '📊', 
    field: 'priority_order', 
    direction: 'asc',
    group: 'priority'
  },
  { 
    id: 'priority_desc', 
    label: 'Priorité ▼', 
    icon: '📊', 
    field: 'priority_order', 
    direction: 'desc',
    group: 'priority'
  },
  
  // ⏰ Tri par temps
  { 
    id: 'time_desc', 
    label: 'Temps (↑)', 
    icon: '⏰', 
    field: 'total_time', 
    direction: 'desc',
    group: 'stats'
  },
  { 
    id: 'time_asc', 
    label: 'Temps (↓)', 
    icon: '⏰', 
    field: 'total_time', 
    direction: 'asc',
    group: 'stats'
  },
  
  // ⚡ Tri par tokens
  { 
    id: 'tokens_desc', 
    label: 'Tokens (↑)', 
    icon: '⚡', 
    field: 'tokens', 
    direction: 'desc',
    group: 'stats'
  },
  { 
    id: 'tokens_asc', 
    label: 'Tokens (↓)', 
    icon: '⚡', 
    field: 'tokens', 
    direction: 'asc',
    group: 'stats'
  },
  
  // 📊 Tri par sessions
  { 
    id: 'sessions_desc', 
    label: 'Sessions (↑)', 
    icon: '📊', 
    field: 'sessions', 
    direction: 'desc',
    group: 'stats'
  },
  { 
    id: 'sessions_asc', 
    label: 'Sessions (↓)', 
    icon: '📊', 
    field: 'sessions', 
    direction: 'asc',
    group: 'stats'
  }
];

// Regrouper les options par catégorie pour l'affichage
export const sortOptionsByGroup = sortOptions.reduce((acc, option) => {
  const group = option.group || 'other';
  if (!acc[group]) {
    acc[group] = [];
  }
  acc[group].push(option);
  return acc;
}, {} as Record<string, SortOption[]>);

// Ordre d'affichage des groupes
export const groupOrder = ['date', 'alpha', 'activity', 'priority', 'stats'];

// Libellés des groupes
export const groupLabels: Record<string, string> = {
  date: '📅 Date',
  alpha: '🔤 Alphabet',
  activity: '⏱️ Activité',
  priority: '📊 Priorité',
  stats: '📈 Statistiques'
};

// Option par défaut
export const defaultSortOption = 'priority_desc';