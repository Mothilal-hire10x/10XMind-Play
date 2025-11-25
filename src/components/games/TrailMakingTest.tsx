import { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { X, Timer, Lightning } from '@phosphor-icons/react'
import { TrialResult, GameSummary } from '@/lib/types'
import { motion, AnimatePresence } from 'framer-motion'

interface TrailMakingTestProps {
  onComplete: (results: TrialResult[], summary: GameSummary) => void
  onExit: () => void
}

interface Circle {
  id: number
  label: string
  x: number
  y: number
  isClicked: boolean
}

export function TrailMakingTest({ onComplete, onExit }: TrailMakingTestProps) {
  const [testPart, setTestPart] = useState<'A' | 'B'>('A')
  const [circles, setCircles] = useState<Circle[]>([])
  const [currentTarget, setCurrentTarget] = useState(0)
  const [errors, setErrors] = useState(0)
  const [startTime, setStartTime] = useState(0)
  const [completionTime, setCompletionTime] = useState(0)
  const [testATime, setTestATime] = useState(0)
  const [testAErrors, setTestAErrors] = useState(0)
  const [isComplete, setIsComplete] = useState(false)
  const [elapsedTime, setElapsedTime] = useState(0)
  const [results, setResults] = useState<TrialResult[]>([])

  const generateCircles = useCallback((partType: 'A' | 'B') => {
    const count = 25
    const newCircles: Circle[] = []
    const containerWidth = 1000
    const containerHeight = 600
    const minDistance = 80

    if (partType === 'A') {
      // TMT-A: Numbers 1-25
      for (let i = 1; i <= count; i++) {
        let x, y, attempts = 0
        do {
          x = Math.random() * (containerWidth - 100) + 50
          y = Math.random() * (containerHeight - 100) + 50
          attempts++
        } while (
          attempts < 100 &&
          newCircles.some(c => Math.hypot(c.x - x, c.y - y) < minDistance)
        )
        newCircles.push({ id: i - 1, label: i.toString(), x, y, isClicked: false })
      }
    } else {
      // TMT-B: Alternate numbers and letters (1-A-2-B-3-C...)
      const labels: string[] = []
      for (let i = 1; i <= 13; i++) {
        labels.push(i.toString())
        if (i <= 12) {
          labels.push(String.fromCharCode(64 + i)) // A, B, C...
        }
      }
      
      for (let i = 0; i < labels.length; i++) {
        let x, y, attempts = 0
        do {
          x = Math.random() * (containerWidth - 100) + 50
          y = Math.random() * (containerHeight - 100) + 50
          attempts++
        } while (
          attempts < 100 &&
          newCircles.some(c => Math.hypot(c.x - x, c.y - y) < minDistance)
        )
        newCircles.push({ id: i, label: labels[i], x, y, isClicked: false })
      }
    }

    return newCircles
  }, [])

  const startTest = useCallback(() => {
    const newCircles = generateCircles(testPart)
    setCircles(newCircles)
    setCurrentTarget(0)
    setErrors(0)
    setStartTime(performance.now())
    setIsComplete(false)
    setElapsedTime(0)
  }, [testPart, generateCircles])

  useEffect(() => {
    startTest()
  }, [testPart])

  useEffect(() => {
    if (!isComplete && startTime > 0) {
      const interval = setInterval(() => {
        setElapsedTime(performance.now() - startTime)
      }, 100)
      return () => clearInterval(interval)
    }
  }, [isComplete, startTime])

  const handleCircleClick = useCallback((circle: Circle) => {
    if (isComplete) return

    if (circle.id === currentTarget) {
      // Correct click
      const newCircles = circles.map(c =>
        c.id === circle.id ? { ...c, isClicked: true } : c
      )
      setCircles(newCircles)
      
      const trialResult: TrialResult = {
        stimulus: circle.label,
        response: circle.label,
        correct: true,
        reactionTime: performance.now() - startTime,
        trialType: `TMT-${testPart}`
      }
      setResults(prev => [...prev, trialResult])

      if (currentTarget === circles.length - 1) {
        // Test complete
        const completedTime = performance.now() - startTime
        setCompletionTime(completedTime)
        setIsComplete(true)

        if (testPart === 'A') {
          // Save TMT-A results and start TMT-B
          setTestATime(completedTime)
          setTestAErrors(errors)
          setTimeout(() => {
            setTestPart('B')
          }, 2000)
        } else {
          // Both tests complete
          setTimeout(() => {
            const timeDifference = completedTime - testATime
            const totalErrors = testAErrors + errors
            const errorRate = (totalErrors / (circles.length * 2)) * 100
            
            onComplete(results, {
              score: Math.round((testATime + completedTime) / 2),
              accuracy: ((circles.length * 2 - totalErrors) / (circles.length * 2)) * 100,
              reactionTime: (testATime + completedTime) / 2,
              errorCount: totalErrors,
              errorRate,
              details: {
                tmtATime: testATime,
                tmtBTime: completedTime,
                tmtAErrors: testAErrors,
                tmtBErrors: errors,
                timeDifference
              }
            })
          }, 2000)
        }
      } else {
        setCurrentTarget(prev => prev + 1)
      }
    } else {
      // Wrong click
      setErrors(prev => prev + 1)
      
      const trialResult: TrialResult = {
        stimulus: circles[currentTarget].label,
        response: circle.label,
        correct: false,
        reactionTime: performance.now() - startTime,
        trialType: `TMT-${testPart}`
      }
      setResults(prev => [...prev, trialResult])
    }
  }, [circles, currentTarget, isComplete, testPart, startTime, errors, testATime, onComplete, results])

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 flex flex-col">
      <div className="p-6 border-b border-border/50 backdrop-blur-sm bg-card/50 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Badge variant="outline" className="gap-2 px-4 py-2">
            <Lightning size={20} weight="fill" className="text-primary" />
            <div className="flex flex-col items-start">
              <span className="text-xs text-muted-foreground">Test Part</span>
              <span className="text-2xl font-bold text-foreground">TMT-{testPart}</span>
            </div>
          </Badge>
          <Badge variant="outline" className="gap-2 px-4 py-2">
            <Timer size={20} weight="fill" />
            <div className="flex flex-col items-start">
              <span className="text-xs text-muted-foreground">Time</span>
              <span className="text-xl font-bold text-foreground">
                {(elapsedTime / 1000).toFixed(1)}s
              </span>
            </div>
          </Badge>
          <Badge variant="outline" className="gap-2 px-4 py-2">
            <div className="flex flex-col items-start">
              <span className="text-xs text-muted-foreground">Progress</span>
              <span className="text-xl font-bold text-primary">
                {currentTarget + 1}/{circles.length}
              </span>
            </div>
          </Badge>
          <Badge variant="outline" className="gap-2 px-4 py-2">
            <div className="flex flex-col items-start">
              <span className="text-xs text-muted-foreground">Errors</span>
              <span className="text-xl font-bold text-destructive">
                {errors} ({currentTarget > 0 ? Math.round((errors / currentTarget) * 100) : 0}%)
              </span>
            </div>
          </Badge>
        </div>
        <Button variant="ghost" size="icon" onClick={onExit}>
          <X size={24} />
        </Button>
      </div>

      <div className="flex-1 flex items-center justify-center p-8">
        <Card className="relative bg-card/80 backdrop-blur-sm border-2" style={{ width: 1000, height: 600 }}>
          <AnimatePresence>
            {isComplete && (
              <motion.div
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="absolute inset-0 flex items-center justify-center bg-success/10 rounded-lg z-10"
              >
                <div className="text-center">
                  <div className="text-6xl mb-4">✓</div>
                  <div className="text-2xl font-bold text-success">
                    TMT-{testPart} Complete!
                  </div>
                  <div className="text-lg text-muted-foreground mt-2">
                    Time: {(completionTime / 1000).toFixed(2)}s
                  </div>
                  {testPart === 'A' && (
                    <div className="text-sm text-muted-foreground mt-4">
                      Starting TMT-B...
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="absolute top-4 left-4 text-sm text-muted-foreground">
            {testPart === 'A' 
              ? 'Connect the numbers in order: 1 → 2 → 3 → ...'
              : 'Alternate numbers and letters: 1 → A → 2 → B → ...'}
          </div>

          <div className="absolute top-4 right-4 text-lg font-bold text-primary">
            Next: {circles[currentTarget]?.label}
          </div>

          {circles.map((circle, index) => {
            const isTarget = circle.id === currentTarget
            const isCompleted = circle.isClicked
            const isPrevious = circle.id < currentTarget

            return (
              <motion.div
                key={circle.id}
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: index * 0.02 }}
                style={{
                  position: 'absolute',
                  left: circle.x,
                  top: circle.y,
                }}
              >
                <motion.button
                  whileHover={!isCompleted ? { scale: 1.1 } : {}}
                  whileTap={!isCompleted ? { scale: 0.95 } : {}}
                  onClick={() => handleCircleClick(circle)}
                  disabled={isCompleted}
                  className={`
                    w-16 h-16 rounded-full border-3 font-bold text-lg
                    transition-all duration-200 relative
                    ${isCompleted 
                      ? 'bg-success border-success text-white cursor-default' 
                      : isTarget
                      ? 'bg-primary border-primary text-white animate-pulse shadow-lg shadow-primary/50'
                      : 'bg-card border-border hover:border-primary hover:bg-primary/10'
                    }
                  `}
                >
                  {circle.label}
                  
                  {/* Draw line to previous circle */}
                  {isPrevious && index > 0 && (
                    <svg
                      className="absolute pointer-events-none"
                      style={{
                        left: 32,
                        top: 32,
                        width: Math.abs(circles[index - 1].x - circle.x) + 64,
                        height: Math.abs(circles[index - 1].y - circle.y) + 64,
                        transform: `translate(-32px, -32px)`,
                      }}
                    >
                      <line
                        x1={32}
                        y1={32}
                        x2={circles[index - 1].x - circle.x + 32}
                        y2={circles[index - 1].y - circle.y + 32}
                        stroke="oklch(0.65 0.25 255)"
                        strokeWidth="2"
                        strokeDasharray="5,5"
                      />
                    </svg>
                  )}
                </motion.button>
              </motion.div>
            )
          })}
        </Card>
      </div>
    </div>
  )
}
