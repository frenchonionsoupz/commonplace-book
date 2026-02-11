import { Router, Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import { exec } from 'child_process';
import { promisify } from 'util';
import OpenAI from 'openai';

const execAsync = promisify(exec);
const router = Router();

// Setup uploads directory
const UPLOADS_DIR = path.join(__dirname, '..', '..', 'uploads');
if (!fs.existsSync(UPLOADS_DIR)) fs.mkdirSync(UPLOADS_DIR, { recursive: true });

const upload = multer({
  storage: multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, UPLOADS_DIR),
    filename: (_req, file, cb) => cb(null, `${uuidv4()}${path.extname(file.originalname)}`),
  }),
  limits: { fileSize: 500 * 1024 * 1024 }, // 500MB — screen recordings from iOS can be large
});

// Send audio file to OpenAI Whisper and get text back
async function transcribe(filePath: string): Promise<string> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error('OPENAI_API_KEY not configured');

  const openai = new OpenAI({ apiKey });
  const result = await openai.audio.transcriptions.create({
    file: fs.createReadStream(filePath),
    model: 'whisper-1',
  });
  return result.text;
}

// Extract audio track from video using ffmpeg
async function extractAudio(videoPath: string): Promise<string> {
  const audioPath = videoPath.replace(/\.[^.]+$/, '.mp3');
  await execAsync(
    `ffmpeg -i "${videoPath}" -vn -acodec libmp3lame -q:a 4 -y "${audioPath}"`,
    { timeout: 180000 },
  );
  return audioPath;
}

// POST /api/transcribe — audio transcription
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

// POST /api/transcribe/video — video → extract audio → transcribe
router.post('/video', upload.single('file'), async (req: Request, res: Response) => {
  if (!req.file) return res.status(400).json({ error: 'No file provided' });

  const fileUrl = `/uploads/${req.file.filename}`;

  if (!process.env.OPENAI_API_KEY) {
    return res.json({ url: fileUrl, transcription: '', message: 'No OPENAI_API_KEY configured.' });
  }

  let audioPath: string | null = null;

  try {
    const isVideo = req.file.mimetype?.startsWith('video/') ||
      /\.(mp4|webm|mov|avi|mkv)$/i.test(req.file.originalname);

    if (isVideo) {
      try {
        audioPath = await extractAudio(req.file.path);
      } catch (extractErr: any) {
        console.error('Audio extraction failed:', extractErr.message);
        return res.json({
          url: fileUrl,
          transcription: '',
          message: 'Could not extract audio from video. The file may not contain an audio track.',
        });
      }
    }

    const transcription = await transcribe(audioPath || req.file.path);
    res.json({ url: fileUrl, transcription });
  } catch (error: any) {
    console.error('Video transcription error:', error.message);
    res.status(500).json({ url: fileUrl, error: 'Transcription failed', message: error.message });
  } finally {
    // Clean up extracted audio file
    if (audioPath && fs.existsSync(audioPath)) fs.unlinkSync(audioPath);
  }
});

export default router;
