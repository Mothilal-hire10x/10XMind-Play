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
    id: 'digit-span',
    name: 'Digit Span Test',
    category: 'memory',
    description: 'Assess short-term memory capacity with forward and backward recall',
    icon: 'Brain',
    instructions: 'Numbers will appear one at a time. First, you will recall sequences in FORWARD order. After failing twice, you will switch to BACKWARD order. The sequence length increases with each success.',
    controls: ['Number keys 0-9', 'Enter to submit']
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
  },
  {
    id: 'flanker',
    name: 'Flanker Task',
    category: 'attention',
    description: 'Respond based on the center letter while ignoring surrounding distractors',
    icon: 'Eye',
    instructions: 'You will see 5 letters in a row. Focus only on the CENTER letter. Press A if the center letter is X or C. Press L if the center letter is V or B.',
    controls: ['A - for X or C', 'L - for V or B']
  },
  {
    id: 'simon',
    name: 'Simon Task',
    category: 'attention',
    description: 'Respond to word meaning, not screen position',
    icon: 'Eye',
    instructions: 'The words "LEFT" or "RIGHT" will appear on screen. Press the key that matches what the WORD SAYS, not where it appears. Press A for LEFT, press L for RIGHT.',
    controls: ['A - LEFT', 'L - RIGHT']
  },
  {
    id: 'corsi',
    name: 'Corsi Blocks',
    category: 'memory',
    description: 'Replicate sequences of highlighted blocks',
    icon: 'Brain',
    instructions: 'Watch as blocks light up in sequence. After the sequence ends, click the blocks in the same order. The sequence will get longer as you progress.',
    controls: ['Mouse click on blocks']
  },
  {
    id: 'tower-hanoi',
    name: 'Tower of Hanoi',
    category: 'executive',
    description: 'Move all disks to the right peg following size rules',
    icon: 'TreeStructure',
    instructions: 'Move all disks from the left peg to the right peg. You can only move one disk at a time, and you cannot place a larger disk on top of a smaller disk.',
    controls: ['Click disk then click destination peg']
  },
  {
    id: 'sart',
    name: 'SART',
    category: 'attention',
    description: 'Sustained attention task - respond to all digits except the target',
    icon: 'Lightning',
    instructions: 'Numbers from 1-9 will appear rapidly. Press SPACE for every number EXCEPT 3. When you see 3, do not press anything.',
    controls: ['Space - for all numbers except 3']
  },
  {
    id: 'nback',
    name: 'N-Back Task',
    category: 'memory',
    description: 'Identify when the current number matches the one from 2 steps back',
    icon: 'Brain',
    instructions: 'Numbers will appear one at a time. Press SPACE when the current number is the SAME as the number shown 2 steps ago. Do nothing if they don\'t match.',
    controls: ['Space - when number matches 2-back']
  }
]

export function getGameById(id: string): GameConfig | undefined {
  return GAMES.find(game => game.id === id)
}
