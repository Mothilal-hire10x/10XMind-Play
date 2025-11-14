import { getGameById } from '@/lib/games'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ArrowLeft, Play } from '@phosphor-icons/react'

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
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="max-w-2xl w-full">
        <CardHeader>
          <Button
            variant="ghost"
            onClick={onBack}
            className="w-fit mb-4 gap-2"
          >
            <ArrowLeft size={18} />
            Back to Dashboard
          </Button>
          <CardTitle className="text-2xl">{game.name}</CardTitle>
          <CardDescription>{game.description}</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-6">
          <div>
            <h3 className="font-semibold text-lg mb-2">Instructions</h3>
            <p className="text-muted-foreground leading-relaxed">{game.instructions}</p>
          </div>

          <div>
            <h3 className="font-semibold text-lg mb-2">Controls</h3>
            <ul className="space-y-2">
              {game.controls.map((control, index) => (
                <li key={index} className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-primary" />
                  <span className="text-muted-foreground">{control}</span>
                </li>
              ))}
            </ul>
          </div>

          <Button onClick={onStart} size="lg" className="gap-2">
            <Play size={20} weight="fill" />
            Start Game
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
