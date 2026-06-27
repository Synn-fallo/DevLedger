import { useState } from 'react';
import { X, HelpCircle } from 'lucide-react';

interface DevelopmentPlanEditorProps {
  initialContent: string | null;
  onSave: (content: string) => void;
  onClose: () => void;
}

export function DevelopmentPlanEditor({ initialContent, onSave, onClose }: DevelopmentPlanEditorProps) {
  const [content, setContent] = useState(initialContent || '');
  const [showHelp, setShowHelp] = useState(false);

  const handleSave = () => {
    onSave(content);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-2">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Plan de développement</h2>
            <button
              type="button"
              onClick={() => setShowHelp(!showHelp)}
              className="p-1 text-gray-400 hover:text-gray-600"
            >
              <HelpCircle className="w-5 h-5" />
            </button>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {showHelp && (
          <div className="mx-6 mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
            <h3 className="text-sm font-semibold text-blue-800 dark:text-blue-300 mb-2">Format Markdown supporté</h3>
            <div className="grid grid-cols-2 gap-4 text-xs text-blue-700 dark:text-blue-400">
              <div>
                <p><code className="bg-blue-100 dark:bg-blue-900/50 px-1 rounded"># Titre</code> → Titre niveau 1</p>
                <p><code className="bg-blue-100 dark:bg-blue-900/50 px-1 rounded">## Titre</code> → Titre niveau 2</p>
                <p><code className="bg-blue-100 dark:bg-blue-900/50 px-1 rounded">### Titre</code> → Titre niveau 3</p>
                <p><code className="bg-blue-100 dark:bg-blue-900/50 px-1 rounded">- Élément</code> → Liste à puces</p>
              </div>
              <div>
                <p><code className="bg-blue-100 dark:bg-blue-900/50 px-1 rounded">- [x] Fait</code> → Case cochée</p>
                <p><code className="bg-blue-100 dark:bg-blue-900/50 px-1 rounded">- [ ] À faire</code> → Case décochée</p>
                <p><code className="bg-blue-100 dark:bg-blue-900/50 px-1 rounded">---</code> → Séparateur</p>
                <p><code className="bg-blue-100 dark:bg-blue-900/50 px-1 rounded">**gras**</code> → Texte en gras</p>
              </div>
            </div>
          </div>
        )}

        <div className="flex-1 p-6 overflow-y-auto">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={15}
            className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 font-mono text-sm"
            placeholder={`# Phase 1 - Authentification
- [x] Configuration de Supabase Auth
- [ ] Page de connexion
- [ ] Page d'inscription

# Phase 2 - Dashboard
- [ ] Création des composants
- [ ] Intégration des statistiques

---
## Notes
- Penser à tester la responsive
- Intégrer les retours utilisateurs`}
          />
        </div>

        <div className="flex gap-3 p-6 border-t border-gray-200 dark:border-gray-700">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            Annuler
          </button>
          <button
            onClick={handleSave}
            className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
          >
            Enregistrer
          </button>
        </div>
      </div>
    </div>
  );
}