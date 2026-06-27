import { useState } from 'react';
import { Save, AlertTriangle } from 'lucide-react';
import { AdminLayout } from '../../components/admin/AdminLayout';

interface SystemSettingsProps {
  currentPage?: string;
  onNavigate?: (page: string) => void;
}

export function SystemSettings({ currentPage, onNavigate }: SystemSettingsProps) {
  const [config, setConfig] = useState({
    default_hourly_rate: 5000,
    default_token_price: 0.00001,
    default_currency: 'XOF',
    freemium_projects_limit: 10,
    freemium_collaborators_limit: 2,
    maintenance_mode: false,
    maintenance_message: 'Site en maintenance, revenez plus tard.'
  });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const saveConfig = async () => {
    setSaving(true);
    await new Promise(resolve => setTimeout(resolve, 500));
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <AdminLayout title="Configuration système" currentPage={currentPage} onNavigate={onNavigate}>
      <div className="space-y-6">
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Paramètres par défaut</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Taux horaire par défaut (CFA)
              </label>
              <input
                type="number"
                value={config.default_hourly_rate}
                onChange={(e) => setConfig({ ...config, default_hourly_rate: parseInt(e.target.value) || 0 })}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Prix du token par défaut
              </label>
              <input
                type="number"
                step="0.000001"
                value={config.default_token_price}
                onChange={(e) => setConfig({ ...config, default_token_price: parseFloat(e.target.value) || 0 })}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Devise par défaut
              </label>
              <select
                value={config.default_currency}
                onChange={(e) => setConfig({ ...config, default_currency: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
              >
                <option value="XOF">XOF (CFA)</option>
                <option value="EUR">EUR (Euro)</option>
                <option value="USD">USD (Dollar)</option>
              </select>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Limites Freemium</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Projets actifs maximum
              </label>
              <input
                type="number"
                value={config.freemium_projects_limit}
                onChange={(e) => setConfig({ ...config, freemium_projects_limit: parseInt(e.target.value) || 0 })}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Collaborateurs par projet maximum
              </label>
              <input
                type="number"
                value={config.freemium_collaborators_limit}
                onChange={(e) => setConfig({ ...config, freemium_collaborators_limit: parseInt(e.target.value) || 0 })}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
              />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-yellow-500" />
            Mode maintenance
          </h3>
          <div className="space-y-4">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={config.maintenance_mode}
                onChange={(e) => setConfig({ ...config, maintenance_mode: e.target.checked })}
                className="w-4 h-4 text-blue-600 rounded"
              />
              <span className="text-sm text-gray-700 dark:text-gray-300">Activer le mode maintenance</span>
            </label>
            {config.maintenance_mode && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Message de maintenance
                </label>
                <textarea
                  value={config.maintenance_message}
                  onChange={(e) => setConfig({ ...config, maintenance_message: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
                />
              </div>
            )}
          </div>
        </div>

        <div className="flex justify-end">
          <button
            onClick={saveConfig}
            disabled={saving}
            className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            {saving ? 'Enregistrement...' : 'Enregistrer les modifications'}
          </button>
        </div>

        {saved && (
          <div className="fixed bottom-4 right-4 bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg">
            Configuration enregistrée
          </div>
        )}
      </div>
    </AdminLayout>
  );
}