import { useState, useEffect, useCallback, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { X, SpeakerHigh, Ear, Check, XCircle, Play, Headphones, Waveform } from '@phosphor-icons/react'
import { TrialResult, GameSummary } from '@/lib/types'
import { motion, AnimatePresence } from 'framer-motion'

interface DichoticListeningTestProps {
  onComplete: (results: TrialResult[], summary: GameSummary) => void
  onExit: () => void
}

// Words for the test
const LEFT_WORDS = ['Apple', 'Bird', 'Chair', 'Dog', 'Fish', 'Green']
const RIGHT_WORDS = ['House', 'King', 'Moon', 'Rain', 'Star', 'Tree']
const TOTAL_TRIALS = 24
const PRACTICE_TRIALS = 3

type GamePhase = 'instructions' | 'audio-check' | 'practice' | 'test'
type TrialPhase = 'ready' | 'playing' | 'responding'

export function DichoticListeningTest({ onComplete, onExit }: DichoticListeningTestProps) {
  const [gamePhase, setGamePhase] = useState<GamePhase>('instructions')
  const [instructionPage, setInstructionPage] = useState(0)
  const [practiceTrialCount, setPracticeTrialCount] = useState(0)
  const [practiceComplete, setPracticeComplete] = useState(false)
  
  const [currentTrial, setCurrentTrial] = useState(0)
  const [leftEarWord, setLeftEarWord] = useState('')
  const [rightEarWord, setRightEarWord] = useState('')
  const [phase, setPhase] = useState<TrialPhase>('ready')
  const [selectedLeft, setSelectedLeft] = useState<string | null>(null)
  const [selectedRight, setSelectedRight] = useState<string | null>(null)
  const [startTime, setStartTime] = useState(0)
  const [results, setResults] = useState<TrialResult[]>([])
  const [feedback, setFeedback] = useState<'correct' | 'incorrect' | null>(null)
  const [rightEarScore, setRightEarScore] = useState(0)
  const [leftEarScore, setLeftEarScore] = useState(0)
  
  const [isPlayingAudio, setIsPlayingAudio] = useState(false)
  const [audioTestPassed, setAudioTestPassed] = useState(false)
  const [canReplay, setCanReplay] = useState(false)
  const [currentSpokenWord, setCurrentSpokenWord] = useState<string>('')
  const [audioMethod, setAudioMethod] = useState<'speech' | 'tone'>('speech')
  const [speechReady, setSpeechReady] = useState(true) // Assume ready by default
  
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
    }
  }, [])

  // Play a distinctive tone for each word (musical notes)
  const playWordTone = useCallback((word: string, isSecondWord: boolean): Promise<void> => {
    return new Promise((resolve) => {
      try {
        const ctx = getAudioContext()
        
        // Different frequencies for different words - creates a melody
        const frequencies: Record<string, number> = {
          // Left words - lower octave
          'Apple': 262, 'Bird': 294, 'Chair': 330, 'Dog': 349, 'Fish': 392, 'Green': 440,
          // Right words - higher octave
          'House': 523, 'King': 587, 'Moon': 659, 'Rain': 698, 'Star': 784, 'Tree': 880
        }
        
        const freq = frequencies[word] || (isSecondWord ? 660 : 440)
        const duration = 0.6
        
        // Create oscillator with envelope for pleasant sound
        const osc = ctx.createOscillator()
        const gain = ctx.createGain()
        
        // Use triangle wave for softer sound
        osc.type = 'triangle'
        osc.frequency.setValueAtTime(freq, ctx.currentTime)
        
        // Smooth envelope
        gain.gain.setValueAtTime(0, ctx.currentTime)
        gain.gain.linearRampToValueAtTime(0.4, ctx.currentTime + 0.05)
        gain.gain.setValueAtTime(0.4, ctx.currentTime + duration - 0.15)
        gain.gain.linearRampToValueAtTime(0, ctx.currentTime + duration)
        
        // Stereo panning - left for first word, right for second
        const panner = ctx.createStereoPanner()
        panner.pan.setValueAtTime(isSecondWord ? 0.8 : -0.8, ctx.currentTime)
        
        osc.connect(gain)
        gain.connect(panner)
        panner.connect(ctx.destination)
        
        osc.start(ctx.currentTime)
        osc.stop(ctx.currentTime + duration)
        
        osc.onended = () => resolve()
        
        // Fallback timeout
        setTimeout(resolve, (duration + 0.1) * 1000)
      } catch (e) {
        console.error('Tone error:', e)
        resolve()
      }
    })
  }, [getAudioContext])

  // Try Web Speech API
  const speakWithSpeechAPI = useCallback((word: string): Promise<boolean> => {
    return new Promise((resolve) => {
      if (!('speechSynthesis' in window)) {
        resolve(false)
        return
      }

      speechSynthesis.cancel()
      
      const utterance = new SpeechSynthesisUtterance(word)
      const voices = speechSynthesis.getVoices()
      
      // Find English voice
      const englishVoice = voices.find(v => v.lang.startsWith('en'))
      if (englishVoice) {
        utterance.voice = englishVoice
      }
      
      utterance.rate = 0.9
      utterance.volume = 1.0
      utterance.lang = 'en-US'

      let spoken = false
      
      utterance.onstart = () => {
        spoken = true
      }
      
      utterance.onend = () => {
        resolve(spoken)
      }
      
      utterance.onerror = () => {
        resolve(false)
      }

      // Timeout - if nothing happens in 1.5s, speech failed
      setTimeout(() => {
        if (!spoken) {
          speechSynthesis.cancel()
          resolve(false)
        }
      }, 1500)

      speechSynthesis.speak(utterance)
    })
  }, [])

  // Main speak function - tries speech API first, falls back to tones
  const speakWord = useCallback(async (word: string, isSecondWord: boolean = false): Promise<void> => {
    setCurrentSpokenWord(word)
    
    // Try speech synthesis first
    if (audioMethod === 'speech') {
      const success = await speakWithSpeechAPI(word)
      if (success) {
        setCurrentSpokenWord('')
        return
      }
      // Speech failed, switch to tone mode
      console.log('Speech synthesis failed, using tones')
      setAudioMethod('tone')
    }
    
    // Use tone
    await playWordTone(word, isSecondWord)
    setCurrentSpokenWord('')
  }, [audioMethod, speakWithSpeechAPI, playWordTone])

  // Play both words sequentially
  const playDichoticStimuli = useCallback(async () => {
    if (isPlayingAudio) return
    
    setIsPlayingAudio(true)
    setCanReplay(false)

    console.log('Playing words:', leftEarWord, rightEarWord)

    // Speak first word (left ear)
    await speakWord(leftEarWord, false)
    
    // Brief pause
    await new Promise(r => setTimeout(r, 500))
    
    // Speak second word (right ear)
    await speakWord(rightEarWord, true)
    
    await new Promise(r => setTimeout(r, 300))
    
    setIsPlayingAudio(false)
    setPhase('responding')
    setStartTime(performance.now())
    setCanReplay(true)
  }, [leftEarWord, rightEarWord, isPlayingAudio, speakWord])

  // Replay audio
  const replayAudio = useCallback(async () => {
    if (isPlayingAudio || !canReplay) return
    
    setIsPlayingAudio(true)
    
    await speakWord(leftEarWord, false)
    await new Promise(r => setTimeout(r, 500))
    await speakWord(rightEarWord, true)
    
    setIsPlayingAudio(false)
  }, [leftEarWord, rightEarWord, isPlayingAudio, canReplay, speakWord])

  // Audio test - this is called on button click (user interaction)
  const playAudioTest = useCallback(async (ear: 'left' | 'right' | 'both') => {
    console.log('Audio test for:', ear)
    
    // Initialize audio context on user click
    getAudioContext()
    
    setIsPlayingAudio(true)
    
    if (ear === 'left') {
      await speakWord('Apple', false)
    } else if (ear === 'right') {
      await speakWord('Tree', true)
    } else {
      await speakWord('Apple', false)
      await new Promise(r => setTimeout(r, 500))
      await speakWord('Tree', true)
    }
    
    setIsPlayingAudio(false)
  }, [speakWord, getAudioContext])

  const generateStimuli = useCallback(() => {
    const leftIdx = Math.floor(Math.random() * LEFT_WORDS.length)
    const rightIdx = Math.floor(Math.random() * RIGHT_WORDS.length)
    
    setLeftEarWord(LEFT_WORDS[leftIdx])
    setRightEarWord(RIGHT_WORDS[rightIdx])
  }, [])

  const startNextTrial = useCallback(() => {
    const totalTrialsForPhase = gamePhase === 'practice' ? PRACTICE_TRIALS : TOTAL_TRIALS
    const currentTrialCount = gamePhase === 'practice' ? practiceTrialCount : currentTrial
    
    if (currentTrialCount >= totalTrialsForPhase) {
      if (gamePhase === 'practice') {
        // Practice complete, show transition screen
        setPracticeComplete(true)
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

    setPhase('ready')
    setFeedback(null)
    setSelectedLeft(null)
    setSelectedRight(null)
    setCanReplay(false)
    generateStimuli()
  }, [currentTrial, practiceTrialCount, gamePhase, results, rightEarScore, leftEarScore, generateStimuli, onComplete])

  useEffect(() => {
    if (gamePhase === 'practice' || gamePhase === 'test') {
      console.log('Starting trial for phase:', gamePhase)
      // Reset state and start first trial
      setPhase('ready')
      setFeedback(null)
      setSelectedLeft(null)
      setSelectedRight(null)
      setCanReplay(false)
      generateStimuli()
    }
  }, [gamePhase, generateStimuli])

  // Auto-play audio when ready phase starts
  useEffect(() => {
    if (phase === 'ready' && leftEarWord && rightEarWord) {
      console.log('Auto-playing stimuli for:', leftEarWord, rightEarWord)
      const timer = setTimeout(() => {
        playDichoticStimuli()
      }, 1500) // Give user time to prepare
      return () => clearTimeout(timer)
    }
  }, [phase, leftEarWord, rightEarWord, playDichoticStimuli])

  const handleSubmit = useCallback(() => {
    if (!selectedLeft || !selectedRight || feedback) return

    const reactionTime = performance.now() - startTime
    const leftCorrect = selectedLeft === leftEarWord
    const rightCorrect = selectedRight === rightEarWord
    const bothCorrect = leftCorrect && rightCorrect

    if (leftCorrect) setLeftEarScore(prev => prev + 1)
    if (rightCorrect) setRightEarScore(prev => prev + 1)

    const trialResult: TrialResult = {
      stimulus: `L:${leftEarWord} R:${rightEarWord}`,
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
  }, [selectedLeft, selectedRight, leftEarWord, rightEarWord, feedback, startTime, gamePhase, startNextTrial])

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
      // Go to audio check before practice
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
                Click the buttons below to hear the words spoken
              </p>
              <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300">
                <span>🔊 Click a button to test your audio</span>
              </div>
              
              {/* Audio mode indicator */}
              <div className={`p-2 rounded-lg text-sm ${
                audioMethod === 'speech' 
                  ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300' 
                  : 'bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-300'
              }`}>
                {audioMethod === 'speech' ? (
                  <span>✅ Speech synthesis available - You will hear spoken words</span>
                ) : (
                  <span>🎵 Using musical tones - Each word has a unique tone + visual display</span>
                )}
              </div>
              
              {!speechReady && (
                <div className="p-2 rounded-lg text-sm bg-orange-50 dark:bg-orange-900/20 text-orange-700 dark:text-orange-300">
                  <span>⏳ Loading speech voices...</span>
                </div>
              )}
            </div>

            {/* Show current word being spoken */}
            {currentSpokenWord && (
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="py-6"
              >
                <div className="text-6xl font-bold text-primary animate-pulse">
                  "{currentSpokenWord}"
                </div>
                <p className="text-sm text-muted-foreground mt-2">Speaking...</p>
              </motion.div>
            )}

            <div className="bg-muted/50 p-6 rounded-lg space-y-4">
              <p className="text-base font-medium">
                👆 Click each button to hear the word spoken:
              </p>
              
              <div className="grid grid-cols-3 gap-4">
                <Button
                  size="lg"
                  variant="outline"
                  onClick={() => playAudioTest('left')}
                  disabled={isPlayingAudio}
                  className="flex flex-col gap-2 h-auto py-4 border-blue-500/50 hover:bg-blue-500/10"
                >
                  <SpeakerHigh size={32} className="text-blue-500" />
                  <span className="text-blue-600 font-semibold">"Apple"</span>
                  <span className="text-xs text-muted-foreground">First word</span>
                </Button>
                
                <Button
                  size="lg"
                  variant="outline"
                  onClick={() => playAudioTest('right')}
                  disabled={isPlayingAudio}
                  className="flex flex-col gap-2 h-auto py-4 border-green-500/50 hover:bg-green-500/10"
                >
                  <SpeakerHigh size={32} className="text-green-500" weight="fill" />
                  <span className="text-green-600 font-semibold">"Tree"</span>
                  <span className="text-xs text-muted-foreground">Second word</span>
                </Button>
                
                <Button
                  size="lg"
                  variant="outline"
                  onClick={() => playAudioTest('both')}
                  disabled={isPlayingAudio}
                  className="flex flex-col gap-2 h-auto py-4 border-purple-500/50 hover:bg-purple-500/10"
                >
                  <Waveform size={32} className="text-purple-500" weight="fill" />
                  <span className="text-purple-600 font-semibold">Both Words</span>
                  <span className="text-xs text-muted-foreground">Apple then Tree</span>
                </Button>
              </div>

              {isPlayingAudio && !currentSpokenWord && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex items-center justify-center gap-2 text-primary"
                >
                  <motion.div
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ repeat: Infinity, duration: 0.5 }}
                  >
                    <SpeakerHigh size={24} weight="fill" />
                  </motion.div>
                  <span>Loading audio...</span>
                </motion.div>
              )}
            </div>

            <div className="border-l-4 border-yellow-500 pl-4 py-2 bg-yellow-50 dark:bg-yellow-900/20 text-left">
              <p className="text-sm">
                <strong>⚠️ Can't hear the words?</strong> Try:
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
                  setInstructionPage(3)
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
            setLeftEarScore(0)
            setRightEarScore(0)
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
                You'll complete {TOTAL_TRIALS} trials testing which ear is dominant for speech processing.
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
                  
                  <div className="space-y-4 text-lg">
                    <p>
                      Welcome to the <strong>Dichotic Listening Test</strong>, a classic neuropsychological 
                      assessment that measures your auditory attention and brain hemisphere dominance.
                    </p>
                    
                    <p>
                      In this test, you'll hear <strong>two different words spoken one after another</strong>. 
                      Your task is to identify both words correctly.
                    </p>

                    <div className="bg-muted/50 p-4 rounded-lg">
                      <p className="font-semibold mb-2">What you'll experience:</p>
                      <ul className="list-disc list-inside space-y-2">
                        <li><strong>Two words will be spoken</strong> - first word (lower pitch), then second word (higher pitch)</li>
                        <li>Listen carefully to both words</li>
                        <li>You'll select both words from the provided options</li>
                        <li>You can replay the audio if needed</li>
                      </ul>
                    </div>

                    <div className="border-l-4 border-blue-500 pl-4 py-2 bg-blue-50 dark:bg-blue-900/20">
                      <p className="text-base font-semibold">
                        🔊 Turn up your volume!
                      </p>
                      <p className="text-sm mt-1">
                        Make sure your device volume is at a comfortable level so you can hear the words clearly.
                      </p>
                    </div>

                    <p className="text-muted-foreground text-base">
                      This test measures your auditory attention and memory - your ability to process 
                      and remember spoken information quickly.
                    </p>
                  </div>
                </div>
              )}

              {instructionPage === 1 && (
                <div className="space-y-6">
                  <div className="text-center">
                    <h1 className="text-4xl font-bold mb-2">How It Works</h1>
                    <Badge variant="outline" className="mb-4">Instructions</Badge>
                  </div>
                  
                  <div className="space-y-4 text-lg">
                    <div className="bg-muted/50 p-4 rounded-lg">
                      <p className="font-semibold mb-3">Step-by-Step:</p>
                      <ol className="list-decimal list-inside space-y-3">
                        <li>
                          <strong>Get ready to listen</strong> - Two words will be spoken aloud
                        </li>
                        <li>
                          <strong>Listen carefully</strong> - First word has a lower pitch, 
                          second word has a higher pitch
                        </li>
                        <li>
                          <strong>Remember both words</strong> - Pay attention to both spoken words
                        </li>
                        <li>
                          <strong>Use Replay if needed</strong> - Click "Replay Audio" to hear the tones again
                        </li>
                        <li>
                          <strong>Select your answers</strong> - Choose the words you heard
                        </li>
                        <li>
                          <strong>Submit</strong> - Click "Submit Response" when you've made both selections
                        </li>
                      </ol>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="border border-blue-500/30 bg-blue-500/5 p-3 rounded">
                        <div className="flex items-center gap-2 mb-2">
                          <Ear size={20} className="text-blue-500" />
                          <h3 className="font-semibold text-blue-600">First Word (Lower Pitch)</h3>
                        </div>
                        <p className="text-sm font-mono">Apple, Bird, Chair, Dog, Fish, Green</p>
                        <p className="text-xs text-muted-foreground mt-1">Spoken first with lower pitch</p>
                      </div>
                      <div className="border border-green-500/30 bg-green-500/5 p-3 rounded">
                        <div className="flex items-center gap-2 mb-2">
                          <Ear size={20} className="text-green-500" weight="fill" />
                          <h3 className="font-semibold text-green-600">Second Word (Higher Pitch)</h3>
                        </div>
                        <p className="text-sm font-mono">House, King, Moon, Rain, Star, Tree</p>
                        <p className="text-xs text-muted-foreground mt-1">Spoken second with higher pitch</p>
                      </div>
                    </div>

                    <p className="text-muted-foreground text-base">
                      🔊 <strong>Turn up your volume!</strong> 
                      Make sure you can clearly hear both words when they are spoken.
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
                          <span>Adjust your volume to a comfortable level</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-green-600 font-bold mt-1">✓</span>
                          <span>Listen carefully to both words - they come quickly!</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-green-600 font-bold mt-1">✓</span>
                          <span>Use the Replay button if you missed something</span>
                        </li>
                      </ul>
                    </div>

                    <div className="border-l-4 border-blue-500 pl-4 py-2">
                      <p className="text-base">
                        <strong>What we're measuring:</strong> This test assesses your auditory attention 
                        and short-term memory - your ability to quickly process and remember spoken words.
                      </p>
                    </div>

                    <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg border border-green-200 dark:border-green-800">
                      <p className="text-sm">
                        <strong>Pro tip:</strong> The first word always has a lower pitch and the second 
                        word has a higher pitch. This helps you distinguish between them.
                      </p>
                    </div>

                    <p className="text-center text-muted-foreground text-base mt-6">
                      You'll start with <strong className="text-yellow-600">{PRACTICE_TRIALS} practice trials</strong> to 
                      get familiar with the task, then proceed to <strong>{TOTAL_TRIALS} test trials</strong>.
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
                      Before the actual test, you'll complete <strong>{PRACTICE_TRIALS} practice trials</strong> to get comfortable with the listening task.
                    </p>
                    
                    <div className="bg-muted/50 p-6 rounded-lg space-y-3">
                      <p className="font-semibold mb-3">During practice, you will experience:</p>
                      <div className="flex items-start gap-3">
                        <span className="text-2xl">🔊</span>
                        <p className="text-base">
                          <strong>Two words spoken</strong> - first word (lower pitch), then second word (higher pitch)
                        </p>
                      </div>
                      <div className="flex items-start gap-3">
                        <span className="text-2xl text-green-600">✓</span>
                        <p className="text-base">
                          <strong className="text-green-600">Green checkmark</strong> when you correctly identify both words
                        </p>
                      </div>
                      <div className="flex items-start gap-3">
                        <span className="text-2xl text-red-600">✗</span>
                        <p className="text-base">
                          <strong className="text-red-600">Red X</strong> when one or both selections are incorrect
                        </p>
                      </div>
                      <div className="flex items-start gap-3">
                        <span className="text-2xl">🔁</span>
                        <p className="text-base">
                          Click <strong>Replay Audio</strong> to hear the words again if needed
                        </p>
                      </div>
                    </div>

                    <div className="bg-primary/10 p-4 rounded-lg border-l-4 border-primary">
                      <p className="text-base font-semibold">
                        💡 Tip: Make sure your device volume is turned up so you can hear the words clearly!
                      </p>
                    </div>

                    <p className="text-center text-muted-foreground text-base mt-4">
                      The practice will help you get used to focusing on each ear separately.
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
                <span className="text-xs text-muted-foreground">First Word</span>
                <span className="font-bold text-blue-500">{leftEarScore}</span>
              </Badge>
              <Badge variant="outline" className="gap-2">
                <span className="text-xs text-muted-foreground">Second Word</span>
                <span className="font-bold text-green-500">{rightEarScore}</span>
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
                  Two words will be spoken in a moment...
                </p>
                <motion.div
                  className="flex items-center justify-center gap-2 text-primary"
                  animate={{ opacity: [1, 0.5, 1] }}
                  transition={{ repeat: Infinity, duration: 1 }}
                >
                  <SpeakerHigh size={24} weight="fill" />
                  <span className="font-medium">Preparing audio...</span>
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
              <Card className="p-16 bg-gradient-to-br from-primary/10 to-accent/10 border-2 border-primary/30">
                <motion.div
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ repeat: Infinity, duration: 0.5 }}
                  className="flex justify-center mb-6"
                >
                  <div className="p-6 bg-yellow-500/20 rounded-full">
                    <SpeakerHigh size={80} weight="fill" className="text-yellow-600" />
                  </div>
                </motion.div>
                
                {/* Show current word being spoken */}
                {currentSpokenWord ? (
                  <motion.div
                    key={currentSpokenWord}
                    initial={{ scale: 0.5, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="mb-4"
                  >
                    <div className="text-6xl font-bold text-primary">
                      "{currentSpokenWord}"
                    </div>
                  </motion.div>
                ) : (
                  <div className="text-3xl font-bold text-foreground mb-2">
                    🔊 Speaking...
                  </div>
                )}
                
                <p className="text-lg text-muted-foreground">
                  Listen carefully to both words!
                </p>
                <div className="flex justify-center gap-8 mt-6">
                  <div className="flex items-center gap-2 text-blue-500">
                    <SpeakerHigh size={24} />
                    <span className="font-semibold">First Word</span>
                  </div>
                  <div className="flex items-center gap-2 text-green-500">
                    <SpeakerHigh size={24} weight="fill" />
                    <span className="font-semibold">Second Word</span>
                  </div>
                </div>
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
              <Card className={`p-8 border-2 shadow-2xl transition-all duration-200 relative ${
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

                <div className="text-center mb-6">
                  <h3 className="text-2xl font-bold text-foreground mb-2">
                    What words did you hear?
                  </h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Select the first word (lower pitch) and second word (higher pitch)
                  </p>
                  
                  {/* Replay Audio Button */}
                  <Button
                    variant="outline"
                    size="lg"
                    onClick={replayAudio}
                    disabled={isPlayingAudio || feedback !== null}
                    className="gap-2 border-primary/50 hover:bg-primary/10"
                  >
                    {isPlayingAudio ? (
                      <>
                        <motion.div
                          animate={{ scale: [1, 1.2, 1] }}
                          transition={{ repeat: Infinity, duration: 0.5 }}
                        >
                          <SpeakerHigh size={20} weight="fill" className="text-primary" />
                        </motion.div>
                        <span>Playing...</span>
                      </>
                    ) : (
                      <>
                        <Play size={20} weight="fill" />
                        <span>Replay Audio</span>
                      </>
                    )}
                  </Button>
                </div>

                <div className="grid grid-cols-2 gap-8 mb-8">
                  {/* First Word Selection */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 justify-center">
                      <SpeakerHigh size={24} className="text-blue-500" />
                      <h4 className="text-lg font-semibold text-blue-500">First Word</h4>
                    </div>
                    <p className="text-xs text-center text-muted-foreground -mt-2">Lower pitch</p>
                    <div className="grid grid-cols-2 gap-2">
                      {LEFT_WORDS.map((word) => (
                        <Button
                          key={`left-${word}`}
                          variant={selectedLeft === word ? 'default' : 'outline'}
                          onClick={() => setSelectedLeft(word)}
                          disabled={feedback !== null}
                          className={`text-base font-semibold ${selectedLeft === word ? 'bg-blue-500 hover:bg-blue-600' : 'hover:bg-blue-500/10 hover:border-blue-500'}`}
                        >
                          {word}
                        </Button>
                      ))}
                    </div>
                  </div>

                  {/* Second Word Selection */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 justify-center">
                      <SpeakerHigh size={24} className="text-green-500" weight="fill" />
                      <h4 className="text-lg font-semibold text-green-500">Second Word</h4>
                    </div>
                    <p className="text-xs text-center text-muted-foreground -mt-2">Higher pitch</p>
                    <div className="grid grid-cols-2 gap-2">
                      {RIGHT_WORDS.map((word) => (
                        <Button
                          key={`right-${word}`}
                          variant={selectedRight === word ? 'default' : 'outline'}
                          onClick={() => setSelectedRight(word)}
                          disabled={feedback !== null}
                          className={`text-base font-semibold ${selectedRight === word ? 'bg-green-500 hover:bg-green-600' : 'hover:bg-green-500/10 hover:border-green-500'}`}
                        >
                          {word}
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
                      First word: {leftEarWord} | Second word: {rightEarWord}
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
              <strong>Practice Mode:</strong> Get familiar with the words. Your practice results won't be saved.
            </p>
          )}
          <p className="text-center text-sm text-muted-foreground">
            <strong>Tip:</strong> First word = lower pitch, Second word = higher pitch. Use Replay if you missed something! 🔊
          </p>
        </div>
      </div>
    </div>
  )
}
