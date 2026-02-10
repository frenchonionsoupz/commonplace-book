import { Router, Request, Response } from 'express';
import pool from '../db';

const router = Router();

async function getNoteTags(noteId: string): Promise<string[]> {
  const result = await pool.query(`
    SELECT t.name FROM tags t
    JOIN note_tags nt ON nt.tag_id = t.id
    WHERE nt.note_id = $1
  `, [noteId]);
  return result.rows.map((t: any) => t.name);
}

router.get('/notes', async (req: Request, res: Response) => {
  try {
    const { user_id, tag, type, limit } = req.query;

    if (!user_id) {
      return res.status(400).json({ error: 'user_id is required' });
    }

    let query = 'SELECT * FROM notes WHERE user_id = $1 AND is_public = TRUE';
    const params: any[] = [user_id];
    let paramIndex = 2;

    if (type) {
      query += ` AND type = $${paramIndex++}`;
      params.push(type);
    }

    if (tag) {
      query += ` AND id IN (
        SELECT nt.note_id FROM note_tags nt
        JOIN tags t ON t.id = nt.tag_id
        WHERE t.name = $${paramIndex++}
      )`;
      params.push((tag as string).toLowerCase());
    }

    query += ' ORDER BY created_at DESC';

    if (limit) {
      query += ` LIMIT $${paramIndex++}`;
      params.push(parseInt(limit as string, 10));
    }

    const result = await pool.query(query, params);

    const notes = await Promise.all(result.rows.map(async (note: any) => ({
      ...note,
      is_public: true,
      tags: await getNoteTags(note.id),
    })));

    res.json(notes);
  } catch (error) {
    console.error('Error fetching embed notes:', error);
    res.status(500).json({ error: 'Failed to fetch notes' });
  }
});

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
  var userId = container.getAttribute('data-user-id') || '';
  var tag = container.getAttribute('data-tag') || '';
  var type = container.getAttribute('data-type') || '';
  var limit = container.getAttribute('data-limit') || '20';
  var theme = container.getAttribute('data-theme') || 'light';

  if (!userId) {
    console.error('Commonplace Book: data-user-id attribute is required.');
    return;
  }

  var params = new URLSearchParams();
  params.set('user_id', userId);
  if (tag) params.set('tag', tag);
  if (type) params.set('type', type);
  if (limit) params.set('limit', limit);
  params.set('theme', theme);

  var iframe = document.createElement('iframe');
  iframe.src = host + '/embed?' + params.toString();
  iframe.style.width = '100%';
  iframe.style.minHeight = '600px';
  iframe.style.border = 'none';
  iframe.style.borderRadius = '12px';

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
