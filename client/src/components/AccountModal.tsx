import { useState } from 'react';
import { X, Download, FileJson, FileText, Trash2, AlertTriangle, LogOut } from 'lucide-react';
import { api } from '../api';
import { useAuth } from '../context/AuthContext';

interface Props {
  onClose: () => void;
}

export default function AccountModal({ onClose }: Props) {
  const { user, logout } = useAuth();
  const [downloading, setDownloading] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [confirmEmail, setConfirmEmail] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState('');

  const handleDownload = async (format: 'json' | 'markdown') => {
    setDownloading(true);
    try {
      await api.downloadEntries(format);
    } catch (err: any) {
      setError(err.message || 'Download failed');
    } finally {
      setDownloading(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!confirmEmail) {
      setError('Please enter your email to confirm');
      return;
    }

    setDeleting(true);
    setError('');

    try {
      await api.deleteAccount(confirmEmail);
      logout();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to delete account');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold font-serif text-ink-900">Account</h2>
          <button onClick={onClose} className="btn-icon">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* User info */}
        <div className="mb-6 p-4 bg-parchment-50 rounded-lg">
          <p className="text-sm text-ink-600">Signed in as</p>
          <p className="font-medium text-ink-900">{user?.email}</p>
        </div>

        {/* Download section */}
        <div className="mb-6">
          <h3 className="text-sm font-medium text-ink-700 mb-3 flex items-center gap-2">
            <Download className="w-4 h-4" />
            Download Your Data
          </h3>
          <p className="text-xs text-ink-500 mb-3">
            Export all your entries to keep a local backup.
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => handleDownload('json')}
              disabled={downloading}
              className="btn-secondary flex items-center gap-2 flex-1"
            >
              <FileJson className="w-4 h-4" />
              JSON
            </button>
            <button
              onClick={() => handleDownload('markdown')}
              disabled={downloading}
              className="btn-secondary flex items-center gap-2 flex-1"
            >
              <FileText className="w-4 h-4" />
              Markdown
            </button>
          </div>
        </div>

        {/* Log out */}
        <div className="mb-6">
          <button
            onClick={() => { logout(); onClose(); }}
            className="btn-secondary w-full flex items-center justify-center gap-2"
          >
            <LogOut className="w-4 h-4" />
            Log Out
          </button>
        </div>

        {/* Danger zone - collapsed by default */}
        <div className="border-t border-parchment-200 pt-4">
          {!showDeleteConfirm ? (
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="text-xs text-ink-400 hover:text-red-600 transition-colors"
            >
              Delete account...
            </button>
          ) : (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-start gap-3 mb-3">
                <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-medium text-red-800 text-sm">Delete your account?</h4>
                  <p className="text-xs text-red-600 mt-1">
                    This will permanently delete your account and all your entries. This cannot be undone.
                  </p>
                </div>
              </div>

              <div className="mb-3">
                <label className="block text-xs font-medium text-red-700 mb-1">
                  Type your email to confirm: <span className="font-normal">{user?.email}</span>
                </label>
                <input
                  type="email"
                  value={confirmEmail}
                  onChange={(e) => setConfirmEmail(e.target.value)}
                  placeholder={user?.email}
                  className="input text-sm border-red-300 focus:ring-red-500"
                />
              </div>

              {error && (
                <p className="text-xs text-red-600 mb-3">{error}</p>
              )}

              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setShowDeleteConfirm(false);
                    setConfirmEmail('');
                    setError('');
                  }}
                  className="btn-secondary text-sm flex-1"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteAccount}
                  disabled={deleting || confirmEmail.toLowerCase() !== user?.email?.toLowerCase()}
                  className="bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 flex-1"
                >
                  <Trash2 className="w-4 h-4" />
                  {deleting ? 'Deleting...' : 'Delete Forever'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
