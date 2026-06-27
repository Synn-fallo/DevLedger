import { ExternalLink, Github, Mail, Copy, Check, Link as LinkIcon } from 'lucide-react';
import { useState } from 'react';

interface ProjectLinksProps {
  project: any;
}

export function ProjectLinks({ project }: ProjectLinksProps) {
  const [copiedEmail, setCopiedEmail] = useState(false);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedEmail(true);
    setTimeout(() => setCopiedEmail(false), 2000);
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
      <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
        <LinkIcon className="w-5 h-5" />
        Liens et accès
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {(project.deploy_link || project.dev_link) && (
          <div className="col-span-2 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl p-4 border-2 border-blue-200 dark:border-blue-800">
            <div className="flex items-center gap-2 mb-2">
              <span className="px-3 py-1 bg-blue-600 text-white text-xs font-semibold rounded-full">🚀 PRODUCTION</span>
              <span className="text-sm text-gray-600 dark:text-gray-400">Lien principal</span>
            </div>
            <a href={project.deploy_link || project.dev_link} target="_blank" rel="noopener noreferrer" className="flex items-center justify-between p-3 bg-white dark:bg-gray-800 rounded-lg hover:shadow-md transition-all border border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-3 truncate">
                <ExternalLink className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0" />
                <span className="text-blue-600 dark:text-blue-400 font-medium truncate">{project.deploy_link || project.dev_link}</span>
              </div>
              <span className="text-sm text-gray-500 dark:text-gray-400">ouvrir →</span>
            </a>
          </div>
        )}

        {project.dev_link && project.dev_link !== project.deploy_link && (
          <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs font-semibold text-gray-600 dark:text-gray-400">💻 DÉVELOPPEMENT</span>
            </div>
            <a href={project.dev_link} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-blue-600 dark:text-blue-400 hover:underline truncate">
              <LinkIcon className="w-4 h-4 flex-shrink-0" />
              <span className="truncate">{project.dev_link}</span>
            </a>
          </div>
        )}

        {project.github_link && (
          <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs font-semibold text-gray-600 dark:text-gray-400">📂 CODE SOURCE</span>
            </div>
            <a href={project.github_link} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 truncate">
              <Github className="w-4 h-4 flex-shrink-0" />
              <span className="truncate">{project.github_link}</span>
            </a>
          </div>
        )}

        {project.dev_account && (
          <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg md:col-span-2">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs font-semibold text-gray-600 dark:text-gray-400">🔑 COMPTE DE DÉVELOPPEMENT</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                <span className="text-gray-700 dark:text-gray-300">{project.dev_account}</span>
              </div>
              <button onClick={() => copyToClipboard(project.dev_account || '')} className="flex items-center gap-1 px-3 py-1 text-sm bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-gray-700 dark:text-gray-300">
                {copiedEmail ? <><Check className="w-4 h-4 text-green-600 dark:text-green-400" /><span>Copié !</span></> : <><Copy className="w-4 h-4" /><span>Copier</span></>}
              </button>
            </div>
          </div>
        )}

        {project.old_access_link && (
          <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg md:col-span-2">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs font-semibold text-gray-600 dark:text-gray-400">📌 ANCIEN LIEN</span>
            </div>
            <a href={project.old_access_link} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 truncate">
              <LinkIcon className="w-4 h-4 flex-shrink-0" />
              <span className="truncate">{project.old_access_link}</span>
            </a>
          </div>
        )}
      </div>

      <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${project.db_connected ? 'bg-green-500' : 'bg-gray-400 dark:bg-gray-600'}`} />
          <span className="text-sm text-gray-600 dark:text-gray-400">Base de données: {project.db_connected ? 'Connectée' : 'Non connectée'}</span>
        </div>
      </div>
    </div>
  );
}