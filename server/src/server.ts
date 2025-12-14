import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import path from 'path';

import { getDatabase } from './utils/database';
import { seedDatabase } from './utils/seed';

import authRoutes from './routes/auth';
import resultsRoutes from './routes/results';
import adminRoutes from './routes/admin';
import aiRoutes from './routes/ai';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;
const DB_PATH = process.env.DATABASE_PATH || path.join(__dirname, '../database.sqlite');

// Security middleware
app.use(helmet());

// CORS configuration
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5001',
  credentials: true
}));

// Rate limiting - Increase for high concurrency
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // Increased from 500 to 1000 requests per IP per window
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
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

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
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
    // Connect to database
    const db = getDatabase(DB_PATH);
    await db.connect();

    // Run migrations and seed (keep connection open)
    await seedDatabase(true);

    // Start server
    app.listen(PORT, () => {
      console.log('');
      console.log('🚀 ========================================');
      console.log(`✅ Server running on http://localhost:${PORT}`);
      console.log(`✅ Database: ${DB_PATH}`);
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
  const db = getDatabase(DB_PATH);
  await db.close();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\n🛑 Shutting down server...');
  const db = getDatabase(DB_PATH);
  await db.close();
  process.exit(0);
});

// Start the server
startServer();
