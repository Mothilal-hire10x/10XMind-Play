import { useState, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { X, Target, Timer } from '@phosphor-icons/react'
import { TrialResult } from '@/lib/types'
import { motion, AnimatePresence } from 'framer-motion'

interface TowerOfHanoiProps {
  onComplete: (results: TrialResult[], summary: { score: number; accuracy: number; reactionTime: number }) => void
  onExit: () => void
}

const DISK_COUNT = 3

export function TowerOfHanoi({ onComplete, onExit }: TowerOfHanoiProps) {
  const [pegs, setPegs] = useState<number[][]>([[3, 2, 1], [], []])
  const [selectedPeg, setSelectedPeg] = useState<number | null>(null)
  const [moves, setMoves] = useState(0)
  const [startTime] = useState(performance.now())
  const [invalidMove, setInvalidMove] = useState(false)

  const optimalMoves = Math.pow(2, DISK_COUNT) - 1

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
          const reactionTime = performance.now() - startTime
          
          onComplete([], {
            score: moves + 1,
            accuracy: Math.max(0, 100 - ((moves + 1 - optimalMoves) / optimalMoves * 100)),
            reactionTime
          })
        }
      } else {
        setInvalidMove(true)
        setTimeout(() => setInvalidMove(false), 500)
        setSelectedPeg(null)
      }
    }
  }, [selectedPeg, pegs, moves, startTime, optimalMoves, onComplete])

  const diskColors = [
    'from-destructive to-destructive/80',
    'from-accent to-accent/80',
    'from-primary to-primary/80'
  ]
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 flex flex-col">
      <div className="p-6 border-b border-border/50 backdrop-blur-sm bg-card/50 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Badge variant="outline" className="gap-2 px-4 py-2">
            <Timer size={20} weight="fill" className="text-primary" />
            <div className="flex flex-col items-start">
              <span className="text-xs text-muted-foreground">Moves</span>
              <span className="text-2xl font-bold text-foreground">{moves}</span>
            </div>
          </Badge>
          <Badge variant="outline" className="gap-2 px-4 py-2">
            <Target size={20} weight="fill" className="text-success" />
            <div className="flex flex-col items-start">
              <span className="text-xs text-muted-foreground">Optimal</span>
              <span className="text-2xl font-bold text-muted-foreground">{optimalMoves}</span>
            </div>
          </Badge>
          <Badge 
            variant={moves <= optimalMoves ? 'default' : moves <= optimalMoves + 3 ? 'secondary' : 'destructive'}
            className="px-3 py-1"
          >
            {moves <= optimalMoves ? '🏆 Perfect' : moves <= optimalMoves + 3 ? '👍 Good' : '💪 Keep trying'}
          </Badge>
        </div>
        <Button variant="ghost" size="icon" onClick={onExit}>
          <X size={24} />
        </Button>
      </div>

      <div className="flex-1 flex items-center justify-center p-8">
        <AnimatePresence>
          {invalidMove && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="absolute top-1/4 bg-destructive text-white px-6 py-3 rounded-lg font-semibold shadow-lg"
            >
              ✗ Invalid Move!
            </motion.div>
          )}
        </AnimatePresence>

        <div className="flex gap-16 items-end">
          {pegs.map((peg, pegIndex) => (
            <motion.div
              key={pegIndex}
              onClick={() => handlePegClick(pegIndex)}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className={`relative cursor-pointer ${selectedPeg === pegIndex ? 'opacity-60' : ''}`}
            >
              <div className="w-40 h-80 flex flex-col justify-end items-center">
                <div className={`absolute bottom-14 w-3 h-56 rounded-t-lg transition-all ${
                  selectedPeg === pegIndex 
                    ? 'bg-primary shadow-lg shadow-primary/50' 
                    : 'bg-gradient-to-t from-border to-muted'
                }`} />
                
                <div className="relative flex flex-col gap-1 items-center pb-3 z-10">
                  <AnimatePresence>
                    {peg.map((disk, diskIndex) => (
                      <motion.div
                        key={`${pegIndex}-${disk}-${diskIndex}`}
                        initial={{ y: -100, opacity: 0, scale: 0 }}
                        animate={{ y: 0, opacity: 1, scale: 1 }}
                        exit={{ y: -100, opacity: 0, scale: 0 }}
                        transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                        className={`h-10 rounded-lg bg-gradient-to-r ${diskColors[disk - 1]} shadow-lg border-2 border-white/20`}
                        style={{ width: `${disk * 35 + 50}px` }}
                      >
                        <div className="w-full h-full flex items-center justify-center text-white font-bold text-lg">
                          {disk}
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              </div>
              
              <div className="h-3 w-48 bg-gradient-to-r from-muted via-border to-muted rounded-lg shadow-md" />
              
              <div className="mt-2 text-center">
                <Badge variant={pegIndex === 2 ? 'default' : 'outline'} className="text-xs">
                  {pegIndex === 0 ? 'Start' : pegIndex === 1 ? 'Helper' : 'Goal'}
                </Badge>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      <motion.div
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="p-6 border-t border-border/50 backdrop-blur-sm bg-card/50"
      >
        <div className="text-center space-y-2">
          <p className="text-sm text-muted-foreground">
            <strong>Goal:</strong> Move all disks from Start to Goal
          </p>
          <p className="text-xs text-muted-foreground">
            Click a peg to select it, then click another to move the top disk. Larger disks cannot go on smaller ones.
          </p>
        </div>
      </motion.div>
    </div>
  )
}
