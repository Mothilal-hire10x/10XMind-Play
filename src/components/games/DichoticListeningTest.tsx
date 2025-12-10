import { useState, useEffect, useCallback, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { X, SpeakerHigh, Check, Headphones, NumberCircleFour, Ear } from '@phosphor-icons/react'
import { TrialResult, GameSummary } from '@/lib/types'
import { motion, AnimatePresence } from 'framer-motion'

interface DichoticListeningTestProps {
  onComplete: (results: TrialResult[], summary: GameSummary) => void
  onExit: () => void
}

// Available numbers (1-10 excluding 7)
const AVAILABLE_NUMBERS = [1, 2, 3, 4, 5, 6, 8, 9, 10]
const PRACTICE_TRIALS = 2
const TOTAL_TRIALS = 10

type GamePhase = 'instructions' | 'audio-check' | 'practice' | 'test'
type TrialPhase = 'ready' | 'playing' | 'responding'

interface TrialData {
  leftNumbers: [number, number]
  rightNumbers: [number, number]
  leftOptions: number[]
  rightOptions: number[]
}

export function DichoticListeningTest({ onComplete, onExit }: DichoticListeningTestProps) {
  const [gamePhase, setGamePhase] = useState<GamePhase>('instructions')
  const [instructionPage, setInstructionPage] = useState(0)
  const [practiceTrialCount, setPracticeTrialCount] = useState(0)
  const [practiceComplete, setPracticeComplete] = useState(false)
  
  const [currentTrial, setCurrentTrial] = useState(0)
  const [trialData, setTrialData] = useState<TrialData | null>(null)
  const [phase, setPhase] = useState<TrialPhase>('ready')
  const [selectedLeftNumbers, setSelectedLeftNumbers] = useState<number[]>([])
  const [selectedRightNumbers, setSelectedRightNumbers] = useState<number[]>([])
  const [startTime, setStartTime] = useState(0)
  const [results, setResults] = useState<TrialResult[]>([])
  const [feedback, setFeedback] = useState<'correct' | 'incorrect' | null>(null)
  const [isPlayingAudio, setIsPlayingAudio] = useState(false)
  const [audioTestPassed, setAudioTestPassed] = useState(false)
  
  const audioContextRef = useRef<AudioContext | null>(null)

  // Get or create AudioContext
  const getAudioContext = useCallback(() => {
    if (!audioContextRef.current || audioContextRef.current.state === 'closed') {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)()
    }
    if (audioContextRef.current.state === 'suspended') {
      audioContextRef.current.resume()
    }
    return audioContextRef.current
  }, [])

  // Cleanup
  useEffect(() => {
    return () => {
      if (audioContextRef.current) {
        audioContextRef.current.close()
      }
      window.speechSynthesis?.cancel()
    }
  }, [])

  // Speak a number using Web Speech API with stereo panning
  const speakNumber = useCallback((number: number, pan: number): Promise<void> => {
    return new Promise((resolve) => {
      try {
        const ctx = getAudioContext()
        
        // Create speech synthesis utterance
        if ('speechSynthesis' in window) {
          const utterance = new SpeechSynthesisUtterance(number.toString())
          const voices = speechSynthesis.getVoices()
          
          const englishVoice = voices.find(v => v.lang.startsWith('en'))
          if (englishVoice) {
            utterance.voice = englishVoice
          }
          
          utterance.rate = 1.0
          utterance.volume = 1.0
          utterance.pitch = pan < 0 ? 0.9 : 1.1 // Slightly different pitch for left/right
          utterance.lang = 'en-US'

          utterance.onend = () => resolve()
          utterance.onerror = () => resolve()

          speechSynthesis.speak(utterance)
        }
        
        // Also play a tone with stereo panning for true dichotic effect
        const osc = ctx.createOscillator()
        const gainNode = ctx.createGain()
        const panner = ctx.createStereoPanner()
        
        // Different frequency for each number
        const baseFreq = 200 + (number * 50)
        osc.frequency.setValueAtTime(baseFreq, ctx.currentTime)
        osc.type = 'sine'
        
        // Stereo pan: -1 = full left, +1 = full right
        panner.pan.setValueAtTime(pan, ctx.currentTime)
        
        gainNode.gain.setValueAtTime(0.3, ctx.currentTime)
        gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5)
        
        osc.connect(gainNode)
        gainNode.connect(panner)
        panner.connect(ctx.destination)
        
        osc.start(ctx.currentTime)
        osc.stop(ctx.currentTime + 0.5)
        
        setTimeout(resolve, 600)
      } catch (error) {
        console.error('Audio error:', error)
        resolve()
      }
    })
  }, [getAudioContext])

  // Generate random trial data
  const generateTrialData = useCallback((): TrialData => {
    // Shuffle available numbers
    const shuffled = [...AVAILABLE_NUMBERS].sort(() => Math.random() - 0.5)
    
    // Pick 4 unique numbers: 2 for left, 2 for right
    const leftNumbers: [number, number] = [shuffled[0], shuffled[1]]
    const rightNumbers: [number, number] = [shuffled[2], shuffled[3]]
    
    // Generate 2 distractors for left ear options
    const leftRemaining = AVAILABLE_NUMBERS.filter(n => !leftNumbers.includes(n))
    const leftDistractors = leftRemaining.sort(() => Math.random() - 0.5).slice(0, 2)
    const leftOptions = [...leftNumbers, ...leftDistractors].sort(() => Math.random() - 0.5)
    
    // Generate 2 distractors for right ear options
    const rightRemaining = AVAILABLE_NUMBERS.filter(n => !rightNumbers.includes(n))
    const rightDistractors = rightRemaining.sort(() => Math.random() - 0.5).slice(0, 2)
    const rightOptions = [...rightNumbers, ...rightDistractors].sort(() => Math.random() - 0.5)
    
    return { leftNumbers, rightNumbers, leftOptions, rightOptions }
  }, [])

  // Play numbers simultaneously to left and right ears
  const playDichoticStimuli = useCallback(async () => {
    if (!trialData || isPlayingAudio) return
    
    setIsPlayingAudio(true)
    speechSynthesis.cancel()

    try {
      // Play both left ear numbers simultaneously (pan = -1 for left)
      // and both right ear numbers simultaneously (pan = +1 for right)
      
      // Start all 4 numbers at the same time
      const leftPromises = [
        speakNumber(trialData.leftNumbers[0], -1),
        speakNumber(trialData.leftNumbers[1], -1)
      ]
      
      const rightPromises = [
        speakNumber(trialData.rightNumbers[0], 1),
        speakNumber(trialData.rightNumbers[1], 1)
      ]
      
      // Play all simultaneously
      await Promise.all([...leftPromises, ...rightPromises])
      
      await new Promise(r => setTimeout(r, 300))
    } catch (error) {
      console.error('Audio playback error:', error)
    }
    
    setIsPlayingAudio(false)
    setPhase('responding')
    setStartTime(performance.now())
  }, [trialData, isPlayingAudio, speakNumber])

  // Audio test
  const playAudioTest = useCallback(async () => {
    getAudioContext()
    setIsPlayingAudio(true)
    
    // Play left ear (3, 5) and right ear (8, 2) simultaneously
    await Promise.all([
      speakNumber(3, -1),
      speakNumber(5, -1),
      speakNumber(8, 1),
      speakNumber(2, 1)
    ])
    
    setIsPlayingAudio(false)
  }, [speakNumber, getAudioContext])

  const startNextTrial = useCallback(() => {
    const totalTrialsForPhase = gamePhase === 'practice' ? PRACTICE_TRIALS : TOTAL_TRIALS
    const currentTrialCount = gamePhase === 'practice' ? practiceTrialCount : currentTrial
    
    if (currentTrialCount >= totalTrialsForPhase) {
      if (gamePhase === 'practice') {
        setPracticeComplete(true)
        return
      }
      
      // Complete the game
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
          totalTrials: TOTAL_TRIALS,
          correctTrials: totalCorrect
        }
      })
      return
    }

    setPhase('ready')
    setFeedback(null)
    setSelectedLeftNumbers([])
    setSelectedRightNumbers([])
    setTrialData(generateTrialData())
  }, [currentTrial, practiceTrialCount, gamePhase, results, generateTrialData, onComplete])

  // Initialize first trial when entering practice or test phase
  useEffect(() => {
    if (gamePhase === 'practice' || gamePhase === 'test') {
      setPhase('ready')
      setFeedback(null)
      setSelectedLeftNumbers([])
      setSelectedRightNumbers([])
      setTrialData(generateTrialData())
    }
  }, [gamePhase, generateTrialData])

  // Auto-play audio when trial data is ready
  useEffect(() => {
    if (phase === 'ready' && trialData && !isPlayingAudio) {
      const timer = setTimeout(() => {
        playDichoticStimuli()
      }, 1500)
      return () => clearTimeout(timer)
    }
  }, [phase, trialData, isPlayingAudio, playDichoticStimuli])

  // Toggle number selection for left ear
  const toggleLeftNumberSelection = useCallback((num: number) => {
    if (phase !== 'responding' || feedback) return
    
    setSelectedLeftNumbers(prev => {
      if (prev.includes(num)) {
        return prev.filter(n => n !== num)
      } else if (prev.length < 2) {
        return [...prev, num]
      }
      return prev
    })
  }, [phase, feedback])

  // Toggle number selection for right ear
  const toggleRightNumberSelection = useCallback((num: number) => {
    if (phase !== 'responding' || feedback) return
    
    setSelectedRightNumbers(prev => {
      if (prev.includes(num)) {
        return prev.filter(n => n !== num)
      } else if (prev.length < 2) {
        return [...prev, num]
      }
      return prev
    })
  }, [phase, feedback])

  // Submit response
  const handleSubmit = useCallback(() => {
    if (!trialData || selectedLeftNumbers.length !== 2 || selectedRightNumbers.length !== 2 || feedback) return

    const reactionTime = performance.now() - startTime
    
    // Check if both left numbers are correct
    const leftCorrectSet = new Set(trialData.leftNumbers)
    const selectedLeftSet = new Set(selectedLeftNumbers)
    const leftCorrect = trialData.leftNumbers.every(n => selectedLeftSet.has(n)) && 
                        selectedLeftNumbers.every(n => leftCorrectSet.has(n))
    
    // Check if both right numbers are correct
    const rightCorrectSet = new Set(trialData.rightNumbers)
    const selectedRightSet = new Set(selectedRightNumbers)
    const rightCorrect = trialData.rightNumbers.every(n => selectedRightSet.has(n)) && 
                         selectedRightNumbers.every(n => rightCorrectSet.has(n))
    
    const correct = leftCorrect && rightCorrect

    const trialResult: TrialResult = {
      stimulus: `L:[${trialData.leftNumbers.join(',')}] R:[${trialData.rightNumbers.join(',')}]`,
      response: `L:[${selectedLeftNumbers.sort((a, b) => a - b).join(',')}] R:[${selectedRightNumbers.sort((a, b) => a - b).join(',')}]`,
      correct,
      reactionTime,
      trialType: correct ? 'both-correct' : leftCorrect ? 'left-only' : rightCorrect ? 'right-only' : 'both-wrong'
    }

    setResults(prev => [...prev, trialResult])
    setFeedback(correct ? 'correct' : 'incorrect')
    
    if (gamePhase === 'practice') {
      setPracticeTrialCount(prev => prev + 1)
    } else {
      setCurrentTrial(prev => prev + 1)
    }

    setTimeout(() => {
      startNextTrial()
    }, 1500)
  }, [selectedLeftNumbers, selectedRightNumbers, trialData, feedback, startTime, gamePhase, startNextTrial])

  const stats = {
    accuracy: results.length > 0 ? Math.round((results.filter(r => r.correct).length / results.length) * 100) : 0,
    avgRT: results.length > 0 ? Math.round(results.reduce((sum, r) => sum + r.reactionTime, 0) / results.length) : 0,
    errors: results.length > 0 ? results.length - results.filter(r => r.correct).length : 0,
    errorRate: results.length > 0 ? Math.round(((results.length - results.filter(r => r.correct).length) / results.length) * 100) : 0
  }

  const handleInstructionNext = () => {
    if (instructionPage < 2) {
      setInstructionPage(prev => prev + 1)
    } else {
      setGamePhase('audio-check')
    }
  }

  const handleInstructionPrev = () => {
    if (instructionPage > 0) {
      setInstructionPage(prev => prev - 1)
    }
  }

  // Audio check screen
  if (gamePhase === 'audio-check') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 flex items-center justify-center p-4">
        <Card className="max-w-2xl w-full p-8 shadow-2xl">
          <div className="text-center space-y-6">
            <div className="flex justify-center">
              <div className="p-4 bg-primary/10 rounded-full">
                <SpeakerHigh size={64} weight="fill" className="text-primary" />
              </div>
            </div>
            
            <div className="space-y-2">
              <h2 className="text-3xl font-bold">Audio Check</h2>
              <p className="text-lg text-muted-foreground">
                Make sure you can hear the numbers clearly
              </p>
            </div>

            <div className="bg-muted/50 p-6 rounded-lg space-y-4">
              <p className="text-base font-medium">
                👆 Click to hear test audio (Left: 3, 5 | Right: 8, 2)
              </p>
              
              <Button
                size="lg"
                variant="outline"
                onClick={playAudioTest}
                disabled={isPlayingAudio}
                className="w-full gap-2 border-primary/50 hover:bg-primary/10"
              >
                {isPlayingAudio ? (
                  <>
                    <motion.div
                      animate={{ scale: [1, 1.2, 1] }}
                      transition={{ repeat: Infinity, duration: 0.5 }}
                    >
                      <SpeakerHigh size={24} weight="fill" className="text-primary" />
                    </motion.div>
                    <span>Playing...</span>
                  </>
                ) : (
                  <>
                    <SpeakerHigh size={24} weight="fill" />
                    <span>Test Dichotic Audio</span>
                  </>
                )}
              </Button>
              
              <div className="text-sm text-muted-foreground text-center">
                <p>🎧 <strong>Use headphones!</strong> You should hear:</p>
                <p className="mt-1">Left ear: numbers 3 and 5</p>
                <p>Right ear: numbers 8 and 2</p>
              </div>
            </div>

            <div className="border-l-4 border-yellow-500 pl-4 py-2 bg-yellow-50 dark:bg-yellow-900/20 text-left">
              <p className="text-sm">
                <strong>⚠️ Can't hear the numbers?</strong> Try:
              </p>
              <ul className="text-sm list-disc list-inside mt-2 text-muted-foreground">
                <li>Turn up your device volume</li>
                <li>Make sure speakers/headphones are connected</li>
                <li>Try a different browser (Chrome works best)</li>
              </ul>
            </div>

            <div className="flex gap-4 justify-center pt-4">
              <Button 
                variant="outline" 
                onClick={() => {
                  setGamePhase('instructions')
                  setInstructionPage(2)
                }}
              >
                Back to Instructions
              </Button>
              <Button 
                size="lg"
                onClick={() => {
                  setAudioTestPassed(true)
                  setGamePhase('practice')
                }}
              >
                Audio Works - Start Practice
              </Button>
            </div>
          </div>
        </Card>
      </div>
    )
  }

  // Practice complete transition screen
  if (practiceComplete) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 flex items-center justify-center p-4">
        <Card 
          className="max-w-2xl w-full p-8 shadow-2xl cursor-pointer hover:shadow-3xl transition-all border-2 border-green-500/30 bg-green-500/5"
          onClick={() => {
            setPracticeComplete(false)
            setGamePhase('test')
            setPracticeTrialCount(0)
            setCurrentTrial(0)
            setResults([])
          }}
        >
          <div className="text-center space-y-6">
            <div className="flex justify-center">
              <div className="p-4 bg-green-100 dark:bg-green-900 rounded-full">
                <Check size={64} weight="bold" className="text-green-600 dark:text-green-400" />
              </div>
            </div>
            <div className="space-y-2">
              <h2 className="text-3xl font-bold">Practice Complete!</h2>
              <p className="text-xl text-muted-foreground">
                Ready for the actual test?
              </p>
            </div>
            <div className="bg-muted/50 p-6 rounded-lg space-y-2">
              <p className="text-lg font-semibold">
                You'll now complete {TOTAL_TRIALS} trials testing your auditory attention.
              </p>
              <p className="text-sm text-muted-foreground">
                Remember: Listen carefully and select all 4 numbers you hear!
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
                    <h1 className="text-4xl font-bold mb-2">Dichotic Listening Test</h1>
                    <Badge variant="outline" className="mb-4">Auditory Attention Assessment</Badge>
                  </div>
                  
                  <div className="flex justify-center mb-6">
                    <div className="p-6 bg-primary/10 rounded-full">
                      <Headphones size={80} weight="fill" className="text-primary" />
                    </div>
                  </div>

                  <div className="space-y-4 text-lg">
                    <p className="text-center">
                      This test measures your ability to process multiple numbers spoken simultaneously.
                    </p>

                    <div className="bg-muted/50 p-6 rounded-lg space-y-3">
                      <p className="font-semibold">What you'll do:</p>
                      <div className="space-y-2">
                        <div className="flex items-start gap-3">
                          <Headphones size={24} className="text-primary mt-1 flex-shrink-0" weight="fill" />
                          <p>You'll hear <strong>4 numbers simultaneously</strong> - 2 in each ear</p>
                        </div>
                        <div className="flex items-start gap-3">
                          <Ear size={24} className="text-blue-500 mt-1 flex-shrink-0" weight="fill" />
                          <p><strong>Left ear</strong> will hear 2 numbers at the same time</p>
                        </div>
                        <div className="flex items-start gap-3">
                          <Ear size={24} className="text-green-500 mt-1 flex-shrink-0" weight="fill" />
                          <p><strong>Right ear</strong> will hear 2 different numbers at the same time</p>
                        </div>
                        <div className="flex items-start gap-3">
                          <Check size={24} className="text-primary mt-1 flex-shrink-0" weight="bold" />
                          <p>Select which <strong>2 numbers</strong> you heard in each ear separately</p>
                        </div>
                      </div>
                    </div>

                    <div className="border-l-4 border-blue-500 pl-4 py-2">
                      <p className="text-base">
                        <strong>Numbers used:</strong> 1, 2, 3, 4, 5, 6, 8, 9, 10 (excluding 7)
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {instructionPage === 1 && (
                <div className="space-y-6">
                  <div className="text-center">
                    <h1 className="text-4xl font-bold mb-2">How It Works</h1>
                    <Badge variant="outline" className="mb-4">Step by Step</Badge>
                  </div>
                  
                  <div className="space-y-4 text-lg">
                    <div className="bg-primary/5 p-6 rounded-lg space-y-4">
                      <div className="flex items-start gap-4">
                        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">
                          1
                        </div>
                        <div>
                          <p className="font-semibold mb-1">Listen Carefully</p>
                          <p className="text-base text-muted-foreground">
                            You'll hear 2 numbers in left ear and 2 different numbers in right ear - all at the same time
                          </p>
                        </div>
                      </div>

                      <div className="flex items-start gap-4">
                        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">
                          2
                        </div>
                        <div>
                          <p className="font-semibold mb-1">Select Numbers for Each Ear</p>
                          <p className="text-base text-muted-foreground">
                            Choose 2 numbers for left ear from 4 options, and 2 numbers for right ear from 4 options
                          </p>
                        </div>
                      </div>

                      <div className="flex items-start gap-4">
                        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">
                          3
                        </div>
                        <div>
                          <p className="font-semibold mb-1">Submit Your Response</p>
                          <p className="text-base text-muted-foreground">
                            Once you've selected 2 numbers for each ear (4 total), click Submit
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg border border-green-200 dark:border-green-800">
                      <p className="text-sm">
                        <strong>💡 Pro tip:</strong> This tests true dichotic listening - your left and right ears will hear different numbers simultaneously!
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {instructionPage === 2 && (
                <div className="space-y-6">
                  <div className="text-center">
                    <h1 className="text-4xl font-bold mb-2">Tips for Success</h1>
                    <Badge variant="outline" className="mb-4">Before You Start</Badge>
                  </div>
                  
                  <div className="space-y-4 text-lg">
                    <div className="bg-muted/50 p-4 rounded-lg">
                      <p className="font-semibold mb-3">Recommendations:</p>
                      <ul className="space-y-2">
                        <li className="flex items-start gap-2">
                          <span className="text-green-600 font-bold mt-1">✓</span>
                          <span><strong>MUST use headphones</strong> - the test requires separate left/right audio</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-green-600 font-bold mt-1">✓</span>
                          <span>Find a quiet environment without distractions</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-green-600 font-bold mt-1">✓</span>
                          <span>Adjust volume to comfortable level before starting</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-green-600 font-bold mt-1">✓</span>
                          <span>Try to identify which numbers came from which ear</span>
                        </li>
                      </ul>
                    </div>

                    <div className="border-l-4 border-blue-500 pl-4 py-2">
                      <p className="text-base">
                        <strong>What we're measuring:</strong> Your auditory attention and ability to process 
                        multiple auditory stimuli presented simultaneously to both ears.
                      </p>
                    </div>

                    <p className="text-center text-muted-foreground text-base mt-6">
                      You'll start with <strong className="text-yellow-600">{PRACTICE_TRIALS} practice trials</strong> to 
                      get familiar, then <strong>{TOTAL_TRIALS} test trials</strong>.
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
                  {instructionPage === 2 ? 'Check Audio' : 'Next'}
                </Button>
              </div>
            </motion.div>
          </AnimatePresence>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 flex flex-col">
      <div className="p-6 border-b border-border/50 backdrop-blur-sm bg-card/50 flex items-center justify-between">
        <div className="flex-1 space-y-3">
          <div className="flex items-center gap-4">
            {gamePhase === 'practice' && (
              <Badge variant="outline" className="bg-yellow-100 text-yellow-800 border-yellow-300 dark:bg-yellow-900 dark:text-yellow-100">
                Practice Trial {practiceTrialCount + 1}/{PRACTICE_TRIALS}
              </Badge>
            )}
            {gamePhase === 'test' && (
              <>
                <Progress value={(currentTrial / TOTAL_TRIALS) * 100} className="h-2 flex-1" />
                <span className="text-sm font-medium text-muted-foreground min-w-20 text-right">
                  {currentTrial}/{TOTAL_TRIALS}
                </span>
              </>
            )}
          </div>
          {gamePhase === 'test' && (
            <div className="flex gap-3">
              <Badge variant="outline" className="gap-2">
                <span className="text-xs text-muted-foreground">Accuracy</span>
                <span className="font-bold">{stats.accuracy}%</span>
              </Badge>
              <Badge variant="outline" className="gap-2">
                <span className="text-xs text-muted-foreground">Errors</span>
                <span className="font-bold text-destructive">{stats.errors}</span>
              </Badge>
              <Badge variant="outline" className="gap-2">
                <span className="text-xs text-muted-foreground">Avg RT</span>
                <span className="font-bold">{stats.avgRT}ms</span>
              </Badge>
            </div>
          )}
        </div>
        <Button variant="ghost" size="icon" onClick={onExit} className="ml-4">
          <X size={24} />
        </Button>
      </div>

      <div className="flex-1 flex items-center justify-center p-8">
        <AnimatePresence mode="wait">
          {phase === 'ready' ? (
            <motion.div
              key="ready"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              className="text-center w-full max-w-4xl"
            >
              <Card className="p-16 bg-gradient-to-br from-primary/10 to-accent/10 border-2 border-primary/30">
                <div className="flex justify-center mb-6">
                  <div className="p-6 bg-primary/20 rounded-full">
                    <SpeakerHigh size={80} weight="fill" className="text-primary" />
                  </div>
                </div>
                <div className="text-2xl font-bold text-foreground mb-2">
                  Get Ready to Listen!
                </div>
                <p className="text-muted-foreground mb-4">
                  4 numbers will be spoken in a moment...
                </p>
                <motion.div
                  animate={{ scale: [1, 1.05, 1] }}
                  transition={{ repeat: Infinity, duration: 1.5 }}
                  className="text-6xl font-bold text-primary/20"
                >
                  🎧
                </motion.div>
              </Card>
            </motion.div>
          ) : phase === 'playing' ? (
            <motion.div
              key="playing"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              className="text-center w-full max-w-4xl"
            >
              <Card className="p-16 bg-gradient-to-br from-green-500/10 to-blue-500/10 border-2 border-green-500/30">
                <motion.div
                  animate={{ 
                    scale: [1, 1.1, 1],
                    rotate: [0, 5, -5, 0]
                  }}
                  transition={{ repeat: Infinity, duration: 1 }}
                  className="flex justify-center mb-6"
                >
                  <div className="p-6 bg-green-100 dark:bg-green-900 rounded-full">
                    <SpeakerHigh size={80} weight="fill" className="text-green-600 dark:text-green-400" />
                  </div>
                </motion.div>
                <div className="text-2xl font-bold text-foreground mb-2">
                  Listen Carefully...
                </div>
                <p className="text-muted-foreground">
                  4 numbers are being played
                </p>
              </Card>
            </motion.div>
          ) : (
            <motion.div
              key="responding"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              className="w-full max-w-4xl"
            >
              <Card className="p-8">
                <div className="text-center mb-6">
                  <h3 className="text-2xl font-bold mb-2">
                    What numbers did you hear?
                  </h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Select <strong>2 numbers for each ear</strong> from the choices below
                  </p>
                  
                  <div className="flex items-center justify-center gap-4 mb-4">
                    <Badge variant={selectedLeftNumbers.length === 2 ? "default" : "outline"} className="bg-blue-500">
                      Left Ear: {selectedLeftNumbers.length}/2
                    </Badge>
                    <Badge variant={selectedRightNumbers.length === 2 ? "default" : "outline"} className="bg-green-500">
                      Right Ear: {selectedRightNumbers.length}/2
                    </Badge>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-8 mb-8">
                  {/* Left Ear Selection */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-center gap-2 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                      <Ear size={24} className="text-blue-600" weight="fill" />
                      <h4 className="text-lg font-semibold text-blue-600">Left Ear</h4>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      {trialData?.leftOptions.map((num) => {
                        const isSelected = selectedLeftNumbers.includes(num)
                        return (
                          <Button
                            key={`left-${num}`}
                            variant={isSelected ? 'default' : 'outline'}
                            size="lg"
                            onClick={() => toggleLeftNumberSelection(num)}
                            disabled={feedback !== null}
                            className={`text-2xl font-bold h-20 ${
                              isSelected 
                                ? 'bg-blue-500 hover:bg-blue-600 scale-105 shadow-lg' 
                                : 'hover:bg-blue-500/10 hover:border-blue-500'
                            } transition-all`}
                          >
                            {num}
                          </Button>
                        )
                      })}
                    </div>
                  </div>

                  {/* Right Ear Selection */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-center gap-2 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                      <Ear size={24} className="text-green-600" weight="fill" />
                      <h4 className="text-lg font-semibold text-green-600">Right Ear</h4>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      {trialData?.rightOptions.map((num) => {
                        const isSelected = selectedRightNumbers.includes(num)
                        return (
                          <Button
                            key={`right-${num}`}
                            variant={isSelected ? 'default' : 'outline'}
                            size="lg"
                            onClick={() => toggleRightNumberSelection(num)}
                            disabled={feedback !== null}
                            className={`text-2xl font-bold h-20 ${
                              isSelected 
                                ? 'bg-green-500 hover:bg-green-600 scale-105 shadow-lg' 
                                : 'hover:bg-green-500/10 hover:border-green-500'
                            } transition-all`}
                          >
                            {num}
                          </Button>
                        )
                      })}
                    </div>
                  </div>
                </div>

                <Button
                  size="lg"
                  className="w-full text-lg"
                  onClick={handleSubmit}
                  disabled={selectedLeftNumbers.length !== 2 || selectedRightNumbers.length !== 2 || feedback !== null}
                >
                  Submit Response
                </Button>

                {feedback && (
                  <motion.div
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="text-center mt-6"
                  >
                    <div className={`text-lg font-bold mb-2 ${
                      feedback === 'correct' ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {feedback === 'correct' ? (
                        <div className="flex items-center justify-center gap-2">
                          <Check size={24} weight="bold" />
                          <span>Correct! All numbers matched!</span>
                        </div>
                      ) : (
                        <div className="flex items-center justify-center gap-2">
                          <X size={24} weight="bold" />
                          <span>Incorrect</span>
                        </div>
                      )}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      <div className="grid grid-cols-2 gap-4 mt-2">
                        <div>
                          <span className="font-semibold text-blue-600">Left Ear: </span>
                          {trialData?.leftNumbers.sort((a, b) => a - b).join(', ')}
                        </div>
                        <div>
                          <span className="font-semibold text-green-600">Right Ear: </span>
                          {trialData?.rightNumbers.sort((a, b) => a - b).join(', ')}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </Card>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="p-6 border-t border-border/50 backdrop-blur-sm bg-card/50">
        <div className="space-y-2">
          {gamePhase === 'practice' && (
            <p className="text-center text-sm font-medium text-yellow-600 dark:text-yellow-400">
              <strong>Practice Mode:</strong> Get familiar with the task. Practice results won't be saved.
            </p>
          )}
          <p className="text-center text-sm text-muted-foreground">
            <strong>Tip:</strong> Use headphones! Listen for which numbers come from left vs right ear! 🎧
          </p>
        </div>
      </div>
    </div>
  )
}
