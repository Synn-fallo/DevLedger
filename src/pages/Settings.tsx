import { useState, useEffect } from 'react';
import { 
  Save, User, DollarSign, Zap, Globe, Moon, Sun, Eye, EyeOff, 
  Bell, Shield, Key, Smartphone, Mail, Check, AlertCircle,
  Loader2, RefreshCw, LogOut, Trash2, Github, Calendar
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { useSettings } from '../contexts/SettingsContext';
import { periodTypeOptions } from '../lib/dateUtils';

interface SettingsForm {
  hourly_rate: number;
  token_price: number;
  currency: string;
  display_mode: 'simple' | 'advanced';
  stats_period_type: 'calendar' | 'rolling';
  show_kpis: boolean;  // NOUVEAU
  compact_view: boolean;
  animated_charts: boolean;
  time_display: 'hm' | 'decimal' | 'minutes';
  email_notifications: boolean;
  push_notifications: boolean;
  weekly_report: boolean;
  two_factor_auth: boolean;
  auto_token_tracking: boolean;
}

export function Settings() {
  const { user, signOut } = useAuth();
  const { theme, toggleTheme, setTheme } = useTheme();
  const { settings, updateSettings, loading: settingsLoading } = useSettings();
  
  const [activeTab, setActiveTab] = useState('general');
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [showApiKey, setShowApiKey] = useState(false);
  const [apiKey, setApiKey] = useState('');
  const [savingApiKey, setSavingApiKey] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [apiKeyExists, setApiKeyExists] = useState(false);
  
  // États pour les mots de passe
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const [formData, setFormData] = useState<SettingsForm>({
    hourly_rate: 5000,
    token_price: 0.00001,
    currency: 'XOF',
    display_mode: 'simple',
    stats_period_type: 'calendar',
    show_kpis: true,  // NOUVEAU - valeur par défaut
    compact_view: false,
    animated_charts: true,
    time_display: 'hm',
    email_notifications: true,
    push_notifications: false,
    weekly_report: true,
    two_factor_auth: false,
    auto_token_tracking: false
  });

  // Charger les données réelles depuis le contexte
  useEffect(() => {
    if (settings) {
      setFormData(prev => ({
        ...prev,
        hourly_rate: settings.hourly_rate || 5000,
        token_price: settings.token_price || 0.00001,
        currency: settings.currency || 'XOF',
        display_mode: settings.display_mode || 'simple',
        stats_period_type: (settings as any).stats_period_type || 'calendar',
        show_kpis: (settings as any).show_kpis ?? true  // NOUVEAU
      }));
    }
  }, [settings]);

  // Charger la clé API si elle existe
  useEffect(() => {
    if (user) {
      loadApiKey();
    }
  }, [user]);

  const loadApiKey = async () => {
    if (!user) return;
    
    try {
      // Vérifier d'abord si la table existe
      const { error: tableCheckError } = await supabase
        .from('user_api_keys')
        .select('count', { count: 'exact', head: true });

      // Si la table n'existe pas, on ignore silencieusement
      if (tableCheckError) {
        console.log('Table user_api_keys not yet created - API key feature disabled');
        return;
      }

      const { data, error } = await supabase
        .from('user_api_keys')
        .select('api_key')
        .eq('user_id', user.id)
        .eq('service', 'openai')
        .maybeSingle();

      if (error && error.code !== 'PGRST116') {
        console.error('Error loading API key:', error);
        return;
      }

      if (data) {
        setApiKey(data.api_key);
        setApiKeyExists(true);
      }
    } catch (error) {
      // Ignorer les erreurs de table inexistante
      console.log('API key feature not available');
    }
  };

  const saveApiKey = async () => {
    if (!user || !apiKey) return;

    setSavingApiKey(true);
    try {
      // Vérifier si la table existe avant d'essayer d'insérer
      const { error: tableCheckError } = await supabase
        .from('user_api_keys')
        .select('count', { count: 'exact', head: true });

      if (tableCheckError) {
        alert('La fonctionnalité de clé API n\'est pas encore disponible');
        return;
      }

      const { error } = await supabase
        .from('user_api_keys')
        .upsert({
          user_id: user.id,
          service: 'openai',
          api_key: apiKey,
          updated_at: new Date()
        }, {
          onConflict: 'user_id,service'
        });

      if (error) throw error;

      setApiKeyExists(true);
      alert('Clé API sauvegardée avec succès');
    } catch (error) {
      console.error('Error saving API key:', error);
      alert('Erreur lors de la sauvegarde de la clé API');
    } finally {
      setSavingApiKey(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setSaveError(null);
    setSaveSuccess(false);

    try {
      // Sauvegarder dans Supabase via le contexte
      await updateSettings({
        hourly_rate: formData.hourly_rate,
        token_price: formData.token_price,
        currency: formData.currency,
        display_mode: formData.display_mode,
        stats_period_type: formData.stats_period_type,
        show_kpis: formData.show_kpis  // NOUVEAU
      });

      // Sauvegarder les préférences locales
      const localPrefs = {
        compact_view: formData.compact_view,
        animated_charts: formData.animated_charts,
        time_display: formData.time_display,
        email_notifications: formData.email_notifications,
        push_notifications: formData.push_notifications,
        weekly_report: formData.weekly_report,
        auto_token_tracking: formData.auto_token_tracking
      };

      localStorage.setItem('devledger_preferences', JSON.stringify(localPrefs));

      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);

    } catch (error) {
      console.error('Error saving settings:', error);
      setSaveError('Erreur lors de la sauvegarde');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!deleteConfirm) {
      setDeleteConfirm(true);
      return;
    }

    try {
      // Supprimer les données de l'utilisateur
      await supabase.from('sessions').delete().eq('user_id', user?.id);
      await supabase.from('projects').delete().eq('user_id', user?.id);
      await supabase.from('users_settings').delete().eq('id', user?.id);
      
      // Supprimer le compte
      await supabase.auth.admin.deleteUser(user?.id);
      
      // Déconnecter
      await signOut();
    } catch (error) {
      console.error('Error deleting account:', error);
      alert('Erreur lors de la suppression du compte');
    }
  };

  const handleUpdatePassword = async () => {
    // Vérifier que les mots de passe correspondent
    if (newPassword !== confirmPassword) {
      alert('Les nouveaux mots de passe ne correspondent pas');
      return;
    }

    // Vérifier que le nouveau mot de passe a au moins 6 caractères
    if (newPassword.length < 6) {
      alert('Le nouveau mot de passe doit contenir au moins 6 caractères');
      return;
    }

    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (error) throw error;

      alert('Mot de passe mis à jour avec succès');
      
      // Réinitialiser les champs
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setShowCurrentPassword(false);
      setShowNewPassword(false);
      setShowConfirmPassword(false);
      
    } catch (error) {
      console.error('Error updating password:', error);
      alert('Erreur lors de la mise à jour du mot de passe');
    }
  };

  const tabs = [
    { id: 'general', label: 'Général', icon: User },
    { id: 'preferences', label: 'Préférences', icon: Eye },
    { id: 'billing', label: 'Tarification', icon: DollarSign },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'security', label: 'Sécurité', icon: Shield },
    { id: 'api', label: 'API & IA', icon: Key }
  ];

  if (settingsLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600 dark:text-blue-400 mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">Chargement des paramètres...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* En-tête avec stats utilisateur */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Paramètres</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Gérez vos préférences et configurations
          </p>
        </div>

        {/* Badge plan */}
        <div className="flex items-center px-4 py-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
          <Zap className="w-5 h-5 text-blue-600 dark:text-blue-400 mr-2" />
          <span className="text-sm text-blue-700 dark:text-blue-300 font-medium">
            Plan Gratuit
          </span>
        </div>
      </div>

      {/* Message de succès */}
      {saveSuccess && (
        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
          <div className="flex items-center">
            <Check className="w-5 h-5 text-green-600 dark:text-green-400 mr-2" />
            <p className="text-sm text-green-700 dark:text-green-300">
              Paramètres sauvegardés avec succès !
            </p>
          </div>
        </div>
      )}

      {/* Message d'erreur */}
      {saveError && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <div className="flex items-center">
            <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 mr-2" />
            <p className="text-sm text-red-700 dark:text-red-300">{saveError}</p>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="flex space-x-8 overflow-x-auto pb-1">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center px-1 py-4 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                    : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                }`}
              >
                <Icon className="w-4 h-4 mr-2" />
                {tab.label}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Contenu des tabs */}
      <div className="space-y-6">
        {/* Tab Général */}
        {activeTab === 'general' && (
          <div className="space-y-6">
            {/* Profil */}
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Informations du profil
              </h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Email
                  </label>
                  <input
                    type="email"
                    value={user?.email || ''}
                    disabled
                    className="w-full px-4 py-2 text-sm bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-500 dark:text-gray-400 cursor-not-allowed"
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    L'email est lié à votre compte d'authentification
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    ID Utilisateur
                  </label>
                  <div className="flex items-center space-x-2">
                    <code className="flex-1 px-4 py-2 text-xs bg-gray-100 dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-600 dark:text-gray-400 font-mono">
                      {user?.id}
                    </code>
                    <button
                      onClick={() => navigator.clipboard.writeText(user?.id || '')}
                      className="p-2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
                      title="Copier l'ID"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Apparence */}
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Apparence
              </h2>
              <div className="space-y-6">
                {/* Theme toggle */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-5 bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-700 rounded-xl border-2 border-gray-200 dark:border-gray-600 shadow-sm">
                  <div className="mb-4 sm:mb-0">
                    <div className="flex items-center">
                      {theme === 'dark' ? (
                        <Moon className="w-6 h-6 text-indigo-600 dark:text-indigo-400 mr-3" />
                      ) : (
                        <Sun className="w-6 h-6 text-amber-500 mr-3" />
                      )}
                      <div>
                        <p className="text-base font-semibold text-gray-900 dark:text-white">
                          Thème {theme === 'dark' ? 'Sombre' : 'Clair'}
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                          {theme === 'dark' 
                            ? 'Mode sombre adapté aux longues sessions de développement' 
                            : 'Mode clair pour un confort de lecture optimal'}
                        </p>
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      console.log('Bouton cliqué, thème actuel:', theme);
                      toggleTheme();
                    }}
                    className={`flex items-center justify-center px-6 py-3 rounded-lg font-medium transition-all transform hover:scale-105 ${
                      theme === 'dark'
                        ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-white shadow-lg shadow-amber-500/30'
                        : 'bg-gradient-to-r from-indigo-600 to-indigo-700 text-white shadow-lg shadow-indigo-600/30'
                    }`}
                  >
                    {theme === 'dark' ? (
                      <>
                        <Sun className="w-5 h-5 mr-2" />
                        Passer en mode clair
                      </>
                    ) : (
                      <>
                        <Moon className="w-5 h-5 mr-2" />
                        Passer en mode sombre
                      </>
                    )}
                  </button>
                </div>

                {/* Mode d'affichage */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                    Mode d'affichage par défaut
                  </label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <label
                      className={`flex items-center p-4 border-2 rounded-xl cursor-pointer transition-all ${
                        formData.display_mode === 'simple'
                          ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 shadow-md'
                          : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800'
                      }`}
                    >
                      <input
                        type="radio"
                        name="display_mode"
                        value="simple"
                        checked={formData.display_mode === 'simple'}
                        onChange={(e) => setFormData({ ...formData, display_mode: e.target.value as 'simple' | 'advanced' })}
                        className="sr-only"
                      />
                      <div className="flex items-center flex-1">
                        <EyeOff className={`w-5 h-5 mr-3 ${
                          formData.display_mode === 'simple' ? 'text-blue-600 dark:text-blue-400' : 'text-gray-400 dark:text-gray-500'
                        }`} />
                        <div>
                          <p className="text-sm font-medium text-gray-900 dark:text-white">Mode Simple</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            Interface épurée, informations essentielles
                          </p>
                        </div>
                      </div>
                      {formData.display_mode === 'simple' && (
                        <div className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
                          <Check className="w-3 h-3 text-white" />
                        </div>
                      )}
                    </label>

                    <label
                      className={`flex items-center p-4 border-2 rounded-xl cursor-pointer transition-all ${
                        formData.display_mode === 'advanced'
                          ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 shadow-md'
                          : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800'
                      }`}
                    >
                      <input
                        type="radio"
                        name="display_mode"
                        value="advanced"
                        checked={formData.display_mode === 'advanced'}
                        onChange={(e) => setFormData({ ...formData, display_mode: e.target.value as 'simple' | 'advanced' })}
                        className="sr-only"
                      />
                      <div className="flex items-center flex-1">
                        <Eye className={`w-5 h-5 mr-3 ${
                          formData.display_mode === 'advanced' ? 'text-blue-600 dark:text-blue-400' : 'text-gray-400 dark:text-gray-500'
                        }`} />
                        <div>
                          <p className="text-sm font-medium text-gray-900 dark:text-white">Mode Avancé</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            KPIs détaillés, données techniques complètes
                          </p>
                        </div>
                      </div>
                      {formData.display_mode === 'advanced' && (
                        <div className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
                          <Check className="w-3 h-3 text-white" />
                        </div>
                      )}
                    </label>
                  </div>
                </div>

                {/* Type de période pour les statistiques */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    <div className="flex items-center">
                      <Calendar className="w-4 h-4 mr-1" />
                      Type de période pour les statistiques
                    </div>
                  </label>
                  <div className="flex flex-wrap gap-4">
                    {periodTypeOptions.map(option => (
                      <label key={option.value} className="flex items-center space-x-2">
                        <input
                          type="radio"
                          value={option.value}
                          checked={formData.stats_period_type === option.value}
                          onChange={(e) => setFormData({ ...formData, stats_period_type: e.target.value as 'calendar' | 'rolling' })}
                          className="w-4 h-4 text-blue-600"
                        />
                        <span className="text-sm text-gray-700 dark:text-gray-300">{option.label}</span>
                      </label>
                    ))}
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                    Calendaire : du début de la période (lundi, 1er du mois, etc.) à aujourd'hui.<br />
                    Glissante : X derniers jours (7, 30, 90, 365).
                  </p>
                </div>

                {/* Affichage des KPIs - NOUVEAU */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Affichage des KPIs
                  </label>
                  <div className="flex flex-wrap gap-4">
                    <label className="flex items-center space-x-2">
                      <input
                        type="radio"
                        value="true"
                        checked={formData.show_kpis === true}
                        onChange={(e) => setFormData({ ...formData, show_kpis: e.target.value === 'true' })}
                        className="w-4 h-4 text-blue-600"
                      />
                      <span className="text-sm text-gray-700 dark:text-gray-300">Afficher les KPIs</span>
                    </label>
                    <label className="flex items-center space-x-2">
                      <input
                        type="radio"
                        value="false"
                        checked={formData.show_kpis === false}
                        onChange={(e) => setFormData({ ...formData, show_kpis: e.target.value === 'true' })}
                        className="w-4 h-4 text-blue-600"
                      />
                      <span className="text-sm text-gray-700 dark:text-gray-300">Masquer les KPIs</span>
                    </label>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                    Cette option s'applique à tous vos projets par défaut. Vous pouvez la surcharger projet par projet.
                  </p>
                </div>
              </div>
            </div>

            {/* Actions du compte */}
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Actions du compte
              </h2>
              <div className="space-y-3">
                <button
                  onClick={signOut}
                  className="flex items-center px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  Se déconnecter
                </button>
                
                <button
                  onClick={handleDeleteAccount}
                  className={`flex items-center px-4 py-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors ${
                    deleteConfirm ? 'bg-red-50 dark:bg-red-900/20' : ''
                  }`}
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  {deleteConfirm ? 'Cliquez à nouveau pour confirmer' : 'Supprimer mon compte'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Tab Préférences */}
        {activeTab === 'preferences' && (
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Préférences d'affichage
            </h2>
            <div className="space-y-6">
              {/* Vue compacte */}
              <div className="flex items-center justify-between p-3 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition-colors">
                <div>
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Vue compacte</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Afficher les listes en mode compact</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input 
                    type="checkbox" 
                    className="sr-only peer"
                    checked={formData.compact_view}
                    onChange={(e) => setFormData({ ...formData, compact_view: e.target.checked })}
                  />
                  <div className="w-11 h-6 bg-gray-200 dark:bg-gray-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                </label>
              </div>

              {/* Graphiques animés */}
              <div className="flex items-center justify-between p-3 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition-colors">
                <div>
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Graphiques animés</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Activer les animations des graphiques</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input 
                    type="checkbox" 
                    className="sr-only peer"
                    checked={formData.animated_charts}
                    onChange={(e) => setFormData({ ...formData, animated_charts: e.target.checked })}
                  />
                  <div className="w-11 h-6 bg-gray-200 dark:bg-gray-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                </label>
              </div>

              {/* Format d'affichage du temps */}
              <div className="p-3">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Format d'affichage du temps
                </label>
                <select
                  value={formData.time_display}
                  onChange={(e) => setFormData({ ...formData, time_display: e.target.value as 'hm' | 'decimal' | 'minutes' })}
                  className="w-full px-4 py-2 text-sm bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-white"
                >
                  <option value="hm" className="bg-white dark:bg-gray-900">Heures:Minutes (2h30)</option>
                  <option value="decimal" className="bg-white dark:bg-gray-900">Heures décimales (2.5h)</option>
                  <option value="minutes" className="bg-white dark:bg-gray-900">Minutes seulement (150min)</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {/* Tab Tarification */}
        {activeTab === 'billing' && (
          <div className="space-y-6">
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Configuration des taux
              </h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    <div className="flex items-center">
                      <DollarSign className="w-4 h-4 mr-1" />
                      Taux horaire ({formData.currency})
                    </div>
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="100"
                    value={formData.hourly_rate}
                    onChange={(e) => setFormData({ ...formData, hourly_rate: Number(e.target.value) })}
                    className="w-full px-4 py-2 text-sm bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-white"
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Utilisé pour calculer la valeur de votre temps
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    <div className="flex items-center">
                      <Zap className="w-4 h-4 mr-1" />
                      Prix du token (en {formData.currency})
                    </div>
                  </label>
                  <input
                    type="number"
                    step="0.000001"
                    min="0"
                    value={formData.token_price}
                    onChange={(e) => setFormData({ ...formData, token_price: Number(e.target.value) })}
                    className="w-full px-4 py-2 text-sm bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-white"
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Prix par token IA (OpenAI: ~0.00001, Claude: ~0.000015)
                  </p>
                </div>

                <div className="flex items-center justify-between pt-4">
                  <div className="flex items-center">
                    <RefreshCw className="w-4 h-4 mr-2 text-gray-500 dark:text-gray-400" />
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      Suivi automatique des tokens
                    </span>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input 
                      type="checkbox" 
                      className="sr-only peer"
                      checked={formData.auto_token_tracking}
                      onChange={(e) => setFormData({ ...formData, auto_token_tracking: e.target.checked })}
                    />
                    <div className="w-11 h-6 bg-gray-200 dark:bg-gray-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                  </label>
                </div>
              </div>
            </div>

            {/* Aperçu des calculs */}
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6">
              <h3 className="text-sm font-medium text-blue-800 dark:text-blue-300 mb-3">
                Aperçu des calculs
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Pour 1h de travail</p>
                  <p className="text-lg font-bold text-gray-900 dark:text-white">
                    {formData.hourly_rate.toLocaleString()} {formData.currency}
                  </p>
                </div>
                <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Pour 100K tokens</p>
                  <p className="text-lg font-bold text-gray-900 dark:text-white">
                    {(formData.token_price * 100000).toLocaleString()} {formData.currency}
                  </p>
                </div>
              </div>
            </div>

            {/* Plan actuel */}
            <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl p-6 text-white">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold">Plan Gratuit</h3>
                  <p className="text-blue-100">Développeur Solo</p>
                </div>
                <Globe className="w-8 h-8 text-blue-200" />
              </div>
              <ul className="space-y-2 mb-4">
                <li className="flex items-center text-sm">
                  <Check className="w-4 h-4 mr-2" />
                  Projets illimités
                </li>
                <li className="flex items-center text-sm">
                  <Check className="w-4 h-4 mr-2" />
                  Suivi des sessions
                </li>
                <li className="flex items-center text-sm">
                  <Check className="w-4 h-4 mr-2" />
                  Dashboard analytique
                </li>
                <li className="flex items-center text-sm">
                  <Check className="w-4 h-4 mr-2" />
                  Exports PDF/CSV
                </li>
              </ul>
              <p className="text-sm text-blue-100 border-t border-blue-400 pt-4">
                Des plans payants pour équipes arrivent bientôt
              </p>
            </div>
          </div>
        )}

        {/* Tab Notifications */}
        {activeTab === 'notifications' && (
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Préférences de notification
            </h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition-colors">
                <div className="flex items-center space-x-3">
                  <Mail className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                  <div>
                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Notifications email</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Recevoir des notifications par email</p>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input 
                    type="checkbox" 
                    className="sr-only peer" 
                    checked={formData.email_notifications}
                    onChange={(e) => setFormData({ ...formData, email_notifications: e.target.checked })}
                  />
                  <div className="w-11 h-6 bg-gray-200 dark:bg-gray-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                </label>
              </div>

              <div className="flex items-center justify-between p-3 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition-colors">
                <div className="flex items-center space-x-3">
                  <Smartphone className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                  <div>
                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Notifications push</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Recevoir des notifications sur mobile</p>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input 
                    type="checkbox" 
                    className="sr-only peer"
                    checked={formData.push_notifications}
                    onChange={(e) => setFormData({ ...formData, push_notifications: e.target.checked })}
                  />
                  <div className="w-11 h-6 bg-gray-200 dark:bg-gray-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                </label>
              </div>

              <div className="flex items-center justify-between p-3 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition-colors">
                <div className="flex items-center space-x-3">
                  <Bell className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                  <div>
                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Rapport hebdomadaire</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Recevoir un résumé chaque semaine</p>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input 
                    type="checkbox" 
                    className="sr-only peer"
                    checked={formData.weekly_report}
                    onChange={(e) => setFormData({ ...formData, weekly_report: e.target.checked })}
                  />
                  <div className="w-11 h-6 bg-gray-200 dark:bg-gray-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                </label>
              </div>
            </div>
          </div>
        )}

        {/* Tab Sécurité */}
        {activeTab === 'security' && (
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Sécurité du compte
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Mot de passe actuel
                </label>
                <div className="relative">
                  <input
                    type={showCurrentPassword ? "text" : "password"}
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="********"
                    className="w-full px-4 py-2 pr-10 text-sm bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-white"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
                  >
                    {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Nouveau mot de passe
                </label>
                <div className="relative">
                  <input
                    type={showNewPassword ? "text" : "password"}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Nouveau mot de passe"
                    className="w-full px-4 py-2 pr-10 text-sm bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-white"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
                  >
                    {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Confirmer le mot de passe
                </label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirmer le mot de passe"
                    className="w-full px-4 py-2 pr-10 text-sm bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-white"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
                  >
                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="pt-4">
                <button
                  onClick={handleUpdatePassword}
                  className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                >
                  Mettre à jour le mot de passe
                </button>
              </div>

              <div className="border-t border-gray-200 dark:border-gray-700 pt-6 mt-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Shield className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                    <div>
                      <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        Authentification à deux facteurs (2FA)
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        Sécuriser votre compte avec une double authentification
                      </p>
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input 
                      type="checkbox" 
                      className="sr-only peer"
                      checked={formData.two_factor_auth}
                      onChange={(e) => setFormData({ ...formData, two_factor_auth: e.target.checked })}
                    />
                    <div className="w-11 h-6 bg-gray-200 dark:bg-gray-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                  </label>
                </div>
              </div>

              <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
                <div className="flex">
                  <AlertCircle className="w-5 h-5 text-yellow-600 dark:text-yellow-400 mr-2 flex-shrink-0" />
                  <div>
                    <p className="text-sm text-yellow-700 dark:text-yellow-300">
                      La 2FA sera disponible dans une prochaine version
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab API */}
        {activeTab === 'api' && (
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Clés API et intégrations IA
            </h2>
            <div className="space-y-6">
              {/* OpenAI */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  OpenAI API Key
                </label>
                <div className="flex space-x-2">
                  <div className="relative flex-1">
                    <input
                      type={showApiKey ? "text" : "password"}
                      value={apiKey}
                      onChange={(e) => setApiKey(e.target.value)}
                      placeholder="sk-..."
                      className="w-full px-4 py-2 pr-10 text-sm bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-white"
                    />
                    <button
                      type="button"
                      onClick={() => setShowApiKey(!showApiKey)}
                      className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
                    >
                      {showApiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  <button
                    onClick={saveApiKey}
                    disabled={savingApiKey || !apiKey}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {savingApiKey ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Sauvegarder'}
                  </button>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                  Utilisée pour le suivi automatique des tokens. Votre clé est stockée de façon sécurisée.
                </p>
              </div>

              {/* Autres intégrations */}
              <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
                <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-4">
                  Intégrations disponibles
                </h3>
                
                <div className="space-y-4">
                  {/* Supabase */}
                  <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                    <div className="flex items-center">
                      <svg className="w-5 h-5 text-green-600 dark:text-green-400 mr-3" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M11.9 22.6L6.7 17.3L1.4 22.6L0 21.2L5.3 15.9L0 10.6L1.4 9.2L6.7 14.5L12 9.2L13.4 10.6L8.1 15.9L13.4 21.2L11.9 22.6Z" />
                      </svg>
                      <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">Supabase</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          Base de données en temps réel
                        </p>
                      </div>
                    </div>
                    <span className="text-xs bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 px-2 py-1 rounded-full">
                      Connecté
                    </span>
                  </div>

                  {/* GitHub */}
                  <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg opacity-60">
                    <div className="flex items-center">
                      <Github className="w-5 h-5 text-gray-500 dark:text-gray-400 mr-3" />
                      <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">GitHub</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          Synchronisation des dépôts
                        </p>
                      </div>
                    </div>
                    <span className="text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 px-2 py-1 rounded-full">
                      Bientôt
                    </span>
                  </div>
                </div>
              </div>

              {/* Documentation API */}
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                <h4 className="text-sm font-medium text-blue-800 dark:text-blue-300 mb-2">
                  Documentation API
                </h4>
                <p className="text-sm text-blue-700 dark:text-blue-400 mb-3">
                  Accédez à notre API REST pour intégrer vos données
                </p>
                <button className="text-sm text-blue-600 dark:text-blue-400 hover:underline">
                  Voir la documentation →
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Bouton de sauvegarde global */}
      <div className="flex justify-end sticky bottom-6">
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed shadow-lg transition-colors"
        >
          {saving ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <Save className="w-4 h-4 mr-2" />
          )}
          {saving ? 'Sauvegarde...' : 'Sauvegarder les modifications'}
        </button>
      </div>
    </div>
  );
}