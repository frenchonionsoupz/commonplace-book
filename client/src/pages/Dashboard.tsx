import { useState, useEffect, useCallback } from 'react';
import { Plus, FileText, Mic, Monitor, LayoutGrid, List } from 'lucide-react';
import { api } from '../api';
import { Note, NoteType, TagCount } from '../types';
import NoteCard from '../components/NoteCard';
import NoteEditor from '../components/NoteEditor';
import SearchBar from '../components/SearchBar';
import TagFilter from '../components/TagFilter';

export default function Dashboard() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [tags, setTags] = useState<TagCount[]>([]);
  const [loading, setLoading] = useState(true);
  const [showEditor, setShowEditor] = useState(false);
  const [search, setSearch] = useState('');
  const [activeTag, setActiveTag] = useState('');
  const [activeType, setActiveType] = useState<NoteType | ''>('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  const fetchNotes = useCallback(async () => {
    try {
      const params: Record<string, string> = {};
      if (search) params.search = search;
      if (activeTag) params.tag = activeTag;
      if (activeType) params.type = activeType;

      const [notesData, tagsData] = await Promise.all([
        api.getNotes(params),
        api.getTags(),
      ]);
      setNotes(notesData);
      setTags(tagsData);
    } catch (err) {
      console.error('Failed to fetch notes:', err);
    } finally {
      setLoading(false);
    }
  }, [search, activeTag, activeType]);

  useEffect(() => {
    const timeout = setTimeout(fetchNotes, search ? 300 : 0);
    return () => clearTimeout(timeout);
  }, [fetchNotes]);

  const handleSave = async (data: Partial<Note>) => {
    await api.createNote(data);
    setShowEditor(false);
    fetchNotes();
  };

  const typeFilters: { value: NoteType | ''; icon: typeof FileText; label: string }[] = [
    { value: '', icon: LayoutGrid, label: 'All' },
    { value: 'text', icon: FileText, label: 'Text' },
    { value: 'voice', icon: Mic, label: 'Voice' },
    { value: 'screen', icon: Monitor, label: 'Screen' },
  ];

  return (
    <div className="space-y-6">
      {/* Top bar */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex-1 w-full sm:max-w-md">
          <SearchBar value={search} onChange={setSearch} />
        </div>
        <button
          onClick={() => setShowEditor(true)}
          className="btn-primary flex items-center gap-2 whitespace-nowrap"
        >
          <Plus className="w-4 h-4" />
          New Entry
        </button>
      </div>

      {/* Editor */}
      {showEditor && (
        <NoteEditor
          onSave={handleSave}
          onCancel={() => setShowEditor(false)}
        />
      )}

      {/* Filters row */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <TagFilter tags={tags} activeTag={activeTag} onSelect={setActiveTag} />

        <div className="flex items-center gap-1">
          {typeFilters.map(({ value, icon: Icon, label }) => (
            <button
              key={value}
              onClick={() => setActiveType(value)}
              title={label}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                activeType === value
                  ? 'bg-ink-900 text-parchment-50'
                  : 'text-ink-500 hover:bg-parchment-200'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{label}</span>
            </button>
          ))}

          <div className="w-px h-5 bg-parchment-300 mx-2" />

          <button
            onClick={() => setViewMode('grid')}
            className={`btn-icon ${viewMode === 'grid' ? 'bg-parchment-200' : ''}`}
          >
            <LayoutGrid className="w-4 h-4" />
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`btn-icon ${viewMode === 'list' ? 'bg-parchment-200' : ''}`}
          >
            <List className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Notes grid/list */}
      {loading ? (
        <div className="text-center py-16 text-ink-400">
          <div className="animate-spin w-8 h-8 border-2 border-ink-300 border-t-ink-600 rounded-full mx-auto mb-4" />
          Loading your commonplace book...
        </div>
      ) : notes.length === 0 ? (
        <div className="text-center py-16">
          <div className="text-5xl mb-4">📖</div>
          <h3 className="text-lg font-semibold text-ink-700 mb-2">
            {search || activeTag || activeType ? 'No notes found' : 'Your Commonplace Book is empty'}
          </h3>
          <p className="text-sm text-ink-500 mb-6 max-w-md mx-auto">
            {search || activeTag || activeType
              ? 'Try adjusting your filters or search terms.'
              : 'Start capturing notes from podcasts, articles, lectures and more. Write them down, record your voice, or capture your screen.'}
          </p>
          {!showEditor && !search && !activeTag && !activeType && (
            <button onClick={() => setShowEditor(true)} className="btn-primary">
              <Plus className="w-4 h-4 inline mr-2" />
              Create Your First Entry
            </button>
          )}
        </div>
      ) : (
        <div className={
          viewMode === 'grid'
            ? 'grid grid-cols-1 md:grid-cols-2 gap-4'
            : 'space-y-3'
        }>
          {notes.map((note) => (
            <NoteCard key={note.id} note={note} compact={viewMode === 'list'} />
          ))}
        </div>
      )}

      {/* Stats footer */}
      {notes.length > 0 && (
        <div className="text-center text-xs text-ink-400 pt-4 border-t border-parchment-200">
          {notes.length} {notes.length === 1 ? 'entry' : 'entries'} in your commonplace book
        </div>
      )}
    </div>
  );
}
