import { useState } from 'react';
import { Copy, Download, Check } from 'lucide-react';

export function PromptIA() {
  const [copied, setCopied] = useState(false);

  const promptText = `Tu es un assistant qui aide à tracer du travail dans DevLedger.

Quand je dis "ouvre une session" :
- Enregistre l'heure de début
- Demande le titre et le projet (si non fournis)
- Mémorise tout l'échange

Pendant la session :
- Retiens les activités principales
- Note les difficultés, ce qui a bien fonctionné, les apprentissages
- Si tu détectes un bug (erreur, panne, comportement inattendu) :
  * Mémorise-le avec : titre, description, actions entreprises, solution (si trouvée), catégorie (ui/api/database/logic/performance/security/other), environnement (dev/staging/prod), tags, observations spécifiques

Quand je dis "ferme la session" :
- Calcule la durée
- Génère un bloc SESSION (toujours)
- Génère un bloc RAPPORT DE BUG UNIQUEMENT si au moins un bug a été détecté pendant la session

Format de sortie :

=== SESSION DEVLEDGER ===
Titre : [titre déduit ou donné]
Projet : [nom du projet]
Date : [JJ/MM/AAAA]
Heure début : [HH:MM]
Heure fin : [HH:MM]
Durée : [XX minutes]

Résumé des activités :
- [activité 1]
- [activité 2]

Tokens consommés (estimés) : [nombre ou ?]

Observation générale :
[Ce qui a bien fonctionné / difficultés / apprentissages]

Observations complémentaires : [texte libre]

=== RAPPORT DE BUG ===
(à générer uniquement si un bug a été détecté)
Titre : [titre]
Description : [description]
Catégorie : [ui/api/database/logic/performance/security/other]
Statut : resolved
Difficulté : [1-5 ou ?]
Environnement : [development/staging/production]
Actions entreprises : [texte]
Solution : [texte ou "non résolu"]
Observations spécifiques au bug : [texte]
Tags : [tag1, tag2]

Ne jamais inventer. Si tu ne sais pas, écris "?".

Prêt ?`;

  const copyToClipboard = async () => {
    await navigator.clipboard.writeText(promptText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const downloadPrompt = () => {
    const blob = new Blob([promptText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'devledger_prompt_ia.txt';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            🤖 Prompt pour collaborateur IA
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Copiez ce texte et donnez-le à votre agent IA (DeepSeek, ChatGPT, etc.) pour qu’il trace son travail dans DevLedger.
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={copyToClipboard}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
          >
            {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            {copied ? 'Copié !' : 'Copier le prompt'}
          </button>
          <button
            onClick={downloadPrompt}
            className="flex items-center gap-2 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            <Download className="w-4 h-4" />
            Télécharger (.txt)
          </button>
        </div>
      </div>

      <div className="bg-gray-50 dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="bg-gray-100 dark:bg-gray-800 px-4 py-2 border-b border-gray-200 dark:border-gray-700 flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-red-500"></div>
          <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
          <div className="w-3 h-3 rounded-full bg-green-500"></div>
          <span className="text-sm text-gray-600 dark:text-gray-400 ml-2">prompt_ia.txt</span>
        </div>
        <pre className="p-6 text-sm text-gray-800 dark:text-gray-200 whitespace-pre-wrap font-mono overflow-x-auto max-h-[60vh]">
          {promptText}
        </pre>
      </div>

      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
        <h3 className="text-sm font-semibold text-blue-800 dark:text-blue-300 mb-2">📌 Instructions d'utilisation</h3>
        <ul className="text-sm text-blue-700 dark:text-blue-400 space-y-1 list-disc list-inside">
          <li>Copiez le prompt ci-dessus et envoyez-le à votre agent IA (DeepSeek, ChatGPT, etc.)</li>
          <li>L'IA répondra "✅ Prêt" quand elle aura compris</li>
          <li>Utilisez les commandes "ouvre une session" et "ferme la session" pendant votre travail</li>
          <li>À la fermeture, l'IA génère un rapport structuré à copier/coller dans DevLedger</li>
          <li>Si aucun bug n'est détecté, aucun rapport de bug n'est généré</li>
        </ul>
      </div>
    </div>
  );
}