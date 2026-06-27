import { VisibilityBadge } from '../VisibilityBadge';

interface ProjectHeaderProps {
  project: any;
  visibility: string;
  isOwner: boolean;
  userRole: string | null;
  updatingVisibility: boolean;
  onUpdateVisibility: (visibility: 'private' | 'shared' | 'public') => void;
  onEditProject: () => void;
  onNavigate: (page: string) => void;
  isOwnerSubscriptionActive?: boolean; // NOUVEAU
}

export function ProjectHeader({
  project,
  visibility,
  isOwner,
  userRole,
  updatingVisibility,
  onUpdateVisibility,
  onEditProject,
  onNavigate,
  isOwnerSubscriptionActive = true
}: ProjectHeaderProps) {
  // NOUVEAU - Désactiver les contrôles si l'abonnement du propriétaire est expiré
  const canModify = isOwner && isOwnerSubscriptionActive;

  return (
    <div className="flex items-center gap-4">
      <button
        onClick={() => onNavigate('projects')}
        className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
      >
        ←
      </button>
      <div className="flex-1">
        <div className="flex items-center gap-3 flex-wrap">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{project.name}</h1>
          {project.reference && (
            <span className="text-xs font-mono bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">
              {project.reference}
            </span>
          )}
          <VisibilityBadge visibility={visibility as 'private' | 'shared' | 'public'} />
          {!isOwner && (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400">
              👥 Invité {userRole === 'editor' ? '(Éditeur)' : '(Lecteur)'}
            </span>
          )}
        </div>
        <p className="text-gray-600 dark:text-gray-400 mt-1">{project.description}</p>
      </div>
      <div className="flex items-center gap-2">
        {isOwner && (
          <>
            <select
              value={visibility}
              onChange={(e) => onUpdateVisibility(e.target.value as 'private' | 'shared' | 'public')}
              disabled={updatingVisibility || !isOwnerSubscriptionActive}
              className={`px-3 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                !isOwnerSubscriptionActive
                  ? 'border-gray-300 dark:border-gray-600 bg-gray-100 dark:bg-gray-800 text-gray-400 cursor-not-allowed'
                  : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white'
              }`}
            >
              <option value="private">🔒 Privé</option>
              <option value="shared">👥 Partagé</option>
              <option value="public">🌍 Public</option>
            </select>
            <button
              onClick={onEditProject}
              disabled={!isOwnerSubscriptionActive}
              className={`p-2 border rounded-lg transition-colors ${
                !isOwnerSubscriptionActive
                  ? 'border-gray-300 dark:border-gray-600 text-gray-400 cursor-not-allowed'
                  : 'border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
              }`}
              title={!isOwnerSubscriptionActive ? "Abonnement expiré - Renouvelez pour modifier" : "Modifier le projet"}
            >
              ✏️
            </button>
          </>
        )}
      </div>
    </div>
  );
}