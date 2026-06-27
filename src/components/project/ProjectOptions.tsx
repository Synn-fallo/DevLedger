import { Users, Settings, Eye, EyeOff } from 'lucide-react';

interface ProjectOptionsProps {
  isOwner: boolean;
  bugsVisible: boolean;
  showKpis: boolean | null;
  onToggleBugsVisibility: (visible: boolean) => void;
  onToggleKpisVisibility: (visible: boolean | null) => void;
}

export function ProjectOptions({ 
  isOwner, 
  bugsVisible, 
  showKpis, 
  onToggleBugsVisibility, 
  onToggleKpisVisibility 
}: ProjectOptionsProps) {
  if (!isOwner) return null;

  const getKpisLabel = () => {
    if (showKpis === true) return 'Afficher les KPIs (Temps, Tokens, Valeur)';
    if (showKpis === false) return 'Masquer les KPIs';
    return 'Utiliser le paramètre global';
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">🔧 Options du projet</h3>
      
      <div className="space-y-4">
        {/* Option bugs_visible */}
        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={bugsVisible}
            onChange={(e) => onToggleBugsVisibility(e.target.checked)}
            className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
          />
          <span className="text-sm text-gray-700 dark:text-gray-300">
            Afficher les rapports de bugs
          </span>
          <span className="text-xs text-gray-500">
            (pour les invités des projets partagés ou tous les utilisateurs pour les projets publics)
          </span>
        </label>

        {/* Option show_kpis */}
        <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Affichage des KPIs
          </label>
          <div className="flex flex-wrap gap-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                checked={showKpis === true}
                onChange={() => onToggleKpisVisibility(true)}
                className="w-4 h-4 text-blue-600"
              />
              <span className="text-sm text-gray-700 dark:text-gray-300">Afficher</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                checked={showKpis === false}
                onChange={() => onToggleKpisVisibility(false)}
                className="w-4 h-4 text-blue-600"
              />
              <span className="text-sm text-gray-700 dark:text-gray-300">Masquer</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                checked={showKpis === null}
                onChange={() => onToggleKpisVisibility(null)}
                className="w-4 h-4 text-blue-600"
              />
              <span className="text-sm text-gray-700 dark:text-gray-300">Utiliser le paramètre global</span>
            </label>
          </div>
          <p className="text-xs text-gray-500 mt-2">
            {showKpis === null 
              ? 'Utilise le paramètre défini dans vos préférences générales.' 
              : showKpis 
                ? 'Les KPIs (Temps Total, Tokens IA, Valeur Totale) seront affichés sur ce projet.' 
                : 'Les KPIs seront masqués sur ce projet (affichage de *** pour les visiteurs publics).'}
          </p>
        </div>
      </div>
    </div>
  );
}