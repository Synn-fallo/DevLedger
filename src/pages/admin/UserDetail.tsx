import { useEffect, useState } from 'react';
import { ArrowLeft, User, Mail, Calendar, FolderKanban, Clock, CreditCard, Shield, AlertCircle } from 'lucide-react';
import { AdminLayout } from '../../components/admin/AdminLayout';
import { supabase } from '../../lib/supabase';
import { billingService } from '../../services/admin/billing.service';

interface UserDetailProps {
  userId?: string;
  currentPage?: string;
  onNavigate?: (page: string, id?: string) => void;
}

interface UserData {
  id: string;
  email: string;
  subscription_plan: string;
  subscription_ends_at: string | null;
  projects_limit: number | null;
  collaborators_limit: number | null;
  is_admin: boolean;
  created_at: string;
  projects_count: number;
  sessions_count: number;
}

export function UserDetail({ userId, currentPage, onNavigate }: UserDetailProps) {
  const [user, setUser] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [extendDays, setExtendDays] = useState(30);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    if (userId) {
      loadUser();
    }
  }, [userId]);

  const loadUser = async () => {
    if (!userId) return;
    setLoading(true);
    setMessage(null);

    try {
      // 1. Charger les données de base depuis la vue admin_users_stats
      const { data: statsData, error: statsError } = await supabase
        .from('admin_users_stats')
        .select('*')
        .eq('id', userId)
        .single();

      if (statsError) {
        console.error('Error loading user stats:', statsError);
        setLoading(false);
        return;
      }

      // 2. Charger les données d'abonnement directement depuis users_settings
      // Utilisation de maybeSingle() pour éviter l'erreur 406 si RLS bloque
      const { data: settingsData, error: settingsError } = await supabase
        .from('users_settings')
        .select('subscription_plan, subscription_ends_at, projects_limit, collaborators_limit, is_admin')
        .eq('id', userId)
        .maybeSingle();

      if (settingsError) {
        console.error('Error loading user settings:', settingsError);
        // Ne pas bloquer - on continue avec les données de la vue
      }

      // 3. Fusionner les données
      const mergedUser: UserData = {
        id: statsData.id,
        email: statsData.email,
        created_at: statsData.created_at,
        projects_count: statsData.projects_count,
        sessions_count: statsData.sessions_count,
        subscription_plan: settingsData?.subscription_plan || statsData.subscription_plan || 'free',
        subscription_ends_at: settingsData?.subscription_ends_at || null,
        projects_limit: settingsData?.projects_limit ?? null,
        collaborators_limit: settingsData?.collaborators_limit ?? null,
        is_admin: settingsData?.is_admin ?? statsData.is_admin ?? false
      };

      setUser(mergedUser);
    } catch (err) {
      console.error('Unexpected error loading user:', err);
    } finally {
      setLoading(false);
    }
  };

  const updatePlan = async (plan: string) => {
    if (!userId) return;
    setUpdating(true);
    setMessage(null);
    
    try {
      console.log('Appel à setUserPlan avec:', { userId, plan });
      const result = await billingService.setUserPlan(userId, plan as 'free' | 'pro' | 'enterprise');
      console.log('Résultat:', result);
      
      if (result.success) {
        setMessage({ 
          type: 'success', 
          text: `Plan ${plan === 'free' ? 'Freemium' : plan === 'pro' ? 'Pro' : 'Enterprise'} activé avec succès` 
        });
        await loadUser(); // Recharger les données
      } else {
        setMessage({ 
          type: 'error', 
          text: result.error || 'Erreur lors de la mise à jour. Vérifiez les droits admin.' 
        });
      }
    } catch (err) {
      console.error('Update plan error:', err);
      setMessage({ 
        type: 'error', 
        text: err instanceof Error ? err.message : 'Erreur inconnue lors de la mise à jour' 
      });
    } finally {
      setUpdating(false);
    }
  };

  const handleExtendSubscription = async () => {
    if (!userId) return;
    setUpdating(true);
    setMessage(null);
    
    try {
      const result = await billingService.extendProSubscription(userId, extendDays);
      
      if (result.success) {
        setMessage({ type: 'success', text: `Abonnement prolongé de ${extendDays} jours` });
        await loadUser();
      } else {
        setMessage({ type: 'error', text: result.error || 'Erreur lors de la prolongation' });
      }
    } catch (err) {
      console.error('Extend subscription error:', err);
      setMessage({ type: 'error', text: 'Erreur lors de la prolongation' });
    } finally {
      setUpdating(false);
    }
  };

  const toggleAdmin = async () => {
    if (!userId) return;
    setUpdating(true);
    setMessage(null);
    
    try {
      const { error } = await supabase
        .from('users_settings')
        .update({ is_admin: !user?.is_admin })
        .eq('id', userId);
      
      if (!error) {
        setUser(prev => prev ? { ...prev, is_admin: !prev.is_admin } : null);
        setMessage({ type: 'success', text: `Droits admin ${!user?.is_admin ? 'ajoutés' : 'retirés'}` });
      } else {
        setMessage({ type: 'error', text: error.message });
      }
    } catch (err) {
      console.error('Toggle admin error:', err);
      setMessage({ type: 'error', text: 'Erreur lors de la modification des droits admin' });
    } finally {
      setUpdating(false);
    }
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatEndDate = (date: string | null) => {
    if (!date) return '—';
    const endDate = new Date(date);
    const now = new Date();
    const isExpired = endDate < now;
    return (
      <span className={isExpired ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'}>
        {formatDate(date)} {isExpired && '(Expiré)'}
      </span>
    );
  };

  const planLabels: Record<string, string> = {
    free: 'Freemium',
    pro: 'Pro (5 000 CFA/mois)',
    enterprise: 'Enterprise (sur devis)'
  };

  if (loading) {
    return (
      <AdminLayout title="Détails utilisateur" currentPage={currentPage} onNavigate={onNavigate}>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </AdminLayout>
    );
  }

  if (!user) {
    return (
      <AdminLayout title="Détails utilisateur" currentPage={currentPage} onNavigate={onNavigate}>
        <div className="text-center py-12">
          <p className="text-gray-500">Utilisateur non trouvé</p>
          <button onClick={() => onNavigate?.('admin_users')} className="mt-4 text-blue-600 hover:underline">
            Retour à la liste
          </button>
        </div>
      </AdminLayout>
    );
  }

  const isProExpired = user.subscription_plan === 'pro' && user.subscription_ends_at && new Date(user.subscription_ends_at) < new Date();

  return (
    <AdminLayout title={`Utilisateur : ${user.email}`} currentPage={currentPage} onNavigate={onNavigate}>
      <div className="space-y-6">
        <button
          onClick={() => onNavigate?.('admin_users')}
          className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
        >
          <ArrowLeft className="w-4 h-4" />
          Retour à la liste
        </button>

        {/* Message de notification */}
        {message && (
          <div className={`p-4 rounded-lg flex items-center gap-3 ${
            message.type === 'success' 
              ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-800 dark:text-green-300'
              : 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-300'
          }`}>
            <AlertCircle className="w-5 h-5" />
            <p>{message.text}</p>
          </div>
        )}

        {/* Informations générales */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-16 h-16 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
              <User className="w-8 h-8 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{user.email}</h2>
              <p className="text-gray-500">ID: {user.id}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
              <Calendar className="w-5 h-5 text-gray-400" />
              <div>
                <p className="text-xs text-gray-500">Inscrit le</p>
                <p className="text-sm font-medium">{formatDate(user.created_at)}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
              <Mail className="w-5 h-5 text-gray-400" />
              <div>
                <p className="text-xs text-gray-500">Email</p>
                <p className="text-sm font-medium">{user.email}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
              <FolderKanban className="w-5 h-5 text-gray-400" />
              <div>
                <p className="text-xs text-gray-500">Projets</p>
                <p className="text-sm font-medium">{user.projects_count}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
              <Clock className="w-5 h-5 text-gray-400" />
              <div>
                <p className="text-xs text-gray-500">Sessions</p>
                <p className="text-sm font-medium">{user.sessions_count}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Gestion de l'abonnement */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <CreditCard className="w-5 h-5" />
            Abonnement
          </h3>
          
          {/* Statut actuel */}
          <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <p className="text-xs text-gray-500">Plan actuel</p>
                <p className="text-sm font-medium">{planLabels[user.subscription_plan]}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Date d'expiration</p>
                <p className="text-sm font-medium">{formatEndDate(user.subscription_ends_at)}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Limites</p>
                <p className="text-sm font-medium">
                  Projets: {user.projects_limit === null ? '∞' : user.projects_limit} | 
                  Collab.: {user.collaborators_limit === null ? '∞' : user.collaborators_limit}
                </p>
              </div>
            </div>
            {isProExpired && (
              <div className="mt-3 text-sm text-red-600 dark:text-red-400 flex items-center gap-2">
                <AlertCircle className="w-4 h-4" />
                Abonnement expiré - L'utilisateur a perdu les fonctionnalités Pro
              </div>
            )}
          </div>

          {/* Actions - Changement de plan */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Changer le plan
            </label>
            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => updatePlan('free')}
                disabled={updating || user.subscription_plan === 'free'}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  user.subscription_plan === 'free'
                    ? 'bg-gray-300 dark:bg-gray-600 text-gray-500 cursor-not-allowed'
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600'
                }`}
              >
                Freemium
              </button>
              <button
                onClick={() => updatePlan('pro')}
                disabled={updating || user.subscription_plan === 'pro'}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  user.subscription_plan === 'pro'
                    ? 'bg-blue-300 dark:bg-blue-800 text-white cursor-not-allowed'
                    : 'bg-blue-600 hover:bg-blue-700 text-white'
                }`}
              >
                Pro (30 jours)
              </button>
              <button
                onClick={() => updatePlan('enterprise')}
                disabled={updating || user.subscription_plan === 'enterprise'}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  user.subscription_plan === 'enterprise'
                    ? 'bg-purple-300 dark:bg-purple-800 text-white cursor-not-allowed'
                    : 'bg-purple-600 hover:bg-purple-700 text-white'
                }`}
              >
                Enterprise
              </button>
            </div>
          </div>

          {/* Prolongation d'abonnement (uniquement pour Pro) */}
          {user.subscription_plan === 'pro' && (
            <div className="mb-6 p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                Prolonger l'abonnement Pro
              </label>
              <div className="flex flex-wrap gap-3 items-end">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Nombre de jours</label>
                  <input
                    type="number"
                    min="1"
                    max="365"
                    value={extendDays}
                    onChange={(e) => setExtendDays(Math.max(1, parseInt(e.target.value) || 30))}
                    className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 w-24"
                  />
                </div>
                <button
                  onClick={handleExtendSubscription}
                  disabled={updating}
                  className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors disabled:opacity-50"
                >
                  Prolonger de {extendDays} jours
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-2">
                La date d'expiration actuelle sera prolongée de {extendDays} jours.
              </p>
            </div>
          )}

          {/* Actions Admin */}
          <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
            <button
              onClick={toggleAdmin}
              disabled={updating}
              className="flex items-center gap-2 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              <Shield className="w-4 h-4" />
              {user.is_admin ? 'Retirer les droits admin' : 'Donner les droits admin'}
            </button>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}