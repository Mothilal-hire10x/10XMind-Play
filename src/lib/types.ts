export interface User {
  id: string
  email: string
  role: 'student' | 'admin'
  createdAt: number
}

export interface GameResult {
  id: string
  userId: string
  userEmail?: string
  gameId: string
  score: number
  reactionTime?: number
  accuracy: number
  timestamp: number
  details?: Record<string, any>
}

export interface GameConfig {
  id: string
  name: string
  category: 'memory' | 'attention' | 'executive'
  description: string
  icon: string
  instructions: string
  controls: string[]
}

export interface TrialResult {
  stimulus: string
  response: string | null
  correct: boolean
  reactionTime: number
  trialType?: string
}
