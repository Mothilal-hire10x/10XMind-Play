import { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { X } from '@phosphor-icons/react'
import { TrialResult } from '@/lib/types'

interface SimonTaskProps {
  onComplete: (results: TrialResult[], summary: { score: number; accuracy: number; reactionTime: number }) => void
  onExit: () => void
}

const TOTAL_TRIALS = 20
const WORDS = ['LEFT', 'RIGHT']

export function SimonTask({ onComplete, onExit }: SimonTaskProps) {
  const [currentTrial, setCurrentTrial] = useState(0)
  const [word, setWord] = useState<string | null>(null)
  const [position, setPosition] = useState<'left' | 'right'>('left')
  const [startTime, setStartTime] = useState(0)
  const [results, setResults] = useState<TrialResult[]>([])
  const [feedback, setFeedback] = useState<'correct' | 'incorrect' | null>(null)
  const [showFixation, setShowFixation] = useState(true)

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
      setStartTime(Date.now())
    }, 500)
  }, [currentTrial, results, generateStimulus, onComplete])

  useEffect(() => {
    startNextTrial()
  }, [])

  const handleKeyPress = useCallback((event: KeyboardEvent) => {
    if (!word || showFixation || feedback) return

    const key = event.key.toLowerCase()
    if (key !== 'a' && key !== 'l') return

    const reactionTime = Date.now() - startTime
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
    setCurrentTrial(prev => prev + 1)

    setTimeout(() => {
      startNextTrial()
    }, 600)
  }, [word, position, showFixation, feedback, startTime, startNextTrial])

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

      <div className="flex-1 flex items-center justify-center relative">
        {showFixation ? (
          <div className="text-6xl font-bold text-foreground">+</div>
        ) : word ? (
          <div className={`absolute ${position === 'left' ? 'left-1/4' : 'right-1/4'} transform -translate-x-1/2`}>
            <Card className={`p-12 ${feedback ? (feedback === 'correct' ? 'animate-pulse bg-success/10' : 'animate-shake bg-destructive/10') : ''}`}>
              <CardContent className="p-0">
                <div className="text-7xl font-bold text-center text-foreground">
                  {word}
                </div>
              </CardContent>
            </Card>
          </div>
        ) : null}
      </div>

      <div className="p-6 border-t border-border bg-card">
        <div className="max-w-md mx-auto grid grid-cols-2 gap-6">
          <div className="text-center">
            <kbd className="px-4 py-3 bg-muted rounded text-lg font-mono block mb-2">A</kbd>
            <span className="text-sm text-muted-foreground">LEFT</span>
          </div>
          <div className="text-center">
            <kbd className="px-4 py-3 bg-muted rounded text-lg font-mono block mb-2">L</kbd>
            <span className="text-sm text-muted-foreground">RIGHT</span>
          </div>
        </div>
      </div>
    </div>
  )
}
