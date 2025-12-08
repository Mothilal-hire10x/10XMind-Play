import { Router, Response } from 'express';
import { authenticateToken, AuthRequest } from '../middleware/auth';
import { chatWithGemini, chatWithGeminiStream, getQuickSuggestions } from '../services/gemini';
import { getDatabase } from '../utils/database';

const router = Router();

// Rate limiting for AI endpoints (in-memory simple implementation)
const rateLimits = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT = 50; // requests per hour
const RATE_WINDOW = 60 * 60 * 1000; // 1 hour in ms

function checkRateLimit(userId: string): boolean {
  const now = Date.now();
  const userLimit = rateLimits.get(userId);

  if (!userLimit || now > userLimit.resetTime) {
    rateLimits.set(userId, { count: 1, resetTime: now + RATE_WINDOW });
    return true;
  }

  if (userLimit.count >= RATE_LIMIT) {
    return false;
  }

  userLimit.count++;
  return true;
}

// Chat with 10XBot
router.post('/chat', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { message, history = [] } = req.body;
    const userId = req.user!.id;

    if (!message || typeof message !== 'string') {
      return res.status(400).json({ error: 'Message is required' });
    }

    // Check rate limit
    if (!checkRateLimit(userId)) {
      return res.status(429).json({ 
        error: 'Rate limit exceeded. Please try again later.',
        retryAfter: 3600 
      });
    }

    // Check for API key
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: 'AI service not configured' });
    }

    // Get user data and results
    const db = getDatabase(process.env.DATABASE_PATH || 'database.sqlite');
    const user: any = await db.get('SELECT * FROM users WHERE id = ?', [userId]);
    const results = await db.all(
      'SELECT * FROM game_results WHERE user_id = ? ORDER BY completed_at DESC',
      [userId]
    );

    // Transform results to match expected format
    const formattedResults: any = results.map((r: any) => ({
      ...r,
      game_id: r.game_id,
      user_id: r.user_id,
      reaction_time: r.reaction_time,
      error_count: r.error_count,
      error_rate: r.error_rate,
      completed_at: r.completed_at
    }));

    const userContext = {
      userId,
      userName: user?.name,
      email: user?.email || req.user!.email,
      results: formattedResults
    };

    const response = await chatWithGemini(message, history, userContext, apiKey);

    res.json({ 
      response,
      suggestions: getQuickSuggestions(formattedResults.length > 0)
    });
  } catch (error: any) {
    console.error('AI chat error:', error);
    res.status(500).json({ 
      error: 'Failed to process your message. Please try again.',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Streaming chat endpoint
router.post('/chat/stream', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const { message, history = [] } = req.body;
    const userId = req.user!.id;

    if (!message || typeof message !== 'string') {
      return res.status(400).json({ error: 'Message is required' });
    }

    // Check rate limit
    if (!checkRateLimit(userId)) {
      return res.status(429).json({ 
        error: 'Rate limit exceeded. Please try again later.',
        retryAfter: 3600 
      });
    }

    // Check for API key
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: 'AI service not configured' });
    }

    // Get user data and results
    const db = getDatabase(process.env.DATABASE_PATH || 'database.sqlite');
    const user: any = await db.get('SELECT * FROM users WHERE id = ?', [userId]);
    const results = await db.all(
      'SELECT * FROM game_results WHERE user_id = ? ORDER BY completed_at DESC',
      [userId]
    );

    // Transform results to match expected format
    const formattedResults: any = results.map((r: any) => ({
      ...r,
      game_id: r.game_id,
      user_id: r.user_id,
      reaction_time: r.reaction_time,
      error_count: r.error_count,
      error_rate: r.error_rate,
      completed_at: r.completed_at
    }));

    const userContext = {
      userId,
      userName: user?.name,
      email: user?.email || req.user!.email,
      results: formattedResults
    };

    // Set up SSE headers
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no'); // Disable nginx buffering

    // Send initial suggestions
    res.write(`data: ${JSON.stringify({ 
      type: 'suggestions', 
      suggestions: getQuickSuggestions(formattedResults.length > 0) 
    })}\n\n`);

    try {
      // Stream the response
      for await (const chunk of chatWithGeminiStream(message, history, userContext, apiKey)) {
        res.write(`data: ${JSON.stringify({ type: 'chunk', content: chunk })}\n\n`);
      }

      // Send done signal
      res.write(`data: ${JSON.stringify({ type: 'done' })}\n\n`);
      res.end();
    } catch (streamError: any) {
      res.write(`data: ${JSON.stringify({ type: 'error', error: streamError.message })}\n\n`);
      res.end();
    }
  } catch (error: any) {
    console.error('AI streaming error:', error);
    if (!res.headersSent) {
      res.status(500).json({ 
        error: 'Failed to process your message. Please try again.',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }
});

// Get quick suggestions
router.get('/suggestions', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const userId = req.user!.id;
    const db = getDatabase(process.env.DATABASE_PATH || 'database.sqlite');
    const results = await db.all(
      'SELECT id FROM game_results WHERE user_id = ? LIMIT 1',
      [userId]
    );

    res.json({ 
      suggestions: getQuickSuggestions(results.length > 0)
    });
  } catch (error) {
    console.error('Suggestions error:', error);
    res.status(500).json({ error: 'Failed to get suggestions' });
  }
});

// Health check for AI service
router.get('/health', (req, res) => {
  const hasApiKey = !!process.env.GEMINI_API_KEY;
  res.json({ 
    status: hasApiKey ? 'ok' : 'not_configured',
    service: '10XBot AI'
  });
});

export default router;
