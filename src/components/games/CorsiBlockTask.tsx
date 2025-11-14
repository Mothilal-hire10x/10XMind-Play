import { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { X } from '@phosphor-icons/react'
import { TrialResult } from '@/lib/types'

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
    setStartTime(Date.now())
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
    if (phase !== 'recall') return
    
    const newUserSequence = [...userSequence, index]
    setUserSequence(newUserSequence)
    setHighlighted(index)
    setTimeout(() => setHighlighted(null), 300)

    if (newUserSequence.length === sequence.length) {
      const reactionTime = Date.now() - startTime
      const correct = JSON.stringify(newUserSequence) === JSON.stringify(sequence)
      
      const trialResult: TrialResult = {
        stimulus: sequence.join(','),
        response: newUserSequence.join(','),
        correct,
        reactionTime
      }

      setResults(prev => [...prev, trialResult])

      if (correct) {
        setConsecutiveFailures(0)
        if (results.filter(r => r.stimulus.split(',').length === span).filter(r => r.correct).length >= 1) {
          setSpan(prev => prev + 1)
        }
        setTimeout(() => startTrial(), 1000)
      } else {
        const newFailures = consecutiveFailures + 1
        setConsecutiveFailures(newFailures)
        
        if (newFailures >= 2) {
          const maxSpan = Math.max(...results.filter(r => r.correct).map(r => r.stimulus.split(',').length), span - 1)
          const totalCorrect = results.filter(r => r.correct).length
          const avgRT = results.reduce((sum, r) => sum + r.reactionTime, 0) / results.length
          
          onComplete(results, {
            score: maxSpan,
            accuracy: (totalCorrect / results.length) * 100,
            reactionTime: avgRT
          })
        } else {
          setTimeout(() => startTrial(), 1000)
        }
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
            <p className="text-sm text-muted-foreground">Phase</p>
            <p className="text-lg font-semibold text-foreground">{phase === 'showing' ? 'Watch' : 'Recall'}</p>
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

      <div className="flex-1 flex items-center justify-center p-8">
        <div className="grid grid-cols-3 gap-6 max-w-md w-full">
          {Array.from({ length: GRID_SIZE }).map((_, index) => (
            <button
              key={index}
              onClick={() => handleBlockClick(index)}
              disabled={phase === 'showing'}
              className={`aspect-square rounded-lg border-4 transition-all ${
                highlighted === index
                  ? 'bg-accent border-accent scale-95'
                  : 'bg-card border-border hover:border-primary hover:scale-105'
              } ${phase === 'recall' ? 'cursor-pointer' : 'cursor-default'}`}
            />
          ))}
        </div>
      </div>

      {phase === 'recall' && (
        <div className="p-4 border-t border-border bg-card text-center">
          <p className="text-sm text-muted-foreground">
            Click the blocks in the same order ({userSequence.length}/{sequence.length})
          </p>
        </div>
      )}
    </div>
  )
}
