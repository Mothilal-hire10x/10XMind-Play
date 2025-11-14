# Planning Guide

MindPlay is a browser-based cognitive training platform featuring eight interactive psychological games designed to assess and strengthen memory, attention, processing speed, and cognitive flexibility through scientifically-grounded tasks.

**Experience Qualities**: 
1. **Focused** - Interface eliminates distractions to maintain user concentration during cognitive assessments
2. **Precise** - Interactions provide immediate, accurate feedback with millisecond-level timing for valid results
3. **Encouraging** - Design celebrates progress and learning without creating performance anxiety

**Complexity Level**: Light Application (multiple features with basic state)
  - Multiple distinct game modules with shared navigation and result tracking, plus user session management for storing performance data across visits.

## Essential Features

### User Authentication
- **Functionality**: Email/password registration and login with persistent sessions
- **Purpose**: Enables personalized result tracking and progress monitoring over time
- **Trigger**: Landing page with login/signup forms
- **Progression**: Landing → Form input → Validation → Dashboard (stored session maintains login state)
- **Success criteria**: User can create account, log in, and remain authenticated across page refreshes

### Game Dashboard
- **Functionality**: Grid display of 8 cognitive games with visual cards showing game type and brief description
- **Purpose**: Provides clear navigation to all available cognitive assessments
- **Trigger**: Successful authentication
- **Progression**: Dashboard view → Click game card → Instructions screen → Start game
- **Success criteria**: All 8 games visible with clear categorization (memory, attention, executive function)

### Stroop Task
- **Functionality**: Display color words in mismatched ink colors; user identifies ink color via keyboard
- **Purpose**: Measures selective attention and cognitive interference
- **Trigger**: User clicks "Start" from instructions screen
- **Progression**: Instructions → Fixation cross → Color word appears → Keypress (R/G/B/Y) → Feedback → Next trial (20 trials) → Results summary
- **Success criteria**: Accurate reaction time measurement, correct/incorrect feedback, final accuracy and RT metrics

### Flanker Task
- **Functionality**: Display 5-letter sequences with congruent/incongruent flankers; respond to center letter
- **Purpose**: Assesses ability to suppress irrelevant information and maintain focus
- **Trigger**: Start button after reading instructions
- **Progression**: Instructions → Practice trial → Fixation → Stimulus (e.g., XXXXX or XXVXX) → Response (A/L keys) → Feedback → 24 trials → Results
- **Success criteria**: Distinguishes congruent vs incongruent trial performance, tracks errors

### Simon Task
- **Functionality**: Words "LEFT" or "RIGHT" appear on either side; respond based on word meaning, not position
- **Purpose**: Tests spatial stimulus-response compatibility effects
- **Trigger**: Game start from instructions
- **Progression**: Instructions → Fixation → Word appears left/right of center → Keypress (A for LEFT, L for RIGHT) → Feedback → 20 trials → Results
- **Success criteria**: Separates compatible vs incompatible trials in results display

### Digit Span Task
- **Functionality**: Sequential presentation of digits; user recalls in order using number keys
- **Purpose**: Measures verbal working memory capacity
- **Trigger**: Start button
- **Progression**: Instructions → Digits appear one-by-one (1 sec each) → Blank screen → User types sequence → Feedback → Span increases after 2 correct → Continue until 2 consecutive failures → Final span score
- **Success criteria**: Adaptive difficulty, clear input interface, maximum span achieved displayed

### Corsi Block Task
- **Functionality**: Grid of blocks flash in sequence; user clicks blocks to reproduce pattern
- **Purpose**: Assesses visuospatial working memory
- **Trigger**: Start button
- **Progression**: Instructions → Blocks highlight sequentially (1 sec each) → User clicks blocks in order → Feedback → Sequence grows → Stop after 2 failures → Spatial span result
- **Success criteria**: Visual highlighting system, touch/click input, accurate sequence validation

### Tower of Hanoi
- **Functionality**: Move stacked disks from left peg to right peg following size rules
- **Purpose**: Evaluates planning and problem-solving ability
- **Trigger**: Game start
- **Progression**: Instructions (rules + optimal solution hint) → User drags/clicks disks → Validation of legal moves → Move counter → Success message when complete → Moves and time recorded
- **Success criteria**: Drag-and-drop or click-based interface, rule enforcement, visual disk states

### SART (Sustained Attention to Response Task)
- **Functionality**: Rapid digit presentation (1-9); press space for all except target digit (e.g., 3)
- **Purpose**: Measures sustained attention and response inhibition
- **Trigger**: Start from instructions
- **Progression**: Instructions → Rapid digit stream (250ms each) → Spacebar response (except no-go digit) → 90 trials → Omission/commission error analysis
- **Success criteria**: Fast presentation timing, distinguishes errors of omission vs commission

### N-Back Task
- **Functionality**: Sequential numbers presented; user identifies when current number matches the one from 2 positions back
- **Purpose**: Tests working memory updating and continuous monitoring
- **Trigger**: Start button
- **Progression**: Instructions → Number appears → User presses space if it matches 2-back, nothing otherwise → Feedback → 20+10 targets → Accuracy and d' score calculation
- **Success criteria**: Clear match/no-match feedback, calculates signal detection metrics

### Results Dashboard
- **Functionality**: Display performance history for each game with metrics (RT, accuracy, scores)
- **Purpose**: Enables progress tracking and identifies cognitive strengths/weaknesses
- **Trigger**: "View Results" button from main dashboard
- **Progression**: Dashboard → Results view → Filter by game → See metrics table/chart → Return to dashboard
- **Success criteria**: All completed games show historical data with timestamps

## Edge Case Handling

- **Early game exit**: Saves partial data with "incomplete" flag; user can resume or start fresh
- **Invalid input**: Visual shake animation on input field, helper text appears, doesn't advance trial
- **Rapid repeated clicks**: Debounce buttons to prevent accidental double-starts or skipped trials
- **Missing session data**: Redirect to login if session expires; preserve current game state temporarily
- **First-time user**: Show welcome modal with platform overview and game category explanations
- **Empty results**: Display encouraging empty state: "Complete your first game to see results here!"

## Design Direction

The design should evoke a sense of scientific precision and calm focus—clinical without being cold, using clean lines and ample whitespace that reflects psychological research environments while remaining approachable for students. A minimal interface serves the core purpose by reducing cognitive load outside the tasks themselves, allowing full attention on the games.

## Color Selection

Analogous cool palette (blue to cyan) creates a focused, non-stimulating environment that supports concentration during cognitive tasks.

- **Primary Color**: Deep Navy `oklch(0.35 0.08 250)` - Communicates professionalism and focus, used for primary actions and headers
- **Secondary Colors**: Soft Sky Blue `oklch(0.75 0.08 240)` for supportive UI elements; Teal Accent `oklch(0.65 0.10 200)` for success states
- **Accent Color**: Bright Cyan `oklch(0.70 0.15 210)` - Draws attention to interactive game cards and CTAs without overstimulation
- **Foreground/Background Pairings**: 
  - Background (White `oklch(0.98 0 0)`): Deep Navy text `oklch(0.25 0.08 250)` - Ratio 11.2:1 ✓
  - Card (Light Sky `oklch(0.96 0.02 240)`): Deep Navy text `oklch(0.25 0.08 250)` - Ratio 10.8:1 ✓
  - Primary (Deep Navy `oklch(0.35 0.08 250)`): White text `oklch(0.98 0 0)` - Ratio 8.5:1 ✓
  - Secondary (Sky Blue `oklch(0.75 0.08 240)`): Deep Navy text `oklch(0.25 0.08 250)` - Ratio 4.8:1 ✓
  - Accent (Cyan `oklch(0.70 0.15 210)`): White text `oklch(0.98 0 0)` - Ratio 5.2:1 ✓
  - Muted (Light Gray `oklch(0.92 0 0)`): Charcoal text `oklch(0.45 0 0)` - Ratio 7.1:1 ✓

## Font Selection

Typography should communicate clarity and precision with a neutral, scientific character that doesn't distract from cognitive tasks—using a geometric sans-serif for its objectivity and excellent legibility at all sizes.

**Primary Font**: Inter (Google Fonts)

- **Typographic Hierarchy**: 
  - H1 (Platform Title): Inter Bold / 32px / -0.02em letter spacing / 1.2 line height
  - H2 (Game Titles): Inter SemiBold / 24px / -0.01em / 1.3
  - H3 (Section Headers): Inter Medium / 18px / 0em / 1.4
  - Body (Instructions/Content): Inter Regular / 16px / 0em / 1.6
  - Small (Metadata/Captions): Inter Regular / 14px / 0em / 1.5
  - Game Stimulus Text: Inter Bold / 48px / 0em / 1.0 (large, clear for reaction tasks)

## Animations

Animations should be purposeful and minimal, supporting task feedback and transitions without adding distraction or delay—prioritizing immediate response over decorative motion to maintain the scientific integrity of timing-sensitive tasks.

- **Purposeful Meaning**: Subtle pulse on correct responses communicates success; red shake on errors provides clear negative feedback without harsh punishment
- **Hierarchy of Movement**: Game stimuli appear instantly (no fade-in to preserve reaction time validity); dashboard cards have gentle hover lift (2px); page transitions use simple 200ms fade

## Component Selection

- **Components**: 
  - `Card` for game tiles and instruction panels with subtle elevation
  - `Button` for primary actions (Start Game, Submit) with clear pressed states
  - `Input` for authentication forms with visible focus rings
  - `Dialog` for game instructions overlays before task start
  - `Progress` for displaying trial count within games
  - `Table` for results display with sortable columns
  - `Tabs` for switching between different game categories or result views
  - `Badge` for displaying performance levels (Excellent, Good, Practice More)
  - `Alert` for feedback messages after trial responses

- **Customizations**: 
  - Stimulus Display Component: Full-screen overlay with centered text/blocks for game trials
  - Timer Display: Minimalist countdown for timed tasks
  - Keyboard Listener Component: Captures keypress with visual key highlighting for games requiring specific keys

- **States**: 
  - Buttons: Subtle shadow on default, lift 1px on hover, pressed state with inner shadow, disabled with 40% opacity
  - Inputs: 2px border, primary color ring on focus, green border on valid, red on error
  - Game Cards: Scale 1.02 on hover with shadow increase, active state with slight saturation boost

- **Icon Selection**: 
  - Brain `@phosphor-icons/react` for memory games
  - Eye for attention tasks
  - Lightning for processing speed games
  - TreeStructure for executive function
  - ChartLine for results section
  - Play for start buttons
  - X for exit/close

- **Spacing**: 
  - Card padding: p-6 (24px)
  - Section gaps: gap-8 (32px) for main layout, gap-4 (16px) for related items
  - Button padding: px-6 py-3 for primary, px-4 py-2 for secondary
  - Page margins: max-w-7xl mx-auto px-4

- **Mobile**: 
  - Game grid: 1 column on mobile (<768px), 2 on tablet (768-1024px), 3 on desktop (>1024px)
  - Stimulus display remains centered and large on all screens
  - Keyboard tasks provide on-screen button alternatives for mobile users
  - Results table switches to card layout on mobile for better readability
  - Navigation collapses to hamburger menu below 640px
