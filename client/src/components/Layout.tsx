import { Outlet, Link } from 'react-router-dom';
import { BookOpen, Code } from 'lucide-react';
import { useState } from 'react';
import EmbedCodeModal from './EmbedCodeModal';

export default function Layout() {
  const [showEmbed, setShowEmbed] = useState(false);

  return (
    <div className="min-h-screen bg-parchment-50">
      <header className="border-b border-parchment-200 bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-5 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3 group">
            <div className="p-2 rounded-lg bg-parchment-100 group-hover:bg-parchment-200 transition-colors">
              <BookOpen className="w-6 h-6 text-parchment-700" />
            </div>
            <div>
              <h1 className="text-xl font-serif font-semibold text-ink-900 tracking-wide leading-tight">
                Commonplace Book
              </h1>
              <p className="text-xs text-ink-500 leading-tight font-serif italic">
                A personal anthology of wisdom
              </p>
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

      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
        <Outlet />
      </main>

      <footer className="border-t border-parchment-200 py-6 mt-12">
        <p className="text-center text-xs text-ink-400 font-serif italic">
          "I cannot live without books." — Thomas Jefferson
        </p>
      </footer>

      {showEmbed && <EmbedCodeModal onClose={() => setShowEmbed(false)} />}
    </div>
  );
}
