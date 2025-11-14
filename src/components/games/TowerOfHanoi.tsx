import { useState, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { X } from '@phosphor-icons/react'
import { TrialResult } from '@/lib/types'

interface TowerOfHanoiProps {
  onComplete: (results: TrialResult[], summary: { score: number; accuracy: number; reactionTime: number }) => void
  onExit: () => void
}

const DISK_COUNT = 3

export function TowerOfHanoi({ onComplete, onExit }: TowerOfHanoiProps) {
  const [pegs, setPegs] = useState<number[][]>([[3, 2, 1], [], []])
  const [selectedPeg, setSelectedPeg] = useState<number | null>(null)
  const [moves, setMoves] = useState(0)
  const [startTime] = useState(Date.now())

  const handlePegClick = useCallback((pegIndex: number) => {
    if (selectedPeg === null) {
      if (pegs[pegIndex].length > 0) {
        setSelectedPeg(pegIndex)
      }
    } else {
      if (selectedPeg === pegIndex) {
        setSelectedPeg(null)
        return
      }

      const fromPeg = pegs[selectedPeg]
      const toPeg = pegs[pegIndex]
      const disk = fromPeg[fromPeg.length - 1]

      if (toPeg.length === 0 || disk < toPeg[toPeg.length - 1]) {
        const newPegs = pegs.map((peg, idx) => {
          if (idx === selectedPeg) {
            return peg.slice(0, -1)
          }
          if (idx === pegIndex) {
            return [...peg, disk]
          }
          return peg
        })
        
        setPegs(newPegs)
        setMoves(prev => prev + 1)
        setSelectedPeg(null)

        if (newPegs[2].length === DISK_COUNT) {
          const reactionTime = Date.now() - startTime
          const optimalMoves = Math.pow(2, DISK_COUNT) - 1
          
          onComplete([], {
            score: moves + 1,
            accuracy: Math.max(0, 100 - ((moves + 1 - optimalMoves) / optimalMoves * 100)),
            reactionTime
          })
        }
      } else {
        setSelectedPeg(null)
      }
    }
  }, [selectedPeg, pegs, moves, startTime, onComplete])

  const diskColors = ['bg-destructive', 'bg-accent', 'bg-primary']
  
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <div className="p-4 border-b border-border flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div>
            <p className="text-sm text-muted-foreground">Moves</p>
            <p className="text-2xl font-bold text-foreground">{moves}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Optimal</p>
            <p className="text-2xl font-bold text-muted-foreground">{Math.pow(2, DISK_COUNT) - 1}</p>
          </div>
        </div>
        <Button variant="ghost" size="icon" onClick={onExit}>
          <X size={24} />
        </Button>
      </div>

      <div className="flex-1 flex items-center justify-center p-8">
        <div className="flex gap-12">
          {pegs.map((peg, pegIndex) => (
            <div
              key={pegIndex}
              onClick={() => handlePegClick(pegIndex)}
              className={`relative cursor-pointer ${selectedPeg === pegIndex ? 'opacity-50' : ''}`}
            >
              <div className="w-32 h-64 flex flex-col justify-end items-center">
                <div className="absolute bottom-0 w-2 h-48 bg-border rounded-t" />
                <div className="relative flex flex-col gap-1 items-center pb-2">
                  {peg.map((disk, diskIndex) => (
                    <div
                      key={diskIndex}
                      className={`h-8 rounded ${diskColors[disk - 1]} transition-all`}
                      style={{ width: `${disk * 30 + 40}px` }}
                    />
                  ))}
                </div>
              </div>
              <div className="mt-2 h-2 w-40 bg-border rounded" />
            </div>
          ))}
        </div>
      </div>

      <div className="p-4 border-t border-border bg-card text-center">
        <p className="text-sm text-muted-foreground">
          Click a peg to select it, then click another peg to move the top disk
        </p>
      </div>
    </div>
  )
}
