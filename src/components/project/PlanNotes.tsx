import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Save, Edit2 } from 'lucide-react';

interface PlanNotesProps {
  projectId: string;
  initialNotes: string | null;
  isOwner: boolean;
  onUpdate: (notes: string) => void;
}

export function PlanNotes({ projectId, initialNotes, isOwner, onUpdate }: PlanNotesProps) {
  const [notes, setNotes] = useState(initialNotes || '');
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!isOwner) return;
    setSaving(true);
    const { error } = await supabase
      .from('projects')
      .update({ plan_notes: notes })
      .eq('id', projectId);
    
    if (!error) {
      onUpdate(notes);
      setIsEditing(false);
    }
    setSaving(false);
  };

  if (!isOwner && !notes) {
    return (
      <div className="text-center py-8 text-gray-500 dark:text-gray-400">
        Aucune note disponible.
      </div>
    );
  }

  if (isEditing && isOwner) {
    return (
      <div className="space-y-3">
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={6}
          className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 font-mono text-sm"
          placeholder="Ajoutez vos notes ici..."
        />
        <div className="flex gap-2">
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            {saving ? 'Enregistrement...' : 'Enregistrer'}
          </button>
          <button
            onClick={() => {
              setNotes(initialNotes || '');
              setIsEditing(false);
            }}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
          >
            Annuler
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="prose dark:prose-invert max-w-none">
        {notes ? (
          <div className="whitespace-pre-wrap text-gray-700 dark:text-gray-300">{notes}</div>
        ) : (
          <p className="text-gray-500 italic">Aucune note.</p>
        )}
      </div>
      {isOwner && (
        <button
          onClick={() => setIsEditing(true)}
          className="mt-3 flex items-center gap-1 text-sm text-blue-600 dark:text-blue-400 hover:underline"
        >
          <Edit2 className="w-3 h-3" />
          Modifier les notes
        </button>
      )}
    </div>
  );
}