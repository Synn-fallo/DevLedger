import { useState, useEffect } from 'react';
import { Bell, X, Check, Users } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

interface Notification {
  id: string;
  project_id: string;
  project_name: string;
  role: string;
  created_at: string;
}

interface NotificationBellProps {
  onNavigate: (page: string, projectId?: string) => void;
}

export function NotificationBell({ onNavigate }: NotificationBellProps) {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [readNotifications, setReadNotifications] = useState<Set<string>>(new Set());

  // Charger les invitations
  useEffect(() => {
    if (!user) return;

    const loadInvitations = async () => {
      const { data: shares } = await supabase
        .from('project_shares')
        .select(`
          id,
          project_id,
          role,
          created_at,
          projects (name)
        `)
        .eq('invited_email', user.email);

      if (shares) {
        const notifs = shares.map(share => ({
          id: share.id,
          project_id: share.project_id,
          project_name: (share.projects as any)?.name || 'Projet',
          role: share.role,
          created_at: share.created_at
        }));
        setNotifications(notifs);
        
        // Compter les non lues
        const storedRead = localStorage.getItem(`read_shares_${user.id}`);
        const readSet = new Set(storedRead ? JSON.parse(storedRead) : []);
        setReadNotifications(readSet);
        
        const unread = notifs.filter(n => !readSet.has(n.id)).length;
        setUnreadCount(unread);
      }
    };

    loadInvitations();

    // Écouter les nouvelles invitations
    const subscription = supabase
      .channel('project_shares')
      .on('postgres_changes', 
        { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'project_shares',
          filter: `invited_email=eq.${user.email}`
        },
        () => {
          loadInvitations();
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [user]);

  const markAsRead = (notificationId: string) => {
    const newReadSet = new Set(readNotifications);
    newReadSet.add(notificationId);
    setReadNotifications(newReadSet);
    
    if (user) {
      localStorage.setItem(`read_shares_${user.id}`, JSON.stringify([...newReadSet]));
    }
    
    setUnreadCount(prev => Math.max(0, prev - 1));
  };

  const markAllAsRead = () => {
    const allIds = notifications.map(n => n.id);
    const newReadSet = new Set([...readNotifications, ...allIds]);
    setReadNotifications(newReadSet);
    
    if (user) {
      localStorage.setItem(`read_shares_${user.id}`, JSON.stringify([...newReadSet]));
    }
    
    setUnreadCount(0);
  };

  const handleNotificationClick = (notificationId: string, projectId: string) => {
    markAsRead(notificationId);
    setIsOpen(false);
    onNavigate('project', projectId);
  };

  if (notifications.length === 0) {
    return null;
  }

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 inline-flex items-center justify-center w-4 h-4 text-xs font-bold text-white bg-red-500 rounded-full">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 z-20">
            <div className="flex items-center justify-between p-3 border-b border-gray-200 dark:border-gray-700">
              <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <Users className="w-4 h-4" />
                Invitations
              </h3>
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
                >
                  Tout marquer comme lu
                </button>
              )}
            </div>

            <div className="max-h-96 overflow-y-auto">
              {notifications.length === 0 ? (
                <p className="text-center text-gray-500 dark:text-gray-400 py-8">
                  Aucune invitation
                </p>
              ) : (
                notifications.map((notif) => {
                  const isRead = readNotifications.has(notif.id);
                  
                  return (
                    <button
                      key={notif.id}
                      onClick={() => handleNotificationClick(notif.id, notif.project_id)}
                      className={`w-full text-left p-3 hover:bg-gray-50 dark:hover:bg-gray-700 border-b border-gray-100 dark:border-gray-700 transition-colors ${
                        !isRead ? 'bg-blue-50 dark:bg-blue-900/20' : ''
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className="flex-1">
                          <p className="text-sm text-gray-900 dark:text-white">
                            Vous avez été invité à collaborer sur
                            <span className="font-semibold"> {notif.project_name}</span>
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                            Rôle : {notif.role === 'editor' ? '✏️ Éditeur' : '👁️ Lecteur'}
                          </p>
                          <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                            {new Date(notif.created_at).toLocaleDateString('fr-FR', {
                              day: 'numeric',
                              month: 'short',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </p>
                        </div>
                        {!isRead && (
                          <div className="w-2 h-2 bg-blue-500 rounded-full mt-2" />
                        )}
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}