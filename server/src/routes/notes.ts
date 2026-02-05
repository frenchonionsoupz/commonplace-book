import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import pool from '../db';

const router = Router();

function paramId(req: Request): string {
  const id = req.params.id;
  return Array.isArray(id) ? id[0] : id;
}

async function getNoteTags(noteId: string): Promise<string[]> {
  const result = await pool.query(`
    SELECT t.name FROM tags t
    JOIN note_tags nt ON nt.tag_id = t.id
    WHERE nt.note_id = $1
  `, [noteId]);
  return result.rows.map(t => t.name);
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

router.get('/', async (req: Request, res: Response) => {
  try {
    const { search, tag, type, source_type, public_only } = req.query;

    let query = 'SELECT * FROM notes WHERE 1=1';
    const params: any[] = [];
    let paramIndex = 1;

    if (public_only === 'true') {
      query += ' AND is_public = TRUE';
    }

    if (type) {
      query += ` AND type = $${paramIndex++}`;
      params.push(type);
    }

    if (source_type) {
      query += ` AND source_type = $${paramIndex++}`;
      params.push(source_type);
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

    const result = await pool.query(query, params);

    const notes = await Promise.all(result.rows.map(async (note) => ({
      ...note,
      tags: await getNoteTags(note.id),
    })));

    res.json(notes);
  } catch (error) {
    console.error('Error fetching notes:', error);
    res.status(500).json({ error: 'Failed to fetch notes' });
  }
});

router.get('/:id', async (req: Request, res: Response) => {
  try {
    const result = await pool.query('SELECT * FROM notes WHERE id = $1', [paramId(req)]);

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

router.post('/', async (req: Request, res: Response) => {
  try {
    const { title, content, type, source, source_type, media_url, transcription, tags, is_public } = req.body;

    if (!title || !type) {
      return res.status(400).json({ error: 'Title and type are required' });
    }

    const id = uuidv4();
    const now = new Date().toISOString();

    await pool.query(`
      INSERT INTO notes (id, title, content, type, source, source_type, media_url, transcription, created_at, updated_at, is_public)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
    `, [
      id,
      title,
      content || '',
      type,
      source || '',
      source_type || '',
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

router.put('/:id', async (req: Request, res: Response) => {
  try {
    const id = paramId(req);
    const existing = await pool.query('SELECT * FROM notes WHERE id = $1', [id]);
    
    if (existing.rows.length === 0) {
      return res.status(404).json({ error: 'Note not found' });
    }

    const { title, content, source, source_type, media_url, transcription, tags, is_public } = req.body;
    const now = new Date().toISOString();

    await pool.query(`
      UPDATE notes SET
        title = COALESCE($1, title),
        content = COALESCE($2, content),
        source = COALESCE($3, source),
        source_type = COALESCE($4, source_type),
        media_url = COALESCE($5, media_url),
        transcription = COALESCE($6, transcription),
        is_public = COALESCE($7, is_public),
        updated_at = $8
      WHERE id = $9
    `, [
      title ?? null,
      content ?? null,
      source ?? null,
      source_type ?? null,
      media_url ?? null,
      transcription ?? null,
      is_public ?? null,
      now,
      id
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

router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const id = paramId(req);
    const existing = await pool.query('SELECT * FROM notes WHERE id = $1', [id]);
    
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

router.get('/meta/tags', async (_req: Request, res: Response) => {
  try {
    const result = await pool.query(`
      SELECT t.name, COUNT(nt.note_id) as count
      FROM tags t
      LEFT JOIN note_tags nt ON nt.tag_id = t.id
      GROUP BY t.id
      ORDER BY count DESC
    `);

    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching tags:', error);
    res.status(500).json({ error: 'Failed to fetch tags' });
  }
});

export default router;
