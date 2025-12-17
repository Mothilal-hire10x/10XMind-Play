import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import path from 'path';

import { getDatabase } from './utils/postgres-database';
import { runMigrations } from './utils/postgres-migrate';
import { initializeDatabase } from './utils/unified-database';

import authRoutes from './routes/auth';
import resultsRoutes from './routes/results';
import adminRoutes from './routes/admin';
import aiRoutes from './routes/ai';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// PostgreSQL configuration
const PG_HOST = process.env.POSTGRES_HOST || 'localhost';
const PG_PORT = parseInt(process.env.POSTGRES_PORT || '5432');
const PG_DATABASE = process.env.POSTGRES_DB || 'tenxmind';
const PG_USER = process.env.POSTGRES_USER || 'tenxmind_user';
const PG_PASSWORD = process.env.POSTGRES_PASSWORD || 'tenxmind_secure_password_2024';
const PG_MAX_POOL = parseInt(process.env.POSTGRES_MAX_POOL || '100');

// Security middleware
app.use(helmet());

// CORS configuration
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5001',
  credentials: true
}));

// Rate limiting - Increase for high concurrency and load testing
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5000, // Increased to 5000 requests per IP per 15 minutes for high load
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    // Skip rate limiting for localhost and internal network during testing
    const ip = req.ip || '';
    return ip === '::1' || ip === '127.0.0.1' || ip.startsWith('::ffff:127.0.0.1');
  }
});
app.use(limiter);

// Body parsing middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/results', resultsRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/ai', aiRoutes);

// Health check endpoint with database pool stats
app.get('/api/health', (req, res) => {
  const db = getDatabase(PG_HOST, PG_PORT, PG_DATABASE, PG_USER, PG_PASSWORD, PG_MAX_POOL);
  const poolStats = db.getPoolStats();
  
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    database: {
      type: 'PostgreSQL',
      poolConnections: poolStats
    }
  });
});

// Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Initialize database and start server
async function startServer() {
  try {
    console.log('🔄 Connecting to database...');
    console.log(`   Type: ${process.env.DATABASE_TYPE || 'sqlite'}`);
    
    if (process.env.DATABASE_TYPE === 'postgres') {
      console.log(`   Host: ${PG_HOST}:${PG_PORT}`);
      console.log(`   Database: ${PG_DATABASE}`);
      console.log(`   Max Pool Size: ${PG_MAX_POOL}`);
    }
    
    // Initialize unified database (connects automatically)
    await initializeDatabase();
    console.log('✅ Database connected and initialized');

    // Run migrations if PostgreSQL
    if (process.env.DATABASE_TYPE === 'postgres') {
      console.log('🔄 Running PostgreSQL migrations...');
      await runMigrations(true);
      console.log('✅ Database migrations completed');
    }

    // Start server
    app.listen(PORT, () => {
      console.log('');
      console.log('🚀 ========================================');
      console.log(`✅ Server running on http://localhost:${PORT}`);
      console.log(`✅ Database: PostgreSQL (${PG_HOST}:${PG_PORT})`);
      console.log(`✅ Connection Pool: ${PG_MAX_POOL} max connections`);
      console.log(`✅ Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log('🚀 ========================================');
      console.log('');
      console.log('📋 Available endpoints:');
      console.log(`   GET  /api/health`);
      console.log(`   POST /api/auth/signup`);
      console.log(`   POST /api/auth/login`);
      console.log(`   GET  /api/auth/me`);
      console.log(`   POST /api/auth/logout`);
      console.log(`   GET  /api/results`);
      console.log(`   POST /api/results`);
      console.log(`   GET  /api/admin/users`);
      console.log(`   GET  /api/admin/results`);
      console.log(`   GET  /api/admin/stats`);
      console.log(`   POST /api/ai/chat`);
      console.log(`   GET  /api/ai/suggestions`);
      console.log(`   GET  /api/ai/health`);
      console.log('');
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Handle shutdown gracefully
process.on('SIGINT', async () => {
  console.log('\n🛑 Shutting down server...');
  try {
    const db = getDatabase(PG_HOST, PG_PORT, PG_DATABASE, PG_USER, PG_PASSWORD, PG_MAX_POOL);
    await db.close();
    console.log('✅ Database connections closed');
  } catch (error) {
    console.error('Error closing database:', error);
  }
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\n🛑 Shutting down server...');
  try {
    const db = getDatabase(PG_HOST, PG_PORT, PG_DATABASE, PG_USER, PG_PASSWORD, PG_MAX_POOL);
    await db.close();
    console.log('✅ Database connections closed');
  } catch (error) {
    console.error('Error closing database:', error);
  }
  process.exit(0);
});

// Start the server
startServer();
