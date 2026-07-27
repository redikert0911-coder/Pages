import { sql } from "~/db";

// Create tables if they don't exist. Idempotent — safe to run on every server start.
export async function ensureSchema(): Promise<void> {
  const db = sql();
  await db`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      email VARCHAR(255) UNIQUE NOT NULL,
      password_hash VARCHAR(255) NOT NULL,
      name VARCHAR(255) NOT NULL DEFAULT '',
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    )
  `;
  await db`
    CREATE TABLE IF NOT EXISTS tracked_urls (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      url TEXT NOT NULL,
      name TEXT NOT NULL DEFAULT '',
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      last_scraped_at TIMESTAMP WITH TIME ZONE
    )
  `;
  await db`
    CREATE TABLE IF NOT EXISTS snapshots (
      id SERIAL PRIMARY KEY,
      tracked_url_id INTEGER NOT NULL REFERENCES tracked_urls(id) ON DELETE CASCADE,
      content TEXT NOT NULL,
      title TEXT,
      scraped_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    )
  `;
  await db`
    CREATE TABLE IF NOT EXISTS digests (
      id SERIAL PRIMARY KEY,
      tracked_url_id INTEGER NOT NULL REFERENCES tracked_urls(id) ON DELETE CASCADE,
      snapshot_old_id INTEGER REFERENCES snapshots(id) ON DELETE SET NULL,
      snapshot_new_id INTEGER REFERENCES snapshots(id) ON DELETE SET NULL,
      summary TEXT NOT NULL DEFAULT '',
      changes JSONB NOT NULL DEFAULT '[]',
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    )
  `;
}
