import { useAuth } from '@/lib/auth-context'
import { GAMES } from '@/lib/games'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Brain, Eye, TreeStructure, Lightning, ChartLine, SignOut } from '@phosphor-icons/react'
import { Badge } from '@/components/ui/badge'

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
        return 'bg-accent text-accent-foreground'
      case 'attention':
        return 'bg-secondary text-secondary-foreground'
      case 'executive':
        return 'bg-primary text-primary-foreground'
      default:
        return 'bg-muted text-muted-foreground'
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center">
              <Brain size={24} weight="bold" className="text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground">MindPlay</h1>
              <p className="text-sm text-muted-foreground">{user?.email}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" onClick={onViewResults} className="gap-2">
              <ChartLine size={18} />
              <span className="hidden sm:inline">Results</span>
            </Button>
            <Button variant="ghost" onClick={logout} className="gap-2">
              <SignOut size={18} />
              <span className="hidden sm:inline">Sign Out</span>
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h2 className="text-2xl font-semibold text-foreground mb-2">Cognitive Training Games</h2>
          <p className="text-muted-foreground">
            Select a game to begin training and assessing your cognitive abilities
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {GAMES.map((game) => {
            const Icon = getIcon(game.icon)
            return (
              <Card
                key={game.id}
                className="hover:shadow-lg transition-all cursor-pointer hover:scale-[1.02]"
                onClick={() => onSelectGame(game.id)}
              >
                <CardHeader>
                  <div className="flex items-start justify-between mb-2">
                    <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Icon size={24} weight="bold" className="text-primary" />
                    </div>
                    <Badge className={getCategoryColor(game.category)}>
                      {game.category}
                    </Badge>
                  </div>
                  <CardTitle className="text-lg">{game.name}</CardTitle>
                  <CardDescription>{game.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button className="w-full">Start Game</Button>
                </CardContent>
              </Card>
            )
          })}
        </div>
      </main>
    </div>
  )
}
