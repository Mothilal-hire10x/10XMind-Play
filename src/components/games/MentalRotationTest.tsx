import { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { X, Cube, Check } from '@phosphor-icons/react'
import { TrialResult, GameSummary } from '@/lib/types'
import { motion, AnimatePresence } from 'framer-motion'
import { Checkbox } from '@/components/ui/checkbox'

interface MentalRotationTestProps {
  onComplete: (results: TrialResult[], summary: GameSummary) => void
  onExit: () => void
}

interface Question {
  target: string
  targetRotation: number
  options: Array<{
    figure: string
    rotation: number
    isMirror: boolean
    isDifferent: boolean
    isCorrect: boolean
  }>
  correctIndices: number[]
}

type GamePhase = 'instructions' | 'practice' | 'test'

const TOTAL_QUESTIONS = 24
const PRACTICE_QUESTIONS = 3
const MAX_SCORE = 48 // 24 questions × 2 correct answers each

export function MentalRotationTest({ onComplete, onExit }: MentalRotationTestProps) {
  const [gamePhase, setGamePhase] = useState<GamePhase>('instructions')
  const [instructionPage, setInstructionPage] = useState(0)
  const [practiceComplete, setPracticeComplete] = useState(false)
  const [currentQuestion, setCurrentQuestion] = useState(0)
  const [questionData, setQuestionData] = useState<Question | null>(null)
  const [selectedOptions, setSelectedOptions] = useState<Set<number>>(new Set())
  const [startTime, setStartTime] = useState(0)
  const [results, setResults] = useState<TrialResult[]>([])
  const [showFeedback, setShowFeedback] = useState(false)
  const [questionResults, setQuestionResults] = useState<Array<{
    correct: number
    incorrect: number
    mirrorErrors: number
    differentFigureErrors: number
  }>>([])

  const figures = [
    'fig1', 'fig2', 'fig3', 'fig4', 'fig5', 'fig6', 'fig7', 'fig8',
    'fig9', 'fig10', 'fig11', 'fig12', 'fig13', 'fig14', 'fig15', 'fig16'
  ]

  const rotations = [0, 45, 90, 135, 180, 225, 270, 315]

  const generateQuestion = useCallback((): Question => {
    const targetFigure = figures[Math.floor(Math.random() * figures.length)]
    const targetRotation = rotations[Math.floor(Math.random() * rotations.length)]
    
    // Get a different figure for the "different figure" option
    let differentFigure = figures[Math.floor(Math.random() * figures.length)]
    while (differentFigure === targetFigure) {
      differentFigure = figures[Math.floor(Math.random() * figures.length)]
    }

    // Create options array
    const options = [
      // 2 correct answers (rotated versions of target)
      {
        figure: targetFigure,
        rotation: rotations[Math.floor(Math.random() * rotations.length)],
        isMirror: false,
        isDifferent: false,
        isCorrect: true
      },
      {
        figure: targetFigure,
        rotation: rotations[Math.floor(Math.random() * rotations.length)],
        isMirror: false,
        isDifferent: false,
        isCorrect: true
      },
      // 1 mirror image
      {
        figure: targetFigure,
        rotation: rotations[Math.floor(Math.random() * rotations.length)],
        isMirror: true,
        isDifferent: false,
        isCorrect: false
      },
      // 1 completely different figure
      {
        figure: differentFigure,
        rotation: rotations[Math.floor(Math.random() * rotations.length)],
        isMirror: false,
        isDifferent: true,
        isCorrect: false
      }
    ]

    // Shuffle options
    for (let i = options.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [options[i], options[j]] = [options[j], options[i]]
    }

    // Find correct indices after shuffle
    const correctIndices = options
      .map((opt, idx) => opt.isCorrect ? idx : -1)
      .filter(idx => idx !== -1)

    return {
      target: targetFigure,
      targetRotation,
      options,
      correctIndices
    }
  }, [])

  const startNextQuestion = useCallback(() => {
    const maxQuestions = gamePhase === 'practice' ? PRACTICE_QUESTIONS : TOTAL_QUESTIONS
    
    if (currentQuestion >= maxQuestions) {
      if (gamePhase === 'practice') {
        setPracticeComplete(true)
        return
      }
      
      // Calculate final results
      const totalCorrectSelections = questionResults.reduce((sum, q) => sum + q.correct, 0)
      const totalIncorrectSelections = questionResults.reduce((sum, q) => sum + q.incorrect, 0)
      const totalMirrorErrors = questionResults.reduce((sum, q) => sum + q.mirrorErrors, 0)
      const totalDifferentFigureErrors = questionResults.reduce((sum, q) => sum + q.differentFigureErrors, 0)
      
      const avgRT = results.reduce((sum, r) => sum + r.reactionTime, 0) / results.length

      onComplete(results, {
        score: totalCorrectSelections,
        accuracy: (totalCorrectSelections / MAX_SCORE) * 100,
        reactionTime: avgRT,
        errorCount: totalIncorrectSelections,
        errorRate: (totalIncorrectSelections / MAX_SCORE) * 100,
        details: {
          maxScore: MAX_SCORE,
          totalQuestions: TOTAL_QUESTIONS,
          correctSelections: totalCorrectSelections,
          incorrectSelections: totalIncorrectSelections,
          mirrorErrors: totalMirrorErrors,
          differentFigureErrors: totalDifferentFigureErrors,
          avgReactionTime: Math.round(avgRT)
        }
      })
      return
    }

    setShowFeedback(false)
    setSelectedOptions(new Set())
    const question = generateQuestion()
    setQuestionData(question)
    setStartTime(performance.now())
  }, [currentQuestion, results, questionResults, gamePhase, generateQuestion, onComplete])

  useEffect(() => {
    if (gamePhase === 'test' || gamePhase === 'practice') {
      startNextQuestion()
    }
  }, [gamePhase])

  const handleSubmit = useCallback(() => {
    if (!questionData || showFeedback || selectedOptions.size === 0) return

    const reactionTime = performance.now() - startTime
    const selectedArray = Array.from(selectedOptions)
    
    // Check each selected option
    let correctCount = 0
    let incorrectCount = 0
    let mirrorErrors = 0
    let differentFigureErrors = 0
    
    selectedArray.forEach(idx => {
      const option = questionData.options[idx]
      if (option.isCorrect) {
        correctCount++
      } else {
        incorrectCount++
        if (option.isMirror) {
          mirrorErrors++
        } else if (option.isDifferent) {
          differentFigureErrors++
        }
      }
    })

    // Track missed correct answers
    const missedCorrect = questionData.correctIndices.filter(
      idx => !selectedOptions.has(idx)
    ).length

    const questionResult = {
      correct: correctCount,
      incorrect: incorrectCount,
      mirrorErrors,
      differentFigureErrors
    }
    
    setQuestionResults(prev => [...prev, questionResult])

    // Create trial result for this question
    const trialResult: TrialResult = {
      stimulus: `Question ${currentQuestion + 1}: ${questionData.target}@${questionData.targetRotation}°`,
      response: `Selected: ${selectedArray.map(i => i + 1).join(',')} | Correct: ${questionData.correctIndices.map(i => i + 1).join(',')}`,
      correct: correctCount === 2 && incorrectCount === 0,
      reactionTime,
      trialType: 'mental-rotation',
      status: correctCount === 2 && incorrectCount === 0 ? 1 : 2
    }

    if (gamePhase === 'test') {
      setResults(prev => [...prev, trialResult])
    }
    
    setShowFeedback(true)

    setTimeout(() => {
      setCurrentQuestion(prev => prev + 1)
      startNextQuestion()
    }, gamePhase === 'practice' ? 2000 : 1200)
  }, [questionData, showFeedback, selectedOptions, startTime, currentQuestion, gamePhase, startNextQuestion])

  const toggleOption = (index: number) => {
    if (showFeedback) return
    
    setSelectedOptions(prev => {
      const newSet = new Set(prev)
      if (newSet.has(index)) {
        newSet.delete(index)
      } else {
        newSet.add(index)
      }
      return newSet
    })
  }

  // Render 3D block figures
  const renderShape = (figType: string, rotation: number, isMirror: boolean, size: number = 150) => {
    const figureShapes: Record<string, React.ReactNode> = {
      fig1: (
        <g>
          <path d="M30,50 L50,40 L50,80 L30,90 Z" fill="#000" />
          <path d="M50,40 L70,50 L70,90 L50,80 Z" fill="#000" opacity="0.7" />
          <path d="M30,50 L50,40 L70,50 L50,60 Z" fill="#000" opacity="0.9" />
          <path d="M50,20 L70,10 L70,50 L50,40 Z" fill="#000" opacity="0.7" />
          <path d="M30,30 L50,20 L50,40 L30,50 Z" fill="#000" />
          <path d="M30,30 L50,20 L70,10 L50,0 Z" fill="#000" opacity="0.9" />
        </g>
      ),
      fig2: (
        <g>
          <path d="M40,60 L60,50 L60,85 L40,95 Z" fill="#000" />
          <path d="M60,50 L80,60 L80,95 L60,85 Z" fill="#000" opacity="0.7" />
          <path d="M40,60 L60,50 L80,60 L60,70 Z" fill="#000" opacity="0.9" />
          <path d="M20,45 L40,35 L40,60 L20,70 Z" fill="#000" />
          <path d="M40,35 L60,25 L60,50 L40,60 Z" fill="#000" opacity="0.7" />
        </g>
      ),
      fig3: (
        <g>
          <path d="M35,70 L55,60 L55,90 L35,100 Z" fill="#000" />
          <path d="M55,60 L75,50 L75,80 L55,90 Z" fill="#000" opacity="0.7" />
          <path d="M55,30 L75,20 L75,50 L55,60 Z" fill="#000" opacity="0.7" />
          <path d="M35,40 L55,30 L55,60 L35,70 Z" fill="#000" />
          <path d="M35,40 L55,30 L75,20 L55,10 Z" fill="#000" opacity="0.9" />
        </g>
      ),
      fig4: (
        <g>
          <path d="M25,65 L45,55 L45,85 L25,95 Z" fill="#000" />
          <path d="M45,55 L65,45 L65,75 L45,85 Z" fill="#000" opacity="0.7" />
          <path d="M65,45 L85,35 L85,65 L65,75 Z" fill="#000" opacity="0.7" />
          <path d="M45,25 L65,15 L65,45 L45,55 Z" fill="#000" opacity="0.7" />
          <path d="M25,35 L45,25 L45,55 L25,65 Z" fill="#000" />
        </g>
      ),
      fig5: (
        <g>
          <path d="M30,55 L50,45 L50,75 L30,85 Z" fill="#000" />
          <path d="M50,45 L70,35 L70,65 L50,75 Z" fill="#000" opacity="0.7" />
          <path d="M50,15 L70,5 L70,35 L50,45 Z" fill="#000" opacity="0.7" />
          <path d="M70,35 L90,25 L90,55 L70,65 Z" fill="#000" opacity="0.7" />
        </g>
      ),
      fig6: (
        <g>
          <path d="M40,65 L60,55 L60,80 L40,90 Z" fill="#000" />
          <path d="M60,55 L80,45 L80,70 L60,80 Z" fill="#000" opacity="0.7" />
          <path d="M40,40 L60,30 L60,55 L40,65 Z" fill="#000" />
          <path d="M20,50 L40,40 L40,65 L20,75 Z" fill="#000" opacity="0.8" />
        </g>
      ),
      fig7: (
        <g>
          <path d="M35,60 L55,50 L55,80 L35,90 Z" fill="#000" />
          <path d="M55,50 L75,40 L75,70 L55,80 Z" fill="#000" opacity="0.7" />
          <path d="M55,20 L75,10 L75,40 L55,50 Z" fill="#000" opacity="0.7" />
          <path d="M35,30 L55,20 L55,50 L35,60 Z" fill="#000" />
          <path d="M15,40 L35,30 L35,60 L15,70 Z" fill="#000" opacity="0.8" />
        </g>
      ),
      fig8: (
        <g>
          <path d="M45,70 L65,60 L65,85 L45,95 Z" fill="#000" />
          <path d="M25,55 L45,45 L45,70 L25,80 Z" fill="#000" />
          <path d="M45,45 L65,35 L65,60 L45,70 Z" fill="#000" opacity="0.7" />
          <path d="M65,35 L85,25 L85,50 L65,60 Z" fill="#000" opacity="0.7" />
        </g>
      ),
      fig9: (
        <g>
          <path d="M30,60 L50,50 L50,80 L30,90 Z" fill="#000" />
          <path d="M50,50 L70,40 L70,70 L50,80 Z" fill="#000" opacity="0.7" />
          <path d="M70,40 L90,30 L90,60 L70,70 Z" fill="#000" opacity="0.7" />
          <path d="M50,20 L70,10 L70,40 L50,50 Z" fill="#000" opacity="0.7" />
        </g>
      ),
      fig10: (
        <g>
          <path d="M40,70 L60,60 L60,90 L40,100 Z" fill="#000" />
          <path d="M60,60 L80,50 L80,80 L60,90 Z" fill="#000" opacity="0.7" />
          <path d="M40,45 L60,35 L60,60 L40,70 Z" fill="#000" />
          <path d="M60,35 L80,25 L80,50 L60,60 Z" fill="#000" opacity="0.7" />
          <path d="M20,55 L40,45 L40,70 L20,80 Z" fill="#000" opacity="0.8" />
        </g>
      ),
      fig11: (
        <g>
          <path d="M50,60 L70,50 L70,75 L50,85 Z" fill="#000" />
          <path d="M30,50 L50,40 L50,60 L30,70 Z" fill="#000" />
          <path d="M50,40 L70,30 L70,50 L50,60 Z" fill="#000" opacity="0.7" />
          <path d="M70,30 L90,20 L90,50 L70,60 Z" fill="#000" opacity="0.7" />
        </g>
      ),
      fig12: (
        <g>
          <path d="M35,65 L55,55 L55,85 L35,95 Z" fill="#000" />
          <path d="M55,55 L75,45 L75,75 L55,85 Z" fill="#000" opacity="0.7" />
          <path d="M75,45 L95,35 L95,65 L75,75 Z" fill="#000" opacity="0.7" />
          <path d="M35,40 L55,30 L55,55 L35,65 Z" fill="#000" />
        </g>
      ),
      fig13: (
        <g>
          <path d="M45,55 L65,45 L65,75 L45,85 Z" fill="#000" />
          <path d="M25,45 L45,35 L45,55 L25,65 Z" fill="#000" />
          <path d="M45,35 L65,25 L65,45 L45,55 Z" fill="#000" opacity="0.7" />
          <path d="M65,25 L85,15 L85,45 L65,55 Z" fill="#000" opacity="0.7" />
          <path d="M65,45 L85,35 L85,65 L65,75 Z" fill="#000" opacity="0.7" />
        </g>
      ),
      fig14: (
        <g>
          <path d="M30,70 L50,60 L50,85 L30,95 Z" fill="#000" />
          <path d="M50,60 L70,50 L70,75 L50,85 Z" fill="#000" opacity="0.7" />
          <path d="M30,45 L50,35 L50,60 L30,70 Z" fill="#000" />
          <path d="M50,35 L70,25 L70,50 L50,60 Z" fill="#000" opacity="0.7" />
        </g>
      ),
      fig15: (
        <g>
          <path d="M40,60 L60,50 L60,80 L40,90 Z" fill="#000" />
          <path d="M60,50 L80,40 L80,70 L60,80 Z" fill="#000" opacity="0.7" />
          <path d="M20,50 L40,40 L40,60 L20,70 Z" fill="#000" />
          <path d="M40,40 L60,30 L60,50 L40,60 Z" fill="#000" opacity="0.7" />
          <path d="M60,30 L80,20 L80,40 L60,50 Z" fill="#000" opacity="0.7" />
        </g>
      ),
      fig16: (
        <g>
          <path d="M35,55 L55,45 L55,75 L35,85 Z" fill="#000" />
          <path d="M55,45 L75,35 L75,65 L55,75 Z" fill="#000" opacity="0.7" />
          <path d="M55,15 L75,5 L75,35 L55,45 Z" fill="#000" opacity="0.7" />
          <path d="M35,30 L55,20 L55,45 L35,55 Z" fill="#000" />
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
          transform: `rotate(${rotation}deg) scaleX(${isMirror ? -1 : 1})`,
          filter: 'drop-shadow(1px 2px 4px rgba(0,0,0,0.2))'
        }}
      >
        {figureShapes[figType] || figureShapes.fig1}
      </svg>
    )
  }

  const handleInstructionNext = () => {
    if (instructionPage < 2) {
      setInstructionPage(prev => prev + 1)
    } else {
      setGamePhase('practice')
      setCurrentQuestion(0)
    }
  }

  const handleInstructionPrev = () => {
    if (instructionPage > 0) {
      setInstructionPage(prev => prev - 1)
    }
  }

  // Practice complete transition screen
  if (practiceComplete) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center p-4">
        <Card 
          className="max-w-2xl w-full p-8 shadow-2xl cursor-pointer hover:shadow-3xl transition-all border-2 border-green-500/30 bg-green-500/5"
          onClick={() => {
            setPracticeComplete(false)
            setGamePhase('test')
            setCurrentQuestion(0)
            setResults([])
            setQuestionResults([])
          }}
        >
          <div className="text-center space-y-6">
            <div className="flex justify-center">
              <div className="p-4 bg-green-100 rounded-full">
                <Check size={64} weight="bold" className="text-green-600" />
              </div>
            </div>
            <div className="space-y-2">
              <h2 className="text-3xl font-bold text-gray-900">Practice Completed!</h2>
              <p className="text-xl text-gray-600">
                You are now ready for the actual test.
              </p>
            </div>
            <div className="bg-gray-50 p-6 rounded-lg space-y-2 border">
              <p className="text-lg font-semibold text-gray-900">
                The real test begins now. Focus!
              </p>
              <p className="text-sm text-gray-600">
                You'll complete {TOTAL_QUESTIONS} questions. Select 2 correct rotations for each target figure.
              </p>
            </div>
            <p className="text-blue-600 font-semibold animate-pulse">
              Click anywhere to start
            </p>
          </div>
        </Card>
      </div>
    )
  }

  if (gamePhase === 'instructions') {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center p-4">
        <Card className="max-w-4xl w-full p-8 bg-white border-2">
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
                      <Cube size={40} className="text-blue-600" />
                      <h1 className="text-4xl font-bold text-gray-900">Mental Rotation Test</h1>
                    </div>
                    <Badge variant="outline" className="mb-4 border-gray-300 text-gray-700">Spatial Reasoning Assessment</Badge>
                  </div>
                  
                  <div className="space-y-4 text-lg text-gray-700">
                    <p>
                      This test measures your ability to <strong>mentally rotate 3D objects</strong> in space.
                    </p>
                    
                    <div className="bg-blue-50 border border-blue-200 p-6 rounded-lg">
                      <h3 className="font-semibold text-xl text-gray-900 mb-3">How it works:</h3>
                      <ul className="space-y-2 list-disc list-inside">
                        <li>You will see a <strong>target figure</strong> on the left</li>
                        <li>You must find <strong>2 correct rotations</strong> from 4 options</li>
                        <li>Select the 2 figures that are the same as the target (just rotated)</li>
                        <li>Avoid mirror images and different figures</li>
                      </ul>
                    </div>

                    <div className="bg-gray-50 border border-gray-200 p-4 rounded-lg">
                      <p className="font-semibold text-gray-900 mb-2">Scoring:</p>
                      <ul className="space-y-1 text-base">
                        <li>• Total Questions: <strong>{TOTAL_QUESTIONS}</strong></li>
                        <li>• Correct Answers per Question: <strong>2</strong></li>
                        <li>• Maximum Score: <strong>{MAX_SCORE}</strong> points</li>
                      </ul>
                    </div>
                  </div>
                </div>
              )}

              {instructionPage === 1 && (
                <div className="space-y-6">
                  <div className="text-center">
                    <h1 className="text-4xl font-bold text-gray-900 mb-2">What to Avoid</h1>
                    <Badge variant="outline" className="mb-4 border-gray-300 text-gray-700">Important Distinctions</Badge>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="bg-red-50 border-2 border-red-300 p-6 rounded-lg">
                      <h3 className="font-semibold text-xl text-red-900 mb-3">❌ Mirror Images</h3>
                      <p className="text-gray-700 mb-3">
                        These look similar but are <strong>flipped</strong> (like looking in a mirror). 
                        They are <strong>NOT</strong> correct answers.
                      </p>
                      <div className="bg-white p-4 rounded border border-red-200">
                        <p className="text-sm text-gray-600 italic">
                          Think of it like your left and right hands - same shape, but mirror images!
                        </p>
                      </div>
                    </div>

                    <div className="bg-orange-50 border-2 border-orange-300 p-6 rounded-lg">
                      <h3 className="font-semibold text-xl text-orange-900 mb-3">❌ Different Figures</h3>
                      <p className="text-gray-700 mb-3">
                        These are <strong>completely different shapes</strong>. 
                        They may look similar at first glance, but they are <strong>NOT</strong> the same figure.
                      </p>
                    </div>

                    <div className="bg-green-50 border-2 border-green-300 p-6 rounded-lg">
                      <h3 className="font-semibold text-xl text-green-900 mb-3">✓ Correct Rotations</h3>
                      <p className="text-gray-700">
                        These are the <strong>same figure as the target</strong>, just turned/rotated in different directions. 
                        Always select exactly <strong>2 correct rotations</strong>.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {instructionPage === 2 && (
                <div className="space-y-6">
                  <div className="text-center mb-4">
                    <Badge className="bg-yellow-100 text-yellow-800 border-yellow-300 text-lg px-4 py-2">
                      🎯 Practice Session
                    </Badge>
                  </div>
                  
                  <div className="space-y-4 text-lg text-gray-700">
                    <p>
                      You'll start with <strong>{PRACTICE_QUESTIONS} practice questions</strong> to familiarize yourself with the task.
                    </p>
                    
                    <div className="bg-gray-50 border border-gray-200 p-6 rounded-lg space-y-3">
                      <p className="font-semibold text-gray-900 mb-3">During each question:</p>
                      <div className="space-y-2">
                        <div className="flex items-start gap-3">
                          <span className="text-2xl">1️⃣</span>
                          <p>Look at the <strong>target figure</strong> on the left</p>
                        </div>
                        <div className="flex items-start gap-3">
                          <span className="text-2xl">2️⃣</span>
                          <p>Check each of the <strong>4 options</strong> on the right</p>
                        </div>
                        <div className="flex items-start gap-3">
                          <span className="text-2xl">3️⃣</span>
                          <p>Click the checkboxes to select <strong>exactly 2 correct rotations</strong></p>
                        </div>
                        <div className="flex items-start gap-3">
                          <span className="text-2xl">4️⃣</span>
                          <p>Click <strong>"Submit Answer"</strong> when ready</p>
                        </div>
                      </div>
                    </div>

                    <div className="bg-blue-50 border-l-4 border-blue-500 p-4">
                      <p className="font-semibold text-gray-900">
                        💡 Tip: Take your time to mentally rotate the target figure and compare it carefully with each option!
                      </p>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex justify-between mt-8 pt-6 border-t border-gray-200">
                <Button
                  onClick={handleInstructionPrev}
                  variant="outline"
                  disabled={instructionPage === 0}
                  className="border-gray-300"
                >
                  Previous
                </Button>
                
                <div className="flex gap-2">
                  {[0, 1, 2].map(page => (
                    <div
                      key={page}
                      className={`h-2 w-2 rounded-full transition-colors ${
                        page === instructionPage ? 'bg-blue-600' : 'bg-gray-300'
                      }`}
                    />
                  ))}
                </div>

                <Button 
                  onClick={handleInstructionNext}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  {instructionPage === 2 ? 'Start Practice' : 'Next'}
                </Button>
              </div>
            </motion.div>
          </AnimatePresence>
        </Card>
      </div>
    )
  }

  const maxQuestions = gamePhase === 'practice' ? PRACTICE_QUESTIONS : TOTAL_QUESTIONS

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <div className="p-6 border-b-2 border-gray-200 bg-white flex items-center justify-between">
        <div className="flex items-center gap-4">
          {gamePhase === 'practice' && (
            <Badge className="bg-yellow-100 text-yellow-800 border-yellow-300 gap-2 px-4 py-2">
              <span className="text-lg font-bold">Practice Mode</span>
            </Badge>
          )}
          {gamePhase === 'test' && (
            <Badge variant="outline" className="gap-2 px-4 py-2 border-gray-300">
              <Cube size={20} className="text-blue-600" />
              <div className="flex flex-col items-start">
                <span className="text-xs text-gray-600">Mental Rotation Test</span>
                <span className="text-xl font-bold text-gray-900">Question {currentQuestion + 1}/{maxQuestions}</span>
              </div>
            </Badge>
          )}
          <div className="w-64">
            <Progress value={((currentQuestion) / maxQuestions) * 100} className="h-2" />
          </div>
        </div>
        <Button variant="ghost" size="icon" onClick={onExit}>
          <X size={24} />
        </Button>
      </div>

      <div className="flex-1 flex items-center justify-center p-8">
        {questionData && (
          <div className="max-w-6xl w-full">
            <Card className="p-8 bg-white border-2 border-gray-200 shadow-lg">
              <div className="mb-6 text-center">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  Select the 2 correct rotations of the target figure
                </h2>
                <p className="text-gray-600">
                  Choose exactly 2 options that match the target (avoid mirrors and different figures)
                </p>
              </div>

              <div className="flex gap-8 items-start justify-center">
                {/* Target Figure */}
                <div className="flex flex-col items-center">
                  <div className="bg-gray-100 border-4 border-blue-500 rounded-lg p-8 mb-3">
                    <div className="text-center mb-2">
                      <Badge className="bg-blue-600 text-white mb-3">TARGET</Badge>
                    </div>
                    {renderShape(questionData.target, questionData.targetRotation, false, 180)}
                  </div>
                  <p className="text-sm font-semibold text-gray-700">Example</p>
                </div>

                {/* Options Grid */}
                <div className="flex-1">
                  <div className="grid grid-cols-2 gap-6">
                    {questionData.options.map((option, idx) => {
                      const isSelected = selectedOptions.has(idx)
                      const isCorrect = option.isCorrect
                      const showResult = showFeedback

                      let borderColor = 'border-gray-300'
                      let bgColor = 'bg-white'
                      
                      if (showResult) {
                        if (isCorrect && isSelected) {
                          borderColor = 'border-green-500'
                          bgColor = 'bg-green-50'
                        } else if (isCorrect && !isSelected) {
                          borderColor = 'border-orange-500'
                          bgColor = 'bg-orange-50'
                        } else if (!isCorrect && isSelected) {
                          borderColor = 'border-red-500'
                          bgColor = 'bg-red-50'
                        }
                      } else if (isSelected) {
                        borderColor = 'border-blue-500'
                        bgColor = 'bg-blue-50'
                      }

                      return (
                        <div
                          key={idx}
                          className={`${bgColor} border-2 ${borderColor} rounded-lg p-6 transition-all cursor-pointer hover:shadow-md relative`}
                          onClick={() => !showFeedback && toggleOption(idx)}
                        >
                          <div className="absolute top-3 left-3 flex items-center gap-2">
                            <Checkbox
                              checked={isSelected}
                              onCheckedChange={() => !showFeedback && toggleOption(idx)}
                              className="border-gray-400"
                            />
                            <span className="text-sm font-semibold text-gray-700">Option {idx + 1}</span>
                          </div>
                          
                          {showResult && (
                            <div className="absolute top-3 right-3">
                              {isCorrect && isSelected && (
                                <Badge className="bg-green-600 text-white">✓ Correct</Badge>
                              )}
                              {isCorrect && !isSelected && (
                                <Badge className="bg-orange-600 text-white">Missed</Badge>
                              )}
                              {!isCorrect && isSelected && (
                                <Badge className="bg-red-600 text-white">
                                  ✗ {option.isMirror ? 'Mirror' : 'Different'}
                                </Badge>
                              )}
                            </div>
                          )}

                          <div className="flex justify-center mt-8">
                            {renderShape(option.figure, option.rotation, option.isMirror, 160)}
                          </div>
                        </div>
                      )
                    })}
                  </div>

                  {!showFeedback && (
                    <div className="mt-6 flex justify-center">
                      <Button
                        onClick={handleSubmit}
                        disabled={selectedOptions.size === 0}
                        size="lg"
                        className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-6 text-lg"
                      >
                        Submit Answer ({selectedOptions.size}/2 selected)
                      </Button>
                    </div>
                  )}

                  {showFeedback && gamePhase === 'practice' && (
                    <div className="mt-6 text-center">
                      <p className="text-gray-600">Moving to next question...</p>
                    </div>
                  )}
                </div>
              </div>
            </Card>
          </div>
        )}
      </div>
    </div>
  )
}
