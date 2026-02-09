import { useState } from 'react';
import { X, Mail, Send, Check } from 'lucide-react';
import { api } from '../api';
import { ExportFilter } from '../types';
import { useAuth } from '../context/AuthContext';

interface Props {
  onClose: () => void;
}

type FilterChoice = 'new' | 'days' | 'all';

export default function EmailExportModal({ onClose }: Props) {
  const { user } = useAuth();
  const [email, setEmail] = useState(user?.email || '');
  const [filterChoice, setFilterChoice] = useState<FilterChoice>('all');
  const [customDays, setCustomDays] = useState('7');
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  const handleSend = async () => {
    if (!email) {
      setError('Please enter an email address');
      return;
    }

    setSending(true);
    setError('');

    try {
      let filterValue: ExportFilter;
      if (filterChoice === 'days') {
        filterValue = `days:${parseInt(customDays, 10)}`;
      } else {
        filterValue = filterChoice;
      }
      await api.exportToEmail(email, filterValue);
      setSent(true);
    } catch (err: any) {
      setError(err.message || 'Failed to send email');
    } finally {
      setSending(false);
    }
  };

  if (sent) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
        <div className="bg-white rounded-xl max-w-md w-full p-8 shadow-xl text-center" onClick={(e) => e.stopPropagation()}>
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Check className="w-8 h-8 text-green-600" />
          </div>
          <h2 className="text-xl font-semibold text-ink-900 font-serif mb-2">Entries Sent!</h2>
          <p className="text-ink-600 mb-6">
            Your entries have been sent to <strong>{email}</strong>
          </p>
          <button onClick={onClose} className="btn-primary">
            Done
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2 text-parchment-800">
            <Mail className="w-5 h-5" />
            <h2 className="text-lg font-semibold font-serif">Email Your Entries</h2>
          </div>
          <button onClick={onClose} className="btn-icon">
            <X className="w-5 h-5" />
          </button>
        </div>

        <p className="text-sm text-ink-600 mb-4 font-serif">
          Send your entries to your email for backup or reading on another device.
        </p>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-ink-600 mb-1 font-serif">
              Email Address
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="input"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-ink-600 mb-2 font-serif">
              Which entries to send?
            </label>
            <div className="space-y-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="filter"
                  checked={filterChoice === 'new'}
                  onChange={() => setFilterChoice('new')}
                  className="text-parchment-600"
                />
                <span className="text-sm text-ink-700">New entries only (last 24 hours)</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="filter"
                  checked={filterChoice === 'days'}
                  onChange={() => setFilterChoice('days')}
                  className="text-parchment-600"
                />
                <span className="text-sm text-ink-700">Past</span>
                <input
                  type="number"
                  value={customDays}
                  onChange={(e) => {
                    setCustomDays(e.target.value);
                    setFilterChoice('days');
                  }}
                  min="1"
                  max="365"
                  className="input w-16 py-1 text-center"
                />
                <span className="text-sm text-ink-700">days</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="filter"
                  checked={filterChoice === 'all'}
                  onChange={() => setFilterChoice('all')}
                  className="text-parchment-600"
                />
                <span className="text-sm text-ink-700">All entries</span>
              </label>
            </div>
          </div>

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {error}
            </div>
          )}

          <button
            onClick={handleSend}
            disabled={sending || !email}
            className="btn-primary w-full flex items-center justify-center gap-2"
          >
            {sending ? (
              'Sending...'
            ) : (
              <>
                <Send className="w-4 h-4" />
                Send Entries
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
