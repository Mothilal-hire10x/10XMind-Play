import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { CheckCircle, ArrowRight, Trophy, Target, Timer } from '@phosphor-icons/react'
import { Badge } from '@/components/ui/badge'
import { ThemeToggle } from '@/components/ThemeToggle'
import { motion } from 'framer-motion'

interface GameResultsProps {
  gameName: string
  summary: {
    score: number
    accuracy: number
    reactionTime: number
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
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute inset-0 bg-grid-pattern opacity-5" />
      <motion.div 
        className="absolute top-4 right-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        <ThemeToggle />
      </motion.div>
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, type: "spring" }}
        className="relative z-10"
      >
        <Card className="max-w-lg w-full shadow-xl border-2">
          <CardHeader className="text-center">
            <motion.div 
              className="mx-auto w-20 h-20 rounded-full bg-gradient-to-br from-green-500 via-emerald-500 to-teal-500 flex items-center justify-center mb-4 shadow-lg"
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ duration: 0.6, type: "spring", delay: 0.2 }}
            >
              <CheckCircle size={40} weight="fill" className="text-white" />
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <CardTitle className="text-3xl mb-2">Task Complete!</CardTitle>
              <CardDescription className="text-base">{gameName}</CardDescription>
            </motion.div>
          </CardHeader>
          <CardContent className="flex flex-col gap-6">
            <motion.div 
              className="flex justify-center"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              <Badge className={badge.className}>{badge.label}</Badge>
            </motion.div>

            <div className="grid grid-cols-3 gap-4">
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
              <motion.div 
                className="text-center p-4 rounded-xl bg-gradient-to-br from-orange-500/10 to-red-500/5 border border-orange-500/20 hover:scale-105 transition-transform"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7 }}
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
              transition={{ delay: 0.8 }}
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
