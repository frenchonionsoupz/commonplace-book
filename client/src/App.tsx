import { Routes, Route } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import NoteView from './pages/NoteView';
import EmbedView from './pages/EmbedView';
import AuthPage from './pages/AuthPage';
import ResetPasswordPage from './pages/ResetPasswordPage';

function AppRoutes() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-parchment-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-parchment-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-ink-500 font-serif italic">Loading your book...</p>
        </div>
      </div>
    );
  }

  return (
    <Routes>
      <Route path="/embed" element={<EmbedView />} />
      <Route path="/reset-password" element={<ResetPasswordPage />} />
      {user ? (
        <Route element={<Layout />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/note/:id" element={<NoteView />} />
        </Route>
      ) : (
        <Route path="*" element={<AuthPage />} />
      )}
    </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  );
}
