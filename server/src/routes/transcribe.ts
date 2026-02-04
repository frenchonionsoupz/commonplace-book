import { Router, Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';

const router = Router();

const UPLOADS_DIR = path.join(__dirname, '..', '..', 'uploads');
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, UPLOADS_DIR),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${uuidv4()}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 25 * 1024 * 1024 }, // Whisper limit: 25MB
});

// POST /api/transcribe — transcribe audio using OpenAI Whisper
router.post('/', upload.single('audio'), async (req: Request, res: Response) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No audio file provided' });
  }

  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    // Return the file URL but indicate no server-side transcription is available
    const fileUrl = `/uploads/${req.file.filename}`;
    return res.json({
      url: fileUrl,
      transcription: '',
      message: 'No OPENAI_API_KEY configured. Use browser-based transcription or set the API key.',
    });
  }

  try {
    const { default: OpenAI } = await import('openai');
    const openai = new OpenAI({ apiKey });

    const transcription = await openai.audio.transcriptions.create({
      file: fs.createReadStream(req.file.path),
      model: 'whisper-1',
      response_format: 'text',
    });

    const fileUrl = `/uploads/${req.file.filename}`;

    res.json({
      url: fileUrl,
      transcription: transcription as unknown as string,
    });
  } catch (error: any) {
    console.error('Transcription error:', error.message);
    const fileUrl = `/uploads/${req.file.filename}`;
    res.status(500).json({
      url: fileUrl,
      error: 'Transcription failed',
      message: error.message,
    });
  }
});

export default router;
