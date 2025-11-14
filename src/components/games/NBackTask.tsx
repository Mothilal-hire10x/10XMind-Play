import { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { X } from '@phosphor-icons/react'
import { TrialResult } from '@/lib/types'

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
    setCurrentNumber(sequence[currentTrial])
    setStartTime(Date.now())

    setTimeout(() => {
      const isTarget = currentTrial >= N_BACK && sequence[currentTrial] === sequence[currentTrial - N_BACK]
      const correct = isTarget ? responded : !responded
      
      setResults(prev => [...prev, {
        stimulus: `${sequence[currentTrial]} (${currentTrial >= N_BACK ? sequence[currentTrial - N_BACK] : 'N/A'})`,
        response: responded ? 'SPACE' : null,
        correct,
        reactionTime: responded ? Date.now() - startTime : 0,
        trialType: isTarget ? 'target' : 'non-target'
      }])

      setFeedback(correct ? 'correct' : 'incorrect')
      setCurrentNumber(null)
      
      setTimeout(() => {
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

  const hits = results.filter(r => r.trialType === 'target' && r.response !== null).length
  const misses = results.filter(r => r.trialType === 'target' && r.response === null).length
  const falseAlarms = results.filter(r => r.trialType === 'non-target' && r.response !== null).length

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <div className="p-4 border-b border-border flex items-center justify-between">
        <div className="flex items-center gap-4 flex-1">
          <div className="flex-1">
            <Progress value={(currentTrial / TOTAL_TRIALS) * 100} className="h-2" />
            <p className="text-sm text-muted-foreground mt-2">
              Trial {currentTrial} of {TOTAL_TRIALS}
            </p>
          </div>
          <div className="text-center">
            <p className="text-xs text-muted-foreground">Hits</p>
            <p className="text-lg font-bold text-success">{hits}</p>
          </div>
          <div className="text-center">
            <p className="text-xs text-muted-foreground">Misses</p>
            <p className="text-lg font-bold text-destructive">{misses}</p>
          </div>
          <div className="text-center">
            <p className="text-xs text-muted-foreground">False Alarms</p>
            <p className="text-lg font-bold text-destructive">{falseAlarms}</p>
          </div>
        </div>
        <Button variant="ghost" size="icon" onClick={onExit} className="ml-4">
          <X size={24} />
        </Button>
      </div>

      <div className="flex-1 flex items-center justify-center">
        {currentNumber !== null && (
          <div className={`text-9xl font-bold transition-all ${
            feedback === 'correct' ? 'text-success' : 
            feedback === 'incorrect' ? 'text-destructive' : 
            'text-foreground'
          }`}>
            {currentNumber}
          </div>
        )}
      </div>

      <div className="p-6 border-t border-border bg-card text-center">
        <div className="max-w-md mx-auto">
          <kbd className="px-6 py-4 bg-muted rounded text-xl font-mono block mb-2">SPACE</kbd>
          <p className="text-sm text-muted-foreground">
            Press SPACE when the current number matches the one from {N_BACK} steps back
          </p>
        </div>
      </div>
    </div>
  )
}
