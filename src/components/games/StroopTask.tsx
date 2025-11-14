import { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { X } from '@phosphor-icons/react'
import { TrialResult } from '@/lib/types'

interface StroopTaskProps {
  onComplete: (results: TrialResult[], summary: { score: number; accuracy: number; reactionTime: number }) => void
  onExit: () => void
}

const COLORS = ['RED', 'GREEN', 'BLUE', 'YELLOW']
const COLOR_KEYS = { r: 'RED', g: 'GREEN', b: 'BLUE', y: 'YELLOW' }
const COLOR_VALUES = {
  RED: '#EF4444',
  GREEN: '#22C55E',
  BLUE: '#3B82F6',
  YELLOW: '#EAB308'
}

const TOTAL_TRIALS = 20

export function StroopTask({ onComplete, onExit }: StroopTaskProps) {
  const [currentTrial, setCurrentTrial] = useState(0)
  const [stimulus, setStimulus] = useState<{ word: string; color: string } | null>(null)
  const [startTime, setStartTime] = useState(0)
  const [results, setResults] = useState<TrialResult[]>([])
  const [feedback, setFeedback] = useState<'correct' | 'incorrect' | null>(null)
  const [showFixation, setShowFixation] = useState(true)

  const generateStimulus = useCallback(() => {
    const word = COLORS[Math.floor(Math.random() * COLORS.length)]
    const color = COLORS[Math.floor(Math.random() * COLORS.length)]
    return { word, color }
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
      setStimulus(generateStimulus())
      setStartTime(Date.now())
    }, 500)
  }, [currentTrial, results, generateStimulus, onComplete])

  useEffect(() => {
    startNextTrial()
  }, [])

  const handleKeyPress = useCallback((event: KeyboardEvent) => {
    if (!stimulus || showFixation || feedback) return

    const key = event.key.toLowerCase()
    if (!(key in COLOR_KEYS)) return

    const reactionTime = Date.now() - startTime
    const response = COLOR_KEYS[key as keyof typeof COLOR_KEYS]
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
    setCurrentTrial(prev => prev + 1)

    setTimeout(() => {
      startNextTrial()
    }, 600)
  }, [stimulus, showFixation, feedback, startTime, startNextTrial])

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
              <div
                className="text-7xl font-bold text-center"
                style={{ color: COLOR_VALUES[stimulus.color as keyof typeof COLOR_VALUES] }}
              >
                {stimulus.word}
              </div>
            </CardContent>
          </Card>
        ) : null}
      </div>

      <div className="p-6 border-t border-border bg-card">
        <div className="max-w-2xl mx-auto grid grid-cols-4 gap-3">
          {Object.entries(COLOR_KEYS).map(([key, color]) => (
            <div key={key} className="text-center">
              <kbd className="px-3 py-2 bg-muted rounded text-sm font-mono block mb-1">
                {key.toUpperCase()}
              </kbd>
              <span className="text-xs text-muted-foreground">{color}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
