import { useState, useEffect } from 'react'
import { useAuth } from '@/lib/auth-context'
import { resultsAPI } from '@/lib/api-client'
import { GameResult } from '@/lib/types'
import { GAMES } from '@/lib/games'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { ArrowLeft, ChartBar, Confetti, TrendUp, Trophy } from '@phosphor-icons/react'
import { Badge } from '@/components/ui/badge'
import { ThemeToggle } from '@/components/ThemeToggle'
import { motion } from 'framer-motion'

interface ResultsDashboardProps {
  onBack: () => void
}

// Helper to convert API response to GameResult
function apiToGameResult(apiResult: any): GameResult {
  return {
    id: apiResult.id,
    userId: apiResult.userId,
    userEmail: '', // Not returned by API
    gameId: apiResult.gameId,
    score: apiResult.score,
    reactionTime: apiResult.reactionTime,
    accuracy: apiResult.accuracy,
    errorCount: apiResult.errorCount,
    errorRate: apiResult.errorRate,
    timestamp: apiResult.completedAt,
    details: apiResult.details
  }
}

export function ResultsDashboard({ onBack }: ResultsDashboardProps) {
  const { user } = useAuth()
  const [userResults, setUserResults] = useState<GameResult[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchResults = async () => {
      try {
        const results = await resultsAPI.getResults()
        setUserResults(results.map(apiToGameResult))
      } catch (error) {
        console.error('Failed to fetch results:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchResults()
  }, [])

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Loading results...</p>
      </div>
    )
  }

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
    if (accuracy >= 90) return { label: 'Excellent', variant: 'default' as const, gradient: 'from-green-500 to-emerald-500' }
    if (accuracy >= 75) return { label: 'Good', variant: 'secondary' as const, gradient: 'from-blue-500 to-cyan-500' }
    if (accuracy >= 60) return { label: 'Fair', variant: 'outline' as const, gradient: 'from-yellow-500 to-orange-500' }
    return { label: 'Practice', variant: 'outline' as const, gradient: 'from-gray-500 to-gray-600' }
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
      <header className="border-b border-border bg-card backdrop-blur-sm bg-opacity-80 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
          >
            <Button variant="ghost" onClick={onBack} className="gap-2 hover:bg-primary/10 transition-all">
              <ArrowLeft size={18} weight="duotone" />
              Back to Dashboard
            </Button>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
          >
            <ThemeToggle />
          </motion.div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        <motion.div 
          className="mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-blue-600 flex items-center justify-center shadow-md">
              <ChartBar size={24} weight="duotone" className="text-white" />
            </div>
            <h2 className="text-2xl font-semibold text-foreground">Your Results</h2>
          </div>
          <p className="text-muted-foreground">
            Track your cognitive performance across all games
          </p>
        </motion.div>

        {userResults.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <Card className="border-2 shadow-lg">
              <CardContent className="flex flex-col items-center justify-center py-16">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", delay: 0.2 }}
                  className="w-20 h-20 rounded-full bg-gradient-to-br from-muted to-muted/50 flex items-center justify-center mb-6"
                >
                  <Confetti size={40} weight="duotone" className="text-muted-foreground" />
                </motion.div>
                <p className="text-lg text-foreground mb-2 font-semibold">No results yet</p>
                <p className="text-sm text-muted-foreground mb-6">
                  Complete your first game to see your performance metrics here
                </p>
                <Button 
                  onClick={onBack} 
                  className="gap-2 bg-gradient-to-r from-primary to-blue-600 hover:from-primary/90 hover:to-blue-600/90 shadow-md"
                >
                  <TrendUp size={18} weight="duotone" />
                  Start Training
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        ) : (
          <div className="flex flex-col gap-6">
            {Object.entries(groupedResults).map(([gameId, gameResults], idx) => (
              <motion.div
                key={gameId}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
              >
                <Card className="border-2 shadow-lg hover:shadow-xl transition-all">
                  <CardHeader>
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/20 to-blue-500/10 flex items-center justify-center">
                        <Trophy size={24} weight="duotone" className="text-primary" />
                      </div>
                      <div>
                        <CardTitle>{getGameName(gameId)}</CardTitle>
                        <CardDescription>{gameResults.length} attempts</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Date</TableHead>
                            <TableHead className="text-right">Score</TableHead>
                            <TableHead className="text-right">Accuracy</TableHead>
                            <TableHead className="text-right">Errors</TableHead>
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
                                <TableRow key={result.id} className="hover:bg-muted/50 transition-colors">
                                  <TableCell className="font-medium">{formatDate(result.timestamp)}</TableCell>
                                  <TableCell className="text-right font-bold">
                                    <span className="bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent">
                                      {result.score}
                                    </span>
                                  </TableCell>
                                  <TableCell className="text-right">{result.accuracy.toFixed(1)}%</TableCell>
                                  <TableCell className="text-right">
                                    {result.errorCount !== undefined ? (
                                      <span className="text-destructive font-semibold">
                                        {result.errorCount} ({result.errorRate?.toFixed(1)}%)
                                      </span>
                                    ) : (
                                      <span className="text-muted-foreground">-</span>
                                    )}
                                  </TableCell>
                                  <TableCell className="text-right">
                                    {result.reactionTime ? result.reactionTime.toFixed(0) : 'N/A'}
                                  </TableCell>
                                  <TableCell className="text-right">
                                    <Badge className={`bg-gradient-to-r ${badge.gradient} text-white shadow-sm`}>
                                      {badge.label}
                                    </Badge>
                                  </TableCell>
                                </TableRow>
                              )
                            })}
                        </TableBody>
                      </Table>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
