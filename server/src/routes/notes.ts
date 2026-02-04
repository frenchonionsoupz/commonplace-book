import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import db from '../db';

const router = Router();

function paramId(req: Request): string {
  const id = req.params.id;
  return Array.isArray(id) ? id[0] : id;
}

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

interface TagRow {
  id: string;
  name: string;
}

function getNoteTags(noteId: string): string[] {
  const tags = db.prepare(`
    SELECT t.name FROM tags t
    JOIN note_tags nt ON nt.tag_id = t.id
    WHERE nt.note_id = ?
  `).all(noteId) as { name: string }[];
  return tags.map(t => t.name);
}

function syncNoteTags(noteId: string, tagNames: string[]) {
  // Remove existing tags for this note
  db.prepare('DELETE FROM note_tags WHERE note_id = ?').run(noteId);

  for (const name of tagNames) {
    const trimmed = name.trim().toLowerCase();
    if (!trimmed) continue;

    // Upsert tag
    let tag = db.prepare('SELECT id FROM tags WHERE name = ?').get(trimmed) as TagRow | undefined;
    if (!tag) {
      const tagId = uuidv4();
      db.prepare('INSERT INTO tags (id, name) VALUES (?, ?)').run(tagId, trimmed);
      tag = { id: tagId, name: trimmed };
    }

    // Link tag to note
    db.prepare('INSERT OR IGNORE INTO note_tags (note_id, tag_id) VALUES (?, ?)').run(noteId, tag.id);
  }
}

// GET /api/notes — list all notes (with optional filters)
router.get('/', (req: Request, res: Response) => {
  const { search, tag, type, source_type, public_only } = req.query;

  let query = 'SELECT * FROM notes WHERE 1=1';
  const params: any[] = [];

  if (public_only === 'true') {
    query += ' AND is_public = 1';
  }

  if (type) {
    query += ' AND type = ?';
    params.push(type);
  }

  if (source_type) {
    query += ' AND source_type = ?';
    params.push(source_type);
  }

  if (search) {
    query += ' AND (title LIKE ? OR content LIKE ? OR transcription LIKE ? OR source LIKE ?)';
    const term = `%${search}%`;
    params.push(term, term, term, term);
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

  const notes = db.prepare(query).all(...params) as NoteRow[];

  const result = notes.map(note => ({
    ...note,
    is_public: Boolean(note.is_public),
    tags: getNoteTags(note.id),
  }));

  res.json(result);
});

// GET /api/notes/:id — get a single note
router.get('/:id', (req: Request, res: Response) => {
  const note = db.prepare('SELECT * FROM notes WHERE id = ?').get(paramId(req)) as NoteRow | undefined;

  if (!note) {
    return res.status(404).json({ error: 'Note not found' });
  }

  res.json({
    ...note,
    is_public: Boolean(note.is_public),
    tags: getNoteTags(note.id),
  });
});

// POST /api/notes — create a new note
router.post('/', (req: Request, res: Response) => {
  const { title, content, type, source, source_type, media_url, transcription, tags, is_public } = req.body;

  if (!title || !type) {
    return res.status(400).json({ error: 'Title and type are required' });
  }

  const id = uuidv4();
  const now = new Date().toISOString();

  db.prepare(`
    INSERT INTO notes (id, title, content, type, source, source_type, media_url, transcription, created_at, updated_at, is_public)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
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
    is_public !== undefined ? (is_public ? 1 : 0) : 1
  );

  if (tags && Array.isArray(tags)) {
    syncNoteTags(id, tags);
  }

  const note = db.prepare('SELECT * FROM notes WHERE id = ?').get(id) as NoteRow;

  res.status(201).json({
    ...note,
    is_public: Boolean(note.is_public),
    tags: getNoteTags(id),
  });
});

// PUT /api/notes/:id — update a note
router.put('/:id', (req: Request, res: Response) => {
  const id = paramId(req);
  const existing = db.prepare('SELECT * FROM notes WHERE id = ?').get(id) as NoteRow | undefined;
  if (!existing) {
    return res.status(404).json({ error: 'Note not found' });
  }

  const { title, content, source, source_type, media_url, transcription, tags, is_public } = req.body;
  const now = new Date().toISOString();

  db.prepare(`
    UPDATE notes SET
      title = COALESCE(?, title),
      content = COALESCE(?, content),
      source = COALESCE(?, source),
      source_type = COALESCE(?, source_type),
      media_url = COALESCE(?, media_url),
      transcription = COALESCE(?, transcription),
      is_public = COALESCE(?, is_public),
      updated_at = ?
    WHERE id = ?
  `).run(
    title ?? null,
    content ?? null,
    source ?? null,
    source_type ?? null,
    media_url ?? null,
    transcription ?? null,
    is_public !== undefined ? (is_public ? 1 : 0) : null,
    now,
    id
  );

  if (tags && Array.isArray(tags)) {
    syncNoteTags(id, tags);
  }

  const note = db.prepare('SELECT * FROM notes WHERE id = ?').get(id) as NoteRow;

  res.json({
    ...note,
    is_public: Boolean(note.is_public),
    tags: getNoteTags(id),
  });
});

// DELETE /api/notes/:id — delete a note
router.delete('/:id', (req: Request, res: Response) => {
  const id = paramId(req);
  const existing = db.prepare('SELECT * FROM notes WHERE id = ?').get(id) as NoteRow | undefined;
  if (!existing) {
    return res.status(404).json({ error: 'Note not found' });
  }

  db.prepare('DELETE FROM notes WHERE id = ?').run(id);
  res.status(204).send();
});

// GET /api/tags — list all tags
router.get('/meta/tags', (_req: Request, res: Response) => {
  const tags = db.prepare(`
    SELECT t.name, COUNT(nt.note_id) as count
    FROM tags t
    LEFT JOIN note_tags nt ON nt.tag_id = t.id
    GROUP BY t.id
    ORDER BY count DESC
  `).all();

  res.json(tags);
});

export default router;
