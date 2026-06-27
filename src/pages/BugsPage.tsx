import { useEffect, useState } from 'react';
import { Bug, TrendingUp, Clock, AlertCircle, CheckCircle, Plus } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { bugService } from '../services/bug.service';
import { BugList } from '../components/bugs/BugList';
import { BugDetailModal } from '../components/bugs/BugDetailModal';
import { BugForm } from '../components/bugs/BugForm';
import { BugFilters } from '../components/bugs/BugFilters';
import { storageService } from '../services/storage.service';
import type { BugReport, BugStatus, BugCategory } from '../lib/database.types';

interface BugsPageProps {
  onNavigate: (page: string, projectId?: string) => void;
}

export function BugsPage({ onNavigate }: BugsPageProps) {
  const { user } = useAuth();
  const [bugs, setBugs] = useState<BugReport[]>([]);
  const [filteredBugs, setFilteredBugs] = useState<BugReport[]>([]);
  const [projects, setProjects] = useState<Array<{ id: string; name: string }>>([]);
  const [loading, setLoading] = useState(true);
  const [selectedBug, setSelectedBug] = useState<BugReport | null>(null);
  const [showBugForm, setShowBugForm] = useState(false);
  const [editingBug, setEditingBug] = useState<BugReport | null>(null);
  
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<BugStatus | 'all'>('all');
  const [selectedCategory, setSelectedCategory] = useState<BugCategory | 'all'>('all');
  const [selectedDifficulty, setSelectedDifficulty] = useState<number | 'all'>('all');
  const [searchTerm, setSearchTerm] = useState('');

  const [stats, setStats] = useState({
    total: 0,
    open: 0,
    inProgress: 0,
    resolved: 0,
    closed: 0,
    avgDifficulty: 0,
    totalTimeSpent: 0
  });

  useEffect(() => {
    loadData();
  }, [user]);

  useEffect(() => {
    applyFilters();
  }, [bugs, selectedProjectId, selectedStatus, selectedCategory, selectedDifficulty, searchTerm]);

  const loadData = async () => {
    if (!user) return;
    setLoading(true);

    const { data: userProjects } = await supabase
      .from('projects')
      .select('id, name')
      .eq('user_id', user.id);
    setProjects(userProjects || []);

    const bugsData = await bugService.getBugsByUser(user.id);
    setBugs(bugsData);

    const open = bugsData.filter(b => b.status === 'open').length;
    const inProgress = bugsData.filter(b => b.status === 'in_progress').length;
    const resolved = bugsData.filter(b => b.status === 'resolved').length;
    const closed = bugsData.filter(b => b.status === 'closed').length;
    
    const bugsWithDifficulty = bugsData.filter(b => b.difficulty !== null);
    const avgDifficulty = bugsWithDifficulty.length > 0
      ? bugsWithDifficulty.reduce((sum, b) => sum + (b.difficulty || 0), 0) / bugsWithDifficulty.length
      : 0;
    
    const totalTimeSpent = bugsData.reduce((sum, b) => sum + (b.actual_time_minutes || 0), 0);

    setStats({
      total: bugsData.length,
      open,
      inProgress,
      resolved,
      closed,
      avgDifficulty,
      totalTimeSpent
    });

    setLoading(false);
  };

  const applyFilters = () => {
    let filtered = [...bugs];

    if (selectedProjectId) {
      filtered = filtered.filter(b => b.project_id === selectedProjectId);
    }

    if (selectedStatus !== 'all') {
      filtered = filtered.filter(b => b.status === selectedStatus);
    }

    if (selectedCategory !== 'all') {
      filtered = filtered.filter(b => b.category === selectedCategory);
    }

    if (selectedDifficulty !== 'all') {
      filtered = filtered.filter(b => b.difficulty === selectedDifficulty);
    }

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(b =>
        b.title.toLowerCase().includes(term) ||
        b.description.toLowerCase().includes(term)
      );
    }

    setFilteredBugs(filtered);
  };

  const resetFilters = () => {
    setSelectedProjectId(null);
    setSelectedStatus('all');
    setSelectedCategory('all');
    setSelectedDifficulty('all');
    setSearchTerm('');
  };

  const getProjectName = (projectId: string) => {
    const project = projects.find(p => p.id === projectId);
    return project?.name || 'Projet inconnu';
  };

  const handleViewDetails = (bug: BugReport) => {
    setSelectedBug(bug);
  };

  const handleEdit = (bug: BugReport) => {
    setEditingBug(bug);
    setShowBugForm(true);
  };

  const handleCreate = () => {
    setEditingBug(null);
    setShowBugForm(true);
  };

  const handleSaveBug = async (data: any) => {
    if (editingBug) {
      await bugService.updateBug(editingBug.id, data);
    } else {
      await bugService.createBug(data);
    }
    setShowBugForm(false);
    setEditingBug(null);
    loadData();
  };

  const handleDeleteBug = async (bugId: string) => {
    await bugService.deleteBug(bugId);
    loadData();
  };

  const formatTimeDisplay = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours === 0) return `${mins} min`;
    return `${hours}h ${mins}m`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Chargement des bugs...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* En-tête */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Bug className="w-8 h-8 text-red-500" />
            Gestion des bugs
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Suivez et gérez tous les bugs de vos projets
          </p>
        </div>
        <button
          onClick={handleCreate}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
        >
          <Plus className="w-5 h-5" />
          Nouveau rapport
        </button>
      </div>

      {/* Statistiques */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700 text-center">
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.total}</p>
          <p className="text-xs text-gray-500">Total</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700 text-center">
          <p className="text-2xl font-bold text-red-600 dark:text-red-400">{stats.open}</p>
          <p className="text-xs text-gray-500">Ouverts</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700 text-center">
          <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">{stats.inProgress}</p>
          <p className="text-xs text-gray-500">En cours</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700 text-center">
          <p className="text-2xl font-bold text-green-600 dark:text-green-400">{stats.resolved}</p>
          <p className="text-xs text-gray-500">Résolus</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700 text-center">
          <p className="text-2xl font-bold text-gray-500">{stats.closed}</p>
          <p className="text-xs text-gray-500">Fermés</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700 text-center">
          <div className="flex items-center justify-center gap-1">
            <TrendingUp className="w-4 h-4 text-gray-500" />
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.avgDifficulty.toFixed(1)}</p>
          </div>
          <p className="text-xs text-gray-500">Difficulté moyenne</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700 text-center">
          <div className="flex items-center justify-center gap-1">
            <Clock className="w-4 h-4 text-gray-500" />
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{formatTimeDisplay(stats.totalTimeSpent)}</p>
          </div>
          <p className="text-xs text-gray-500">Temps total</p>
        </div>
      </div>

      {/* Filtres */}
      <BugFilters
        projects={projects}
        selectedProjectId={selectedProjectId}
        onProjectChange={setSelectedProjectId}
        selectedStatus={selectedStatus}
        onStatusChange={setSelectedStatus}
        selectedCategory={selectedCategory}
        onCategoryChange={setSelectedCategory}
        selectedDifficulty={selectedDifficulty}
        onDifficultyChange={setSelectedDifficulty}
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        onReset={resetFilters}
      />

      {/* Liste des bugs */}
      <BugList
        bugs={filteredBugs}
        onEdit={handleEdit}
        onDelete={handleDeleteBug}
        onViewDetails={handleViewDetails}
        canEdit={true}
        onAdd={handleCreate}
        showProjectName={true}
        getProjectName={getProjectName}
      />

      {/* Modal de détails */}
      {selectedBug && (
        <BugDetailModal
          bug={selectedBug}
          projectName={getProjectName(selectedBug.project_id)}
          onClose={() => setSelectedBug(null)}
          onEdit={() => {
            setSelectedBug(null);
            handleEdit(selectedBug);
          }}
        />
      )}

      {/* Formulaire de création/édition */}
      {showBugForm && (
        <BugForm
          bug={editingBug}
          projectId={editingBug?.project_id || (projects[0]?.id || '')}
          onClose={() => {
            setShowBugForm(false);
            setEditingBug(null);
          }}
          onSave={handleSaveBug}
        />
      )}
    </div>
  );
}