import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './AuthContext';

interface SettingsContextType {
  settings: {
    hourly_rate: number;
    token_price: number;
    currency: string;
    display_mode: 'simple' | 'advanced';
    theme: 'dark' | 'light';
    subscription_plan: 'free' | 'pro' | 'enterprise';
    projects_limit: number | null;
    collaborators_limit: number | null;
    stats_period_type: 'calendar' | 'rolling';
  };
  updateSettings: (newSettings: Partial<SettingsContextType['settings']>) => Promise<void>;
  loading: boolean;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export function SettingsProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [settings, setSettings] = useState<SettingsContextType['settings']>({
    hourly_rate: 5000,
    token_price: 0.00001,
    currency: 'XOF',
    display_mode: 'simple',
    theme: 'dark',
    subscription_plan: 'free',
    projects_limit: 10,
    collaborators_limit: 2,
    stats_period_type: 'calendar'
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSettings();
  }, [user]);

  const loadSettings = async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from('users_settings')
      .select('*')
      .eq('id', user.id)
      .single();

    if (error) {
      console.error('Error loading settings:', error);
    } else if (data) {
      setSettings({
        hourly_rate: data.hourly_rate,
        token_price: data.token_price,
        currency: data.currency,
        display_mode: data.display_mode,
        theme: data.theme,
        subscription_plan: data.subscription_plan || 'free',
        projects_limit: data.projects_limit,
        collaborators_limit: data.collaborators_limit,
        stats_period_type: (data as any).stats_period_type || 'calendar'
      });
    }
    setLoading(false);
  };

  const updateSettings = async (newSettings: Partial<SettingsContextType['settings']>) => {
    if (!user) return;

    const { error } = await supabase
      .from('users_settings')
      .update(newSettings)
      .eq('id', user.id);

    if (!error) {
      setSettings(prev => ({ ...prev, ...newSettings }));
    }
  };

  return (
    <SettingsContext.Provider value={{ settings, updateSettings, loading }}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
}