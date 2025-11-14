import { useKV } from '@github/spark/hooks'
import { useAuth } from '@/lib/auth-context'
import { GameResult } from '@/lib/types'
import { GAMES } from '@/lib/games'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { ArrowLeft } from '@phosphor-icons/react'
import { Badge } from '@/components/ui/badge'

interface ResultsDashboardProps {
  onBack: () => void
}

export function ResultsDashboard({ onBack }: ResultsDashboardProps) {
  const { user } = useAuth()
  const [results] = useKV<GameResult[]>('game-results', [])

  const userResults = results?.filter(r => r.userId === user?.id) || []

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getGameName = (gameId: string) => {
    return GAMES.find(g => g.id === gameId)?.name || gameId
  }

  const getPerformanceBadge = (accuracy: number) => {
    if (accuracy >= 90) return { label: 'Excellent', variant: 'default' as const }
    if (accuracy >= 75) return { label: 'Good', variant: 'secondary' as const }
    if (accuracy >= 60) return { label: 'Fair', variant: 'outline' as const }
    return { label: 'Practice', variant: 'outline' as const }
  }

  const groupedResults = userResults.reduce((acc, result) => {
    if (!acc[result.gameId]) {
      acc[result.gameId] = []
    }
    acc[result.gameId].push(result)
    return acc
  }, {} as Record<string, GameResult[]>)

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <Button variant="ghost" onClick={onBack} className="gap-2">
            <ArrowLeft size={18} />
            Back to Dashboard
          </Button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h2 className="text-2xl font-semibold text-foreground mb-2">Your Results</h2>
          <p className="text-muted-foreground">
            Track your cognitive performance across all games
          </p>
        </div>

        {userResults.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-16">
              <p className="text-lg text-muted-foreground mb-4">No results yet</p>
              <p className="text-sm text-muted-foreground mb-6">
                Complete your first game to see your performance metrics here
              </p>
              <Button onClick={onBack}>Start Training</Button>
            </CardContent>
          </Card>
        ) : (
          <div className="flex flex-col gap-6">
            {Object.entries(groupedResults).map(([gameId, gameResults]) => (
              <Card key={gameId}>
                <CardHeader>
                  <CardTitle>{getGameName(gameId)}</CardTitle>
                  <CardDescription>{gameResults.length} attempts</CardDescription>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead className="text-right">Score</TableHead>
                        <TableHead className="text-right">Accuracy</TableHead>
                        <TableHead className="text-right">Avg RT (ms)</TableHead>
                        <TableHead className="text-right">Performance</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {gameResults
                        .sort((a, b) => b.timestamp - a.timestamp)
                        .map((result) => {
                          const badge = getPerformanceBadge(result.accuracy)
                          return (
                            <TableRow key={result.id}>
                              <TableCell>{formatDate(result.timestamp)}</TableCell>
                              <TableCell className="text-right font-medium">{result.score}</TableCell>
                              <TableCell className="text-right">{result.accuracy.toFixed(1)}%</TableCell>
                              <TableCell className="text-right">
                                {result.reactionTime ? result.reactionTime.toFixed(0) : 'N/A'}
                              </TableCell>
                              <TableCell className="text-right">
                                <Badge variant={badge.variant}>{badge.label}</Badge>
                              </TableCell>
                            </TableRow>
                          )
                        })}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
