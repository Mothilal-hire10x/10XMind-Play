import { useState, useEffect, useCallback, useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { X, Target, CheckCircle, XCircle, Eye } from '@phosphor-icons/react'
import { TrialResult } from '@/lib/types'
import { motion, AnimatePresence } from 'framer-motion'

interface NBackTaskProps {
  onComplete: (results: TrialResult[], summary: { score: number; accuracy: number; reactionTime: number }) => void
  onExit: () => void
}

const TOTAL_TRIALS = 30
const N_BACK = 2
const TARGET_PROBABILITY = 0.33

export function NBackTask({ onComplete, onExit }: NBackTaskProps) {
  const [currentTrial, setCurrentTrial] = useState(0)
  const [sequence, setSequence] = useState<number[]>([])
  const [currentNumber, setCurrentNumber] = useState<number | null>(null)
  const [results, setResults] = useState<TrialResult[]>([])
  const [responded, setResponded] = useState(false)
  const [startTime, setStartTime] = useState(0)
  const [feedback, setFeedback] = useState<'correct' | 'incorrect' | null>(null)
  const [isTarget, setIsTarget] = useState(false)

  const generateSequence = useCallback(() => {
    const seq: number[] = []
    for (let i = 0; i < TOTAL_TRIALS; i++) {
      if (i >= N_BACK && Math.random() < TARGET_PROBABILITY) {
        seq.push(seq[i - N_BACK])
      } else {
        let num
        do {
          num = Math.floor(Math.random() * 9) + 1
        } while (i >= N_BACK && num === seq[i - N_BACK])
        seq.push(num)
      }
    }
    return seq
  }, [])

  useEffect(() => {
    setSequence(generateSequence())
  }, [generateSequence])

  const startNextTrial = useCallback(() => {
    if (currentTrial >= TOTAL_TRIALS) {
      const totalCorrect = results.filter(r => r.correct).length
      const avgRT = results.filter(r => r.response !== null).reduce((sum, r) => sum + r.reactionTime, 0) / results.filter(r => r.response !== null).length
      
      onComplete(results, {
        score: totalCorrect,
        accuracy: (totalCorrect / TOTAL_TRIALS) * 100,
        reactionTime: avgRT || 0
      })
      return
    }

    if (sequence.length === 0) return

    setResponded(false)
    setFeedback(null)
    const targetCheck = currentTrial >= N_BACK && sequence[currentTrial] === sequence[currentTrial - N_BACK]
    setIsTarget(targetCheck)
    setCurrentNumber(sequence[currentTrial])
    setStartTime(performance.now())

    setTimeout(() => {
      const correct = targetCheck ? responded : !responded
      
      setResults(prev => [...prev, {
        stimulus: `${sequence[currentTrial]} (${currentTrial >= N_BACK ? sequence[currentTrial - N_BACK] : 'N/A'})`,
        response: responded ? 'SPACE' : null,
        correct,
        reactionTime: responded ? performance.now() - startTime : 0,
        trialType: targetCheck ? 'target' : 'non-target'
      }])

      setFeedback(correct ? 'correct' : 'incorrect')
      setCurrentNumber(null)
      
      setTimeout(() => {
        setFeedback(null)
        setCurrentTrial(prev => prev + 1)
      }, 500)
    }, 1500)
  }, [currentTrial, sequence, responded, results, startTime, onComplete])

  useEffect(() => {
    if (sequence.length > 0 && currentTrial < TOTAL_TRIALS) {
      startNextTrial()
    }
  }, [currentTrial, sequence.length])

  const handleKeyPress = useCallback((event: KeyboardEvent) => {
    if (event.code === 'Space' && currentNumber !== null && !responded) {
      event.preventDefault()
      setResponded(true)
    }
  }, [currentNumber, responded])

  useEffect(() => {
    window.addEventListener('keydown', handleKeyPress)
    return () => window.removeEventListener('keydown', handleKeyPress)
  }, [handleKeyPress])

  const stats = useMemo(() => {
    const hits = results.filter(r => r.trialType === 'target' && r.response !== null).length
    const misses = results.filter(r => r.trialType === 'target' && r.response === null).length
    const falseAlarms = results.filter(r => r.trialType === 'non-target' && r.response !== null).length
    const correct = results.filter(r => r.correct).length
    const total = results.length
    return {
      hits,
      misses,
      falseAlarms,
      accuracy: total > 0 ? Math.round((correct / total) * 100) : 0
    }
  }, [results])

  const history = useMemo(() => {
    const start = Math.max(0, currentTrial - N_BACK - 1)
    const end = currentTrial
    return sequence.slice(start, end)
  }, [sequence, currentTrial])

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 flex flex-col">
      <div className="p-6 border-b border-border/50 backdrop-blur-sm bg-card/50 flex items-center justify-between">
        <div className="flex items-center gap-4 flex-1">
          <div className="flex-1">
            <Progress value={(currentTrial / TOTAL_TRIALS) * 100} className="h-2 mb-2" />
            <p className="text-sm text-muted-foreground">
              Trial {currentTrial} of {TOTAL_TRIALS}
            </p>
          </div>
          <Badge variant="outline" className="gap-2 px-3 py-2">
            <CheckCircle size={16} weight="fill" className="text-success" />
            <div className="flex flex-col items-start">
              <span className="text-xs text-muted-foreground">Accuracy</span>
              <span className="text-lg font-bold text-foreground">{stats.accuracy}%</span>
            </div>
          </Badge>
          <Badge variant="outline" className="gap-2 px-3 py-2">
            <Target size={16} weight="fill" className="text-success" />
            <div className="flex flex-col items-start">
              <span className="text-xs text-muted-foreground">Hits</span>
              <span className="text-lg font-bold text-success">{stats.hits}</span>
            </div>
          </Badge>
          <Badge variant="outline" className="gap-2 px-3 py-2">
            <XCircle size={16} weight="fill" className="text-destructive" />
            <div className="flex flex-col items-start">
              <span className="text-xs text-muted-foreground">Misses</span>
              <span className="text-lg font-bold text-destructive">{stats.misses}</span>
            </div>
          </Badge>
          <Badge variant="outline" className="gap-2 px-3 py-2">
            <Eye size={16} weight="fill" className="text-destructive" />
            <div className="flex flex-col items-start">
              <span className="text-xs text-muted-foreground">False Alarms</span>
              <span className="text-lg font-bold text-destructive">{stats.falseAlarms}</span>
            </div>
          </Badge>
        </div>
        <Button variant="ghost" size="icon" onClick={onExit} className="ml-4">
          <X size={24} />
        </Button>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center relative overflow-hidden">
        <div className="mb-8 flex gap-2 items-center">
          {history.map((num, idx) => (
            <motion.div
              key={`history-${currentTrial - history.length + idx}`}
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 0.3, scale: 1 }}
              className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center text-muted-foreground font-bold"
            >
              {num}
            </motion.div>
          ))}
          {history.length > 0 && (
            <div className="text-muted-foreground mx-2">→</div>
          )}
        </div>

        <AnimatePresence mode="wait">
          {currentNumber !== null && (
            <motion.div
              key={`number-${currentTrial}`}
              initial={{ scale: 0, rotateY: -180, opacity: 0 }}
              animate={{ scale: 1, rotateY: 0, opacity: 1 }}
              exit={{ scale: 0, rotateY: 180, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 300, damping: 20 }}
              className="relative"
            >
              <div className={`text-[12rem] font-black transition-all duration-300 ${
                feedback === 'correct' ? 'text-success' : 
                feedback === 'incorrect' ? 'text-destructive' : 
                isTarget ? 'text-primary' : 'text-foreground'
              }`}>
                {currentNumber}
              </div>
              {isTarget && !feedback && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute inset-0 flex items-center justify-center"
                >
                  <div className="w-72 h-72 rounded-full border-8 border-primary opacity-20 animate-ping" />
                </motion.div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {feedback && (
            <motion.div
              initial={{ opacity: 0, scale: 0.5, y: 50 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.5, y: -50 }}
              className={`absolute top-20 px-8 py-4 rounded-full font-bold text-lg shadow-lg ${
                feedback === 'correct' 
                  ? 'bg-success text-white' 
                  : 'bg-destructive text-white'
              }`}
            >
              {feedback === 'correct' ? '✓ Correct!' : '✗ Incorrect'}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <motion.div
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="p-6 border-t border-border/50 backdrop-blur-sm bg-card/50"
      >
        <div className="max-w-md mx-auto text-center space-y-4">
          <motion.div
            whileHover={{ scale: 1.05 }}
            className="inline-block"
          >
            <kbd className="px-8 py-4 bg-gradient-to-br from-card to-muted rounded-lg text-3xl font-mono font-bold block shadow-lg border-2 border-border">
              SPACE
            </kbd>
          </motion.div>
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">
              Press <strong>SPACE</strong> when the current number
            </p>
            <p className="text-sm font-bold text-primary">
              matches the one from {N_BACK} steps back
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  )
}
