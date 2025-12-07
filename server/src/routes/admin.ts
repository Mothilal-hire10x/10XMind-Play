import express, { Response } from 'express';
import { getDatabase } from '../utils/database';
import { User, GameResult, UserResponse, GameResultResponse } from '../models/types';
import { authenticateToken, requireAdmin, AuthRequest } from '../middleware/auth';

const router = express.Router();

// All admin routes require authentication and admin role
router.use(authenticateToken);
router.use(requireAdmin);

// Helper functions
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

function toGameResultResponse(result: GameResult): GameResultResponse {
  return {
    id: result.id,
    userId: result.user_id,
    gameId: result.game_id,
    score: result.score,
    accuracy: result.accuracy,
    reactionTime: result.reaction_time,
    details: result.details ? JSON.parse(result.details) : null,
    completedAt: result.completed_at
  };
}

// GET /api/admin/users - Get all users
router.get('/users', async (req: AuthRequest, res: Response) => {
  const db = getDatabase(process.env.DATABASE_PATH!);

  try {
    const users = await db.all<User>('SELECT * FROM users ORDER BY created_at DESC');
    res.json({ users: users.map(toUserResponse) });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/admin/users/:id - Get specific user
router.get('/users/:id', async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const db = getDatabase(process.env.DATABASE_PATH!);

  try {
    const user = await db.get<User>('SELECT * FROM users WHERE id = ?', [id]);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ user: toUserResponse(user) });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /api/admin/users/:id - Delete a user
router.delete('/users/:id', async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const db = getDatabase(process.env.DATABASE_PATH!);

  try {
    // Prevent deleting admin user
    const user = await db.get<User>('SELECT * FROM users WHERE id = ?', [id]);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (user.role === 'admin') {
      return res.status(403).json({ error: 'Cannot delete admin user' });
    }

    await db.run('DELETE FROM users WHERE id = ?', [id]);

    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/admin/results - Get all results
router.get('/results', async (req: AuthRequest, res: Response) => {
  const db = getDatabase(process.env.DATABASE_PATH!);

  try {
    const results = await db.all<GameResult>(
      'SELECT * FROM game_results ORDER BY completed_at DESC'
    );

    res.json({ results: results.map(toGameResultResponse) });
  } catch (error) {
    console.error('Get all results error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/admin/results/user/:userId - Get results for a specific user
router.get('/results/user/:userId', async (req: AuthRequest, res: Response) => {
  const { userId } = req.params;
  const db = getDatabase(process.env.DATABASE_PATH!);

  try {
    const results = await db.all<GameResult>(
      'SELECT * FROM game_results WHERE user_id = ? ORDER BY completed_at DESC',
      [userId]
    );

    res.json({ results: results.map(toGameResultResponse) });
  } catch (error) {
    console.error('Get user results error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/admin/stats - Get overall statistics
router.get('/stats', async (req: AuthRequest, res: Response) => {
  const db = getDatabase(process.env.DATABASE_PATH!);

  try {
    // Get total users
    const userCountResult = await db.get<{ count: number }>(
      'SELECT COUNT(*) as count FROM users WHERE role = "student"'
    );

    // Get total results
    const resultCountResult = await db.get<{ count: number }>(
      'SELECT COUNT(*) as count FROM game_results'
    );

    // Get results by game
    const resultsByGame = await db.all<{ game_id: string; count: number; avg_score: number }>(
      `SELECT 
        game_id, 
        COUNT(*) as count, 
        AVG(score) as avg_score 
      FROM game_results 
      GROUP BY game_id`
    );

    // Get recent activity (last 7 days)
    const sevenDaysAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
    const recentActivity = await db.all<{ date: string; count: number }>(
      `SELECT 
        DATE(completed_at / 1000, 'unixepoch') as date, 
        COUNT(*) as count 
      FROM game_results 
      WHERE completed_at > ? 
      GROUP BY date 
      ORDER BY date DESC`,
      [sevenDaysAgo]
    );

    res.json({
      stats: {
        totalUsers: userCountResult?.count || 0,
        totalResults: resultCountResult?.count || 0,
        resultsByGame: resultsByGame || [],
        recentActivity: recentActivity || []
      }
    });
  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /api/admin/results/:id - Delete any result
router.delete('/results/:id', async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const db = getDatabase(process.env.DATABASE_PATH!);

  try {
    const result = await db.get<GameResult>('SELECT * FROM game_results WHERE id = ?', [id]);

    if (!result) {
      return res.status(404).json({ error: 'Result not found' });
    }

    await db.run('DELETE FROM game_results WHERE id = ?', [id]);

    res.json({ message: 'Result deleted successfully' });
  } catch (error) {
    console.error('Delete result error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/admin/reset - Reset all data (dangerous!)
router.post('/reset', async (req: AuthRequest, res: Response) => {
  const db = getDatabase(process.env.DATABASE_PATH!);

  try {
    // Delete all results
    await db.run('DELETE FROM game_results');

    // Delete all non-admin users
    await db.run('DELETE FROM users WHERE role != "admin"');

    // Delete all sessions
    await db.run('DELETE FROM sessions');

    res.json({ message: 'Database reset successfully' });
  } catch (error) {
    console.error('Reset database error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
