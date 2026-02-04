import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft, Edit2, Trash2, FileText, Mic, Monitor,
  ExternalLink, Clock, Eye, EyeOff,
} from 'lucide-react';
import { api } from '../api';
import { Note } from '../types';
import NoteEditor from '../components/NoteEditor';

const typeIcon = {
  text: FileText,
  voice: Mic,
  screen: Monitor,
};

const typeLabel = {
  text: 'Written Note',
  voice: 'Voice Note',
  screen: 'Screen Recording',
};

const sourceTypeLabels: Record<string, string> = {
  podcast: 'Podcast',
  article: 'Article',
  lecture: 'Lecture',
  book: 'Book',
  video: 'Video',
  other: 'Other',
};

export default function NoteView() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [note, setNote] = useState<Note | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (!id) return;
    api.getNote(id)
      .then(setNote)
      .catch(() => navigate('/'))
      .finally(() => setLoading(false));
  }, [id, navigate]);

  const handleUpdate = async (data: Partial<Note>) => {
    if (!id) return;
    const updated = await api.updateNote(id, data);
    setNote(updated);
    setEditing(false);
  };

  const handleDelete = async () => {
    if (!id) return;
    setDeleting(true);
    try {
      await api.deleteNote(id);
      navigate('/');
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="text-center py-16 text-ink-400">
        <div className="animate-spin w-8 h-8 border-2 border-ink-300 border-t-ink-600 rounded-full mx-auto" />
      </div>
    );
  }

  if (!note) {
    return (
      <div className="text-center py-16">
        <p className="text-ink-500">Note not found.</p>
        <Link to="/" className="text-ink-700 underline mt-2 inline-block">Back to book</Link>
      </div>
    );
  }

  if (editing) {
    return (
      <div>
        <button onClick={() => setEditing(false)} className="flex items-center gap-2 text-sm text-ink-600 hover:text-ink-800 mb-4">
          <ArrowLeft className="w-4 h-4" />
          Cancel editing
        </button>
        <NoteEditor note={note} onSave={handleUpdate} onCancel={() => setEditing(false)} />
      </div>
    );
  }

  const Icon = typeIcon[note.type];
  const date = new Date(note.created_at);
  const updatedDate = new Date(note.updated_at);

  return (
    <div>
      <Link to="/" className="flex items-center gap-2 text-sm text-ink-600 hover:text-ink-800 mb-6 w-fit">
        <ArrowLeft className="w-4 h-4" />
        Back to book
      </Link>

      <article className="card p-6 sm:p-8">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 mb-6">
          <div className="flex items-start gap-3">
            <div className="mt-1 p-2 rounded-lg bg-parchment-100 text-ink-600">
              <Icon className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-2xl font-semibold text-ink-900 mb-1">{note.title}</h1>
              <div className="flex items-center gap-3 text-xs text-ink-500">
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
                </span>
                <span>{typeLabel[note.type]}</span>
                <span className="flex items-center gap-1">
                  {note.is_public ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                  {note.is_public ? 'Public' : 'Private'}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <button onClick={() => setEditing(true)} className="btn-icon" title="Edit">
              <Edit2 className="w-4 h-4" />
            </button>
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="btn-icon text-red-500 hover:bg-red-50"
              title="Delete"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Source */}
        {note.source && (
          <div className="mb-6 p-3 bg-parchment-100 rounded-lg border border-parchment-200">
            <p className="text-sm text-ink-600 flex items-center gap-2">
              <ExternalLink className="w-4 h-4 text-ink-400" />
              {note.source_type && (
                <span className="font-medium">{sourceTypeLabels[note.source_type] || note.source_type}:</span>
              )}
              {note.source}
            </p>
          </div>
        )}

        {/* Media */}
        {note.media_url && note.type === 'voice' && (
          <div className="mb-6">
            <audio controls src={note.media_url} className="w-full rounded-lg" />
          </div>
        )}

        {note.media_url && note.type === 'screen' && (
          <div className="mb-6">
            <video controls src={note.media_url} className="w-full rounded-lg bg-black" />
          </div>
        )}

        {/* Transcription */}
        {note.transcription && (
          <div className="mb-6">
            <h3 className="text-sm font-medium text-ink-700 mb-2">Transcription</h3>
            <div className="p-4 bg-parchment-50 rounded-lg border border-parchment-200 text-sm text-ink-700 leading-relaxed whitespace-pre-wrap">
              {note.transcription}
            </div>
          </div>
        )}

        {/* Content */}
        {note.content && (
          <div className="mb-6">
            {(note.type !== 'text') && (
              <h3 className="text-sm font-medium text-ink-700 mb-2">Notes</h3>
            )}
            <div className="prose prose-stone max-w-none text-ink-800 leading-relaxed whitespace-pre-wrap">
              {note.content}
            </div>
          </div>
        )}

        {/* Tags */}
        {note.tags.length > 0 && (
          <div className="flex items-center gap-2 flex-wrap pt-4 border-t border-parchment-200">
            {note.tags.map((tag) => (
              <Link key={tag} to={`/?tag=${tag}`} className="tag hover:bg-parchment-300 transition-colors">
                {tag}
              </Link>
            ))}
          </div>
        )}

        {/* Updated timestamp */}
        {note.updated_at !== note.created_at && (
          <p className="text-xs text-ink-400 mt-4">
            Last updated {updatedDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
          </p>
        )}
      </article>
    </div>
  );
}
