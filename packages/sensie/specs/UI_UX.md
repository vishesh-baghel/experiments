# Sensie UI/UX Design

## Design Philosophy

**Goal:** Create a learning-focused interface that feels fundamentally different from ChatGPT/Claude while maintaining familiarity and usability.

**Key Differentiators:**
1. **Learning-First Layout:** Not a pure chat interface, but a guided learning environment
2. **Persistent Context:** Current learning topic always visible, no thread switching
3. **Progress-Driven:** Visual progress indicators everywhere
4. **Command-Friendly:** Keyboard shortcuts and slash commands for power users
5. **Distraction-Free:** Minimal chrome, focus on current conversation
6. **Gamified Elements:** Mastery levels, unlocks, achievements (subtle, not overwhelming)

## Core UI Layout

### Main Layout Structure

```
┌─────────────────────────────────────────────────────────────┐
│  [Sensie Logo]         [Current Topic]         [User Menu] │ ← Header
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌────────────┐  ┌──────────────────────────────────────┐ │
│  │            │  │                                       │ │
│  │  Topic     │  │        Chat Area                     │ │
│  │  Progress  │  │        (Current Learning Session)    │ │
│  │  Sidebar   │  │                                       │ │
│  │            │  │                                       │ │
│  │  (Can hide)│  │                                       │ │
│  │            │  │                                       │ │
│  │            │  │                                       │ │
│  └────────────┘  │                                       │ │
│                  │                                       │ │
│                  └───────────────────────────────────────┘ │
│                  ┌───────────────────────────────────────┐ │
│                  │  Input Area + Commands               │ │
│                  └───────────────────────────────────────┘ │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Key Differences from ChatGPT/Claude

| Aspect | ChatGPT/Claude | Sensie |
|--------|----------------|--------|
| **Layout** | Sidebar with threads + Chat | Topic sidebar + Chat + Progress |
| **Context** | Thread-based, switch threads | Topic-based, single focused session |
| **History** | Visible in sidebar, clickable | Searchable archive, not in main view |
| **Progress** | None | Prominent progress indicators |
| **Commands** | Limited | Extensive slash commands |
| **Navigation** | Thread switching | Topic progression (linear unlocking) |

## Detailed Component Design

### 1. Header

**Layout:**
```
┌─────────────────────────────────────────────────────────────┐
│  🎴 Sensie  |  🔥 Rust Ownership (65%)  |  [/] [🔔] [👤]   │
└─────────────────────────────────────────────────────────────┘
```

**Components:**
- **Logo:** "🎴 Sensie" (clickable → home)
- **Current Topic Badge:** Shows active learning topic + mastery %
  - Animated progress ring around topic name
  - Click → Topic details modal
- **Command Palette:** `/` button → Opens command search
- **Notifications:** `🔔` → Review reminders, achievements
- **User Menu:** `👤` → Profile, settings, logout

**Behavior:**
- Header is sticky (always visible)
- Current topic updates as user progresses
- Progress ring animates on mastery increase

### 2. Topic Progress Sidebar (Collapsible)

**Layout:**
```
┌────────────────┐
│  Topics        │
│  [Hide] ──     │
├────────────────┤
│                │
│ 🔥 Active      │
│  Rust (65%)    │
│  ├─ Ownership ✅│
│  ├─ Borrowing 🔄│
│  └─ Lifetimes 🔒│
│                │
│ ✅ Completed   │
│  JS (90%)      │
│                │
│ 📚 Queued      │
│  Sys Design    │
│  Distributed   │
│                │
│ [+ New Topic]  │
│                │
└────────────────┘
```

**Features:**
- **Active Topics:** Currently learning (max 2-3)
  - Subtopics shown with status (✅ completed, 🔄 in progress, 🔒 locked)
  - Click subtopic → Continue learning
- **Completed Topics:** Mastered topics (80%+)
  - Click → View summary, start review
- **Queued Topics:** Saved for later
  - Click → Start learning
- **Add Topic:** Quick add new topic to queue

**States:**
- **Expanded (default):** Full sidebar visible
- **Collapsed:** Icons only, hover to expand
- **Hidden:** More screen space for chat

**Mobile:**
- Becomes bottom sheet (swipe up to access)
- Quick topic switcher at top

### 3. Chat Area (Main Focus)

**Design Principles:**
- **Clean:** No clutter, focus on conversation
- **Contextual:** Shows current concept being taught
- **Interactive:** Questions are visually distinct
- **Progressive:** Shows learning path (where you are)

**Layout:**
```
┌──────────────────────────────────────────────────────┐
│                                                      │
│  [Concept: Ownership Basics]                        │
│  Progress: 2/5 questions ████░░                     │
│                                                      │
│  ┌────────────────────────────────────────────────┐ │
│  │ Sensie:                                        │ │
│  │ Excellent choice, young apprentice!            │ │
│  │                                                │ │
│  │ Ownership in Rust means each value has        │ │
│  │ exactly one owner...                           │ │
│  │                                                │ │
│  │ ❓ Question 1/5:                               │ │
│  │ What happens when you pass a value to a       │ │
│  │ function in Rust?                              │ │
│  │                                                │ │
│  │ [Request Hint] [Skip]                          │ │
│  └────────────────────────────────────────────────┘ │
│                                                      │
│  ┌────────────────────────────────────────────────┐ │
│  │ You:                                           │ │
│  │ The function takes ownership of the value...   │ │
│  └────────────────────────────────────────────────┘ │
│                                                      │
│  ┌────────────────────────────────────────────────┐ │
│  │ Sensie:                                        │ │
│  │ ✅ Excellent work, apprentice!                 │ │
│  │                                                │ │
│  │ You're absolutely right. Now let's dig        │ │
│  │ deeper...                                      │ │
│  │                                                │ │
│  │ ❓ Question 2/5:                               │ │
│  │ What if the original variable tries to use... │ │
│  └────────────────────────────────────────────────┘ │
│                                                      │
│  ... (conversation continues)                        │
│                                                      │
└──────────────────────────────────────────────────────┘
```

**Message Types:**

**Sensie Message:**
```
┌────────────────────────────────────────────────┐
│ 🎴 Sensie                                      │
│                                                │
│ [Message content]                              │
│                                                │
│ [Optional: Code examples, diagrams]            │
└────────────────────────────────────────────────┘
```

**User Message:**
```
┌────────────────────────────────────────────────┐
│                                      You 👤    │
│                                                │
│                     [Message content]          │
└────────────────────────────────────────────────┘
```

**Question Card (Special Message Type):**
```
┌────────────────────────────────────────────────┐
│ ❓ Question 3/5                        Lvl 2    │
├────────────────────────────────────────────────┤
│                                                │
│ Compare ownership in Rust vs garbage          │
│ collection in JavaScript. What are the        │
│ trade-offs?                                    │
│                                                │
├────────────────────────────────────────────────┤
│ [💡 Hint] [⏭️ Skip] [📖 Re-read Concept]       │
└────────────────────────────────────────────────┘
```

**Feedback Card (After Answer):**
```
┌────────────────────────────────────────────────┐
│ ✅ Correct! (+10 points)                       │
├────────────────────────────────────────────────┤
│ Well done! You understand the core difference.│
│ Now, let's explore the performance            │
│ implications...                                │
└────────────────────────────────────────────────┘

OR

┌────────────────────────────────────────────────┐
│ ⚠️ Not quite...                                │
├────────────────────────────────────────────────┤
│ You're thinking in the right direction, but   │
│ consider this: [guiding question]             │
│                                                │
│ [Try Again] [Get Hint]                         │
└────────────────────────────────────────────────┘
```

**Concept Completion Card:**
```
┌────────────────────────────────────────────────┐
│ 🎉 Concept Mastered!                           │
│                                                │
│ Ownership Basics ████████████ 100%            │
│                                                │
│ • 5/5 questions correct                        │
│ • No hints used                                │
│ • Mastery: 65% → 75%                           │
│                                                │
│ Next: Borrowing 🔓 Unlocked!                   │
│                                                │
│ [Continue Learning] [Take a Break]             │
└────────────────────────────────────────────────┘
```

**Learning Path Preview Card (Topic Start):**
```
┌────────────────────────────────────────────────┐
│ 📚 Your Training Journey: Rust Ownership       │
├────────────────────────────────────────────────┤
│                                                │
│ I've mapped out your path to mastery:          │
│                                                │
│  ○ 1. Memory Addresses (foundation)            │
│  ○ 2. Stack vs Heap (foundation)               │
│  ○ 3. Ownership Basics                         │
│  ○ 4. Move Semantics                           │
│  ○ 5. Borrowing                                │
│  ○ 6. Lifetimes                                │
│                                                │
│  Estimated time: ~3-4 hours                    │
│                                                │
├────────────────────────────────────────────────┤
│ 💬 What's your goal? (optional)                │
│ ┌────────────────────────────────────────────┐ │
│ │ e.g., "Building CLI tools" or "Learning   │ │
│ │ for job interviews"                        │ │
│ └────────────────────────────────────────────┘ │
│                                                │
│            [Begin Training →]                  │
└────────────────────────────────────────────────┘
```

**Design Principle: Trust the Sensei**
- Path is **view-only** - user cannot edit/skip subtopics
- User doesn't know what they don't know - that's why they're learning
- Optional goal input helps Sensie tailor examples, not skip foundations
- Sensie controls prerequisites - user controls when to start

### 4. Input Area

**Layout:**
```
┌──────────────────────────────────────────────────────┐
│  [Type your answer or use /commands]                │
│  ────────────────────────────────────────────────── │
│                                                      │
│  [/]  Type / for commands                   [Send]  │
└──────────────────────────────────────────────────────┘
```

**Features:**
- **Auto-expanding textarea:** Grows with content
- **Command palette:** Type `/` to see commands
- **Keyboard shortcuts:** `Enter` to send, `Shift+Enter` for newline
- **Typing indicator:** Shows "Sensie is thinking..." when processing

**Command Palette (Triggered by `/`):**
```
┌──────────────────────────────────────────────────────┐
│  /progress      Show current topic progress         │
│  /topics        List all learning topics             │
│  /quiz          Start a quiz on current topic        │
│  /review        Begin spaced repetition review       │
│  /hint          Request a hint for current question  │
│  /explain       Get detailed explanation             │
│  /skip          Skip current question                │
│  /break         Take a break, save progress          │
└──────────────────────────────────────────────────────┘
```

**Smart Contextual Commands:**
- If user is answering a question → Show `/hint`, `/skip`
- If user completed a concept → Show `/quiz`, `/review`
- Always available: `/progress`, `/topics`, `/break`

### 5. Progress Visualizations

**Mastery Gauge (In Topic Sidebar & Progress View):**
```
┌────────────────┐
│  Rust          │
│                │
│      75%       │
│   ████████░░   │
│                │
│  Proficient    │
└────────────────┘
```

**Subtopic Tree (Expandable):**
```
Rust (75%)
├─ ✅ Ownership Basics (100%)
│  ├─ ✅ Memory Addresses
│  ├─ ✅ Stack vs Heap
│  └─ ✅ Move Semantics
├─ 🔄 Borrowing (60%)
│  ├─ ✅ Immutable Borrows
│  ├─ 🔄 Mutable Borrows (in progress)
│  └─ 🔒 Borrow Checker (locked)
└─ 🔒 Lifetimes (locked)
```

**Review Calendar (Spaced Repetition View):**
```
┌────────────────────────────────────────────────────┐
│  Review Schedule                                   │
├────────────────────────────────────────────────────┤
│                                                    │
│  Today (3)                                         │
│  • Ownership Basics                                │
│  • JavaScript Closures                             │
│  • SQL Indexes                                     │
│                                                    │
│  Tomorrow (1)                                      │
│  • System Design Caching                           │
│                                                    │
│  Next Week (5)                                     │
│  [Show all]                                        │
│                                                    │
│  [Start Reviews]                                   │
└────────────────────────────────────────────────────┘
```

## Hybrid Chat Interface Design

**The Problem with Traditional Threads:**
- Context switching breaks learning flow
- Hard to maintain single learning context
- Past conversations clutter interface

**The Problem with Endless Chat:**
- Overwhelming scroll
- Hard to find specific past topics
- Context window management

**Sensie's Hybrid Solution:**

### Current Topic Focus

```
Active Learning Session (in main chat):
- Only shows current topic's conversation
- No thread switching needed
- Linear progression through subtopics
- Can pause and resume later
```

### Searchable History

```
Archive (accessible via search):
- All past conversations searchable
- Organized by topic and date
- Can reference past learnings
- Not visible in main view (reduces clutter)
```

### Implementation

**Chat State:**
```typescript
interface ChatState {
  // Active session (visible in main chat)
  activeSession: {
    topicId: string;
    subtopicId?: string;
    messages: Message[];
    startedAt: Date;
    lastActivity: Date;
  };

  // Archived sessions (searchable)
  archivedSessions: {
    id: string;
    topicName: string;
    summary: string;
    completedAt: Date;
  }[];
}
```

**Navigation:**
- **Continue Current Topic:** Main chat shows active session
- **Start New Topic:** Archives current session, starts new one
- **Search History:** Cmd+K → Search all past sessions
- **Review Past Topic:** Loads archived session in read-only mode

**Example Flow:**
```
User learning Rust Ownership (active session)
  ↓
User: "I want to learn System Design now"
  ↓
Sensie: "Save progress on Rust and start System Design?
        Current progress: 75%, Next up: Lifetimes"
  ↓
User: "Yes"
  ↓
Rust session archived
System Design session starts (becomes active)
Main chat now shows System Design conversation
```

## Command System

### Slash Commands

**Primary Commands:**

**`/progress`**
```
Shows current topic progress with details:
- Mastery percentage
- Subtopics completed
- Next concept to learn
- Scheduled reviews
```

**`/topics`**
```
Lists all topics:
- Active (currently learning)
- Completed (mastered)
- Queued (saved for later)
- Option to switch topic
```

**`/quiz`**
```
Starts quiz on current topic:
- Generates 5-10 questions
- Adaptive difficulty
- Shows score at end
- Updates mastery based on performance
```

**`/review`**
```
Starts spaced repetition review:
- Shows topics due for review
- Quick quiz format
- Updates review schedule
- Identifies concepts to re-learn
```

**`/hint`**
```
Provides hint for current question (3 PROGRESSIVE LEVELS):

Hint 1: Related concept reminder / thinking direction
  "Think about what happens to the original variable after the move..."

Hint 2: Partial answer structure with blanks
  "The function takes ___ of the value, meaning the original variable becomes ___"

Hint 3: Narrow down to key insight
  "The key concept here is 'move semantics' - the value is transferred, not copied"

After 3 hints: No more hints available
  Sensie: "You've used all your hints, apprentice. Give it your best attempt
           - even a partial answer helps me understand your thinking!"
```

**`/explain`**
```
Provides detailed explanation:
- Use when truly stuck
- Sensie explains concept thoroughly
- Immediately asks simpler question to verify
```

**`/skip`**
```
Skips current question (LIMITED):
- 3 skips max per learning session
- Skipped questions marked for revisiting at end of subtopic
- After 3 skips, Sensie refuses:
  "No more skips remaining, apprentice. Face this challenge!"
- Skips reset when session ends or topic changes

Revisit Flow:
- Skipped questions must be answered before unlocking next subtopic
- If user fails skipped questions: loop on those questions only (no reteach)
- User does NOT get additional skips during revisit
- After 5 attempts per question, mark for review and proceed (don't block)
```

**`/break`**
```
Saves progress and pauses learning:
- Session archived
- Progress saved
- Resume anytime
```

### Keyboard Shortcuts

- **`/`** → Open command palette
- **`Cmd+K`** → Search history
- **`Cmd+P`** → View progress
- **`Cmd+Enter`** → Send message (alternative to button)
- **`Esc`** → Close modals/overlays

## Views & Screens

### 1. Home/Dashboard

**Purpose:** Overview of learning journey

**Layout:**
```
┌──────────────────────────────────────────────────────┐
│  Welcome back, apprentice!                           │
│                                                      │
│  🔥 Continue Learning                                │
│  ┌────────────────────────────────────────────────┐ │
│  │  Rust Ownership (75%)                          │ │
│  │  Next: Borrowing - Mutable Borrows            │ │
│  │                                                │ │
│  │  [Continue Learning →]                         │ │
│  └────────────────────────────────────────────────┘ │
│                                                      │
│  📅 Reviews Due Today (3)                            │
│  • Ownership Basics                                  │
│  • JavaScript Closures                               │
│  • SQL Indexes                                       │
│                                                      │
│  [Start Reviews]                                     │
│                                                      │
│  📊 This Week                                        │
│  • 5 concepts mastered                               │
│  • 3 topics in progress                              │
│  • 12 reviews completed                              │
│                                                      │
│  📚 All Topics  →                                    │
│                                                      │
└──────────────────────────────────────────────────────┘
```

### 2. Learning View (Main Chat Interface)

See "Chat Area" section above.

### 3. Topics View

**Purpose:** Manage all learning topics

**Layout:**
```
┌──────────────────────────────────────────────────────┐
│  Learning Topics                                     │
│                                                      │
│  [All] [Active] [Completed] [Queued]  [+ New Topic] │
│                                                      │
│  🔥 Active (2)                                       │
│  ┌────────────────────────────────────────────────┐ │
│  │  Rust (75%)                                    │ │
│  │  ████████████░░░░                              │ │
│  │  Subtopics: 2/5 completed                     │ │
│  │  [Continue]                                    │ │
│  └────────────────────────────────────────────────┘ │
│                                                      │
│  ┌────────────────────────────────────────────────┐ │
│  │  System Design (30%)                           │ │
│  │  ██████░░░░░░░░░░                              │ │
│  │  Subtopics: 1/8 completed                     │ │
│  │  [Continue]                                    │ │
│  └────────────────────────────────────────────────┘ │
│                                                      │
│  ✅ Completed (3)                                    │
│  [Show all]                                          │
│                                                      │
│  📚 Queued (5)                                       │
│  [Show all]                                          │
│                                                      │
└──────────────────────────────────────────────────────┘
```

### 4. Progress View (Detailed Analytics)

**Purpose:** Deep dive into learning progress

**Layout:**
```
┌──────────────────────────────────────────────────────┐
│  Rust - Progress Details                             │
│                                                      │
│  Overall Mastery: 75%                                │
│  ████████████████████████░░░░░░░░                   │
│                                                      │
│  Subtopics:                                          │
│  ├─ Ownership Basics (100%) ✅                       │
│  ├─ Borrowing (60%) 🔄                               │
│  └─ Lifetimes (0%) 🔒                                │
│                                                      │
│  Statistics:                                         │
│  • Questions answered: 45                            │
│  • Correct: 38 (84%)                                 │
│  • Hints used: 7                                     │
│  • Current difficulty: Level 3                       │
│                                                      │
│  Review Schedule:                                    │
│  • Next review: Tomorrow                             │
│  • Reviews completed: 3                              │
│  • Success rate: 100%                                │
│                                                      │
│  Learning Path:                                      │
│  [Visual tree showing completed and upcoming]        │
│                                                      │
└──────────────────────────────────────────────────────┘
```

### 5. Settings View

**Purpose:** Configure learning preferences and mastery thresholds

**Layout:**
```
┌──────────────────────────────────────────────────────┐
│  Settings                                            │
│                                                      │
│  🎯 Learning Preferences                              │
│  ┌────────────────────────────────────────────────┐ │
│  │                                                │ │
│  │  Mastery Threshold                             │ │
│  │  When is a topic considered "mastered"?       │ │
│  │  ────────────────────────●────────────        │ │
│  │              50%        80%       100%        │ │
│  │  Current: 80%                                 │ │
│  │                                                │ │
│  │  Daily Learning Goal                           │ │
│  │  [15 min] [30 min] [45 min] [60 min]          │ │
│  │                                                │ │
│  │  Difficulty Starting Level                     │ │
│  │  [1-Beginner] [2] [3-Default] [4] [5-Expert]  │ │
│  │                                                │ │
│  └────────────────────────────────────────────────┘ │
│                                                      │
│  🎴 Personality                                       │
│  ┌────────────────────────────────────────────────┐ │
│  │                                                │ │
│  │  Sensie's Personality Level                    │ │
│  │  ○ Full Master Roshi Energy (default)         │ │
│  │  ○ Balanced (occasional humor)                │ │
│  │  ○ Minimal (professional tone)                │ │
│  │                                                │ │
│  └────────────────────────────────────────────────┘ │
│                                                      │
│  🔔 Notifications (In-App Only)                      │
│  ┌────────────────────────────────────────────────┐ │
│  │                                                │ │
│  │  Review Reminders         [ON]                │ │
│  │  (Badge appears when reviews are due)          │ │
│  │                                                │ │
│  │  Achievement Celebrations [ON]                │ │
│  │  (Confetti when you master a concept)         │ │
│  │                                                │ │
│  └────────────────────────────────────────────────┘ │
│                                                      │
│  🤖 AI Model                                         │
│  ┌────────────────────────────────────────────────┐ │
│  │                                                │ │
│  │  Provider                                      │ │
│  │  [Anthropic ▾] [OpenAI ▾]                     │ │
│  │                                                │ │
│  │  Model                                         │ │
│  │  ○ Auto (Sonnet for teaching, Haiku for hints)│ │
│  │  ○ Claude Sonnet (balanced)                   │ │
│  │  ○ Claude Haiku (faster, cheaper)             │ │
│  │  ○ Claude Opus (best quality, expensive)      │ │
│  │                                                │ │
│  │  ℹ️ Requires your own API key in .env          │ │
│  │                                                │ │
│  └────────────────────────────────────────────────┘ │
│                                                      │
│  🌙 Appearance                                       │
│  ┌────────────────────────────────────────────────┐ │
│  │                                                │ │
│  │  Theme                                         │ │
│  │  [Dark] [Light] [System]                      │ │
│  │                                                │ │
│  └────────────────────────────────────────────────┘ │
│                                                      │
│  [Save Changes]                                      │
│                                                      │
└──────────────────────────────────────────────────────┘
```

**Configurable Mastery Threshold:**
- User chooses when a topic is "complete" (50%, 70%, 80%, 90%, 100%)
- Default: 80% (balanced rigor)
- Affects:
  - When Feynman technique is triggered
  - When topic moves to "Completed" status
  - Review scheduling intensity

### 6. Review Session View

**Purpose:** Spaced repetition review interface

**Layout:**
```
┌──────────────────────────────────────────────────────┐
│  Review Session                                      │
│  Progress: 2/5 ████░░                                │
│                                                      │
│  Topic: Rust - Ownership Basics                      │
│                                                      │
│  ❓ What happens when ownership is transferred?      │
│                                                      │
│  [Your answer...]                                    │
│                                                      │
│  [Submit]                                            │
│                                                      │
│  Reviewing: Last studied 7 days ago                  │
│                                                      │
└──────────────────────────────────────────────────────┘
```

**Post-Review Summary:**
```
┌──────────────────────────────────────────────────────┐
│  Review Complete! 🎉                                 │
│                                                      │
│  Score: 4/5 (80%)                                    │
│                                                      │
│  ✅ Ownership Basics → Next review in 14 days        │
│  ✅ JavaScript Closures → Next review in 14 days     │
│  ⚠️  SQL Indexes → Re-learn needed (review in 1 day) │
│                                                      │
│  Keep up the great work, apprentice!                 │
│                                                      │
│  [Back to Dashboard]                                 │
└──────────────────────────────────────────────────────┘
```

## Mobile Responsive Design

**Adaptations for Mobile:**

- **Single column layout:** No sidebar, use bottom sheet
- **Topic switcher:** Bottom nav with current topic
- **Swipe gestures:**
  - Swipe up → Topic list
  - Swipe down → Command palette
  - Swipe right → Progress view
- **Simplified progress:** Circular progress instead of bars
- **Touch-friendly:** Larger tap targets for commands

## Accessibility

**Requirements:**

- **Keyboard Navigation:** Full app navigable via keyboard
- **Screen Reader:** All components properly labeled
- **Color Contrast:** WCAG AA compliance
- **Focus Indicators:** Clear focus states
- **Alternative Text:** Images and icons have alt text
- **Reduced Motion:** Respect `prefers-reduced-motion`

## Visual Design

**Color Palette:**

```
Primary: Sensei Red (#E53935) - For active elements, progress
Secondary: Wisdom Gold (#FBC02D) - For achievements, highlights
Background: Dark (#1A1A1A) or Light (#F5F5F5) - Theme toggle
Surface: Card (#2A2A2A or #FFFFFF)
Text: High contrast (#FFFFFF or #1A1A1A)
Muted: Low contrast (#888888)
Success: Green (#4CAF50)
Warning: Orange (#FF9800)
Error: Red (#F44336)
```

**Typography:**

```
Headings: Inter Bold
Body: Inter Regular
Code: Fira Code
Sensei Voice: Inter Semi-Bold (slightly playful)
```

**Animations:**

- **Progress bars:** Smooth fill animation
- **Mastery level up:** Confetti + bounce
- **Concept unlock:** Fade in + slide up
- **Message appearance:** Fade in (fast, 150ms)
- **All animations:** Respect `prefers-reduced-motion`

## Session Preferences

**Learning Mode: Deep Dives**

Sensie is designed for focused, deep learning sessions rather than quick topic switching.

**Approach:**
- Stay on one topic until concepts are well understood
- No arbitrary time limits - learn until mastery
- Subtopics flow naturally into each other
- User decides when to take breaks (`/break` command)

**Session Flow:**
```
Start topic → Learn subtopic 1 → Questions until mastery →
Auto-unlock subtopic 2 → Continue or /break →
Resume exactly where you left off
```

**Why Deep Dives:**
- Context switching breaks learning flow
- True understanding requires sustained focus
- Mastery over completion - quality over quantity

## First-Time Experience

**When user opens Sensie with no topics, Sensie initiates the conversation:**

```
┌──────────────────────────────────────────────────────┐
│              🎴                                       │
│                                                      │
│  Sensie:                                             │
│  "Welcome, young apprentice! I am Sensie, your      │
│  personal learning sensei.                           │
│                                                      │
│  I can help you master anything - from Rust and     │
│  system design to giving feedback and leading       │
│  teams.                                              │
│                                                      │
│  What would you like to learn?"                      │
│                                                      │
│  ┌────────────────────────────────────────────────┐ │
│  │ Type what you want to learn...                 │ │
│  └────────────────────────────────────────────────┘ │
│                                                      │
└──────────────────────────────────────────────────────┘
```

**User responds, Sensie creates the learning path:**
```
User: "I want to learn how to give better feedback to my teammates"

Sensie: "An excellent choice, apprentice! Giving feedback is an art
that separates good teammates from great ones.

I've mapped out your training journey:
○ 1. Understanding Feedback Types
○ 2. Timing and Setting
○ 3. The SBI Model (Situation-Behavior-Impact)
○ 4. Receiving Feedback Gracefully
○ 5. Difficult Conversations

Estimated time: ~2-3 hours

💬 Any specific goal? (optional)
┌────────────────────────────────────────────────┐
│ e.g., "Preparing for performance review season"│
└────────────────────────────────────────────────┘

            [Begin Training →]"
```

## Empty States

**No Active Topic (Returning User):**
```
┌──────────────────────────────────────────────────────┐
│              🎴                                       │
│                                                      │
│  Sensie:                                             │
│  "Welcome back, apprentice! Ready for more           │
│  training?                                           │
│                                                      │
│  What would you like to learn today?"                │
│                                                      │
│  ┌────────────────────────────────────────────────┐ │
│  │ Type what you want to learn...                 │ │
│  └────────────────────────────────────────────────┘ │
│                                                      │
│  Or continue where you left off:                     │
│  [Resume: Rust Ownership (75%)]                      │
│                                                      │
└──────────────────────────────────────────────────────┘
```

**No Reviews Due:**
```
┌──────────────────────────────────────────────────────┐
│  📅 No reviews due!                                   │
│                                                      │
│  Your memory remains sharp, apprentice.              │
│  Rest well. I shall summon you when review time     │
│  comes.                                              │
│                                                      │
│  Next review: Tomorrow                               │
│                                                      │
└──────────────────────────────────────────────────────┘
```

## Visitor Mode UI

**Philosophy:** Complete authenticity. Visitors see real usage, not marketing material.

**What Visitors See:**
- All topics, subtopics, mastery percentages
- Real questions and answers (unless marked private)
- XP, streaks, badges
- Full conversation history
- Read-only access (cannot submit answers)

**Privacy Control (Owner Only):**

Owners can mark specific answers as private:

```
┌──────────────────────────────────────────────────────────────┐
│ You:                                                         │
│ [Answer text about company-specific context...]              │
│                                                    [•••]     │ ← More menu
└──────────────────────────────────────────────────────────────┘

More Menu:
┌─────────────────────────┐
│ 🔒 Mark as Private      │ ← Hides from visitors
│ 📋 Copy Answer          │
│ 🔗 Share Link           │
└─────────────────────────┘
```

**Private Answer Indicator (Owner View):**
```
┌──────────────────────────────────────────────────────────────┐
│ You:                                              🔒 Private │
│ [Answer text about company-specific context...]              │
└──────────────────────────────────────────────────────────────┘
```

Visitors will not see answers marked as private.

## Error States

**Design Principle:** Stay fully in character + provide helpful debug info.

**Retry Strategy:** All LLM errors are retried 2-3 times silently before showing user-facing error.

Sensie never breaks character, but includes technical details for debugging.

**Network Error:**
```
┌──────────────────────────────────────────────────────┐
│  ⚠️  Connection Lost                                 │
│                                                      │
│  The spirits are displeased, apprentice! My          │
│  connection to the wisdom realm has been severed.    │
│                                                      │
│  Your progress is saved. Try again when the          │
│  connection returns.                                 │
│                                                      │
│  [Retry]                                             │
│                                                      │
│  ┌────────────────────────────────────────────────┐ │
│  │ 🔧 Debug: NetworkError - Failed to fetch       │ │
│  │    Status: offline | Last success: 2m ago     │ │
│  └────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────┘
```

**API Error:**
```
┌──────────────────────────────────────────────────────┐
│  ⚠️  The Wisdom Spirits Are Confused                 │
│                                                      │
│  Hmm, something went wrong on my end, apprentice.    │
│  Even senseis make mistakes! Let me try again...     │
│                                                      │
│  [Retry] [Report Issue]                              │
│                                                      │
│  ┌────────────────────────────────────────────────┐ │
│  │ 🔧 Debug: API Error 500                        │ │
│  │    Endpoint: /api/chat                         │ │
│  │    Request ID: abc-123-xyz                     │ │
│  │    Message: Internal server error              │ │
│  └────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────┘
```

**Rate Limit:**
```
┌──────────────────────────────────────────────────────┐
│  ⏸️  Take a Break, Young One                         │
│                                                      │
│  Even the greatest masters need rest! You've         │
│  trained hard today. The wisdom spirits need a       │
│  moment to recharge.                                 │
│                                                      │
│  Return in 15 minutes to continue your journey.      │
│  Learning is a marathon, not a sprint!               │
│                                                      │
│  ┌────────────────────────────────────────────────┐ │
│  │ 🔧 Debug: Rate limit exceeded                  │ │
│  │    Provider: Anthropic | Retry after: 15m     │ │
│  │    Requests today: 150/150                     │ │
│  └────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────┘
```

**LLM Provider Error:**
```
┌──────────────────────────────────────────────────────┐
│  ⚠️  The Oracle Is Sleeping                          │
│                                                      │
│  My connection to the AI wisdom source is            │
│  temporarily disrupted. This happens sometimes!      │
│                                                      │
│  Try again in a moment, or switch providers in       │
│  Settings if this persists.                          │
│                                                      │
│  [Retry] [Change Provider]                           │
│                                                      │
│  ┌────────────────────────────────────────────────┐ │
│  │ 🔧 Debug: Provider unavailable                 │ │
│  │    Provider: Anthropic | Model: claude-sonnet │ │
│  │    Error: ServiceUnavailableError              │ │
│  │    Suggestion: Try OpenAI as backup           │ │
│  └────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────┘
```

---

**Implementation Checklist:**
- [ ] Build responsive layout (mobile-first)
- [ ] Implement command palette
- [ ] Create progress visualizations
- [ ] Design message components
- [ ] Build topic sidebar
- [ ] Implement keyboard shortcuts
- [ ] Add animations (with reduced-motion support)
- [ ] Test accessibility (WCAG AA)
- [ ] Mobile gestures
- [ ] Empty and error states

**Last Updated:** 2026-01-05
