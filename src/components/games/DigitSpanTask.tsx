import { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { X } from '@phosphor-icons/react'
import { TrialResult } from '@/lib/types'

interface DigitSpanTaskProps {
  onComplete: (results: TrialResult[], summary: { score: number; accuracy: number; reactionTime: number }) => void
  onExit: () => void
}

export function DigitSpanTask({ onComplete, onExit }: DigitSpanTaskProps) {
  const [span, setSpan] = useState(2)
  const [sequence, setSequence] = useState<number[]>([])
  const [currentDigitIndex, setCurrentDigitIndex] = useState(0)
  const [phase, setPhase] = useState<'showing' | 'recall'>('showing')
  const [userInput, setUserInput] = useState('')
  const [results, setResults] = useState<TrialResult[]>([])
  const [consecutiveFailures, setConsecutiveFailures] = useState(0)
  const [startTime, setStartTime] = useState(0)

  const generateSequence = useCallback((length: number) => {
    return Array.from({ length }, () => Math.floor(Math.random() * 10))
  }, [])

  const startTrial = useCallback(() => {
    const newSequence = generateSequence(span)
    setSequence(newSequence)
    setCurrentDigitIndex(0)
    setPhase('showing')
    setUserInput('')
    setStartTime(Date.now())
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
    
    const reactionTime = Date.now() - startTime
    const correct = userInput === sequence.join('')
    
    const trialResult: TrialResult = {
      stimulus: sequence.join(''),
      response: userInput,
      correct,
      reactionTime
    }

    setResults(prev => [...prev, trialResult])

    if (correct) {
      setConsecutiveFailures(0)
      if (results.filter(r => r.stimulus.length === span.toString().length).filter(r => r.correct).length >= 1) {
        setSpan(prev => prev + 1)
      }
      setTimeout(() => startTrial(), 1000)
    } else {
      const newFailures = consecutiveFailures + 1
      setConsecutiveFailures(newFailures)
      
      if (newFailures >= 2) {
        const maxSpan = Math.max(...results.filter(r => r.correct).map(r => r.stimulus.length), span - 1)
        const totalCorrect = results.filter(r => r.correct).length + (correct ? 1 : 0)
        const avgRT = results.reduce((sum, r) => sum + r.reactionTime, 0) / results.length
        
        onComplete(results, {
          score: maxSpan,
          accuracy: (totalCorrect / (results.length + 1)) * 100,
          reactionTime: avgRT
        })
      } else {
        setTimeout(() => startTrial(), 1000)
      }
    }
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <div className="p-4 border-b border-border flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div>
            <p className="text-sm text-muted-foreground">Current Span</p>
            <p className="text-2xl font-bold text-foreground">{span}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Trials</p>
            <p className="text-2xl font-bold text-foreground">{results.length}</p>
          </div>
        </div>
        <Button variant="ghost" size="icon" onClick={onExit}>
          <X size={24} />
        </Button>
      </div>

      <div className="flex-1 flex items-center justify-center">
        {phase === 'showing' ? (
          <div className="text-center">
            {currentDigitIndex < sequence.length ? (
              <div className="text-9xl font-bold text-foreground animate-pulse">
                {sequence[currentDigitIndex]}
              </div>
            ) : (
              <div className="text-6xl font-bold text-muted-foreground">...</div>
            )}
          </div>
        ) : (
          <Card className="p-8 w-full max-w-md">
            <CardContent className="p-0">
              <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                <div className="text-center mb-4">
                  <h3 className="text-xl font-semibold mb-2">Enter the sequence</h3>
                  <p className="text-sm text-muted-foreground">Type the digits in order</p>
                </div>
                <Input
                  type="text"
                  value={userInput}
                  onChange={(e) => setUserInput(e.target.value.replace(/\D/g, '').slice(0, span))}
                  placeholder="Enter digits..."
                  className="text-center text-2xl tracking-widest"
                  autoFocus
                  maxLength={span}
                />
                <Button type="submit" size="lg">Submit</Button>
              </form>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
