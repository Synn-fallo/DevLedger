import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './AuthContext';

interface Notification {
  id: string;
  project_id: string;
  project_name: string;
  invited_by_email: string;
  role: string;
  created_at: string;
}

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  markAsRead: (notificationId: string) => void;
  markAllAsRead: () => void;
  hasNewShares: boolean;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  // Simuler des notifications (à connecter à une vraie table notifications plus tard)
  useEffect(() => {
    if (!user) return;

    // Vérifier les nouvelles invitations
    const checkNewShares = async () => {
      const { data: shares } = await supabase
        .from('project_shares')
        .select(`
          id,
          project_id,
          invited_email,
          role,
          created_at,
          projects (name)
        `)
        .eq('invited_email', user.email)
        .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString());

      if (shares) {
        const notifs = shares.map(share => ({
          id: share.id,
          project_id: share.project_id,
          project_name: (share.projects as any)?.name || 'Projet',
          invited_by_email: share.added_by ? 'un utilisateur' : 'le propriétaire',
          role: share.role,
          created_at: share.created_at
        }));
        setNotifications(notifs);
        setUnreadCount(notifs.length);
      }
    };

    checkNewShares();

    // Écouter les nouvelles invitations en temps réel
    const subscription = supabase
      .channel('project_shares')
      .on('postgres_changes', 
        { event: 'INSERT', schema: 'public', table: 'project_shares', filter: `invited_email=eq.${user.email}` },
        (payload) => {
          checkNewShares();
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [user]);

  const markAsRead = (notificationId: string) => {
    setNotifications(prev => prev.filter(n => n.id !== notificationId));
    setUnreadCount(prev => Math.max(0, prev - 1));
  };

  const markAllAsRead = () => {
    setNotifications([]);
    setUnreadCount(0);
  };

  const hasNewShares = notifications.length > 0;

  return (
    <NotificationContext.Provider value={{
      notifications,
      unreadCount,
      markAsRead,
      markAllAsRead,
      hasNewShares
    }}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
}