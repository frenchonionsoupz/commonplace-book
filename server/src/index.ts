import express from 'express';
import cors from 'cors';
import path from 'path';
import dotenv from 'dotenv';

// Load .env from server directory first, then root
dotenv.config({ path: path.join(__dirname, '..', '.env') });
dotenv.config({ path: path.join(__dirname, '..', '..', '.env') });

import { initDb } from './db';
import authRouter from './routes/auth';
import notesRouter from './routes/notes';
import uploadRouter from './routes/upload';
import transcribeRouter from './routes/transcribe';
import embedRouter from './routes/embed';
import exportRouter from './routes/export';

const app = express();
const PORT = process.env.PORT || 3001;
const HOST = '0.0.0.0';

app.use(cors({
  origin: true,
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));

const uploadsPath = path.join(__dirname, '..', 'uploads');
app.use('/uploads', express.static(uploadsPath));

// API routes
app.use('/api/auth', authRouter);
app.use('/api/notes', notesRouter);
app.use('/api/upload', uploadRouter);
app.use('/api/transcribe', transcribeRouter);
app.use('/api/embed', embedRouter);
app.use('/api/export', exportRouter);

const clientDist = path.join(__dirname, '..', '..', 'client', 'dist');
app.use(express.static(clientDist));

app.get('*', (_req, res) => {
  const indexPath = path.join(clientDist, 'index.html');
  res.sendFile(indexPath, (err) => {
    if (err) {
      res.status(404).json({ error: 'Not found' });
    }
  });
});

async function start() {
  try {
    await initDb();
    console.log('Database initialized');

    app.listen(Number(PORT), HOST, () => {
      console.log(`Commonplace Book server running on http://${HOST}:${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

start();

export default app;
