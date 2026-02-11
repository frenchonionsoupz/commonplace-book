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
  limits: { fileSize: 100 * 1024 * 1024 },
});

// Send audio file to OpenAI Whisper and get text back
async function transcribe(filePath: string): Promise<string> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error('OPENAI_API_KEY not configured');

  const openai = new OpenAI({ apiKey, timeout: 300000 });
  const result = await openai.audio.transcriptions.create({
    file: fs.createReadStream(filePath),
    model: 'whisper-1',
  });
  return result.text;
}

// Extract audio track from video using ffmpeg
// Mono 16kHz 48kbps — small file, fast Whisper upload, perfect for speech
async function extractAudio(videoPath: string): Promise<string> {
  const audioPath = videoPath.replace(/\.[^.]+$/, '.mp3');
  try {
    const { stderr } = await execAsync(
      `ffmpeg -i "${videoPath}" -vn -ac 1 -ar 16000 -b:a 48k -y "${audioPath}"`,
      { timeout: 180000 },
    );
    console.log('ffmpeg output:', stderr?.slice(-500));
  } catch (err: any) {
    // ffmpeg writes progress to stderr even on success, so check if output file exists
    console.error('ffmpeg error:', err.message?.slice(-500));
    if (!fs.existsSync(audioPath) || fs.statSync(audioPath).size === 0) {
      throw new Error('Failed to extract audio from video');
    }
  }

  // Verify the extracted file has actual content
  const stat = fs.statSync(audioPath);
  console.log(`Extracted audio: ${stat.size} bytes`);
  if (stat.size < 1000) {
    throw new Error('Extracted audio is empty — video may not contain an audio track');
  }

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
  // Allow up to 5 minutes for upload + ffmpeg + Whisper
  req.setTimeout(300000);
  res.setTimeout(300000);
  if (!req.file) return res.status(400).json({ error: 'No file provided' });

  const fileUrl = `/uploads/${req.file.filename}`;

  if (!process.env.OPENAI_API_KEY) {
    return res.json({ url: fileUrl, transcription: '', message: 'No OPENAI_API_KEY configured.' });
  }

  let audioPath: string | null = null;

  console.log(`Video upload: ${req.file.originalname} (${req.file.mimetype}, ${(req.file.size / 1024 / 1024).toFixed(1)}MB)`);

  try {
    const isVideo = req.file.mimetype?.startsWith('video/') ||
      /\.(mp4|webm|mov|avi|mkv)$/i.test(req.file.originalname);

    console.log(`Detected as ${isVideo ? 'video' : 'audio'}, extracting...`);

    if (isVideo) {
      audioPath = await extractAudio(req.file.path);
    }

    console.log('Sending to Whisper...');
    const transcription = await transcribe(audioPath || req.file.path);
    console.log(`Transcription complete: ${transcription.length} chars`);
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
