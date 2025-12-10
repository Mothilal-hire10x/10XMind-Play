import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { AuthProvider, useAuth } from '@/lib/auth-context'
import { ThemeProvider } from '@/lib/theme-context'
import { resultsAPI } from '@/lib/api-client'
import { GameResult, TrialResult, GameSummary } from '@/lib/types'
import { AuthScreen } from '@/components/AuthScreen'
import { Dashboard } from '@/components/Dashboard'
import { AdminDashboard } from '@/components/AdminDashboard'
import { StudentOnboarding } from '@/components/StudentOnboarding'
import { GameInstructions } from '@/components/GameInstructions'
import { GameResults } from '@/components/GameResults'
import { ResultsDashboard } from '@/components/ResultsDashboard'
import { StroopTask } from '@/components/games/StroopTask'
import { DigitSpanTask } from '@/components/games/DigitSpanTask'
import { DigitSpanForward } from '@/components/games/DigitSpanForward'
import { DigitSpanBackward } from '@/components/games/DigitSpanBackward'
import { TrailMakingTest } from '@/components/games/TrailMakingTest'
import { MentalRotationTest } from '@/components/games/MentalRotationTest'
import { DichoticListeningTest } from '@/components/games/DichoticListeningTest'
import { HandednessInventory } from '@/components/games/HandednessInventory'
import { getGameById } from '@/lib/games'
import { Toaster } from '@/components/ui/sonner'
import { toast } from 'sonner'
import { TenXBot } from '@/components/TenXBot'
import { pageSlideUp, pageFade } from '@/lib/animations'

// Page transition wrapper component
const PageTransition = ({ children, keyId }: { children: React.ReactNode, keyId: string }) => (
  <motion.div
    key={keyId}
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -10 }}
    transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
  >
    {children}
  </motion.div>
)

// Loading screen with animation
const LoadingScreen = () => (
  <motion.div 
    className="min-h-screen bg-background flex flex-col items-center justify-center gap-4"
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
  >
    <motion.div
      className="w-16 h-16 rounded-full bg-gradient-to-br from-primary to-blue-600 flex items-center justify-center shadow-xl shadow-primary/25"
      animate={{ 
        scale: [1, 1.1, 1],
        rotate: [0, 180, 360]
      }}
      transition={{ 
        duration: 2, 
        repeat: Infinity,
        ease: "easeInOut"
      }}
    >
      <svg className="w-8 h-8 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M12 2a10 10 0 1 0 10 10" strokeLinecap="round"/>
      </svg>
    </motion.div>
    <motion.p 
      className="text-muted-foreground font-medium"
      animate={{ opacity: [0.5, 1, 0.5] }}
      transition={{ duration: 1.5, repeat: Infinity }}
    >
      Loading...
    </motion.p>
  </motion.div>
)

type Screen = 'dashboard' | 'instructions' | 'game' | 'results' | 'view-results'

function AppContent() {
  const { user, isLoading } = useAuth()
  const [screen, setScreen] = useState<Screen>('dashboard')
  const [selectedGameId, setSelectedGameId] = useState<string | null>(null)
  const [currentGameSummary, setCurrentGameSummary] = useState<GameSummary | null>(null)

  if (isLoading) {
    return <LoadingScreen />
  }

  if (!user) {
    return (
      <AnimatePresence mode="wait">
        <PageTransition keyId="auth">
          <AuthScreen />
        </PageTransition>
      </AnimatePresence>
    )
  }

  if (user.role === 'admin') {
    return (
      <AnimatePresence mode="wait">
        <PageTransition keyId="admin">
          <AdminDashboard />
        </PageTransition>
      </AnimatePresence>
    )
  }

  const handleSelectGame = (gameId: string) => {
    setSelectedGameId(gameId)
    setScreen('instructions')
  }

  const handleStartGame = () => {
    setScreen('game')
  }

  const handleGameComplete = async (trials: TrialResult[], summary: GameSummary) => {
    try {
      // Save result to backend
      await resultsAPI.saveResult(
        selectedGameId!,
        summary.score,
        summary.accuracy,
        summary.reactionTime,
        summary.errorCount,
        summary.errorRate,
        { trials, ...summary.details }
      )
      
      setCurrentGameSummary(summary)
      setScreen('results')
      toast.success('Game results saved successfully!')
    } catch (error) {
      console.error('Failed to save game result:', error)
      toast.error('Failed to save game results')
    }
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
      case 'digit-span-forward':
        return <DigitSpanForward {...gameProps} />
      case 'digit-span-backward':
        return <DigitSpanBackward {...gameProps} />
      case 'digit-span':
        return <DigitSpanTask {...gameProps} />
      case 'trail-making':
        return <TrailMakingTest {...gameProps} />
      case 'mental-rotation':
        return <MentalRotationTest {...gameProps} />
      case 'dichotic-listening':
        return <DichoticListeningTest {...gameProps} />
      case 'handedness-inventory':
        return <HandednessInventory {...gameProps} />
      default:
        return null
    }
  }

  return (
    <>
      <AnimatePresence mode="wait">
        {screen === 'dashboard' && (
          <PageTransition keyId="dashboard">
            <StudentOnboarding onSelectGame={handleSelectGame} onViewResults={handleViewResults} />
          </PageTransition>
        )}
        {screen === 'instructions' && selectedGameId && (
          <PageTransition keyId="instructions">
            <GameInstructions
              gameId={selectedGameId}
              onStart={handleStartGame}
              onBack={handleBackToDashboard}
            />
          </PageTransition>
        )}
        {screen === 'game' && (
          <PageTransition keyId="game">
            {renderGame()}
          </PageTransition>
        )}
        {screen === 'results' && selectedGameId && currentGameSummary && (
          <PageTransition keyId="results">
            <GameResults
              gameName={getGameById(selectedGameId)?.name || ''}
              summary={currentGameSummary}
              onContinue={handleBackToDashboard}
            />
          </PageTransition>
        )}
        {screen === 'view-results' && (
          <PageTransition keyId="view-results">
            <ResultsDashboard onBack={handleBackToDashboard} />
          </PageTransition>
        )}
      </AnimatePresence>
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