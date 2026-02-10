import { Router, Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);
const router = Router();

const UPLOADS_DIR = path.join(__dirname, '..', '..', 'uploads');
if (!fs.existsSync(UPLOADS_DIR)) fs.mkdirSync(UPLOADS_DIR, { recursive: true });

const upload = multer({
  storage: multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, UPLOADS_DIR),
    filename: (_req, file, cb) => cb(null, `${uuidv4()}${path.extname(file.originalname)}`),
  }),
  limits: { fileSize: 100 * 1024 * 1024 },
});

async function transcribe(filePath: string): Promise<string> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error('OPENAI_API_KEY not configured');

  const fileBuffer = fs.readFileSync(filePath);
  const fileName = path.basename(filePath);

  const form = new FormData();
  form.append('file', new Blob([fileBuffer]), fileName);
  form.append('model', 'whisper-1');

  const res = await fetch('https://api.openai.com/v1/audio/transcriptions', {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}` },
    body: form,
  });

  if (!res.ok) {
    const body: any = await res.json().catch(() => ({}));
    throw new Error(body?.error?.message || `OpenAI API error: ${res.status}`);
  }

  const data: any = await res.json();
  return data.text;
}

async function extractAudio(videoPath: string): Promise<string | null> {
  try {
    await execAsync('ffmpeg -version');
    const audioPath = videoPath.replace(/\.[^.]+$/, '.mp3');
    await execAsync(`ffmpeg -i "${videoPath}" -vn -acodec libmp3lame -q:a 4 -y "${audioPath}"`, { timeout: 120000 });
    return audioPath;
  } catch {
    return null;
  }
}

router.post('/', upload.single('audio'), async (req: Request, res: Response) => {
  if (!req.file) return res.status(400).json({ error: 'No audio file provided' });

  const fileUrl = `/uploads/${req.file.filename}`;

  if (!process.env.OPENAI_API_KEY) {
    return res.json({ url: fileUrl, transcription: '', message: 'No OPENAI_API_KEY configured.' });
  }

  try {
    const transcription = await transcribe(req.file.path);
    res.json({ url: fileUrl, transcription });
  } catch (error: any) {
    console.error('Transcription error:', error.message);
    res.status(500).json({ url: fileUrl, error: 'Transcription failed', message: error.message });
  }
});

router.post('/video', upload.single('file'), async (req: Request, res: Response) => {
  if (!req.file) return res.status(400).json({ error: 'No file provided' });

  const fileUrl = `/uploads/${req.file.filename}`;

  if (!process.env.OPENAI_API_KEY) {
    return res.json({ url: fileUrl, transcription: '', message: 'No OPENAI_API_KEY configured.' });
  }

  try {
    const isVideo = req.file.mimetype?.startsWith('video/') || /\.(mp4|webm|mov|avi|mkv)$/i.test(req.file.originalname);
    let audioPath = req.file.path;

    if (isVideo) {
      const extracted = await extractAudio(req.file.path);
      if (extracted) audioPath = extracted;
    }

    const transcription = await transcribe(audioPath);

    if (audioPath !== req.file.path && fs.existsSync(audioPath)) fs.unlinkSync(audioPath);

    res.json({ url: fileUrl, transcription });
  } catch (error: any) {
    console.error('Video transcription error:', error.message);
    res.status(500).json({ url: fileUrl, error: 'Transcription failed', message: error.message });
  }
});

export default router;
