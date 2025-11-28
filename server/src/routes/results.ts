import express, { Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import { getDatabase } from '../utils/database';
import { GameResult, GameResultResponse } from '../models/types';
import { authenticateToken, AuthRequest } from '../middleware/auth';
import { randomBytes } from 'crypto';

const router = express.Router();

// Helper function to convert GameResult to GameResultResponse
function toGameResultResponse(result: GameResult): GameResultResponse {
  return {
    id: result.id,
    userId: result.user_id,
    gameId: result.game_id,
    score: result.score,
    accuracy: result.accuracy,
    reactionTime: result.reaction_time,
    errorCount: result.error_count,
    errorRate: result.error_rate,
    details: result.details ? JSON.parse(result.details) : null,
    completedAt: result.completed_at
  };
}

// POST /api/results - Save a game result
router.post(
  '/',
  authenticateToken,
  [
    body('gameId').isString(),
    body('score').isNumeric(),
    body('accuracy').isNumeric(),
    body('reactionTime').isNumeric(),
    body('details').optional()
  ],
  async (req: AuthRequest, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { gameId, score, accuracy, reactionTime, errorCount, errorRate, details } = req.body;
    const db = getDatabase(process.env.DATABASE_PATH!);

    try {
      const resultId = `result_${randomBytes(16).toString('hex')}`;
      const now = Date.now();

      await db.run(
        `INSERT INTO game_results (id, user_id, game_id, score, accuracy, reaction_time, error_count, error_rate, details, completed_at) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          resultId,
          req.user!.id,
          gameId,
          score,
          accuracy,
          reactionTime,
          errorCount !== undefined ? errorCount : null,
          errorRate !== undefined ? errorRate : null,
          details ? JSON.stringify(details) : null,
          now
        ]
      );

      const result = await db.get<GameResult>(
        'SELECT * FROM game_results WHERE id = ?',
        [resultId]
      );

      if (!result) {
        return res.status(500).json({ error: 'Failed to save result' });
      }

      res.status(201).json({ result: toGameResultResponse(result) });
    } catch (error) {
      console.error('Save result error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

// GET /api/results - Get all results for current user
router.get('/', authenticateToken, async (req: AuthRequest, res: Response) => {
  const db = getDatabase(process.env.DATABASE_PATH!);

  try {
    const results = await db.all<GameResult>(
      'SELECT * FROM game_results WHERE user_id = ? ORDER BY completed_at DESC',
      [req.user!.id]
    );

    res.json({ results: results.map(toGameResultResponse) });
  } catch (error) {
    console.error('Get results error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/results/:gameId - Get results for a specific game
router.get('/:gameId', authenticateToken, async (req: AuthRequest, res: Response) => {
  const { gameId } = req.params;
  const db = getDatabase(process.env.DATABASE_PATH!);

  try {
    const results = await db.all<GameResult>(
      'SELECT * FROM game_results WHERE user_id = ? AND game_id = ? ORDER BY completed_at DESC',
      [req.user!.id, gameId]
    );

    res.json({ results: results.map(toGameResultResponse) });
  } catch (error) {
    console.error('Get game results error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /api/results/:id - Delete a result
router.delete('/:id', authenticateToken, async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const db = getDatabase(process.env.DATABASE_PATH!);

  try {
    // Verify the result belongs to the user
    const result = await db.get<GameResult>(
      'SELECT * FROM game_results WHERE id = ? AND user_id = ?',
      [id, req.user!.id]
    );

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

export default router;
