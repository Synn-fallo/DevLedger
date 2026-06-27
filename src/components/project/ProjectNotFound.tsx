import { FolderKanban } from 'lucide-react';

interface ProjectNotFoundProps {
  onNavigate: (page: string) => void;
}

export function ProjectNotFound({ onNavigate }: ProjectNotFoundProps) {
  return (
    <div className="flex items-center justify-center h-full">
      <div className="text-center max-w-md">
        <div className="w-16 h-16 bg-yellow-100 dark:bg-yellow-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
          <FolderKanban className="w-8 h-8 text-yellow-600 dark:text-yellow-400" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Projet non trouvé</h2>
        <p className="text-gray-600 dark:text-gray-400 mb-6">Le projet que vous recherchez n'existe pas ou a été supprimé.</p>
        <button onClick={() => onNavigate('projects')} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors">
          Retour aux projets
        </button>
      </div>
    </div>
  );
}