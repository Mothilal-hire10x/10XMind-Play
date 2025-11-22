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

const TOTAL_TRIALS = 20

export function StroopTask({ onComplete, onExit }: StroopTaskProps) {
  const [currentTrial, setCurrentTrial] = useState(0)
  const [stimulus, setStimulus] = useState<{ word: ColorType; color: ColorType } | null>(null)
  const [startTime, setStartTime] = useState(0)
  const [results, setResults] = useState<TrialResult[]>([])
  const [feedback, setFeedback] = useState<'correct' | 'incorrect' | null>(null)
  const [showFixation, setShowFixation] = useState(true)
  const [streak, setStreak] = useState(0)

  const generateStimulus = useCallback((): { word: ColorType; color: ColorType } => {
    const word = COLORS[Math.floor(Math.random() * COLORS.length)]
    const color = COLORS[Math.floor(Math.random() * COLORS.length)]
    return { word, color }
  }, [])

  const startNextTrial = useCallback(() => {
    if (currentTrial >= TOTAL_TRIALS) {
      const totalCorrect = results.filter(r => r.correct).length
      const avgRT = results.reduce((sum, r) => sum + r.reactionTime, 0) / results.length
      
      // Calculate Stroop Interference Effect
      const congruentTrials = results.filter(r => r.trialType === 'congruent')
      const incongruentTrials = results.filter(r => r.trialType === 'incongruent')
      
      const congruentRT = congruentTrials.length > 0 
        ? congruentTrials.reduce((sum, r) => sum + r.reactionTime, 0) / congruentTrials.length 
        : 0
      const incongruentRT = incongruentTrials.length > 0 
        ? incongruentTrials.reduce((sum, r) => sum + r.reactionTime, 0) / incongruentTrials.length 
        : 0
      
      const stroopInterference = incongruentRT - congruentRT
      const errorRate = ((TOTAL_TRIALS - totalCorrect) / TOTAL_TRIALS) * 100
      
      onComplete(results, {
        score: totalCorrect,
        accuracy: (totalCorrect / TOTAL_TRIALS) * 100,
        reactionTime: avgRT,
        details: {
          congruentRT,
          incongruentRT,
          stroopInterference,
          errorRate,
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
      setStimulus(generateStimulus())
      setStartTime(performance.now())
    }, 500)
  }, [currentTrial, results, generateStimulus, onComplete])

  useEffect(() => {
    startNextTrial()
  }, [])

  const handleKeyPress = useCallback((event: KeyboardEvent) => {
    if (!stimulus || showFixation || feedback) return

    const key = event.key.toLowerCase()
    if (!(key in COLOR_KEYS)) return

    const reactionTime = performance.now() - startTime
    const response = COLOR_KEYS[key]
    const correct = response === stimulus.color

    const trialResult: TrialResult = {
      stimulus: `${stimulus.word} (${stimulus.color})`,
      response,
      correct,
      reactionTime,
      trialType: stimulus.word === stimulus.color ? 'congruent' : 'incongruent'
    }

    setResults(prev => [...prev, trialResult])
    setFeedback(correct ? 'correct' : 'incorrect')
    setStreak(prev => correct ? prev + 1 : 0)
    setCurrentTrial(prev => prev + 1)

    setTimeout(() => {
      startNextTrial()
    }, 400)
  }, [stimulus, showFixation, feedback, startTime, startNextTrial])

  useEffect(() => {
    window.addEventListener('keydown', handleKeyPress)
    return () => window.removeEventListener('keydown', handleKeyPress)
  }, [handleKeyPress])

  const stats = useMemo(() => {
    const correct = results.filter(r => r.correct).length
    const total = results.length
    return {
      accuracy: total > 0 ? Math.round((correct / total) * 100) : 0,
      avgRT: total > 0 ? Math.round(results.reduce((sum, r) => sum + r.reactionTime, 0) / total) : 0
    }
  }, [results])

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 flex flex-col">
      <div className="p-6 border-b border-border/50 backdrop-blur-sm bg-card/50 flex items-center justify-between">
        <div className="flex-1 space-y-3">
          <div className="flex items-center gap-4">
            <Progress value={(currentTrial / TOTAL_TRIALS) * 100} className="h-2 flex-1" />
            <span className="text-sm font-medium text-muted-foreground min-w-20 text-right">
              {currentTrial}/{TOTAL_TRIALS}
            </span>
          </div>
          <div className="flex gap-3">
            <Badge variant="outline" className="gap-2">
              <span className="text-xs text-muted-foreground">Accuracy</span>
              <span className="font-bold">{stats.accuracy}%</span>
            </Badge>
            <Badge variant="outline" className="gap-2">
              <span className="text-xs text-muted-foreground">Avg RT</span>
              <span className="font-bold">{stats.avgRT}ms</span>
            </Badge>
            {streak >= 3 && (
              <Badge className="gap-1 bg-gradient-to-r from-primary to-accent animate-pulse">
                🔥 {streak} streak
              </Badge>
            )}
          </div>
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
                  : 'border-border/50 bg-card/80 backdrop-blur-sm'
              }`}>
                <AnimatePresence>
                  {feedback && (
                    <motion.div
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0, opacity: 0 }}
                      className={`absolute -top-6 -right-6 p-3 rounded-full ${
                        feedback === 'correct' ? 'bg-success' : 'bg-destructive'
                      }`}
                    >
                      {feedback === 'correct' ? (
                        <Check size={32} weight="bold" className="text-white" />
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
