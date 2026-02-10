import { useState, useMemo } from 'react';
import { Mail, Lock, User, ArrowRight, ArrowLeft, Check, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { api } from '../api';
import Logo from '../components/Logo';
import { getRandomQuote } from '../quotes';

type Mode = 'login' | 'signup' | 'forgot';

export default function AuthPage() {
  const { login, signup } = useAuth();
  const [mode, setMode] = useState<Mode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [forgotSent, setForgotSent] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const quote = useMemo(() => getRandomQuote(), []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (mode === 'login') {
        await login(email, password);
      } else if (mode === 'signup') {
        if (password !== confirmPassword) {
          setError('Passwords do not match');
          setLoading(false);
          return;
        }
        await signup(email, password, name);
      } else if (mode === 'forgot') {
        await api.forgotPassword(email);
        setForgotSent(true);
      }
    } catch (err: any) {
      setError(err.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  const switchMode = (newMode: Mode) => {
    setMode(newMode);
    setError('');
    setForgotSent(false);
    if (newMode === 'login') {
      setConfirmPassword('');
    }
  };

  // Forgot password success state
  if (mode === 'forgot' && forgotSent) {
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
            <h2 className="text-xl font-serif font-semibold text-ink-800 mb-2">Check Your Email</h2>
            <p className="text-ink-600 mb-6">
              If an account exists for <strong>{email}</strong>, we've sent a password reset link.
            </p>
            <button
              onClick={() => switchMode('login')}
              className="btn-secondary flex items-center justify-center gap-2 mx-auto"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Sign In
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
            {mode === 'login' ? 'Welcome Back' : mode === 'signup' ? 'Create Your Book' : 'Reset Password'}
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'signup' && (
              <div>
                <label className="block text-sm font-medium text-ink-600 mb-1 font-serif">
                  Name <span className="font-normal text-ink-400 italic">(optional)</span>
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-400" />
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Your name"
                    className="input pl-10"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-ink-600 mb-1 font-serif">
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="input pl-10"
                  required
                />
              </div>
            </div>

            {mode !== 'forgot' && (
              <div>
                <label className="block text-sm font-medium text-ink-600 mb-1 font-serif">
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-400" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder={mode === 'login' ? '••••••••' : 'At least 6 characters'}
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
            )}

            {mode === 'signup' && (
              <div>
                <label className="block text-sm font-medium text-ink-600 mb-1 font-serif">
                  Confirm Password
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
            )}

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
                  {mode === 'login' ? 'Sign In' : mode === 'signup' ? 'Create Account' : 'Send Reset Link'}
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {mode === 'login' && (
            <div className="mt-4 text-center">
              <button
                onClick={() => switchMode('forgot')}
                className="text-sm text-ink-500 hover:text-ink-700 font-serif"
              >
                Forgot your password?
              </button>
            </div>
          )}

          <div className="mt-6 text-center">
            {mode === 'forgot' ? (
              <button
                onClick={() => switchMode('login')}
                className="text-sm text-parchment-700 hover:text-parchment-900 font-serif flex items-center justify-center gap-1 mx-auto"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to Sign In
              </button>
            ) : (
              <button
                onClick={() => switchMode(mode === 'login' ? 'signup' : 'login')}
                className="text-sm text-parchment-700 hover:text-parchment-900 font-serif"
              >
                {mode === 'login' ? "Don't have an account? Sign up" : 'Already have an account? Sign in'}
              </button>
            )}
          </div>
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
