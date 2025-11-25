import { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { X, ArrowRight, Brain } from '@phosphor-icons/react'
import { TrialResult, GameSummary } from '@/lib/types'
import { motion, AnimatePresence } from 'framer-motion'

interface DigitSpanTaskProps {
  onComplete: (results: TrialResult[], summary: GameSummary) => void
  onExit: () => void
}

// PsyToolkit standards for Digit Span
const INITIAL_SPAN = 2 // Start at 2 digits
const MAX_SPAN = 9 // Maximum 9 digits
const DIGIT_DISPLAY_DURATION = 1000 // 1000ms per digit (PsyToolkit standard)
const CONSECUTIVE_CORRECT_TO_ADVANCE = 2 // Need 2 correct at same span to advance
const CONSECUTIVE_FAILURES_TO_END = 2 // Stop after 2 consecutive failures

export function DigitSpanTask({ onComplete, onExit }: DigitSpanTaskProps) {
  // Instruction and practice state
  const [gamePhase, setGamePhase] = useState<'instructions' | 'practice' | 'test'>('instructions')
  const [instructionPage, setInstructionPage] = useState(1)
  const [practiceComplete, setPracticeComplete] = useState(false)
  
  // Game state
  const [mode, setMode] = useState<'forward' | 'backward'>('forward')
  const [span, setSpan] = useState(INITIAL_SPAN)
  const [sequence, setSequence] = useState<number[]>([])
  const [currentDigitIndex, setCurrentDigitIndex] = useState(0)
  const [phase, setPhase] = useState<'showing' | 'recall'>('showing')
  const [userSequence, setUserSequence] = useState<number[]>([])
  const [results, setResults] = useState<TrialResult[]>([])
  const [consecutiveFailures, setConsecutiveFailures] = useState(0)
  const [consecutiveCorrectAtSpan, setConsecutiveCorrectAtSpan] = useState(0)
  const [startTime, setStartTime] = useState(0)
  const [feedback, setFeedback] = useState<'correct' | 'incorrect' | null>(null)
  const [forwardMaxSpan, setForwardMaxSpan] = useState(0)
  const [backwardMaxSpan, setBackwardMaxSpan] = useState(0)
  const [totalCorrect, setTotalCorrect] = useState(0)
  const [practiceTrialsDone, setPracticeTrialsDone] = useState(0)

  const generateSequence = useCallback((length: number) => {
    return Array.from({ length }, () => Math.floor(Math.random() * 10))
  }, [])

  const startTrial = useCallback(() => {
    const newSequence = generateSequence(span)
    setSequence(newSequence)
    setCurrentDigitIndex(0)
    setPhase('showing')
    setUserSequence([]) // Clear user sequence
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
      }, DIGIT_DISPLAY_DURATION) // PsyToolkit standard: 1000ms per digit
      return () => clearTimeout(timer)
    } else if (phase === 'showing' && currentDigitIndex === sequence.length) {
      setTimeout(() => {
        setPhase('recall')
      }, 500)
    }
  }, [phase, currentDigitIndex, sequence.length])

  // Handle digit button click (PsyToolkit standard: mouse-only input)
  const handleDigitClick = useCallback((digit: number) => {
    if (feedback !== null || userSequence.length >= span) return
    setUserSequence(prev => [...prev, digit])
  }, [feedback, userSequence.length, span])

  // Handle backspace
  const handleBackspace = useCallback(() => {
    if (feedback !== null || userSequence.length === 0) return
    setUserSequence(prev => prev.slice(0, -1))
  }, [feedback, userSequence.length])

  // Handle submit
  const handleSubmit = useCallback(() => {
    if (userSequence.length !== span || feedback !== null) return
    
    const reactionTime = performance.now() - startTime
    const expectedAnswer = mode === 'forward' 
      ? sequence 
      : sequence.slice().reverse()
    const correct = JSON.stringify(userSequence) === JSON.stringify(expectedAnswer)
    
    const trialResult: TrialResult = {
      stimulus: sequence.join(''),
      response: userSequence.join(''),
      correct,
      reactionTime,
      trialType: mode
    }

    setResults(prev => [...prev, trialResult])
    setFeedback(correct ? 'correct' : 'incorrect')

    if (correct) {
      setTotalCorrect(prev => prev + 1)
      setConsecutiveFailures(0)
      setConsecutiveCorrectAtSpan(prev => prev + 1)
      
      // Update max span for current mode
      if (mode === 'forward' && span > forwardMaxSpan) {
        setForwardMaxSpan(span)
      } else if (mode === 'backward' && span > backwardMaxSpan) {
        setBackwardMaxSpan(span)
      }
      
      // PsyToolkit standard: Advance span after 2 correct trials at same length
      if (consecutiveCorrectAtSpan + 1 >= CONSECUTIVE_CORRECT_TO_ADVANCE && span < MAX_SPAN) {
        setTimeout(() => {
          setSpan(prev => prev + 1)
          setConsecutiveCorrectAtSpan(0)
          setTimeout(() => startTrial(), 300)
        }, 1200)
      } else {
        setTimeout(() => startTrial(), 1200)
      }
    } else {
      const newFailures = consecutiveFailures + 1
      setConsecutiveFailures(newFailures)
      setConsecutiveCorrectAtSpan(0)
      
      // PsyToolkit standard: Stop after 2 consecutive failures
      if (newFailures >= CONSECUTIVE_FAILURES_TO_END) {
        // If in forward mode and failed, switch to backward
        if (mode === 'forward') {
          setTimeout(() => {
            setMode('backward')
            setSpan(INITIAL_SPAN) // Reset span for backward mode
            setConsecutiveFailures(0)
            setConsecutiveCorrectAtSpan(0)
            setTimeout(() => startTrial(), 500)
          }, 1200)
        } else {
          // End test after backward mode fails
          setTimeout(() => {
            const avgRT = results.reduce((sum, r) => sum + r.reactionTime, 0) / results.length
            const errorCount = results.length + 1 - totalCorrect
            const errorRate = (errorCount / (results.length + 1)) * 100
            
            onComplete(results, {
              score: Math.max(forwardMaxSpan, backwardMaxSpan),
              accuracy: (totalCorrect / (results.length + 1)) * 100,
              reactionTime: avgRT,
              errorCount,
              errorRate,
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
  }, [userSequence, span, feedback, startTime, mode, sequence, forwardMaxSpan, backwardMaxSpan, 
      consecutiveFailures, consecutiveCorrectAtSpan, results, totalCorrect, onComplete, startTrial])

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
              <span className="text-xs text-muted-foreground">Correct</span>
              <span className="text-xl font-bold text-success">{totalCorrect}</span>
            </div>
          </Badge>
          <Badge variant="outline" className="gap-2 px-4 py-2">
            <div className="flex flex-col items-start">
              <span className="text-xs text-muted-foreground">Errors</span>
              <span className="text-xl font-bold text-destructive">
                {results.length - totalCorrect} ({results.length > 0 ? Math.round(((results.length - totalCorrect) / results.length) * 100) : 0}%)
              </span>
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
              className="w-full max-w-2xl"
            >
              <Card className={`p-8 border-2 shadow-2xl transition-all duration-300 ${
                feedback === 'correct'
                  ? 'border-success bg-success/5'
                  : feedback === 'incorrect'
                  ? 'border-destructive bg-destructive/5'
                  : 'border-primary/30 bg-card'
              }`}>
                <div className="space-y-6">
                  <div className="text-center space-y-2">
                    <h3 className="text-2xl font-bold text-foreground">
                      {mode === 'forward' ? 'Click digits in order' : 'Click digits in reverse'}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      Click {span} digits {mode === 'forward' ? 'in the same order' : 'in reverse order'}
                    </p>
                  </div>
                  
                  {/* Display entered sequence */}
                  <div className="bg-muted/50 rounded-lg p-6 min-h-[100px] flex items-center justify-center">
                    <div className="flex gap-3 flex-wrap justify-center">
                      {userSequence.length === 0 ? (
                        <span className="text-muted-foreground text-lg">Click digits below...</span>
                      ) : (
                        userSequence.map((digit, i) => (
                          <motion.div
                            key={i}
                            initial={{ scale: 0, rotateY: -180 }}
                            animate={{ scale: 1, rotateY: 0 }}
                            className="w-16 h-16 rounded-lg bg-primary text-primary-foreground flex items-center justify-center text-3xl font-bold shadow-lg"
                          >
                            {digit}
                          </motion.div>
                        ))
                      )}
                    </div>
                  </div>

                  {/* Progress indicator */}
                  <div className="flex justify-center gap-2">
                    {Array.from({ length: span }).map((_, i) => (
                      <div
                        key={i}
                        className={`w-3 h-3 rounded-full transition-all ${
                          i < userSequence.length ? 'bg-primary scale-125' : 'bg-muted'
                        }`}
                      />
                    ))}
                  </div>

                  {/* Digit pad (PsyToolkit standard: mouse-only input) */}
                  <div className="grid grid-cols-5 gap-3">
                    {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((digit) => (
                      <Button
                        key={digit}
                        type="button"
                        size="lg"
                        variant="outline"
                        onClick={() => handleDigitClick(digit)}
                        disabled={feedback !== null || userSequence.length >= span}
                        className="h-16 text-3xl font-bold hover:bg-primary hover:text-primary-foreground transition-all"
                      >
                        {digit}
                      </Button>
                    ))}
                  </div>

                  {/* Action buttons */}
                  <div className="grid grid-cols-2 gap-3">
                    <Button
                      type="button"
                      size="lg"
                      variant="outline"
                      onClick={handleBackspace}
                      disabled={feedback !== null || userSequence.length === 0}
                      className="text-lg gap-2"
                    >
                      ← Backspace
                    </Button>
                    <Button 
                      type="button"
                      size="lg"
                      onClick={handleSubmit}
                      disabled={userSequence.length !== span || feedback !== null}
                      className="text-lg gap-2"
                    >
                      Submit <ArrowRight size={20} weight="bold" />
                    </Button>
                  </div>

                  {feedback && (
                    <motion.div
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      className={`text-center text-lg font-semibold ${
                        feedback === 'correct' ? 'text-success' : 'text-destructive'
                      }`}
                    >
                      {feedback === 'correct' ? '✓ Correct!' : '✗ Incorrect'}
                      {feedback === 'incorrect' && (
                        <div className="text-sm text-muted-foreground mt-1">
                          Expected: {mode === 'forward' ? sequence.join(' ') : sequence.slice().reverse().join(' ')}
                        </div>
                      )}
                    </motion.div>
                  )}
                </div>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
