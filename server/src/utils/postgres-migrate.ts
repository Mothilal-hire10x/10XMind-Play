import dotenv from 'dotenv';
import { PostgresDatabase, getDatabase } from './postgres-database';

dotenv.config();

const POSTGRES_HOST = process.env.POSTGRES_HOST || 'localhost';
const POSTGRES_PORT = parseInt(process.env.POSTGRES_PORT || '5432');
const POSTGRES_DB = process.env.POSTGRES_DB || '10xmind_play';
const POSTGRES_USER = process.env.POSTGRES_USER || 'postgres';
const POSTGRES_PASSWORD = process.env.POSTGRES_PASSWORD || 'postgres123';
const POSTGRES_MAX_POOL_SIZE = parseInt(process.env.POSTGRES_MAX_POOL_SIZE || '100');

export async function runMigrations(skipClose = false) {
  const db = getDatabase(
    POSTGRES_HOST,
    POSTGRES_PORT,
    POSTGRES_DB,
    POSTGRES_USER,
    POSTGRES_PASSWORD,
    POSTGRES_MAX_POOL_SIZE
  );
  
  await db.connect();

  console.log('🔄 Running PostgreSQL database migrations...');

  // Create users table with CITEXT for case-insensitive email
  await db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'student',
      roll_no TEXT,
      name TEXT,
      dob TEXT,
      consent_date TEXT,
      created_at BIGINT NOT NULL,
      updated_at BIGINT NOT NULL
    )
  `);

  // Create case-insensitive index for email (fixes the login issue)
  await db.run(`
    CREATE UNIQUE INDEX IF NOT EXISTS idx_users_email_lower ON users(LOWER(email))
  `);

  await db.run(`
    CREATE INDEX IF NOT EXISTS idx_users_role ON users(role)
  `);

  await db.run(`
    CREATE INDEX IF NOT EXISTS idx_users_created_at ON users(created_at)
  `);

  console.log('✅ Users table created with case-insensitive email index');

  // Create game_results table
  await db.run(`
    CREATE TABLE IF NOT EXISTS game_results (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      game_id TEXT NOT NULL,
      score REAL NOT NULL,
      accuracy REAL NOT NULL,
      reaction_time REAL NOT NULL,
      error_count INTEGER,
      error_rate REAL,
      details TEXT,
      completed_at BIGINT NOT NULL,
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

  await db.run(`
    CREATE INDEX IF NOT EXISTS idx_results_user_game ON game_results(user_id, game_id)
  `);

  console.log('✅ Game results table created with optimized indexes');

  // Create sessions table (for token blacklisting/tracking)
  await db.run(`
    CREATE TABLE IF NOT EXISTS sessions (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      token TEXT NOT NULL,
      expires_at BIGINT NOT NULL,
      created_at BIGINT NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  await db.run(`
    CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id)
  `);

  await db.run(`
    CREATE INDEX IF NOT EXISTS idx_sessions_token ON sessions(token)
  `);

  await db.run(`
    CREATE INDEX IF NOT EXISTS idx_sessions_expires_at ON sessions(expires_at)
  `);

  console.log('✅ Sessions table created');

  // Create a table to track migration status
  await db.run(`
    CREATE TABLE IF NOT EXISTS migration_history (
      id SERIAL PRIMARY KEY,
      migration_name TEXT NOT NULL UNIQUE,
      executed_at BIGINT NOT NULL
    )
  `);

  await db.run(`
    INSERT INTO migration_history (migration_name, executed_at)
    VALUES ($1, $2)
    ON CONFLICT (migration_name) DO NOTHING
  `, ['initial_schema', Date.now()]);

  console.log('✅ Migration history table created');

  console.log('✅ PostgreSQL database migrations completed successfully!');
  console.log(`📊 Connection pool configured for ${POSTGRES_MAX_POOL_SIZE} concurrent connections`);

  if (!skipClose) {
    await db.close();
  }
}

// Run migrations if this file is executed directly
if (require.main === module) {
  runMigrations().catch(console.error);
}

export default runMigrations;
