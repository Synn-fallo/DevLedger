import { useEffect, useState } from 'react';
import { X, Calendar, CreditCard, User, Info, AlertCircle, CheckCircle, Clock } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface SubscriptionHistoryModalProps {
  userId: string;
  userEmail: string;
  onClose: () => void;
}

interface HistoryEntry {
  id: string;
  event_type: string;
  new_plan: string;
  valid_until: string | null;
  amount_xof: number;
  payment_method: string;
  payment_reference: string | null;
  admin_id: string | null;
  notes: string | null;
  created_at: string;
}

interface PeriodEntry {
  start_date: string;
  end_date: string;
  plan: string;
  was_paid: boolean;
  payment_amount: number;
}

const eventTypeLabels: Record<string, { label: string; icon: JSX.Element; color: string }> = {
  admin_activate: { 
    label: 'Activation par admin', 
    icon: <User className="w-4 h-4" />, 
    color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' 
  },
  admin_deactivate: { 
    label: 'Désactivation par admin', 
    icon: <User className="w-4 h-4" />, 
    color: 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-400' 
  },
  admin_extend: { 
    label: 'Prolongation par admin', 
    icon: <User className="w-4 h-4" />, 
    color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' 
  },
  payment_success: { 
    label: 'Paiement réussi', 
    icon: <CreditCard className="w-4 h-4" />, 
    color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' 
  },
  payment_failed: { 
    label: 'Paiement échoué', 
    icon: <AlertCircle className="w-4 h-4" />, 
    color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' 
  },
  expiration: { 
    label: 'Expiration automatique', 
    icon: <Clock className="w-4 h-4" />, 
    color: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' 
  }
};

const planLabels: Record<string, string> = {
  free: 'Freemium',
  pro: 'Pro',
  enterprise: 'Enterprise'
};

export function SubscriptionHistoryModal({ userId, userEmail, onClose }: SubscriptionHistoryModalProps) {
  const [events, setEvents] = useState<HistoryEntry[]>([]);
  const [periods, setPeriods] = useState<PeriodEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'events' | 'periods'>('periods');

  useEffect(() => {
    loadData();
  }, [userId]);

  const loadData = async () => {
    setLoading(true);

    // Charger les événements
    const { data: eventsData } = await supabase
      .from('subscription_events')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (eventsData) {
      setEvents(eventsData);
    }

    // Charger les périodes calculées
    const { data: periodsData } = await supabase
      .rpc('get_user_periods', { user_uuid: userId });

    if (periodsData) {
      setPeriods(periodsData);
    }

    setLoading(false);
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

  const formatShortDate = (date: string) => {
    return new Date(date).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  const formatAmount = (amount: number) => {
    if (amount === 0) return 'Gratuit';
    return `${amount.toLocaleString()} CFA`;
  };

  const getPlanColor = (plan: string) => {
    switch (plan) {
      case 'pro': return 'text-blue-600 dark:text-blue-400';
      case 'enterprise': return 'text-purple-600 dark:text-purple-400';
      default: return 'text-gray-500';
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl max-w-4xl w-full max-h-[85vh] overflow-hidden shadow-xl">
        {/* En-tête */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              Historique des abonnements
            </h2>
            <p className="text-sm text-gray-500 mt-1">{userEmail}</p>
          </div>
          <button 
            onClick={onClose} 
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Onglets */}
        <div className="flex border-b border-gray-200 dark:border-gray-700 px-6">
          <button
            onClick={() => setActiveTab('periods')}
            className={`px-4 py-3 text-sm font-medium transition-colors ${
              activeTab === 'periods'
                ? 'border-b-2 border-blue-500 text-blue-600 dark:text-blue-400'
                : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
          >
            📅 Périodes d'abonnement
          </button>
          <button
            onClick={() => setActiveTab('events')}
            className={`px-4 py-3 text-sm font-medium transition-colors ${
              activeTab === 'events'
                ? 'border-b-2 border-blue-500 text-blue-600 dark:text-blue-400'
                : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
          >
            📋 Événements détaillés
          </button>
        </div>

        {/* Contenu */}
        <div className="p-6 overflow-y-auto max-h-[60vh]">
          {loading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : activeTab === 'periods' ? (
            <>
              {periods.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <Calendar className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>Aucune période d'abonnement trouvée</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {periods.map((period, index) => (
                    <div key={index} className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                      <div className="flex items-center justify-between flex-wrap gap-2 mb-3">
                        <div className="flex items-center gap-3">
                          <span className={`font-semibold text-lg ${getPlanColor(period.plan)}`}>
                            {planLabels[period.plan]}
                          </span>
                          {period.was_paid ? (
                            <span className="text-xs px-2 py-1 bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 rounded-full flex items-center gap-1">
                              <CheckCircle className="w-3 h-3" />
                              Payant
                            </span>
                          ) : (
                            <span className="text-xs px-2 py-1 bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 rounded-full flex items-center gap-1">
                              <User className="w-3 h-3" />
                              Offert
                            </span>
                          )}
                          {period.payment_amount > 0 && (
                            <span className="text-xs font-mono bg-gray-200 dark:bg-gray-600 px-2 py-1 rounded">
                              {formatAmount(period.payment_amount)}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                        <div>📅 Du {formatShortDate(period.start_date)} au {formatShortDate(period.end_date)}</div>
                        <div className="text-xs text-gray-400">
                          Durée : {Math.round((new Date(period.end_date).getTime() - new Date(period.start_date).getTime()) / (1000 * 60 * 60 * 24))} jours
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          ) : (
            <>
              {events.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <Info className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>Aucun événement trouvé</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {events.map((event) => {
                    const eventInfo = eventTypeLabels[event.event_type] || {
                      label: event.event_type,
                      icon: <Info className="w-4 h-4" />,
                      color: 'bg-gray-100 text-gray-700'
                    };
                    
                    return (
                      <div key={event.id} className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                        <div className="flex items-center justify-between flex-wrap gap-2 mb-2">
                          <div className="flex items-center gap-2">
                            <span className={`text-xs px-2 py-1 rounded-full flex items-center gap-1 ${eventInfo.color}`}>
                              {eventInfo.icon}
                              {eventInfo.label}
                            </span>
                            <span className={`text-sm font-medium ${getPlanColor(event.new_plan)}`}>
                              → {planLabels[event.new_plan]}
                            </span>
                          </div>
                          <span className="text-xs text-gray-500">
                            {formatDate(event.created_at)}
                          </span>
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-400 space-y-1 mt-2">
                          {event.amount_xof > 0 && (
                            <div>💰 Montant : {formatAmount(event.amount_xof)}</div>
                          )}
                          {event.valid_until && (
                            <div>⏰ Valable jusqu'au : {formatShortDate(event.valid_until)}</div>
                          )}
                          {event.payment_method && event.payment_method !== 'admin' && (
                            <div>💳 Moyen de paiement : {event.payment_method}</div>
                          )}
                          {event.notes && (
                            <div className="text-xs text-gray-400 italic">📝 {event.notes}</div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          )}
        </div>

        {/* Pied de page */}
        <div className="p-6 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={onClose}
            className="w-full px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
}