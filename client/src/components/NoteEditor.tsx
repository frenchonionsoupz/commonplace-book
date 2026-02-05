import { useState } from 'react';
import { X, Save, Feather, FileText, Mic, Video, ArrowLeft } from 'lucide-react';
import { Note } from '../types';

type EntryType = 'text' | 'voice' | 'screen';

interface Props {
  note?: Note;
  onSave: (data: Partial<Note>) => Promise<void>;
  onCancel: () => void;
}

export default function NoteEditor({ note, onSave, onCancel }: Props) {
  const isEditing = Boolean(note);
  
  const [selectedType, setSelectedType] = useState<EntryType | null>(
    isEditing ? (note?.type as EntryType || 'text') : null
  );
  const existingContent = note?.content || note?.transcription || '';
  const [content, setContent] = useState(existingContent);
  const [source, setSource] = useState(note?.source || '');
  const [tagsInput, setTagsInput] = useState(note?.tags.join(', ') || '');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!content.trim() || !selectedType) return;

    setSaving(true);
    try {
      const tags = tagsInput
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean);

      const data: Partial<Note> = {
        title: content.slice(0, 100).trim(),
        content: content.trim(),
        source: source.trim(),
        tags,
        is_public: note?.is_public ?? true,
      };

      if (!isEditing) {
        data.type = selectedType;
        data.source_type = '';
        data.media_url = '';
        data.transcription = '';
      }

      await onSave(data);
    } finally {
      setSaving(false);
    }
  };

  const typeOptions: { type: EntryType; icon: typeof FileText; label: string; description: string }[] = [
    { type: 'text', icon: FileText, label: 'Text', description: 'Write notes directly' },
    { type: 'voice', icon: Mic, label: 'Voice', description: 'Record audio notes' },
    { type: 'screen', icon: Video, label: 'Video', description: 'Upload video content' },
  ];

  if (!selectedType && !isEditing) {
    return (
      <div className="card p-6 border-l-4 border-l-amber-600">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2 text-amber-800">
            <Feather className="w-5 h-5" />
            <h2 className="text-lg font-semibold font-serif">New Entry</h2>
          </div>
          <button onClick={onCancel} className="btn-icon">
            <X className="w-5 h-5" />
          </button>
        </div>

        <p className="text-ink-600 mb-6 text-center font-serif">
          What type of entry would you like to create?
        </p>

        <div className="grid grid-cols-3 gap-4">
          {typeOptions.map(({ type, icon: Icon, label, description }) => (
            <button
              key={type}
              onClick={() => setSelectedType(type)}
              className="flex flex-col items-center p-6 rounded-lg border-2 border-amber-200 bg-amber-50/50 hover:border-amber-400 hover:bg-amber-100/50 transition-all group"
            >
              <div className="w-14 h-14 rounded-full bg-amber-100 flex items-center justify-center mb-3 group-hover:bg-amber-200 transition-colors">
                <Icon className="w-7 h-7 text-amber-700" />
              </div>
              <span className="font-semibold text-ink-800 font-serif">{label}</span>
              <span className="text-xs text-ink-500 mt-1 text-center">{description}</span>
            </button>
          ))}
        </div>
      </div>
    );
  }

  const selectedTypeInfo = typeOptions.find(t => t.type === selectedType);
  const SelectedIcon = selectedTypeInfo?.icon || FileText;

  return (
    <div className="card p-6 border-l-4 border-l-amber-600">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2 text-amber-800">
          {!isEditing && (
            <button 
              onClick={() => setSelectedType(null)} 
              className="btn-icon mr-1"
              title="Change type"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
          )}
          <SelectedIcon className="w-5 h-5" />
          <h2 className="text-lg font-semibold font-serif">
            {isEditing ? 'Edit Entry' : `New ${selectedTypeInfo?.label} Entry`}
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
            placeholder={
              selectedType === 'voice' 
                ? "Describe what you'll be recording or add notes..."
                : selectedType === 'screen'
                ? "Describe the video content or add notes..."
                : "Write your thoughts, quotes, or reflections here..."
            }
            className="textarea min-h-[200px] leading-relaxed font-serif text-base"
            rows={8}
            autoFocus
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-ink-600 mb-1">
            Source <span className="font-normal text-ink-400">(optional)</span>
          </label>
          <input
            type="text"
            value={source}
            onChange={(e) => setSource(e.target.value)}
            placeholder="e.g., The Tim Ferriss Show, The Atlantic, Harvard lecture..."
            className="input"
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
