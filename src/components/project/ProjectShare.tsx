import { useState } from 'react';
import { Users, UserPlus, X } from 'lucide-react';
import { useCollaboratorLimit } from '../../hooks/useCollaboratorLimit';

interface ProjectShareProps {
  projectId: string;
  isOwner: boolean;
  sharedUsers: any[];
  onAddInvite: (email: string, role: 'viewer' | 'editor') => Promise<void>;
  onRemoveInvite: (shareId: string) => Promise<void>;
  onUpdateRole: (shareId: string, role: 'viewer' | 'editor') => Promise<void>;
  isOwnerSubscriptionActive?: boolean; // NOUVEAU
}

export function ProjectShare({ 
  projectId, 
  isOwner, 
  sharedUsers, 
  onAddInvite, 
  onRemoveInvite, 
  onUpdateRole, 
  isOwnerSubscriptionActive = true 
}: ProjectShareProps) {
  const [showShareModal, setShowShareModal] = useState(false);
  const [newInviteEmail, setNewInviteEmail] = useState('');
  const [newInviteRole, setNewInviteRole] = useState<'viewer' | 'editor'>('viewer');
  const [addingInvite, setAddingInvite] = useState(false);
  const { canAdd, remaining, limit, isUnlimited } = useCollaboratorLimit(projectId);

  // NOUVEAU - Vérifier si l'invitation est autorisée
  const canInvite = isOwner && isOwnerSubscriptionActive;

  const handleAddInvite = async () => {
    if (!newInviteEmail.trim()) return;
    setAddingInvite(true);
    await onAddInvite(newInviteEmail.trim(), newInviteRole);
    setNewInviteEmail('');
    setNewInviteRole('viewer');
    setAddingInvite(false);
  };

  if (!isOwner) return null;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <Users className="w-5 h-5" />
          Utilisateurs invités
        </h2>
        <button
          onClick={() => {
            if (!canInvite) {
              if (!isOwnerSubscriptionActive) {
                alert("Votre abonnement a expiré. Veuillez renouveler votre abonnement pour inviter de nouveaux collaborateurs.");
              } else if (!canAdd) {
                alert(`Limite atteinte (${limit} collaborateurs maximum). Passez à Pro pour ajouter plus de collaborateurs.`);
              }
              return;
            }
            setShowShareModal(!showShareModal);
          }}
          className={`flex items-center gap-2 px-3 py-1.5 text-sm rounded-lg transition-colors ${
            canInvite && canAdd
              ? 'bg-blue-600 text-white hover:bg-blue-700'
              : 'bg-gray-300 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed'
          }`}
          disabled={!canInvite || !canAdd}
        >
          <UserPlus className="w-4 h-4" />
          Inviter
        </button>
      </div>

      {showShareModal && (
        <div className="mb-4 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
          <div className="flex gap-2">
            <input type="email" value={newInviteEmail} onChange={(e) => setNewInviteEmail(e.target.value)} placeholder="email@exemple.com" className="flex-1 px-4 py-2 border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white" />
            <select value={newInviteRole} onChange={(e) => setNewInviteRole(e.target.value as 'viewer' | 'editor')} className="px-4 py-2 border rounded-lg bg-white dark:bg-gray-700">
              <option value="viewer">👁️ Lecteur</option>
              <option value="editor">✏️ Éditeur</option>
            </select>
            <button onClick={handleAddInvite} disabled={addingInvite || !newInviteEmail.trim()} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50">Inviter</button>
            <button onClick={() => setShowShareModal(false)} className="px-4 py-2 border rounded-lg">Annuler</button>
          </div>
        </div>
      )}

      <div className="space-y-2">
        {sharedUsers.map((share) => (
          <div key={share.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
            <div className="flex-1">
              <span className="text-gray-700 dark:text-gray-300">{share.invited_email}</span>
              <span className={`ml-3 text-xs px-2 py-0.5 rounded-full ${share.role === 'editor' ? 'bg-blue-100 text-blue-700' : 'bg-gray-200 text-gray-600'}`}>
                {share.role === 'editor' ? '✏️ Éditeur' : '👁️ Lecteur'}
              </span>
            </div>
            <div className="flex gap-2">
              <select value={share.role} onChange={(e) => onUpdateRole(share.id, e.target.value as 'viewer' | 'editor')} className="px-2 py-1 text-sm border rounded bg-white dark:bg-gray-700">
                <option value="viewer">Lecteur</option>
                <option value="editor">Éditeur</option>
              </select>
              <button onClick={() => onRemoveInvite(share.id)} className="p-1 text-red-600 hover:bg-red-50 rounded"><X className="w-4 h-4" /></button>
            </div>
          </div>
        ))}
        {sharedUsers.length === 0 && <p className="text-center text-gray-500 py-4">Aucun invité pour le moment</p>}
      </div>
    </div>
  );
}