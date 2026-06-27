import { X } from 'lucide-react';

interface SessionFormData {
  date: string;
  title: string;
  activities_summary: string;
  general_observation: string;
  time_bolt: number;
  time_chatgpt: number;
  time_deepseek: number;
  time_other: number;
  other_tool_name: string;
  tokens_consumed: number;
  deployment_status: 'ok' | 'nok';
  observations: string;
}

interface SessionModalProps {
  title: string;
  sessionForm: SessionFormData;
  setSessionForm: (form: SessionFormData) => void;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
}

export function SessionModal({ title, sessionForm, setSessionForm, onClose, onSubmit }: SessionModalProps) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-start justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white dark:bg-gray-800 rounded-xl w-full max-w-3xl my-8 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700 sticky top-0 bg-white dark:bg-gray-800">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{title}</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"><X className="w-5 h-5 text-gray-500" /></button>
        </div>

        <form onSubmit={onSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Date</label>
            <input type="date" value={sessionForm.date} onChange={(e) => setSessionForm({ ...sessionForm, date: e.target.value })} className="w-full px-4 py-2 border rounded-lg bg-white dark:bg-gray-700" />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Titre (optionnel)</label>
            <input type="text" value={sessionForm.title} onChange={(e) => setSessionForm({ ...sessionForm, title: e.target.value })} className="w-full px-4 py-2 border rounded-lg" placeholder="Ex: Correction bug API login" />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Résumé des activités</label>
            <textarea value={sessionForm.activities_summary} onChange={(e) => setSessionForm({ ...sessionForm, activities_summary: e.target.value })} rows={3} className="w-full px-4 py-2 border rounded-lg" placeholder="- Analyse des logs&#10;- Correction du middleware&#10;- Tests" />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Observation générale</label>
            <textarea value={sessionForm.general_observation} onChange={(e) => setSessionForm({ ...sessionForm, general_observation: e.target.value })} rows={2} className="w-full px-4 py-2 border rounded-lg" placeholder="Difficultés, apprentissages..." />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div><label>Temps Bolt (min)</label><input type="number" value={sessionForm.time_bolt} onChange={(e) => setSessionForm({ ...sessionForm, time_bolt: Number(e.target.value) })} className="w-full px-4 py-2 border rounded-lg" /></div>
            <div><label>Temps ChatGPT (min)</label><input type="number" value={sessionForm.time_chatgpt} onChange={(e) => setSessionForm({ ...sessionForm, time_chatgpt: Number(e.target.value) })} className="w-full px-4 py-2 border rounded-lg" /></div>
            <div><label>Temps DeepSeek (min)</label><input type="number" value={sessionForm.time_deepseek} onChange={(e) => setSessionForm({ ...sessionForm, time_deepseek: Number(e.target.value) })} className="w-full px-4 py-2 border rounded-lg" /></div>
            <div><label>Autre outil (min)</label><input type="number" value={sessionForm.time_other} onChange={(e) => setSessionForm({ ...sessionForm, time_other: Number(e.target.value) })} className="w-full px-4 py-2 border rounded-lg" /></div>
          </div>

          <div><label>Nom de l'autre outil</label><input type="text" value={sessionForm.other_tool_name} onChange={(e) => setSessionForm({ ...sessionForm, other_tool_name: e.target.value })} className="w-full px-4 py-2 border rounded-lg" /></div>
          <div><label>Tokens consommés</label><input type="number" value={sessionForm.tokens_consumed} onChange={(e) => setSessionForm({ ...sessionForm, tokens_consumed: Number(e.target.value) })} className="w-full px-4 py-2 border rounded-lg" /></div>
          <div><label>Déploiement</label><select value={sessionForm.deployment_status} onChange={(e) => setSessionForm({ ...sessionForm, deployment_status: e.target.value as 'ok' | 'nok' })} className="w-full px-4 py-2 border rounded-lg"><option value="nok">Non déployé</option><option value="ok">Déployé avec succès</option></select></div>
          <div><label>Observations complémentaires</label><textarea value={sessionForm.observations} onChange={(e) => setSessionForm({ ...sessionForm, observations: e.target.value })} rows={3} className="w-full px-4 py-2 border rounded-lg" /></div>

          <div className="flex gap-3 pt-4">
            <button type="button" onClick={onClose} className="flex-1 px-4 py-2 border rounded-lg">Annuler</button>
            <button type="submit" className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg">Ajouter / Modifier</button>
          </div>
        </form>
      </div>
    </div>
  );
}