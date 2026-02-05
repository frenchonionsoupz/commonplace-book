import { useState } from 'react';
import { X, Save, Feather } from 'lucide-react';
import { Note } from '../types';

interface Props {
  note?: Note;
  onSave: (data: Partial<Note>) => Promise<void>;
  onCancel: () => void;
}

export default function NoteEditor({ note, onSave, onCancel }: Props) {
  const existingContent = note?.content || note?.transcription || '';
  const [content, setContent] = useState(existingContent);
  const [tagsInput, setTagsInput] = useState(note?.tags.join(', ') || '');
  const [saving, setSaving] = useState(false);

  const isEditing = Boolean(note);

  const handleSave = async () => {
    if (!content.trim()) return;

    setSaving(true);
    try {
      const tags = tagsInput
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean);

      const data: Partial<Note> = {
        title: content.slice(0, 100).trim(),
        content: content.trim(),
        tags,
        is_public: note?.is_public ?? true,
      };

      if (!isEditing) {
        data.type = 'text';
        data.source = '';
        data.source_type = '';
        data.media_url = '';
        data.transcription = '';
      }

      await onSave(data);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="card p-6 border-l-4 border-l-amber-600">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2 text-amber-800">
          <Feather className="w-5 h-5" />
          <h2 className="text-lg font-semibold font-serif">
            {isEditing ? 'Edit Entry' : 'New Entry'}
          </h2>
        </div>
        <button onClick={onCancel} className="btn-icon">
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="space-y-4">
        <div>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Write your thoughts, quotes, or reflections here..."
            className="textarea min-h-[200px] leading-relaxed font-serif text-base"
            rows={8}
            autoFocus
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-ink-600 mb-1">
            Tags <span className="font-normal text-ink-400">(optional, comma-separated)</span>
          </label>
          <input
            type="text"
            value={tagsInput}
            onChange={(e) => setTagsInput(e.target.value)}
            placeholder="philosophy, stoicism, productivity"
            className="input"
          />
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <button onClick={onCancel} className="btn-secondary">
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={!content.trim() || saving}
            className="btn-primary flex items-center gap-2 disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            {saving ? 'Saving...' : isEditing ? 'Update' : 'Save Entry'}
          </button>
        </div>
      </div>
    </div>
  );
}
