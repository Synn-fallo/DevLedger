import { useEffect, useState } from 'react';
import { AdminLayout } from '../../components/admin/AdminLayout';
import { supabase } from '../../lib/supabase';
import { 
  TrendingUp, 
  Users, 
  CreditCard, 
  Gift, 
  Calendar,
  Download,
  RefreshCw
} from 'lucide-react';

interface FinancialSummary {
  month: string;
  event_type: string;
  event_count: number;
  total_amount: number;
  free_grants: number;
  paid_transactions: number;
  paid_amount: number;
}

interface RevenueByUser {
  id: string;
  email: string;
  paid_transactions_count: number;
  total_paid: number;
  last_payment_date: string;
  current_plan: string;
}

interface FinancialDashboardProps {
  currentPage?: string;
  onNavigate?: (page: string, id?: string) => void;
}

export function FinancialDashboard({ currentPage, onNavigate }: FinancialDashboardProps) {
  const [summary, setSummary] = useState<FinancialSummary[]>([]);
  const [revenueByUser, setRevenueByUser] = useState<RevenueByUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedYear, setSelectedYear] = useState<string>(new Date().getFullYear().toString());

  useEffect(() => {
    loadData();
  }, [selectedYear]);

  const loadData = async () => {
    setLoading(true);

    // Charger le résumé financier
    const { data: summaryData } = await supabase
      .from('admin_financial_summary')
      .select('*')
      .order('month', { ascending: false });

    if (summaryData) {
      // Filtrer par année et protéger contre les null
      const filtered = (summaryData as FinancialSummary[]).filter(
        item => item.month && item.month.startsWith(selectedYear)
      );
      // S'assurer que les valeurs numériques ne sont pas null
      const sanitized = filtered.map(item => ({
        ...item,
        event_count: item.event_count || 0,
        total_amount: item.total_amount || 0,
        free_grants: item.free_grants || 0,
        paid_transactions: item.paid_transactions || 0,
        paid_amount: item.paid_amount || 0
      }));
      setSummary(sanitized);
    } else {
      setSummary([]);
    }

    // Charger le CA par utilisateur
    const { data: revenueData } = await supabase
      .from('admin_revenue_by_user')
      .select('*')
      .order('total_paid', { ascending: false });

    if (revenueData) {
      // S'assurer que les valeurs numériques ne sont pas null
      const sanitizedRevenue = (revenueData as RevenueByUser[]).map(item => ({
        ...item,
        paid_transactions_count: item.paid_transactions_count || 0,
        total_paid: item.total_paid || 0
      }));
      setRevenueByUser(sanitizedRevenue);
    } else {
      setRevenueByUser([]);
    }

    setLoading(false);
  };

  const formatMonth = (month: string) => {
    if (!month) return '—';
    const date = new Date(month);
    return date.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
  };

  const formatAmount = (amount: number | null | undefined) => {
    if (!amount && amount !== 0) return '0 CFA';
    return `${amount.toLocaleString()} CFA`;
  };

  const formatDate = (date: string | null | undefined) => {
    if (!date) return '—';
    return new Date(date).toLocaleDateString('fr-FR');
  };

  // Calculer les totaux globaux avec protection contre null
  const totalPaid = summary.reduce((sum, item) => sum + (item.paid_amount || 0), 0);
  const totalFreeGrants = summary.reduce((sum, item) => sum + (item.free_grants || 0), 0);
  const totalPaidTransactions = summary.reduce((sum, item) => sum + (item.paid_transactions || 0), 0);
  const uniquePayingUsers = revenueByUser.filter(u => (u.total_paid || 0) > 0).length;

  const years = [2024, 2025, 2026, 2027];

  if (loading) {
    return (
      <AdminLayout title="Comptabilité" currentPage={currentPage} onNavigate={onNavigate}>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Comptabilité" currentPage={currentPage} onNavigate={onNavigate}>
      <div className="space-y-6">
        {/* En-tête avec rafraîchissement */}
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-4">
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800"
            >
              {years.map(year => (
                <option key={year} value={year.toString()}>{year}</option>
              ))}
            </select>
          </div>
          <button
            onClick={loadData}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <RefreshCw className="w-4 h-4" />
            Rafraîchir
          </button>
        </div>

        {/* Cartes de synthèse */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Chiffre d'affaires total</p>
                <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                  {formatAmount(totalPaid)}
                </p>
              </div>
              <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Clients payants</p>
                <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                  {uniquePayingUsers}
                </p>
              </div>
              <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Transactions payantes</p>
                <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                  {totalPaidTransactions}
                </p>
              </div>
              <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center">
                <CreditCard className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Abonnements offerts</p>
                <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                  {totalFreeGrants}
                </p>
              </div>
              <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900/30 rounded-full flex items-center justify-center">
                <Gift className="w-6 h-6 text-orange-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Tableau récapitulatif mensuel */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Récapitulatif mensuel
            </h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-700/50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Mois</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Nb événements</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Payant</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Offert</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Montant</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {summary.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                      Aucune donnée financière pour {selectedYear}
                    </td>
                  </tr>
                ) : (
                  summary.map((item, index) => (
                    <tr key={index} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                      <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">
                        {formatMonth(item.month)}
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <span className={`text-xs px-2 py-1 rounded-full ${
                          item.event_type === 'payment_success'
                            ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                            : 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                        }`}>
                          {item.event_type === 'payment_success' ? 'Paiement' : 'Admin / Offert'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-right text-gray-600">
                        {item.event_count}
                      </td>
                      <td className="px-6 py-4 text-sm text-right text-green-600">
                        {item.paid_transactions}
                      </td>
                      <td className="px-6 py-4 text-sm text-right text-blue-600">
                        {item.free_grants}
                      </td>
                      <td className="px-6 py-4 text-sm text-right font-medium text-gray-900">
                        {formatAmount(item.paid_amount)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Tableau CA par utilisateur */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Chiffre d'affaires par utilisateur
            </h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-700/50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Utilisateur</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Transactions</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Total payé</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Dernier paiement</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Plan actuel</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {revenueByUser.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                      Aucune donnée utilisateur
                    </td>
                  </tr>
                ) : (
                  revenueByUser.map((user) => (
                    <tr key={user.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                      <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">
                        {user.email}
                      </td>
                      <td className="px-6 py-4 text-sm text-right text-gray-600">
                        {user.paid_transactions_count || 0}
                      </td>
                      <td className="px-6 py-4 text-sm text-right font-medium text-green-600">
                        {formatAmount(user.total_paid)}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {formatDate(user.last_payment_date)}
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <span className={`text-xs px-2 py-1 rounded-full ${
                          user.current_plan === 'pro' 
                            ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                            : user.current_plan === 'enterprise'
                            ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400'
                            : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-400'
                        }`}>
                          {user.current_plan || 'free'}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Bouton export */}
        <div className="flex justify-end">
          <button
            onClick={() => {
              // Export CSV
              const csv = [
                ['Mois', 'Type', 'Événements', 'Payant', 'Offert', 'Montant (CFA)'],
                ...summary.map(item => [
                  formatMonth(item.month),
                  item.event_type === 'payment_success' ? 'Paiement' : 'Admin',
                  item.event_count,
                  item.paid_transactions,
                  item.free_grants,
                  item.paid_amount || 0
                ])
              ].map(row => row.join(',')).join('\n');
              
              const blob = new Blob([csv], { type: 'text/csv' });
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = `comptabilite_${selectedYear}.csv`;
              a.click();
              URL.revokeObjectURL(url);
            }}
            className="flex items-center gap-2 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
          >
            <Download className="w-4 h-4" />
            Exporter CSV
          </button>
        </div>
      </div>
    </AdminLayout>
  );
}