import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Label } from '@/components/ui/label'
import { HandFist, Check } from '@phosphor-icons/react'
import { GameSummary } from '@/lib/types'
import { motion, AnimatePresence } from 'framer-motion'

interface HandednessInventoryProps {
  onComplete: (results: any[], summary: GameSummary) => void
  onExit: () => void
}

interface HandednessQuestion {
  id: string
  question: string
  activity: string
}

const HANDEDNESS_QUESTIONS: HandednessQuestion[] = [
  { id: 'writing', question: 'Writing', activity: 'Writing' },
  { id: 'throwing', question: 'Throwing', activity: 'Throwing' },
  { id: 'toothbrush', question: 'Toothbrush', activity: 'Toothbrush' },
  { id: 'spoon', question: 'Spoon', activity: 'Spoon' }
]

const RESPONSE_OPTIONS = [
  { value: 'always-left', label: 'Always left', score: -2 },
  { value: 'usually-left', label: 'Usually left', score: -1 },
  { value: 'both-equally', label: 'Both equally', score: 0 },
  { value: 'usually-right', label: 'Usually right', score: 1 },
  { value: 'always-right', label: 'Always right', score: 2 }
]

export function HandednessInventory({ onComplete, onExit }: HandednessInventoryProps) {
  const [phase, setPhase] = useState<'instructions' | 'questions' | 'complete'>('instructions')
  const [currentQuestion, setCurrentQuestion] = useState(0)
  const [responses, setResponses] = useState<Record<string, string>>({})
  const [currentResponse, setCurrentResponse] = useState<string>('')

  const progress = (Object.keys(responses).length / HANDEDNESS_QUESTIONS.length) * 100

  const handleStartTest = () => {
    setPhase('questions')
  }

  const handleResponseSelect = (value: string) => {
    setCurrentResponse(value)
  }

  const handleNext = () => {
    if (!currentResponse) return

    const newResponses = {
      ...responses,
      [HANDEDNESS_QUESTIONS[currentQuestion].id]: currentResponse
    }
    setResponses(newResponses)
    setCurrentResponse('')

    if (currentQuestion < HANDEDNESS_QUESTIONS.length - 1) {
      setCurrentQuestion(currentQuestion + 1)
    } else {
      // Calculate results
      completeInventory(newResponses)
    }
  }

  const handlePrevious = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1)
      const previousResponse = responses[HANDEDNESS_QUESTIONS[currentQuestion - 1].id]
      setCurrentResponse(previousResponse || '')
    }
  }

  const completeInventory = (finalResponses: Record<string, string>) => {
    // Calculate laterality quotient based on standard classification
    let totalScore = 0
    const responseDetails: any[] = []

    HANDEDNESS_QUESTIONS.forEach((question) => {
      const response = finalResponses[question.id]
      const option = RESPONSE_OPTIONS.find(opt => opt.value === response)
      const score = option?.score || 0
      totalScore += score

      responseDetails.push({
        activity: question.activity,
        response: option?.label || 'No Response',
        score: score
      })
    })

    // Calculate Laterality Quotient (LQ)
    // LQ = (Sum of scores / (Number of questions × 2)) × 100
    // Range: -100 to +100
    const maxPossibleScore = HANDEDNESS_QUESTIONS.length * 2
    const lateralityQuotient = (totalScore / maxPossibleScore) * 100

    // Determine handedness classification based on standard ranges
    let handedness = 'Mixed handers'
    let classification = 'Mixed'
    
    if (lateralityQuotient >= 61) {
      handedness = 'Right handers'
      classification = 'Right-Handed'
    } else if (lateralityQuotient <= -61) {
      handedness = 'Left handers'
      classification = 'Left-Handed'
    } else {
      handedness = 'Mixed handers'
      classification = 'Ambidextrous'
    }

    const summary: GameSummary = {
      score: Math.round(lateralityQuotient),
      accuracy: 100, // Inventory is always 100% "accurate" as it's self-report
      reactionTime: 0, // Not applicable for inventory
      details: {
        lateralityQuotient: Math.round(lateralityQuotient * 10) / 10,
        handedness,
        classification,
        totalScore,
        maxScore: maxPossibleScore,
        responses: responseDetails,
        interpretation: `Laterality Quotient: ${Math.round(lateralityQuotient)} | Classification: ${classification}`
      }
    }

    onComplete([], summary)
  }

  if (phase === 'instructions') {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="min-h-screen bg-gradient-to-br from-background via-background to-accent/5 p-4 sm:p-8"
      >
        <div className="max-w-3xl mx-auto">
          <Card className="p-6 sm:p-8 backdrop-blur-sm bg-card/95 border-2">
            <div className="space-y-6">
              {/* Header */}
              <div className="text-center space-y-4">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-2">
                  <HandFist className="w-8 h-8 text-primary" weight="duotone" />
                </div>
                <div>
                  <h1 className="text-3xl sm:text-4xl font-bold mb-2">Handedness Inventory</h1>
                  <p className="text-muted-foreground text-lg">
                    Edinburgh Handedness Inventory Assessment
                  </p>
                </div>
              </div>

              {/* Instructions */}
              <div className="space-y-4 text-left">
                <div className="p-4 bg-primary/5 rounded-lg border border-primary/20">
                  <h3 className="font-semibold mb-2 text-lg">About This Assessment</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    Please indicate your preferences in the use of hands in the following activities or objects.
                  </p>
                </div>

                <div className="space-y-3">
                  <h3 className="font-semibold text-lg">Instructions</h3>
                  <ul className="space-y-2 text-muted-foreground">
                    <li className="flex items-start gap-2">
                      <Check className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" weight="bold" />
                      <span>You will be asked about your hand preference for 4 common activities</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" weight="bold" />
                      <span>Select your preference: Always left, Usually left, Both equally, Usually right, or Always right</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" weight="bold" />
                      <span>Your responses will determine your Laterality Quotient score</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" weight="bold" />
                      <span>Answer based on your natural preference, not what you were taught</span>
                    </li>
                  </ul>
                </div>

                <div className="p-4 bg-blue-500/10 rounded-lg border border-blue-500/20">
                  <h4 className="font-semibold mb-2 text-sm">Standard Classification:</h4>
                  <div className="text-sm text-muted-foreground space-y-1">
                    <p><strong>Left handers:</strong> -100 to -61</p>
                    <p><strong>Mixed handers:</strong> -60 to 60</p>
                    <p><strong>Right handers:</strong> 61 to 100</p>
                  </div>
                </div>

                <div className="p-4 bg-amber-500/10 rounded-lg border border-amber-500/20">
                  <p className="text-sm text-amber-700 dark:text-amber-400">
                    <strong>Note:</strong> There are no right or wrong answers. Answer honestly based on your natural preferences.
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4">
                <Button
                  variant="outline"
                  onClick={onExit}
                  className="flex-1"
                >
                  Exit
                </Button>
                <Button
                  onClick={handleStartTest}
                  className="flex-1"
                  size="lg"
                >
                  Begin Assessment
                </Button>
              </div>
            </div>
          </Card>
        </div>
      </motion.div>
    )
  }

  if (phase === 'questions') {
    const question = HANDEDNESS_QUESTIONS[currentQuestion]
    const canGoBack = currentQuestion > 0
    const canGoNext = currentResponse !== ''

    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="min-h-screen bg-gradient-to-br from-background via-background to-accent/5 p-4 sm:p-8"
      >
        <div className="max-w-3xl mx-auto space-y-6">
          {/* Progress Header */}
          <Card className="p-4 backdrop-blur-sm bg-card/95">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-primary/10">
                    <HandFist className="w-5 h-5 text-primary" weight="duotone" />
                  </div>
                  <div>
                    <h2 className="font-semibold">Handedness Inventory</h2>
                    <p className="text-sm text-muted-foreground">
                      Question {currentQuestion + 1} of {HANDEDNESS_QUESTIONS.length}
                    </p>
                  </div>
                </div>
                <Badge variant="secondary" className="text-sm">
                  {Math.round(progress)}% Complete
                </Badge>
              </div>
              <Progress value={progress} className="h-2" />
            </div>
          </Card>

          {/* Question Card */}
          <AnimatePresence mode="wait">
            <motion.div
              key={currentQuestion}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
            >
              <Card className="p-6 sm:p-8 backdrop-blur-sm bg-card/95 border-2">
                <div className="space-y-6">
                  {/* Question */}
                  <div className="text-center space-y-4">
                    <h3 className="text-xl font-semibold text-muted-foreground mb-4">
                      Please indicate your preferences in the use of hands in the following activities or objects
                    </h3>
                    <div className="text-center">
                      <h2 className="text-3xl font-bold mb-2">
                        {question.activity}
                      </h2>
                    </div>
                  </div>

                  {/* Response Options */}
                  <RadioGroup
                    value={currentResponse}
                    onValueChange={handleResponseSelect}
                    className="space-y-3"
                  >
                    {RESPONSE_OPTIONS.map((option) => (
                      <div
                        key={option.value}
                        className={`
                          flex items-center space-x-3 p-4 rounded-lg border-2 transition-all cursor-pointer
                          ${currentResponse === option.value
                            ? 'border-primary bg-primary/5'
                            : 'border-border hover:border-primary/50 hover:bg-accent/50'
                          }
                        `}
                        onClick={() => handleResponseSelect(option.value)}
                      >
                        <RadioGroupItem value={option.value} id={option.value} />
                        <Label
                          htmlFor={option.value}
                          className="flex-1 cursor-pointer font-medium"
                        >
                          {option.label}
                        </Label>
                      </div>
                    ))}
                  </RadioGroup>
                </div>
              </Card>
            </motion.div>
          </AnimatePresence>

          {/* Navigation Buttons */}
          <Card className="p-4 backdrop-blur-sm bg-card/95">
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={handlePrevious}
                disabled={!canGoBack}
                className="flex-1"
              >
                Previous
              </Button>
              <Button
                onClick={handleNext}
                disabled={!canGoNext}
                className="flex-1"
              >
                {currentQuestion === HANDEDNESS_QUESTIONS.length - 1 ? 'Complete' : 'Next'}
              </Button>
            </div>
          </Card>
        </div>
      </motion.div>
    )
  }

  return null
}
