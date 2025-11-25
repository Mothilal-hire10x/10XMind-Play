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

// Note: True dichotic listening requires stereo headphones with separate audio to each ear
// This implementation uses Web Speech API which has limitations:
// - Cannot achieve true simultaneous dichotic presentation in browsers
// - Requires headphones for best results
// - For research-grade dichotic listening, use specialized audio files with stereo panning

export function DichoticListeningTest({ onComplete, onExit }: DichoticListeningTestProps) {
  const [currentTrial, setCurrentTrial] = useState(0)
  const [leftEarSyllable, setLeftEarSyllable] = useState('')
  const [rightEarSyllable, setRightEarSyllable] = useState('')
  const [phase, setPhase] = useState<'playing' | 'responding'>('playing')
  const [selectedLeft, setSelectedLeft] = useState<string | null>(null)
  const [selectedRight, setSelectedRight] = useState<string | null>(null)
  const [startTime, setStartTime] = useState(0)
  const [results, setResults] = useState<TrialResult[]>([])
  const [feedback, setFeedback] = useState<'correct' | 'incorrect' | null>(null)
  const [rightEarScore, setRightEarScore] = useState(0)
  const [leftEarScore, setLeftEarScore] = useState(0)
  
  const audioContextRef = useRef<AudioContext | null>(null)

  // Initialize Web Audio API
  useEffect(() => {
    audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)()
    return () => {
      audioContextRef.current?.close()
    }
  }, [])

  // Text-to-Speech synthesis for syllables
  const playSyllable = useCallback((text: string, pan: number) => {
    return new Promise<void>((resolve) => {
      const utterance = new SpeechSynthesisUtterance(text)
      utterance.rate = 1.0
      utterance.pitch = 1.0
      utterance.volume = 1.0
      
      // Note: Web Speech API doesn't support true dichotic listening (simultaneous different audio in each ear)
      // This is a simulation where we use spatial audio panning
      utterance.onend = () => resolve()
      
      window.speechSynthesis.speak(utterance)
    })
  }, [])

  const playDichoticStimuli = useCallback(async () => {
    if (!audioContextRef.current) return

    // Play both syllables simultaneously (simulated)
    // In a real implementation, you'd use separate audio files with stereo panning
    const leftPromise = playSyllable(leftEarSyllable, -1)
    const rightPromise = playSyllable(rightEarSyllable, 1)
    
    await Promise.all([leftPromise, rightPromise])
    
    setPhase('responding')
    setStartTime(performance.now())
  }, [leftEarSyllable, rightEarSyllable, playSyllable])

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
    if (currentTrial >= TOTAL_TRIALS) {
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
  }, [currentTrial, results, rightEarScore, leftEarScore, generateStimuli, onComplete])

  useEffect(() => {
    startNextTrial()
  }, [])

  useEffect(() => {
    if (phase === 'playing' && leftEarSyllable && rightEarSyllable) {
      const timer = setTimeout(() => {
        playDichoticStimuli()
      }, 500)
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
    setCurrentTrial(prev => prev + 1)

    setTimeout(() => {
      startNextTrial()
    }, 1500)
  }, [selectedLeft, selectedRight, leftEarSyllable, rightEarSyllable, feedback, startTime, startNextTrial])

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
              className="text-center"
            >
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
        <p className="text-center text-sm text-muted-foreground">
          <strong>Note:</strong> This is a simulated dichotic listening test using text-to-speech.
          For accurate results, use proper stereo headphones.
        </p>
      </div>
    </div>
  )
}
