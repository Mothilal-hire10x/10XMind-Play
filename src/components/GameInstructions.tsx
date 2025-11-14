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
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative z-10"
      >
        <Card className="max-w-2xl w-full shadow-xl border-2">
          <CardHeader>
            <Button
              variant="ghost"
              onClick={onBack}
              className="w-fit mb-4 gap-2 hover:bg-primary/10 transition-all"
            >
              <ArrowLeft size={18} weight="duotone" />
              Back to Dashboard
            </Button>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                <Info size={24} weight="duotone" className="text-primary" />
              </div>
              <div>
                <CardTitle className="text-2xl">{game.name}</CardTitle>
                <CardDescription>{game.description}</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="flex flex-col gap-6">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500/20 to-blue-500/5 flex items-center justify-center">
                  <Info size={18} weight="duotone" className="text-blue-600 dark:text-blue-400" />
                </div>
                <h3 className="font-semibold text-lg">Instructions</h3>
              </div>
              <p className="text-muted-foreground leading-relaxed bg-muted/50 p-4 rounded-lg border border-border/50">
                {game.instructions}
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500/20 to-purple-500/5 flex items-center justify-center">
                  <CheckCircle size={18} weight="duotone" className="text-purple-600 dark:text-purple-400" />
                </div>
                <h3 className="font-semibold text-lg">Controls</h3>
              </div>
              <div className="space-y-2 bg-muted/50 p-4 rounded-lg border border-border/50">
                {game.controls.map((control, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3, delay: 0.3 + index * 0.05 }}
                    className="flex items-center gap-3 p-2 rounded-md hover:bg-primary/5 transition-colors"
                  >
                    <div className="w-2 h-2 rounded-full bg-gradient-to-br from-primary to-blue-600" />
                    <span className="text-muted-foreground">{control}</span>
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
                className="w-full gap-2 bg-gradient-to-r from-primary to-blue-600 hover:from-primary/90 hover:to-blue-600/90 shadow-lg group"
              >
                <Play size={20} weight="fill" className="group-hover:scale-110 transition-transform" />
                Start Game
              </Button>
            </motion.div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}
