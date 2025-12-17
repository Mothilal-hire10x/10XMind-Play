import dotenv from 'dotenv';
import { Database as SQLiteDatabase } from './database';
import { PostgresDatabase } from './postgres-database';
import { PoolClient } from 'pg';

dotenv.config();

const DATABASE_TYPE = process.env.DATABASE_TYPE || 'sqlite';

// Unified database interface
export interface IDatabase {
  connect(): Promise<void>;
  run(sql: string, params: any[]): Promise<{ rowCount?: number; lastID?: number; changes?: number }>;
  get<T>(sql: string, params: any[]): Promise<T | undefined>;
  all<T>(sql: string, params: any[]): Promise<T[]>;
  close(): Promise<void>;
  executeTransaction<T>(callback: (client?: any) => Promise<T>): Promise<T>;
  getClient?(): Promise<PoolClient>;
  queryInTransaction?<T>(client: PoolClient, sql: string, params: any[]): Promise<T[]>;
  getInTransaction?<T>(client: PoolClient, sql: string, params: any[]): Promise<T | undefined>;
  runInTransaction?(client: PoolClient, sql: string, params: any[]): Promise<{ rowCount: number }>;
}

class DatabaseAdapter implements IDatabase {
  private db: SQLiteDatabase | PostgresDatabase;
  private type: 'sqlite' | 'postgres';

  constructor(db: SQLiteDatabase | PostgresDatabase, type: 'sqlite' | 'postgres') {
    this.db = db;
    this.type = type;
  }

  async connect(): Promise<void> {
    return this.db.connect();
  }

  async run(sql: string, params: any[]): Promise<{ rowCount?: number; lastID?: number; changes?: number }> {
    if (this.type === 'postgres') {
      // Convert SQLite ? placeholders to PostgreSQL $1, $2, etc.
      const pgSql = this.convertPlaceholders(sql);
      const result = await (this.db as PostgresDatabase).run(pgSql, params);
      return { rowCount: result.rowCount };
    } else {
      const result = await (this.db as SQLiteDatabase).run(sql, params);
      return { lastID: result.lastID, changes: result.changes, rowCount: result.changes };
    }
  }

  async get<T>(sql: string, params: any[]): Promise<T | undefined> {
    if (this.type === 'postgres') {
      const pgSql = this.convertPlaceholders(sql);
      return await (this.db as PostgresDatabase).get<T>(pgSql, params);
    } else {
      return await (this.db as SQLiteDatabase).get<T>(sql, params);
    }
  }

  async all<T>(sql: string, params: any[]): Promise<T[]> {
    if (this.type === 'postgres') {
      const pgSql = this.convertPlaceholders(sql);
      return await (this.db as PostgresDatabase).all<T>(pgSql, params);
    } else {
      return await (this.db as SQLiteDatabase).all<T>(sql, params);
    }
  }

  async close(): Promise<void> {
    return this.db.close();
  }

  async executeTransaction<T>(callback: (client?: any) => Promise<T>): Promise<T> {
    if (this.type === 'postgres') {
      return await (this.db as PostgresDatabase).executeTransaction(callback);
    } else {
      // SQLite doesn't have connection pooling, but we can wrap in BEGIN/COMMIT
      const sqliteDb = this.db as SQLiteDatabase;
      try {
        await sqliteDb.run('BEGIN TRANSACTION', []);
        const result = await callback();
        await sqliteDb.run('COMMIT', []);
        return result;
      } catch (error) {
        await sqliteDb.run('ROLLBACK', []);
        throw error;
      }
    }
  }

  async getClient(): Promise<PoolClient> {
    if (this.type === 'postgres') {
      return await (this.db as PostgresDatabase).getClient();
    }
    throw new Error('getClient is only available for PostgreSQL');
  }

  async queryInTransaction<T>(client: PoolClient, sql: string, params: any[]): Promise<T[]> {
    if (this.type === 'postgres' && client) {
      const pgSql = this.convertPlaceholders(sql);
      return await (this.db as PostgresDatabase).queryInTransaction<T>(client, pgSql, params);
    } else {
      const sqliteSql = this.convertToSQLite(sql);
      return await (this.db as SQLiteDatabase).all<T>(sqliteSql, params);
    }
  }

  async getInTransaction<T>(client: PoolClient, sql: string, params: any[]): Promise<T | undefined> {
    if (this.type === 'postgres' && client) {
      const pgSql = this.convertPlaceholders(sql);
      return await (this.db as PostgresDatabase).getInTransaction<T>(client, pgSql, params);
    } else {
      const sqliteSql = this.convertToSQLite(sql);
      return await (this.db as SQLiteDatabase).get<T>(sqliteSql, params);
    }
  }

  async runInTransaction(client: PoolClient, sql: string, params: any[]): Promise<{ rowCount: number }> {
    if (this.type === 'postgres' && client) {
      const pgSql = this.convertPlaceholders(sql);
      return await (this.db as PostgresDatabase).runInTransaction(client, pgSql, params);
    } else {
      const sqliteSql = this.convertToSQLite(sql);
      const result = await (this.db as SQLiteDatabase).run(sqliteSql, params);
      return { rowCount: result.changes || 0 };
    }
  }

  // Convert SQLite ? placeholders to PostgreSQL $1, $2, etc.
  private convertPlaceholders(sql: string): string {
    let index = 0;
    return sql.replace(/\?/g, () => `$${++index}`);
  }

  // Convert PostgreSQL-specific SQL to SQLite (for compatibility)
  private convertToSQLite(sql: string): string {
    // Convert $1, $2, etc. back to ?
    return sql.replace(/\$\d+/g, '?');
  }
}

// Singleton instance
let dbInstance: DatabaseAdapter | null = null;
let isConnecting = false;
let connectPromise: Promise<DatabaseAdapter> | null = null;

export async function initializeDatabase(): Promise<DatabaseAdapter> {
  if (dbInstance) {
    return dbInstance;
  }

  if (isConnecting && connectPromise) {
    return connectPromise;
  }

  isConnecting = true;
  connectPromise = (async () => {
    if (DATABASE_TYPE === 'postgres') {
      const POSTGRES_HOST = process.env.POSTGRES_HOST || 'localhost';
      const POSTGRES_PORT = parseInt(process.env.POSTGRES_PORT || '5432');
      const POSTGRES_DB = process.env.POSTGRES_DB || '10xmind_play';
      const POSTGRES_USER = process.env.POSTGRES_USER || 'postgres';
      const POSTGRES_PASSWORD = process.env.POSTGRES_PASSWORD || 'postgres123';
      const POSTGRES_MAX_POOL_SIZE = parseInt(process.env.POSTGRES_MAX_POOL || '100');

      const pgDb = new PostgresDatabase(
        POSTGRES_HOST,
        POSTGRES_PORT,
        POSTGRES_DB,
        POSTGRES_USER,
        POSTGRES_PASSWORD,
        POSTGRES_MAX_POOL_SIZE
      );
      await pgDb.connect();
      dbInstance = new DatabaseAdapter(pgDb, 'postgres');
    } else {
      const path = require('path');
      const DB_PATH = process.env.DATABASE_PATH || path.join(__dirname, '../../data/database.sqlite');
      const sqliteDb = new SQLiteDatabase(DB_PATH);
      await sqliteDb.connect();
      dbInstance = new DatabaseAdapter(sqliteDb, 'sqlite');
    }
    isConnecting = false;
    return dbInstance;
  })();

  return connectPromise;
}

export function getUnifiedDatabase(): DatabaseAdapter {
  if (!dbInstance) {
    throw new Error('Database not initialized. Call initializeDatabase() first.');
  }
  return dbInstance;
}

export default getUnifiedDatabase;
