import { useState, useEffect, useCallback, useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { X, Check, XCircle } from '@phosphor-icons/react'
import { TrialResult, GameSummary } from '@/lib/types'
import { motion, AnimatePresence } from 'framer-motion'

interface StroopTaskProps {
  onComplete: (results: TrialResult[], summary: GameSummary) => void
  onExit: () => void
}

const COLORS = ['RED', 'GREEN', 'BLUE', 'YELLOW'] as const
type ColorType = typeof COLORS[number]

const COLOR_KEYS: Record<string, ColorType> = { r: 'RED', g: 'GREEN', b: 'BLUE', y: 'YELLOW' }
const COLOR_VALUES: Record<ColorType, string> = {
  RED: 'oklch(0.63 0.26 25)',
  GREEN: 'oklch(0.72 0.20 145)',
  BLUE: 'oklch(0.58 0.20 250)',
  YELLOW: 'oklch(0.85 0.18 95)'
}

const TOTAL_TRIALS = 40 // PsyToolkit standard: minimum 40 trials for reliable Stroop effect measurement
const RESPONSE_TIMEOUT = 3000 // PsyToolkit standard: timeout after 3 seconds
const FIXATION_DURATION = 500 // Fixation cross duration in ms
const FEEDBACK_DURATION = 400 // Feedback display duration in ms
const PRACTICE_TRIALS = 1 // Number of practice trials

export function StroopTask({ onComplete, onExit }: StroopTaskProps) {
  // Instruction and practice state
  const [gamePhase, setGamePhase] = useState<'instructions' | 'practice' | 'test'>('instructions')
  const [instructionPage, setInstructionPage] = useState(1)
  const [practiceComplete, setPracticeComplete] = useState(false)
  
  // Game state
  const [currentTrial, setCurrentTrial] = useState(0)
  const [stimulus, setStimulus] = useState<{ word: ColorType; color: ColorType } | null>(null)
  const [startTime, setStartTime] = useState(0)
  const [results, setResults] = useState<TrialResult[]>([])
  const [feedback, setFeedback] = useState<'correct' | 'incorrect' | 'timeout' | null>(null)
  const [showFixation, setShowFixation] = useState(true)
  const [streak, setStreak] = useState(0)
  const [timeoutId, setTimeoutId] = useState<number | null>(null)

  const generateStimulus = useCallback((): { word: ColorType; color: ColorType } => {
    const word = COLORS[Math.floor(Math.random() * COLORS.length)]
    const color = COLORS[Math.floor(Math.random() * COLORS.length)]
    return { word, color }
  }, [])

  // Handle timeout (PsyToolkit standard: status 3 = timeout)
  const handleTimeout = useCallback((timedOutStimulus: { word: ColorType; color: ColorType }) => {
    const trialResult: TrialResult = {
      stimulus: `${timedOutStimulus.word} (${timedOutStimulus.color})`,
      response: 'TIMEOUT',
      correct: false,
      reactionTime: RESPONSE_TIMEOUT,
      trialType: 'timeout',
      status: 3 // PsyToolkit standard: status 3 = timeout
    }

    setResults(prev => [...prev, trialResult])
    setFeedback('timeout')
    setStreak(0)
    setCurrentTrial(prev => prev + 1)

    setTimeout(() => {
      startNextTrial()
    }, FEEDBACK_DURATION)
  }, [])

  const startNextTrial = useCallback(() => {
    // Clear any existing timeout
    if (timeoutId) {
      clearTimeout(timeoutId)
      setTimeoutId(null)
    }

    const maxTrials = gamePhase === 'practice' ? PRACTICE_TRIALS : TOTAL_TRIALS

    if (currentTrial >= maxTrials) {
      if (gamePhase === 'practice') {
        // Practice complete, show transition message
        setPracticeComplete(true)
        return
      }
      
      // Test complete
      const totalCorrect = results.filter(r => r.correct).length
      const totalTimeout = results.filter(r => r.trialType === 'timeout').length
      const avgRT = results
        .filter(r => r.trialType !== 'timeout')
        .reduce((sum, r) => sum + r.reactionTime, 0) / (results.length - totalTimeout)
      
      // Calculate Stroop Interference Effect (PsyToolkit standard calculation)
      const congruentTrials = results.filter(r => r.trialType === 'congruent' || r.trialType === 'congruent')
      const incongruentTrials = results.filter(r => r.trialType === 'incongruent' || r.trialType === 'incongruent')
      
      const congruentRT = congruentTrials.filter(t => t.correct).length > 0 
        ? congruentTrials.filter(t => t.correct).reduce((sum, r) => sum + r.reactionTime, 0) / congruentTrials.filter(t => t.correct).length 
        : 0
      const incongruentRT = incongruentTrials.filter(t => t.correct).length > 0 
        ? incongruentTrials.filter(t => t.correct).reduce((sum, r) => sum + r.reactionTime, 0) / incongruentTrials.filter(t => t.correct).length 
        : 0
      
      const stroopEffect = incongruentRT - congruentRT
      const errorCount = TOTAL_TRIALS - totalCorrect
      const errorRate = (errorCount / TOTAL_TRIALS) * 100
      
      onComplete(results, {
        score: totalCorrect,
        accuracy: (totalCorrect / TOTAL_TRIALS) * 100,
        reactionTime: avgRT,
        errorCount,
        errorRate,
        details: {
          congruentRT,
          incongruentRT,
          stroopEffect, // PsyToolkit standard naming
          errorRate,
          timeoutRate: (totalTimeout / TOTAL_TRIALS) * 100,
          congruentTrials: congruentTrials.length,
          incongruentTrials: incongruentTrials.length,
          congruentCorrect: congruentTrials.filter(r => r.correct).length,
          incongruentCorrect: incongruentTrials.filter(r => r.correct).length
        }
      })
      return
    }

    setShowFixation(true)
    setFeedback(null)
    setTimeout(() => {
      setShowFixation(false)
      const newStimulus = generateStimulus()
      setStimulus(newStimulus)
      setStartTime(performance.now())
      
      // Set timeout for response (PsyToolkit standard: status 3 = timeout)
      const id = window.setTimeout(() => {
        handleTimeout(newStimulus)
      }, RESPONSE_TIMEOUT)
      setTimeoutId(id)
    }, FIXATION_DURATION)
  }, [currentTrial, results, generateStimulus, onComplete, timeoutId, gamePhase])

  useEffect(() => {
    if (gamePhase === 'practice' || gamePhase === 'test') {
      startNextTrial()
    }
  }, [gamePhase])

  const handleKeyPress = useCallback((event: KeyboardEvent) => {
    if (!stimulus || showFixation || feedback) return
    if (gamePhase === 'instructions') return

    const key = event.key.toLowerCase()
    if (!(key in COLOR_KEYS)) return

    // Clear timeout on response
    if (timeoutId) {
      clearTimeout(timeoutId)
      setTimeoutId(null)
    }

    const reactionTime = performance.now() - startTime
    const response = COLOR_KEYS[key]
    const correct = response === stimulus.color
    
    // PsyToolkit standard: Status 1=correct, 2=wrong, 3=timeout
    const status = correct ? 1 : 2

    const trialResult: TrialResult = {
      stimulus: `${stimulus.word} (${stimulus.color})`,
      response,
      correct,
      reactionTime,
      trialType: stimulus.word === stimulus.color ? 'congruent' : 'incongruent',
      status // Add PsyToolkit status code
    }

    // Only save results during actual test, not practice
    if (gamePhase === 'test') {
      setResults(prev => [...prev, trialResult])
    }
    
    setFeedback(correct ? 'correct' : 'incorrect')
    setStreak(prev => correct ? prev + 1 : 0)
    setCurrentTrial(prev => prev + 1)

    setTimeout(() => {
      startNextTrial()
    }, FEEDBACK_DURATION)
  }, [stimulus, showFixation, feedback, startTime, timeoutId, startNextTrial, gamePhase])

  useEffect(() => {
    window.addEventListener('keydown', handleKeyPress)
    return () => window.removeEventListener('keydown', handleKeyPress)
  }, [handleKeyPress])

  const stats = useMemo(() => {
    const correct = results.filter(r => r.correct).length
    const total = results.length
    const errors = total - correct
    const errorRate = total > 0 ? Math.round((errors / total) * 100) : 0
    
    return {
      accuracy: total > 0 ? Math.round((correct / total) * 100) : 0,
      avgRT: total > 0 ? Math.round(results.reduce((sum, r) => sum + r.reactionTime, 0) / total) : 0,
      errors,
      errorRate
    }
  }, [results])

  // Instructions screen
  if (gamePhase === 'instructions') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 flex flex-col">
        <div className="p-6 border-b border-border/50 backdrop-blur-sm bg-card/50 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-yellow-500">
            Instructions {instructionPage} of 4
          </h2>
          <Button variant="ghost" size="icon" onClick={onExit}>
            <X size={24} />
          </Button>
        </div>

        <div className="flex-1 flex items-center justify-center p-8">
          <Card className="max-w-3xl w-full p-12 bg-card/95 backdrop-blur-sm border-2">
            <AnimatePresence mode="wait">
              {instructionPage === 1 && (
                <motion.div
                  key="page1"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-6"
                >
                  <p className="text-lg leading-relaxed">
                    In this experiment, you will see <strong>colored words</strong> on the screen.
                  </p>
                  <p className="text-lg leading-relaxed">
                    Your task is to respond to the <strong>ink color</strong> of the word, 
                    <strong> NOT</strong> the meaning of the word.
                  </p>
                  <p className="text-lg leading-relaxed">
                    For example, if you see the word <span style={{ color: COLOR_VALUES.RED }}>GREEN</span> 
                    {' '}printed in red ink, you should press <kbd className="px-3 py-1 bg-muted rounded font-mono">R</kbd> for red.
                  </p>
                </motion.div>
              )}

              {instructionPage === 2 && (
                <motion.div
                  key="page2"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-6"
                >
                  <p className="text-lg leading-relaxed">
                    Use these keys to respond to the ink color:
                  </p>
                  <div className="grid grid-cols-4 gap-4 my-8">
                    {Object.entries(COLOR_KEYS).map(([key, color]) => (
                      <div key={key} className="text-center p-6 bg-muted/50 rounded-lg">
                        <kbd className="block text-4xl font-mono font-bold mb-3" style={{ color: COLOR_VALUES[color] }}>
                          {key.toUpperCase()}
                        </kbd>
                        <span className="text-sm font-medium">{color}</span>
                      </div>
                    ))}
                  </div>
                  <p className="text-lg leading-relaxed">
                    Respond as <strong>quickly and accurately</strong> as possible.
                  </p>
                </motion.div>
              )}

              {instructionPage === 3 && (
                <motion.div
                  key="page3"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-6"
                >
                  <p className="text-lg leading-relaxed">
                    You will complete {TOTAL_TRIALS} trials in total.
                  </p>
                  <p className="text-lg leading-relaxed">
                    First, you will do <strong>1 practice trial</strong> to get familiar with the task.
                  </p>
                  <p className="text-lg leading-relaxed">
                    After the practice, the real test will begin.
                  </p>
                  <p className="text-lg leading-relaxed font-semibold text-primary">
                    Remember: Respond to the COLOR, not the word!
                  </p>
                </motion.div>
              )}

              {instructionPage === 4 && (
                <motion.div
                  key="page4"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-6"
                >
                  <div className="text-center mb-4">
                    <Badge className="bg-yellow-100 text-yellow-800 border-yellow-300 dark:bg-yellow-900 dark:text-yellow-100 text-lg px-4 py-2">
                      🎯 About the Practice Trial
                    </Badge>
                  </div>
                  <p className="text-lg leading-relaxed">
                    During the <strong>practice trial</strong>, you will see:
                  </p>
                  <div className="bg-muted/50 p-6 rounded-lg space-y-3">
                    <div className="flex items-start gap-3">
                      <span className="text-2xl">✓</span>
                      <p className="text-base">
                        A <strong className="text-green-600">green checkmark</strong> appears when you respond correctly
                      </p>
                    </div>
                    <div className="flex items-start gap-3">
                      <span className="text-2xl text-red-600">✗</span>
                      <p className="text-base">
                        A <strong className="text-red-600">red X</strong> appears when you respond incorrectly
                      </p>
                    </div>
                    <div className="flex items-start gap-3">
                      <span className="text-2xl">🔑</span>
                      <p className="text-base">
                        The card border changes color to show your response feedback
                      </p>
                    </div>
                  </div>
                  <p className="text-lg leading-relaxed">
                    This feedback will help you understand the task before the actual test begins.
                  </p>
                  <div className="bg-primary/10 p-4 rounded-lg border-l-4 border-primary">
                    <p className="text-base font-semibold">
                      👍 Pro Tip: Use the practice to get comfortable with the key positions (R, G, B, Y) so you can respond quickly!
                    </p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="flex justify-between mt-12">
              {instructionPage > 1 && (
                <Button
                  size="lg"
                  variant="outline"
                  onClick={() => setInstructionPage(p => p - 1)}
                  className="text-lg px-8"
                >
                  ← Previous page
                </Button>
              )}
              <div className="flex-1" />
              {instructionPage < 4 ? (
                <Button
                  size="lg"
                  onClick={() => setInstructionPage(p => p + 1)}
                  className="text-lg px-8 bg-blue-600 hover:bg-blue-700"
                >
                  Next page →
                </Button>
              ) : (
                <Button
                  size="lg"
                  onClick={() => {
                    setGamePhase('practice')
                    setCurrentTrial(0)
                  }}
                  className="text-lg px-8 bg-blue-600 hover:bg-blue-700"
                >
                  Leave instructions and start practice →
                </Button>
              )}
            </div>
          </Card>
        </div>
      </div>
    )
  }

  // Practice complete transition screen
  if (practiceComplete) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 flex items-center justify-center"
        onClick={() => {
          setPracticeComplete(false)
          setGamePhase('test')
          setCurrentTrial(0)
          setResults([])
        }}
      >
        <Card className="max-w-2xl p-12 bg-yellow-500/10 border-4 border-yellow-500 cursor-pointer hover:bg-yellow-500/20 transition-all">
          <div className="text-center space-y-6">
            <h2 className="text-3xl font-bold text-foreground">
              Now you have done your training trial.
            </h2>
            <p className="text-2xl font-semibold text-foreground">
              The real test begins now. Concentrate!
            </p>
            <p className="text-lg text-muted-foreground">
              Click anywhere to continue
            </p>
          </div>
        </Card>
      </div>
    )
  }

  const maxTrials = gamePhase === 'practice' ? PRACTICE_TRIALS : TOTAL_TRIALS

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 flex flex-col">
      <div className="p-6 border-b border-border/50 backdrop-blur-sm bg-card/50 flex items-center justify-between">
        <div className="flex-1 space-y-3">
          <div className="flex items-center gap-4">
            {gamePhase === 'practice' && (
              <Badge className="bg-yellow-500 text-black text-sm px-3 py-1">
                PRACTICE TRIAL
              </Badge>
            )}
            <Progress value={(currentTrial / maxTrials) * 100} className="h-2 flex-1" />
            <span className="text-sm font-medium text-muted-foreground min-w-20 text-right">
              {currentTrial}/{maxTrials}
            </span>
          </div>
          {gamePhase === 'test' && (
            <div className="flex gap-3">
              <Badge variant="outline" className="gap-2">
                <span className="text-xs text-muted-foreground">Accuracy</span>
                <span className="font-bold">{stats.accuracy}%</span>
              </Badge>
              <Badge variant="outline" className="gap-2">
                <span className="text-xs text-muted-foreground">Avg RT</span>
                <span className="font-bold">{stats.avgRT}ms</span>
              </Badge>
              <Badge variant="outline" className="gap-2">
                <span className="text-xs text-muted-foreground">Errors</span>
                <span className="font-bold text-destructive">{stats.errors} ({stats.errorRate}%)</span>
              </Badge>
              {streak >= 3 && (
                <Badge className="gap-1 bg-gradient-to-r from-primary to-accent animate-pulse">
                  🔥 {streak} streak
                </Badge>
              )}
            </div>
          )}
        </div>
        <Button variant="ghost" size="icon" onClick={onExit} className="ml-4">
          <X size={24} />
        </Button>
      </div>

      <div className="flex-1 flex items-center justify-center relative overflow-hidden">
        <AnimatePresence mode="wait">
          {showFixation ? (
            <motion.div
              key="fixation"
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              className="text-6xl font-bold text-muted-foreground"
            >
              +
            </motion.div>
          ) : stimulus ? (
            <motion.div
              key={`stimulus-${currentTrial}`}
              initial={{ scale: 0.8, opacity: 0, rotateX: -90 }}
              animate={{ scale: 1, opacity: 1, rotateX: 0 }}
              exit={{ scale: 0.8, opacity: 0, rotateX: 90 }}
              transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            >
              <Card className={`relative p-16 border-2 shadow-2xl transition-all duration-200 ${
                feedback === 'correct' 
                  ? 'border-success bg-success/5 shadow-success/20' 
                  : feedback === 'incorrect'
                  ? 'border-destructive bg-destructive/5 shadow-destructive/20'
                  : feedback === 'timeout'
                  ? 'border-orange-500 bg-orange-500/5 shadow-orange-500/20'
                  : 'border-border/50 bg-card/80 backdrop-blur-sm'
              }`}>
                <AnimatePresence>
                  {feedback && (
                    <motion.div
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0, opacity: 0 }}
                      className={`absolute -top-6 -right-6 p-3 rounded-full ${
                        feedback === 'correct' ? 'bg-success' : feedback === 'timeout' ? 'bg-orange-500' : 'bg-destructive'
                      }`}
                    >
                      {feedback === 'correct' ? (
                        <Check size={32} weight="bold" className="text-white" />
                      ) : feedback === 'timeout' ? (
                        <span className="text-white text-2xl font-bold">⏱</span>
                      ) : (
                        <XCircle size={32} weight="bold" className="text-white" />
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
                <div
                  className="text-8xl font-black text-center tracking-tight select-none"
                  style={{ color: COLOR_VALUES[stimulus.color] }}
                >
                  {stimulus.word}
                </div>
              </Card>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </div>

      <div className="p-6 border-t border-border/50 backdrop-blur-sm bg-card/50">
        <div className="max-w-2xl mx-auto">
          <p className="text-center text-sm text-muted-foreground mb-4">
            Press the key for the <strong>ink color</strong>, not the word
          </p>
          <div className="grid grid-cols-4 gap-3">
            {Object.entries(COLOR_KEYS).map(([key, color]) => (
              <motion.div
                key={key}
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.95 }}
                className="text-center"
              >
                <div className="p-4 bg-gradient-to-br from-card to-muted/50 rounded-lg border border-border/50 shadow-sm">
                  <kbd className="block text-2xl font-mono font-bold mb-2" style={{ color: COLOR_VALUES[color] }}>
                    {key.toUpperCase()}
                  </kbd>
                  <span className="text-xs text-muted-foreground font-medium">{color}</span>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
