import express, { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { body, validationResult } from 'express-validator';
import { getDatabase } from '../utils/database';
import { User, UserResponse } from '../models/types';
import { authenticateToken, AuthRequest } from '../middleware/auth';
import { randomBytes } from 'crypto';

const router = express.Router();

// Helper function to convert User to UserResponse
function toUserResponse(user: User): UserResponse {
  return {
    id: user.id,
    email: user.email,
    role: user.role,
    rollNo: user.roll_no,
    name: user.name,
    dob: user.dob,
    consentDate: user.consent_date,
    createdAt: user.created_at
  };
}

// Helper function to generate JWT
function generateToken(user: User): string {
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    process.env.JWT_SECRET!,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
}

// POST /api/auth/signup
router.post(
  '/signup',
  [
    body('email').isEmail().normalizeEmail(),
    body('password').isLength({ min: 6 }),
    body('rollNo').optional().trim(),
    body('name').optional().trim(),
    body('dob').optional().trim()
  ],
  async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password, rollNo, name, dob } = req.body;
    const db = getDatabase(process.env.DATABASE_PATH!);

    try {
      // Check if user already exists
      const existingUser = await db.get<User>(
        'SELECT * FROM users WHERE email = ?',
        [email]
      );

      if (existingUser) {
        return res.status(400).json({ error: 'User already exists' });
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10);

      // Create user
      const userId = `user_${randomBytes(16).toString('hex')}`;
      const now = Date.now();

      await db.run(
        `INSERT INTO users (id, email, password, role, roll_no, name, dob, created_at, updated_at) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [userId, email, hashedPassword, 'student', rollNo || null, name || null, dob || null, now, now]
      );

      // Get created user
      const user = await db.get<User>(
        'SELECT * FROM users WHERE id = ?',
        [userId]
      );

      if (!user) {
        return res.status(500).json({ error: 'Failed to create user' });
      }

      // Generate token
      const token = generateToken(user);

      res.status(201).json({
        user: toUserResponse(user),
        token
      });
    } catch (error) {
      console.error('Signup error:', error);
      
      // Check for specific SQLite errors
      if (error instanceof Error) {
        if (error.message.includes('database is locked') || 
            error.message.includes('SQLITE_BUSY')) {
          return res.status(503).json({ 
            error: 'Service temporarily busy, please try again in a moment' 
          });
        }
        if (error.message.includes('UNIQUE constraint failed')) {
          return res.status(400).json({ error: 'User already exists' });
        }
      }
      
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

// POST /api/auth/login
router.post(
  '/login',
  [
    body('email').isEmail().normalizeEmail(),
    body('password').exists()
  ],
  async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body;
    const db = getDatabase(process.env.DATABASE_PATH!);

    try {
      // Find user
      const user = await db.get<User>(
        'SELECT * FROM users WHERE email = ?',
        [email]
      );

      if (!user) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      // Verify password
      const validPassword = await bcrypt.compare(password, user.password);

      if (!validPassword) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      // Generate token
      const token = generateToken(user);

      res.json({
        user: toUserResponse(user),
        token
      });
    } catch (error) {
      console.error('Login error:', error);
      
      // Check for specific SQLite errors
      if (error instanceof Error) {
        if (error.message.includes('database is locked') || 
            error.message.includes('SQLITE_BUSY')) {
          return res.status(503).json({ 
            error: 'Service temporarily busy, please try again in a moment' 
          });
        }
      }
      
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

// GET /api/auth/me - Get current user
router.get('/me', authenticateToken, async (req: AuthRequest, res: Response) => {
  const db = getDatabase(process.env.DATABASE_PATH!);

  try {
    const user = await db.get<User>(
      'SELECT * FROM users WHERE id = ?',
      [req.user!.id]
    );

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ user: toUserResponse(user) });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/auth/logout
router.post('/logout', authenticateToken, async (req: AuthRequest, res: Response) => {
  // In a stateless JWT system, logout is handled client-side by removing the token
  // If you want to implement token blacklisting, you can add it to the sessions table
  res.json({ message: 'Logged out successfully' });
});

// PATCH /api/auth/consent - Update user consent date
router.patch('/consent', authenticateToken, async (req: AuthRequest, res: Response) => {
  const { consentDate } = req.body;
  const db = getDatabase(process.env.DATABASE_PATH!);

  try {
    const now = Date.now();
    await db.run(
      'UPDATE users SET consent_date = ?, updated_at = ? WHERE id = ?',
      [consentDate, now, req.user!.id]
    );

    const user = await db.get<User>(
      'SELECT * FROM users WHERE id = ?',
      [req.user!.id]
    );

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ user: toUserResponse(user) });
  } catch (error) {
    console.error('Update consent error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
