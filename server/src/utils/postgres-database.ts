import { Pool, PoolClient, QueryResult } from 'pg';

export class PostgresDatabase {
  private pool: Pool | null = null;

  constructor(
    private host: string,
    private port: number,
    private database: string,
    private user: string,
    private password: string,
    private maxPoolSize: number = 100
  ) {}

  async connect(): Promise<void> {
    this.pool = new Pool({
      host: this.host,
      port: this.port,
      database: this.database,
      user: this.user,
      password: this.password,
      max: this.maxPoolSize, // Maximum pool size for 300+ concurrent users
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 10000,
      // Enable statement timeout to prevent hanging queries
      statement_timeout: 30000,
      // Query timeout
      query_timeout: 30000,
    });

    // Test the connection
    try {
      const client = await this.pool.connect();
      console.log('✅ Connected to PostgreSQL database');
      console.log(`✅ Connection pool initialized with max ${this.maxPoolSize} connections`);
      client.release();
    } catch (error) {
      console.error('❌ Failed to connect to PostgreSQL:', error);
      throw error;
    }

    // Handle pool errors
    this.pool.on('error', (err) => {
      console.error('❌ Unexpected error on idle PostgreSQL client:', err);
    });
  }

  async run(sql: string, params: any[] = []): Promise<{ rowCount: number }> {
    if (!this.pool) throw new Error('Database not connected');
    
    try {
      const result = await this.pool.query(sql, params);
      return { rowCount: result.rowCount || 0 };
    } catch (error: any) {
      console.error('❌ Database query error:', error.message);
      throw error;
    }
  }

  async get<T>(sql: string, params: any[] = []): Promise<T | undefined> {
    if (!this.pool) throw new Error('Database not connected');
    
    try {
      const result = await this.pool.query(sql, params);
      return result.rows[0] as T | undefined;
    } catch (error: any) {
      console.error('❌ Database query error:', error.message);
      throw error;
    }
  }

  async all<T>(sql: string, params: any[] = []): Promise<T[]> {
    if (!this.pool) throw new Error('Database not connected');
    
    try {
      const result = await this.pool.query(sql, params);
      return result.rows as T[];
    } catch (error: any) {
      console.error('❌ Database query error:', error.message);
      throw error;
    }
  }

  // Transaction support - critical for preventing race conditions
  async getClient(): Promise<PoolClient> {
    if (!this.pool) throw new Error('Database not connected');
    return await this.pool.connect();
  }

  async beginTransaction(client: PoolClient): Promise<void> {
    await client.query('BEGIN');
  }

  async commit(client: PoolClient): Promise<void> {
    await client.query('COMMIT');
  }

  async rollback(client: PoolClient): Promise<void> {
    await client.query('ROLLBACK');
  }

  // Execute a transaction with automatic commit/rollback
  async executeTransaction<T>(
    callback: (client: PoolClient) => Promise<T>
  ): Promise<T> {
    const client = await this.getClient();
    try {
      await this.beginTransaction(client);
      const result = await callback(client);
      await this.commit(client);
      return result;
    } catch (error) {
      await this.rollback(client);
      throw error;
    } finally {
      client.release();
    }
  }

  // Helper method for transactional queries
  async queryInTransaction<T>(
    client: PoolClient,
    sql: string,
    params: any[] = []
  ): Promise<T[]> {
    const result = await client.query(sql, params);
    return result.rows as T[];
  }

  async getInTransaction<T>(
    client: PoolClient,
    sql: string,
    params: any[] = []
  ): Promise<T | undefined> {
    const result = await client.query(sql, params);
    return result.rows[0] as T | undefined;
  }

  async runInTransaction(
    client: PoolClient,
    sql: string,
    params: any[] = []
  ): Promise<{ rowCount: number }> {
    const result = await client.query(sql, params);
    return { rowCount: result.rowCount || 0 };
  }

  async close(): Promise<void> {
    if (!this.pool) return;
    
    await this.pool.end();
    console.log('✅ PostgreSQL connection pool closed');
  }

  // Get pool stats for monitoring
  getPoolStats() {
    if (!this.pool) return null;
    return {
      total: this.pool.totalCount,
      idle: this.pool.idleCount,
      waiting: this.pool.waitingCount,
    };
  }
}

// Singleton instance
let dbInstance: PostgresDatabase | null = null;

export function getDatabase(
  host: string,
  port: number,
  database: string,
  user: string,
  password: string,
  maxPoolSize: number = 100
): PostgresDatabase {
  if (!dbInstance) {
    dbInstance = new PostgresDatabase(host, port, database, user, password, maxPoolSize);
  }
  return dbInstance;
}

export default PostgresDatabase;
