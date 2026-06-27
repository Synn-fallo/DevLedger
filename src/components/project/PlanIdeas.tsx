import { useState } from 'react';
import { Plus, Edit2, Trash2, CheckCircle, Circle } from 'lucide-react';
import { PlanIdeasModal } from './PlanIdeasModal';

interface Idea {
  id: string;
  title: string;
  description: string;
  status: 'todo' | 'in_progress' | 'done' | 'abandoned';
  created_at: string;
}

interface PlanIdeasProps {
  projectId: string;
  ideas: Idea[];
  isOwner: boolean;
  onUpdate: (ideas: Idea[]) => void;
}

const statusLabels = {
  todo: { label: 'À faire', color: 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300' },
  in_progress: { label: 'En cours', color: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300' },
  done: { label: 'Fait', color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300' },
  abandoned: { label: 'Abandonné', color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300' }
};

export function PlanIdeas({ projectId, ideas, isOwner, onUpdate }: PlanIdeasProps) {
  const [showModal, setShowModal] = useState(false);
  const [editingIdea, setEditingIdea] = useState<Idea | null>(null);

  const handleAdd = () => {
    setEditingIdea(null);
    setShowModal(true);
  };

  const handleEdit = (idea: Idea) => {
    setEditingIdea(idea);
    setShowModal(true);
  };

  const handleDelete = async (ideaId: string) => {
    if (!confirm('Supprimer cette idée ?')) return;
    const newIdeas = ideas.filter(i => i.id !== ideaId);
    onUpdate(newIdeas);
  };

  const handleSave = (idea: Omit<Idea, 'id' | 'created_at'>) => {
    if (editingIdea) {
      const newIdeas = ideas.map(i =>
        i.id === editingIdea.id ? { ...i, ...idea } : i
      );
      onUpdate(newIdeas);
    } else {
      const newIdea: Idea = {
        id: Date.now().toString(),
        ...idea,
        created_at: new Date().toISOString()
      };
      onUpdate([...ideas, newIdea]);
    }
    setShowModal(false);
    setEditingIdea(null);
  };

  const updateStatus = async (ideaId: string, newStatus: Idea['status']) => {
    const newIdeas = ideas.map(i =>
      i.id === ideaId ? { ...i, status: newStatus } : i
    );
    onUpdate(newIdeas);
  };

  return (
    <div className="space-y-3">
      {isOwner && (
        <button
          onClick={handleAdd}
          className="flex items-center gap-2 px-3 py-1.5 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
        >
          <Plus className="w-4 h-4" />
          Ajouter une idée
        </button>
      )}

      {ideas.length === 0 ? (
        <p className="text-center text-gray-500 py-4">Aucune idée pour le moment.</p>
      ) : (
        <div className="space-y-3">
          {ideas.map((idea) => (
            <div key={idea.id} className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h4 className="font-medium text-gray-900 dark:text-white">{idea.title}</h4>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${statusLabels[idea.status].color}`}>
                      {statusLabels[idea.status].label}
                    </span>
                  </div>
                  {idea.description && (
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{idea.description}</p>
                  )}
                  <p className="text-xs text-gray-400 mt-1">
                    Créé le {new Date(idea.created_at).toLocaleDateString('fr-FR')}
                  </p>
                </div>
                <div className="flex items-center gap-1">
                  <select
                    value={idea.status}
                    onChange={(e) => updateStatus(idea.id, e.target.value as Idea['status'])}
                    className="text-xs border border-gray-300 dark:border-gray-600 rounded px-2 py-1 bg-white dark:bg-gray-700"
                  >
                    <option value="todo">À faire</option>
                    <option value="in_progress">En cours</option>
                    <option value="done">Fait</option>
                    <option value="abandoned">Abandonné</option>
                  </select>
                  {isOwner && (
                    <>
                      <button
                        onClick={() => handleEdit(idea)}
                        className="p-1 text-gray-500 hover:text-blue-600 rounded"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(idea.id)}
                        className="p-1 text-gray-500 hover:text-red-600 rounded"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <PlanIdeasModal
          idea={editingIdea}
          onClose={() => {
            setShowModal(false);
            setEditingIdea(null);
          }}
          onSave={handleSave}
        />
      )}
    </div>
  );
}