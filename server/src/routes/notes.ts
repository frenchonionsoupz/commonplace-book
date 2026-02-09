import { Router, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import pool from '../db';
import { authMiddleware, AuthRequest } from '../middleware/auth';

const router = Router();

function paramId(req: AuthRequest): string {
  const id = req.params.id;
  return Array.isArray(id) ? id[0] : id;
}

function deriveTitle(content: string, transcription: string, type: string): string {
  const text = content || transcription || '';
  if (text.length > 0) {
    const firstLine = text.split('\n')[0].trim();
    return firstLine.length > 80 ? firstLine.slice(0, 80) + '...' : firstLine;
  }
  const labels: Record<string, string> = { text: 'Note', voice: 'Voice Note', video: 'Video Note' };
  return `${labels[type] || 'Note'} — ${new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;
}

async function getNoteTags(noteId: string): Promise<string[]> {
  const result = await pool.query(`
    SELECT t.name FROM tags t
    JOIN note_tags nt ON nt.tag_id = t.id
    WHERE nt.note_id = $1
  `, [noteId]);
  return result.rows.map((t: any) => t.name);
}

async function syncNoteTags(noteId: string, tagNames: string[]) {
  await pool.query('DELETE FROM note_tags WHERE note_id = $1', [noteId]);

  for (const name of tagNames) {
    const trimmed = name.trim().toLowerCase();
    if (!trimmed) continue;

    let tagResult = await pool.query('SELECT id FROM tags WHERE name = $1', [trimmed]);
    let tagId: string;

    if (tagResult.rows.length === 0) {
      tagId = uuidv4();
      await pool.query('INSERT INTO tags (id, name) VALUES ($1, $2)', [tagId, trimmed]);
    } else {
      tagId = tagResult.rows[0].id;
    }

    await pool.query(
      'INSERT INTO note_tags (note_id, tag_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
      [noteId, tagId]
    );
  }
}

// All routes require authentication
router.use(authMiddleware);

router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const { search, tag, type, limit } = req.query;
    const userId = req.userId;

    let query = 'SELECT * FROM notes WHERE user_id = $1';
    const params: any[] = [userId];
    let paramIndex = 2;

    if (type) {
      query += ` AND type = $${paramIndex++}`;
      params.push(type);
    }

    if (search) {
      query += ` AND (title ILIKE $${paramIndex} OR content ILIKE $${paramIndex} OR transcription ILIKE $${paramIndex} OR source ILIKE $${paramIndex})`;
      params.push(`%${search}%`);
      paramIndex++;
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
      const lim = parseInt(limit as string, 10);
      if (lim > 0) {
        query += ` LIMIT $${paramIndex++}`;
        params.push(lim);
      }
    }

    const result = await pool.query(query, params);

    const notes = await Promise.all(result.rows.map(async (note: any) => ({
      ...note,
      tags: await getNoteTags(note.id),
    })));

    res.json(notes);
  } catch (error) {
    console.error('Error fetching notes:', error);
    res.status(500).json({ error: 'Failed to fetch notes' });
  }
});

router.get('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const result = await pool.query(
      'SELECT * FROM notes WHERE id = $1 AND user_id = $2',
      [paramId(req), req.userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Note not found' });
    }

    const note = result.rows[0];
    res.json({
      ...note,
      tags: await getNoteTags(note.id),
    });
  } catch (error) {
    console.error('Error fetching note:', error);
    res.status(500).json({ error: 'Failed to fetch note' });
  }
});

router.post('/', async (req: AuthRequest, res: Response) => {
  try {
    const { title, content, type, source, media_url, transcription, tags, is_public } = req.body;
    const userId = req.userId;

    if (!type) {
      return res.status(400).json({ error: 'Type is required' });
    }

    const id = uuidv4();
    const now = new Date().toISOString();
    const finalTitle = title || deriveTitle(content || '', transcription || '', type);

    await pool.query(`
      INSERT INTO notes (id, user_id, title, content, type, source, media_url, transcription, created_at, updated_at, is_public)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
    `, [
      id,
      userId,
      finalTitle,
      content || '',
      type,
      source || '',
      media_url || '',
      transcription || '',
      now,
      now,
      is_public !== undefined ? is_public : true
    ]);

    if (tags && Array.isArray(tags)) {
      await syncNoteTags(id, tags);
    }

    const result = await pool.query('SELECT * FROM notes WHERE id = $1', [id]);
    const note = result.rows[0];

    res.status(201).json({
      ...note,
      tags: await getNoteTags(id),
    });
  } catch (error) {
    console.error('Error creating note:', error);
    res.status(500).json({ error: 'Failed to create note' });
  }
});

router.put('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const id = paramId(req);
    const existing = await pool.query(
      'SELECT * FROM notes WHERE id = $1 AND user_id = $2',
      [id, req.userId]
    );

    if (existing.rows.length === 0) {
      return res.status(404).json({ error: 'Note not found' });
    }

    const { title, content, source, media_url, transcription, tags, is_public } = req.body;
    const now = new Date().toISOString();

    await pool.query(`
      UPDATE notes SET
        title = COALESCE($1, title),
        content = COALESCE($2, content),
        source = COALESCE($3, source),
        media_url = COALESCE($4, media_url),
        transcription = COALESCE($5, transcription),
        is_public = COALESCE($6, is_public),
        updated_at = $7
      WHERE id = $8 AND user_id = $9
    `, [
      title ?? null,
      content ?? null,
      source ?? null,
      media_url ?? null,
      transcription ?? null,
      is_public ?? null,
      now,
      id,
      req.userId
    ]);

    if (tags && Array.isArray(tags)) {
      await syncNoteTags(id, tags);
    }

    const result = await pool.query('SELECT * FROM notes WHERE id = $1', [id]);
    const note = result.rows[0];

    res.json({
      ...note,
      tags: await getNoteTags(id),
    });
  } catch (error) {
    console.error('Error updating note:', error);
    res.status(500).json({ error: 'Failed to update note' });
  }
});

router.delete('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const id = paramId(req);
    const existing = await pool.query(
      'SELECT * FROM notes WHERE id = $1 AND user_id = $2',
      [id, req.userId]
    );

    if (existing.rows.length === 0) {
      return res.status(404).json({ error: 'Note not found' });
    }

    await pool.query('DELETE FROM notes WHERE id = $1', [id]);
    res.status(204).send();
  } catch (error) {
    console.error('Error deleting note:', error);
    res.status(500).json({ error: 'Failed to delete note' });
  }
});

router.get('/meta/tags', async (req: AuthRequest, res: Response) => {
  try {
    const result = await pool.query(`
      SELECT t.name, COUNT(nt.note_id) as count
      FROM tags t
      LEFT JOIN note_tags nt ON nt.tag_id = t.id
      LEFT JOIN notes n ON n.id = nt.note_id
      WHERE n.user_id = $1
      GROUP BY t.id
      ORDER BY count DESC
    `, [req.userId]);

    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching tags:', error);
    res.status(500).json({ error: 'Failed to fetch tags' });
  }
});

export default router;
