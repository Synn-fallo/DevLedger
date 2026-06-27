import { ReactNode } from 'react';
import { AdminSidebar } from './AdminSidebar';
import { AdminHeader } from './AdminHeader';
import { useAdmin } from '../../hooks/useAdmin';
import { Navigate } from 'react-router-dom';

interface AdminLayoutProps {
  children: ReactNode;
  title?: string;
  currentPage?: string;
  onNavigate?: (page: string) => void;
}

export function AdminLayout({ children, title, currentPage = 'admin_dashboard', onNavigate = () => {} }: AdminLayoutProps) {
  const { canAccessAdmin } = useAdmin();

  if (!canAccessAdmin) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="flex h-screen bg-gray-100 dark:bg-gray-950">
      <AdminSidebar currentPage={currentPage} onNavigate={onNavigate} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <AdminHeader title={title} />
        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>
      </div>
    </div>
  );
}