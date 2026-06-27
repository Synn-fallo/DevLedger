import { useState } from 'react';
import { Clock, Eye, RotateCcw } from 'lucide-react';
import { PlanHistoryModal } from './PlanHistoryModal';

interface Version {
  id: string;
  version_number: number;
  content: string;
  notes: string | null;
  created_at: string;
  created_by: string | null;
}

interface PlanHistoryProps {
  projectId: string;
  versions: Version[];
  currentContent: string;
  onRestore: (content: string) => void;
}

export function PlanHistory({ projectId, versions, currentContent, onRestore }: PlanHistoryProps) {
  const [showModal, setShowModal] = useState(false);

  if (versions.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500 dark:text-gray-400">
        Aucun historique disponible.
      </div>
    );
  }

  const latestVersions = versions.slice(0, 3);

  return (
    <div className="space-y-3">
      <div className="space-y-2">
        {latestVersions.map((version) => (
          <div key={version.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
            <div className="flex items-center gap-3">
              <Clock className="w-4 h-4 text-gray-400" />
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  v{version.version_number}
                </p>
                <p className="text-xs text-gray-500">
                  {new Date(version.created_at).toLocaleString('fr-FR')}
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => onRestore(version.content)}
                className="p-1 text-gray-500 hover:text-blue-600 rounded"
                title="Restaurer cette version"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>
      
      {versions.length > 3 && (
        <button
          onClick={() => setShowModal(true)}
          className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
        >
          Voir toutes les versions ({versions.length})
        </button>
      )}

      {showModal && (
        <PlanHistoryModal
          versions={versions}
          currentContent={currentContent}
          onRestore={(content) => {
            onRestore(content);
            setShowModal(false);
          }}
          onClose={() => setShowModal(false)}
        />
      )}
    </div>
  );
}