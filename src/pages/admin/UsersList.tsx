import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, Zap, RefreshCw } from 'lucide-react';
import { AdminLayout } from '../../components/admin/AdminLayout';
import { DataTable } from '../../components/admin/DataTable';
import { supabase } from '../../lib/supabase';
import { billingService } from '../../services/admin/billing.service';

interface User {
  id: string;
  email: string;
  subscription_plan: string;
  subscription_ends_at: string | null;
  is_admin: boolean;
  created_at: string;
  projects_count: number;
  sessions_count: number;
}

interface UsersListProps {
  currentPage?: string;
  onNavigate?: (page: string, id?: string) => void;
}

export function UsersList({ currentPage, onNavigate }: UsersListProps) {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionInProgress, setActionInProgress] = useState<string | null>(null);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    setLoading(true);
    
    const { data, error } = await supabase
      .from('admin_users_stats')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error loading users:', error);
    } else if (data) {
      setUsers(data as User[]);
    }
    
    setLoading(false);
  };

  const handleViewUser = (userId: string) => {
    if (onNavigate) {
      onNavigate('admin_user_detail', userId);
    }
  };

  // NOUVEAU - Action rapide pour passer à Pro
  const handleQuickUpgradeToPro = async (userId: string, userEmail: string) => {
    if (!confirm(`Passer l'utilisateur ${userEmail} au plan Pro ?\n\nL'abonnement sera actif pour 30 jours.`)) {
      return;
    }
    
    setActionInProgress(userId);
    const result = await billingService.setUserPlan(userId, 'pro');
    
    if (result.success) {
      // Recharger la liste
      await loadUsers();
    } else {
      alert(`Erreur : ${result.error}`);
    }
    
    setActionInProgress(null);
  };

  // NOUVEAU - Vérifier si un abonnement Pro est expiré
  const isProExpired = (user: User): boolean => {
    if (user.subscription_plan !== 'pro') return false;
    if (!user.subscription_ends_at) return true;
    return new Date(user.subscription_ends_at) < new Date();
  };

  const planLabels: Record<string, string> = {
    free: 'Freemium',
    pro: 'Pro',
    enterprise: 'Enterprise'
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('fr-FR');
  };

  const formatEndDate = (date: string | null) => {
    if (!date) return '—';
    const endDate = new Date(date);
    const now = new Date();
    const isExpired = endDate < now;
    return isExpired ? `Expiré le ${formatDate(date)}` : `Jusqu'au ${formatDate(date)}`;
  };

  const columns = [
    { key: 'email' as const, header: 'Email', sortable: true },
    { key: 'subscription_plan' as const, header: 'Plan', sortable: true },
    { key: 'subscription_ends_at' as const, header: 'Expiration', sortable: true },
    { key: 'projects_count' as const, header: 'Projets', sortable: true },
    { key: 'sessions_count' as const, header: 'Sessions', sortable: true },
    { key: 'created_at' as const, header: 'Inscrit le', sortable: true },
    { key: 'is_admin' as const, header: 'Admin', sortable: true },
    { key: 'actions' as const, header: 'Actions', sortable: false }
  ];

  if (loading) {
    return (
      <AdminLayout title="Utilisateurs" currentPage={currentPage} onNavigate={onNavigate}>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Utilisateurs" currentPage={currentPage} onNavigate={onNavigate}>
      <DataTable
        data={users}
        columns={columns.map(col => ({
          ...col,
          render: (value: any, row: User) => {
            if (col.key === 'subscription_plan') {
              const expired = isProExpired(row);
              return (
                <span className={`font-medium ${expired ? 'text-red-600 dark:text-red-400' : ''}`}>
                  {planLabels[value] || value}
                  {expired && ' (Expiré)'}
                </span>
              );
            }
            if (col.key === 'subscription_ends_at') {
              return <span className="text-sm">{formatEndDate(value)}</span>;
            }
            if (col.key === 'created_at') {
              return formatDate(value);
            }
            if (col.key === 'is_admin') {
              return value ? '✅ Oui' : '❌ Non';
            }
            if (col.key === 'actions') {
              // Afficher le bouton "Passer à Pro" uniquement si l'utilisateur n'est pas déjà Pro actif
              const isAlreadyProActive = row.subscription_plan === 'pro' && !isProExpired(row);
              return (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleViewUser(row.id)}
                    className="p-1 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                    title="Voir détails"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                  {!isAlreadyProActive && row.subscription_plan !== 'enterprise' && (
                    <button
                      onClick={() => handleQuickUpgradeToPro(row.id, row.email)}
                      disabled={actionInProgress === row.id}
                      className="p-1 text-green-600 hover:bg-green-50 rounded transition-colors disabled:opacity-50"
                      title="Passer à Pro"
                    >
                      {actionInProgress === row.id ? (
                        <RefreshCw className="w-4 h-4 animate-spin" />
                      ) : (
                        <Zap className="w-4 h-4" />
                      )}
                    </button>
                  )}
                </div>
              );
            }
            return value;
          }
        }))}
        onRowClick={(row) => handleViewUser(row.id)}
        searchPlaceholder="Rechercher par email..."
        searchFields={['email']}
      />
    </AdminLayout>
  );
}