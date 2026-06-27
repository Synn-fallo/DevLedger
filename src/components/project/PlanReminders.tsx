import { useState } from 'react';
import { Plus, Edit2, Trash2, CheckCircle, Circle, Calendar } from 'lucide-react';
import { PlanRemindersModal } from './PlanRemindersModal';

interface Reminder {
  id: string;
  title: string;
  description: string | null;
  due_date: string;
  is_completed: boolean;
  created_at: string;
}

interface PlanRemindersProps {
  projectId: string;
  reminders: Reminder[];
  isOwner: boolean;
  onUpdate: (reminders: Reminder[]) => void;
}

export function PlanReminders({ projectId, reminders, isOwner, onUpdate }: PlanRemindersProps) {
  const [showModal, setShowModal] = useState(false);
  const [editingReminder, setEditingReminder] = useState<Reminder | null>(null);

  const handleAdd = () => {
    setEditingReminder(null);
    setShowModal(true);
  };

  const handleEdit = (reminder: Reminder) => {
    setEditingReminder(reminder);
    setShowModal(true);
  };

  const handleDelete = async (reminderId: string) => {
    if (!confirm('Supprimer ce rappel ?')) return;
    const newReminders = reminders.filter(r => r.id !== reminderId);
    onUpdate(newReminders);
  };

  const handleToggleComplete = async (reminderId: string, completed: boolean) => {
    const newReminders = reminders.map(r =>
      r.id === reminderId ? { ...r, is_completed: completed } : r
    );
    onUpdate(newReminders);
  };

  const handleSave = (reminder: Omit<Reminder, 'id' | 'created_at'>) => {
    if (editingReminder) {
      const newReminders = reminders.map(r =>
        r.id === editingReminder.id ? { ...r, ...reminder } : r
      );
      onUpdate(newReminders);
    } else {
      const newReminder: Reminder = {
        id: Date.now().toString(),
        ...reminder,
        created_at: new Date().toISOString()
      };
      onUpdate([...reminders, newReminder]);
    }
    setShowModal(false);
    setEditingReminder(null);
  };

  const formatDueDate = (date: string) => {
    const d = new Date(date);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    if (d.toDateString() === today.toDateString()) return "Aujourd'hui";
    if (d.toDateString() === tomorrow.toDateString()) return "Demain";
    return d.toLocaleDateString('fr-FR');
  };

  const isOverdue = (date: string) => {
    return new Date(date) < new Date() && !reminders.find(r => r.due_date === date)?.is_completed;
  };

  return (
    <div className="space-y-3">
      {isOwner && (
        <button
          onClick={handleAdd}
          className="flex items-center gap-2 px-3 py-1.5 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
        >
          <Plus className="w-4 h-4" />
          Ajouter un rappel
        </button>
      )}

      {reminders.length === 0 ? (
        <p className="text-center text-gray-500 py-4">Aucun rappel.</p>
      ) : (
        <div className="space-y-2">
          {reminders.map((reminder) => (
            <div key={reminder.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
              <div className="flex items-center gap-3 flex-1">
                <button
                  onClick={() => handleToggleComplete(reminder.id, !reminder.is_completed)}
                  className="text-gray-500 hover:text-green-600"
                >
                  {reminder.is_completed ? (
                    <CheckCircle className="w-5 h-5 text-green-500" />
                  ) : (
                    <Circle className="w-5 h-5" />
                  )}
                </button>
                <div className="flex-1">
                  <p className={`text-sm font-medium ${reminder.is_completed ? 'text-gray-400 line-through' : 'text-gray-900 dark:text-white'}`}>
                    {reminder.title}
                  </p>
                  {reminder.description && (
                    <p className="text-xs text-gray-500 mt-0.5">{reminder.description}</p>
                  )}
                  <div className="flex items-center gap-2 mt-1">
                    <Calendar className="w-3 h-3 text-gray-400" />
                    <span className={`text-xs ${isOverdue(reminder.due_date) && !reminder.is_completed ? 'text-red-500' : 'text-gray-500'}`}>
                      {formatDueDate(reminder.due_date)}
                    </span>
                  </div>
                </div>
              </div>
              {isOwner && (
                <div className="flex gap-1">
                  <button
                    onClick={() => handleEdit(reminder)}
                    className="p-1 text-gray-500 hover:text-blue-600 rounded"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(reminder.id)}
                    className="p-1 text-gray-500 hover:text-red-600 rounded"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <PlanRemindersModal
          reminder={editingReminder}
          onClose={() => {
            setShowModal(false);
            setEditingReminder(null);
          }}
          onSave={handleSave}
        />
      )}
    </div>
  );
}