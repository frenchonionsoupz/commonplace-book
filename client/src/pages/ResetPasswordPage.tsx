import { useState, useMemo } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Lock, ArrowRight, Check, Eye, EyeOff } from 'lucide-react';
import { api } from '../api';
import Logo from '../components/Logo';
import { getRandomQuote } from '../quotes';

export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token');

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const quote = useMemo(() => getRandomQuote(), []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (!token) {
      setError('Invalid reset link');
      return;
    }

    setLoading(true);

    try {
      await api.resetPassword(token, password);
      setSuccess(true);
    } catch (err: any) {
      setError(err.message || 'Failed to reset password');
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <div className="min-h-screen bg-parchment-50 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="entry-card p-8 text-center">
            <h2 className="text-xl font-serif font-semibold text-ink-800 mb-4">Invalid Reset Link</h2>
            <p className="text-ink-600 mb-6">
              This password reset link is invalid or has expired.
            </p>
            <button
              onClick={() => navigate('/')}
              className="btn-primary"
            >
              Go to Login
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen bg-parchment-50 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <div className="flex items-center justify-center gap-3 mb-2">
              <Logo size={48} />
              <h1 className="text-3xl font-serif font-semibold tracking-wide text-ink-800">
                Commonplace Book
              </h1>
            </div>
          </div>

          <div className="entry-card p-8 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Check className="w-8 h-8 text-green-600" />
            </div>
            <h2 className="text-xl font-serif font-semibold text-ink-800 mb-2">Password Reset!</h2>
            <p className="text-ink-600 mb-6">
              Your password has been successfully reset. You can now sign in with your new password.
            </p>
            <button
              onClick={() => navigate('/')}
              className="btn-primary flex items-center justify-center gap-2 mx-auto"
            >
              Sign In
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-parchment-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-2">
            <Logo size={48} />
            <h1 className="text-3xl font-serif font-semibold tracking-wide text-ink-800">
              Commonplace Book
            </h1>
          </div>
          <p className="text-ink-500 font-serif italic">
            A digital sanctuary for your thoughts and discoveries
          </p>
        </div>

        {/* Card */}
        <div className="entry-card p-8">
          <h2 className="text-xl font-serif font-semibold text-ink-800 mb-6 text-center">
            Set New Password
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-ink-600 mb-1 font-serif">
                New Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="At least 6 characters"
                  className="input pl-10 pr-10"
                  required
                  minLength={6}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-400 hover:text-ink-600"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-ink-600 mb-1 font-serif">
                Confirm New Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-400" />
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Type password again"
                  className="input pl-10 pr-10"
                  required
                  minLength={6}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-400 hover:text-ink-600"
                  tabIndex={-1}
                >
                  {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full flex items-center justify-center gap-2"
            >
              {loading ? (
                'Please wait...'
              ) : (
                <>
                  Reset Password
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        </div>

        {/* Footer */}
        <p className="text-center text-ink-400 text-xs mt-6 font-serif italic">
          "{quote.text}"
          <br />
          — {quote.author}
        </p>
      </div>
    </div>
  );
}
