import { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { X, Eye, Hand } from '@phosphor-icons/react'
import { TrialResult } from '@/lib/types'
import { motion, AnimatePresence } from 'framer-motion'

interface CorsiBlockTaskProps {
  onComplete: (results: TrialResult[], summary: { score: number; accuracy: number; reactionTime: number }) => void
  onExit: () => void
}

const GRID_SIZE = 9

export function CorsiBlockTask({ onComplete, onExit }: CorsiBlockTaskProps) {
  const [span, setSpan] = useState(2)
  const [sequence, setSequence] = useState<number[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [phase, setPhase] = useState<'showing' | 'recall'>('showing')
  const [userSequence, setUserSequence] = useState<number[]>([])
  const [highlighted, setHighlighted] = useState<number | null>(null)
  const [results, setResults] = useState<TrialResult[]>([])
  const [consecutiveFailures, setConsecutiveFailures] = useState(0)
  const [startTime, setStartTime] = useState(0)
  const [feedback, setFeedback] = useState<'correct' | 'incorrect' | null>(null)

  const generateSequence = useCallback((length: number) => {
    const seq: number[] = []
    while (seq.length < length) {
      const num = Math.floor(Math.random() * GRID_SIZE)
      if (!seq.includes(num)) {
        seq.push(num)
      }
    }
    return seq
  }, [])

  const startTrial = useCallback(() => {
    const newSequence = generateSequence(span)
    setSequence(newSequence)
    setCurrentIndex(0)
    setPhase('showing')
    setUserSequence([])
    setHighlighted(null)
    setFeedback(null)
    setStartTime(performance.now())
  }, [span, generateSequence])

  useEffect(() => {
    startTrial()
  }, [])

  useEffect(() => {
    if (phase === 'showing' && currentIndex < sequence.length) {
      setHighlighted(sequence[currentIndex])
      const timer = setTimeout(() => {
        setHighlighted(null)
        setTimeout(() => {
          setCurrentIndex(prev => prev + 1)
        }, 300)
      }, 700)
      return () => clearTimeout(timer)
    } else if (phase === 'showing' && currentIndex === sequence.length) {
      setTimeout(() => {
        setPhase('recall')
      }, 500)
    }
  }, [phase, currentIndex, sequence])

  const handleBlockClick = (index: number) => {
    if (phase !== 'recall' || feedback !== null) return
    
    const newUserSequence = [...userSequence, index]
    setUserSequence(newUserSequence)
    setHighlighted(index)
    setTimeout(() => setHighlighted(null), 300)

    if (newUserSequence.length === sequence.length) {
      const reactionTime = performance.now() - startTime
      const correct = JSON.stringify(newUserSequence) === JSON.stringify(sequence)
      
      const trialResult: TrialResult = {
        stimulus: sequence.join(','),
        response: newUserSequence.join(','),
        correct,
        reactionTime
      }

      setResults(prev => [...prev, trialResult])
      setFeedback(correct ? 'correct' : 'incorrect')

      if (correct) {
        setConsecutiveFailures(0)
        if (results.filter(r => r.stimulus.split(',').length === span).filter(r => r.correct).length >= 1) {
          setTimeout(() => {
            setSpan(prev => prev + 1)
            setTimeout(() => startTrial(), 300)
          }, 1200)
        } else {
          setTimeout(() => startTrial(), 1200)
        }
      } else {
        const newFailures = consecutiveFailures + 1
        setConsecutiveFailures(newFailures)
        
        if (newFailures >= 2) {
          setTimeout(() => {
            const maxSpan = Math.max(...results.filter(r => r.correct).map(r => r.stimulus.split(',').length), span - 1)
            const totalCorrect = results.filter(r => r.correct).length
            const avgRT = results.reduce((sum, r) => sum + r.reactionTime, 0) / results.length
            
            onComplete(results, {
              score: maxSpan,
              accuracy: (totalCorrect / results.length) * 100,
              reactionTime: avgRT
            })
          }, 1200)
        } else {
          setTimeout(() => startTrial(), 1200)
        }
      }
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-accent/5 flex flex-col">
      <div className="p-6 border-b border-border/50 backdrop-blur-sm bg-card/50 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Badge variant="outline" className="gap-2 px-4 py-2">
            <div className="flex flex-col items-start">
              <span className="text-xs text-muted-foreground">Current Span</span>
              <span className="text-2xl font-bold text-foreground">{span}</span>
            </div>
          </Badge>
          <Badge variant="outline" className="gap-2 px-4 py-2">
            <div className="flex items-center gap-2">
              {phase === 'showing' ? (
                <>
                  <Eye size={20} weight="fill" className="text-primary" />
                  <span className="text-sm font-semibold text-primary">Watch</span>
                </>
              ) : (
                <>
                  <Hand size={20} weight="fill" className="text-accent" />
                  <span className="text-sm font-semibold text-accent">Recall</span>
                </>
              )}
            </div>
          </Badge>
          <Badge variant="outline" className="gap-2 px-4 py-2">
            <div className="flex flex-col items-start">
              <span className="text-xs text-muted-foreground">Trials</span>
              <span className="text-xl font-bold text-foreground">{results.length}</span>
            </div>
          </Badge>
        </div>
        <Button variant="ghost" size="icon" onClick={onExit}>
          <X size={24} />
        </Button>
      </div>

      <div className="flex-1 flex items-center justify-center p-8">
        <div className="relative">
          <div className="grid grid-cols-3 gap-8 max-w-2xl">
            {Array.from({ length: GRID_SIZE }).map((_, index) => {
              const isHighlighted = highlighted === index
              const isInUserSequence = userSequence.includes(index)
              const wasCorrect = feedback === 'correct' && sequence.includes(index)
              const wasIncorrect = feedback === 'incorrect' && isInUserSequence && !sequence.includes(index)
              
              return (
                <motion.button
                  key={index}
                  onClick={() => handleBlockClick(index)}
                  disabled={phase === 'showing' || feedback !== null}
                  whileHover={phase === 'recall' && feedback === null ? { scale: 1.1 } : {}}
                  whileTap={phase === 'recall' && feedback === null ? { scale: 0.95 } : {}}
                  className={`aspect-square rounded-2xl border-4 transition-all duration-300 shadow-lg ${
                    isHighlighted
                      ? 'bg-gradient-to-br from-primary to-accent border-primary scale-95 shadow-primary/50'
                      : wasCorrect
                      ? 'bg-gradient-to-br from-success/20 to-success/10 border-success'
                      : wasIncorrect
                      ? 'bg-gradient-to-br from-destructive/20 to-destructive/10 border-destructive'
                      : isInUserSequence
                      ? 'bg-gradient-to-br from-primary/10 to-primary/5 border-primary/50'
                      : 'bg-gradient-to-br from-card to-muted/30 border-border hover:border-primary/50'
                  } ${phase === 'recall' && feedback === null ? 'cursor-pointer' : 'cursor-default'}`}
                >
                  <AnimatePresence>
                    {isHighlighted && (
                      <motion.div
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0, opacity: 0 }}
                        className="w-full h-full flex items-center justify-center"
                      >
                        <div className="w-12 h-12 rounded-full bg-white/80" />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.button>
              )
            })}
          </div>
          
          {phase === 'showing' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="absolute -bottom-16 left-1/2 -translate-x-1/2 flex gap-2"
            >
              {sequence.map((_, i) => (
                <motion.div
                  key={i}
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: i * 0.1 }}
                  className={`w-4 h-4 rounded-full ${
                    i === currentIndex ? 'bg-primary scale-125' : i < currentIndex ? 'bg-success' : 'bg-muted'
                  }`}
                />
              ))}
            </motion.div>
          )}
        </div>
      </div>

      {phase === 'recall' && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="p-6 border-t border-border/50 backdrop-blur-sm bg-card/50"
        >
          <div className="text-center space-y-3">
            <div className="flex justify-center gap-2 mb-2">
              {Array.from({ length: sequence.length }).map((_, i) => (
                <div
                  key={i}
                  className={`w-5 h-5 rounded-full transition-all ${
                    i < userSequence.length ? 'bg-primary scale-110' : 'bg-muted'
                  }`}
                />
              ))}
            </div>
            <p className="text-sm text-muted-foreground">
              Click the blocks in the <strong>same order</strong> ({userSequence.length}/{sequence.length})
            </p>
            {feedback && (
              <motion.div
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className={`text-lg font-semibold ${
                  feedback === 'correct' ? 'text-success' : 'text-destructive'
                }`}
              >
                {feedback === 'correct' ? '✓ Correct!' : '✗ Incorrect'}
              </motion.div>
            )}
          </div>
        </motion.div>
      )}
    </div>
  )
}
