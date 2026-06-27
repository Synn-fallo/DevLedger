import { useState } from 'react';
import { Send, CheckCircle, XCircle, Users } from 'lucide-react';
import { collaborationService } from '../../services/collaboration.service';

interface CollaborationRequestFormProps {
  projectId: string;
  projectName: string;
  onSuccess?: () => void;
}

export function CollaborationRequestForm({ projectId, projectName, onSuccess }: CollaborationRequestFormProps) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !message.trim()) return;

    setSubmitting(true);
    setError(null);

    const result = await collaborationService.createRequest(
      projectId,
      name.trim(),
      email.trim(),
      message.trim()
    );

    if (result) {
      setSubmitted(true);
      setName('');
      setEmail('');
      setMessage('');
      onSuccess?.();
      setTimeout(() => setSubmitted(false), 5000);
    } else {
      setError("Une erreur s'est produite. Veuillez réessayer.");
    }

    setSubmitting(false);
  };

  if (submitted) {
    return (
      <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4 text-center">
        <CheckCircle className="w-8 h-8 text-green-500 mx-auto mb-2" />
        <p className="text-green-700 dark:text-green-300 font-medium">Demande envoyée !</p>
        <p className="text-sm text-green-600 dark:text-green-400 mt-1">
          Le propriétaire du projet sera notifié et vous contactera prochainement.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
          <Users className="w-5 h-5 text-blue-600 dark:text-blue-400" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Proposer une collaboration
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Vous souhaitez collaborer sur {projectName} ? Laissez un message au propriétaire.
          </p>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-100 dark:bg-red-900/30 border border-red-300 dark:border-red-700 rounded-lg text-red-700 dark:text-red-300 text-sm flex items-center gap-2">
          <XCircle className="w-4 h-4" />
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Nom complet *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
              placeholder="Jean Dupont"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Email *
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
              placeholder="jean@exemple.com"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Message *
          </label>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            required
            rows={4}
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
            placeholder="Présentez-vous et expliquez pourquoi vous souhaitez collaborer sur ce projet..."
          />
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50"
        >
          <Send className="w-4 h-4" />
          {submitting ? 'Envoi en cours...' : 'Envoyer la demande'}
        </button>

        <p className="text-xs text-gray-500 text-center">
          Le propriétaire du projet sera notifié de votre demande. Vous pourrez échanger par chat une fois la demande acceptée.
        </p>
      </form>
    </div>
  );
}