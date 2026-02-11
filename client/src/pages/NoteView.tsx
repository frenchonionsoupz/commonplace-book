import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Edit2, Trash2, Clock, PenLine, Mic, Bookmark } from 'lucide-react';
import { api } from '../api';
import { Note } from '../types';
import NoteEditor from '../components/NoteEditor';

const typeIcon = {
  text: PenLine,
  voice: Mic,
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
        <p className="text-ink-500 font-serif">Entry not found.</p>
        <Link to="/" className="text-ink-700 underline mt-2 inline-block font-serif">
          Return to your book
        </Link>
      </div>
    );
  }

  if (editing) {
    return (
      <div>
        <button
          onClick={() => setEditing(false)}
          className="flex items-center gap-2 text-sm text-ink-600 hover:text-ink-800 mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Cancel editing
        </button>
        <NoteEditor note={note} onSave={handleUpdate} onCancel={() => setEditing(false)} />
      </div>
    );
  }

  const date = new Date(note.created_at);
  const updatedDate = new Date(note.updated_at);
  const displayContent = note.content || note.transcription || '';
  const Icon = typeIcon[note.type] || PenLine;

  return (
    <div>
      <Link
        to="/"
        className="flex items-center gap-2 text-sm text-ink-600 hover:text-ink-800 mb-6 w-fit"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to book
      </Link>

      <article className="entry-card p-8">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 mb-6">
          <div className="flex items-center gap-2 text-parchment-700">
            <Icon className="w-5 h-5" />
            <span className="text-sm font-serif italic flex items-center gap-2">
              <Clock className="w-3 h-3" />
              {date.toLocaleDateString('en-US', {
                weekday: 'long',
                month: 'long',
                day: 'numeric',
                year: 'numeric'
              })}
            </span>
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

        {/* Media player */}
        {note.media_url && note.type === 'voice' && (
          <div className="mb-6">
            <audio controls src={note.media_url} className="w-full rounded" />
          </div>
        )}

        {/* Content */}
        <div className="mb-6">
          <div className="font-serif text-lg text-ink-800 leading-relaxed whitespace-pre-wrap">
            {displayContent}
          </div>
        </div>

        {/* Source */}
        {note.source && (
          <div className="flex items-center gap-2 text-sm text-ink-500 mb-4 font-serif italic">
            <Bookmark className="w-4 h-4 text-parchment-600" />
            {note.source}
          </div>
        )}

        {/* Tags */}
        {note.tags.length > 0 && (
          <div className="flex items-center gap-2 flex-wrap pt-4 border-t border-parchment-200">
            {note.tags.map((tag) => (
              <Link
                key={tag}
                to={`/?tag=${tag}`}
                className="tag hover:bg-parchment-300 transition-colors"
              >
                {tag}
              </Link>
            ))}
          </div>
        )}

        {/* Updated timestamp */}
        {note.updated_at !== note.created_at && (
          <p className="text-xs text-ink-400 mt-4 font-serif italic">
            Last updated {updatedDate.toLocaleDateString('en-US', {
              month: 'long',
              day: 'numeric',
              year: 'numeric'
            })}
          </p>
        )}
      </article>
    </div>
  );
}
