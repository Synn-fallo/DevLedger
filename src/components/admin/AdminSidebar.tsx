import { useState } from 'react';
import { 
  LayoutDashboard, 
  Users, 
  FolderKanban, 
  CreditCard, 
  Settings, 
  FileText, 
  LogOut,
  Menu,
  X,
  Home,
  TrendingUp  // NOUVEAU - icône pour la comptabilité
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

interface AdminSidebarProps {
  currentPage: string;
  onNavigate: (page: string) => void;
  onClose?: () => void;
}

const menuItems = [
  { id: 'admin_dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'admin_users', label: 'Utilisateurs', icon: Users },
  { id: 'admin_projects', label: 'Projets', icon: FolderKanban },
  { id: 'admin_subscriptions', label: 'Abonnements', icon: CreditCard },
  { id: 'admin_financial', label: 'Comptabilité', icon: TrendingUp }, // NOUVEAU
  { id: 'admin_logs', label: 'Logs', icon: FileText },
  { id: 'admin_settings', label: 'Configuration', icon: Settings },
];

export function AdminSidebar({ currentPage, onNavigate, onClose: externalOnClose }: AdminSidebarProps) {
  const [isOpen, setIsOpen] = useState(true);
  const { signOut } = useAuth();

  const handleNavigate = (pageId: string) => {
    onNavigate(pageId);
    setIsOpen(false);
    if (externalOnClose) externalOnClose();
  };

  const handleSignOut = async () => {
    await signOut();
    window.location.href = '/';
  };

  const handleGoToSite = () => {
    window.location.href = '/dashboard';
  };

  const closeSidebar = () => {
    setIsOpen(false);
    if (externalOnClose) externalOnClose();
  };

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={closeSidebar}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed lg:static inset-y-0 left-0 z-50
        w-64 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800
        transform transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        <div className="flex flex-col h-full">
          {/* En-tête */}
          <div className="p-4 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold text-gray-900 dark:text-white">Admin</h1>
              <p className="text-xs text-gray-500">DevLedger</p>
            </div>
            <button
              onClick={closeSidebar}
              className="lg:hidden p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"
            >
              <X className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentPage === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleNavigate(item.id)}
                  className={`
                    w-full flex items-center gap-3 px-4 py-3 rounded-lg
                    transition-colors duration-200
                    ${isActive
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                    }
                  `}
                >
                  <Icon className="w-5 h-5" />
                  <span className="font-medium">{item.label}</span>
                </button>
              );
            })}
          </nav>

          {/* Footer */}
          <div className="p-4 border-t border-gray-200 dark:border-gray-800 space-y-2">
            <button
              onClick={handleGoToSite}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-lg
                       text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800
                       transition-colors duration-200"
            >
              <Home className="w-5 h-5" />
              <span className="font-medium">Retour au site</span>
            </button>
            <button
              onClick={handleSignOut}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-lg
                       text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20
                       transition-colors duration-200"
            >
              <LogOut className="w-5 h-5" />
              <span className="font-medium">Déconnexion</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Bouton pour ouvrir sur mobile */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="lg:hidden fixed bottom-4 left-4 z-40 p-3 bg-blue-600 text-white rounded-full shadow-lg"
        >
          <Menu className="w-5 h-5" />
        </button>
      )}
    </>
  );
}