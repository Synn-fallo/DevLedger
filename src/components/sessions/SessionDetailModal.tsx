import { X, Calendar, Clock, Zap } from 'lucide-react';
import { formatDate } from '../../lib/dateUtils';

interface SessionDetailModalProps {
  session: any;
  onClose: () => void;
  onEdit?: () => void;
}

export function SessionDetailModal({ session, onClose, onEdit }: SessionDetailModalProps) {
  const totalTime = session.time_bolt + session.time_chatgpt + (session as any).time_deepseek + session.time_other;

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours === 0) return `${mins} min`;
    return `${hours}h ${mins}m`;
  };

  return (
    <>
      <div className="fixed inset-0 bg-black/50 z-50" onClick={onClose} />
      <div className="fixed inset-0 z-50 flex items-start justify-center p-4 overflow-y-auto">
        <div className="bg-white dark:bg-gray-800 rounded-xl w-full max-w-3xl my-8 max-h-[90vh] overflow-y-auto">
          {/* En-tête */}
          <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-6 flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                {session.title || 'Session sans titre'}
              </h2>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-sm text-gray-500">📅 {formatDate(session.date, 'date')}</span>
                <span className={`text-xs px-2 py-0.5 rounded-full ${
                  session.deployment_status === 'ok'
                    ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300'
                    : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300'
                }`}>
                  {session.deployment_status === 'ok' ? '✅ Déployé' : '❌ Non déployé'}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {onEdit && (
                <button
                  onClick={onEdit}
                  className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Modifier
                </button>
              )}
              <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
          </div>

          <div className="p-6 space-y-6">
            {/* Résumé des activités */}
            {(session as any).activities_summary && (
              <div>
                <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Résumé des activités</h3>
                <div className="text-gray-600 dark:text-gray-400 text-justify whitespace-pre-wrap">
                  {(session as any).activities_summary}
                </div>
              </div>
            )}

            {/* Observation générale */}
            {(session as any).general_observation && (
              <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
                <h3 className="text-sm font-semibold text-blue-700 dark:text-blue-400 mb-2">Observation générale</h3>
                <p className="text-gray-700 dark:text-gray-300 text-justify whitespace-pre-wrap">
                  {(session as any).general_observation}
                </p>
              </div>
            )}

            {/* Métriques */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-gray-50 dark:bg-gray-700/30 rounded-lg">
              <div>
                <p className="text-xs text-gray-500">Durée totale</p>
                <p className="text-sm font-medium flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {formatDuration(totalTime)}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Tokens consommés</p>
                <p className="text-sm font-medium flex items-center gap-1">
                  <Zap className="w-3 h-3" />
                  {session.tokens_consumed.toLocaleString()}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Déploiement</p>
                <p className="text-sm font-medium">{session.deployment_status === 'ok' ? '✅ Succès' : '❌ Échec'}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Date</p>
                <p className="text-sm font-medium">{formatDate(session.date, 'datetime-minutes')}</p>
              </div>
            </div>

            {/* Détail des temps par outil */}
            <div>
              <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Temps par outil</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {session.time_bolt > 0 && (
                  <div className="p-2 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                    <p className="text-xs text-gray-500">Bolt.new</p>
                    <p className="text-sm font-medium">{session.time_bolt} min</p>
                  </div>
                )}
                {session.time_chatgpt > 0 && (
                  <div className="p-2 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                    <p className="text-xs text-gray-500">ChatGPT</p>
                    <p className="text-sm font-medium">{session.time_chatgpt} min</p>
                  </div>
                )}
                {(session as any).time_deepseek > 0 && (
                  <div className="p-2 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                    <p className="text-xs text-gray-500">DeepSeek</p>
                    <p className="text-sm font-medium">{(session as any).time_deepseek} min</p>
                  </div>
                )}
                {session.time_other > 0 && (
                  <div className="p-2 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                    <p className="text-xs text-gray-500">{session.other_tool_name || 'Autre'}</p>
                    <p className="text-sm font-medium">{session.time_other} min</p>
                  </div>
                )}
              </div>
            </div>

            {/* Observations complémentaires */}
            {session.observations && (
              <div>
                <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Observations complémentaires</h3>
                <p className="text-gray-600 dark:text-gray-400 text-justify whitespace-pre-wrap">{session.observations}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}