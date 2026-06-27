import { useState } from 'react';
import { X, Clock, RotateCcw, Eye } from 'lucide-react';

interface Version {
  id: string;
  version_number: number;
  content: string;
  notes: string | null;
  created_at: string;
  created_by: string | null;
}

interface PlanHistoryModalProps {
  versions: Version[];
  currentContent: string;
  onRestore: (content: string) => void;
  onClose: () => void;
}

export function PlanHistoryModal({ versions, currentContent, onRestore, onClose }: PlanHistoryModalProps) {
  const [selectedVersion, setSelectedVersion] = useState<Version | null>(null);

  const formatDate = (date: string) => {
    return new Date(date).toLocaleString('fr-FR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl w-full max-w-3xl max-h-[80vh] flex flex-col">
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            Historique des versions ({versions.length})
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="flex-1 overflow-hidden flex">
          {/* Liste des versions */}
          <div className="w-1/3 border-r border-gray-200 dark:border-gray-700 overflow-y-auto">
            {versions.map((version) => (
              <button
                key={version.id}
                onClick={() => setSelectedVersion(version)}
                className={`w-full text-left p-4 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors border-b border-gray-100 dark:border-gray-800 ${
                  selectedVersion?.id === version.id ? 'bg-blue-50 dark:bg-blue-900/20' : ''
                }`}
              >
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-gray-400" />
                  <span className="font-medium text-gray-900 dark:text-white">v{version.version_number}</span>
                </div>
                <p className="text-xs text-gray-500 mt-1">{formatDate(version.created_at)}</p>
              </button>
            ))}
          </div>

          {/* Aperçu du contenu */}
          <div className="w-2/3 overflow-y-auto p-6">
            {selectedVersion ? (
              <div>
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Version {selectedVersion.version_number}
                  </h3>
                  <button
                    onClick={() => onRestore(selectedVersion.content)}
                    className="flex items-center gap-2 px-3 py-1.5 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
                  >
                    <RotateCcw className="w-4 h-4" />
                    Restaurer
                  </button>
                </div>
                <div className="prose dark:prose-invert max-w-none">
                  <pre className="whitespace-pre-wrap text-sm text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                    {selectedVersion.content || '(vide)'}
                  </pre>
                </div>
                {selectedVersion.notes && (
                  <div className="mt-4 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <p className="text-xs text-gray-500">Notes associées :</p>
                    <p className="text-sm text-gray-700 dark:text-gray-300 mt-1">{selectedVersion.notes}</p>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center text-gray-500 py-8">
                Sélectionnez une version pour voir son contenu
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}