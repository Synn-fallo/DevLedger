import { useState } from 'react';
import { X, AlertTriangle, Trash2, Info } from 'lucide-react';
import { accountService } from '../services/accountService';

interface DeleteAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function DeleteAccountModal({ isOpen, onClose }: DeleteAccountModalProps) {
  const [confirmText, setConfirmText] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const handleDelete = async () => {
    if (confirmText !== 'SUPPRIMER') {
      setError('Veuillez taper SUPPRIMER pour confirmer');
      return;
    }

    setLoading(true);
    setError('');
    setSuccessMessage('');

    const result = await accountService.deleteAccount();

    if (result.success) {
      setSuccessMessage(result.message || 'Vos données ont été supprimées avec succès.');
      // Attendre 2 secondes pour que l'utilisateur voie le message
      setTimeout(() => {
        onClose();
        // Rediriger vers la page de connexion
        window.location.href = '/login';
      }, 2000);
    } else {
      setError(result.error || 'Une erreur est survenue');
    }

    setLoading(false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700 sticky top-0 bg-white dark:bg-gray-800">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg">
              <Trash2 className="w-5 h-5 text-red-600 dark:text-red-400" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              Supprimer mon compte
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          {/* Avertissement */}
          <div className="flex gap-3 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0" />
            <div>
              <p className="text-sm font-medium text-red-800 dark:text-red-300 mb-1">
                ⚠️ Attention : Action irréversible
              </p>
              <p className="text-sm text-red-700 dark:text-red-400">
                Cette action supprimera définitivement :
              </p>
              <ul className="text-sm text-red-700 dark:text-red-400 list-disc list-inside mt-2 space-y-1">
                <li>Tous vos projets</li>
                <li>Toutes vos sessions de travail</li>
                <li>Vos paramètres personnels</li>
                <li>Vos invitations et partages</li>
                <li>Votre compte utilisateur</li>
              </ul>
            </div>
          </div>

          {/* Information */}
          <div className="flex gap-3 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
            <Info className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0" />
            <div>
              <p className="text-sm text-blue-800 dark:text-blue-400">
                Vos données seront supprimées immédiatement. 
                Vous serez déconnecté automatiquement après confirmation.
              </p>
            </div>
          </div>

          {/* Confirmation */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Pour confirmer, tapez <span className="font-mono font-bold text-red-600 dark:text-red-400">SUPPRIMER</span>
            </label>
            <input
              type="text"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder="SUPPRIMER"
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-red-500 focus:border-transparent font-mono"
              autoComplete="off"
            />
          </div>

          {/* Message de succès */}
          {successMessage && (
            <div className="p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
              <p className="text-sm text-green-600 dark:text-green-400">{successMessage}</p>
              <p className="text-xs text-green-500 dark:text-green-500 mt-1">
                Redirection vers la page de connexion...
              </p>
            </div>
          )}

          {/* Message d'erreur */}
          {error && (
            <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
            </div>
          )}

          {/* Boutons */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
            >
              Annuler
            </button>
            <button
              type="button"
              onClick={handleDelete}
              disabled={loading || confirmText !== 'SUPPRIMER'}
              className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Suppression...
                </span>
              ) : (
                'Supprimer définitivement'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}