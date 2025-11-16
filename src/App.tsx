import { useState } from 'react'
import { AuthProvider, useAuth } from '@/lib/auth-context'
import { ThemeProvider } from '@/lib/theme-context'
import { useKV } from '@github/spark/hooks'
import { GameResult, TrialResult } from '@/lib/types'
import { AuthScreen } from '@/components/AuthScreen'
import { Dashboard } from '@/components/Dashboard'
import { AdminDashboard } from '@/components/AdminDashboard'
import { GameInstructions } from '@/components/GameInstructions'
import { GameResults } from '@/components/GameResults'
import { ResultsDashboard } from '@/components/ResultsDashboard'
import { StroopTask } from '@/components/games/StroopTask'
import { FlankerTask } from '@/components/games/FlankerTask'
import { SimonTask } from '@/components/games/SimonTask'
import { DigitSpanTask } from '@/components/games/DigitSpanTask'
import { CorsiBlockTask } from '@/components/games/CorsiBlockTask'
import { TowerOfHanoi } from '@/components/games/TowerOfHanoi'
import { SART } from '@/components/games/SART'
import { NBackTask } from '@/components/games/NBackTask'
import { getGameById } from '@/lib/games'
import { Toaster } from '@/components/ui/sonner'

type Screen = 'dashboard' | 'instructions' | 'game' | 'results' | 'view-results'

function AppContent() {
  const { user, isLoading } = useAuth()
  const [screen, setScreen] = useState<Screen>('dashboard')
  const [selectedGameId, setSelectedGameId] = useState<string | null>(null)
  const [gameResults, setGameResults] = useKV<GameResult[]>('game-results', [])
  const [currentGameSummary, setCurrentGameSummary] = useState<{
    score: number
    accuracy: number
    reactionTime: number
  } | null>(null)

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    )
  }

  if (!user) {
    return <AuthScreen />
  }

  if (user.role === 'admin') {
    return <AdminDashboard />
  }

  const handleSelectGame = (gameId: string) => {
    setSelectedGameId(gameId)
    setScreen('instructions')
  }

  const handleStartGame = () => {
    setScreen('game')
  }

  const handleGameComplete = (trials: TrialResult[], summary: { score: number; accuracy: number; reactionTime: number }) => {
    const result: GameResult = {
      id: `result_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      userId: user.id,
      userEmail: user.email,
      gameId: selectedGameId!,
      score: summary.score,
      reactionTime: summary.reactionTime,
      accuracy: summary.accuracy,
      timestamp: Date.now(),
      details: { trials }
    }

    setGameResults(current => [...(current || []), result])
    setCurrentGameSummary(summary)
    setScreen('results')
  }

  const handleBackToDashboard = () => {
    setScreen('dashboard')
    setSelectedGameId(null)
    setCurrentGameSummary(null)
  }

  const handleViewResults = () => {
    setScreen('view-results')
  }

  const renderGame = () => {
    if (!selectedGameId) return null

    const gameProps = {
      onComplete: handleGameComplete,
      onExit: handleBackToDashboard
    }

    switch (selectedGameId) {
      case 'stroop':
        return <StroopTask {...gameProps} />
      case 'flanker':
        return <FlankerTask {...gameProps} />
      case 'simon':
        return <SimonTask {...gameProps} />
      case 'digit-span':
        return <DigitSpanTask {...gameProps} />
      case 'corsi':
        return <CorsiBlockTask {...gameProps} />
      case 'tower-hanoi':
        return <TowerOfHanoi {...gameProps} />
      case 'sart':
        return <SART {...gameProps} />
      case 'nback':
        return <NBackTask {...gameProps} />
      default:
        return null
    }
  }

  return (
    <>
      {screen === 'dashboard' && (
        <Dashboard onSelectGame={handleSelectGame} onViewResults={handleViewResults} />
      )}
      {screen === 'instructions' && selectedGameId && (
        <GameInstructions
          gameId={selectedGameId}
          onStart={handleStartGame}
          onBack={handleBackToDashboard}
        />
      )}
      {screen === 'game' && renderGame()}
      {screen === 'results' && selectedGameId && currentGameSummary && (
        <GameResults
          gameName={getGameById(selectedGameId)?.name || ''}
          summary={currentGameSummary}
          onContinue={handleBackToDashboard}
        />
      )}
      {screen === 'view-results' && (
        <ResultsDashboard onBack={handleBackToDashboard} />
      )}
      <Toaster />
    </>
  )
}

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </ThemeProvider>
  )
}

export default App