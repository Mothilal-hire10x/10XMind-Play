import BetterSqlite3, { Database as BetterSqlite3Database } from 'better-sqlite3';

export class Database {
  private db: BetterSqlite3Database | null = null;

  constructor(private dbPath: string) {}

  async connect(): Promise<void> {
    try {
      this.db = new BetterSqlite3(this.dbPath);
      console.log('✅ Connected to SQLite database');
      
      // Enable WAL mode for better concurrency
      this.db.pragma('journal_mode = WAL');
      console.log('✅ WAL mode enabled for better concurrency');
      
      // Set busy timeout to 10 seconds (wait instead of failing immediately)
      this.db.pragma('busy_timeout = 10000');
      console.log('✅ Busy timeout set to 10 seconds');
      
      // Enable synchronous mode for better reliability under concurrent load
      this.db.pragma('synchronous = NORMAL');
    } catch (err) {
      console.error('❌ Failed to connect to SQLite database:', err);
      throw err;
    }
  }

  async run(sql: string, params: unknown[] = []): Promise<{ lastID: number; changes: number }> {
    if (!this.db) throw new Error('Database not connected');
    
    try {
      const stmt = this.db.prepare(sql);
      const result = stmt.run(...params);
      return { lastID: Number(result.lastInsertRowid), changes: result.changes };
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error('❌ Database run error:', errorMessage);
      throw error;
    }
  }

  async get<T>(sql: string, params: unknown[] = []): Promise<T | undefined> {
    if (!this.db) throw new Error('Database not connected');
    
    try {
      const stmt = this.db.prepare(sql);
      const row = stmt.get(...params);
      return row as T | undefined;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error('❌ Database get error:', errorMessage);
      throw error;
    }
  }

  async all<T>(sql: string, params: unknown[] = []): Promise<T[]> {
    if (!this.db) throw new Error('Database not connected');
    
    try {
      const stmt = this.db.prepare(sql);
      const rows = stmt.all(...params);
      return rows as T[];
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error('❌ Database all error:', errorMessage);
      throw error;
    }
  }

  async close(): Promise<void> {
    if (!this.db) return;
    
    try {
      this.db.close();
      console.log('✅ Database connection closed');
    } catch (err) {
      console.error('❌ Failed to close database:', err);
      throw err;
    }
  }
}

// Singleton instance
let dbInstance: Database | null = null;

export function getDatabase(dbPath: string): Database {
  if (!dbInstance) {
    dbInstance = new Database(dbPath);
  }
  return dbInstance;
}

export default Database;
