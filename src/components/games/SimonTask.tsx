import { useState, useEffect, useCallback, useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { X, Check, XCircle, ArrowLeft, ArrowRight } from '@phosphor-icons/react'
import { TrialResult } from '@/lib/types'
import { motion, AnimatePresence } from 'framer-motion'

interface SimonTaskProps {
  onComplete: (results: TrialResult[], summary: { score: number; accuracy: number; reactionTime: number }) => void
  onExit: () => void
}

const TOTAL_TRIALS = 20
const WORDS = ['LEFT', 'RIGHT'] as const

export function SimonTask({ onComplete, onExit }: SimonTaskProps) {
  const [currentTrial, setCurrentTrial] = useState(0)
  const [word, setWord] = useState<typeof WORDS[number] | null>(null)
  const [position, setPosition] = useState<'left' | 'right'>('left')
  const [startTime, setStartTime] = useState(0)
  const [results, setResults] = useState<TrialResult[]>([])
  const [feedback, setFeedback] = useState<'correct' | 'incorrect' | null>(null)
  const [showFixation, setShowFixation] = useState(true)
  const [streak, setStreak] = useState(0)

  const generateStimulus = useCallback(() => {
    const selectedWord = WORDS[Math.floor(Math.random() * 2)]
    const selectedPosition: 'left' | 'right' = Math.random() < 0.5 ? 'left' : 'right'
    return { word: selectedWord, position: selectedPosition }
  }, [])

  const startNextTrial = useCallback(() => {
    if (currentTrial >= TOTAL_TRIALS) {
      const totalCorrect = results.filter(r => r.correct).length
      const avgRT = results.reduce((sum, r) => sum + r.reactionTime, 0) / results.length
      
      onComplete(results, {
        score: totalCorrect,
        accuracy: (totalCorrect / TOTAL_TRIALS) * 100,
        reactionTime: avgRT
      })
      return
    }

    setShowFixation(true)
    setFeedback(null)
    setTimeout(() => {
      setShowFixation(false)
      const trial = generateStimulus()
      setWord(trial.word)
      setPosition(trial.position)
      setStartTime(performance.now())
    }, 500)
  }, [currentTrial, results, generateStimulus, onComplete])

  useEffect(() => {
    startNextTrial()
  }, [])

  const handleKeyPress = useCallback((event: KeyboardEvent) => {
    if (!word || showFixation || feedback) return

    const key = event.key.toLowerCase()
    if (key !== 'a' && key !== 'l') return

    const reactionTime = performance.now() - startTime
    const expectedKey = word === 'LEFT' ? 'a' : 'l'
    const correct = key === expectedKey

    const trialResult: TrialResult = {
      stimulus: `${word} at ${position}`,
      response: key.toUpperCase(),
      correct,
      reactionTime,
      trialType: (word === 'LEFT' && position === 'left') || (word === 'RIGHT' && position === 'right') ? 'compatible' : 'incompatible'
    }

    setResults(prev => [...prev, trialResult])
    setFeedback(correct ? 'correct' : 'incorrect')
    setStreak(prev => correct ? prev + 1 : 0)
    setCurrentTrial(prev => prev + 1)

    setTimeout(() => {
      startNextTrial()
    }, 400)
  }, [word, position, showFixation, feedback, startTime, startNextTrial])

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
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-secondary/10 flex flex-col">
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
              <Badge className="gap-1 bg-gradient-to-r from-secondary to-primary animate-pulse">
                🔥 {streak} streak
              </Badge>
            )}
          </div>
        </div>
        <Button variant="ghost" size="icon" onClick={onExit} className="ml-4">
          <X size={24} />
        </Button>
      </div>

      <div className="flex-1 flex items-center justify-center relative overflow-hidden px-8">
        <div className="w-full max-w-6xl relative h-64">
          <AnimatePresence mode="wait">
            {showFixation ? (
              <motion.div
                key="fixation"
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0, opacity: 0 }}
                className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-6xl font-bold text-muted-foreground"
              >
                +
              </motion.div>
            ) : word ? (
              <motion.div
                key={`stimulus-${currentTrial}`}
                initial={{ 
                  scale: 0.5, 
                  opacity: 0,
                  x: position === 'left' ? '-100%' : '100%'
                }}
                animate={{ 
                  scale: 1, 
                  opacity: 1,
                  x: 0
                }}
                exit={{ 
                  scale: 0.5, 
                  opacity: 0,
                  x: position === 'left' ? '-100%' : '100%'
                }}
                transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                className={`absolute top-1/2 -translate-y-1/2 ${
                  position === 'left' ? 'left-0' : 'right-0'
                }`}
              >
                <Card className={`relative p-12 border-2 shadow-2xl transition-all duration-200 ${
                  feedback === 'correct' 
                    ? 'border-success bg-success/5 shadow-success/20' 
                    : feedback === 'incorrect'
                    ? 'border-destructive bg-destructive/5 shadow-destructive/20'
                    : 'border-border/50 bg-card/80 backdrop-blur-sm'
                }`}>
                  <AnimatePresence>
                    {feedback && (
                      <motion.div
                        initial={{ scale: 0, opacity: 0, rotate: -180 }}
                        animate={{ scale: 1, opacity: 1, rotate: 0 }}
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
                  <div className="flex items-center gap-4">
                    {word === 'LEFT' && <ArrowLeft size={48} weight="bold" className="text-primary" />}
                    <div className="text-7xl font-black text-center text-foreground select-none min-w-[200px]">
                      {word}
                    </div>
                    {word === 'RIGHT' && <ArrowRight size={48} weight="bold" className="text-primary" />}
                  </div>
                </Card>
              </motion.div>
            ) : null}
          </AnimatePresence>
        </div>
      </div>

      <div className="p-6 border-t border-border/50 backdrop-blur-sm bg-card/50">
        <div className="max-w-md mx-auto">
          <p className="text-center text-sm text-muted-foreground mb-4">
            Press the key for the <strong>word meaning</strong>, not its screen position
          </p>
          <div className="grid grid-cols-2 gap-6">
            <motion.div
              whileHover={{ scale: 1.05, y: -2 }}
              whileTap={{ scale: 0.95 }}
              className="text-center"
            >
              <div className="p-6 bg-gradient-to-br from-card to-muted/50 rounded-lg border border-border/50 shadow-sm">
                <div className="flex items-center justify-center gap-2 mb-3">
                  <ArrowLeft size={32} className="text-primary" weight="bold" />
                  <kbd className="text-3xl font-mono font-bold">A</kbd>
                </div>
                <div className="text-sm text-muted-foreground font-medium">LEFT</div>
              </div>
            </motion.div>
            <motion.div
              whileHover={{ scale: 1.05, y: -2 }}
              whileTap={{ scale: 0.95 }}
              className="text-center"
            >
              <div className="p-6 bg-gradient-to-br from-card to-muted/50 rounded-lg border border-border/50 shadow-sm">
                <div className="flex items-center justify-center gap-2 mb-3">
                  <kbd className="text-3xl font-mono font-bold">L</kbd>
                  <ArrowRight size={32} className="text-primary" weight="bold" />
                </div>
                <div className="text-sm text-muted-foreground font-medium">RIGHT</div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  )
}
