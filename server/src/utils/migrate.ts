import dotenv from 'dotenv';
import path from 'path';
import { Database, getDatabase } from './database';

dotenv.config();

const DB_PATH = process.env.DATABASE_PATH || path.join(__dirname, '../../database.sqlite');

export async function runMigrations(skipClose = false) {
  const db = getDatabase(DB_PATH);
  await db.connect();

  console.log('🔄 Running database migrations...');

  // Create users table
  await db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'student',
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    )
  `);

  await db.run(`
    CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)
  `);

  await db.run(`
    CREATE INDEX IF NOT EXISTS idx_users_role ON users(role)
  `);

  // Create game_results table
  await db.run(`
    CREATE TABLE IF NOT EXISTS game_results (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      game_id TEXT NOT NULL,
      score REAL NOT NULL,
      accuracy REAL NOT NULL,
      reaction_time REAL NOT NULL,
      details TEXT,
      completed_at INTEGER NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  await db.run(`
    CREATE INDEX IF NOT EXISTS idx_results_user_id ON game_results(user_id)
  `);

  await db.run(`
    CREATE INDEX IF NOT EXISTS idx_results_game_id ON game_results(game_id)
  `);

  await db.run(`
    CREATE INDEX IF NOT EXISTS idx_results_completed_at ON game_results(completed_at)
  `);

  // Create sessions table (for token blacklisting/tracking)
  await db.run(`
    CREATE TABLE IF NOT EXISTS sessions (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      token TEXT NOT NULL,
      expires_at INTEGER NOT NULL,
      created_at INTEGER NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  await db.run(`
    CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id)
  `);

  await db.run(`
    CREATE INDEX IF NOT EXISTS idx_sessions_token ON sessions(token)
  `);

  // Add error_count and error_rate columns to game_results table if they don't exist
  try {
    await db.run(`
      ALTER TABLE game_results ADD COLUMN error_count INTEGER
    `);
    console.log('✅ Added error_count column to game_results table');
  } catch (err: any) {
    // Column already exists or error - that's okay
    if (!err.message.includes('duplicate column')) {
      console.log('ℹ️ error_count column likely already exists');
    }
  }

  try {
    await db.run(`
      ALTER TABLE game_results ADD COLUMN error_rate REAL
    `);
    console.log('✅ Added error_rate column to game_results table');
  } catch (err: any) {
    // Column already exists or error - that's okay
    if (!err.message.includes('duplicate column')) {
      console.log('ℹ️ error_rate column likely already exists');
    }
  }

  console.log('✅ Database migrations completed successfully!');

  if (!skipClose) {
    await db.close();
  }
}

// Run migrations if this file is executed directly
if (require.main === module) {
  runMigrations().catch(console.error);
}

export default runMigrations;
