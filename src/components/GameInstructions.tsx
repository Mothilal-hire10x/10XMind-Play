import { getGameById } from '@/lib/games'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ArrowLeft, Play, CheckCircle, Info } from '@phosphor-icons/react'
import { ThemeToggle } from '@/components/ThemeToggle'
import { motion } from 'framer-motion'

interface GameInstructionsProps {
  gameId: string
  onStart: () => void
  onBack: () => void
}

export function GameInstructions({ gameId, onStart, onBack }: GameInstructionsProps) {
  const game = getGameById(gameId)

  if (!game) {
    return <div>Game not found</div>
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 flex items-center justify-center p-3 sm:p-4 md:p-6 relative overflow-hidden">
      <div className="absolute inset-0 bg-grid-pattern opacity-5" />
      <motion.div 
        className="absolute top-2 right-2 sm:top-3 sm:right-3 md:top-4 md:right-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        <ThemeToggle />
      </motion.div>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative z-10 w-full max-w-2xl"
      >
        <Card className="w-full shadow-xl border-2">
          <CardHeader className="p-4 sm:p-6">
            <Button
              variant="ghost"
              onClick={onBack}
              className="w-fit mb-2 sm:mb-4 gap-1 sm:gap-2 hover:bg-primary/10 transition-all text-sm sm:text-base"
            >
              <ArrowLeft size={16} className="sm:hidden" weight="duotone" />
              <ArrowLeft size={18} className="hidden sm:block" weight="duotone" />
              <span className="hidden sm:inline">Back to Dashboard</span>
              <span className="sm:hidden">Back</span>
            </Button>
            <div className="flex items-center gap-2 sm:gap-3 mb-1 sm:mb-2">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center flex-shrink-0">
                <Info size={20} className="sm:hidden text-primary" weight="duotone" />
                <Info size={24} className="hidden sm:block text-primary" weight="duotone" />
              </div>
              <div className="min-w-0">
                <CardTitle className="text-lg sm:text-xl md:text-2xl truncate">{game.name}</CardTitle>
                <CardDescription className="text-xs sm:text-sm line-clamp-2">{game.description}</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="flex flex-col gap-4 sm:gap-5 md:gap-6 p-4 sm:p-6 pt-0 sm:pt-0">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              <div className="flex items-center gap-2 mb-2 sm:mb-3">
                <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-lg bg-gradient-to-br from-blue-500/20 to-blue-500/5 flex items-center justify-center flex-shrink-0">
                  <Info size={14} className="sm:hidden text-blue-600 dark:text-blue-400" weight="duotone" />
                  <Info size={18} className="hidden sm:block text-blue-600 dark:text-blue-400" weight="duotone" />
                </div>
                <h3 className="font-semibold text-sm sm:text-base md:text-lg">Instructions</h3>
              </div>
              <p className="text-xs sm:text-sm md:text-base text-muted-foreground leading-relaxed bg-muted/50 p-3 sm:p-4 rounded-lg border border-border/50">
                {game.instructions}
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <div className="flex items-center gap-2 mb-2 sm:mb-3">
                <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-lg bg-gradient-to-br from-purple-500/20 to-purple-500/5 flex items-center justify-center flex-shrink-0">
                  <CheckCircle size={14} className="sm:hidden text-purple-600 dark:text-purple-400" weight="duotone" />
                  <CheckCircle size={18} className="hidden sm:block text-purple-600 dark:text-purple-400" weight="duotone" />
                </div>
                <h3 className="font-semibold text-sm sm:text-base md:text-lg">Controls</h3>
              </div>
              <div className="space-y-1 sm:space-y-2 bg-muted/50 p-3 sm:p-4 rounded-lg border border-border/50">
                {game.controls.map((control, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3, delay: 0.3 + index * 0.05 }}
                    className="flex items-center gap-2 sm:gap-3 p-1.5 sm:p-2 rounded-md hover:bg-primary/5 transition-colors"
                  >
                    <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-gradient-to-br from-primary to-blue-600 flex-shrink-0" />
                    <span className="text-xs sm:text-sm md:text-base text-muted-foreground">{control}</span>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
            >
              <Button 
                onClick={onStart} 
                size="lg" 
                className="w-full gap-2 bg-gradient-to-r from-primary to-blue-600 hover:from-primary/90 hover:to-blue-600/90 shadow-lg group text-sm sm:text-base h-10 sm:h-11 md:h-12"
              >
                <Play size={18} className="sm:hidden group-hover:scale-110 transition-transform" weight="fill" />
                <Play size={20} className="hidden sm:block group-hover:scale-110 transition-transform" weight="fill" />
                Start Game
              </Button>
            </motion.div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}
