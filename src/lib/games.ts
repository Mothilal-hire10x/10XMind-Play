import { GameConfig } from './types'

export const GAMES: GameConfig[] = [
  {
    id: 'stroop',
    name: 'Stroop Test',
    category: 'attention',
    description: 'Measure response inhibition under congruent and incongruent conditions',
    icon: 'Eye',
    instructions: 'Color words will appear on screen in different ink colors. Press the key that matches the INK COLOR, not the word itself. Use R for Red, G for Green, B for Blue, Y for Yellow. This test measures your ability to inhibit automatic responses.',
    controls: ['R - Red', 'G - Green', 'B - Blue', 'Y - Yellow']
  },
  {
    id: 'digit-span-forward',
    name: 'Forward Digit Span',
    category: 'memory',
    description: 'Assess short-term memory capacity by recalling digits in the same order',
    icon: 'Brain',
    instructions: 'Numbers will appear one at a time. Recall the sequence in FORWARD order (same order shown). The sequence length increases with each success.',
    controls: ['Click number buttons', 'Submit button to confirm']
  },
  {
    id: 'digit-span-backward',
    name: 'Backward Digit Span',
    category: 'memory',
    description: 'Assess working memory capacity by recalling digits in reverse order',
    icon: 'Brain',
    instructions: 'Numbers will appear one at a time. Recall the sequence in BACKWARD order (reverse of what was shown). The sequence length increases with each success.',
    controls: ['Click number buttons', 'Submit button to confirm']
  },
  {
    id: 'trail-making',
    name: 'Trail Making Test',
    category: 'attention',
    description: 'Measure visual attention, processing speed, and task switching',
    icon: 'Lightning',
    instructions: 'Part A: Connect numbered circles in order (1→2→3...). Part B: Alternate between numbers and letters (1→A→2→B...). Click circles in sequence as quickly as possible.',
    controls: ['Mouse click on circles']
  },
  {
    id: 'mental-rotation',
    name: 'Mental Rotation Test',
    category: 'executive',
    description: 'Assess spatial visualization and mental rotation abilities',
    icon: 'Cube',
    instructions: 'You will see two 3D shapes at different angles. Determine if they are the SAME shape (just rotated) or DIFFERENT (including mirror images). Press S for Same or D for Different.',
    controls: ['S - Same shape', 'D - Different shape']
  },
  {
    id: 'dichotic-listening',
    name: 'Dichotic Listening Test',
    category: 'attention',
    description: 'Assess lateralization of auditory processing',
    icon: 'Ear',
    instructions: 'You will hear different syllables in each ear simultaneously through headphones. After listening, select which syllable you heard in your LEFT ear and which in your RIGHT ear. This tests auditory attention and ear dominance.',
    controls: ['Click syllable buttons for each ear']
  }
]

export function getGameById(id: string): GameConfig | undefined {
  return GAMES.find(game => game.id === id)
}
