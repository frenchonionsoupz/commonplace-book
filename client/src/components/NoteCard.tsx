import { Link } from 'react-router-dom';
import { Clock, PenLine, Mic, Film, Bookmark } from 'lucide-react';
import { Note } from '../types';

const typeIcon = {
  text: PenLine,
  voice: Mic,
  video: Film,
};

interface Props {
  note: Note;
  compact?: boolean;
}

export default function NoteCard({ note, compact }: Props) {
  const date = new Date(note.created_at);
  const displayContent = note.content || note.transcription || '';
  const Icon = typeIcon[note.type] || PenLine;

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
      className="entry-card block p-6 group"
    >
      <div className="space-y-3">
        {/* Header with type icon and date */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Icon className="w-3.5 h-3.5 text-parchment-600" />
            <span className="text-xs text-ink-400 flex items-center gap-1 font-serif italic">
              <Clock className="w-3 h-3" />
              {formatDate(date)}
            </span>
          </div>
        </div>

        {/* Content */}
        <p className={`font-serif text-ink-800 leading-relaxed ${compact ? 'line-clamp-2' : 'line-clamp-4'}`}>
          {displayContent}
        </p>

        {/* Source */}
        {note.source && (
          <p className="text-xs text-ink-500 flex items-center gap-1 font-serif italic">
            <Bookmark className="w-3 h-3 text-parchment-600" />
            {note.source}
          </p>
        )}

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
