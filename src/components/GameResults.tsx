import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { CheckCircle, ArrowRight, Trophy, Target, Timer, XCircle } from '@phosphor-icons/react'
import { Badge } from '@/components/ui/badge'
import { ThemeToggle } from '@/components/ThemeToggle'
import { motion } from 'framer-motion'

interface GameResultsProps {
  gameName: string
  summary: {
    score: number
    accuracy: number
    reactionTime: number
    errorCount?: number
    errorRate?: number
    details?: {
      customMessage?: string
      maxSpan?: number
      correctSequences?: number
      [key: string]: any
    }
  }
  onContinue: () => void
}

export function GameResults({ gameName, summary, onContinue }: GameResultsProps) {
  const getPerformanceBadge = (accuracy: number) => {
    if (accuracy >= 90) return { label: 'Excellent', className: 'bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow-md' }
    if (accuracy >= 75) return { label: 'Good', className: 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white shadow-md' }
    if (accuracy >= 60) return { label: 'Fair', className: 'bg-gradient-to-r from-yellow-500 to-orange-500 text-white shadow-md' }
    return { label: 'Keep Practicing', className: 'bg-gradient-to-r from-gray-500 to-gray-600 text-white shadow-md' }
  }

  const badge = getPerformanceBadge(summary.accuracy)

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 flex items-center justify-center p-3 sm:p-4 md:p-6 relative overflow-hidden">
      <div className="absolute inset-0 bg-grid-pattern opacity-5" />
      <motion.div 
        className="absolute top-2 right-2 sm:top-3 sm:right-3 md:top-4 md:right-4 z-20"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        <ThemeToggle />
      </motion.div>
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, type: "spring" }}
        className="relative z-10 w-full max-w-[95%] sm:max-w-lg md:max-w-xl lg:max-w-2xl"
      >
        <Card className="w-full shadow-lg sm:shadow-xl border border-border sm:border-2">
          <CardHeader className="text-center p-4 sm:p-5 md:p-6">
            <motion.div 
              className="mx-auto w-14 h-14 sm:w-16 sm:h-16 md:w-20 md:h-20 rounded-full bg-gradient-to-br from-green-500 via-emerald-500 to-teal-500 flex items-center justify-center mb-3 sm:mb-4 shadow-lg"
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ duration: 0.6, type: "spring", delay: 0.2 }}
            >
              <CheckCircle size={28} className="sm:hidden text-white" weight="fill" />
              <CheckCircle size={32} className="hidden sm:block md:hidden text-white" weight="fill" />
              <CheckCircle size={40} className="hidden md:block text-white" weight="fill" />
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <CardTitle className="text-2xl sm:text-3xl mb-1.5 sm:mb-2">Task Complete!</CardTitle>
              <CardDescription className="text-sm sm:text-base">{gameName}</CardDescription>
            </motion.div>
          </CardHeader>
          <CardContent className="flex flex-col gap-4 sm:gap-5 md:gap-6 p-4 sm:p-5 md:p-6">
            <motion.div 
              className="flex justify-center"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              <Badge className={badge.className}>{badge.label}</Badge>
            </motion.div>

            {/* Custom message for Digit Span and similar tests */}
            {summary.details?.customMessage && (
              <motion.div
                className="bg-gradient-to-br from-primary/10 to-blue-500/5 p-4 rounded-lg border border-primary/20 text-center"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.45 }}
              >
                <p className="text-lg font-semibold text-foreground">
                  {summary.details.customMessage}
                </p>
              </motion.div>
            )}

            {/* Detailed Stroop Test Results */}
            {gameName === 'Stroop Test' && summary.details && (
              <motion.div
                className="space-y-4"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.45 }}
              >
                <div className="bg-gradient-to-br from-blue-500/10 to-indigo-500/5 p-4 rounded-lg border border-blue-500/20">
                  <h3 className="font-semibold text-sm text-muted-foreground mb-3 text-center">Reaction Time Analysis</h3>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-card/50 p-3 rounded-lg border border-border/50">
                      <p className="text-xs text-muted-foreground mb-1">Congruent RT</p>
                      <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                        {summary.details.congruentRT}ms
                      </p>
                    </div>
                    <div className="bg-card/50 p-3 rounded-lg border border-border/50">
                      <p className="text-xs text-muted-foreground mb-1">Incongruent RT</p>
                      <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                        {summary.details.incongruentRT}ms
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-gradient-to-br from-purple-500/10 to-pink-500/5 p-4 rounded-lg border border-purple-500/20 text-center">
                  <p className="text-xs text-muted-foreground mb-1">Stroop Interference Effect</p>
                  <p className="text-3xl font-bold text-purple-600 dark:text-purple-400">
                    {summary.details.stroopInterferenceEffect}ms
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    RT(Incongruent) - RT(Congruent)
                  </p>
                </div>

                <div className="bg-gradient-to-br from-red-500/10 to-rose-500/5 p-4 rounded-lg border border-red-500/20">
                  <h3 className="font-semibold text-sm text-muted-foreground mb-3 text-center">Error Analysis</h3>
                  <div className="grid grid-cols-3 gap-3">
                    <div className="bg-card/50 p-3 rounded-lg border border-border/50 text-center">
                      <p className="text-xs text-muted-foreground mb-1">Congruent</p>
                      <p className="text-xl font-bold text-foreground">{summary.details.congruentErrors}</p>
                    </div>
                    <div className="bg-card/50 p-3 rounded-lg border border-border/50 text-center">
                      <p className="text-xs text-muted-foreground mb-1">Incongruent</p>
                      <p className="text-xl font-bold text-foreground">{summary.details.incongruentErrors}</p>
                    </div>
                    <div className="bg-card/50 p-3 rounded-lg border border-border/50 text-center">
                      <p className="text-xs text-muted-foreground mb-1">Total</p>
                      <p className="text-xl font-bold text-red-600 dark:text-red-400">{summary.details.totalErrors}</p>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Detailed Trail Making Test Results */}
            {gameName === 'Trail Making Test' && summary.details && (
              <motion.div
                className="space-y-4"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
              >
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gradient-to-br from-blue-500/10 to-indigo-500/5 p-4 rounded-lg border border-blue-500/20">
                    <h3 className="font-semibold text-sm text-muted-foreground mb-2 text-center">TMT-A Results</h3>
                    <div className="space-y-2">
                      <div className="bg-card/50 p-3 rounded-lg border border-border/50">
                        <p className="text-xs text-muted-foreground mb-1">Time to Complete</p>
                        <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                          {(summary.details.tmtATime / 1000).toFixed(2)}s
                        </p>
                      </div>
                      <div className="bg-card/50 p-3 rounded-lg border border-border/50">
                        <p className="text-xs text-muted-foreground mb-1">Number of Errors</p>
                        <p className="text-xl font-bold text-red-600 dark:text-red-400">
                          {summary.details.tmtAErrors}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-gradient-to-br from-purple-500/10 to-pink-500/5 p-4 rounded-lg border border-purple-500/20">
                    <h3 className="font-semibold text-sm text-muted-foreground mb-2 text-center">TMT-B Results</h3>
                    <div className="space-y-2">
                      <div className="bg-card/50 p-3 rounded-lg border border-border/50">
                        <p className="text-xs text-muted-foreground mb-1">Time to Complete</p>
                        <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                          {(summary.details.tmtBTime / 1000).toFixed(2)}s
                        </p>
                      </div>
                      <div className="bg-card/50 p-3 rounded-lg border border-border/50">
                        <p className="text-xs text-muted-foreground mb-1">Number of Errors</p>
                        <p className="text-xl font-bold text-red-600 dark:text-red-400">
                          {summary.details.tmtBErrors}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gradient-to-br from-green-500/10 to-emerald-500/5 p-4 rounded-lg border border-green-500/20 text-center">
                    <p className="text-xs text-muted-foreground mb-1">Difference Score</p>
                    <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                      {(summary.details.differenceScore / 1000).toFixed(2)}s
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">TMT-B - TMT-A</p>
                  </div>

                  <div className="bg-gradient-to-br from-orange-500/10 to-amber-500/5 p-4 rounded-lg border border-orange-500/20 text-center">
                    <p className="text-xs text-muted-foreground mb-1">Rate Score</p>
                    <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                      {summary.details.rateScore}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">TMT-A / TMT-B</p>
                  </div>
                </div>

                <div className="bg-gradient-to-br from-red-500/10 to-rose-500/5 p-4 rounded-lg border border-red-500/20 text-center">
                  <p className="text-xs text-muted-foreground mb-1">Total Errors (Both Parts)</p>
                  <p className="text-3xl font-bold text-red-600 dark:text-red-400">
                    {summary.details.totalErrors}
                  </p>
                </div>
              </motion.div>
            )}

            {/* Detailed Mental Rotation Test Results */}
            {gameName === 'Mental Rotation Test' && summary.details && (
              <motion.div
                className="space-y-4"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
              >
                <div className="bg-gradient-to-br from-blue-500/10 to-indigo-500/5 p-4 rounded-lg border border-blue-500/20">
                  <h3 className="font-semibold text-sm text-muted-foreground mb-3 text-center">Overall Performance</h3>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-card/50 p-3 rounded-lg border border-border/50 text-center">
                      <p className="text-xs text-muted-foreground mb-1">Total Score</p>
                      <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                        {summary.details.correctSelections}/{summary.details.maxScore}
                      </p>
                    </div>
                    <div className="bg-card/50 p-3 rounded-lg border border-border/50 text-center">
                      <p className="text-xs text-muted-foreground mb-1">Total Questions</p>
                      <p className="text-3xl font-bold text-foreground">
                        {summary.details.totalQuestions}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-gradient-to-br from-green-500/10 to-emerald-500/5 p-4 rounded-lg border border-green-500/20">
                  <h3 className="font-semibold text-sm text-muted-foreground mb-3 text-center">Selection Analysis</h3>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-card/50 p-3 rounded-lg border border-border/50 text-center">
                      <p className="text-xs text-muted-foreground mb-1">Correct Selections</p>
                      <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                        {summary.details.correctSelections}
                      </p>
                    </div>
                    <div className="bg-card/50 p-3 rounded-lg border border-border/50 text-center">
                      <p className="text-xs text-muted-foreground mb-1">Incorrect Selections</p>
                      <p className="text-2xl font-bold text-red-600 dark:text-red-400">
                        {summary.details.incorrectSelections}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-gradient-to-br from-red-500/10 to-rose-500/5 p-4 rounded-lg border border-red-500/20">
                  <h3 className="font-semibold text-sm text-muted-foreground mb-3 text-center">Error Type Breakdown</h3>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-card/50 p-3 rounded-lg border border-border/50 text-center">
                      <p className="text-xs text-muted-foreground mb-1">Mirror Image Errors</p>
                      <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                        {summary.details.mirrorErrors}
                      </p>
                    </div>
                    <div className="bg-card/50 p-3 rounded-lg border border-border/50 text-center">
                      <p className="text-xs text-muted-foreground mb-1">Different Figure Errors</p>
                      <p className="text-2xl font-bold text-rose-600 dark:text-rose-400">
                        {summary.details.differentFigureErrors}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-gradient-to-br from-purple-500/10 to-pink-500/5 p-4 rounded-lg border border-purple-500/20 text-center">
                  <p className="text-xs text-muted-foreground mb-1">Average Reaction Time</p>
                  <p className="text-3xl font-bold text-purple-600 dark:text-purple-400">
                    {summary.details.avgReactionTime}ms
                  </p>
                </div>
              </motion.div>
            )}

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <motion.div 
                className="text-center p-4 rounded-xl bg-gradient-to-br from-primary/10 to-blue-500/5 border border-primary/20 hover:scale-105 transition-transform"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                whileHover={{ y: -5 }}
              >
                <div className="w-10 h-10 mx-auto mb-2 rounded-full bg-gradient-to-br from-primary to-blue-600 flex items-center justify-center">
                  <Trophy size={20} weight="duotone" className="text-white" />
                </div>
                <p className="text-3xl font-bold text-foreground">{summary.score}</p>
                <p className="text-xs text-muted-foreground mt-1">Score</p>
              </motion.div>
              <motion.div 
                className="text-center p-4 rounded-xl bg-gradient-to-br from-purple-500/10 to-pink-500/5 border border-purple-500/20 hover:scale-105 transition-transform"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
                whileHover={{ y: -5 }}
              >
                <div className="w-10 h-10 mx-auto mb-2 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                  <Target size={20} weight="duotone" className="text-white" />
                </div>
                <p className="text-3xl font-bold text-foreground">{summary.accuracy.toFixed(1)}%</p>
                <p className="text-xs text-muted-foreground mt-1">Accuracy</p>
              </motion.div>
              {summary.errorCount !== undefined && (
                <motion.div 
                  className="text-center p-4 rounded-xl bg-gradient-to-br from-red-500/10 to-rose-500/5 border border-red-500/20 hover:scale-105 transition-transform"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.7 }}
                  whileHover={{ y: -5 }}
                >
                  <div className="w-10 h-10 mx-auto mb-2 rounded-full bg-gradient-to-br from-red-500 to-rose-500 flex items-center justify-center">
                    <XCircle size={20} weight="duotone" className="text-white" />
                  </div>
                  <p className="text-3xl font-bold text-foreground">{summary.errorCount}</p>
                  <p className="text-xs text-muted-foreground mt-1">Errors ({summary.errorRate?.toFixed(1)}%)</p>
                </motion.div>
              )}
              <motion.div 
                className="text-center p-4 rounded-xl bg-gradient-to-br from-orange-500/10 to-red-500/5 border border-orange-500/20 hover:scale-105 transition-transform"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: summary.errorCount !== undefined ? 0.8 : 0.7 }}
                whileHover={{ y: -5 }}
              >
                <div className="w-10 h-10 mx-auto mb-2 rounded-full bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center">
                  <Timer size={20} weight="duotone" className="text-white" />
                </div>
                <p className="text-3xl font-bold text-foreground">{summary.reactionTime.toFixed(0)}</p>
                <p className="text-xs text-muted-foreground mt-1">Avg RT (ms)</p>
              </motion.div>
            </div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: summary.errorCount !== undefined ? 0.9 : 0.8 }}
            >
              <Button 
                onClick={onContinue} 
                size="lg" 
                className="w-full gap-2 bg-gradient-to-r from-primary to-blue-600 hover:from-primary/90 hover:to-blue-600/90 shadow-lg group"
              >
                Return to Dashboard
                <ArrowRight size={20} weight="duotone" className="group-hover:translate-x-1 transition-transform" />
              </Button>
            </motion.div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}
