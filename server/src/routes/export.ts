import { Router, Response } from 'express';
import nodemailer from 'nodemailer';
import pool from '../db';
import { authMiddleware, AuthRequest } from '../middleware/auth';

const router = Router();

router.use(authMiddleware);

async function getNoteTags(noteId: string): Promise<string[]> {
  const result = await pool.query(`
    SELECT t.name FROM tags t
    JOIN note_tags nt ON nt.tag_id = t.id
    WHERE nt.note_id = $1
  `, [noteId]);
  return result.rows.map((t: any) => t.name);
}

function formatNoteForEmail(note: any, tags: string[]): string {
  const date = new Date(note.created_at).toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const typeLabels: Record<string, string> = {
    text: '📝 Text',
    voice: '🎙️ Voice',
    video: '🎬 Video',
  };

  let content = note.content || note.transcription || '';

  return `
    <div style="margin-bottom: 32px; padding: 24px; background: #fdfaf5; border: 1px solid #e8d5b7; border-radius: 8px;">
      <div style="color: #666; font-size: 12px; margin-bottom: 8px;">
        ${typeLabels[note.type] || note.type} • ${date}
      </div>
      <h3 style="margin: 0 0 12px 0; color: #333; font-family: 'EB Garamond', Georgia, serif;">${note.title}</h3>
      <div style="color: #444; line-height: 1.6; white-space: pre-wrap; font-family: 'EB Garamond', Georgia, serif;">
        ${content}
      </div>
      ${note.source ? `<div style="margin-top: 12px; color: #666; font-size: 14px; font-style: italic;">Source: ${note.source}</div>` : ''}
      ${tags.length > 0 ? `<div style="margin-top: 12px;">${tags.map(t => `<span style="display: inline-block; background: #e8d5b7; color: #5a4a3a; padding: 2px 8px; border-radius: 12px; font-size: 12px; margin-right: 4px;">${t}</span>`).join('')}</div>` : ''}
    </div>
  `;
}

// POST /api/export/email
router.post('/email', async (req: AuthRequest, res: Response) => {
  try {
    const { email, filter } = req.body;
    const userId = req.userId;

    if (!email) {
      return res.status(400).json({ error: 'Email address is required' });
    }

    // Build query based on filter
    let query = 'SELECT * FROM notes WHERE user_id = $1';
    const params: any[] = [userId];
    let paramIndex = 2;

    if (filter === 'new') {
      // Entries from the last 24 hours
      query += ` AND created_at > NOW() - INTERVAL '24 hours'`;
    } else if (filter && filter.startsWith('days:')) {
      const days = parseInt(filter.split(':')[1], 10);
      if (days > 0) {
        query += ` AND created_at > NOW() - INTERVAL '${days} days'`;
      }
    }
    // filter === 'all' means no date restriction

    query += ' ORDER BY created_at DESC';

    const result = await pool.query(query, params);

    if (result.rows.length === 0) {
      return res.status(400).json({ error: 'No entries found for the selected filter' });
    }

    // Get tags for all notes
    const notesWithTags = await Promise.all(result.rows.map(async (note: any) => ({
      note,
      tags: await getNoteTags(note.id),
    })));

    // Format email content
    const entriesHtml = notesWithTags.map(({ note, tags }) => formatNoteForEmail(note, tags)).join('');

    const filterLabel = filter === 'new' ? 'New (last 24 hours)' :
                       filter === 'all' ? 'All entries' :
                       filter?.startsWith('days:') ? `Last ${filter.split(':')[1]} days` : 'Selected entries';

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Your Commonplace Book</title>
      </head>
      <body style="font-family: 'EB Garamond', Georgia, serif; max-width: 600px; margin: 0 auto; padding: 24px; background: #fff;">
        <div style="text-align: center; margin-bottom: 32px; padding-bottom: 24px; border-bottom: 2px solid #e8d5b7;">
          <h1 style="color: #5a4a3a; margin: 0; font-size: 28px;">📖 Your Commonplace Book</h1>
          <p style="color: #888; margin: 8px 0 0 0; font-style: italic;">${filterLabel} • ${result.rows.length} ${result.rows.length === 1 ? 'entry' : 'entries'}</p>
        </div>
        ${entriesHtml}
        <div style="text-align: center; margin-top: 32px; padding-top: 24px; border-top: 1px solid #e8d5b7; color: #888; font-size: 12px;">
          Exported from your Commonplace Book
        </div>
      </body>
      </html>
    `;

    // Configure email transport
    const smtpHost = process.env.SMTP_HOST;
    const smtpPort = parseInt(process.env.SMTP_PORT || '587', 10);
    const smtpUser = process.env.SMTP_USER;
    const smtpPass = process.env.SMTP_PASS;
    const fromEmail = process.env.FROM_EMAIL || smtpUser;

    if (!smtpHost || !smtpUser || !smtpPass) {
      return res.status(500).json({
        error: 'Email not configured. Please set SMTP_HOST, SMTP_USER, and SMTP_PASS environment variables.'
      });
    }

    const transporter = nodemailer.createTransport({
      host: smtpHost,
      port: smtpPort,
      secure: smtpPort === 465,
      auth: {
        user: smtpUser,
        pass: smtpPass,
      },
    });

    await transporter.sendMail({
      from: fromEmail,
      to: email,
      subject: `Your Commonplace Book - ${filterLabel}`,
      html: htmlContent,
    });

    res.json({ success: true, message: `Entries sent to ${email}` });
  } catch (error) {
    console.error('Export error:', error);
    res.status(500).json({ error: 'Failed to send email' });
  }
});

// GET /api/export/download - Download all entries as JSON or Markdown
router.get('/download', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;
    const format = (req.query.format as string) || 'json';

    const result = await pool.query(
      'SELECT * FROM notes WHERE user_id = $1 ORDER BY created_at DESC',
      [userId]
    );

    // Get tags for all notes
    const entries = await Promise.all(result.rows.map(async (note: any) => ({
      id: note.id,
      title: note.title,
      content: note.content,
      transcription: note.transcription,
      type: note.type,
      source: note.source,
      tags: await getNoteTags(note.id),
      created_at: note.created_at,
      updated_at: note.updated_at,
    })));

    if (format === 'markdown') {
      // Generate Markdown
      let markdown = `# My Commonplace Book\n\nExported on ${new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}\n\n---\n\n`;

      for (const entry of entries) {
        const date = new Date(entry.created_at).toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        });
        const content = entry.content || entry.transcription || '';
        const typeLabel = entry.type === 'text' ? '📝' : entry.type === 'voice' ? '🎙️' : '🎬';

        markdown += `## ${entry.title}\n\n`;
        markdown += `*${typeLabel} ${entry.type} • ${date}*\n\n`;
        markdown += `${content}\n\n`;
        if (entry.source) {
          markdown += `**Source:** ${entry.source}\n\n`;
        }
        if (entry.tags.length > 0) {
          markdown += `**Tags:** ${entry.tags.join(', ')}\n\n`;
        }
        markdown += `---\n\n`;
      }

      res.setHeader('Content-Type', 'text/markdown');
      res.setHeader('Content-Disposition', 'attachment; filename="commonplace-book.md"');
      res.send(markdown);
    } else {
      // JSON format
      const exportData = {
        exported_at: new Date().toISOString(),
        total_entries: entries.length,
        entries,
      };

      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', 'attachment; filename="commonplace-book.json"');
      res.json(exportData);
    }
  } catch (error) {
    console.error('Download error:', error);
    res.status(500).json({ error: 'Failed to generate download' });
  }
});

export default router;
