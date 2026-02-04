import { Router, Request, Response } from 'express';
import db from '../db';

const router = Router();

interface NoteRow {
  id: string;
  title: string;
  content: string;
  type: string;
  source: string;
  source_type: string;
  media_url: string;
  transcription: string;
  created_at: string;
  updated_at: string;
  is_public: number;
}

function getNoteTags(noteId: string): string[] {
  const tags = db.prepare(`
    SELECT t.name FROM tags t
    JOIN note_tags nt ON nt.tag_id = t.id
    WHERE nt.note_id = ?
  `).all(noteId) as { name: string }[];
  return tags.map(t => t.name);
}

// GET /api/embed/notes — public notes for embedding
router.get('/notes', (req: Request, res: Response) => {
  const { tag, type, limit } = req.query;
  let query = 'SELECT * FROM notes WHERE is_public = 1';
  const params: any[] = [];

  if (type) {
    query += ' AND type = ?';
    params.push(type);
  }

  if (tag) {
    query += ` AND id IN (
      SELECT nt.note_id FROM note_tags nt
      JOIN tags t ON t.id = nt.tag_id
      WHERE t.name = ?
    )`;
    params.push((tag as string).toLowerCase());
  }

  query += ' ORDER BY created_at DESC';

  if (limit) {
    query += ' LIMIT ?';
    params.push(parseInt(limit as string, 10));
  }

  const notes = db.prepare(query).all(...params) as NoteRow[];

  const result = notes.map(note => ({
    ...note,
    is_public: true,
    tags: getNoteTags(note.id),
  }));

  res.json(result);
});

// GET /api/embed/script — serve the embed widget JS
router.get('/script', (_req: Request, res: Response) => {
  res.setHeader('Content-Type', 'application/javascript');
  res.send(`
(function() {
  var container = document.getElementById('commonplace-book');
  if (!container) {
    console.error('Commonplace Book: No element with id="commonplace-book" found.');
    return;
  }

  var host = container.getAttribute('data-host') || window.location.origin;
  var tag = container.getAttribute('data-tag') || '';
  var type = container.getAttribute('data-type') || '';
  var limit = container.getAttribute('data-limit') || '20';
  var theme = container.getAttribute('data-theme') || 'light';

  var params = new URLSearchParams();
  if (tag) params.set('tag', tag);
  if (type) params.set('type', type);
  if (limit) params.set('limit', limit);

  var iframe = document.createElement('iframe');
  iframe.src = host + '/embed?' + params.toString() + '&theme=' + theme;
  iframe.style.width = '100%';
  iframe.style.minHeight = '600px';
  iframe.style.border = 'none';
  iframe.style.borderRadius = '12px';

  // Auto-resize iframe
  window.addEventListener('message', function(e) {
    if (e.data && e.data.type === 'commonplace-book-resize') {
      iframe.style.height = e.data.height + 'px';
    }
  });

  container.appendChild(iframe);
})();
  `.trim());
});

export default router;
