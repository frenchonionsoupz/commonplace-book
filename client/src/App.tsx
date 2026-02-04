import { Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import NoteView from './pages/NoteView';
import EmbedView from './pages/EmbedView';

export default function App() {
  return (
    <Routes>
      <Route path="/embed" element={<EmbedView />} />
      <Route element={<Layout />}>
        <Route path="/" element={<Dashboard />} />
        <Route path="/note/:id" element={<NoteView />} />
      </Route>
    </Routes>
  );
}
