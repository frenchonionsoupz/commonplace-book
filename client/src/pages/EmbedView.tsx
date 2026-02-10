import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { PenLine, Mic, Film, Clock, Bookmark, BookOpen } from 'lucide-react';
import { Note } from '../types';

const typeIcon = {
  text: PenLine,
  voice: Mic,
  video: Film,
};

export default function EmbedView() {
  const [searchParams] = useSearchParams();
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const theme = searchParams.get('theme') || 'light';
  const isDark = theme === 'dark';

  useEffect(() => {
    const params = new URLSearchParams();
    const tag = searchParams.get('tag');
    const type = searchParams.get('type');
    const limit = searchParams.get('limit');
    if (tag) params.set('tag', tag);
    if (type) params.set('type', type);
    if (limit) params.set('limit', limit);

    fetch(`/api/embed/notes?${params}`)
      .then((r) => r.json())
      .then(setNotes)
      .catch(console.error)
      .finally(() => setLoading(false));

    // Send height to parent for iframe resize
    const resizeObserver = new ResizeObserver(() => {
      window.parent.postMessage(
        { type: 'commonplace-book-resize', height: document.body.scrollHeight },
        '*'
      );
    });
    resizeObserver.observe(document.body);
    return () => resizeObserver.disconnect();
  }, [searchParams]);

  const bgColor = isDark ? 'bg-gray-900' : 'bg-parchment-50';
  const textColor = isDark ? 'text-gray-100' : 'text-ink-900';
  const textMuted = isDark ? 'text-gray-400' : 'text-ink-500';
  const cardBg = isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-parchment-200';
  const tagBg = isDark ? 'bg-gray-700 text-gray-300 border-gray-600' : 'bg-parchment-200 text-ink-700 border-parchment-300';

  if (loading) {
    return (
      <div className={`min-h-screen ${bgColor} flex items-center justify-center`}>
        <div className="animate-spin w-6 h-6 border-2 border-gray-400 border-t-gray-600 rounded-full" />
      </div>
    );
  }

  return (
    <div className={`${bgColor} ${textColor} p-4 min-h-screen`}>
      <div className="flex items-center gap-2 mb-4">
        <BookOpen className={`w-5 h-5 ${textMuted}`} />
        <h2 className="text-lg font-semibold font-serif">Commonplace Book</h2>
      </div>

      {notes.length === 0 ? (
        <p className={`text-center py-8 ${textMuted} text-sm font-serif italic`}>No entries yet.</p>
      ) : (
        <div className="space-y-3">
          {notes.map((note) => {
            const Icon = typeIcon[note.type] || PenLine;
            const date = new Date(note.created_at);
            const isExpanded = expandedId === note.id;
            const displayContent = note.type === 'text' ? note.content : note.transcription;

            return (
              <div
                key={note.id}
                className={`rounded-xl border p-4 cursor-pointer transition-all ${cardBg} ${isExpanded ? 'shadow-md' : 'hover:shadow-sm'}`}
                onClick={() => setExpandedId(isExpanded ? null : note.id)}
              >
                <div className="flex items-start gap-3">
                  <div className={`mt-0.5 p-1.5 rounded-lg ${isDark ? 'bg-gray-700' : 'bg-parchment-100'}`}>
                    <Icon className="w-3.5 h-3.5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-sm truncate font-serif">{note.title}</h3>

                    {note.source && (
                      <p className={`text-xs ${textMuted} mt-0.5 flex items-center gap-1 font-serif italic`}>
                        <Bookmark className="w-3 h-3" />
                        <span className="truncate">{note.source}</span>
                      </p>
                    )}

                    {!isExpanded && displayContent && (
                      <p className={`text-xs ${textMuted} mt-1 line-clamp-2 font-serif`}>{displayContent}</p>
                    )}

                    {isExpanded && (
                      <div className="mt-3 space-y-3">
                        {note.media_url && note.type === 'voice' && (
                          <audio controls src={note.media_url} className="w-full rounded" onClick={(e) => e.stopPropagation()} />
                        )}
                        {note.media_url && note.type === 'video' && (
                          <video controls src={note.media_url} className="w-full rounded bg-black" onClick={(e) => e.stopPropagation()} />
                        )}
                        {note.transcription && (
                          <div className={`text-xs leading-relaxed p-3 rounded-lg whitespace-pre-wrap font-serif ${isDark ? 'bg-gray-700' : 'bg-parchment-100'}`}>
                            {note.transcription}
                          </div>
                        )}
                        {note.content && (
                          <div className="text-sm leading-relaxed whitespace-pre-wrap font-serif">
                            {note.content}
                          </div>
                        )}
                      </div>
                    )}

                    <div className="flex items-center gap-2 flex-wrap mt-2">
                      {note.tags.map((tag) => (
                        <span key={tag} className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium border ${tagBg}`}>
                          {tag}
                        </span>
                      ))}
                      <span className={`text-[10px] ${textMuted} flex items-center gap-1 ml-auto`}>
                        <Clock className="w-3 h-3" />
                        {date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div className={`text-center text-[10px] ${textMuted} mt-4 pt-3 border-t ${isDark ? 'border-gray-700' : 'border-parchment-200'} font-serif italic`}>
        Powered by Commonplace Book
      </div>
    </div>
  );
}
