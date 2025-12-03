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

interface Trial {
  target: Shape
  option1: Shape
  option2: Shape
  correctOption: 1 | 2
}

type GamePhase = 'instructions' | 'practice' | 'test'

const TOTAL_TRIALS = 15
const PRACTICE_TRIALS = 2

export function MentalRotationTest({ onComplete, onExit }: MentalRotationTestProps) {
  const [gamePhase, setGamePhase] = useState<GamePhase>('instructions')
  const [instructionPage, setInstructionPage] = useState(0)
  const [practiceComplete, setPracticeComplete] = useState(false)
  const [currentTrial, setCurrentTrial] = useState(0)
  const [trialData, setTrialData] = useState<Trial | null>(null)
  const [startTime, setStartTime] = useState(0)
  const [results, setResults] = useState<TrialResult[]>([])
  const [feedback, setFeedback] = useState<'correct' | 'incorrect' | null>(null)
  const [errorTypes, setErrorTypes] = useState({ mirror: 0, rotation: 0 })

  const generateTrial = useCallback((): Trial => {
    // Use simpler 3D block figures with fewer, easier rotation angles
    const figures = [
      'figure1', 'figure2', 'figure3', 'figure4', 'figure5'
    ]
    // Simplified to only 4 rotation angles (90-degree increments)
    const rotations = [0, 90, 180, 270]
    
    const figureType = figures[Math.floor(Math.random() * figures.length)]
    const targetRotation = rotations[Math.floor(Math.random() * rotations.length)]
    
    // For comparison options, we need different rotations
    const option1Rotation = rotations[Math.floor(Math.random() * rotations.length)]
    const option2Rotation = rotations[Math.floor(Math.random() * rotations.length)]
    
    // Randomly decide which option is correct (same figure) and which is different (mirrored)
    const correctOption: 1 | 2 = Math.random() > 0.5 ? 1 : 2
    
    const target: Shape = {
      type: figureType,
      rotation: targetRotation,
      isMirrored: false
    }
    
    const option1: Shape = {
      type: figureType,
      rotation: option1Rotation,
      isMirrored: correctOption === 2 // Mirror if this is the wrong option
    }
    
    const option2: Shape = {
      type: figureType,
      rotation: option2Rotation,
      isMirrored: correctOption === 1 // Mirror if this is the wrong option
    }
    
    return { target, option1, option2, correctOption }
  }, [])

  const startNextTrial = useCallback(() => {
    const maxTrials = gamePhase === 'practice' ? PRACTICE_TRIALS : TOTAL_TRIALS
    
    if (currentTrial >= maxTrials) {
      if (gamePhase === 'practice') {
        setPracticeComplete(true)
        return
      }
      
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
          totalTrials: TOTAL_TRIALS,
          rotationAngles: '0°, 90°, 180°, 270° (simplified)'
        }
      })
      return
    }

    setFeedback(null)
    const trial = generateTrial()
    setTrialData(trial)
    setStartTime(performance.now())
  }, [currentTrial, results, errorTypes, gamePhase, generateTrial, onComplete])

  useEffect(() => {
    if (gamePhase === 'test' || gamePhase === 'practice') {
      startNextTrial()
    }
  }, [gamePhase])

  const handleResponse = useCallback((selectedOption: 1 | 2) => {
    if (!trialData || feedback) return

    const reactionTime = performance.now() - startTime
    const correct = selectedOption === trialData.correctOption
    
    // Determine error type
    let errorType = 'correct'
    if (!correct) {
      const selectedShape = selectedOption === 1 ? trialData.option1 : trialData.option2
      if (selectedShape.isMirrored) {
        errorType = 'mirror'
        setErrorTypes(prev => ({ ...prev, mirror: prev.mirror + 1 }))
      } else {
        errorType = 'rotation'
        setErrorTypes(prev => ({ ...prev, rotation: prev.rotation + 1 }))
      }
    }

    const trialResult: TrialResult = {
      stimulus: `${trialData.target.type}@${trialData.target.rotation}° | Option1:${trialData.option1.rotation}°${trialData.option1.isMirrored ? 'M' : ''} Option2:${trialData.option2.rotation}°${trialData.option2.isMirrored ? 'M' : ''}`,
      response: `option${selectedOption}`,
      correct,
      reactionTime,
      trialType: errorType,
      status: correct ? 1 : 2
    }

    setResults(prev => [...prev, trialResult])
    setFeedback(correct ? 'correct' : 'incorrect')
    setCurrentTrial(prev => prev + 1)

    setTimeout(() => {
      startNextTrial()
    }, 800)
  }, [trialData, feedback, startTime, startNextTrial])

  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      if (!trialData || feedback) return
      
      const key = event.key.toLowerCase()
      if (key === '1' || key === 'z') handleResponse(1)  // 1 or Z for left option
      if (key === '2' || key === 'm') handleResponse(2)  // 2 or M for right option
    }

    window.addEventListener('keydown', handleKeyPress)
    return () => window.removeEventListener('keydown', handleKeyPress)
  }, [trialData, feedback, handleResponse])

  // Render 3D block figures (inspired by Shepard-Metzler mental rotation stimuli)
  const renderShape = (shape: Shape, size: number = 120, color: string = 'currentColor') => {
    // Define 3D block configurations (each represents connected cubes in 3D space)
    const figures: Record<string, React.ReactNode> = {
      figure1: (
        // L-shaped 3D configuration
        <g>
          {/* Base blocks */}
          <polygon points="50,80 90,60 90,100 50,120" fill={color} opacity="0.9" />
          <polygon points="50,80 50,120 10,100 10,60" fill={color} opacity="0.7" />
          <polygon points="10,60 50,80 90,60 50,40" fill={color} opacity="1" />
          
          {/* Vertical block */}
          <polygon points="50,40 90,20 90,60 50,80" fill={color} opacity="0.9" />
          <polygon points="50,40 50,80 10,60 10,20" fill={color} opacity="0.7" />
          <polygon points="10,20 50,40 90,20 50,0" fill={color} opacity="1" />
        </g>
      ),
      figure2: (
        // T-shaped 3D configuration
        <g>
          {/* Horizontal base */}
          <polygon points="30,70 60,55 60,85 30,100" fill={color} opacity="0.9" />
          <polygon points="60,55 90,70 90,100 60,85" fill={color} opacity="0.85" />
          <polygon points="30,70 60,55 90,70 60,85" fill={color} opacity="1" />
          
          {/* Vertical stem */}
          <polygon points="60,25 85,15 85,55 60,65" fill={color} opacity="0.9" />
          <polygon points="60,25 60,65 35,55 35,15" fill={color} opacity="0.7" />
          <polygon points="35,15 60,25 85,15 60,5" fill={color} opacity="1" />
        </g>
      ),
      figure3: (
        // Z-shaped 3D configuration
        <g>
          <polygon points="20,60 50,45 50,65 20,80" fill={color} opacity="0.9" />
          <polygon points="50,45 80,60 80,80 50,65" fill={color} opacity="0.85" />
          <polygon points="20,60 50,45 80,60 50,75" fill={color} opacity="1" />
          
          <polygon points="50,45 80,30 80,60 50,75" fill={color} opacity="0.9" />
          <polygon points="80,30 110,45 110,75 80,60" fill={color} opacity="0.85" />
          <polygon points="50,45 80,30 110,45 80,60" fill={color} opacity="1" />
        </g>
      ),
      figure4: (
        // Stepped configuration
        <g>
          <polygon points="40,90 70,75 70,95 40,110" fill={color} opacity="0.9" />
          <polygon points="40,90 40,110 10,95 10,75" fill={color} opacity="0.7" />
          <polygon points="10,75 40,90 70,75 40,60" fill={color} opacity="1" />
          
          <polygon points="70,55 100,40 100,75 70,90" fill={color} opacity="0.9" />
          <polygon points="70,55 70,90 40,75 40,40" fill={color} opacity="0.7" />
          <polygon points="40,40 70,55 100,40 70,25" fill={color} opacity="1" />
        </g>
      ),
      figure5: (
        // Corner configuration
        <g>
          <polygon points="60,60 90,45 90,75 60,90" fill={color} opacity="0.9" />
          <polygon points="60,60 60,90 30,75 30,45" fill={color} opacity="0.7" />
          <polygon points="30,45 60,60 90,45 60,30" fill={color} opacity="1" />
          
          <polygon points="60,30 90,15 90,45 60,60" fill={color} opacity="0.9" />
          <polygon points="30,45 60,30 60,60 30,75" fill={color} opacity="0.75" />
        </g>
      ),
      figure6: (
        // Diagonal step
        <g>
          <polygon points="30,80 60,65 60,85 30,100" fill={color} opacity="0.9" />
          <polygon points="60,65 90,50 90,70 60,85" fill={color} opacity="0.85" />
          <polygon points="30,80 60,65 90,50 60,35" fill={color} opacity="1" />
          
          <polygon points="60,35 90,20 90,50 60,65" fill={color} opacity="0.9" />
        </g>
      ),
      figure7: (
        // Extended L
        <g>
          <polygon points="35,75 65,60 65,90 35,105" fill={color} opacity="0.9" />
          <polygon points="35,75 35,105 5,90 5,60" fill={color} opacity="0.7" />
          <polygon points="5,60 35,75 65,60 35,45" fill={color} opacity="1" />
          
          <polygon points="65,60 95,45 95,75 65,90" fill={color} opacity="0.9" />
          <polygon points="65,30 95,15 95,45 65,60" fill={color} opacity="0.9" />
          <polygon points="65,30 65,60 35,45 35,15" fill={color} opacity="0.7" />
        </g>
      ),
      figure8: (
        // Cross-like
        <g>
          <polygon points="60,70 90,55 90,75 60,90" fill={color} opacity="0.9" />
          <polygon points="30,70 60,55 60,75 30,90" fill={color} opacity="0.85" />
          <polygon points="60,40 90,25 90,55 60,70" fill={color} opacity="0.9" />
          <polygon points="60,40 60,70 30,55 30,25" fill={color} opacity="0.7" />
          <polygon points="30,25 60,40 90,25 60,10" fill={color} opacity="1" />
        </g>
      ),
      figure9: (
        // Asymmetric bend
        <g>
          <polygon points="45,85 75,70 75,95 45,110" fill={color} opacity="0.9" />
          <polygon points="45,85 45,110 15,95 15,70" fill={color} opacity="0.7" />
          <polygon points="75,70 105,55 105,80 75,95" fill={color} opacity="0.85" />
          <polygon points="75,40 105,25 105,55 75,70" fill={color} opacity="0.9" />
          <polygon points="45,55 75,40 75,70 45,85" fill={color} opacity="0.8" />
        </g>
      ),
      figure10: (
        // Complex step
        <g>
          <polygon points="50,90 80,75 80,100 50,115" fill={color} opacity="0.9" />
          <polygon points="50,90 50,115 20,100 20,75" fill={color} opacity="0.7" />
          <polygon points="50,60 80,45 80,75 50,90" fill={color} opacity="0.9" />
          <polygon points="80,45 110,30 110,60 80,75" fill={color} opacity="0.85" />
          <polygon points="50,30 80,15 80,45 50,60" fill={color} opacity="0.9" />
          <polygon points="50,30 50,60 20,45 20,15" fill={color} opacity="0.7" />
        </g>
      )
    }

    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 120 120"
        className="inline-block"
        style={{
          transform: `rotate(${shape.rotation}deg) scaleX(${shape.isMirrored ? -1 : 1})`,
          filter: 'drop-shadow(2px 4px 8px rgba(0,0,0,0.25))'
        }}
      >
        {figures[shape.type] || figures.figure1}
      </svg>
    )
  }

  const stats = {
    accuracy: results.length > 0 ? Math.round((results.filter(r => r.correct).length / results.length) * 100) : 0,
    avgRT: results.length > 0 ? Math.round(results.reduce((sum, r) => sum + r.reactionTime, 0) / results.length) : 0,
    errors: results.length > 0 ? results.length - results.filter(r => r.correct).length : 0,
    errorRate: results.length > 0 ? Math.round(((results.length - results.filter(r => r.correct).length) / results.length) * 100) : 0
  }

  const handleInstructionNext = () => {
    if (instructionPage < 3) {
      setInstructionPage(prev => prev + 1)
    } else {
      setGamePhase('practice')
    }
  }

  const handleInstructionPrev = () => {
    if (instructionPage > 0) {
      setInstructionPage(prev => prev - 1)
    }
  }

  // Instruction Pages
  // Practice complete transition screen
  if (practiceComplete) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 flex items-center justify-center p-4">
        <Card 
          className="max-w-2xl w-full p-8 shadow-2xl cursor-pointer hover:shadow-3xl transition-all border-2 border-green-500/30 bg-green-500/5"
          onClick={() => {
            setPracticeComplete(false)
            setGamePhase('test')
            setCurrentTrial(0)
            setResults([])
            setErrorTypes({ mirror: 0, rotation: 0 })
          }}
        >
          <div className="text-center space-y-6">
            <div className="flex justify-center">
              <div className="p-4 bg-green-100 dark:bg-green-900 rounded-full">
                <Check size={64} weight="bold" className="text-green-600 dark:text-green-400" />
              </div>
            </div>
            <div className="space-y-2">
              <h2 className="text-3xl font-bold">Trial Session Completed!</h2>
              <p className="text-xl text-muted-foreground">
                You are now entering the actual game.
              </p>
            </div>
            <div className="bg-muted/50 p-6 rounded-lg space-y-2">
              <p className="text-lg font-semibold">
                Your training trial is completed. The real test begins now. Focus!
              </p>
              <p className="text-sm text-muted-foreground">
                You'll complete {TOTAL_TRIALS} trials testing your mental rotation abilities.
              </p>
            </div>
            <p className="text-primary font-semibold animate-pulse">
              Click anywhere to continue
            </p>
          </div>
        </Card>
      </div>
    )
  }

  if (gamePhase === 'instructions') {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="max-w-3xl w-full p-8">
          <AnimatePresence mode="wait">
            <motion.div
              key={instructionPage}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              {instructionPage === 0 && (
                <div className="space-y-6">
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-3 mb-2">
                      <Cube size={40} weight="duotone" className="text-primary" />
                      <h1 className="text-4xl font-bold">Mental Rotation Test</h1>
                    </div>
                    <Badge variant="outline" className="mb-4">Spatial Reasoning</Badge>
                  </div>
                  
                  <div className="space-y-4 text-lg">
                    <p>
                      Welcome to the <strong>Mental Rotation Test</strong>, a classic measure of your 
                      spatial visualization abilities.
                    </p>
                    
                    <p>
                      This test assesses your ability to mentally rotate 3D block figures and identify 
                      which rotated version matches the target figure. The figures will be rotated at 
                      simple 90-degree angles to make it easier.
                    </p>

                    <div className="bg-muted/50 p-4 rounded-lg">
                      <p className="font-semibold mb-2">What you'll do:</p>
                      <ul className="list-disc list-inside space-y-2">
                        <li>See a gray target 3D figure at the top</li>
                        <li>See two red 3D figures at the bottom (at different rotations)</li>
                        <li>Click the red figure that matches the gray one</li>
                      </ul>
                    </div>

                    <div className="border-l-4 border-yellow-500 pl-4 py-2">
                      <p className="text-base">
                        <strong>Important:</strong> One red figure is the <strong>same object rotated</strong>, 
                        the other is a <strong>mirror image</strong> (reflection). Mirror images are wrong!
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {instructionPage === 1 && (
                <div className="space-y-6">
                  <div className="text-center">
                    <h1 className="text-4xl font-bold mb-2">How to Play</h1>
                    <Badge variant="outline" className="mb-4">Instructions</Badge>
                  </div>
                  
                  <div className="space-y-4 text-lg">
                    <div className="bg-muted/50 p-4 rounded-lg">
                      <p className="font-semibold mb-3">Step-by-Step:</p>
                      <ol className="list-decimal list-inside space-y-3">
                        <li>
                          <strong>Look at the gray 3D figure:</strong> This is your target at the top
                        </li>
                        <li>
                          <strong>Compare the two red figures:</strong> Both are at the bottom
                        </li>
                        <li>
                          <strong>Mentally rotate:</strong> Figure out which red figure is the same as the gray one (just rotated)
                        </li>
                        <li>
                          <strong>Click your choice:</strong> Click on the matching red figure (or press 1/2 keys)
                        </li>
                      </ol>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="border border-green-500/30 bg-green-500/5 p-3 rounded">
                        <h3 className="font-semibold text-green-600 mb-1 flex items-center gap-2">
                          <Check size={20} weight="bold" />
                          Correct Choice
                        </h3>
                        <p className="text-sm">The red figure that is the SAME object as the gray one, just rotated to a different angle</p>
                      </div>
                      <div className="border border-red-500/30 bg-red-500/5 p-3 rounded">
                        <h3 className="font-semibold text-red-600 mb-1 flex items-center gap-2">
                          <XCircle size={20} weight="bold" />
                          Wrong Choice
                        </h3>
                        <p className="text-sm">The red figure that is a MIRROR IMAGE (reflection) - it cannot be rotated to match</p>
                      </div>
                    </div>

                    <p className="text-muted-foreground text-base">
                      <strong>Tip:</strong> Imagine physically rotating the gray figure in 3D space. 
                      Can it match one of the red figures?
                    </p>
                  </div>
                </div>
              )}

              {instructionPage === 2 && (
                <div className="space-y-6">
                  <div className="text-center">
                    <h1 className="text-4xl font-bold mb-2">Test Details</h1>
                    <Badge variant="outline" className="mb-4">What to Expect</Badge>
                  </div>
                  
                  <div className="space-y-4 text-lg">
                    <div className="bg-muted/50 p-4 rounded-lg">
                      <p className="font-semibold mb-3">Test Structure:</p>
                      <ul className="space-y-2">
                        <li className="flex items-start gap-2">
                          <Badge variant="outline" className="bg-yellow-100 text-yellow-800 border-yellow-300">Practice</Badge>
                          <span>2 practice trials to get familiar with the task</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <Badge variant="outline">Test</Badge>
                          <span>15 test trials (simplified with 90° rotations)</span>
                        </li>
                      </ul>
                    </div>

                    <div className="bg-primary/5 border border-primary/20 p-4 rounded-lg">
                      <p className="font-semibold mb-2">Keyboard Shortcuts:</p>
                      <div className="flex gap-4 justify-center">
                        <div className="text-center">
                          <kbd className="px-4 py-2 bg-blue-600 text-white rounded font-bold text-xl">1</kbd>
                          <p className="text-sm mt-1">Left Option</p>
                        </div>
                        <div className="text-center">
                          <kbd className="px-4 py-2 bg-blue-600 text-white rounded font-bold text-xl">2</kbd>
                          <p className="text-sm mt-1">Right Option</p>
                        </div>
                      </div>
                      <p className="text-xs text-center text-muted-foreground mt-2">Or simply click on your choice</p>
                    </div>

                    <div className="border-l-4 border-blue-500 pl-4 py-2">
                      <p className="text-base">
                        <strong>Scoring:</strong> You'll receive feedback on your accuracy, average reaction time, 
                        and error types. Higher accuracy and faster correct responses indicate better spatial 
                        reasoning ability.
                      </p>
                    </div>

                    <p className="text-center text-muted-foreground text-base mt-6">
                      Ready to start? You'll begin with a <strong className="text-yellow-600">practice trial</strong>.
                    </p>
                  </div>
                </div>
              )}

              {instructionPage === 3 && (
                <div className="space-y-6">
                  <div className="text-center mb-4">
                    <Badge className="bg-yellow-100 text-yellow-800 border-yellow-300 dark:bg-yellow-900 dark:text-yellow-100 text-lg px-4 py-2">
                      🎯 About the Practice Trials
                    </Badge>
                  </div>
                  
                  <div className="space-y-4 text-lg">
                    <p>
                      Before the actual test, you'll complete <strong>2 practice trials</strong> to get comfortable with mental rotation.
                    </p>
                    
                    <div className="bg-muted/50 p-6 rounded-lg space-y-3">
                      <p className="font-semibold mb-3">During practice, you will see:</p>
                      <div className="flex items-start gap-3">
                        <span className="text-2xl text-green-600">✓</span>
                        <p className="text-base">
                          A <strong className="text-green-600">green checkmark</strong> when you correctly identify matching shapes
                        </p>
                      </div>
                      <div className="flex items-start gap-3">
                        <span className="text-2xl text-red-600">✗</span>
                        <p className="text-base">
                          A <strong className="text-red-600">red X</strong> when your answer is incorrect
                        </p>
                      </div>
                      <div className="flex items-start gap-3">
                        <span className="text-2xl">🔄</span>
                        <p className="text-base">
                          The card border will <strong>change color</strong> to provide instant feedback
                        </p>
                      </div>
                    </div>

                    <div className="bg-primary/10 p-4 rounded-lg border-l-4 border-primary">
                      <p className="text-base font-semibold">
                        💡 Strategy Tip: Mentally rotate one shape to see if it matches the other. Mirror images can't be rotated to match!
                      </p>
                    </div>

                    <p className="text-center text-muted-foreground text-base mt-4">
                      Use these practice trials to develop your mental rotation strategy before the scored test.
                    </p>
                  </div>
                </div>
              )}

              <div className="flex justify-between mt-8 pt-6 border-t">
                <Button
                  onClick={handleInstructionPrev}
                  variant="outline"
                  disabled={instructionPage === 0}
                >
                  Previous
                </Button>
                
                <div className="flex gap-2">
                  {[0, 1, 2, 3].map(page => (
                    <div
                      key={page}
                      className={`h-2 w-2 rounded-full transition-colors ${
                        page === instructionPage ? 'bg-primary' : 'bg-muted'
                      }`}
                    />
                  ))}
                </div>

                <Button onClick={handleInstructionNext}>
                  {instructionPage === 3 ? 'Start Practice' : 'Next'}
                </Button>
              </div>
            </motion.div>
          </AnimatePresence>
        </Card>
      </div>
    )
  }

  const maxTrials = gamePhase === 'practice' ? PRACTICE_TRIALS : TOTAL_TRIALS

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 flex flex-col">
      <div className="p-6 border-b border-border/50 backdrop-blur-sm bg-card/50 flex items-center justify-between">
        <div className="flex-1 space-y-3">
          <div className="flex items-center gap-4">
            {gamePhase === 'practice' && (
              <Badge variant="outline" className="bg-yellow-100 text-yellow-800 border-yellow-300 dark:bg-yellow-900 dark:text-yellow-100">
                Practice
              </Badge>
            )}
            <Progress value={(currentTrial / maxTrials) * 100} className="h-2 flex-1" />
            <span className="text-sm font-medium text-muted-foreground min-w-20 text-right">
              {currentTrial}/{maxTrials}
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
                {stats.errors} ({stats.errorRate}%) | M:{errorTypes.mirror} R:{errorTypes.rotation}
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
          {trialData && (
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
                  <p className="text-lg font-semibold text-muted-foreground mb-2">
                    Which red object matches the grey one when rotated?
                  </p>
                  <p className="text-sm text-muted-foreground">
                    The shapes rotate in 90° steps. Imagine turning the grey shape.
                  </p>
                </div>

                {/* Target letter at top (gray) */}
                <motion.div
                  initial={{ y: -50, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.1 }}
                  className="flex justify-center mb-12"
                >
                  <Card className="p-8 bg-white dark:bg-gray-800 border-4 border-gray-400">
                    <div className="text-gray-600 dark:text-gray-400">
                      {renderShape(trialData.target, 200, '#6b7280')}
                    </div>
                  </Card>
                </motion.div>

                {/* Two comparison options at bottom (red) */}
                <div className="grid grid-cols-2 gap-8 mb-8">
                  <motion.div
                    initial={{ x: -100, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: 0.2 }}
                    className="flex flex-col items-center"
                  >
                    <button
                      onClick={() => handleResponse(1)}
                      disabled={feedback !== null}
                      className={`p-8 bg-white dark:bg-gray-800 border-4 rounded-lg transition-all ${
                        feedback === null 
                          ? 'border-red-500 hover:border-red-600 hover:scale-105 cursor-pointer'
                          : feedback === 'correct' && trialData.correctOption === 1
                          ? 'border-green-500 bg-green-50 dark:bg-green-900/20'
                          : feedback === 'incorrect' && trialData.correctOption !== 1
                          ? 'border-red-600 bg-red-50 dark:bg-red-900/20'
                          : 'border-red-500'
                      }`}
                    >
                      <div className="text-red-600 dark:text-red-500">
                        {renderShape(trialData.option1, 160, '#dc2626')}
                      </div>
                    </button>
                    <Badge variant="outline" className="mt-4 text-sm">Option 1 (Press 1)</Badge>
                  </motion.div>

                  <motion.div
                    initial={{ x: 100, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: 0.2 }}
                    className="flex flex-col items-center"
                  >
                    <button
                      onClick={() => handleResponse(2)}
                      disabled={feedback !== null}
                      className={`p-8 bg-white dark:bg-gray-800 border-4 rounded-lg transition-all ${
                        feedback === null 
                          ? 'border-red-500 hover:border-red-600 hover:scale-105 cursor-pointer'
                          : feedback === 'correct' && trialData.correctOption === 2
                          ? 'border-green-500 bg-green-50 dark:bg-green-900/20'
                          : feedback === 'incorrect' && trialData.correctOption !== 2
                          ? 'border-red-600 bg-red-50 dark:bg-red-900/20'
                          : 'border-red-500'
                      }`}
                    >
                      <div className="text-red-600 dark:text-red-500">
                        {renderShape(trialData.option2, 160, '#dc2626')}
                      </div>
                    </button>
                    <Badge variant="outline" className="mt-4 text-sm">Option 2 (Press 2)</Badge>
                  </motion.div>
                </div>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="p-6 border-t border-border/50 backdrop-blur-sm bg-card/50">
        <p className="text-center text-sm text-muted-foreground">
          Press <kbd className="px-2 py-1 bg-muted rounded">1</kbd> for Left or{' '}
          <kbd className="px-2 py-1 bg-muted rounded">2</kbd> for Right
        </p>
      </div>
    </div>
  )
}
