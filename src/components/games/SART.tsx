import { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { X } from '@phosphor-icons/react'
import { TrialResult } from '@/lib/types'

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
    const digit = Math.floor(Math.random() * 9) + 1
    setCurrentDigit(digit)
    setStartTime(Date.now())

    setTimeout(() => {
      setCurrentDigit(null)
      
      setTimeout(() => {
        const isNoGo = digit === NO_GO_DIGIT
        const correct = isNoGo ? !responded : responded
        
        setResults(prev => [...prev, {
          stimulus: digit.toString(),
          response: responded ? 'SPACE' : null,
          correct,
          reactionTime: responded ? Date.now() - startTime : 0,
          trialType: isNoGo ? 'no-go' : 'go'
        }])
        
        setCurrentTrial(prev => prev + 1)
      }, ISI - STIMULUS_DURATION)
    }, STIMULUS_DURATION)
  }, [currentTrial, responded, results, startTime, onComplete])

  useEffect(() => {
    startNextTrial()
  }, [])

  useEffect(() => {
    if (currentDigit === null && currentTrial < TOTAL_TRIALS) {
      const timer = setTimeout(() => {
        startNextTrial()
      }, ISI)
      return () => clearTimeout(timer)
    }
  }, [currentDigit, currentTrial, startNextTrial])

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

  const commissionErrors = results.filter(r => r.trialType === 'no-go' && r.response !== null).length
  const omissionErrors = results.filter(r => r.trialType === 'go' && r.response === null).length

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
            <p className="text-xs text-muted-foreground">Commission</p>
            <p className="text-lg font-bold text-destructive">{commissionErrors}</p>
          </div>
          <div className="text-center">
            <p className="text-xs text-muted-foreground">Omission</p>
            <p className="text-lg font-bold text-destructive">{omissionErrors}</p>
          </div>
        </div>
        <Button variant="ghost" size="icon" onClick={onExit} className="ml-4">
          <X size={24} />
        </Button>
      </div>

      <div className="flex-1 flex items-center justify-center">
        {currentDigit !== null && (
          <div className="text-9xl font-bold text-foreground">
            {currentDigit}
          </div>
        )}
      </div>

      <div className="p-6 border-t border-border bg-card text-center">
        <div className="max-w-md mx-auto">
          <kbd className="px-6 py-4 bg-muted rounded text-xl font-mono block mb-2">SPACE</kbd>
          <p className="text-sm text-muted-foreground">
            Press SPACE for all numbers EXCEPT {NO_GO_DIGIT}
          </p>
        </div>
      </div>
    </div>
  )
}
