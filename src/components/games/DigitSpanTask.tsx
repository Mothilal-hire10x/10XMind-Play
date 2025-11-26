import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { TrialResult, GameSummary } from '@/lib/types'
import { motion, AnimatePresence } from 'framer-motion'

const INITIAL_SPAN = 2
const MAX_SPAN = 9
const DIGIT_DISPLAY_DURATION = 1000

interface DigitSpanTaskProps {
  onComplete: (results: TrialResult[], summary: GameSummary) => void
  onExit: () => void
}

type GamePhase = 'instructions' | 'practice' | 'test'
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

export function DigitSpanTask({ onComplete, onExit }: DigitSpanTaskProps) {
  const [gamePhase, setGamePhase] = useState<GamePhase>('instructions')
  const [instructionPage, setInstructionPage] = useState(0)
  
  const [currentSpan, setCurrentSpan] = useState(INITIAL_SPAN)
  const [currentSequence, setCurrentSequence] = useState<number[]>([])
  const [userInput, setUserInput] = useState<number[]>([])
  const [isDisplaying, setIsDisplaying] = useState(false)
  const [currentDigitIndex, setCurrentDigitIndex] = useState(0)
  const [isInputPhase, setIsInputPhase] = useState(false)
  const [trialType, setTrialType] = useState<TrialType>('forward')
  const [trialStartTime, setTrialStartTime] = useState(0)
  
  const [results, setResults] = useState<Trial[]>([])
  const [consecutiveFailures, setConsecutiveFailures] = useState(0)
  const [consecutiveSuccesses, setConsecutiveSuccesses] = useState(0)
  const [maxSpanForward, setMaxSpanForward] = useState(INITIAL_SPAN - 1)
  const [maxSpanBackward, setMaxSpanBackward] = useState(INITIAL_SPAN - 1)

  const generateSequence = (length: number): number[] => {
    return Array.from({ length }, () => Math.floor(Math.random() * 10))
  }

  const startNewTrial = (isPractice = false) => {
    const sequence = generateSequence(currentSpan)
    setCurrentSequence(sequence)
    setUserInput([])
    setIsDisplaying(true)
    setCurrentDigitIndex(0)
    setIsInputPhase(false)
    setTrialStartTime(Date.now())
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
      const timer = setTimeout(() => {
        setCurrentDigitIndex(prev => prev + 1)
      }, DIGIT_DISPLAY_DURATION)
      return () => clearTimeout(timer)
    } else if (isDisplaying && currentDigitIndex >= currentSequence.length) {
      setTimeout(() => {
        setIsDisplaying(false)
        setIsInputPhase(true)
      }, 500)
    }
  }, [isDisplaying, currentDigitIndex, currentSequence])

  const handleDigitClick = (digit: number) => {
    if (!isInputPhase) return
    setUserInput(prev => [...prev, digit])
  }

  const handleClear = () => {
    setUserInput([])
  }

  const handleSubmit = () => {
    if (userInput.length === 0) return

    const reactionTime = Date.now() - trialStartTime
    const expectedSequence = trialType === 'forward' 
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
      type: trialType,
      isPractice: gamePhase === 'practice'
    }

    if (gamePhase === 'practice') {
      setGamePhase('test')
      setCurrentSpan(INITIAL_SPAN)
      setConsecutiveFailures(0)
      setConsecutiveSuccesses(0)
      return
    }

    setResults(prev => [...prev, trial])

    if (correct) {
      setConsecutiveSuccesses(prev => prev + 1)
      setConsecutiveFailures(0)

      if (consecutiveSuccesses + 1 >= 2) {
        const newSpan = currentSpan + 1
        
        if (newSpan > MAX_SPAN) {
          if (trialType === 'forward') {
            setMaxSpanForward(currentSpan)
            setTrialType('backward')
            setCurrentSpan(INITIAL_SPAN)
            setConsecutiveFailures(0)
            setConsecutiveSuccesses(0)
          } else {
            setMaxSpanBackward(currentSpan)
            finishGame()
            return
          }
        } else {
          if (trialType === 'forward') {
            setMaxSpanForward(currentSpan)
          } else {
            setMaxSpanBackward(currentSpan)
          }
          setCurrentSpan(newSpan)
          setConsecutiveSuccesses(0)
        }
      }
    } else {
      setConsecutiveFailures(prev => prev + 1)
      setConsecutiveSuccesses(0)

      if (consecutiveFailures + 1 >= 2) {
        if (trialType === 'forward') {
          setMaxSpanForward(Math.max(currentSpan - 1, INITIAL_SPAN - 1))
          setTrialType('backward')
          setCurrentSpan(INITIAL_SPAN)
          setConsecutiveFailures(0)
          setConsecutiveSuccesses(0)
        } else {
          setMaxSpanBackward(Math.max(currentSpan - 1, INITIAL_SPAN - 1))
          finishGame()
          return
        }
      }
    }

    startNewTrial()
  }

  const finishGame = () => {
    const totalTrials = results.length + 1
    const totalCorrect = results.filter(r => r.correct).length
    const errorCount = totalTrials - totalCorrect
    const errorRate = totalTrials > 0 ? (errorCount / totalTrials) * 100 : 0
    
    const forwardTrials = results.filter(r => r.type === 'forward')
    const backwardTrials = results.filter(r => r.type === 'backward')
    const forwardScore = forwardTrials.filter(r => r.correct).length
    const backwardScore = backwardTrials.filter(r => r.correct).length
    
    const avgRT = results.length > 0
      ? results.reduce((sum, r) => sum + r.reactionTime, 0) / results.length
      : 0

    const finalMaxForward = trialType === 'forward' ? Math.max(currentSpan - 1, maxSpanForward) : maxSpanForward
    const finalMaxBackward = trialType === 'backward' ? Math.max(currentSpan - 1, maxSpanBackward) : maxSpanBackward

    const trialResults: TrialResult[] = results.map((trial, idx) => ({
      stimulus: trial.sequence.join(' '),
      response: trial.userInput.join(' '),
      correct: trial.correct,
      reactionTime: trial.reactionTime,
      trialType: trial.type,
      status: trial.correct ? 1 : 2
    }))

    const summary: GameSummary = {
      score: finalMaxForward + finalMaxBackward,
      accuracy: totalTrials > 0 ? (totalCorrect / totalTrials) * 100 : 0,
      reactionTime: avgRT,
      errorCount,
      errorRate,
      details: {
        totalTrials,
        maxSpanForward: finalMaxForward,
        maxSpanBackward: finalMaxBackward,
        forwardScore,
        backwardScore
      }
    }

    onComplete(trialResults, summary)
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
                    <h1 className="text-4xl font-bold mb-2">Digit Span Test</h1>
                    <Badge variant="outline" className="mb-4">Memory Assessment</Badge>
                  </div>
                  
                  <div className="space-y-4 text-lg">
                    <p>
                      Welcome to the <strong>Digit Span Test</strong>, a classic assessment of your 
                      working memory capacity.
                    </p>
                    
                    <p>
                      This test measures how many digits you can remember and repeat back in the 
                      correct order. It's widely used in cognitive psychology and neuropsychology 
                      to assess short-term memory function.
                    </p>

                    <div className="bg-muted/50 p-4 rounded-lg">
                      <p className="font-semibold mb-2">What you'll do:</p>
                      <ul className="list-disc list-inside space-y-2">
                        <li>Watch sequences of digits appear one at a time</li>
                        <li>Remember the digits in order</li>
                        <li>Repeat them back using the digit pad</li>
                      </ul>
                    </div>

                    <p className="text-muted-foreground text-base">
                      The test has two modes: <strong>Forward</strong> (repeat in same order) and 
                      <strong>Backward</strong> (repeat in reverse order).
                    </p>
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
                          <strong>Click the digits:</strong> Use the digit pad (0-9) to enter your answer
                        </li>
                        <li>
                          <strong>Submit:</strong> Click the green checkmark when you're done
                        </li>
                      </ol>
                    </div>

                    <div className="border-l-4 border-blue-500 pl-4 py-2">
                      <p className="text-base">
                        <strong>Important:</strong> In <strong className="text-blue-600">Forward</strong> mode, 
                        repeat the digits in the <em>same order</em>. In 
                        <strong className="text-purple-600"> Backward</strong> mode, repeat them in 
                        <em> reverse order</em>.
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
                          <span><strong>Get 2 wrong in a row:</strong> Current mode ends</span>
                        </li>
                      </ul>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="border border-blue-500/30 bg-blue-500/5 p-3 rounded">
                        <h3 className="font-semibold text-blue-600 mb-1">Forward Mode</h3>
                        <p className="text-sm">Starts at 2 digits, tests how long a sequence you can remember</p>
                      </div>
                      <div className="border border-purple-500/30 bg-purple-500/5 p-3 rounded">
                        <h3 className="font-semibold text-purple-600 mb-1">Backward Mode</h3>
                        <p className="text-sm">Starts at 2 digits, requires mental reversal of the sequence</p>
                      </div>
                    </div>

                    <div className="border-l-4 border-yellow-500 pl-4 py-2">
                      <p className="text-base">
                        <strong>Your score:</strong> The maximum span you reach in each mode. 
                        Higher scores indicate better working memory capacity.
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
                <Button
                  onClick={handleInstructionPrev}
                  variant="outline"
                  disabled={instructionPage === 0}
                >
                  Previous
                </Button>
                
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

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-blue-50 to-purple-50 dark:from-gray-900 dark:to-gray-800">
      <Card className="max-w-2xl w-full p-8">
        <div className="space-y-6">
          <div className="text-center space-y-2">
            <div className="flex items-center justify-center gap-3">
              <h2 className="text-3xl font-bold">Digit Span</h2>
              {gamePhase === 'practice' && (
                <Badge variant="outline" className="bg-yellow-100 text-yellow-800 border-yellow-300 dark:bg-yellow-900 dark:text-yellow-100">
                  Practice
                </Badge>
              )}
            </div>
            <div className="flex items-center justify-center gap-4 text-sm text-muted-foreground">
              <span className={trialType === 'forward' ? 'text-blue-600 dark:text-blue-400 font-semibold' : ''}>
                {trialType === 'forward' ? '▶ ' : ''}Forward
              </span>
              <span>•</span>
              <span className={trialType === 'backward' ? 'text-purple-600 dark:text-purple-400 font-semibold' : ''}>
                {trialType === 'backward' ? '◀ ' : ''}Backward
              </span>
              <span>•</span>
              <span>Span: {currentSpan}</span>
            </div>
          </div>

          <div className="bg-muted/30 rounded-lg p-12 min-h-[200px] flex items-center justify-center">
            {isDisplaying ? (
              <AnimatePresence mode="wait">
                {currentDigitIndex < currentSequence.length && (
                  <motion.div
                    key={currentDigitIndex}
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="text-8xl font-bold text-primary"
                  >
                    {currentSequence[currentDigitIndex]}
                  </motion.div>
                )}
              </AnimatePresence>
            ) : isInputPhase ? (
              <div className="w-full space-y-4">
                <div className="text-center">
                  <p className="text-lg font-medium mb-3">
                    {trialType === 'forward' 
                      ? 'Enter the digits in the same order:' 
                      : 'Enter the digits in reverse order:'}
                  </p>
                  <div className="bg-white dark:bg-gray-800 rounded-lg p-4 min-h-[60px] flex items-center justify-center border-2 border-dashed">
                    {userInput.length > 0 ? (
                      <div className="flex gap-2 text-3xl font-mono">
                        {userInput.map((digit, idx) => (
                          <motion.span
                            key={idx}
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            className="text-primary"
                          >
                            {digit}
                          </motion.span>
                        ))}
                      </div>
                    ) : (
                      <span className="text-muted-foreground">Click digits below...</span>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-5 gap-2 max-w-md mx-auto">
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 0].map(digit => (
                    <Button
                      key={digit}
                      onClick={() => handleDigitClick(digit)}
                      variant="outline"
                      size="lg"
                      className="text-2xl h-14 hover:bg-primary hover:text-primary-foreground transition-colors"
                    >
                      {digit}
                    </Button>
                  ))}
                </div>

                <div className="flex gap-3 justify-center">
                  <Button
                    onClick={handleClear}
                    variant="outline"
                    disabled={userInput.length === 0}
                  >
                    Clear
                  </Button>
                  <Button
                    onClick={handleSubmit}
                    disabled={userInput.length === 0}
                    className="bg-green-600 hover:bg-green-700 text-white"
                  >
                    Submit ✓
                  </Button>
                </div>
              </div>
            ) : (
              <div className="text-center text-muted-foreground">
                <p>Get ready...</p>
              </div>
            )}
          </div>

          {gamePhase === 'test' && (
            <div className="flex justify-between text-sm">
              <div>
                <span className="text-muted-foreground">Consecutive: </span>
                <span className="font-semibold text-green-600">{consecutiveSuccesses} ✓</span>
                {' / '}
                <span className="font-semibold text-red-600">{consecutiveFailures} ✗</span>
              </div>
              <div>
                <span className="text-muted-foreground">Trials: </span>
                <span className="font-semibold">{results.length}</span>
              </div>
            </div>
          )}
        </div>
      </Card>
    </div>
  )
}
