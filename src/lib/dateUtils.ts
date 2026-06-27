export type DateFormat = 'date' | 'datetime' | 'datetime-minutes';
export type PeriodType = 'calendar' | 'rolling';
export type PeriodKey = 
  | 'today' 
  | 'yesterday' 
  | 'this_week' 
  | 'this_month' 
  | 'this_quarter' 
  | 'this_year'
  | 'last_7_days'
  | 'last_30_days'
  | 'last_90_days'
  | 'last_365_days'
  | 'custom';

export const formatDate = (
  date: string | Date | null | undefined,
  format: DateFormat = 'datetime-minutes'
): string => {
  if (!date) return '—';
  const d = new Date(date);
  if (isNaN(d.getTime())) return '—';
  switch (format) {
    case 'date':
      return d.toLocaleDateString('fr-FR', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      });
    case 'datetime':
      return d.toLocaleString('fr-FR', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      });
    case 'datetime-minutes':
    default:
      return d.toLocaleString('fr-FR', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
  }
};

export const formatRelativeTime = (date: string | Date): string => {
  const d = new Date(date);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'à l\'instant';
  if (diffMins < 60) return `il y a ${diffMins} min`;
  if (diffHours < 24) return `il y a ${diffHours} h`;
  if (diffDays === 1) return 'hier';
  if (diffDays < 7) return `il y a ${diffDays} jours`;
  return formatDate(date, 'date');
};

// ==================== PÉRIODES CALENDAIRES ====================

export const getStartOfDay = (date: Date): Date => {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
};

export const getEndOfDay = (date: Date): Date => {
  const d = new Date(date);
  d.setHours(23, 59, 59, 999);
  return d;
};

export const getStartOfWeek = (date: Date): Date => {
  const d = new Date(date);
  const day = d.getDay();
  // Lundi = 1, Dimanche = 7 (on décale pour que la semaine commence lundi)
  const diff = (day === 0 ? 6 : day - 1);
  d.setDate(d.getDate() - diff);
  d.setHours(0, 0, 0, 0);
  return d;
};

export const getStartOfMonth = (date: Date): Date => {
  return new Date(date.getFullYear(), date.getMonth(), 1);
};

export const getStartOfQuarter = (date: Date): Date => {
  const d = new Date(date);
  const month = d.getMonth();
  let quarterStartMonth: number;
  if (month >= 0 && month <= 2) quarterStartMonth = 0;
  else if (month >= 3 && month <= 5) quarterStartMonth = 3;
  else if (month >= 6 && month <= 8) quarterStartMonth = 6;
  else quarterStartMonth = 9;
  return new Date(d.getFullYear(), quarterStartMonth, 1);
};

export const getStartOfYear = (date: Date): Date => {
  return new Date(date.getFullYear(), 0, 1);
};

// ==================== PÉRIODES GLISSANTES ====================

export const getDaysAgo = (date: Date, days: number): Date => {
  const d = new Date(date);
  d.setDate(d.getDate() - days);
  return d;
};

// ==================== FONCTIONS PRINCIPALES ====================

export interface DateRange {
  startDate: Date;
  endDate: Date;
  label: string;
}

export const getDateRange = (
  period: PeriodKey,
  referenceDate: Date = new Date(),
  periodType: PeriodType = 'calendar'
): DateRange => {
  const endDate = getEndOfDay(referenceDate);
  let startDate: Date;

  switch (period) {
    case 'today':
      startDate = getStartOfDay(referenceDate);
      return { startDate, endDate, label: 'Aujourd\'hui' };
    
    case 'yesterday':
      const yesterday = new Date(referenceDate);
      yesterday.setDate(yesterday.getDate() - 1);
      startDate = getStartOfDay(yesterday);
      return { startDate, endDate: getEndOfDay(yesterday), label: 'Hier' };
    
    case 'this_week':
      if (periodType === 'calendar') {
        startDate = getStartOfWeek(referenceDate);
      } else {
        startDate = getDaysAgo(referenceDate, 6);
      }
      return { startDate, endDate, label: periodType === 'calendar' ? 'Cette semaine' : '7 derniers jours' };
    
    case 'this_month':
      if (periodType === 'calendar') {
        startDate = getStartOfMonth(referenceDate);
      } else {
        startDate = getDaysAgo(referenceDate, 29);
      }
      return { startDate, endDate, label: periodType === 'calendar' ? 'Ce mois' : '30 derniers jours' };
    
    case 'this_quarter':
      if (periodType === 'calendar') {
        startDate = getStartOfQuarter(referenceDate);
      } else {
        startDate = getDaysAgo(referenceDate, 89);
      }
      return { startDate, endDate, label: periodType === 'calendar' ? 'Ce trimestre' : '90 derniers jours' };
    
    case 'this_year':
      if (periodType === 'calendar') {
        startDate = getStartOfYear(referenceDate);
      } else {
        startDate = getDaysAgo(referenceDate, 364);
      }
      return { startDate, endDate, label: periodType === 'calendar' ? 'Cette année' : '365 derniers jours' };
    
    case 'last_7_days':
      startDate = getDaysAgo(referenceDate, 6);
      return { startDate, endDate, label: '7 derniers jours' };
    
    case 'last_30_days':
      startDate = getDaysAgo(referenceDate, 29);
      return { startDate, endDate, label: '30 derniers jours' };
    
    case 'last_90_days':
      startDate = getDaysAgo(referenceDate, 89);
      return { startDate, endDate, label: '90 derniers jours' };
    
    case 'last_365_days':
      startDate = getDaysAgo(referenceDate, 364);
      return { startDate, endDate, label: '365 derniers jours' };
    
    case 'custom':
      return { startDate: referenceDate, endDate: referenceDate, label: 'Période personnalisée' };
    
    default:
      startDate = getStartOfMonth(referenceDate);
      return { startDate, endDate, label: 'Ce mois' };
  }
};

// Options pour les sélecteurs
export const periodOptions = [
  { value: 'today', label: 'Aujourd\'hui' },
  { value: 'yesterday', label: 'Hier' },
  { value: 'this_week', label: 'Cette semaine' },
  { value: 'this_month', label: 'Ce mois' },
  { value: 'this_quarter', label: 'Ce trimestre' },
  { value: 'this_year', label: 'Cette année' },
  { value: 'last_7_days', label: '7 derniers jours' },
  { value: 'last_30_days', label: '30 derniers jours' },
  { value: 'last_90_days', label: '90 derniers jours' },
  { value: 'last_365_days', label: '365 derniers jours' },
  { value: 'custom', label: 'Personnalisé' }
];

export const periodTypeOptions = [
  { value: 'calendar', label: '📅 Calendaire' },
  { value: 'rolling', label: '🔄 Glissante' }
];