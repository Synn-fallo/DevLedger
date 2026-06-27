import { useEffect, useState } from 'react';
import { AdminLayout } from '../../components/admin/AdminLayout';
import { DataTable } from '../../components/admin/DataTable';
import { supabase } from '../../lib/supabase';

interface Project {
  id: string;
  name: string;
  owner_email: string;
  status: string;
  visibility: string;
  created_at: string;
  sessions_count: number;
}

interface ProjectsListProps {
  currentPage?: string;
  onNavigate?: (page: string, id?: string) => void;
}

const statusLabels: Record<string, string> = {
  idea: 'Idée',
  development: 'En développement',
  paused: 'En pause',
  deployed: 'Déployé',
  archived: 'Archivé',
  abandoned: 'Abandonné'
};

const visibilityLabels: Record<string, string> = {
  private: '🔒 Privé',
  shared: '👥 Partagé',
  public: '🌍 Public'
};

export function ProjectsList({ currentPage, onNavigate }: ProjectsListProps) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = async () => {
    setLoading(true);
    
    const { data, error } = await supabase
      .from('admin_projects_view')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error loading projects:', error);
    } else if (data) {
      setProjects(data as Project[]);
    }
    
    setLoading(false);
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('fr-FR');
  };

  const columns = [
    { key: 'name' as const, header: 'Nom', sortable: true },
    { key: 'owner_email' as const, header: 'Propriétaire', sortable: true },
    { key: 'status' as const, header: 'Statut', sortable: true },
    { key: 'visibility' as const, header: 'Visibilité', sortable: true },
    { key: 'sessions_count' as const, header: 'Sessions', sortable: true },
    { key: 'created_at' as const, header: 'Créé le', sortable: true }
  ];

  if (loading) {
    return (
      <AdminLayout title="Projets" currentPage={currentPage} onNavigate={onNavigate}>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Projets" currentPage={currentPage} onNavigate={onNavigate}>
      <DataTable
        data={projects}
        columns={columns.map(col => ({
          ...col,
          render: (value: any, row: Project) => {
            if (col.key === 'status') {
              return statusLabels[value] || value;
            }
            if (col.key === 'visibility') {
              return visibilityLabels[value] || value;
            }
            if (col.key === 'created_at') {
              return formatDate(value);
            }
            return value;
          }
        }))}
        onRowClick={(row) => onNavigate?.('project', row.id)}
        searchPlaceholder="Rechercher par nom ou propriétaire..."
        searchFields={['name', 'owner_email']}
      />
    </AdminLayout>
  );
}