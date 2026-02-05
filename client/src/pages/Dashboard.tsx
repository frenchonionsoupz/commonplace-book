import { useState, useEffect, useCallback } from 'react';
import { Plus, LayoutGrid, List, Feather } from 'lucide-react';
import { api } from '../api';
import { Note, TagCount } from '../types';
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
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');

  const fetchNotes = useCallback(async () => {
    try {
      const params: Record<string, string> = {};
      if (search) params.search = search;
      if (activeTag) params.tag = activeTag;

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
  }, [search, activeTag]);

  useEffect(() => {
    const timeout = setTimeout(fetchNotes, search ? 300 : 0);
    return () => clearTimeout(timeout);
  }, [fetchNotes]);

  const handleSave = async (data: Partial<Note>) => {
    await api.createNote(data);
    setShowEditor(false);
    fetchNotes();
  };

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
          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-amber-50 flex items-center justify-center">
            <Feather className="w-10 h-10 text-amber-600" />
          </div>
          <h3 className="text-xl font-serif font-semibold text-ink-700 mb-2">
            {search || activeTag ? 'No entries found' : 'Your Commonplace Book awaits'}
          </h3>
          <p className="text-sm text-ink-500 mb-6 max-w-md mx-auto leading-relaxed">
            {search || activeTag
              ? 'Try adjusting your filters or search terms.'
              : 'In the tradition of scholars past, gather your thoughts, quotes, and reflections. Let this be your personal anthology of wisdom.'}
          </p>
          {!showEditor && !search && !activeTag && (
            <button onClick={() => setShowEditor(true)} className="btn-primary">
              <Feather className="w-4 h-4 inline mr-2" />
              Begin Writing
            </button>
          )}
        </div>
      ) : (
        <div className={
          viewMode === 'grid'
            ? 'grid grid-cols-1 md:grid-cols-2 gap-4'
            : 'space-y-4'
        }>
          {notes.map((note) => (
            <NoteCard key={note.id} note={note} compact={viewMode === 'list'} />
          ))}
        </div>
      )}

      {/* Stats footer */}
      {notes.length > 0 && (
        <div className="text-center text-xs text-ink-400 pt-4 border-t border-parchment-200 font-serif italic">
          {notes.length} {notes.length === 1 ? 'entry' : 'entries'} in your commonplace book
        </div>
      )}
    </div>
  );
}
