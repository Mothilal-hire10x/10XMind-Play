import sqlite3 from 'sqlite3';
import { promisify } from 'util';

const sqlite = sqlite3.verbose();

export class Database {
  private db: sqlite3.Database | null = null;

  constructor(private dbPath: string) {}

  async connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.db = new sqlite.Database(this.dbPath, (err) => {
        if (err) {
          reject(err);
        } else {
          console.log('✅ Connected to SQLite database');
          // Enable WAL mode for better concurrency
          this.db!.run('PRAGMA journal_mode = WAL;', (walErr) => {
            if (walErr) {
              console.error('❌ Failed to enable WAL mode:', walErr);
            } else {
              console.log('✅ WAL mode enabled for better concurrency');
            }
          });
          
          // Set busy timeout to 10 seconds (wait instead of failing immediately)
          this.db!.run('PRAGMA busy_timeout = 10000;', (timeoutErr) => {
            if (timeoutErr) {
              console.error('❌ Failed to set busy timeout:', timeoutErr);
            } else {
              console.log('✅ Busy timeout set to 10 seconds');
            }
          });
          
          // Enable synchronous mode for better reliability under concurrent load
          this.db!.run('PRAGMA synchronous = NORMAL;', (syncErr) => {
            if (syncErr) {
              console.error('❌ Failed to set synchronous mode:', syncErr);
            }
          });
          
          resolve();
        }
      });
    });
  }

  async run(sql: string, params: any[] = []): Promise<{ lastID: number; changes: number }> {
    if (!this.db) throw new Error('Database not connected');
    
    return this.retryOnBusy(async () => {
      return new Promise((resolve, reject) => {
        this.db!.run(sql, params, function(err) {
          if (err) {
            reject(err);
          } else {
            resolve({ lastID: this.lastID, changes: this.changes });
          }
        });
      });
    });
  }

  async get<T>(sql: string, params: any[] = []): Promise<T | undefined> {
    if (!this.db) throw new Error('Database not connected');
    
    return this.retryOnBusy(async () => {
      return new Promise((resolve, reject) => {
        this.db!.get(sql, params, (err, row) => {
          if (err) {
            reject(err);
          } else {
            resolve(row as T);
          }
        });
      });
    });
  }

  async all<T>(sql: string, params: any[] = []): Promise<T[]> {
    if (!this.db) throw new Error('Database not connected');
    
    return this.retryOnBusy(async () => {
      return new Promise((resolve, reject) => {
        this.db!.all(sql, params, (err, rows) => {
          if (err) {
            reject(err);
          } else {
            resolve(rows as T[]);
          }
        });
      });
    });
  }

  // Retry logic for handling database busy errors
  private async retryOnBusy<T>(
    operation: () => Promise<T>, 
    maxRetries: number = 5,
    initialDelay: number = 100
  ): Promise<T> {
    let lastError: any;
    
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error: any) {
        lastError = error;
        
        // Check if it's a database busy/locked error
        if (error.code === 'SQLITE_BUSY' || error.code === 'SQLITE_LOCKED' || 
            error.message?.includes('database is locked')) {
          
          if (attempt < maxRetries) {
            // Exponential backoff with jitter
            const delay = initialDelay * Math.pow(2, attempt) + Math.random() * 100;
            console.warn(`⚠️ Database busy, retrying in ${delay}ms (attempt ${attempt + 1}/${maxRetries + 1})...`);
            await new Promise(resolve => setTimeout(resolve, delay));
            continue;
          }
        }
        
        // If not a busy error or max retries reached, throw
        throw error;
      }
    }
    
    throw lastError;
  }

  async close(): Promise<void> {
    if (!this.db) return;
    
    return new Promise((resolve, reject) => {
      this.db!.close((err) => {
        if (err) {
          reject(err);
        } else {
          console.log('✅ Database connection closed');
          resolve();
        }
      });
    });
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
