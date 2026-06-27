import { useState } from 'react';
import { X, Download, ExternalLink, Clock, Calendar, Tag, User, Link as LinkIcon, Edit2 } from 'lucide-react';
import type { BugReport } from '../../lib/database.types';
import { BugStatusLabels, BugCategoryLabels, BugDifficultyLabels, BugEnvironmentLabels } from '../../lib/database.types';
import { formatDate } from '../../lib/dateUtils';

interface BugDetailModalProps {
  bug: BugReport;
  projectName: string;
  onClose: () => void;
  onEdit?: () => void;
}

export function BugDetailModal({ bug, projectName, onClose, onEdit }: BugDetailModalProps) {
  const formatTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours === 0) return `${mins} min`;
    return `${hours}h ${mins}m`;
  };

  const attachments = bug.attachments as Array<{ name: string; url: string; size: number; type: string; path: string }> || [];

  const handleEdit = () => {
    if (onEdit) {
      onEdit();
      onClose();
    }
  };

  return (
    <>
      <div className="fixed inset-0 bg-black/50 z-50" onClick={onClose} />
      <div className="fixed inset-0 z-50 flex items-start justify-center p-4 overflow-y-auto">
        <div className="bg-white dark:bg-gray-800 rounded-xl w-full max-w-3xl my-8 max-h-[90vh] overflow-y-auto">
          {/* En-tête */}
          <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-6 flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">{bug.title}</h2>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-sm text-gray-500">📁 {projectName}</span>
                <span className={`text-xs px-2 py-0.5 rounded-full ${
                  bug.status === 'open' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300' :
                  bug.status === 'in_progress' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300' :
                  bug.status === 'resolved' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300' :
                  'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
                }`}>
                  {BugStatusLabels[bug.status]}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {onEdit && (
                <button
                  onClick={handleEdit}
                  className="flex items-center gap-2 px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  <Edit2 className="w-4 h-4" />
                  Modifier
                </button>
              )}
              <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
          </div>

          <div className="p-6 space-y-6">
            {/* Description */}
            <div>
              <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Description</h3>
              <p className="text-gray-600 dark:text-gray-400 text-justify whitespace-pre-wrap">{bug.description}</p>
            </div>

            {/* Métadonnées */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-gray-50 dark:bg-gray-700/30 rounded-lg">
              <div>
                <p className="text-xs text-gray-500">Catégorie</p>
                <p className="text-sm font-medium">{BugCategoryLabels[bug.category]}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Difficulté</p>
                <p className="text-sm font-medium">{bug.difficulty ? BugDifficultyLabels[bug.difficulty] : '—'}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Environnement</p>
                <p className="text-sm font-medium">{BugEnvironmentLabels[bug.environment]}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Temps réel</p>
                <p className="text-sm font-medium">{formatTime(bug.actual_time_minutes)}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Temps estimé</p>
                <p className="text-sm font-medium">{formatTime(bug.estimated_time_minutes)}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Créé le</p>
                <p className="text-sm font-medium">{formatDate(bug.created_at, 'datetime-minutes')}</p>
              </div>
              {bug.resolved_at && (
                <div>
                  <p className="text-xs text-gray-500">Résolu le</p>
                  <p className="text-sm font-medium">{formatDate(bug.resolved_at, 'datetime-minutes')}</p>
                </div>
              )}
              {bug.browser && (
                <div>
                  <p className="text-xs text-gray-500">Navigateur</p>
                  <p className="text-sm font-medium">{bug.browser}</p>
                </div>
              )}
              {bug.device && (
                <div>
                  <p className="text-xs text-gray-500">Appareil</p>
                  <p className="text-sm font-medium">{bug.device}</p>
                </div>
              )}
            </div>

            {/* Actions entreprises */}
            {bug.steps_taken && (
              <div>
                <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Actions entreprises</h3>
                <p className="text-gray-600 dark:text-gray-400 text-justify whitespace-pre-wrap">{bug.steps_taken}</p>
              </div>
            )}

            {/* Hypothèses testées */}
            {bug.hypothesis_tested && (
              <div>
                <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Hypothèses testées</h3>
                <p className="text-gray-600 dark:text-gray-400 text-justify whitespace-pre-wrap">{bug.hypothesis_tested}</p>
              </div>
            )}

            {/* Solution */}
            {bug.solution && (
              <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4">
                <h3 className="text-sm font-semibold text-green-700 dark:text-green-400 mb-2">Solution</h3>
                <p className="text-gray-700 dark:text-gray-300 text-justify whitespace-pre-wrap">{bug.solution}</p>
              </div>
            )}

            {/* Observations spécifiques */}
            {bug.specific_observations && (
              <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
                <h3 className="text-sm font-semibold text-blue-700 dark:text-blue-400 mb-2">Observations spécifiques</h3>
                <p className="text-gray-700 dark:text-gray-300 text-justify whitespace-pre-wrap">{bug.specific_observations}</p>
              </div>
            )}

            {/* Liens ressources */}
            {bug.resources_links && bug.resources_links.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-1">
                  <LinkIcon className="w-4 h-4" />
                  Liens utiles
                </h3>
                <div className="space-y-1">
                  {bug.resources_links.map((link, idx) => (
                    <a
                      key={idx}
                      href={link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-sm text-blue-600 dark:text-blue-400 hover:underline"
                    >
                      <ExternalLink className="w-3 h-3" />
                      {link}
                    </a>
                  ))}
                </div>
              </div>
            )}

            {/* Tags */}
            {bug.tags && bug.tags.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-1">
                  <Tag className="w-4 h-4" />
                  Tags
                </h3>
                <div className="flex flex-wrap gap-2">
                  {bug.tags.map((tag, idx) => (
                    <span key={idx} className="px-2 py-1 text-xs bg-gray-100 dark:bg-gray-700 rounded-full">
                      #{tag}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Pièces jointes */}
            {attachments.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Pièces jointes</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {attachments.map((file, idx) => (
                    <a
                      key={idx}
                      href={file.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        <Download className="w-4 h-4 text-gray-500" />
                        <span className="text-sm text-gray-700 dark:text-gray-300 truncate max-w-[200px]">
                          {file.name}
                        </span>
                      </div>
                      <span className="text-xs text-gray-400">
                        {file.size ? `${(file.size / 1024).toFixed(1)} KB` : ''}
                      </span>
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}