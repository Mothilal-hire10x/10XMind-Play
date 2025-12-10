import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { TrialResult, GameSummary } from '@/lib/types'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowRight, RotateCcw, Check } from 'lucide-react'

const INITIAL_SPAN = 2
const MAX_SPAN = 9
const DIGIT_DISPLAY_DURATION = 1000
const PRACTICE_TRIALS = 5 // Number of practice trials before actual test

interface DigitSpanTaskProps {
  onComplete: (results: TrialResult[], summary: GameSummary) => void
  onExit: () => void
  defaultMode?: TrialType
}

type GamePhase = 'modeSelection' | 'instructions' | 'practice' | 'test'
type TrialType = 'forward' | 'backward'

interface Trial {
  sequence: number[]
  userInput: number[]
  correct: boolean
  reactionTime: number
  spanLength: number
  type: TrialType
  isPractice?: boolean
}

export function DigitSpanTask({ onComplete, onExit, defaultMode }: DigitSpanTaskProps) {
  const [gamePhase, setGamePhase] = useState<GamePhase>(defaultMode ? 'instructions' : 'modeSelection')
  const [instructionPage, setInstructionPage] = useState(0)
  const [selectedMode, setSelectedMode] = useState<TrialType | null>(defaultMode || null)
  const [practiceComplete, setPracticeComplete] = useState(false)
  
  const [currentSpan, setCurrentSpan] = useState(INITIAL_SPAN)
  const [currentSequence, setCurrentSequence] = useState<number[]>([])
  const [userInput, setUserInput] = useState<number[]>([])
  const [isDisplaying, setIsDisplaying] = useState(false)
  const [currentDigitIndex, setCurrentDigitIndex] = useState(0)
  const [isInputPhase, setIsInputPhase] = useState(false)
  const [trialStartTime, setTrialStartTime] = useState(0)
  
  const [results, setResults] = useState<Trial[]>([])
  const [consecutiveFailures, setConsecutiveFailures] = useState(0)
  const [consecutiveSuccesses, setConsecutiveSuccesses] = useState(0)
  const [maxSpan, setMaxSpan] = useState(INITIAL_SPAN - 1)
  const [feedback, setFeedback] = useState<'correct' | 'incorrect' | null>(null)
  const [practiceTrialCount, setPracticeTrialCount] = useState(0)
  const [showGetReady, setShowGetReady] = useState(true)

  const generateSequence = (length: number): number[] => {
    const sequence: number[] = []
    let consecutiveCount = 0
    let lastConsecutiveDirection: 'up' | 'down' | null = null
    
    while (sequence.length < length) {
      const digit = Math.floor(Math.random() * 10)
      const lastDigit = sequence[sequence.length - 1]
      const secondLastDigit = sequence[sequence.length - 2]
      
      // Rule 1: Don't allow same digit more than once consecutively (no 2,2 or 3,3,3)
      if (lastDigit !== undefined && digit === lastDigit) {
        continue
      }
      
      // Rule 2: Don't allow more than 2 consecutive digits in sequence (like 3,4,5 or 5,4,3)
      if (lastDigit !== undefined) {
        const isConsecutiveUp = digit === lastDigit + 1
        const isConsecutiveDown = digit === lastDigit - 1
        
        if (isConsecutiveUp || isConsecutiveDown) {
          const currentDirection = isConsecutiveUp ? 'up' : 'down'
          
          // Check if we already have 2 consecutive digits in same direction
          if (secondLastDigit !== undefined) {
            const wasConsecutiveUp = lastDigit === secondLastDigit + 1
            const wasConsecutiveDown = lastDigit === secondLastDigit - 1
            const prevDirection = wasConsecutiveUp ? 'up' : wasConsecutiveDown ? 'down' : null
            
            // If continuing the same consecutive pattern, reject
            if (prevDirection === currentDirection) {
              continue
            }
          }
        }
      }
      
      sequence.push(digit)
    }
    
    return sequence
  }

  const startNewTrial = (isPractice = false, spanOverride?: number) => {
    const spanToUse = spanOverride !== undefined ? spanOverride : currentSpan
    const sequence = generateSequence(spanToUse)
    console.log('Starting new trial with sequence:', sequence, 'span:', spanToUse)
    setCurrentSequence(sequence)
    setUserInput([])
    setFeedback(null)
    setShowGetReady(true)
    setCurrentDigitIndex(0)
    setIsInputPhase(false)
    
    // Show "Get ready" message for 2 seconds before displaying digits
    setTimeout(() => {
      setShowGetReady(false)
      setIsDisplaying(true)
      setTrialStartTime(Date.now())
    }, 2000)
  }

  useEffect(() => {
    if (gamePhase === 'practice' && !isDisplaying && !isInputPhase) {
      startNewTrial(true)
    }
  }, [gamePhase])

  useEffect(() => {
    if (gamePhase === 'test' && !isDisplaying && !isInputPhase && results.length === 0) {
      startNewTrial()
    }
  }, [gamePhase])

  useEffect(() => {
    if (isDisplaying && currentDigitIndex < currentSequence.length) {
      console.log('Displaying digit:', currentSequence[currentDigitIndex], 'index:', currentDigitIndex, 'of', currentSequence.length)
      const timer = setTimeout(() => {
        setCurrentDigitIndex(prev => prev + 1)
      }, DIGIT_DISPLAY_DURATION)
      return () => clearTimeout(timer)
    } else if (isDisplaying && currentDigitIndex >= currentSequence.length) {
      console.log('Sequence display complete, moving to input phase')
      const timer = setTimeout(() => {
        setIsDisplaying(false)
        setIsInputPhase(true)
      }, 500)
      return () => clearTimeout(timer)
    }
  }, [isDisplaying, currentDigitIndex, currentSequence.length])

  const handleDigitClick = (digit: number) => {
    if (!isInputPhase) return
    setUserInput(prev => [...prev, digit])
  }

  const handleClear = () => {
    setUserInput([])
  }

  const handleBackspace = () => {
    setUserInput(prev => prev.slice(0, -1))
  }

  const handleSubmit = () => {
    if (userInput.length === 0 || !selectedMode) return

    const reactionTime = Date.now() - trialStartTime
    const expectedSequence = selectedMode === 'forward' 
      ? currentSequence 
      : [...currentSequence].reverse()
    
    const correct = userInput.length === expectedSequence.length &&
      userInput.every((digit, idx) => digit === expectedSequence[idx])

    const trial: Trial = {
      sequence: currentSequence,
      userInput,
      correct,
      reactionTime,
      spanLength: currentSpan,
      type: selectedMode,
      isPractice: gamePhase === 'practice'
    }

    // Show feedback
    setFeedback(correct ? 'correct' : 'incorrect')
    setIsInputPhase(false)

    // Wait for feedback display then continue
    setTimeout(() => {
      if (gamePhase === 'practice') {
        const newPracticeCount = practiceTrialCount + 1
        setPracticeTrialCount(newPracticeCount)
        
        if (newPracticeCount >= PRACTICE_TRIALS) {
          setPracticeComplete(true)
          return
        }
        startNewTrial(true)
        return
      }

      setResults(prev => [...prev, trial])

      if (correct) {
        setConsecutiveSuccesses(prev => prev + 1)
        setConsecutiveFailures(0)

        if (consecutiveSuccesses + 1 >= 2) {
          const newSpan = currentSpan + 1
          
          if (newSpan > MAX_SPAN) {
            setMaxSpan(currentSpan)
            finishGame()
            return
          } else {
            setMaxSpan(currentSpan)
            setCurrentSpan(newSpan)
            setConsecutiveSuccesses(0)
            startNewTrial(false, newSpan)
            return
          }
        }
      } else {
        setConsecutiveFailures(prev => prev + 1)
        setConsecutiveSuccesses(0)

        if (consecutiveFailures + 1 >= 2) {
          setMaxSpan(Math.max(currentSpan - 1, INITIAL_SPAN - 1))
          finishGame()
          return
        }
      }

      startNewTrial()
    }, 1500) // Show feedback for 1.5 seconds
  }

  const finishGame = () => {
    if (!selectedMode) return
    
    // Include the current trial in the results
    const allResults = results
    const totalTrials = allResults.length
    const totalCorrect = allResults.filter(r => r.correct).length
    const errorCount = totalTrials - totalCorrect
    const errorRate = totalTrials > 0 ? (errorCount / totalTrials) * 100 : 0
    
    const avgRT = allResults.length > 0
      ? allResults.reduce((sum, r) => sum + r.reactionTime, 0) / allResults.length
      : 0

    // Calculate the correct max span: highest span length where user got at least one correct answer
    const correctResults = allResults.filter(r => r.correct)
    const highestCorrectSpan = correctResults.length > 0 
      ? Math.max(...correctResults.map(r => r.spanLength))
      : INITIAL_SPAN - 1
    
    const finalMaxSpan = highestCorrectSpan

    const trialResults: TrialResult[] = allResults.map((trial, idx) => ({
      stimulus: trial.sequence.join(' '),
      response: trial.userInput.join(' '),
      correct: trial.correct,
      reactionTime: trial.reactionTime,
      trialType: trial.type,
      status: trial.correct ? 1 : 2
    }))

    // Calculate score from max span (no bonus)
    const totalScore = finalMaxSpan

    const summary: GameSummary = {
      score: totalScore,
      accuracy: totalTrials > 0 ? (totalCorrect / totalTrials) * 100 : 0,
      reactionTime: avgRT,
      errorCount,
      errorRate,
      details: {
        totalTrials,
        maxSpan: finalMaxSpan,
        mode: selectedMode,
        correctSequences: totalCorrect,
        customMessage: `Max Span: ${finalMaxSpan} | Total Correct: ${totalCorrect} | Final Score: ${totalScore}`
      }
    }

    onComplete(trialResults, summary)
  }

  const handleModeSelect = (mode: TrialType) => {
    setSelectedMode(mode)
    setGamePhase('instructions')
  }

  const handleInstructionNext = () => {
    if (instructionPage < 2) {
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

  // Practice Complete Transition Screen
  if (practiceComplete) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 flex items-center justify-center p-4">
        <Card className="max-w-2xl w-full p-8 shadow-2xl cursor-pointer hover:shadow-3xl transition-all border-2 border-green-500/30 bg-green-500/5" onClick={() => {
          setPracticeComplete(false)
          setGamePhase('test')
          setCurrentSpan(INITIAL_SPAN)
          setConsecutiveFailures(0)
          setConsecutiveSuccesses(0)
          setPracticeTrialCount(0)
        }}>
          <div className="text-center space-y-6">
            <div className="flex justify-center">
              <div className="p-4 bg-green-100 dark:bg-green-900 rounded-full">
                <Check className="w-16 h-16 text-green-600 dark:text-green-400" />
              </div>
            </div>
            <div className="space-y-2">
              <h2 className="text-3xl font-bold">Trial Over!</h2>
              <p className="text-xl text-muted-foreground">
                Now concentrate for the real game.
              </p>
            </div>
            <div className="bg-muted/50 p-6 rounded-lg space-y-3">
              <p className="text-xl font-bold text-primary">
                Your training trial is completed. The real test begins now. Focus!
              </p>
              <p className="text-sm text-muted-foreground">
                The test will continue until you make 2 consecutive errors.
              </p>
            </div>
            <p className="text-primary font-semibold animate-pulse text-lg">
              Click to continue
            </p>
          </div>
        </Card>
      </div>
    )
  }

  // Mode Selection Screen
  if (gamePhase === 'modeSelection') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 flex items-center justify-center p-4">
        <Card className="max-w-4xl w-full p-8 shadow-2xl">
          <div className="space-y-8">
            <div className="text-center space-y-2">
              <h1 className="text-4xl font-bold mb-2">Digit Span Test</h1>
              <Badge variant="outline" className="mb-4">Memory Assessment</Badge>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Choose your test mode. Both tests measure working memory capacity, but in different ways.
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              {/* Forward Mode */}
              <motion.div
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Card 
                  className="p-6 cursor-pointer hover:border-blue-500 hover:shadow-lg transition-all h-full border-2"
                  onClick={() => handleModeSelect('forward')}
                >
                  <div className="space-y-4">
                    <div className="flex items-center justify-center">
                      <div className="p-4 bg-blue-100 dark:bg-blue-900 rounded-full">
                        <ArrowRight className="w-8 h-8 text-blue-600 dark:text-blue-400" />
                      </div>
                    </div>
                    
                    <div className="text-center space-y-2">
                      <h2 className="text-2xl font-bold text-blue-600 dark:text-blue-400">Digit Span</h2>
                      <p className="text-sm text-muted-foreground font-medium">Forward Order</p>
                    </div>

                    <div className="space-y-3 text-sm">
                      <p className="text-center">
                        Repeat digits in the <strong>same order</strong> they were presented.
                      </p>
                      
                      <div className="bg-muted/50 p-4 rounded-lg space-y-2">
                        <div className="font-semibold text-center">Example:</div>
                        <div className="flex items-center justify-center gap-2 text-lg">
                          <span className="text-blue-600 font-mono">3 7 2</span>
                          <ArrowRight className="w-4 h-4" />
                          <span className="text-green-600 font-mono">3 7 2</span>
                        </div>
                      </div>

                      <ul className="space-y-1 text-muted-foreground">
                        <li>✓ Tests immediate recall</li>
                        <li>✓ Measures short-term memory</li>
                        <li>✓ Starts at 2 digits</li>
                      </ul>
                    </div>

                    <Button className="w-full bg-blue-600 hover:bg-blue-700">
                      Select Forward Mode
                    </Button>
                  </div>
                </Card>
              </motion.div>

              {/* Backward Mode */}
              <motion.div
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Card 
                  className="p-6 cursor-pointer hover:border-purple-500 hover:shadow-lg transition-all h-full border-2"
                  onClick={() => handleModeSelect('backward')}
                >
                  <div className="space-y-4">
                    <div className="flex items-center justify-center">
                      <div className="p-4 bg-purple-100 dark:bg-purple-900 rounded-full">
                        <RotateCcw className="w-8 h-8 text-purple-600 dark:text-purple-400" />
                      </div>
                    </div>
                    
                    <div className="text-center space-y-2">
                      <h2 className="text-2xl font-bold text-purple-600 dark:text-purple-400">Reverse Digit Span</h2>
                      <p className="text-sm text-muted-foreground font-medium">Backward Order</p>
                    </div>

                    <div className="space-y-3 text-sm">
                      <p className="text-center">
                        Repeat digits in <strong>reverse order</strong> from how they were shown.
                      </p>
                      
                      <div className="bg-muted/50 p-4 rounded-lg space-y-2">
                        <div className="font-semibold text-center">Example:</div>
                        <div className="flex items-center justify-center gap-2 text-lg">
                          <span className="text-purple-600 font-mono">3 7 2</span>
                          <RotateCcw className="w-4 h-4" />
                          <span className="text-green-600 font-mono">2 7 3</span>
                        </div>
                      </div>

                      <ul className="space-y-1 text-muted-foreground">
                        <li>✓ Tests working memory</li>
                        <li>✓ Requires mental manipulation</li>
                        <li>✓ More challenging task</li>
                      </ul>
                    </div>

                    <Button className="w-full bg-purple-600 hover:bg-purple-700">
                      Select Reverse Mode
                    </Button>
                  </div>
                </Card>
              </motion.div>
            </div>

            <div className="flex justify-center pt-4">
              <Button
                onClick={onExit}
                variant="outline"
                className="text-red-600 hover:text-red-700"
              >
                Exit to Dashboard
              </Button>
            </div>
          </div>
        </Card>
      </div>
    )
  }

  if (gamePhase === 'instructions') {
    const modeColor = selectedMode === 'forward' ? 'blue' : 'purple'
    const modeName = selectedMode === 'forward' ? 'Digit Span' : 'Reverse Digit Span'
    const modeDescription = selectedMode === 'forward' ? 'same order' : 'reverse order'

    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 flex items-center justify-center p-4">
        <Card className="max-w-3xl w-full p-8 shadow-2xl">
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
                    <h1 className="text-4xl font-bold mb-2">{modeName}</h1>
                    <Badge variant="outline" className="mb-4">Memory Assessment</Badge>
                  </div>
                  
                  <div className="space-y-4 text-lg">
                    <p>
                      Welcome to the <strong>{modeName}</strong> test, a classic assessment of your 
                      working memory capacity.
                    </p>
                    
                    <p>
                      This test measures how many digits you can remember and repeat back in the 
                      <strong> {modeDescription}</strong>. 
                      It's widely used in cognitive psychology and neuropsychology 
                      to assess {selectedMode === 'forward' ? 'short-term' : 'working'} memory function.
                    </p>

                    <div className="bg-muted/50 p-4 rounded-lg">
                      <p className="font-semibold mb-2">What you'll do:</p>
                      <ul className="list-disc list-inside space-y-2">
                        <li>Watch sequences of digits appear one at a time</li>
                        <li>Remember the digits in order</li>
                        <li>Repeat them back in <strong>{modeDescription}</strong></li>
                      </ul>
                    </div>

                    {selectedMode === 'backward' && (
                      <div className="border-l-4 border-purple-500 pl-4 py-2 bg-purple-50 dark:bg-purple-900/20">
                        <p className="text-base">
                          <strong>Note:</strong> This reverse version is more challenging as it requires 
                          you to mentally reverse the sequence before entering it.
                        </p>
                      </div>
                    )}
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
                          <strong>Watch carefully:</strong> Digits will appear one at a time on screen 
                          (1 second each)
                        </li>
                        <li>
                          <strong>Remember the sequence:</strong> Pay attention to the order
                        </li>
                        <li>
                          <strong>Enter your answer:</strong> Click the digits in <strong>{modeDescription}</strong>
                        </li>
                        <li>
                          <strong>Submit:</strong> Click the green checkmark when you're done
                        </li>
                      </ol>
                    </div>

                    <div className={`border-l-4 border-${modeColor}-500 pl-4 py-2`}>
                      <p className="text-base">
                        <strong>Example:</strong> If you see 
                        <span className="font-mono text-lg mx-2">5 8 3</span>
                        you should enter 
                        <span className="font-mono text-lg mx-2">
                          {selectedMode === 'forward' ? '5 8 3' : '3 8 5'}
                        </span>
                      </p>
                    </div>

                    <p className="text-muted-foreground text-base">
                      You can click "Clear" to erase your current input and start over for that trial.
                    </p>
                  </div>
                </div>
              )}

              {instructionPage === 2 && (
                <div className="space-y-6">
                  <div className="text-center">
                    <h1 className="text-4xl font-bold mb-2">Progression & Scoring</h1>
                    <Badge variant="outline" className="mb-4">How It Works</Badge>
                  </div>
                  
                  <div className="space-y-4 text-lg">
                    <div className="bg-muted/50 p-4 rounded-lg">
                      <p className="font-semibold mb-3">Adaptive Difficulty:</p>
                      <ul className="space-y-2">
                        <li className="flex items-start gap-2">
                          <span className="text-green-600 font-bold">✓</span>
                          <span><strong>Get 2 correct in a row:</strong> Span increases by 1 digit</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-red-600 font-bold">✗</span>
                          <span><strong>Get 2 wrong in a row:</strong> Test ends</span>
                        </li>
                      </ul>
                    </div>

                    <div className={`border border-${modeColor}-500/30 bg-${modeColor}-500/5 p-4 rounded`}>
                      <h3 className={`font-semibold text-${modeColor}-600 mb-2`}>Your Digit Span Score</h3>
                      <p className="text-base">
                        The maximum sequence length you successfully remember represents your 
                        {selectedMode === 'forward' ? ' short-term' : ' working'} memory span. 
                        Most people score between 5-9 digits{selectedMode === 'forward' ? ' forward' : ''}, 
                        {selectedMode === 'backward' ? ' and typically 2 fewer digits backward than forward' : ''}.
                      </p>
                    </div>

                    <div className="border-l-4 border-yellow-500 pl-4 py-2">
                      <p className="text-base">
                        <strong>Scoring:</strong> Higher scores indicate better 
                        {selectedMode === 'forward' ? ' immediate recall' : ' working memory'} capacity.
                      </p>
                    </div>

                    <p className="text-center text-muted-foreground text-base mt-6">
                      First, you'll complete a <strong className="text-yellow-600">practice trial</strong> to 
                      get familiar with the task.
                    </p>
                  </div>
                </div>
              )}

              <div className="flex justify-between mt-8 pt-6 border-t">
                <div className="flex gap-2">
                  <Button
                    onClick={onExit}
                    variant="outline"
                    className="text-red-600 hover:text-red-700"
                  >
                    Exit
                  </Button>
                  <Button
                    onClick={handleInstructionPrev}
                    variant="outline"
                    disabled={instructionPage === 0}
                  >
                    Previous
                  </Button>
                </div>
                
                <div className="flex gap-2">
                  {[0, 1, 2].map(page => (
                    <div
                      key={page}
                      className={`h-2 w-2 rounded-full transition-colors ${
                        page === instructionPage ? 'bg-primary' : 'bg-muted'
                      }`}
                    />
                  ))}
                </div>

                <Button onClick={handleInstructionNext}>
                  {instructionPage === 2 ? 'Start Practice' : 'Next'}
                </Button>
              </div>
            </motion.div>
          </AnimatePresence>
        </Card>
      </div>
    )
  }

  const modeColor = selectedMode === 'forward' ? 'blue' : 'purple'
  const modeName = selectedMode === 'forward' ? 'Digit Span' : 'Reverse Digit Span'
  const modeInstruction = selectedMode === 'forward' 
    ? 'Enter the digits in the same order:' 
    : 'Enter the digits in reverse order:'

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 flex flex-col">
      {/* Header */}
      <div className="p-6 border-b border-border/50 backdrop-blur-sm bg-card/50 flex items-center justify-between">
        <div className="flex-1 space-y-2">
          <div className="flex items-center gap-3">
            <h2 className="text-2xl font-bold">{modeName}</h2>
            {gamePhase === 'practice' && (
              <Badge variant="outline" className="bg-yellow-100 text-yellow-800 border-yellow-300 dark:bg-yellow-900 dark:text-yellow-100 text-base px-3 py-1">
                🎯 PRACTICE TRIAL
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <span className={`text-${modeColor}-600 dark:text-${modeColor}-400 font-semibold`}>
              {selectedMode === 'forward' ? '▶ Forward' : '◀ Reverse'}
            </span>
          </div>
        </div>
        <Button
          onClick={onExit}
          variant="outline"
          size="sm"
          className="text-red-600 hover:text-red-700"
        >
          Exit
        </Button>
      </div>

      {/* Main Game Area */}
      <div className="flex-1 flex items-center justify-center p-8">
        <Card className="max-w-3xl w-full p-8 shadow-2xl">
          <div className="space-y-6">

          <div className={`bg-gradient-to-br from-muted/50 to-muted/30 rounded-2xl p-16 min-h-[280px] flex items-center justify-center border-2 shadow-inner transition-all duration-300 ${
            feedback === 'correct' ? 'border-green-500 bg-green-500/10' : 
            feedback === 'incorrect' ? 'border-red-500 bg-red-500/10' : 
            'border-border/50'
          }`}>
            {/* Feedback Display */}
            {feedback && (
              <motion.div
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="text-center space-y-4"
              >
                <div className={`text-8xl ${feedback === 'correct' ? 'text-green-500' : 'text-red-500'}`}>
                  {feedback === 'correct' ? '✓' : '✗'}
                </div>
                <div className={`text-3xl font-bold ${feedback === 'correct' ? 'text-green-600' : 'text-red-600'}`}>
                  {feedback === 'correct' ? 'Correct!' : 'Incorrect'}
                </div>
                {feedback === 'incorrect' && (
                  <div className="text-muted-foreground">
                    Expected: <span className="font-mono font-bold">
                      {selectedMode === 'forward' 
                        ? currentSequence.join(' ') 
                        : [...currentSequence].reverse().join(' ')}
                    </span>
                  </div>
                )}
              </motion.div>
            )}

            {/* Get Ready Prompt */}
            {!feedback && showGetReady && !isDisplaying && !isInputPhase && (
              <div className="text-center space-y-4">
                <motion.div
                  animate={{ opacity: [0.5, 1, 0.5] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                  className="text-2xl font-bold text-primary"
                >
                  Get ready to memorize the digits
                </motion.div>
                <div className="text-lg text-muted-foreground">
                  Focus and pay attention...
                </div>
                {gamePhase === 'practice' && (
                  <Badge className="bg-yellow-100 text-yellow-800 border-yellow-300 dark:bg-yellow-900 dark:text-yellow-100">
                    Practice Trial {practiceTrialCount + 1} of {PRACTICE_TRIALS}
                  </Badge>
                )}
              </div>
            )}

            {/* Digit Display */}
            {!feedback && isDisplaying && (
              <AnimatePresence mode="wait">
                {currentDigitIndex < currentSequence.length && (
                  <motion.div
                    key={currentDigitIndex}
                    initial={{ scale: 0, opacity: 0, rotate: -10 }}
                    animate={{ scale: 1, opacity: 1, rotate: 0 }}
                    exit={{ scale: 0, opacity: 0, rotate: 10 }}
                    transition={{ duration: 0.2, type: "spring", stiffness: 300, damping: 20 }}
                    className="text-9xl font-bold text-red-800 dark:text-red-700 drop-shadow-2xl"
                  >
                    {currentSequence[currentDigitIndex]}
                  </motion.div>
                )}
              </AnimatePresence>
            )}

            {/* Input Phase */}
            {!feedback && isInputPhase && (
              <div className="w-full space-y-6">
                <div className="text-center">
                  <p className="text-lg font-semibold mb-4 text-foreground">
                    {modeInstruction}
                  </p>
                  <div className="bg-background/80 backdrop-blur-sm rounded-xl p-6 min-h-[80px] flex items-center justify-center border-2 border-dashed border-primary/30 shadow-lg">
                    {userInput.length > 0 ? (
                      <div className="flex gap-3 text-4xl font-mono font-bold">
                        {userInput.map((digit, idx) => (
                          <motion.span
                            key={idx}
                            initial={{ scale: 0, y: -20 }}
                            animate={{ scale: 1, y: 0 }}
                            transition={{ type: "spring", stiffness: 300 }}
                            className="text-primary drop-shadow-md"
                          >
                            {digit}
                          </motion.span>
                        ))}
                      </div>
                    ) : (
                      <span className="text-muted-foreground text-lg">Click digits below...</span>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-5 gap-3 max-w-lg mx-auto">
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 0].map(digit => (
                    <Button
                      key={digit}
                      onClick={() => handleDigitClick(digit)}
                      variant="outline"
                      size="lg"
                      className="text-3xl h-16 font-bold hover:bg-primary hover:text-primary-foreground hover:scale-105 transition-all duration-200 shadow-md"
                    >
                      {digit}
                    </Button>
                  ))}
                </div>

                <div className="flex gap-3 justify-center pt-2">
                  <Button
                    onClick={handleBackspace}
                    variant="outline"
                    size="lg"
                    disabled={userInput.length === 0}
                    className="min-w-[110px] hover:bg-orange-500/10 hover:text-orange-600 hover:border-orange-500"
                  >
                    ⌫ Backspace
                  </Button>
                  <Button
                    onClick={handleClear}
                    variant="outline"
                    size="lg"
                    disabled={userInput.length === 0}
                    className="min-w-[110px] hover:bg-destructive/10 hover:text-destructive hover:border-destructive"
                  >
                    Clear All
                  </Button>
                  <Button
                    onClick={handleSubmit}
                    disabled={userInput.length === 0}
                    size="lg"
                    className="min-w-[110px] bg-green-600 hover:bg-green-700 text-white shadow-lg hover:shadow-xl transition-all"
                  >
                    Submit ✓
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </Card>
      </div>

      {/* Footer Stats */}
      {gamePhase === 'practice' && (
        <div className="p-6 border-t border-border/50 backdrop-blur-sm bg-card/50">
          <div className="max-w-3xl mx-auto flex items-center justify-center text-sm">
            <Badge className="bg-yellow-100 text-yellow-800 border-yellow-300 dark:bg-yellow-900 dark:text-yellow-100 px-4 py-2">
              Practice Trial {practiceTrialCount + 1} of {PRACTICE_TRIALS}
            </Badge>
          </div>
        </div>
      )}
      {gamePhase === 'test' && (
        <div className="p-6 border-t border-border/50 backdrop-blur-sm bg-card/50">
          <div className="max-w-3xl mx-auto flex items-center justify-between text-sm">
            <div className="flex items-center gap-6">
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
