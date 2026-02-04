import { useState, useEffect } from 'react';
import { FileText, Mic, Monitor, X, Save, Eye, EyeOff } from 'lucide-react';
import { Note, NoteType, SourceType } from '../types';
import VoiceRecorder from './VoiceRecorder';
import ScreenRecorder from './ScreenRecorder';

interface Props {
  note?: Note;
  onSave: (data: Partial<Note>) => Promise<void>;
  onCancel: () => void;
}

const SOURCE_TYPES: { value: SourceType; label: string }[] = [
  { value: '', label: 'None' },
  { value: 'podcast', label: 'Podcast' },
  { value: 'article', label: 'Article' },
  { value: 'lecture', label: 'Lecture' },
  { value: 'book', label: 'Book' },
  { value: 'video', label: 'Video' },
  { value: 'other', label: 'Other' },
];

export default function NoteEditor({ note, onSave, onCancel }: Props) {
  const [type, setType] = useState<NoteType>(note?.type || 'text');
  const [title, setTitle] = useState(note?.title || '');
  const [content, setContent] = useState(note?.content || '');
  const [source, setSource] = useState(note?.source || '');
  const [sourceType, setSourceType] = useState<SourceType>(note?.source_type || '');
  const [mediaUrl, setMediaUrl] = useState(note?.media_url || '');
  const [transcription, setTranscription] = useState(note?.transcription || '');
  const [tagsInput, setTagsInput] = useState(note?.tags.join(', ') || '');
  const [isPublic, setIsPublic] = useState(note?.is_public ?? true);
  const [saving, setSaving] = useState(false);
  const [voiceBlob, setVoiceBlob] = useState<Blob | null>(null);
  const [screenBlob, setScreenBlob] = useState<Blob | null>(null);

  const isEditing = Boolean(note);

  const handleSave = async () => {
    if (!title.trim()) return;

    setSaving(true);
    try {
      const tags = tagsInput
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean);

      await onSave({
        title: title.trim(),
        content,
        type,
        source,
        source_type: sourceType,
        media_url: mediaUrl,
        transcription,
        tags,
        is_public: isPublic,
      });
    } finally {
      setSaving(false);
    }
  };

  const handleVoiceComplete = (blob: Blob, text: string) => {
    setVoiceBlob(blob);
    setTranscription(text);
    if (!title) setTitle('Voice Note — ' + new Date().toLocaleDateString());
  };

  const handleScreenComplete = (blob: Blob) => {
    setScreenBlob(blob);
    if (!title) setTitle('Screen Recording — ' + new Date().toLocaleDateString());
  };

  return (
    <div className="card p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-semibold text-ink-900">
          {isEditing ? 'Edit Note' : 'New Entry'}
        </h2>
        <button onClick={onCancel} className="btn-icon">
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Note type selector */}
      {!isEditing && (
        <div className="flex gap-2 mb-6">
          {([
            { value: 'text' as const, icon: FileText, label: 'Written Note' },
            { value: 'voice' as const, icon: Mic, label: 'Voice Note' },
            { value: 'screen' as const, icon: Monitor, label: 'Screen Recording' },
          ]).map(({ value, icon: Icon, label }) => (
            <button
              key={value}
              onClick={() => setType(value)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                type === value
                  ? 'bg-ink-900 text-parchment-50'
                  : 'bg-parchment-100 text-ink-600 hover:bg-parchment-200'
              }`}
            >
              <Icon className="w-4 h-4" />
              {label}
            </button>
          ))}
        </div>
      )}

      <div className="space-y-4">
        {/* Title */}
        <div>
          <label className="block text-sm font-medium text-ink-700 mb-1">Title</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="What's this note about?"
            className="input text-base"
            autoFocus
          />
        </div>

        {/* Source info */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-ink-700 mb-1">Source</label>
            <input
              type="text"
              value={source}
              onChange={(e) => setSource(e.target.value)}
              placeholder="e.g. Tim Ferriss Show #423"
              className="input"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-ink-700 mb-1">Source Type</label>
            <select
              value={sourceType}
              onChange={(e) => setSourceType(e.target.value as SourceType)}
              className="input"
            >
              {SOURCE_TYPES.map(({ value, label }) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Content area — depends on type */}
        {type === 'text' && (
          <div>
            <label className="block text-sm font-medium text-ink-700 mb-1">Notes</label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Write your notes here..."
              className="textarea min-h-[200px] leading-relaxed"
              rows={8}
            />
          </div>
        )}

        {type === 'voice' && (
          <div className="space-y-3">
            <label className="block text-sm font-medium text-ink-700">Voice Recording</label>
            <VoiceRecorder
              onRecordingComplete={handleVoiceComplete}
              onMediaUrl={setMediaUrl}
            />
            {voiceBlob && (
              <audio
                controls
                src={URL.createObjectURL(voiceBlob)}
                className="w-full rounded-lg"
              />
            )}
            {mediaUrl && !voiceBlob && (
              <audio controls src={mediaUrl} className="w-full rounded-lg" />
            )}
            {transcription && (
              <div>
                <label className="block text-sm font-medium text-ink-700 mb-1">Transcription</label>
                <textarea
                  value={transcription}
                  onChange={(e) => setTranscription(e.target.value)}
                  className="textarea min-h-[120px] leading-relaxed"
                  rows={5}
                />
              </div>
            )}
            <div>
              <label className="block text-sm font-medium text-ink-700 mb-1">Additional Notes</label>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Add any written notes alongside the recording..."
                className="textarea"
                rows={3}
              />
            </div>
          </div>
        )}

        {type === 'screen' && (
          <div className="space-y-3">
            <label className="block text-sm font-medium text-ink-700">Screen Recording</label>
            <ScreenRecorder
              onRecordingComplete={handleScreenComplete}
              onMediaUrl={setMediaUrl}
            />
            {screenBlob && (
              <video
                controls
                src={URL.createObjectURL(screenBlob)}
                className="w-full rounded-lg bg-black"
              />
            )}
            {mediaUrl && !screenBlob && (
              <video controls src={mediaUrl} className="w-full rounded-lg bg-black" />
            )}
            <div>
              <label className="block text-sm font-medium text-ink-700 mb-1">Notes</label>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Add notes about this recording..."
                className="textarea"
                rows={3}
              />
            </div>
          </div>
        )}

        {/* Tags */}
        <div>
          <label className="block text-sm font-medium text-ink-700 mb-1">Tags</label>
          <input
            type="text"
            value={tagsInput}
            onChange={(e) => setTagsInput(e.target.value)}
            placeholder="philosophy, stoicism, productivity (comma-separated)"
            className="input"
          />
        </div>

        {/* Visibility + Save */}
        <div className="flex items-center justify-between pt-2">
          <button
            onClick={() => setIsPublic(!isPublic)}
            className="flex items-center gap-2 text-sm text-ink-600 hover:text-ink-800 transition-colors"
          >
            {isPublic ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
            {isPublic ? 'Public (visible in embed)' : 'Private'}
          </button>

          <div className="flex gap-2">
            <button onClick={onCancel} className="btn-secondary">
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={!title.trim() || saving}
              className="btn-primary flex items-center gap-2 disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              {saving ? 'Saving...' : isEditing ? 'Update' : 'Save Entry'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
