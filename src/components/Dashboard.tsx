import { useAuth } from '@/lib/auth-context'
import { GAMES } from '@/lib/games'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Brain, Eye, TreeStructure, Lightning, ChartLine, SignOut, Sparkle, PlayCircle } from '@phosphor-icons/react'
import { Badge } from '@/components/ui/badge'
import { ThemeToggle } from '@/components/ThemeToggle'
import { motion } from 'framer-motion'

const iconMap = {
  Brain,
  Eye,
  TreeStructure,
  Lightning
}

interface DashboardProps {
  onSelectGame: (gameId: string) => void
  onViewResults: () => void
}

export function Dashboard({ onSelectGame, onViewResults }: DashboardProps) {
  const { user, logout } = useAuth()

  const getIcon = (iconName: string) => {
    const Icon = iconMap[iconName as keyof typeof iconMap] || Brain
    return Icon
  }

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'memory':
        return 'bg-gradient-to-br from-purple-500 to-pink-500 text-white'
      case 'attention':
        return 'bg-gradient-to-br from-blue-500 to-cyan-500 text-white'
      case 'executive':
        return 'bg-gradient-to-br from-orange-500 to-red-500 text-white'
      default:
        return 'bg-muted text-muted-foreground'
    }
  }

  const getCardGradient = (category: string) => {
    switch (category) {
      case 'memory':
        return 'hover:border-purple-500/50'
      case 'attention':
        return 'hover:border-blue-500/50'
      case 'executive':
        return 'hover:border-orange-500/50'
      default:
        return ''
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card backdrop-blur-sm bg-opacity-80 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <motion.div 
            className="flex items-center gap-3"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary via-primary to-blue-600 flex items-center justify-center shadow-lg">
              <Brain size={24} weight="bold" className="text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground">
                <span className="text-blue-600 dark:text-blue-400">10</span>XMindPlay
              </h1>
              <p className="text-xs text-muted-foreground">{user?.email}</p>
            </div>
          </motion.div>
          <motion.div 
            className="flex items-center gap-2"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
          >
            <ThemeToggle />
            <Button variant="outline" onClick={onViewResults} className="gap-2 hover:bg-primary/10 transition-all">
              <ChartLine size={18} weight="duotone" />
              <span className="hidden sm:inline">Results</span>
            </Button>
            <Button variant="ghost" onClick={logout} className="gap-2 hover:bg-destructive/10 hover:text-destructive transition-all">
              <SignOut size={18} weight="duotone" />
              <span className="hidden sm:inline">Sign Out</span>
            </Button>
          </motion.div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        <motion.div 
          className="mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="flex items-center gap-2 mb-2">
            <Sparkle size={24} weight="duotone" className="text-primary" />
            <h2 className="text-2xl font-semibold text-foreground">Cognitive Training Games</h2>
          </div>
          <p className="text-muted-foreground">
            Select a game to begin training and assessing your cognitive abilities
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {GAMES.map((game, index) => {
            const Icon = getIcon(game.icon)
            return (
              <motion.div
                key={game.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: index * 0.1 }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Card
                  className={`hover:shadow-xl transition-all cursor-pointer border-2 ${getCardGradient(game.category)} group overflow-hidden relative`}
                  onClick={() => onSelectGame(game.id)}
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-transparent via-transparent to-primary/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                  <CardHeader className="relative">
                    <div className="flex items-start justify-between mb-2">
                      <motion.div 
                        className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center group-hover:scale-110 transition-transform"
                        whileHover={{ rotate: 5 }}
                      >
                        <Icon size={24} weight="duotone" className="text-primary" />
                      </motion.div>
                      <Badge className={`${getCategoryColor(game.category)} shadow-md`}>
                        {game.category}
                      </Badge>
                    </div>
                    <CardTitle className="text-lg">{game.name}</CardTitle>
                    <CardDescription className="line-clamp-2">{game.description}</CardDescription>
                  </CardHeader>
                  <CardContent className="relative">
                    <Button className="w-full group/btn bg-gradient-to-r from-primary to-blue-600 hover:from-primary/90 hover:to-blue-600/90 shadow-md transition-all gap-2">
                      <PlayCircle size={18} weight="fill" className="group-hover/btn:scale-110 transition-transform" />
                      Start Game
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            )
          })}
        </div>
      </main>
    </div>
  )
}
