import Database from 'better-sqlite3';
import { PostgresDatabase } from './postgres-database';
import { join } from 'path';

interface User {
  id: string;
  email: string;
  password: string;
  role: string;
  roll_no: string | null;
  name: string | null;
  dob: string | null;
  created_at: string;
  updated_at: string;
}

interface GameResult {
  id: string;
  user_id: string;
  game_id: string;
  score: number | null;
  accuracy: number | null;
  reaction_time: number | null;
  error_count: number | null;
  error_rate: number | null;
  details: string | null;
  completed_at: string;
  created_at: string;
}

export async function migrateDataFromSQLite(
  sqlitePath: string,
  postgresDb: PostgresDatabase
): Promise<void> {
  console.log('🔄 Starting data migration from SQLite to PostgreSQL...');
  
  let sqliteDb: Database.Database | null = null;

  try {
    // Open SQLite database
    sqliteDb = new Database(sqlitePath, { readonly: true });
    console.log('✅ Connected to SQLite database');

    // Migrate users
    console.log('📊 Migrating users...');
    const users = sqliteDb.prepare('SELECT * FROM users').all() as User[];
    console.log(`Found ${users.length} users to migrate`);

    let migratedUsers = 0;
    for (const user of users) {
      try {
        await postgresDb.run(
          `INSERT INTO users (id, email, password, role, roll_no, name, dob, created_at, updated_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
           ON CONFLICT (id) DO NOTHING`,
          [
            user.id,
            user.email.toLowerCase(), // Normalize email to lowercase
            user.password,
            user.role,
            user.roll_no,
            user.name,
            user.dob,
            user.created_at,
            user.updated_at
          ]
        );
        migratedUsers++;
      } catch (error: any) {
        // Check if it's a duplicate email error
        if (error.code === '23505' && error.constraint === 'users_email_key') {
          console.warn(`⚠️  Skipping duplicate email: ${user.email}`);
        } else {
          console.error(`❌ Failed to migrate user ${user.id}:`, error.message);
        }
      }
    }
    console.log(`✅ Migrated ${migratedUsers}/${users.length} users`);

    // Migrate game results
    console.log('📊 Migrating game results...');
    const results = sqliteDb.prepare('SELECT * FROM game_results').all() as GameResult[];
    console.log(`Found ${results.length} game results to migrate`);

    let migratedResults = 0;
    for (const result of results) {
      try {
        await postgresDb.run(
          `INSERT INTO game_results (id, user_id, game_id, score, accuracy, reaction_time, error_count, error_rate, details, completed_at, created_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
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
            result.completed_at,
            result.created_at
          ]
        );
        migratedResults++;
      } catch (error: any) {
        // Skip if user doesn't exist (foreign key constraint)
        if (error.code === '23503') {
          console.warn(`⚠️  Skipping result for non-existent user: ${result.user_id}`);
        } else {
          console.error(`❌ Failed to migrate result ${result.id}:`, error.message);
        }
      }
    }
    console.log(`✅ Migrated ${migratedResults}/${results.length} game results`);

    // Print summary
    console.log('\n📈 Migration Summary:');
    console.log(`   Users: ${migratedUsers}/${users.length}`);
    console.log(`   Game Results: ${migratedResults}/${results.length}`);
    console.log('✅ Data migration completed successfully\n');

  } catch (error: any) {
    console.error('❌ Data migration failed:', error.message);
    throw error;
  } finally {
    if (sqliteDb) {
      sqliteDb.close();
      console.log('✅ SQLite database connection closed');
    }
  }
}
