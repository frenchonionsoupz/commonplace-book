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
  limits: { fileSize: 100 * 1024 * 1024 }, // 100MB for video files
});

// Check if ffmpeg is available
async function hasFfmpeg(): Promise<boolean> {
  try {
    await execAsync('ffmpeg -version');
    return true;
  } catch {
    return false;
  }
}

// Extract audio from video file using ffmpeg
async function extractAudio(videoPath: string): Promise<string> {
  const audioPath = videoPath.replace(/\.[^.]+$/, '.mp3');
  try {
    // Extract audio, convert to mp3 (Whisper-friendly format)
    await execAsync(`ffmpeg -i "${videoPath}" -vn -acodec libmp3lame -q:a 4 -y "${audioPath}"`, {
      timeout: 120000 // 2 minute timeout
    });
    return audioPath;
  } catch (error: any) {
    console.error('FFmpeg extraction failed:', error.message);
    throw new Error('Failed to extract audio from video');
  }
}

async function transcribeWithWhisper(filePath: string): Promise<string> {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    console.error('OPENAI_API_KEY not found in environment');
    throw new Error('OPENAI_API_KEY not configured');
  }

  console.log('Transcribing file:', filePath);
  console.log('File size:', fs.statSync(filePath).size, 'bytes');

  const { default: OpenAI } = await import('openai');
  const openai = new OpenAI({ apiKey });

  const transcription = await openai.audio.transcriptions.create({
    file: fs.createReadStream(filePath),
    model: 'whisper-1',
    response_format: 'text',
  });

  console.log('Transcription successful, length:', (transcription as unknown as string).length);
  return transcription as unknown as string;
}

// POST /api/transcribe — transcribe audio using OpenAI Whisper
router.post('/', upload.single('audio'), async (req: Request, res: Response) => {
  console.log('=== Audio Transcription Request ===');

  if (!req.file) {
    console.error('No audio file provided');
    return res.status(400).json({ error: 'No audio file provided' });
  }

  console.log('Received file:', req.file.filename, 'Size:', req.file.size);
  const fileUrl = `/uploads/${req.file.filename}`;

  if (!process.env.OPENAI_API_KEY) {
    console.warn('No OPENAI_API_KEY - returning empty transcription');
    return res.json({
      url: fileUrl,
      transcription: '',
      message: 'No OPENAI_API_KEY configured. Add it to Replit Secrets.',
    });
  }

  try {
    const transcription = await transcribeWithWhisper(req.file.path);
    res.json({ url: fileUrl, transcription });
  } catch (error: any) {
    console.error('Transcription error:', error.message);
    res.status(500).json({
      url: fileUrl,
      error: 'Transcription failed',
      message: error.message,
    });
  }
});

// POST /api/transcribe/video — transcribe video file
router.post('/video', upload.single('file'), async (req: Request, res: Response) => {
  console.log('=== Video Transcription Request ===');

  if (!req.file) {
    console.error('No video file provided');
    return res.status(400).json({ error: 'No video file provided' });
  }

  console.log('Received file:', req.file.filename, 'Size:', req.file.size, 'Type:', req.file.mimetype);
  const fileUrl = `/uploads/${req.file.filename}`;

  if (!process.env.OPENAI_API_KEY) {
    console.warn('No OPENAI_API_KEY - returning empty transcription');
    return res.json({
      url: fileUrl,
      transcription: '',
      message: 'No OPENAI_API_KEY configured. Add it to Replit Secrets.',
    });
  }

  try {
    let audioPath = req.file.path;

    // Check if it's a video file that needs audio extraction
    const isVideo = req.file.mimetype?.startsWith('video/') ||
                    /\.(mp4|webm|mov|avi|mkv)$/i.test(req.file.originalname);

    if (isVideo) {
      console.log('Video file detected, checking for ffmpeg...');
      const ffmpegAvailable = await hasFfmpeg();

      if (ffmpegAvailable) {
        console.log('Extracting audio from video...');
        audioPath = await extractAudio(req.file.path);
        console.log('Audio extracted to:', audioPath);
      } else {
        console.log('FFmpeg not available, sending video directly to Whisper');
        // Whisper can handle some video formats directly
      }
    }

    const transcription = await transcribeWithWhisper(audioPath);

    // Clean up extracted audio file if different from original
    if (audioPath !== req.file.path && fs.existsSync(audioPath)) {
      fs.unlinkSync(audioPath);
    }

    res.json({ url: fileUrl, transcription });
  } catch (error: any) {
    console.error('Video transcription error:', error.message);
    res.status(500).json({
      url: fileUrl,
      error: 'Transcription failed',
      message: error.message,
    });
  }
});

export default router;
