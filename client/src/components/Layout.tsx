import { Outlet, Link } from 'react-router-dom';
import { BookOpen, Code } from 'lucide-react';
import { useState } from 'react';
import EmbedCodeModal from './EmbedCodeModal';

export default function Layout() {
  const [showEmbed, setShowEmbed] = useState(false);

  return (
    <div className="min-h-screen bg-parchment-50">
      <header className="border-b border-parchment-200 bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3 group">
            <BookOpen className="w-7 h-7 text-ink-800 group-hover:text-ink-600 transition-colors" />
            <div>
              <h1 className="text-xl font-semibold text-ink-900 leading-tight">Commonplace Book</h1>
              <p className="text-xs text-ink-500 leading-tight">Notes, recordings & reflections</p>
            </div>
          </Link>
          <button
            onClick={() => setShowEmbed(true)}
            className="btn-secondary flex items-center gap-2"
          >
            <Code className="w-4 h-4" />
            <span className="hidden sm:inline">Embed</span>
          </button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        <Outlet />
      </main>

      {showEmbed && <EmbedCodeModal onClose={() => setShowEmbed(false)} />}
    </div>
  );
}
