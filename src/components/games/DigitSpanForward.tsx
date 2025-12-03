import { DigitSpanTask } from './DigitSpanTask'
import { TrialResult, GameSummary } from '@/lib/types'

interface DigitSpanForwardProps {
  onComplete: (results: TrialResult[], summary: GameSummary) => void
  onExit: () => void
}

export function DigitSpanForward({ onComplete, onExit }: DigitSpanForwardProps) {
  return <DigitSpanTask onComplete={onComplete} onExit={onExit} defaultMode="forward" />
}
