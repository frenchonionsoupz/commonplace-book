# Commonplace Book

A note-taking application for capturing notes from podcasts, articles, lectures, and more. Supports text, voice recordings, and screen captures.

## Project Structure

```
/
├── client/          # React frontend (Vite + TypeScript + Tailwind)
│   └── src/
│       ├── components/  # React components
│       ├── pages/       # Page components
│       ├── api.ts       # API client
│       └── types.ts     # TypeScript types
├── server/          # Express backend (TypeScript)
│   └── src/
│       ├── routes/      # API routes (notes, upload, transcribe, embed)
│       ├── db.ts        # PostgreSQL database connection
│       └── index.ts     # Server entry point
└── package.json     # Root package with dev scripts
```

## Tech Stack

- **Frontend**: React 18, Vite, TypeScript, Tailwind CSS, React Router
- **Backend**: Express.js, TypeScript, PostgreSQL (pg)
- **Features**: File uploads (multer), OpenAI integration for transcription

## Development

- **Frontend**: Runs on port 5000 (via Vite)
- **Backend**: Runs on port 3001
- Run `npm run dev` to start both concurrently

## Environment Variables

- `PORT`: Server port (3001 in dev, 5000 in production)
- `DATABASE_URL`: PostgreSQL connection string (auto-configured by Replit)
- `OPENAI_API_KEY`: Optional - for voice transcription via Whisper

## Deployment

The app is configured for autoscale deployment:
- Build: Installs dependencies and builds both client and server
- Run: Serves the production build via the Express server on port 5000
- Database: Uses Replit's PostgreSQL for persistent storage
