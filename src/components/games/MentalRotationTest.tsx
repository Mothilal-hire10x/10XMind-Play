import { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { X, Cube, Check, XCircle } from '@phosphor-icons/react'
import { TrialResult, GameSummary } from '@/lib/types'
import { motion, AnimatePresence } from 'framer-motion'

interface MentalRotationTestProps {
  onComplete: (results: TrialResult[], summary: GameSummary) => void
  onExit: () => void
}

interface Shape {
  type: string
  rotation: number
  isMirrored: boolean
}

const TOTAL_TRIALS = 20

export function MentalRotationTest({ onComplete, onExit }: MentalRotationTestProps) {
  const [currentTrial, setCurrentTrial] = useState(0)
  const [targetShape, setTargetShape] = useState<Shape | null>(null)
  const [comparisonShape, setComparisonShape] = useState<Shape | null>(null)
  const [isMatch, setIsMatch] = useState(false)
  const [startTime, setStartTime] = useState(0)
  const [results, setResults] = useState<TrialResult[]>([])
  const [feedback, setFeedback] = useState<'correct' | 'incorrect' | null>(null)
  const [errorTypes, setErrorTypes] = useState({ mirror: 0, nonMatch: 0, rotation: 0 })

  const generateShapes = useCallback(() => {
    const shapes = ['L', 'T', 'F', 'P']
    const rotations = [0, 45, 90, 135, 180, 225, 270, 315]
    
    const shapeType = shapes[Math.floor(Math.random() * shapes.length)]
    const targetRotation = rotations[Math.floor(Math.random() * rotations.length)]
    const comparisonRotation = rotations[Math.floor(Math.random() * rotations.length)]
    const shouldMatch = Math.random() > 0.5
    const shouldMirror = !shouldMatch && Math.random() > 0.5
    
    const target: Shape = {
      type: shapeType,
      rotation: targetRotation,
      isMirrored: false
    }
    
    const comparison: Shape = {
      type: shouldMatch ? shapeType : shapes[Math.floor(Math.random() * shapes.length)],
      rotation: comparisonRotation,
      isMirrored: shouldMirror
    }
    
    setTargetShape(target)
    setComparisonShape(comparison)
    setIsMatch(shouldMatch && target.type === comparison.type && !comparison.isMirrored)
  }, [])

  const startNextTrial = useCallback(() => {
    if (currentTrial >= TOTAL_TRIALS) {
      const totalCorrect = results.filter(r => r.correct).length
      const avgRT = results.reduce((sum, r) => sum + r.reactionTime, 0) / results.length
      const errorCount = TOTAL_TRIALS - totalCorrect
      const errorRate = (errorCount / TOTAL_TRIALS) * 100
      
      onComplete(results, {
        score: totalCorrect,
        accuracy: (totalCorrect / TOTAL_TRIALS) * 100,
        reactionTime: avgRT,
        errorCount,
        errorRate,
        details: {
          errorTypes,
          avgReactionTime: avgRT,
          totalTrials: TOTAL_TRIALS
        }
      })
      return
    }

    setFeedback(null)
    generateShapes()
    setStartTime(performance.now())
  }, [currentTrial, results, errorTypes, generateShapes, onComplete])

  useEffect(() => {
    startNextTrial()
  }, [])

  const handleResponse = useCallback((userAnswer: boolean) => {
    if (!targetShape || !comparisonShape || feedback) return

    const reactionTime = performance.now() - startTime
    const correct = userAnswer === isMatch
    
    // Determine error type
    let errorType = 'none'
    if (!correct) {
      if (comparisonShape.isMirrored) {
        errorType = 'mirror'
        setErrorTypes(prev => ({ ...prev, mirror: prev.mirror + 1 }))
      } else if (targetShape.type !== comparisonShape.type) {
        errorType = 'nonMatch'
        setErrorTypes(prev => ({ ...prev, nonMatch: prev.nonMatch + 1 }))
      } else {
        errorType = 'rotation'
        setErrorTypes(prev => ({ ...prev, rotation: prev.rotation + 1 }))
      }
    }

    const trialResult: TrialResult = {
      stimulus: `${targetShape.type}@${targetShape.rotation}° vs ${comparisonShape.type}@${comparisonShape.rotation}°${comparisonShape.isMirrored ? ' (mirrored)' : ''}`,
      response: userAnswer ? 'match' : 'no-match',
      correct,
      reactionTime,
      trialType: errorType
    }

    setResults(prev => [...prev, trialResult])
    setFeedback(correct ? 'correct' : 'incorrect')
    setCurrentTrial(prev => prev + 1)

    setTimeout(() => {
      startNextTrial()
    }, 800)
  }, [targetShape, comparisonShape, feedback, startTime, isMatch, startNextTrial])

  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      if (!targetShape || !comparisonShape || feedback) return
      
      const key = event.key.toLowerCase()
      if (key === 's') handleResponse(true)  // S for Same
      if (key === 'd') handleResponse(false) // D for Different
    }

    window.addEventListener('keydown', handleKeyPress)
    return () => window.removeEventListener('keydown', handleKeyPress)
  }, [targetShape, comparisonShape, feedback, handleResponse])

  // SVG shape generators
  const renderShape = (shape: Shape, size: number = 120) => {
    const paths: Record<string, string> = {
      L: 'M 20 20 L 20 100 L 80 100 L 80 80 L 40 80 L 40 20 Z',
      T: 'M 20 20 L 20 40 L 45 40 L 45 100 L 65 100 L 65 40 L 90 40 L 90 20 Z',
      F: 'M 20 20 L 20 100 L 40 100 L 40 65 L 70 65 L 70 50 L 40 50 L 40 35 L 80 35 L 80 20 Z',
      P: 'M 20 20 L 20 100 L 40 100 L 40 65 L 70 65 Q 85 65 85 50 Q 85 35 70 35 L 40 35 L 40 20 Z'
    }

    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 120 120"
        className="inline-block"
        style={{
          transform: `rotate(${shape.rotation}deg) scaleX(${shape.isMirrored ? -1 : 1})`
        }}
      >
        <path
          d={paths[shape.type] || paths.L}
          fill="currentColor"
          stroke="none"
        />
      </svg>
    )
  }

  const stats = {
    accuracy: results.length > 0 ? Math.round((results.filter(r => r.correct).length / results.length) * 100) : 0,
    avgRT: results.length > 0 ? Math.round(results.reduce((sum, r) => sum + r.reactionTime, 0) / results.length) : 0,
    errors: results.length > 0 ? results.length - results.filter(r => r.correct).length : 0,
    errorRate: results.length > 0 ? Math.round(((results.length - results.filter(r => r.correct).length) / results.length) * 100) : 0
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 flex flex-col">
      <div className="p-6 border-b border-border/50 backdrop-blur-sm bg-card/50 flex items-center justify-between">
        <div className="flex-1 space-y-3">
          <div className="flex items-center gap-4">
            <Progress value={(currentTrial / TOTAL_TRIALS) * 100} className="h-2 flex-1" />
            <span className="text-sm font-medium text-muted-foreground min-w-20 text-right">
              {currentTrial}/{TOTAL_TRIALS}
            </span>
          </div>
          <div className="flex gap-3">
            <Badge variant="outline" className="gap-2">
              <span className="text-xs text-muted-foreground">Accuracy</span>
              <span className="font-bold">{stats.accuracy}%</span>
            </Badge>
            <Badge variant="outline" className="gap-2">
              <span className="text-xs text-muted-foreground">Avg RT</span>
              <span className="font-bold">{stats.avgRT}ms</span>
            </Badge>
            <Badge variant="outline" className="gap-2">
              <span className="text-xs text-muted-foreground">Errors</span>
              <span className="font-bold text-destructive">
                {stats.errors} ({stats.errorRate}%) | M:{errorTypes.mirror} R:{errorTypes.rotation} N:{errorTypes.nonMatch}
              </span>
            </Badge>
          </div>
        </div>
        <Button variant="ghost" size="icon" onClick={onExit} className="ml-4">
          <X size={24} />
        </Button>
      </div>

      <div className="flex-1 flex items-center justify-center p-8">
        <AnimatePresence mode="wait">
          {targetShape && comparisonShape && (
            <motion.div
              key={currentTrial}
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 300, damping: 25 }}
              className="w-full max-w-4xl"
            >
              <Card className={`p-12 border-2 shadow-2xl transition-all duration-200 ${
                feedback === 'correct' 
                  ? 'border-success bg-success/5' 
                  : feedback === 'incorrect'
                  ? 'border-destructive bg-destructive/5'
                  : 'border-border/50 bg-card/80 backdrop-blur-sm'
              }`}>
                <AnimatePresence>
                  {feedback && (
                    <motion.div
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0, opacity: 0 }}
                      className={`absolute -top-6 -right-6 p-3 rounded-full ${
                        feedback === 'correct' ? 'bg-success' : 'bg-destructive'
                      }`}
                    >
                      {feedback === 'correct' ? (
                        <Check size={32} weight="bold" className="text-white" />
                      ) : (
                        <XCircle size={32} weight="bold" className="text-white" />
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>

                <div className="text-center mb-8">
                  <h3 className="text-2xl font-bold text-foreground mb-2">
                    Are these the same shape?
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Ignore rotation - focus on whether they're identical (not mirrored)
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-12 mb-8">
                  <motion.div
                    initial={{ x: -100, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: 0.1 }}
                    className="flex flex-col items-center"
                  >
                    <div className="text-sm text-muted-foreground mb-4 font-semibold">Target</div>
                    <Card className="p-8 bg-gradient-to-br from-primary/10 to-accent/10 border-2 border-primary/30">
                      <div className="text-primary">
                        {renderShape(targetShape, 160)}
                      </div>
                    </Card>
                  </motion.div>

                  <motion.div
                    initial={{ x: 100, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: 0.1 }}
                    className="flex flex-col items-center"
                  >
                    <div className="text-sm text-muted-foreground mb-4 font-semibold">Comparison</div>
                    <Card className="p-8 bg-gradient-to-br from-accent/10 to-primary/10 border-2 border-accent/30">
                      <div className="text-accent">
                        {renderShape(comparisonShape, 160)}
                      </div>
                    </Card>
                  </motion.div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <Button
                    size="lg"
                    onClick={() => handleResponse(true)}
                    disabled={feedback !== null}
                    className="text-xl py-8 bg-success hover:bg-success/90"
                  >
                    <Check size={24} className="mr-2" weight="bold" />
                    Same (S)
                  </Button>
                  <Button
                    size="lg"
                    onClick={() => handleResponse(false)}
                    disabled={feedback !== null}
                    className="text-xl py-8 bg-destructive hover:bg-destructive/90"
                  >
                    <XCircle size={24} className="mr-2" weight="bold" />
                    Different (D)
                  </Button>
                </div>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="p-6 border-t border-border/50 backdrop-blur-sm bg-card/50">
        <p className="text-center text-sm text-muted-foreground">
          Press <kbd className="px-2 py-1 bg-muted rounded">S</kbd> for Same or{' '}
          <kbd className="px-2 py-1 bg-muted rounded">D</kbd> for Different
        </p>
      </div>
    </div>
  )
}
