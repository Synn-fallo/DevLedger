// /src/contexts/ThemeContext.tsx
import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './AuthContext';

type Theme = 'dark' | 'light';

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => Promise<void>;
  setTheme: (theme: Theme) => Promise<void>;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>('dark');
  const { user } = useAuth();

  // Appliquer le thème au DOM
  const applyTheme = useCallback((newTheme: Theme) => {
    console.log('Applying theme:', newTheme);
    if (newTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('devledger_theme', newTheme);
  }, []);

  // Charger le thème au démarrage
  useEffect(() => {
    const loadTheme = async () => {
      console.log('Loading theme...');
      
      // 1. D'abord depuis localStorage (immédiat)
      const savedTheme = localStorage.getItem('devledger_theme') as Theme | null;
      if (savedTheme && (savedTheme === 'dark' || savedTheme === 'light')) {
        console.log('Theme from localStorage:', savedTheme);
        setThemeState(savedTheme);
        applyTheme(savedTheme);
      }

      // 2. Ensuite depuis la base si utilisateur connecté
      if (user) {
        try {
          const { data, error } = await supabase
            .from('users_settings')
            .select('theme')
            .eq('id', user.id)
            .maybeSingle();
          
          if (!error && data?.theme) {
            console.log('Theme from database:', data.theme);
            setThemeState(data.theme);
            applyTheme(data.theme);
          }
        } catch (error) {
          console.error('Error loading theme from DB:', error);
        }
      }
    };

    loadTheme();
  }, [user, applyTheme]);

  const toggleTheme = useCallback(async () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    console.log('Toggling theme to:', newTheme);
    
    setThemeState(newTheme);
    applyTheme(newTheme);

    if (user) {
      try {
        await supabase
          .from('users_settings')
          .update({ theme: newTheme, updated_at: new Date() })
          .eq('id', user.id);
        console.log('Theme saved to database');
      } catch (error) {
        console.error('Error saving theme to database:', error);
      }
    }
  }, [theme, user, applyTheme]);

  const setTheme = useCallback(async (newTheme: Theme) => {
    if (newTheme !== theme) {
      console.log('Setting theme to:', newTheme);
      setThemeState(newTheme);
      applyTheme(newTheme);

      if (user) {
        try {
          await supabase
            .from('users_settings')
            .update({ theme: newTheme, updated_at: new Date() })
            .eq('id', user.id);
          console.log('Theme saved to database');
        } catch (error) {
          console.error('Error saving theme to database:', error);
        }
      }
    }
  }, [theme, user, applyTheme]);

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}