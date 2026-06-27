import { Heart, MessageCircle, Eye, ExternalLink, Calendar } from 'lucide-react';
import { Link } from 'react-router-dom';

interface PublicProjectCardProps {
  project: {
    id: string;
    name: string;
    description: string;
    views: number;
    likes: number;
    comments: number;
    userHasLiked?: boolean;
    created_at?: string;
  };
  onLike?: (projectId: string) => void;
}

export function PublicProjectCard({ project, onLike }: PublicProjectCardProps) {
  const formatDate = (dateString?: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
      <div className="p-6">
        <div className="flex items-start justify-between mb-2">
          <h3 className="text-xl font-bold text-gray-900 dark:text-white line-clamp-1 flex-1">
            {project.name}
          </h3>
          {project.created_at && (
            <span className="text-xs text-gray-400 flex items-center gap-1 ml-2">
              <Calendar className="w-3 h-3" />
              {formatDate(project.created_at)}
            </span>
          )}
        </div>
        
        <p className="text-gray-600 dark:text-gray-400 text-sm line-clamp-2 mb-4">
          {project.description || 'Aucune description'}
        </p>
        
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => onLike?.(project.id)}
              className="flex items-center gap-1 text-gray-500 hover:text-red-500 transition-colors group"
            >
              <Heart className={`w-5 h-5 transition-colors ${project.userHasLiked ? 'fill-red-500 text-red-500' : 'group-hover:fill-red-500 group-hover:text-red-500'}`} />
              <span className="text-sm">{project.likes}</span>
            </button>
            <div className="flex items-center gap-1 text-gray-500">
              <MessageCircle className="w-5 h-5" />
              <span className="text-sm">{project.comments}</span>
            </div>
            <div className="flex items-center gap-1 text-gray-500">
              <Eye className="w-5 h-5" />
              <span className="text-sm">{project.views}</span>
            </div>
          </div>
          
          <Link
            to={`/public/${project.id}`}
            className="flex items-center gap-1 text-blue-600 hover:text-blue-700 transition-colors text-sm font-medium group"
          >
            Voir détails
            <ExternalLink className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
          </Link>
        </div>
      </div>
    </div>
  );
}