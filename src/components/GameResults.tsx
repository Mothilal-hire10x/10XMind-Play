import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { CheckCircle, ArrowRight } from '@phosphor-icons/react'
import { Badge } from '@/components/ui/badge'
import { ThemeToggle } from '@/components/ThemeToggle'

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
    if (accuracy >= 90) return { label: 'Excellent', className: 'bg-success text-success-foreground' }
    if (accuracy >= 75) return { label: 'Good', className: 'bg-accent text-accent-foreground' }
    if (accuracy >= 60) return { label: 'Fair', className: 'bg-secondary text-secondary-foreground' }
    return { label: 'Keep Practicing', className: 'bg-muted text-muted-foreground' }
  }

  const badge = getPerformanceBadge(summary.accuracy)

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>
      <Card className="max-w-lg w-full">
        <CardHeader className="text-center">
          <div className="mx-auto w-16 h-16 rounded-full bg-success/10 flex items-center justify-center mb-4">
            <CheckCircle size={32} weight="fill" className="text-success" />
          </div>
          <CardTitle className="text-2xl">Task Complete!</CardTitle>
          <CardDescription>{gameName}</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-6">
          <div className="flex justify-center">
            <Badge className={badge.className}>{badge.label}</Badge>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="text-center p-4 rounded-lg bg-muted">
              <p className="text-3xl font-bold text-foreground">{summary.score}</p>
              <p className="text-sm text-muted-foreground mt-1">Score</p>
            </div>
            <div className="text-center p-4 rounded-lg bg-muted">
              <p className="text-3xl font-bold text-foreground">{summary.accuracy.toFixed(1)}%</p>
              <p className="text-sm text-muted-foreground mt-1">Accuracy</p>
            </div>
            <div className="text-center p-4 rounded-lg bg-muted">
              <p className="text-3xl font-bold text-foreground">{summary.reactionTime.toFixed(0)}</p>
              <p className="text-sm text-muted-foreground mt-1">Avg RT (ms)</p>
            </div>
          </div>

          <Button onClick={onContinue} size="lg" className="gap-2">
            Return to Dashboard
            <ArrowRight size={20} />
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
