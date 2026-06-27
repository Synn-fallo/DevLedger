import { ReactNode, useState } from 'react';
import { Sidebar } from './Sidebar';
import { Menu, User } from 'lucide-react';
import { NotificationBell } from './NotificationBell';
import { Footer } from './Footer';

interface LayoutProps {
  children: ReactNode;
  currentPage: string;
  onNavigate: (page: string) => void;
}

export function Layout({ children, currentPage, onNavigate }: LayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex flex-col h-screen bg-gray-50 dark:bg-gray-950">
      <div className="flex flex-1 overflow-hidden">
        <Sidebar
          currentPage={currentPage}
          onNavigate={onNavigate}
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
        />

        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Header : visible sur tous les écrans */}
          <header className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 px-4 py-3 flex-shrink-0">
            <div className="flex items-center justify-between">
              {/* Bouton menu (visible sur mobile) */}
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setSidebarOpen(true)}
                  className="lg:hidden p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"
                >
                  <Menu className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                </button>
                <h1 className="text-xl font-semibold text-gray-900 dark:text-white lg:hidden">
                  DevLedger
                </h1>
              </div>

              {/* Zone droite : cloche + profil */}
              <div className="flex items-center gap-2">
                <NotificationBell onNavigate={onNavigate} />
                
                <button
                  onClick={() => onNavigate('profile')}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                  title="Profil"
                >
                  <User className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                </button>
              </div>
            </div>
          </header>

          <main className="flex-1 overflow-y-auto">
            {children}
          </main>
        </div>
      </div>
      
      {/* Footer */}
      <Footer />
    </div>
  );
}