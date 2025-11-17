import { useState, useEffect, useCallback, useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { X, CheckCircle, XCircle, Warning } from '@phosphor-icons/react'
import { TrialResult } from '@/lib/types'
import { motion, AnimatePresence } from 'framer-motion'

interface SARTProps {
  onComplete: (results: TrialResult[], summary: { score: number; accuracy: number; reactionTime: number }) => void
  onExit: () => void
}

const TOTAL_TRIALS = 90
const NO_GO_DIGIT = 3
const STIMULUS_DURATION = 250
const ISI = 900

export function SART({ onComplete, onExit }: SARTProps) {
  const [currentTrial, setCurrentTrial] = useState(0)
  const [currentDigit, setCurrentDigit] = useState<number | null>(null)
  const [results, setResults] = useState<TrialResult[]>([])
  const [responded, setResponded] = useState(false)
  const [startTime, setStartTime] = useState(0)
  const [feedback, setFeedback] = useState<'correct' | 'incorrect' | null>(null)

  const startNextTrial = useCallback(() => {
    if (currentTrial >= TOTAL_TRIALS) {
      const commissionErrors = results.filter(r => r.trialType === 'no-go' && r.response !== null).length
      const omissionErrors = results.filter(r => r.trialType === 'go' && r.response === null).length
      const totalCorrect = results.filter(r => r.correct).length
      const avgRT = results.filter(r => r.response !== null).reduce((sum, r) => sum + r.reactionTime, 0) / results.filter(r => r.response !== null).length
      
      onComplete(results, {
        score: totalCorrect,
        accuracy: (totalCorrect / TOTAL_TRIALS) * 100,
        reactionTime: avgRT
      })
      return
    }

    setResponded(false)
    setFeedback(null)
    const digit = Math.floor(Math.random() * 9) + 1
    setCurrentDigit(digit)
    setStartTime(performance.now())

    setTimeout(() => {
      setCurrentDigit(null)
      
      setTimeout(() => {
        const isNoGo = digit === NO_GO_DIGIT
        const correct = isNoGo ? !responded : responded
        
        setFeedback(correct ? 'correct' : 'incorrect')
        
        setResults(prev => [...prev, {
          stimulus: digit.toString(),
          response: responded ? 'SPACE' : null,
          correct,
          reactionTime: responded ? performance.now() - startTime : 0,
          trialType: isNoGo ? 'no-go' : 'go'
        }])
        
        setTimeout(() => {
          setCurrentTrial(prev => prev + 1)
          setFeedback(null)
        }, 200)
      }, ISI - STIMULUS_DURATION)
    }, STIMULUS_DURATION)
  }, [currentTrial, responded, results, startTime, onComplete])

  useEffect(() => {
    startNextTrial()
  }, [])

  useEffect(() => {
    if (currentDigit === null && currentTrial < TOTAL_TRIALS && results.length === currentTrial) {
      const timer = setTimeout(() => {
        startNextTrial()
      }, ISI)
      return () => clearTimeout(timer)
    }
  }, [currentDigit, currentTrial, results.length, startNextTrial])

  const handleKeyPress = useCallback((event: KeyboardEvent) => {
    if (event.code === 'Space' && currentDigit !== null && !responded) {
      event.preventDefault()
      setResponded(true)
    }
  }, [currentDigit, responded])

  useEffect(() => {
    window.addEventListener('keydown', handleKeyPress)
    return () => window.removeEventListener('keydown', handleKeyPress)
  }, [handleKeyPress])

  const stats = useMemo(() => {
    const commissionErrors = results.filter(r => r.trialType === 'no-go' && r.response !== null).length
    const omissionErrors = results.filter(r => r.trialType === 'go' && r.response === null).length
    const correct = results.filter(r => r.correct).length
    const total = results.length
    return {
      commissionErrors,
      omissionErrors,
      accuracy: total > 0 ? Math.round((correct / total) * 100) : 0
    }
  }, [results])

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-destructive/5 flex flex-col">
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
            <Warning size={16} weight="fill" className="text-destructive" />
            <div className="flex flex-col items-start">
              <span className="text-xs text-muted-foreground">Commission</span>
              <span className="text-lg font-bold text-destructive">{stats.commissionErrors}</span>
            </div>
          </Badge>
          <Badge variant="outline" className="gap-2 px-3 py-2">
            <XCircle size={16} weight="fill" className="text-destructive" />
            <div className="flex flex-col items-start">
              <span className="text-xs text-muted-foreground">Omission</span>
              <span className="text-lg font-bold text-destructive">{stats.omissionErrors}</span>
            </div>
          </Badge>
        </div>
        <Button variant="ghost" size="icon" onClick={onExit} className="ml-4">
          <X size={24} />
        </Button>
      </div>

      <div className="flex-1 flex items-center justify-center relative overflow-hidden">
        <AnimatePresence mode="wait">
          {currentDigit !== null && (
            <motion.div
              key={`digit-${currentTrial}-${currentDigit}`}
              initial={{ scale: 0, rotateY: -180, opacity: 0 }}
              animate={{ scale: 1, rotateY: 0, opacity: 1 }}
              exit={{ scale: 0, rotateY: 180, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 300, damping: 20, duration: 0.15 }}
              className={`relative ${
                currentDigit === NO_GO_DIGIT 
                  ? 'text-destructive' 
                  : 'text-foreground'
              }`}
            >
              <div className={`text-[12rem] font-black ${
                currentDigit === NO_GO_DIGIT ? 'animate-pulse' : ''
              }`}>
                {currentDigit}
              </div>
              {currentDigit === NO_GO_DIGIT && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute inset-0 flex items-center justify-center"
                >
                  <div className="w-64 h-64 rounded-full border-8 border-destructive opacity-30 animate-ping" />
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
              className={`absolute top-20 px-6 py-3 rounded-full font-semibold shadow-lg ${
                feedback === 'correct' 
                  ? 'bg-success text-white' 
                  : 'bg-destructive text-white'
              }`}
            >
              {feedback === 'correct' ? '✓' : '✗'}
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
              Press <strong>SPACE</strong> for all numbers
            </p>
            <p className="text-sm font-bold text-destructive">
              EXCEPT for the number {NO_GO_DIGIT}!
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  )
}
