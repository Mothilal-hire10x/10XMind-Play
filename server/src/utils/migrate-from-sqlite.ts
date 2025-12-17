import dotenv from 'dotenv';
import path from 'path';
import { Database as SQLiteDatabase } from './database';
import { PostgresDatabase, getDatabase as getPostgresDatabase } from './postgres-database';

dotenv.config();

// SQLite configuration
const SQLITE_DB_PATH = process.env.DATABASE_PATH || path.join(__dirname, '../../data/database.sqlite');

// PostgreSQL configuration
const POSTGRES_HOST = process.env.POSTGRES_HOST || 'localhost';
const POSTGRES_PORT = parseInt(process.env.POSTGRES_PORT || '5432');
const POSTGRES_DB = process.env.POSTGRES_DB || '10xmind_play';
const POSTGRES_USER = process.env.POSTGRES_USER || 'postgres';
const POSTGRES_PASSWORD = process.env.POSTGRES_PASSWORD || 'postgres123';
const POSTGRES_MAX_POOL_SIZE = parseInt(process.env.POSTGRES_MAX_POOL_SIZE || '100');

interface User {
  id: string;
  email: string;
  password: string;
  role: string;
  roll_no: string | null;
  name: string | null;
  dob: string | null;
  consent_date: string | null;
  created_at: number;
  updated_at: number;
}

interface GameResult {
  id: string;
  user_id: string;
  game_id: string;
  score: number;
  accuracy: number;
  reaction_time: number;
  error_count: number | null;
  error_rate: number | null;
  details: string | null;
  completed_at: number;
}

interface Session {
  id: string;
  user_id: string;
  token: string;
  expires_at: number;
  created_at: number;
}

export async function migrateData() {
  console.log('🚀 Starting data migration from SQLite to PostgreSQL...\n');

  // Connect to SQLite
  console.log('📂 Connecting to SQLite database...');
  const sqliteDb = new SQLiteDatabase(SQLITE_DB_PATH);
  await sqliteDb.connect();
  console.log('✅ Connected to SQLite\n');

  // Connect to PostgreSQL
  console.log('🐘 Connecting to PostgreSQL database...');
  const postgresDb = getPostgresDatabase(
    POSTGRES_HOST,
    POSTGRES_PORT,
    POSTGRES_DB,
    POSTGRES_USER,
    POSTGRES_PASSWORD,
    POSTGRES_MAX_POOL_SIZE
  );
  await postgresDb.connect();
  console.log('✅ Connected to PostgreSQL\n');

  try {
    // Migrate users
    console.log('👥 Migrating users...');
    const users = await sqliteDb.all<User>('SELECT * FROM users');
    console.log(`   Found ${users.length} users to migrate`);

    let usersMigrated = 0;
    let usersSkipped = 0;

    for (const user of users) {
      try {
        await postgresDb.run(
          `INSERT INTO users (id, email, password, role, roll_no, name, dob, consent_date, created_at, updated_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
           ON CONFLICT (id) DO NOTHING`,
          [
            user.id,
            user.email.toLowerCase(), // Normalize email to lowercase
            user.password,
            user.role,
            user.roll_no,
            user.name,
            user.dob,
            user.consent_date,
            user.created_at,
            user.updated_at
          ]
        );
        usersMigrated++;
        if (usersMigrated % 50 === 0) {
          console.log(`   Migrated ${usersMigrated}/${users.length} users...`);
        }
      } catch (error: any) {
        if (error.code === '23505') { // Unique violation
          usersSkipped++;
          console.log(`   ⚠️  Skipped duplicate user: ${user.email}`);
        } else {
          console.error(`   ❌ Failed to migrate user ${user.email}:`, error.message);
          throw error;
        }
      }
    }
    console.log(`✅ Users migration completed: ${usersMigrated} migrated, ${usersSkipped} skipped\n`);

    // Migrate game results
    console.log('🎮 Migrating game results...');
    const gameResults = await sqliteDb.all<GameResult>('SELECT * FROM game_results');
    console.log(`   Found ${gameResults.length} game results to migrate`);

    let resultsMigrated = 0;
    let resultsSkipped = 0;

    for (const result of gameResults) {
      try {
        await postgresDb.run(
          `INSERT INTO game_results (id, user_id, game_id, score, accuracy, reaction_time, error_count, error_rate, details, completed_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
           ON CONFLICT (id) DO NOTHING`,
          [
            result.id,
            result.user_id,
            result.game_id,
            result.score,
            result.accuracy,
            result.reaction_time,
            result.error_count,
            result.error_rate,
            result.details,
            result.completed_at
          ]
        );
        resultsMigrated++;
        if (resultsMigrated % 100 === 0) {
          console.log(`   Migrated ${resultsMigrated}/${gameResults.length} results...`);
        }
      } catch (error: any) {
        if (error.code === '23505') { // Unique violation
          resultsSkipped++;
        } else if (error.code === '23503') { // Foreign key violation
          resultsSkipped++;
          console.log(`   ⚠️  Skipped result with missing user: ${result.user_id}`);
        } else {
          console.error(`   ❌ Failed to migrate result ${result.id}:`, error.message);
          throw error;
        }
      }
    }
    console.log(`✅ Game results migration completed: ${resultsMigrated} migrated, ${resultsSkipped} skipped\n`);

    // Migrate sessions
    console.log('🔐 Migrating sessions...');
    const sessions = await sqliteDb.all<Session>('SELECT * FROM sessions');
    console.log(`   Found ${sessions.length} sessions to migrate`);

    let sessionsMigrated = 0;
    let sessionsSkipped = 0;

    for (const session of sessions) {
      try {
        // Only migrate non-expired sessions
        if (session.expires_at > Date.now()) {
          await postgresDb.run(
            `INSERT INTO sessions (id, user_id, token, expires_at, created_at)
             VALUES ($1, $2, $3, $4, $5)
             ON CONFLICT (id) DO NOTHING`,
            [
              session.id,
              session.user_id,
              session.token,
              session.expires_at,
              session.created_at
            ]
          );
          sessionsMigrated++;
        } else {
          sessionsSkipped++;
        }
      } catch (error: any) {
        if (error.code === '23505' || error.code === '23503') {
          sessionsSkipped++;
        } else {
          console.error(`   ❌ Failed to migrate session ${session.id}:`, error.message);
          throw error;
        }
      }
    }
    console.log(`✅ Sessions migration completed: ${sessionsMigrated} migrated, ${sessionsSkipped} skipped (expired)\n`);

    // Summary
    console.log('═══════════════════════════════════════════════════════════');
    console.log('✨ Migration Summary:');
    console.log('═══════════════════════════════════════════════════════════');
    console.log(`👥 Users:         ${usersMigrated} migrated, ${usersSkipped} skipped`);
    console.log(`🎮 Game Results:  ${resultsMigrated} migrated, ${resultsSkipped} skipped`);
    console.log(`🔐 Sessions:      ${sessionsMigrated} migrated, ${sessionsSkipped} skipped`);
    console.log('═══════════════════════════════════════════════════════════');
    console.log('');
    console.log('🎉 Data migration completed successfully!');
    console.log('');
    console.log('Next steps:');
    console.log('1. Verify the migrated data in PostgreSQL');
    console.log('2. Update your application to use DATABASE_TYPE=postgres');
    console.log('3. Test login and result submission with multiple users');
    console.log('4. Keep SQLite backup until you confirm everything works');
    console.log('');

  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  } finally {
    // Close connections
    await sqliteDb.close();
    await postgresDb.close();
  }
}

// Run migration if this file is executed directly
if (require.main === module) {
  migrateData().catch((error) => {
    console.error('Migration failed:', error);
    process.exit(1);
  });
}

export default migrateData;
