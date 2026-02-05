import { Link } from 'react-router-dom';
import { Clock } from 'lucide-react';
import { Note } from '../types';

interface Props {
  note: Note;
  compact?: boolean;
}

export default function NoteCard({ note, compact }: Props) {
  const date = new Date(note.created_at);
  const displayContent = note.content || note.transcription || '';
  
  const formatDate = (d: Date) => {
    return d.toLocaleDateString('en-US', { 
      month: 'long', 
      day: 'numeric', 
      year: 'numeric' 
    });
  };

  return (
    <Link 
      to={`/note/${note.id}`} 
      className="card block p-6 group border-l-4 border-l-transparent hover:border-l-amber-500 transition-all"
    >
      <div className="space-y-3">
        {/* Date header */}
        <div className="flex items-center justify-between">
          <span className="text-xs text-ink-400 flex items-center gap-1 font-serif italic">
            <Clock className="w-3 h-3" />
            {formatDate(date)}
          </span>
          {!note.is_public && (
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-ink-100 text-ink-500 font-medium">
              Private
            </span>
          )}
        </div>

        {/* Content */}
        <p className={`font-serif text-ink-800 leading-relaxed ${compact ? 'line-clamp-2' : 'line-clamp-4'}`}>
          {displayContent}
        </p>

        {/* Tags */}
        {note.tags.length > 0 && (
          <div className="flex items-center gap-2 flex-wrap pt-1">
            {note.tags.map((tag) => (
              <span key={tag} className="tag">{tag}</span>
            ))}
          </div>
        )}
      </div>
    </Link>
  );
}
