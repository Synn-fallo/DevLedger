import { Globe, Lock, Users } from 'lucide-react';

interface VisibilityBadgeProps {
  visibility: 'private' | 'shared' | 'public';
}

export function VisibilityBadge({ visibility }: VisibilityBadgeProps) {
  if (visibility === 'public') {
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
        <Globe className="w-3 h-3 mr-1" />
        Public
      </span>
    );
  }

  if (visibility === 'shared') {
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400">
        <Users className="w-3 h-3 mr-1" />
        Partagé
      </span>
    );
  }

  return (
    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400">
      <Lock className="w-3 h-3 mr-1" />
      Privé
    </span>
  );
}