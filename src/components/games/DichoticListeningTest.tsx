import { useState, useEffect, useCallback, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { X, SpeakerHigh, Ear, Check, XCircle } from '@phosphor-icons/react'
import { TrialResult, GameSummary } from '@/lib/types'
import { motion, AnimatePresence } from 'framer-motion'

interface DichoticListeningTestProps {
  onComplete: (results: TrialResult[], summary: GameSummary) => void
  onExit: () => void
}

const SYLLABLES = ['BA', 'DA', 'GA', 'KA', 'PA', 'TA', 'FA', 'SA', 'LA', 'RA', 'MA', 'NA']
const TOTAL_TRIALS = 24 // PsyToolkit standard for dichotic listening
const PRACTICE_TRIALS = 2 // Number of practice trials

type GamePhase = 'instructions' | 'practice' | 'test'
type TrialPhase = 'playing' | 'responding'

// Note: True dichotic listening requires stereo headphones with separate audio to each ear
// This implementation uses Web Speech API which has limitations:
// - Cannot achieve true simultaneous dichotic presentation in browsers
// - Requires headphones for best results
// - For research-grade dichotic listening, use specialized audio files with stereo panning

export function DichoticListeningTest({ onComplete, onExit }: DichoticListeningTestProps) {
  const [gamePhase, setGamePhase] = useState<GamePhase>('instructions')
  const [instructionPage, setInstructionPage] = useState(0)
  const [practiceTrialCount, setPracticeTrialCount] = useState(0)
  
  const [currentTrial, setCurrentTrial] = useState(0)
  const [leftEarSyllable, setLeftEarSyllable] = useState('')
  const [rightEarSyllable, setRightEarSyllable] = useState('')
  const [phase, setPhase] = useState<TrialPhase>('playing')
  const [selectedLeft, setSelectedLeft] = useState<string | null>(null)
  const [selectedRight, setSelectedRight] = useState<string | null>(null)
  const [startTime, setStartTime] = useState(0)
  const [results, setResults] = useState<TrialResult[]>([])
  const [feedback, setFeedback] = useState<'correct' | 'incorrect' | null>(null)
  const [rightEarScore, setRightEarScore] = useState(0)
  const [leftEarScore, setLeftEarScore] = useState(0)
  
  const audioContextRef = useRef<AudioContext | null>(null)
  const [showSyllables, setShowSyllables] = useState(false)

  // Initialize Web Audio API
  useEffect(() => {
    audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)()
    return () => {
      audioContextRef.current?.close()
    }
  }, [])

  // Play a tone with stereo panning
  const playTone = useCallback((frequency: number, pan: number, duration: number) => {
    return new Promise<void>((resolve) => {
      if (!audioContextRef.current) {
        resolve()
        return
      }

      const context = audioContextRef.current
      const oscillator = context.createOscillator()
      const gainNode = context.createGain()
      const panNode = context.createStereoPanner()

      oscillator.type = 'sine'
      oscillator.frequency.value = frequency
      panNode.pan.value = pan // -1 for left, 1 for right

      oscillator.connect(gainNode)
      gainNode.connect(panNode)
      panNode.connect(context.destination)

      gainNode.gain.setValueAtTime(0.3, context.currentTime)
      gainNode.gain.exponentialRampToValueAtTime(0.01, context.currentTime + duration)

      oscillator.start(context.currentTime)
      oscillator.stop(context.currentTime + duration)

      setTimeout(() => resolve(), duration * 1000)
    })
  }, [])

  const playDichoticStimuli = useCallback(async () => {
    if (!audioContextRef.current) return

    // Play tones to indicate which ear (different frequencies)
    const leftTone = playTone(400, -1, 0.2) // Lower tone for left ear
    const rightTone = playTone(600, 1, 0.2) // Higher tone for right ear
    
    await Promise.all([leftTone, rightTone])
    
    // Show the syllables visually for a brief moment
    setShowSyllables(true)
    
    await new Promise(resolve => setTimeout(resolve, 800))
    
    setShowSyllables(false)
    setPhase('responding')
    setStartTime(performance.now())
  }, [playTone])

  const generateStimuli = useCallback(() => {
    const leftIdx = Math.floor(Math.random() * SYLLABLES.length)
    let rightIdx = Math.floor(Math.random() * SYLLABLES.length)
    
    // Ensure different syllables
    while (rightIdx === leftIdx) {
      rightIdx = Math.floor(Math.random() * SYLLABLES.length)
    }
    
    setLeftEarSyllable(SYLLABLES[leftIdx])
    setRightEarSyllable(SYLLABLES[rightIdx])
  }, [])

  const startNextTrial = useCallback(() => {
    const totalTrialsForPhase = gamePhase === 'practice' ? PRACTICE_TRIALS : TOTAL_TRIALS
    const currentTrialCount = gamePhase === 'practice' ? practiceTrialCount : currentTrial
    
    if (currentTrialCount >= totalTrialsForPhase) {
      if (gamePhase === 'practice') {
        // Transition to test phase
        setGamePhase('test')
        setPracticeTrialCount(0)
        setCurrentTrial(0)
        setResults([])
        setLeftEarScore(0)
        setRightEarScore(0)
        return
      }
      
      // Complete the game
      const totalCorrect = results.filter(r => r.correct).length
      const avgRT = results.reduce((sum, r) => sum + r.reactionTime, 0) / results.length
      const earAdvantage = rightEarScore - leftEarScore
      const errorCount = (TOTAL_TRIALS * 2) - totalCorrect
      const errorRate = (errorCount / (TOTAL_TRIALS * 2)) * 100
      
      onComplete(results, {
        score: totalCorrect,
        accuracy: (totalCorrect / (TOTAL_TRIALS * 2)) * 100, // 2 responses per trial
        reactionTime: avgRT,
        errorCount,
        errorRate,
        details: {
          rightEarScore,
          leftEarScore,
          earAdvantage,
          rightEarAccuracy: (rightEarScore / TOTAL_TRIALS) * 100,
          leftEarAccuracy: (leftEarScore / TOTAL_TRIALS) * 100
        }
      })
      return
    }

    setPhase('playing')
    setFeedback(null)
    setSelectedLeft(null)
    setSelectedRight(null)
    generateStimuli()
  }, [currentTrial, practiceTrialCount, gamePhase, results, rightEarScore, leftEarScore, generateStimuli, onComplete])

  useEffect(() => {
    if (gamePhase === 'practice' || gamePhase === 'test') {
      startNextTrial()
    }
  }, [gamePhase])

  useEffect(() => {
    if (phase === 'playing' && leftEarSyllable && rightEarSyllable) {
      const timer = setTimeout(() => {
        playDichoticStimuli()
      }, 1000)
      return () => clearTimeout(timer)
    }
  }, [phase, leftEarSyllable, rightEarSyllable, playDichoticStimuli])

  const handleSubmit = useCallback(() => {
    if (!selectedLeft || !selectedRight || feedback) return

    const reactionTime = performance.now() - startTime
    const leftCorrect = selectedLeft === leftEarSyllable
    const rightCorrect = selectedRight === rightEarSyllable
    const bothCorrect = leftCorrect && rightCorrect

    if (leftCorrect) setLeftEarScore(prev => prev + 1)
    if (rightCorrect) setRightEarScore(prev => prev + 1)

    const trialResult: TrialResult = {
      stimulus: `L:${leftEarSyllable} R:${rightEarSyllable}`,
      response: `L:${selectedLeft} R:${selectedRight}`,
      correct: bothCorrect,
      reactionTime,
      trialType: bothCorrect ? 'both-correct' : leftCorrect ? 'left-only' : rightCorrect ? 'right-only' : 'both-wrong'
    }

    setResults(prev => [...prev, trialResult])
    setFeedback(bothCorrect ? 'correct' : 'incorrect')
    
    if (gamePhase === 'practice') {
      setPracticeTrialCount(prev => prev + 1)
    } else {
      setCurrentTrial(prev => prev + 1)
    }

    setTimeout(() => {
      startNextTrial()
    }, 1500)
  }, [selectedLeft, selectedRight, leftEarSyllable, rightEarSyllable, feedback, startTime, gamePhase, startNextTrial])

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
                    <h1 className="text-4xl font-bold mb-2">Dichotic Listening Test</h1>
                    <Badge variant="outline" className="mb-4">Auditory Attention Assessment</Badge>
                  </div>
                  
                  <div className="space-y-4 text-lg">
                    <p>
                      Welcome to the <strong>Dichotic Listening Test</strong>, a classic neuropsychological 
                      assessment that measures your auditory attention and hemisphere dominance.
                    </p>
                    
                    <p>
                      In this test, you'll hear different audio tones in each ear (through headphones) 
                      while seeing syllables displayed on screen. Your task is to remember which syllable 
                      appeared on which side.
                    </p>

                    <div className="bg-muted/50 p-4 rounded-lg">
                      <p className="font-semibold mb-2">What you'll do:</p>
                      <ul className="list-disc list-inside space-y-2">
                        <li>Wear headphones (stereo headphones required)</li>
                        <li>Listen to audio tones (different pitch in each ear)</li>
                        <li>Watch syllables appear briefly on screen</li>
                        <li>Remember which syllable was on the left and right side</li>
                        <li>Select your answers from the provided options</li>
                      </ul>
                    </div>

                    <div className="border-l-4 border-yellow-500 pl-4 py-2 bg-yellow-50 dark:bg-yellow-900/20">
                      <p className="text-base">
                        <strong>⚠️ Important:</strong> You must wear proper stereo headphones for 
                        accurate results. The audio cues will help you identify which ear is which.
                      </p>
                    </div>

                    <p className="text-muted-foreground text-base">
                      This test measures selective attention and can reveal interesting patterns about 
                      how your brain processes simultaneous information from different sources.
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
                          <strong>Put on your headphones:</strong> Make sure they're positioned correctly 
                          (left on left ear, right on right ear)
                        </li>
                        <li>
                          <strong>Listen for the audio tones:</strong> You'll hear a lower tone in the 
                          left ear and a higher tone in the right ear
                        </li>
                        <li>
                          <strong>Watch the syllables:</strong> Two syllables will appear briefly on screen - 
                          one on the <span className="text-blue-600">left side</span> and one on the 
                          <span className="text-green-600"> right side</span>
                        </li>
                        <li>
                          <strong>Remember both:</strong> Try to remember which syllable was on which side
                        </li>
                        <li>
                          <strong>Select your answers:</strong> Click the syllables you saw from the 
                          provided options for each side
                        </li>
                        <li>
                          <strong>Submit:</strong> Click "Submit Response" when you've made both selections
                        </li>
                      </ol>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="border border-blue-500/30 bg-blue-500/5 p-3 rounded">
                        <div className="flex items-center gap-2 mb-2">
                          <Ear size={20} className="text-blue-500" />
                          <h3 className="font-semibold text-blue-600">Left Side</h3>
                        </div>
                        <p className="text-sm">Lower tone 🔉<br/>Options: BA, DA, GA, KA, PA, TA</p>
                      </div>
                      <div className="border border-green-500/30 bg-green-500/5 p-3 rounded">
                        <div className="flex items-center gap-2 mb-2">
                          <Ear size={20} className="text-green-500" />
                          <h3 className="font-semibold text-green-600">Right Side</h3>
                        </div>
                        <p className="text-sm">Higher tone 🔊<br/>Options: FA, SA, LA, RA, MA, NA</p>
                      </div>
                    </div>

                    <p className="text-muted-foreground text-base">
                      The audio tones help you distinguish between left and right, while the visual 
                      syllables test your divided attention and memory.
                    </p>
                  </div>
                </div>
              )}

              {instructionPage === 2 && (
                <div className="space-y-6">
                  <div className="text-center">
                    <h1 className="text-4xl font-bold mb-2">Tips & Information</h1>
                    <Badge variant="outline" className="mb-4">Before You Start</Badge>
                  </div>
                  
                  <div className="space-y-4 text-lg">
                    <div className="bg-muted/50 p-4 rounded-lg">
                      <p className="font-semibold mb-3">Tips for Success:</p>
                      <ul className="space-y-2">
                        <li className="flex items-start gap-2">
                          <span className="text-green-600 font-bold mt-1">✓</span>
                          <span>Find a quiet environment free from distractions</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-green-600 font-bold mt-1">✓</span>
                          <span>Adjust your headphone volume to a comfortable level</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-green-600 font-bold mt-1">✓</span>
                          <span>Focus on both ears equally - try to catch both syllables</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-green-600 font-bold mt-1">✓</span>
                          <span>Don't worry if one ear is easier to hear - this is expected</span>
                        </li>
                      </ul>
                    </div>

                    <div className="border-l-4 border-blue-500 pl-4 py-2">
                      <p className="text-base">
                        <strong>What we're measuring:</strong> This test assesses divided attention - 
                        your ability to process multiple pieces of information presented simultaneously 
                        in different locations.
                      </p>
                    </div>

                    <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg border border-yellow-200 dark:border-yellow-800">
                      <p className="text-sm">
                        <strong>Note:</strong> This is a modified dichotic listening test that combines 
                        audio cues (stereo tones) with visual presentation (syllables). The audio helps 
                        you identify left vs right, while testing your visual memory and attention.
                      </p>
                    </div>

                    <p className="text-center text-muted-foreground text-base mt-6">
                      You'll start with <strong className="text-yellow-600">{PRACTICE_TRIALS} practice trials</strong> to 
                      get familiar with the task, then proceed to <strong>{TOTAL_TRIALS} test trials</strong>.
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
                <span className="font-bold text-destructive">{stats.errors} ({stats.errorRate}%)</span>
              </Badge>
              <Badge variant="outline" className="gap-2">
                <span className="text-xs text-muted-foreground">Left Ear</span>
                <span className="font-bold text-blue-500">{leftEarScore}</span>
              </Badge>
              <Badge variant="outline" className="gap-2">
                <span className="text-xs text-muted-foreground">Right Ear</span>
                <span className="font-bold text-green-500">{rightEarScore}</span>
              </Badge>
              <Badge variant="outline" className="gap-2">
                <span className="text-xs text-muted-foreground">Ear Advantage</span>
                <span className="font-bold text-primary">{rightEarScore - leftEarScore}</span>
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
          {phase === 'playing' ? (
            <motion.div
              key="playing"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              className="text-center w-full max-w-4xl"
            >
              {showSyllables ? (
                <Card className="p-12 bg-gradient-to-br from-primary/10 to-accent/10 border-2 border-primary/30">
                  <div className="text-xl font-bold text-foreground mb-6">
                    Listen carefully to both ears!
                  </div>
                  <div className="grid grid-cols-2 gap-8">
                    <motion.div
                      initial={{ x: -50, opacity: 0 }}
                      animate={{ x: 0, opacity: 1 }}
                      className="space-y-3"
                    >
                      <div className="flex items-center gap-2 justify-center">
                        <Ear size={32} className="text-blue-500" />
                        <span className="text-lg font-semibold text-blue-500">Left Ear</span>
                      </div>
                      <div className="bg-blue-500/20 border-2 border-blue-500 rounded-lg p-8">
                        <div className="text-6xl font-bold text-blue-600">
                          {leftEarSyllable}
                        </div>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Lower tone 🔉
                      </div>
                    </motion.div>
                    
                    <motion.div
                      initial={{ x: 50, opacity: 0 }}
                      animate={{ x: 0, opacity: 1 }}
                      className="space-y-3"
                    >
                      <div className="flex items-center gap-2 justify-center">
                        <Ear size={32} className="text-green-500" weight="fill" />
                        <span className="text-lg font-semibold text-green-500">Right Ear</span>
                      </div>
                      <div className="bg-green-500/20 border-2 border-green-500 rounded-lg p-8">
                        <div className="text-6xl font-bold text-green-600">
                          {rightEarSyllable}
                        </div>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Higher tone 🔊
                      </div>
                    </motion.div>
                  </div>
                </Card>
              ) : (
                <Card className="p-16 bg-gradient-to-br from-primary/10 to-accent/10 border-2 border-primary/30">
                  <motion.div
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ repeat: Infinity, duration: 1.5 }}
                  >
                    <SpeakerHigh size={120} weight="fill" className="text-primary mx-auto mb-6" />
                  </motion.div>
                  <div className="text-2xl font-bold text-foreground">
                    🎧 Listen carefully...
                  </div>
                  <p className="text-muted-foreground mt-2">
                    Make sure your headphones are on
                  </p>
                </Card>
              )}
            </motion.div>
          ) : (
            <motion.div
              key="responding"
              initial={{ scale: 0.8, opacity: 0, y: 50 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.8, opacity: 0, y: -50 }}
              className="w-full max-w-4xl"
            >
              <Card className={`p-8 border-2 shadow-2xl transition-all duration-200 ${
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
                    What did you hear in each ear?
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Select the syllable you heard in each ear
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-8 mb-8">
                  {/* Left Ear Selection */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 justify-center">
                      <Ear size={24} className="text-blue-500" />
                      <h4 className="text-lg font-semibold text-blue-500">Left Ear</h4>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      {SYLLABLES.slice(0, 6).map((syllable) => (
                        <Button
                          key={`left-${syllable}`}
                          variant={selectedLeft === syllable ? 'default' : 'outline'}
                          onClick={() => setSelectedLeft(syllable)}
                          disabled={feedback !== null}
                          className={selectedLeft === syllable ? 'bg-blue-500 hover:bg-blue-600' : ''}
                        >
                          {syllable}
                        </Button>
                      ))}
                    </div>
                  </div>

                  {/* Right Ear Selection */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 justify-center">
                      <Ear size={24} className="text-green-500" weight="fill" />
                      <h4 className="text-lg font-semibold text-green-500">Right Ear</h4>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      {SYLLABLES.slice(6, 12).map((syllable) => (
                        <Button
                          key={`right-${syllable}`}
                          variant={selectedRight === syllable ? 'default' : 'outline'}
                          onClick={() => setSelectedRight(syllable)}
                          disabled={feedback !== null}
                          className={selectedRight === syllable ? 'bg-green-500 hover:bg-green-600' : ''}
                        >
                          {syllable}
                        </Button>
                      ))}
                    </div>
                  </div>
                </div>

                <Button
                  size="lg"
                  className="w-full text-lg"
                  onClick={handleSubmit}
                  disabled={!selectedLeft || !selectedRight || feedback !== null}
                >
                  Submit Response
                </Button>

                {feedback && (
                  <motion.div
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className={`text-center mt-4 text-sm ${
                      feedback === 'correct' ? 'text-success' : 'text-destructive'
                    }`}
                  >
                    <div className="font-bold mb-1">
                      {feedback === 'correct' ? '✓ Both Correct!' : '✗ Incorrect'}
                    </div>
                    <div className="text-xs">
                      Left: {leftEarSyllable} | Right: {rightEarSyllable}
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
              <strong>Practice Mode:</strong> Get familiar with the task. Your practice results won't be saved.
            </p>
          )}
          <p className="text-center text-sm text-muted-foreground">
            <strong>Tip:</strong> Listen for the tone pitch (lower = left, higher = right) and watch the syllables carefully. 🎧
          </p>
        </div>
      </div>
    </div>
  )
}
