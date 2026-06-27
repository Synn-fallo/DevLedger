import { useState, useEffect } from 'react';
import { X, HelpCircle } from 'lucide-react';
import type { BugReport, BugCategory, BugEnvironment } from '../../lib/database.types';
import { BugCategoryLabels, BugEnvironmentLabels } from '../../lib/database.types';
import { BugFileUpload } from './BugFileUpload';
import { useSubscription } from '../../contexts/SubscriptionContext';

interface BugFormProps {
  bug?: BugReport | null;
  projectId: string;
  sessionId?: string;
  onClose: () => void;
  onSave: (data: any) => void;
  onUploadFiles?: (files: File[]) => Promise<any[]>;
  existingAttachments?: Array<{ name: string; url: string; path: string }>;
  onRemoveAttachment?: (path: string) => void;
}

const statusOptions = [
  { value: 'open', label: '🔴 Ouvert', description: 'Bug signalé, non traité' },
  { value: 'in_progress', label: '🟡 En cours', description: 'En investigation/résolution' },
  { value: 'resolved', label: '🟢 Résolu', description: 'Solution trouvée, en attente de validation' },
  { value: 'closed', label: '⚪ Fermé', description: 'Validé et terminé' }
];

const categoryOptions: { value: BugCategory; label: string; description: string }[] = [
  { value: 'ui', label: '🎨 UI/UX', description: 'Problème d\'interface utilisateur ou d\'expérience' },
  { value: 'api', label: '🔌 API', description: 'Problème avec les appels API ou les endpoints' },
  { value: 'database', label: '🗄️ Base de données', description: 'Problème de requête, structure ou migration' },
  { value: 'logic', label: '⚙️ Logique métier', description: 'Erreur dans la logique fonctionnelle' },
  { value: 'performance', label: '⚡ Performance', description: 'Lenteur, optimisation, mémoire' },
  { value: 'security', label: '🔒 Sécurité', description: 'Vulnérabilité ou faille de sécurité' },
  { value: 'other', label: '📦 Autre', description: 'Autre type de problème' }
];

const environmentOptions: { value: BugEnvironment; label: string; description: string }[] = [
  { value: 'development', label: '💻 Développement', description: 'Environnement local de développement' },
  { value: 'staging', label: '🧪 Préproduction', description: 'Environnement de test pré-production' },
  { value: 'production', label: '🚀 Production', description: 'Environnement en ligne' }
];

const difficultyOptions = [
  { value: 1, label: '😊 Facile', description: 'Résolu en moins d\'1 heure' },
  { value: 2, label: '🤔 Moyen', description: 'Résolu en 1-3 heures' },
  { value: 3, label: '😓 Difficile', description: 'Résolu en 3-8 heures' },
  { value: 4, label: '💀 Très difficile', description: 'Résolu en 1-3 jours' },
  { value: 5, label: '🔥 Extrême', description: 'Plus de 3 jours' }
];

export function BugForm({ 
  bug, 
  projectId, 
  sessionId, 
  onClose, 
  onSave,
  onUploadFiles,
  existingAttachments = [],
  onRemoveAttachment
}: BugFormProps) {
  const { isPro, isEnterprise } = useSubscription();
  const canUploadAttachments = isPro || isEnterprise;
  const [formData, setFormData] = useState({
    title: bug?.title || '',
    description: bug?.description || '',
    category: bug?.category || 'other',
    status: bug?.status || 'open',
    difficulty: bug?.difficulty || null,
    environment: bug?.environment || 'development',
    browser: bug?.browser || '',
    device: bug?.device || '',
    app_version: bug?.app_version || '',
    steps_taken: bug?.steps_taken || '',           // NOUVEAU
    hypothesis_tested: bug?.hypothesis_tested || '', // NOUVEAU
    solution: bug?.solution || '',                 // NOUVEAU
    resources_links: bug?.resources_links?.join('\n') || '',
    estimated_time_minutes: bug?.estimated_time_minutes || 0,
    actual_time_minutes: bug?.actual_time_minutes || 0,
    tags: bug?.tags?.join(', ') || '',
    specific_observations: bug?.specific_observations || ''  // NOUVEAU
  });

  const [filesToUpload, setFilesToUpload] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [tooltips, setTooltips] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (bug?.attachments) {
      setFilesToUpload([]);
    }
  }, [bug]);

  const toggleTooltip = (field: string) => {
    setTooltips(prev => ({ ...prev, [field]: !prev[field] }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    let uploadedAttachments = existingAttachments;
    
    if (filesToUpload.length > 0 && onUploadFiles && canUploadAttachments) {
      setUploading(true);
      const uploaded = await onUploadFiles(filesToUpload);
      if (uploaded) {
        uploadedAttachments = [...existingAttachments, ...uploaded];
      }
      setUploading(false);
    }
    
    const submitData = {
      ...formData,
      resources_links: formData.resources_links.split('\n').filter(l => l.trim()),
      tags: formData.tags.split(',').map(t => t.trim()).filter(t => t),
      estimated_time_minutes: Number(formData.estimated_time_minutes),
      actual_time_minutes: Number(formData.actual_time_minutes),
      project_id: projectId,
      session_id: sessionId,
      attachments: uploadedAttachments,
      specific_observations: formData.specific_observations  // NOUVEAU
    };
    
    onSave(submitData);
  };

  const handleFilesSelected = (files: File[]) => {
    setFilesToUpload(files);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-start justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white dark:bg-gray-800 rounded-xl w-full max-w-3xl my-8 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700 sticky top-0 bg-white dark:bg-gray-800 z-10">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            {bug ? 'Modifier le bug' : 'Signaler un bug'}
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Titre */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Titre *
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              required
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
              placeholder="Ex: Le bouton de connexion ne répond pas"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Description *
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              required
              rows={3}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
              placeholder="Décrivez le problème rencontré..."
            />
          </div>

          {/* Catégorie, Statut, Difficulté */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <div className="flex items-center gap-1 mb-1">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Catégorie</label>
                <button type="button" onClick={() => toggleTooltip('category')} className="text-gray-400 hover:text-gray-600">
                  <HelpCircle className="w-4 h-4" />
                </button>
              </div>
              {tooltips.category && (
                <div className="mb-2 p-2 text-xs text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 rounded">
                  Type de problème rencontré
                </div>
              )}
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value as BugCategory })}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
              >
                {categoryOptions.map(opt => (
                  <option key={opt.value} value={opt.value} title={opt.description}>{opt.label}</option>
                ))}
              </select>
            </div>

            <div>
              <div className="flex items-center gap-1 mb-1">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Statut</label>
                <button type="button" onClick={() => toggleTooltip('status')} className="text-gray-400 hover:text-gray-600">
                  <HelpCircle className="w-4 h-4" />
                </button>
              </div>
              {tooltips.status && (
                <div className="mb-2 p-2 text-xs text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 rounded">
                  🔴 Ouvert: Bug signalé non traité<br/>
                  🟡 En cours: En investigation/résolution<br/>
                  🟢 Résolu: Solution trouvée, à valider<br/>
                  ⚪ Fermé: Validé et terminé
                </div>
              )}
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
              >
                {statusOptions.map(opt => (
                  <option key={opt.value} value={opt.value} title={opt.description}>{opt.label}</option>
                ))}
              </select>
            </div>

            <div>
              <div className="flex items-center gap-1 mb-1">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Difficulté</label>
                <button type="button" onClick={() => toggleTooltip('difficulty')} className="text-gray-400 hover:text-gray-600">
                  <HelpCircle className="w-4 h-4" />
                </button>
              </div>
              {tooltips.difficulty && (
                <div className="mb-2 p-2 text-xs text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 rounded">
                  1: Facile (&lt;1h)<br/>
                  2: Moyen (1-3h)<br/>
                  3: Difficile (3-8h)<br/>
                  4: Très difficile (1-3j)<br/>
                  5: Extrême (&gt;3j)
                </div>
              )}
              <select
                value={formData.difficulty || ''}
                onChange={(e) => setFormData({ ...formData, difficulty: e.target.value ? Number(e.target.value) : null })}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Non défini</option>
                {difficultyOptions.map(opt => (
                  <option key={opt.value} value={opt.value} title={opt.description}>{opt.label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Environnement, Navigateur, Appareil, Version */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <div className="flex items-center gap-1 mb-1">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Environnement</label>
                <button type="button" onClick={() => toggleTooltip('environment')} className="text-gray-400 hover:text-gray-600">
                  <HelpCircle className="w-4 h-4" />
                </button>
              </div>
              {tooltips.environment && (
                <div className="mb-2 p-2 text-xs text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 rounded">
                  💻 Développement: Local<br/>
                  🧪 Préproduction: Test<br/>
                  🚀 Production: En ligne
                </div>
              )}
              <select
                value={formData.environment}
                onChange={(e) => setFormData({ ...formData, environment: e.target.value as BugEnvironment })}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
              >
                {environmentOptions.map(opt => (
                  <option key={opt.value} value={opt.value} title={opt.description}>{opt.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Navigateur</label>
              <input
                type="text"
                value={formData.browser}
                onChange={(e) => setFormData({ ...formData, browser: e.target.value })}
                placeholder="Chrome 120, Firefox 121..."
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Appareil</label>
              <input
                type="text"
                value={formData.device}
                onChange={(e) => setFormData({ ...formData, device: e.target.value })}
                placeholder="iPhone 14, Windows PC..."
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Version app</label>
              <input
                type="text"
                value={formData.app_version}
                onChange={(e) => setFormData({ ...formData, app_version: e.target.value })}
                placeholder="v1.2.3"
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Actions entreprises */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Actions entreprises
            </label>
            <textarea
              value={formData.steps_taken}
              onChange={(e) => setFormData({ ...formData, steps_taken: e.target.value })}
              rows={2}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
              placeholder="Quelles actions avez-vous tentées ?"
            />
          </div>

          {/* Hypothèses testées */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Hypothèses testées
            </label>
            <textarea
              value={formData.hypothesis_tested}
              onChange={(e) => setFormData({ ...formData, hypothesis_tested: e.target.value })}
              rows={2}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
              placeholder="Quelles hypothèses avez-vous testées ?"
            />
          </div>

          {/* Solution */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Solution
            </label>
            <textarea
              value={formData.solution}
              onChange={(e) => setFormData({ ...formData, solution: e.target.value })}
              rows={2}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
              placeholder="Comment avez-vous résolu le problème ?"
            />
          </div>

          {/* Temps et tags */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Temps estimé (minutes)
              </label>
              <input
                type="number"
                value={formData.estimated_time_minutes}
                onChange={(e) => setFormData({ ...formData, estimated_time_minutes: parseInt(e.target.value) || 0 })}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                placeholder="Ex: 120"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Temps réel (minutes)
              </label>
              <input
                type="number"
                value={formData.actual_time_minutes}
                onChange={(e) => setFormData({ ...formData, actual_time_minutes: parseInt(e.target.value) || 0 })}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                placeholder="Ex: 180"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Tags (séparés par des virgules)
              </label>
              <input
                type="text"
                value={formData.tags}
                onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                placeholder="auth, regression, mobile"
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Liens ressources */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Liens ressources (un par ligne)
            </label>
            <textarea
              value={formData.resources_links}
              onChange={(e) => setFormData({ ...formData, resources_links: e.target.value })}
              rows={2}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
              placeholder="https://stackoverflow.com/...\nhttps://github.com/..."
            />
          </div>

          {/* Observations spécifiques au bug - NOUVEAU */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Observations spécifiques au bug
            </label>
            <textarea
              value={formData.specific_observations}
              onChange={(e) => setFormData({ ...formData, specific_observations: e.target.value })}
              rows={2}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
              placeholder="Ce qui a bloqué, ce qui était surprenant, la leçon à retenir..."
            />
          </div>

          {/* Pièces jointes - conditionnées par l'abonnement */}
          {canUploadAttachments ? (
            <BugFileUpload
              onFilesSelected={handleFilesSelected}
              existingAttachments={existingAttachments}
              onRemoveExisting={onRemoveAttachment}
              maxFiles={5}
              maxSize={10}
            />
          ) : (
            <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg text-center">
              <p className="text-sm text-gray-500">
                Les pièces jointes sont disponibles avec l’abonnement Pro.
                <a href="/subscription" className="text-blue-600 ml-1">Passer à Pro</a>
              </p>
            </div>
          )}

          {/* Boutons */}
          <div className="flex gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
            <button
              type="button"
              onClick={onClose}
              disabled={uploading}
              className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={uploading}
              className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50"
            >
              {uploading ? 'Upload en cours...' : (bug ? 'Mettre à jour' : 'Créer')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}