import { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { X } from '@phosphor-icons/react'
import { TrialResult } from '@/lib/types'

interface FlankerTaskProps {
  onComplete: (results: TrialResult[], summary: { score: number; accuracy: number; reactionTime: number }) => void
  onExit: () => void
}

const TOTAL_TRIALS = 24
const LETTERS = ['X', 'C', 'V', 'B']

export function FlankerTask({ onComplete, onExit }: FlankerTaskProps) {
  const [currentTrial, setCurrentTrial] = useState(0)
  const [stimulus, setStimulus] = useState<string | null>(null)
  const [targetLetter, setTargetLetter] = useState<string>('')
  const [startTime, setStartTime] = useState(0)
  const [results, setResults] = useState<TrialResult[]>([])
  const [feedback, setFeedback] = useState<'correct' | 'incorrect' | null>(null)
  const [showFixation, setShowFixation] = useState(true)

  const generateStimulus = useCallback(() => {
    const target = LETTERS[Math.floor(Math.random() * LETTERS.length)]
    const isCongruent = Math.random() < 0.5
    
    if (isCongruent) {
      return { stimulus: target.repeat(5), target, congruent: true }
    } else {
      const flanker = LETTERS.filter(l => l !== target)[Math.floor(Math.random() * 3)]
      return { stimulus: `${flanker}${flanker}${target}${flanker}${flanker}`, target, congruent: false }
    }
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
      setStimulus(trial.stimulus)
      setTargetLetter(trial.target)
      setStartTime(Date.now())
    }, 500)
  }, [currentTrial, results, generateStimulus, onComplete])

  useEffect(() => {
    startNextTrial()
  }, [])

  const handleKeyPress = useCallback((event: KeyboardEvent) => {
    if (!stimulus || showFixation || feedback) return

    const key = event.key.toLowerCase()
    if (key !== 'a' && key !== 'l') return

    const reactionTime = Date.now() - startTime
    const expectedKey = (targetLetter === 'X' || targetLetter === 'C') ? 'a' : 'l'
    const correct = key === expectedKey

    const trialResult: TrialResult = {
      stimulus,
      response: key.toUpperCase(),
      correct,
      reactionTime,
      trialType: stimulus[0] === stimulus[2] ? 'congruent' : 'incongruent'
    }

    setResults(prev => [...prev, trialResult])
    setFeedback(correct ? 'correct' : 'incorrect')
    setCurrentTrial(prev => prev + 1)

    setTimeout(() => {
      startNextTrial()
    }, 600)
  }, [stimulus, showFixation, feedback, startTime, targetLetter, startNextTrial])

  useEffect(() => {
    window.addEventListener('keydown', handleKeyPress)
    return () => window.removeEventListener('keydown', handleKeyPress)
  }, [handleKeyPress])

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <div className="p-4 border-b border-border flex items-center justify-between">
        <div className="flex-1">
          <Progress value={(currentTrial / TOTAL_TRIALS) * 100} className="h-2" />
          <p className="text-sm text-muted-foreground mt-2">
            Trial {currentTrial} of {TOTAL_TRIALS}
          </p>
        </div>
        <Button variant="ghost" size="icon" onClick={onExit} className="ml-4">
          <X size={24} />
        </Button>
      </div>

      <div className="flex-1 flex items-center justify-center">
        {showFixation ? (
          <div className="text-6xl font-bold text-foreground">+</div>
        ) : stimulus ? (
          <Card className={`p-12 ${feedback ? (feedback === 'correct' ? 'animate-pulse bg-success/10' : 'animate-shake bg-destructive/10') : ''}`}>
            <CardContent className="p-0">
              <div className="text-7xl font-bold text-center tracking-widest font-mono text-foreground">
                {stimulus}
              </div>
            </CardContent>
          </Card>
        ) : null}
      </div>

      <div className="p-6 border-t border-border bg-card">
        <div className="max-w-md mx-auto grid grid-cols-2 gap-6">
          <div className="text-center">
            <kbd className="px-4 py-3 bg-muted rounded text-lg font-mono block mb-2">A</kbd>
            <span className="text-sm text-muted-foreground">Press for X or C</span>
          </div>
          <div className="text-center">
            <kbd className="px-4 py-3 bg-muted rounded text-lg font-mono block mb-2">L</kbd>
            <span className="text-sm text-muted-foreground">Press for V or B</span>
          </div>
        </div>
      </div>
    </div>
  )
}
