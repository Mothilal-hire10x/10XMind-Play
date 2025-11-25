export interface User {
  id: string;
  email: string;
  password: string;
  role: 'admin' | 'student';
  created_at: number;
  updated_at: number;
}

export interface UserResponse {
  id: string;
  email: string;
  role: 'admin' | 'student';
  createdAt: number;
}

export interface GameResult {
  id: string;
  user_id: string;
  game_id: string;
  score: number;
  accuracy: number;
  reaction_time: number;
  error_count?: number | null;
  error_rate?: number | null;
  details: string | null;
  completed_at: number;
}

export interface GameResultResponse {
  id: string;
  userId: string;
  gameId: string;
  score: number;
  accuracy: number;
  reactionTime: number;
  errorCount?: number | null;
  errorRate?: number | null;
  details: any;
  completedAt: number;
}

export interface Session {
  id: string;
  user_id: string;
  token: string;
  expires_at: number;
  created_at: number;
}
