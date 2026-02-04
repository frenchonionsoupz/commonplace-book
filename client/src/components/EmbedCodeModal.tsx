import { useState } from 'react';
import { X, Copy, Check } from 'lucide-react';

interface Props {
  onClose: () => void;
}

export default function EmbedCodeModal({ onClose }: Props) {
  const [copied, setCopied] = useState(false);
  const [tag, setTag] = useState('');
  const [type, setType] = useState('');
  const [limit, setLimit] = useState('20');
  const [theme, setTheme] = useState<'light' | 'dark'>('light');

  const host = window.location.origin;
  const embedCode = `<!-- Commonplace Book Widget -->
<div id="commonplace-book"
  data-host="${host}"${tag ? `\n  data-tag="${tag}"` : ''}${type ? `\n  data-type="${type}"` : ''}
  data-limit="${limit}"
  data-theme="${theme}">
</div>
<script src="${host}/api/embed/script"></script>`;

  const handleCopy = async () => {
    await navigator.clipboard.writeText(embedCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-xl max-w-lg w-full p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-ink-900">Embed on Your Website</h2>
          <button onClick={onClose} className="btn-icon">
            <X className="w-5 h-5" />
          </button>
        </div>

        <p className="text-sm text-ink-600 mb-4">
          Add your Commonplace Book to any website. Only public notes will be shown.
        </p>

        <div className="grid grid-cols-2 gap-3 mb-4">
          <div>
            <label className="block text-xs font-medium text-ink-600 mb-1">Filter by tag</label>
            <input
              type="text"
              value={tag}
              onChange={(e) => setTag(e.target.value)}
              placeholder="e.g. philosophy"
              className="input"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-ink-600 mb-1">Note type</label>
            <select value={type} onChange={(e) => setType(e.target.value)} className="input">
              <option value="">All types</option>
              <option value="text">Text</option>
              <option value="voice">Voice</option>
              <option value="screen">Screen</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-ink-600 mb-1">Max notes</label>
            <input
              type="number"
              value={limit}
              onChange={(e) => setLimit(e.target.value)}
              min="1"
              max="100"
              className="input"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-ink-600 mb-1">Theme</label>
            <select value={theme} onChange={(e) => setTheme(e.target.value as 'light' | 'dark')} className="input">
              <option value="light">Light</option>
              <option value="dark">Dark</option>
            </select>
          </div>
        </div>

        <div className="relative">
          <pre className="bg-ink-900 text-parchment-100 p-4 rounded-lg text-xs overflow-x-auto font-mono leading-relaxed">
            {embedCode}
          </pre>
          <button
            onClick={handleCopy}
            className="absolute top-2 right-2 p-1.5 rounded bg-ink-700 hover:bg-ink-600 text-parchment-200 transition-colors"
          >
            {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
          </button>
        </div>
      </div>
    </div>
  );
}
