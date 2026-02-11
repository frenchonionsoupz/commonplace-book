import { Outlet, Link } from 'react-router-dom';
import { Code, Mail, User, HelpCircle } from 'lucide-react';
import { useState, useMemo } from 'react';
import EmbedCodeModal from './EmbedCodeModal';
import EmailExportModal from './EmailExportModal';
import AccountModal from './AccountModal';
import Logo from './Logo';
import { useAuth } from '../context/AuthContext';
import { getRandomQuote } from '../quotes';

export default function Layout() {
  const { user } = useAuth();
  const [showEmbed, setShowEmbed] = useState(false);
  const [showExport, setShowExport] = useState(false);
  const [showAccount, setShowAccount] = useState(false);
  const quote = useMemo(() => getRandomQuote(), []);

  return (
    <div className="min-h-screen bg-parchment-50">
      <header className="border-b border-parchment-200 bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-5 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3 group">
            <Logo size={40} className="group-hover:opacity-80 transition-opacity" />
            <div>
              <h1 className="text-xl font-serif font-semibold text-ink-900 tracking-wide leading-tight">
                Commonplace Book
              </h1>
              <p className="text-xs text-ink-500 leading-tight font-serif italic">
                {user?.name || user?.email || 'A personal anthology of wisdom'}
              </p>
            </div>
          </Link>
          <div className="flex items-center gap-2">
            <Link
              to="/philosophy"
              className="btn-icon"
              title="Our philosophy"
            >
              <HelpCircle className="w-5 h-5" />
            </Link>
            <button
              onClick={() => setShowExport(true)}
              className="btn-icon"
              title="Email entries to yourself"
            >
              <Mail className="w-5 h-5" />
            </button>
            <button
              onClick={() => setShowEmbed(true)}
              className="btn-secondary flex items-center gap-2"
            >
              <Code className="w-4 h-4" />
              <span className="hidden sm:inline">Embed</span>
            </button>
            <button
              onClick={() => setShowAccount(true)}
              className="btn-icon"
              title="Account settings"
            >
              <User className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
        <Outlet />
      </main>

      <footer className="border-t border-parchment-200 py-6 mt-12">
        <p className="text-center text-xs text-ink-400 font-serif italic">
          "{quote.text}" — {quote.author}
        </p>
      </footer>

      {showEmbed && user && <EmbedCodeModal userId={user.id} onClose={() => setShowEmbed(false)} />}
      {showExport && <EmailExportModal onClose={() => setShowExport(false)} />}
      {showAccount && <AccountModal onClose={() => setShowAccount(false)} />}
    </div>
  );
}
