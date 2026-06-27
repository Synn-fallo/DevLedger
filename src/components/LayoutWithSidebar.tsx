import { ReactNode } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Layout } from './Layout';
import { PublicLayout } from './PublicLayout';

interface LayoutWithSidebarProps {
  children: ReactNode;
  currentPage?: string;
  onNavigate?: (page: string, id?: string) => void;
}

export function LayoutWithSidebar({ children, currentPage, onNavigate }: LayoutWithSidebarProps) {
  const { user } = useAuth();

  // Si l'utilisateur est connecté, on utilise le Layout complet avec Sidebar
  if (user) {
    return (
      <Layout currentPage={currentPage || 'public'} onNavigate={onNavigate || (() => {})}>
        {children}
      </Layout>
    );
  }

  // Sinon, on utilise le PublicLayout (sans Sidebar)
  return <PublicLayout>{children}</PublicLayout>;
}