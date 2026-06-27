import { useEffect, useState } from 'react';
import { Clock, Zap, Plus, Users, HelpCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { useSettings } from '../contexts/SettingsContext';
import { useSubscription } from '../contexts/SubscriptionContext';
import { useProjectOwnerSubscription } from '../hooks/useProjectOwnerSubscription'; // NOUVEAU
import { ProjectHeader } from '../components/project/ProjectHeader';
import { ProjectKPIs } from '../components/project/ProjectKPIs';
import { ProjectNotFound } from '../components/project/ProjectNotFound';
import { ProjectEditModal } from '../components/project/ProjectEditModal';
import { ProjectTabs } from '../components/project/ProjectTabs';
import { SessionModal } from '../components/sessions/SessionModal';
import { BugForm } from '../components/bugs/BugForm';
import { bugService } from '../services/bug.service';
import { DevelopmentPlanEditor } from '../components/project/DevelopmentPlanEditor';
import { SessionDetailModal } from '../components/sessions/SessionDetailModal';
import { BugDetailModal } from '../components/bugs/BugDetailModal';
import { logService } from '../services/log.service';
import { TechnicalHelpRequest } from '../components/project/TechnicalHelpRequest';
import { SubscriptionExpiredMessage } from '../components/common/SubscriptionExpiredMessage'; // NOUVEAU
import type { Project, Session, ProjectShare as ProjectShareType, BugReport } from '../lib/database.types';

interface ProjectDetailProps {
  projectId: string;
  onNavigate: (page: string) => void;
}

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

export function ProjectDetail({ projectId, onNavigate }: ProjectDetailProps) {
  const { user } = useAuth();
  const { settings } = useSettings();
  const { isPro, isEnterprise } = useSubscription();
  const canAccessProFeatures = isPro || isEnterprise;
  const [project, setProject] = useState<Project | null>(null);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [sharedUsers, setSharedUsers] = useState<ProjectShareType[]>([]);
  const [bugs, setBugs] = useState<BugReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [showSessionModal, setShowSessionModal] = useState(false);
  const [showEditSessionModal, setShowEditSessionModal] = useState(false);
  const [showEditProjectModal, setShowEditProjectModal] = useState(false);
  const [showPlanEditor, setShowPlanEditor] = useState(false);
  const [showBugForm, setShowBugForm] = useState(false);
  const [editingSession, setEditingSession] = useState<Session | null>(null);
  const [editingBug, setEditingBug] = useState<BugReport | null>(null);
  const [updatingVisibility, setUpdatingVisibility] = useState(false);
  const [isOwner, setIsOwner] = useState(false);
  const [userRole, setUserRole] = useState<'viewer' | 'editor' | null>(null);
  const [viewingSession, setViewingSession] = useState<Session | null>(null);
  const [viewingBug, setViewingBug] = useState<BugReport | null>(null);
  const [effectiveShowKpis, setEffectiveShowKpis] = useState(true);
  const [showTechnicalHelpModal, setShowTechnicalHelpModal] = useState(false);
  const [technicalHelpRequests, setTechnicalHelpRequests] = useState<any[]>([]);

  // NOUVEAU - Vérifier l'abonnement du propriétaire
  const ownerId = project?.user_id;
  const { isActive: isOwnerSubscriptionActive, loading: ownerSubscriptionLoading } = useProjectOwnerSubscription(ownerId);

  const [sessionForm, setSessionForm] = useState<SessionFormData>({
    date: new Date().toISOString().split('T')[0],
    title: '',
    activities_summary: '',
    general_observation: '',
    time_bolt: 0,
    time_chatgpt: 0,
    time_deepseek: 0,
    time_other: 0,
    other_tool_name: '',
    tokens_consumed: 0,
    deployment_status: 'nok',
    observations: ''
  });

  useEffect(() => {
    loadProject();
    loadSessions();
    loadSharedUsers();
    loadBugs();
  }, [projectId, user]);

  // ==================== CHARGEMENT DES DONNÉES ====================
  const loadProject = async () => {
    if (!user) return;

    const { data: projectData, error } = await supabase
      .from('projects')
      .select('*')
      .eq('id', projectId)
      .maybeSingle();

    if (error || !projectData) {
      onNavigate('projects');
      return;
    }

    const isProjectOwner = projectData.user_id === user.id;
    let isInvited = false;
    let invitedRole: 'viewer' | 'editor' | null = null;

    if (projectData.visibility === 'shared' && !isProjectOwner) {
      const { data: share } = await supabase
        .from('project_shares')
        .select('role')
        .eq('project_id', projectId)
        .eq('invited_email', user.email)
        .maybeSingle();
      if (share) {
        isInvited = true;
        invitedRole = share.role as 'viewer' | 'editor';
      }
    }

    if ((projectData.visibility === 'private' && !isProjectOwner) ||
        (projectData.visibility === 'shared' && !isProjectOwner && !isInvited)) {
      onNavigate('projects');
      return;
    }

    setProject(projectData);
    setIsOwner(isProjectOwner);
    if (invitedRole) setUserRole(invitedRole);
    
    // Calculer l'affichage effectif des KPIs
    const projectShowKpis = projectData.show_kpis;
    const globalShowKpis = settings?.show_kpis ?? true;
    const shouldShowKpis = projectShowKpis !== null ? projectShowKpis : globalShowKpis;
    setEffectiveShowKpis(shouldShowKpis);
    
    // Charger les appels à solution technique
    if (isProjectOwner) {
      const { data: helpRequests } = await supabase
        .from('technical_help_requests')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: false });
      if (helpRequests) setTechnicalHelpRequests(helpRequests);
    }
    
    setLoading(false);
  };

  const loadSessions = async () => {
    const { data } = await supabase
      .from('sessions')
      .select('*')
      .eq('project_id', projectId)
      .order('date', { ascending: false });
    if (data) setSessions(data);
  };

  const loadSharedUsers = async () => {
    if (!projectId) return;
    const { data } = await supabase
      .from('project_shares')
      .select('*')
      .eq('project_id', projectId);
    if (data) setSharedUsers(data);
  };

  const loadBugs = async () => {
    const bugsData = await bugService.getBugsByProject(projectId);
    setBugs(bugsData);
  };

  // ==================== MÉTIERS ====================
  const handleUpdateProject = async (formData: any) => {
    const { error } = await supabase
      .from('projects')
      .update({
        name: formData.name,
        description: formData.description,
        status: formData.status,
        deploy_link: formData.deploy_link || null,
        dev_link: formData.dev_link || null,
        github_link: formData.github_link || null,
        dev_account: formData.dev_account || null,
        db_connected: formData.db_connected
      })
      .eq('id', projectId);

    if (!error) {
      await logService.add('project_update', 'project', projectId, { changes: formData });
      loadProject();
    }
  };

  const updateVisibility = async (newVisibility: 'private' | 'shared' | 'public') => {
    if (!project) return;
    setUpdatingVisibility(true);
    const { error } = await supabase
      .from('projects')
      .update({ visibility: newVisibility })
      .eq('id', project.id);
    if (!error) {
      await logService.add('visibility_update', 'project', project.id, { visibility: newVisibility });
      setProject({ ...project, visibility: newVisibility });
    }
    setUpdatingVisibility(false);
  };

  const updateDevelopmentPlan = async (content: string) => {
    if (!project) return;
    const { error } = await supabase
      .from('projects')
      .update({
        development_plan: content,
        plan_updated_at: new Date().toISOString()
      })
      .eq('id', project.id);
    if (!error) {
      await logService.add('plan_update', 'project', project.id);
      setProject({ ...project, development_plan: content, plan_updated_at: new Date().toISOString() });
    }
  };

  const updateBugsVisibility = async (visible: boolean) => {
    if (!project) return;
    const { error } = await supabase
      .from('projects')
      .update({ bugs_visible: visible })
      .eq('id', project.id);
    if (!error) setProject({ ...project, bugs_visible: visible });
  };

  const updateKpisVisibility = async (visible: boolean | null) => {
    if (!project) return;
    
    const { error } = await supabase
      .from('projects')
      .update({ show_kpis: visible })
      .eq('id', project.id);
    
    if (!error) {
      setProject({ ...project, show_kpis: visible });
      // Recalculer l'affichage effectif
      const globalShowKpis = settings?.show_kpis ?? true;
      setEffectiveShowKpis(visible !== null ? visible : globalShowKpis);
    }
  };

  const addSharedUser = async (email: string, role: 'viewer' | 'editor') => {
    if (!project || !isOwner) return;
    await supabase
      .from('project_shares')
      .insert({
        project_id: project.id,
        invited_email: email,
        role,
        user_id: user?.id
      });
    loadSharedUsers();
  };

  const removeSharedUser = async (shareId: string) => {
    if (!isOwner) return;
    await supabase.from('project_shares').delete().eq('id', shareId);
    loadSharedUsers();
  };

  const updateSharedUserRole = async (shareId: string, newRole: 'viewer' | 'editor') => {
    if (!isOwner) return;
    await supabase.from('project_shares').update({ role: newRole }).eq('id', shareId);
    loadSharedUsers();
  };

  // ==================== SESSIONS ====================
  const handleAddSession = async (e: React.FormEvent) => {
    e.preventDefault();
    const { data, error } = await supabase.from('sessions').insert({
      project_id: projectId,
      date: sessionForm.date,
      title: sessionForm.title || null,
      activities_summary: sessionForm.activities_summary || null,
      general_observation: sessionForm.general_observation || null,
      time_bolt: sessionForm.time_bolt,
      time_chatgpt: sessionForm.time_chatgpt,
      time_deepseek: sessionForm.time_deepseek,
      time_other: sessionForm.time_other,
      other_tool_name: sessionForm.other_tool_name,
      tokens_consumed: sessionForm.tokens_consumed,
      deployment_status: sessionForm.deployment_status,
      observations: sessionForm.observations
    }).select();

    if (!error && data && data.length > 0) {
      await logService.add('session_create', 'session', data[0].id);
      setShowSessionModal(false);
      resetSessionForm();
      loadSessions();
    }
  };

  const handleEditSession = (session: Session) => {
    setEditingSession(session);
    setSessionForm({
      date: session.date,
      title: (session as any).title || '',
      activities_summary: (session as any).activities_summary || '',
      general_observation: (session as any).general_observation || '',
      time_bolt: session.time_bolt,
      time_chatgpt: session.time_chatgpt,
      time_deepseek: (session as any).time_deepseek || 0,
      time_other: session.time_other,
      other_tool_name: session.other_tool_name || '',
      tokens_consumed: session.tokens_consumed,
      deployment_status: session.deployment_status,
      observations: session.observations || ''
    });
    setShowEditSessionModal(true);
  };

  const handleUpdateSession = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSession) return;
    const { error } = await supabase
      .from('sessions')
      .update({
        date: sessionForm.date,
        title: sessionForm.title || null,
        activities_summary: sessionForm.activities_summary || null,
        general_observation: sessionForm.general_observation || null,
        time_bolt: sessionForm.time_bolt,
        time_chatgpt: sessionForm.time_chatgpt,
        time_deepseek: sessionForm.time_deepseek,
        time_other: sessionForm.time_other,
        other_tool_name: sessionForm.other_tool_name,
        tokens_consumed: sessionForm.tokens_consumed,
        deployment_status: sessionForm.deployment_status,
        observations: sessionForm.observations,
        updated_at: new Date()
      })
      .eq('id', editingSession.id);

    if (!error) {
      await logService.add('session_update', 'session', editingSession.id);
      setShowEditSessionModal(false);
      setEditingSession(null);
      resetSessionForm();
      loadSessions();
    }
  };

  const handleDeleteSession = async (sessionId: string) => {
    if (!confirm('Supprimer cette session ?')) return;
    await supabase.from('sessions').delete().eq('id', sessionId);
    await logService.add('session_delete', 'session', sessionId);
    loadSessions();
  };

  const resetSessionForm = () => {
    setSessionForm({
      date: new Date().toISOString().split('T')[0],
      title: '',
      activities_summary: '',
      general_observation: '',
      time_bolt: 0,
      time_chatgpt: 0,
      time_deepseek: 0,
      time_other: 0,
      other_tool_name: '',
      tokens_consumed: 0,
      deployment_status: 'nok',
      observations: ''
    });
  };

  const handleViewSessionDetails = (session: Session) => {
    setViewingSession(session);
  };

  const handleViewBugDetails = (bug: BugReport) => {
    setViewingBug(bug);
  };

  // ==================== BUGS ====================
  const handleCreateBug = async (data: any) => {
    await bugService.createBug(data);
    setShowBugForm(false);
    loadBugs();
  };

  const handleUpdateBug = async (data: any) => {
    if (editingBug) {
      await bugService.updateBug(editingBug.id, data);
      setEditingBug(null);
      loadBugs();
    }
  };

  const handleDeleteBug = async (bugId: string) => {
    if (confirm('Supprimer ce rapport de bug ?')) {
      await bugService.deleteBug(bugId);
      loadBugs();
    }
  };

  const handleEditBug = (bug: BugReport) => {
    setEditingBug(bug);
    setShowBugForm(true);
  };

  // ==================== CALCULS ====================
  const calculateTotals = () => {
    const totalTime = sessions.reduce((sum, s) =>
      sum + s.time_bolt + s.time_chatgpt + (s as any).time_deepseek + s.time_other, 0);
    const totalTokens = sessions.reduce((sum, s) => sum + s.tokens_consumed, 0);
    const hourlyRate = settings?.hourly_rate || 0;
    const tokenPrice = settings?.token_price || 0;
    const totalValue = (totalTime / 60 * hourlyRate) + (totalTokens * tokenPrice);
    return { totalTime, totalTokens, totalValue };
  };

  const { totalTime, totalTokens, totalValue } = calculateTotals();

  const formatTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  // MODIFIÉ - canEdit prend maintenant en compte l'abonnement actif du propriétaire
  const canEdit = () => {
    if (!user || !project) return false;
    if (project.user_id === user.id) return true;
    // Pour les invités : vérifier que le propriétaire a un abonnement actif
    if (!isOwnerSubscriptionActive) return false;
    return userRole === 'editor';
  };

  if (loading || ownerSubscriptionLoading) return <div className="flex items-center justify-center h-full"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div></div>;
  if (!project) return <ProjectNotFound onNavigate={onNavigate} />;

  // NOUVEAU - Si l'utilisateur est invité et que l'abonnement du propriétaire est expiré
  if (!isOwner && !isOwnerSubscriptionActive) {
    return <SubscriptionExpiredMessage />;
  }

  const visibility = project.visibility || 'private';

  return (
    <div className="p-6 space-y-6">
      <ProjectHeader
        project={project}
        visibility={visibility}
        isOwner={isOwner}
        userRole={userRole}
        updatingVisibility={updatingVisibility}
        onUpdateVisibility={updateVisibility}
        onEditProject={() => setShowEditProjectModal(true)}
        onNavigate={onNavigate}
        isOwnerSubscriptionActive={isOwnerSubscriptionActive} // NOUVEAU
      />

      <ProjectKPIs
        totalTime={totalTime}
        totalTokens={totalTokens}
        totalValue={totalValue}
        currency={settings?.currency || 'XOF'}
        formatTime={formatTime}
        showKpis={effectiveShowKpis}
        visibility={visibility}
      />

      <ProjectTabs
        project={project}
        projectId={project.id}
        isOwner={isOwner}
        sharedUsers={sharedUsers}
        sessions={sessions}
        bugs={bugs}
        onAddInvite={addSharedUser}
        onRemoveInvite={removeSharedUser}
        onUpdateRole={updateSharedUserRole}
        onToggleBugsVisibility={updateBugsVisibility}
        onToggleKpisVisibility={updateKpisVisibility}
        onEditPlan={() => setShowPlanEditor(true)}
        onEditSession={handleEditSession}
        onDeleteSession={handleDeleteSession}
        onAddSession={() => setShowSessionModal(true)}
        onEditBug={handleEditBug}
        onDeleteBug={handleDeleteBug}
        onAddBug={() => setShowBugForm(true)}
        canEdit={canEdit()}
        onViewDetailsSession={handleViewSessionDetails}
        onViewDetailsBug={handleViewBugDetails}
        isOwnerSubscriptionActive={isOwnerSubscriptionActive} // NOUVEAU
      />

      {/* Mode Avancé - uniquement pour Pro/Enterprise */}
      {canAccessProFeatures && (
        <button>Mode Avancé</button>
      )}

      {/* Section Appels à solution technique (visible uniquement pour le propriétaire) */}
      {isOwner && (
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 mt-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <HelpCircle className="w-5 h-5 text-purple-500" />
              Appels à solution technique
            </h2>
            <button
              onClick={() => setShowTechnicalHelpModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
            >
              <HelpCircle className="w-4 h-4" />
              Nouvel appel
            </button>
          </div>
          
          {technicalHelpRequests.length === 0 ? (
            <p className="text-center text-gray-500 py-4">
              Aucun appel à solution pour le moment.
            </p>
          ) : (
            <div className="space-y-3">
              {technicalHelpRequests.slice(0, 3).map((request) => (
                <div key={request.id} className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">{request.title}</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 line-clamp-2">
                        {request.description}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        {new Date(request.created_at).toLocaleDateString('fr-FR')}
                      </p>
                    </div>
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      request.status === 'open' 
                        ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300'
                        : request.status === 'in_progress'
                        ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300'
                        : 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300'
                    }`}>
                      {request.status === 'open' ? 'Ouvert' : request.status === 'in_progress' ? 'En cours' : 'Résolu'}
                    </span>
                  </div>
                </div>
              ))}
              {technicalHelpRequests.length > 3 && (
                <button
                  onClick={() => window.open('/technical-help', '_blank')}
                  className="text-sm text-purple-600 hover:underline mt-2"
                >
                  Voir tous les appels ({technicalHelpRequests.length})
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {/* Modales */}
      <ProjectEditModal
        project={project}
        isOpen={showEditProjectModal}
        onClose={() => setShowEditProjectModal(false)}
        onSave={handleUpdateProject}
      />

      {showSessionModal && (
        <SessionModal
          title="Nouvelle Session"
          sessionForm={sessionForm}
          setSessionForm={setSessionForm}
          onClose={() => { setShowSessionModal(false); resetSessionForm(); }}
          onSubmit={handleAddSession}
        />
      )}

      {showEditSessionModal && editingSession && (
        <SessionModal
          title="Modifier la Session"
          sessionForm={sessionForm}
          setSessionForm={setSessionForm}
          onClose={() => { setShowEditSessionModal(false); setEditingSession(null); resetSessionForm(); }}
          onSubmit={handleUpdateSession}
        />
      )}

      {showBugForm && (
        <BugForm
          bug={editingBug}
          projectId={projectId}
          onClose={() => {
            setShowBugForm(false);
            setEditingBug(null);
          }}
          onSave={editingBug ? handleUpdateBug : handleCreateBug}
        />
      )}

      {showPlanEditor && (
        <DevelopmentPlanEditor
          projectId={project.id}
          initialContent={project.development_plan || null}
          onSave={updateDevelopmentPlan}
          onClose={() => setShowPlanEditor(false)}
        />
      )}

      {/* Modale de consultation d'une session */}
      {viewingSession && (
        <SessionDetailModal
          session={viewingSession}
          onClose={() => setViewingSession(null)}
          onEdit={() => {
            setViewingSession(null);
            handleEditSession(viewingSession);
          }}
        />
      )}

      {/* Modale de consultation d'un bug */}
      {viewingBug && (
        <BugDetailModal
          bug={viewingBug}
          projectName={project.name}
          onClose={() => setViewingBug(null)}
          onEdit={() => {
            setViewingBug(null);
            handleEditBug(viewingBug);
          }}
        />
      )}

      {/* Modale de création d'appel à solution */}
      {showTechnicalHelpModal && (
        <TechnicalHelpRequest
          projectId={projectId}
          onClose={() => setShowTechnicalHelpModal(false)}
          onSuccess={() => {
            // Recharger les appels
            const loadHelpRequests = async () => {
              const { data } = await supabase
                .from('technical_help_requests')
                .select('*')
                .eq('project_id', projectId)
                .order('created_at', { ascending: false });
              if (data) setTechnicalHelpRequests(data);
            };
            loadHelpRequests();
          }}
        />
      )}
    </div>
  );
}