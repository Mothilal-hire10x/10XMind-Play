import { DigitSpanTask } from './DigitSpanTask'
import { TrialResult, GameSummary } from '@/lib/types'

interface DigitSpanBackwardProps {
  onComplete: (results: TrialResult[], summary: GameSummary) => void
  onExit: () => void
}

export function DigitSpanBackward({ onComplete, onExit }: DigitSpanBackwardProps) {
  return <DigitSpanTask onComplete={onComplete} onExit={onExit} defaultMode="backward" />
}
