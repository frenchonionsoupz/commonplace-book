import { Link } from 'react-router-dom';
import { FileText, Mic, Monitor, Clock, ExternalLink } from 'lucide-react';
import { Note } from '../types';

const typeIcon = {
  text: FileText,
  voice: Mic,
  screen: Monitor,
};

const sourceTypeLabels: Record<string, string> = {
  podcast: 'Podcast',
  article: 'Article',
  lecture: 'Lecture',
  book: 'Book',
  video: 'Video',
  other: 'Other',
};

interface Props {
  note: Note;
  compact?: boolean;
}

export default function NoteCard({ note, compact }: Props) {
  const Icon = typeIcon[note.type];
  const date = new Date(note.created_at);
  const displayContent = note.type === 'text'
    ? note.content
    : note.transcription || '(no transcription)';

  return (
    <Link to={`/note/${note.id}`} className="card block p-5 group">
      <div className="flex items-start gap-3">
        <div className="mt-0.5 p-2 rounded-lg bg-parchment-100 text-ink-600 group-hover:bg-parchment-200 transition-colors">
          <Icon className="w-4 h-4" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-semibold text-ink-900 truncate group-hover:text-ink-700 transition-colors">
              {note.title}
            </h3>
            {!note.is_public && (
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-ink-100 text-ink-500 font-medium">Private</span>
            )}
          </div>

          {note.source && (
            <p className="text-xs text-ink-500 mb-2 flex items-center gap-1">
              <ExternalLink className="w-3 h-3" />
              {note.source_type && <span className="font-medium">{sourceTypeLabels[note.source_type] || note.source_type}:</span>}
              <span className="truncate">{note.source}</span>
            </p>
          )}

          {!compact && displayContent && (
            <p className="text-sm text-ink-600 line-clamp-3 mb-3 leading-relaxed">
              {displayContent}
            </p>
          )}

          <div className="flex items-center gap-2 flex-wrap">
            {note.tags.map((tag) => (
              <span key={tag} className="tag">{tag}</span>
            ))}
            <span className="text-xs text-ink-400 flex items-center gap-1 ml-auto">
              <Clock className="w-3 h-3" />
              {date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}
