import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// Current schema version - increment when making schema changes
const SCHEMA_VERSION = 2;

// Log existing data counts for safety monitoring
async function logDataCounts(client: any, context: string) {
  try {
    const usersResult = await client.query('SELECT COUNT(*) as count FROM users').catch(() => ({ rows: [{ count: 0 }] }));
    const notesResult = await client.query('SELECT COUNT(*) as count FROM notes').catch(() => ({ rows: [{ count: 0 }] }));
    console.log(`[${context}] Data check - Users: ${usersResult.rows[0].count}, Notes: ${notesResult.rows[0].count}`);
    return {
      users: parseInt(usersResult.rows[0].count),
      notes: parseInt(notesResult.rows[0].count)
    };
  } catch (e) {
    console.log(`[${context}] Tables don't exist yet (first run)`);
    return { users: 0, notes: 0 };
  }
}

export async function initDb() {
  const client = await pool.connect();
  try {
    // First, check existing data BEFORE any schema changes
    const beforeCounts = await logDataCounts(client, 'BEFORE INIT');

    // Create schema_versions table to track migrations
    await client.query(`
      CREATE TABLE IF NOT EXISTS schema_versions (
        id SERIAL PRIMARY KEY,
        version INTEGER NOT NULL,
        applied_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
        description TEXT
      );
    `);

    // Check current schema version
    const versionResult = await client.query(
      'SELECT version FROM schema_versions ORDER BY version DESC LIMIT 1'
    );
    const currentVersion = versionResult.rows.length > 0 ? versionResult.rows[0].version : 0;
    console.log(`Current schema version: ${currentVersion}, Target: ${SCHEMA_VERSION}`);

    // Create users table (safe - IF NOT EXISTS)
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        email TEXT NOT NULL UNIQUE,
        password_hash TEXT NOT NULL,
        name TEXT DEFAULT '',
        created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
      );

      CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
    `);

    // Create notes table with user_id (safe - IF NOT EXISTS)
    // Note: user_id is nullable initially to support migration of old data
    await client.query(`
      CREATE TABLE IF NOT EXISTS notes (
        id TEXT PRIMARY KEY,
        user_id TEXT,
        title TEXT NOT NULL DEFAULT '',
        content TEXT DEFAULT '',
        type TEXT NOT NULL DEFAULT 'text',
        source TEXT DEFAULT '',
        media_url TEXT DEFAULT '',
        transcription TEXT DEFAULT '',
        created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
        is_public BOOLEAN NOT NULL DEFAULT TRUE
      );

      CREATE TABLE IF NOT EXISTS tags (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL UNIQUE
      );

      CREATE TABLE IF NOT EXISTS note_tags (
        note_id TEXT NOT NULL,
        tag_id TEXT NOT NULL,
        PRIMARY KEY (note_id, tag_id),
        FOREIGN KEY (note_id) REFERENCES notes(id) ON DELETE CASCADE,
        FOREIGN KEY (tag_id) REFERENCES tags(id) ON DELETE CASCADE
      );

      CREATE INDEX IF NOT EXISTS idx_notes_user_id ON notes(user_id);
      CREATE INDEX IF NOT EXISTS idx_notes_created_at ON notes(created_at);
      CREATE INDEX IF NOT EXISTS idx_notes_type ON notes(type);
      CREATE INDEX IF NOT EXISTS idx_notes_is_public ON notes(is_public);
      CREATE INDEX IF NOT EXISTS idx_tags_name ON tags(name);
    `);

    // Migration: Add user_id column if it doesn't exist (for old tables)
    await client.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_name = 'notes' AND column_name = 'user_id'
        ) THEN
          ALTER TABLE notes ADD COLUMN user_id TEXT;
        END IF;
      END $$;
    `);

    // Create password reset tokens table
    await client.query(`
      CREATE TABLE IF NOT EXISTS password_reset_tokens (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        token TEXT NOT NULL UNIQUE,
        expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
        used BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      );

      CREATE INDEX IF NOT EXISTS idx_reset_tokens_token ON password_reset_tokens(token);
    `);

    // Record schema version if newer
    if (currentVersion < SCHEMA_VERSION) {
      await client.query(
        'INSERT INTO schema_versions (version, description) VALUES ($1, $2)',
        [SCHEMA_VERSION, 'Added schema version tracking, data protection logging']
      );
      console.log(`Schema upgraded to version ${SCHEMA_VERSION}`);
    }

    // Verify data after init - CRITICAL SAFETY CHECK
    const afterCounts = await logDataCounts(client, 'AFTER INIT');

    // Alert if data was lost (should never happen with IF NOT EXISTS)
    if (beforeCounts.users > 0 && afterCounts.users === 0) {
      console.error('CRITICAL WARNING: User data appears to have been lost during initialization!');
      console.error(`Before: ${beforeCounts.users} users, After: ${afterCounts.users} users`);
    }
    if (beforeCounts.notes > 0 && afterCounts.notes === 0) {
      console.error('CRITICAL WARNING: Notes data appears to have been lost during initialization!');
      console.error(`Before: ${beforeCounts.notes} notes, After: ${afterCounts.notes} notes`);
    }

  } finally {
    client.release();
  }
}

export default pool;
