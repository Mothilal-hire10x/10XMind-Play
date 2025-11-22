import { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { X, ArrowRight, Brain } from '@phosphor-icons/react'
import { TrialResult, GameSummary } from '@/lib/types'
import { motion, AnimatePresence } from 'framer-motion'

interface DigitSpanTaskProps {
  onComplete: (results: TrialResult[], summary: GameSummary) => void
  onExit: () => void
}

export function DigitSpanTask({ onComplete, onExit }: DigitSpanTaskProps) {
  const [mode, setMode] = useState<'forward' | 'backward'>('forward')
  const [span, setSpan] = useState(3)
  const [sequence, setSequence] = useState<number[]>([])
  const [currentDigitIndex, setCurrentDigitIndex] = useState(0)
  const [phase, setPhase] = useState<'showing' | 'recall'>('showing')
  const [userInput, setUserInput] = useState('')
  const [results, setResults] = useState<TrialResult[]>([])
  const [consecutiveFailures, setConsecutiveFailures] = useState(0)
  const [startTime, setStartTime] = useState(0)
  const [feedback, setFeedback] = useState<'correct' | 'incorrect' | null>(null)
  const [forwardMaxSpan, setForwardMaxSpan] = useState(0)
  const [backwardMaxSpan, setBackwardMaxSpan] = useState(0)
  const [totalCorrect, setTotalCorrect] = useState(0)

  const generateSequence = useCallback((length: number) => {
    return Array.from({ length }, () => Math.floor(Math.random() * 10))
  }, [])

  const startTrial = useCallback(() => {
    const newSequence = generateSequence(span)
    setSequence(newSequence)
    setCurrentDigitIndex(0)
    setPhase('showing')
    setUserInput('')
    setFeedback(null)
    setStartTime(performance.now())
  }, [span, generateSequence])

  useEffect(() => {
    startTrial()
  }, [])

  useEffect(() => {
    if (phase === 'showing' && currentDigitIndex < sequence.length) {
      const timer = setTimeout(() => {
        setCurrentDigitIndex(prev => prev + 1)
      }, 1000)
      return () => clearTimeout(timer)
    } else if (phase === 'showing' && currentDigitIndex === sequence.length) {
      setTimeout(() => {
        setPhase('recall')
      }, 500)
    }
  }, [phase, currentDigitIndex, sequence.length])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    const reactionTime = performance.now() - startTime
    const expectedAnswer = mode === 'forward' 
      ? sequence.join('') 
      : sequence.slice().reverse().join('')
    const correct = userInput === expectedAnswer
    
    const trialResult: TrialResult = {
      stimulus: sequence.join(''),
      response: userInput,
      correct,
      reactionTime,
      trialType: mode
    }

    setResults(prev => [...prev, trialResult])
    setFeedback(correct ? 'correct' : 'incorrect')

    if (correct) {
      setTotalCorrect(prev => prev + 1)
      setConsecutiveFailures(0)
      
      // Update max span for current mode
      if (mode === 'forward' && span > forwardMaxSpan) {
        setForwardMaxSpan(span)
      } else if (mode === 'backward' && span > backwardMaxSpan) {
        setBackwardMaxSpan(span)
      }
      
      setTimeout(() => {
        setSpan(prev => prev + 1)
        setTimeout(() => startTrial(), 300)
      }, 1200)
    } else {
      const newFailures = consecutiveFailures + 1
      setConsecutiveFailures(newFailures)
      
      if (newFailures >= 2) {
        // If in forward mode and failed, switch to backward
        if (mode === 'forward') {
          setTimeout(() => {
            setMode('backward')
            setSpan(3) // Reset span for backward mode
            setConsecutiveFailures(0)
            setTimeout(() => startTrial(), 500)
          }, 1200)
        } else {
          // End test after backward mode fails
          setTimeout(() => {
            const avgRT = results.reduce((sum, r) => sum + r.reactionTime, 0) / results.length
            
            onComplete(results, {
              score: Math.max(forwardMaxSpan, backwardMaxSpan),
              accuracy: (totalCorrect / (results.length + 1)) * 100,
              reactionTime: avgRT,
              details: {
                forwardSpan: forwardMaxSpan,
                backwardSpan: backwardMaxSpan,
                totalCorrectSequences: totalCorrect
              }
            })
          }, 1200)
        }
      } else {
        setTimeout(() => startTrial(), 1200)
      }
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 flex flex-col">
      <div className="p-6 border-b border-border/50 backdrop-blur-sm bg-card/50 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Badge variant="outline" className="gap-2 px-4 py-2">
            <Brain size={20} weight="fill" className="text-primary" />
            <div className="flex flex-col items-start">
              <span className="text-xs text-muted-foreground">Current Span</span>
              <span className="text-2xl font-bold text-foreground">{span}</span>
            </div>
          </Badge>
          <Badge variant="outline" className="gap-2 px-4 py-2">
            <div className="flex flex-col items-start">
              <span className="text-xs text-muted-foreground">Mode</span>
              <span className="text-xl font-bold text-primary">
                {mode === 'forward' ? '➡️ Forward' : '⬅️ Backward'}
              </span>
            </div>
          </Badge>
          <Badge variant="outline" className="gap-2 px-4 py-2">
            <div className="flex flex-col items-start">
              <span className="text-xs text-muted-foreground">Trials</span>
              <span className="text-xl font-bold text-foreground">{results.length}</span>
            </div>
          </Badge>
          <Badge variant="outline" className="gap-2 px-4 py-2">
            <div className="flex flex-col items-start">
              <span className="text-xs text-muted-foreground">Phase</span>
              <span className="text-sm font-semibold text-primary">
                {phase === 'showing' ? '👁️ Watch' : '✍️ Recall'}
              </span>
            </div>
          </Badge>
        </div>
        <Button variant="ghost" size="icon" onClick={onExit}>
          <X size={24} />
        </Button>
      </div>

      <div className="flex-1 flex items-center justify-center p-8">
        <AnimatePresence mode="wait">
          {phase === 'showing' ? (
            <motion.div
              key="showing"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-center"
            >
              {currentDigitIndex < sequence.length ? (
                <motion.div
                  key={`digit-${currentDigitIndex}`}
                  initial={{ scale: 0, rotateY: -180, opacity: 0 }}
                  animate={{ scale: 1, rotateY: 0, opacity: 1 }}
                  exit={{ scale: 0, rotateY: 180, opacity: 0 }}
                  transition={{ type: 'spring', stiffness: 200, damping: 20 }}
                >
                  <Card className="p-20 bg-gradient-to-br from-primary/10 to-accent/10 border-2 border-primary/30 shadow-2xl">
                    <div className="text-9xl font-black bg-gradient-to-br from-primary to-accent bg-clip-text text-transparent">
                      {sequence[currentDigitIndex]}
                    </div>
                  </Card>
                  <div className="mt-6 flex justify-center gap-2">
                    {sequence.map((_, i) => (
                      <motion.div
                        key={i}
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: i * 0.1 }}
                        className={`w-3 h-3 rounded-full ${
                          i === currentDigitIndex ? 'bg-primary' : i < currentDigitIndex ? 'bg-success' : 'bg-muted'
                        }`}
                      />
                    ))}
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="text-6xl font-bold text-muted-foreground"
                >
                  <div className="flex gap-2">
                    <motion.span animate={{ opacity: [0, 1, 0] }} transition={{ repeat: Infinity, duration: 1.5, delay: 0 }}>.</motion.span>
                    <motion.span animate={{ opacity: [0, 1, 0] }} transition={{ repeat: Infinity, duration: 1.5, delay: 0.5 }}>.</motion.span>
                    <motion.span animate={{ opacity: [0, 1, 0] }} transition={{ repeat: Infinity, duration: 1.5, delay: 1 }}>.</motion.span>
                  </div>
                </motion.div>
              )}
            </motion.div>
          ) : (
            <motion.div
              key="recall"
              initial={{ scale: 0.8, opacity: 0, y: 50 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.8, opacity: 0, y: -50 }}
              transition={{ type: 'spring', stiffness: 300, damping: 25 }}
              className="w-full max-w-md"
            >
              <Card className={`p-8 border-2 shadow-2xl transition-all duration-300 ${
                feedback === 'correct'
                  ? 'border-success bg-success/5'
                  : feedback === 'incorrect'
                  ? 'border-destructive bg-destructive/5'
                  : 'border-primary/30 bg-card'
              }`}>
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="text-center space-y-2">
                    <h3 className="text-2xl font-bold text-foreground">
                      {mode === 'forward' ? 'Enter the sequence in order' : 'Enter the sequence in reverse'}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      Type the {span} digits {mode === 'forward' ? 'in the same order' : 'in reverse order'}
                    </p>
                  </div>
                  <div className="relative">
                    <Input
                      type="text"
                      value={userInput}
                      onChange={(e) => setUserInput(e.target.value.replace(/\D/g, '').slice(0, span))}
                      placeholder="Type digits..."
                      className="text-center text-4xl tracking-[0.5em] h-20 font-mono font-bold border-2"
                      autoFocus
                      maxLength={span}
                      disabled={feedback !== null}
                    />
                    <div className="mt-2 flex justify-center gap-2">
                      {Array.from({ length: span }).map((_, i) => (
                        <div
                          key={i}
                          className={`w-4 h-4 rounded-full transition-all ${
                            i < userInput.length ? 'bg-primary scale-110' : 'bg-muted'
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                  <Button 
                    type="submit" 
                    size="lg" 
                    className="w-full text-lg gap-2"
                    disabled={userInput.length !== span || feedback !== null}
                  >
                    Submit <ArrowRight size={20} weight="bold" />
                  </Button>
                  {feedback && (
                    <motion.div
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      className={`text-center text-lg font-semibold ${
                        feedback === 'correct' ? 'text-success' : 'text-destructive'
                      }`}
                    >
                      {feedback === 'correct' ? '✓ Correct!' : '✗ Incorrect'}
                    </motion.div>
                  )}
                </form>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
