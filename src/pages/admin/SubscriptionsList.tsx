import { useEffect, useState } from 'react';
import { AdminLayout } from '../../components/admin/AdminLayout';
import { DataTable } from '../../components/admin/DataTable';
import { SubscriptionHistoryModal } from '../../components/admin/SubscriptionHistoryModal';
import { supabase } from '../../lib/supabase';

interface Subscription {
  id: string;
  email: string;
  subscription_plan: string;
  subscription_ends_at: string | null;
  mobile_money_number: string | null;
  created_at: string;
  is_active: boolean;
  was_paid: boolean;
  last_payment_amount: number;
  registered_at: string;
  total_events: number;
}

interface SubscriptionsListProps {
  currentPage?: string;
  onNavigate?: (page: string, id?: string) => void;
}

export function SubscriptionsList({ currentPage, onNavigate }: SubscriptionsListProps) {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<{ id: string; email: string } | null>(null);

  useEffect(() => {
    loadSubscriptions();
  }, []);

  const loadSubscriptions = async () => {
    setLoading(true);
    
    const { data, error } = await supabase
      .from('admin_subscriptions_view')
      .select('*')
      .order('last_event_date', { ascending: false });

    if (error) {
      console.error('Error loading subscriptions:', error);
    } else if (data) {
      setSubscriptions(data as Subscription[]);
    }
    
    setLoading(false);
  };

  const formatDate = (date: string | null) => {
    if (!date) return '—';
    return new Date(date).toLocaleDateString('fr-FR');
  };

  const formatEndDate = (date: string | null) => {
    if (!date) return '—';
    const endDate = new Date(date);
    const now = new Date();
    const isExpired = endDate < now;
    return isExpired ? `Expiré le ${formatDate(date)}` : `Jusqu'au ${formatDate(date)}`;
  };

  const planLabels: Record<string, string> = {
    free: 'Freemium',
    pro: 'Pro',
    enterprise: 'Enterprise'
  };

  const columns = [
    { key: 'email' as const, header: 'Utilisateur', sortable: true },
    { key: 'subscription_plan' as const, header: 'Plan', sortable: true },
    { key: 'subscription_ends_at' as const, header: 'Fin', sortable: true },
    { key: 'last_payment_amount' as const, header: 'Dernier paiement', sortable: true },
    { key: 'was_paid' as const, header: 'Type', sortable: true },
    { key: 'total_events' as const, header: 'Événements', sortable: true },
    { key: 'registered_at' as const, header: 'Inscrit le', sortable: true }
  ];

  const handleRowClick = (row: Subscription) => {
    setSelectedUser({ id: row.id, email: row.email });
  };

  if (loading) {
    return (
      <AdminLayout title="Abonnements" currentPage={currentPage} onNavigate={onNavigate}>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Abonnements" currentPage={currentPage} onNavigate={onNavigate}>
      <DataTable
        data={subscriptions}
        columns={columns.map(col => ({
          ...col,
          render: (value: any, row: Subscription) => {
            if (col.key === 'subscription_plan') {
              const isActive = row.is_active;
              return (
                <span className={`font-medium ${isActive ? 'text-green-600 dark:text-green-400' : 'text-gray-500'}`}>
                  {planLabels[value] || value}
                  {!isActive && value !== 'free' && ' (Inactif)'}
                </span>
              );
            }
            if (col.key === 'subscription_ends_at') {
              if (!row.is_active && row.subscription_plan !== 'free') {
                return <span className="text-red-600 dark:text-red-400">{formatEndDate(value)}</span>;
              }
              return formatEndDate(value);
            }
            if (col.key === 'last_payment_amount') {
              if (value > 0) {
                return <span className="font-medium text-green-600 dark:text-green-400">{value.toLocaleString()} CFA</span>;
              }
              return <span className="text-gray-400">Gratuit</span>;
            }
            if (col.key === 'was_paid') {
              return value ? (
                <span className="text-xs px-2 py-1 bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 rounded-full">
                  Payant
                </span>
              ) : (
                <span className="text-xs px-2 py-1 bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 rounded-full">
                  Offert
                </span>
              );
            }
            if (col.key === 'registered_at') {
              return formatDate(value);
            }
            if (col.key === 'total_events') {
              return <span className="text-center">{value}</span>;
            }
            return value;
          }
        }))}
        onRowClick={handleRowClick}
        searchPlaceholder="Rechercher par email..."
        searchFields={['email']}
      />

      {/* Modale d'historique */}
      {selectedUser && (
        <SubscriptionHistoryModal
          userId={selectedUser.id}
          userEmail={selectedUser.email}
          onClose={() => setSelectedUser(null)}
        />
      )}
    </AdminLayout>
  );
}