import { useState } from 'react';
import { Info, Settings, FileText, Bug, ListTodo, Plus } from 'lucide-react';
import { ProjectLinks } from './ProjectLinks';
import { ProjectOptions } from './ProjectOptions';
import { ProjectShare } from './ProjectShare';
import { DevelopmentPlan } from './DevelopmentPlan';
import { SessionList } from '../sessions/SessionList';
import { BugList } from '../bugs/BugList';
import { useSubscription } from '../../contexts/SubscriptionContext';
import type { Project, ProjectShare as ProjectShareType, Session, BugReport } from '../../lib/database.types';

interface ProjectTabsProps {
  project: Project;
  projectId: string;
  isOwner: boolean;
  sharedUsers: ProjectShareType[];
  sessions: Session[];
  bugs: BugReport[];
  onAddInvite: (email: string, role: 'viewer' | 'editor') => Promise<void>;
  onRemoveInvite: (shareId: string) => Promise<void>;
  onUpdateRole: (shareId: string, role: 'viewer' | 'editor') => Promise<void>;
  onToggleBugsVisibility: (visible: boolean) => void;
  onToggleKpisVisibility: (visible: boolean | null) => void;
  onEditPlan: () => void;
  onEditSession: (session: Session) => void;
  onDeleteSession: (sessionId: string) => void;
  onAddSession: () => void;
  onEditBug: (bug: BugReport) => void;
  onDeleteBug: (bugId: string) => void;
  onAddBug: () => void;
  canEdit: boolean;
  onViewDetailsSession: (session: Session) => void;
  onViewDetailsBug: (bug: BugReport) => void;
  onNavigate?: (page: string) => void;
  isOwnerSubscriptionActive?: boolean; // NOUVEAU
}

type TabId = 'info' | 'sessions' | 'bugs' | 'plan' | 'config';

export function ProjectTabs({
  project,
  isOwner,
  sharedUsers,
  sessions,
  bugs,
  onAddInvite,
  onRemoveInvite,
  onUpdateRole,
  onToggleBugsVisibility,
  onToggleKpisVisibility,
  onEditPlan,
  onEditSession,
  onDeleteSession,
  onAddSession,
  onEditBug,
  onDeleteBug,
  onAddBug,
  canEdit,
  onViewDetailsSession,
  onViewDetailsBug,
  onNavigate,
  isOwnerSubscriptionActive = true
}: ProjectTabsProps) {
  const { isPro, isEnterprise } = useSubscription();
  // NOUVEAU - L'accès à la configuration nécessite un abonnement Pro ACTIF (non expiré)
  // Pour le propriétaire, il faut que l'abonnement soit actif
  // Pour l'invité, la config n'est jamais accessible (déjà géré par l'UI)
  const canAccessConfig = (isPro || isEnterprise) && isOwner && isOwnerSubscriptionActive;
  const [activeTab, setActiveTab] = useState<TabId>('sessions');

  const tabs = [
    { id: 'info' as TabId, label: '📋 Infos & Liens', icon: Info },
    { id: 'sessions' as TabId, label: '📊 Sessions', icon: ListTodo },
    { id: 'bugs' as TabId, label: '🐛 Bugs', icon: Bug },
    { id: 'plan' as TabId, label: '📄 Plan', icon: FileText },
    { id: 'config' as TabId, label: '⚙️ Configuration', icon: Settings }
  ];

  const visibility = project.visibility || 'private';
  const canViewBugs = isOwner || (visibility === 'shared' && project.bugs_visible) || (visibility === 'public' && project.bugs_visible);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
      {/* En-tête des onglets */}
      <div className="flex border-b border-gray-200 dark:border-gray-700 overflow-x-auto bg-gray-50 dark:bg-gray-900/50">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          // Désactiver l'onglet config si l'abonnement est expiré
          const isDisabled = tab.id === 'config' && !canAccessConfig;
          
          return (
            <button
              key={tab.id}
              onClick={() => !isDisabled && setActiveTab(tab.id)}
              className={`
                flex items-center gap-2 px-5 py-3 text-sm font-medium transition-all whitespace-nowrap
                ${isDisabled
                  ? 'opacity-50 cursor-not-allowed text-gray-400 dark:text-gray-500'
                  : isActive
                    ? 'border-b-2 border-blue-500 text-blue-600 dark:text-blue-400 bg-white dark:bg-gray-800 shadow-sm'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800'
                }
              `}
              disabled={isDisabled}
              title={isDisabled ? "Configuration disponible uniquement avec un abonnement Pro actif" : ""}
            >
              <Icon className={`w-4 h-4 ${isActive && !isDisabled ? 'text-blue-500' : ''}`} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Contenu de l'onglet actif */}
      <div className="p-6">
        {activeTab === 'info' && (
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">📋 Informations & Liens</h3>
            <ProjectLinks project={project} />
          </div>
        )}

        {activeTab === 'sessions' && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">📊 Sessions</h3>
              {canEdit && (
                <button
                  onClick={onAddSession}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  Ajouter une session
                </button>
              )}
            </div>
            <SessionList
              sessions={sessions}
              canEdit={canEdit}
              onEdit={onEditSession}
              onDelete={onDeleteSession}
              onAdd={onAddSession}
              onViewDetails={onViewDetailsSession}
            />
          </div>
        )}

        {activeTab === 'bugs' && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">🐛 Bugs</h3>
              {canViewBugs && canEdit && (
                <button
                  onClick={onAddBug}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  Signaler un bug
                </button>
              )}
            </div>
            {canViewBugs ? (
              <BugList
                bugs={bugs}
                onEdit={onEditBug}
                onDelete={onDeleteBug}
                onViewDetails={onViewDetailsBug}
                canEdit={canEdit}
                onAdd={onAddBug}
                showProjectName={false}
              />
            ) : (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                <Bug className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>Les rapports de bugs ne sont pas visibles pour ce projet.</p>
                <p className="text-sm mt-1">Le propriétaire n'a pas activé l'affichage des bugs.</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'plan' && (
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">📄 Plan de développement</h3>
            <DevelopmentPlan
              projectId={project.id}
              content={project.development_plan || null}
              updatedAt={project.plan_updated_at || null}
              isOwner={isOwner}
              onEdit={onEditPlan}
            />
          </div>
        )}

        {activeTab === 'config' && (
          <div className="space-y-6">
            {canAccessConfig ? (
              <>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">⚙️ Configuration</h3>
                <ProjectOptions
                  isOwner={isOwner}
                  bugsVisible={project.bugs_visible || false}
                  showKpis={project.show_kpis ?? null}
                  onToggleBugsVisibility={onToggleBugsVisibility}
                  onToggleKpisVisibility={onToggleKpisVisibility}
                />
                
                {visibility === 'shared' && (
                  <ProjectShare
                    projectId={project.id}
                    isOwner={isOwner}
                    sharedUsers={sharedUsers}
                    onAddInvite={onAddInvite}
                    onRemoveInvite={onRemoveInvite}
                    onUpdateRole={onUpdateRole}
                    isOwnerSubscriptionActive={isOwnerSubscriptionActive}
                  />
                )}

                {visibility !== 'shared' && isOwner && (
                  <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                    <Settings className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    <p>Les options de partage sont disponibles uniquement pour les projets "Partagés".</p>
                    <p className="text-sm mt-1">Passez la visibilité du projet en "Partagé" pour inviter des collaborateurs.</p>
                  </div>
                )}

                {!isOwner && visibility !== 'shared' && (
                  <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                    <Settings className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    <p>Vous n'avez pas les droits de configuration sur ce projet.</p>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-12 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                <Settings className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  Fonctionnalité disponible avec l'abonnement Pro
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-md mx-auto">
                  {!isOwnerSubscriptionActive 
                    ? "Votre abonnement Pro a expiré. Veuillez le renouveler pour accéder à la configuration."
                    : "La configuration des options du projet (invitations, partages, visibilité des KPIs) est accessible avec l'abonnement Pro."}
                </p>
                <button
                  onClick={() => onNavigate?.('subscription')}
                  className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                >
                  {!isOwnerSubscriptionActive ? "Renouveler l'abonnement" : "Passer à Pro"}
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}