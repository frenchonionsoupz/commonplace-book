import { useState } from 'react';
import { X, Save, PenLine, Mic, Film, ArrowLeft } from 'lucide-react';
import { Note, NoteType } from '../types';
import VoiceRecorder from './VoiceRecorder';
import VideoUploader from './VideoUploader';

interface Props {
  note?: Note;
  onSave: (data: Partial<Note>) => Promise<void>;
  onCancel: () => void;
}

export default function NoteEditor({ note, onSave, onCancel }: Props) {
  const isEditing = Boolean(note);

  const [selectedType, setSelectedType] = useState<NoteType | null>(
    isEditing ? (note?.type || 'text') : null
  );
  const existingContent = note?.content || note?.transcription || '';
  const [content, setContent] = useState(existingContent);
  const [source, setSource] = useState(note?.source || '');
  const [tagsInput, setTagsInput] = useState(note?.tags.join(', ') || '');
  const [saving, setSaving] = useState(false);
  const [mediaUrl, setMediaUrl] = useState(note?.media_url || '');
  const [transcription, setTranscription] = useState(note?.transcription || '');

  const handleSave = async () => {
    const finalContent = selectedType === 'text' ? content.trim() : '';
    const finalTranscription = selectedType !== 'text' ? (transcription || content.trim()) : '';

    if (!finalContent && !finalTranscription) return;
    if (!selectedType) return;

    setSaving(true);
    try {
      const tags = tagsInput
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean);

      const data: Partial<Note> = {
        content: finalContent,
        transcription: finalTranscription,
        source: source.trim(),
        media_url: mediaUrl,
        tags,
        is_public: true,
      };

      if (!isEditing) {
        data.type = selectedType;
      }

      await onSave(data);
    } finally {
      setSaving(false);
    }
  };

  const handleVoiceComplete = (_blob: Blob, text: string) => {
    setTranscription(text);
    setContent(text);
  };

  const handleVideoComplete = (text: string, url: string) => {
    setTranscription(text);
    setContent(text);
    setMediaUrl(url);
  };

  const typeOptions: { type: NoteType; icon: typeof PenLine; label: string; description: string }[] = [
    { type: 'text', icon: PenLine, label: 'Text', description: 'Write your thoughts' },
    { type: 'voice', icon: Mic, label: 'Voice', description: 'Record & transcribe' },
    { type: 'video', icon: Film, label: 'Video', description: 'Upload & transcribe' },
  ];

  // Step 1: Type picker - fullscreen on mobile
  if (!selectedType && !isEditing) {
    return (
      <div className="fixed inset-0 z-50 bg-parchment-50 flex flex-col md:relative md:inset-auto md:z-auto md:bg-transparent">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-parchment-200 md:border-0 md:p-6 md:pb-2">
          <h2 className="text-xl font-semibold font-serif text-ink-800">New Entry</h2>
          <button onClick={onCancel} className="p-2 -mr-2 text-ink-500 hover:text-ink-700">
            <X className="w-6 h-6" />
          </button>
        </div>

        <p className="text-ink-500 px-4 pt-4 pb-2 text-center font-serif italic md:px-6">
          Choose how you'd like to capture this thought
        </p>

        {/* Type options - fullscreen vertical stack on mobile, grid on desktop */}
        <div className="flex-1 flex flex-col justify-center gap-4 p-6 md:flex-none md:grid md:grid-cols-3 md:gap-4">
          {typeOptions.map(({ type, icon: Icon, label, description }) => (
            <button
              key={type}
              onClick={() => setSelectedType(type)}
              className="flex-1 md:flex-none flex flex-col items-center justify-center p-6 md:p-6 rounded-xl border-2 border-parchment-200 bg-white hover:border-parchment-500 hover:bg-parchment-50 transition-all group active:scale-[0.98]"
            >
              <div className="w-20 h-20 md:w-14 md:h-14 rounded-full bg-parchment-100 flex items-center justify-center mb-4 md:mb-3 group-hover:bg-parchment-200 transition-colors">
                <Icon className="w-10 h-10 md:w-7 md:h-7 text-parchment-700" />
              </div>
              <span className="text-xl md:text-base font-semibold text-ink-800 font-serif">{label}</span>
              <span className="text-sm md:text-xs text-ink-500 mt-2 md:mt-1 text-center">{description}</span>
            </button>
          ))}
        </div>
      </div>
    );
  }

  // Step 2: Content creation
  const selectedTypeInfo = typeOptions.find(t => t.type === selectedType);
  const SelectedIcon = selectedTypeInfo?.icon || PenLine;
  const hasContent = selectedType === 'text' ? content.trim().length > 0 : (transcription.length > 0 || content.trim().length > 0);

  return (
    <div className="entry-card p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2 text-parchment-800">
          {!isEditing && (
            <button
              onClick={() => { setSelectedType(null); setTranscription(''); setMediaUrl(''); setContent(existingContent); }}
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
        {/* Voice recorder */}
        {selectedType === 'voice' && !transcription && (
          <VoiceRecorder
            onRecordingComplete={handleVoiceComplete}
            onMediaUrl={setMediaUrl}
          />
        )}

        {/* Video uploader */}
        {selectedType === 'video' && !transcription && (
          <VideoUploader onTranscriptionComplete={handleVideoComplete} />
        )}

        {/* Transcription result for voice/video */}
        {selectedType !== 'text' && transcription && (
          <div className="p-4 bg-parchment-50 rounded-lg border border-parchment-200">
            <label className="block text-xs font-medium text-ink-500 mb-2 font-serif italic">
              Transcription
            </label>
            <textarea
              value={content}
              onChange={(e) => { setContent(e.target.value); setTranscription(e.target.value); }}
              className="textarea min-h-[150px] leading-relaxed font-serif text-base"
              rows={6}
            />
          </div>
        )}

        {/* Text entry */}
        {selectedType === 'text' && (
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Write your thoughts, quotes, or reflections..."
            className="textarea min-h-[200px] leading-relaxed font-serif text-base"
            rows={8}
            autoFocus
          />
        )}

        {/* Source field */}
        <div>
          <label className="block text-sm font-medium text-ink-600 mb-1 font-serif">
            Source <span className="font-normal text-ink-400 italic">(optional)</span>
          </label>
          <input
            type="text"
            value={source}
            onChange={(e) => setSource(e.target.value)}
            placeholder="e.g., The Tim Ferriss Show, The Atlantic, a Harvard lecture..."
            className="input"
          />
        </div>

        {/* Tags field */}
        <div>
          <label className="block text-sm font-medium text-ink-600 mb-1 font-serif">
            Tags <span className="font-normal text-ink-400 italic">(optional, comma-separated)</span>
          </label>
          <input
            type="text"
            value={tagsInput}
            onChange={(e) => setTagsInput(e.target.value)}
            placeholder="philosophy, stoicism, productivity"
            className="input"
          />
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-2 pt-2">
          <button onClick={onCancel} className="btn-secondary">
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={!hasContent || saving}
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
