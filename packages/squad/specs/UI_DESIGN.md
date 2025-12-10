# Squad - UI Design Specification

**Version:** 0.1.0  
**Last Updated:** Dec 10, 2025

---

## Design System

Squad inherits the portfolio design system exactly. This ensures visual consistency across visheshbaghel.com and squad.visheshbaghel.com.

### Colors

```css
/* Light Theme */
--color-background: #FAF8F6;
--color-foreground: #000000;
--color-primary: #000000;
--color-primary-foreground: #FAF8F6;
--color-secondary: #E0E0E0;
--color-secondary-foreground: #000000;
--color-muted: #E0E0E0;
--color-muted-foreground: #666666;
--color-accent: #FF0000;
--color-accent-foreground: #FAF8F6;
--color-border: #E0E0E0;

/* Dark Theme */
--color-background: #0f0f0f;
--color-foreground: #faf8f6;
--color-primary: #faf8f6;
--color-primary-foreground: #0f0f0f;
--color-secondary: #1f1f1f;
--color-muted: #1a1a1a;
--color-muted-foreground: #a3a3a3;
--color-accent: #ff0000;
--color-border: #2a2a2a;
```

### Typography

```css
/* Font Family */
--font-primary: 'IBM Plex Mono', monospace;

/* Sizes */
h1: 32px, bold, line-height 1.2
h2: 24px, bold, line-height 1.3
h3: 18px, bold, line-height 1.4
body: 16px, regular, line-height 1.6
small: 14px, regular, line-height 1.5
```

### Spacing

```css
/* Layout */
max-width: 800px (container)
padding: 60px 40px (desktop)
padding: 40px 24px (mobile)

/* Sections */
section-gap: 80px
paragraph-gap: 24px
list-item-gap: 12px
```

### Border Radius

```css
/* All elements have sharp edges */
--radius: 0px;
```

### Components

All UI components come from shadcn/ui, customized to match the design system:
- Buttons: sharp edges, monospace font
- Cards: border only, no shadow
- Links: accent red, underlined

---

## Page Layouts

### Home Page (`/`)

The landing page showcases all available agents.

```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  squad                                    [theme]   │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │                                                     │   │
│  │  hyper personalised agents i built, deploy them    │   │
│  │  for yourself and let them do your boring work     │   │
│  │                                                     │   │
│  │  these are tools i use daily. open source, but     │   │
│  │  you can deploy your own instance in 2 minutes.    │   │
│  │                                                     │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  agents                                             │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │                                                     │   │
│  │  jack                                               │   │
│  │  "because writer's block is for normies"           │   │
│  │                                                     │   │
│  │  x content agent that learns your voice.           │   │
│  │  ~$15/month to run.                                │   │
│  │                                                     │   │
│  │                              [learn more →]        │   │
│  │                                                     │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │                                                     │   │
│  │  sensie                              coming soon   │   │
│  │  "your personal teacher in the age of ai"          │   │
│  │                                                     │   │
│  │  tracks what you learn, keeps you sharp.           │   │
│  │                                                     │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  why this exists                                   │   │
│  │                                                     │   │
│  │  i build these agents for myself. they help me     │   │
│  │  ship faster and stay consistent. the code is      │   │
│  │  open source — you can read it, fork it, or        │   │
│  │  deploy your own instance here.                    │   │
│  │                                                     │   │
│  │  → portfolio    → github    → book a call          │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  © 2025 vishesh baghel                             │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Agent Detail Page (`/jack`)

Individual page for each agent with full details and deploy button.

```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  ← squad                                  [theme]   │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │                                                     │   │
│  │  jack                                               │   │
│  │  "because writer's block is for normies"           │   │
│  │                                                     │   │
│  │  x content agent that learns your voice. named     │   │
│  │  after jack dorsey. tracks creators you follow,    │   │
│  │  generates ideas from trending topics, and         │   │
│  │  improves from 50% to 80% relevance in 4 weeks.   │   │
│  │                                                     │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  what it does                                       │   │
│  │                                                     │   │
│  │  • creator tracking                                 │   │
│  │    monitors 50-100 x creators you specify and      │   │
│  │    extracts trending topics                        │   │
│  │                                                     │   │
│  │  • idea generation                                  │   │
│  │    generates 5 content ideas daily based on        │   │
│  │    trends and your projects                        │   │
│  │                                                     │   │
│  │  • voice learning                                   │   │
│  │    learns from posts you mark as "good" and        │   │
│  │    adapts to your style                            │   │
│  │                                                     │   │
│  │  • outline creation                                 │   │
│  │    creates structured outlines so you write        │   │
│  │    the actual content                              │   │
│  │                                                     │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  what you need                                      │   │
│  │                                                     │   │
│  │  vercel account ................ free              │   │
│  │  neon postgres ................. free tier         │   │
│  │  ai gateway (gpt-4) ............ ~$10/month       │   │
│  │  apify (x data) ................ ~$5/month        │   │
│  │                                                     │   │
│  │  estimated total: ~$15/month                       │   │
│  │                                                     │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  what we'll set up for you                          │   │
│  │                                                     │   │
│  │  ✓ fork the repo to your github                    │   │
│  │  ✓ create vercel project                           │   │
│  │  ✓ provision neon postgres database               │   │
│  │  ✓ configure ai gateway                            │   │
│  │  ✓ set all environment variables                   │   │
│  │  ✓ deploy to production                            │   │
│  │                                                     │   │
│  │  you'll need to add your apify api key after.      │   │
│  │                                                     │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │                                                     │   │
│  │  ┌───────────────────────────────────────────────┐ │   │
│  │  │              deploy your own                  │ │   │
│  │  └───────────────────────────────────────────────┘ │   │
│  │                                                     │   │
│  │  takes ~2 minutes. you'll own the code and data.  │   │
│  │                                                     │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  → see it live (demo)    → read the spec          │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Deploy Flow Page (`/deploy/[agentId]`)

Multi-step deployment flow with progress indicators.

```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  deploying jack                           [cancel]  │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │                                                     │   │
│  │  step 1 of 4                                        │   │
│  │                                                     │   │
│  │  ━━━━━━━━━━━━━━━━░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░  │   │
│  │  25%                                                │   │
│  │                                                     │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │                                                     │   │
│  │  ✓ connect vercel                         done     │   │
│  │  → connect github                      in progress │   │
│  │  ○ provision services                   pending    │   │
│  │  ○ deploy                               pending    │   │
│  │                                                     │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │                                                     │   │
│  │  connect your github account                        │   │
│  │                                                     │   │
│  │  we'll fork the jack repository to your account    │   │
│  │  so you own the code.                              │   │
│  │                                                     │   │
│  │  ┌───────────────────────────────────────────────┐ │   │
│  │  │           connect github                      │ │   │
│  │  └───────────────────────────────────────────────┘ │   │
│  │                                                     │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Deploy Success Page

```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  squad                                    [theme]   │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │                                                     │   │
│  │  jack is live                                       │   │
│  │                                                     │   │
│  │  your agent is deployed and ready to use.          │   │
│  │                                                     │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │                                                     │   │
│  │  your deployment                                    │   │
│  │  https://jack-xyz123.vercel.app                    │   │
│  │                                                     │   │
│  │  ┌───────────────────────────────────────────────┐ │   │
│  │  │              open your agent                  │ │   │
│  │  └───────────────────────────────────────────────┘ │   │
│  │                                                     │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │                                                     │   │
│  │  what was set up                                    │   │
│  │                                                     │   │
│  │  ✓ github repo                                      │   │
│  │    github.com/yourname/jack                        │   │
│  │                                                     │   │
│  │  ✓ vercel project                                   │   │
│  │    vercel.com/yourname/jack                        │   │
│  │                                                     │   │
│  │  ✓ neon postgres                                    │   │
│  │    connected via vercel integration                │   │
│  │                                                     │   │
│  │  ✓ ai gateway                                       │   │
│  │    configured for gpt-4                            │   │
│  │                                                     │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │                                                     │   │
│  │  next steps                                         │   │
│  │                                                     │   │
│  │  1. add your apify api key in vercel dashboard     │   │
│  │     → go to settings > environment variables       │   │
│  │     → add APIFY_API_KEY                            │   │
│  │                                                     │   │
│  │  2. set your auth passphrase                        │   │
│  │     your auto-generated passphrase: xxxxxxxx       │   │
│  │     (save this somewhere safe)                     │   │
│  │                                                     │   │
│  │  3. start using jack                                │   │
│  │     open your deployment and log in                │   │
│  │                                                     │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  → back to squad    → deploy another agent         │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## Components

### Header

Simple header with back link and theme toggle.

```tsx
// Desktop
┌──────────────────────────────────────────────────────────┐
│  squad                                         [theme]   │
└──────────────────────────────────────────────────────────┘

// On agent pages
┌──────────────────────────────────────────────────────────┐
│  ← squad                                       [theme]   │
└──────────────────────────────────────────────────────────┘
```

### Agent Card

Used on the home page to show each agent.

```tsx
interface AgentCardProps {
  name: string;
  tagline: string;
  description: string;
  cost: string;
  status: 'available' | 'coming-soon';
  href: string;
}

// Visual
┌──────────────────────────────────────────────────────────┐
│                                                          │
│  jack                                                    │
│  "because writer's block is for normies"                │
│                                                          │
│  x content agent that learns your voice.                │
│  ~$15/month to run.                                     │
│                                                          │
│                                       [learn more →]    │
│                                                          │
└──────────────────────────────────────────────────────────┘
```

### Feature List

Shows agent features with title and description.

```tsx
interface FeatureListProps {
  features: {
    title: string;
    description: string;
  }[];
}

// Visual
┌──────────────────────────────────────────────────────────┐
│  • creator tracking                                      │
│    monitors 50-100 x creators you specify and           │
│    extracts trending topics                             │
│                                                          │
│  • idea generation                                       │
│    generates 5 content ideas daily based on             │
│    trends and your projects                             │
└──────────────────────────────────────────────────────────┘
```

### Requirements Table

Shows costs for running an agent.

```tsx
interface RequirementsTableProps {
  requirements: {
    name: string;
    cost: string;
    description: string;
  }[];
  total: string;
}

// Visual
┌──────────────────────────────────────────────────────────┐
│  vercel account ...................... free             │
│  neon postgres ....................... free tier        │
│  ai gateway (gpt-4) .................. ~$10/month      │
│  apify (x data) ...................... ~$5/month       │
│                                                          │
│  estimated total: ~$15/month                            │
└──────────────────────────────────────────────────────────┘
```

### Deploy Progress

Shows current step in deployment flow.

```tsx
interface DeployProgressProps {
  steps: {
    label: string;
    status: 'done' | 'in-progress' | 'pending';
  }[];
  currentStep: number;
  totalSteps: number;
}

// Visual
┌──────────────────────────────────────────────────────────┐
│  step 2 of 4                                             │
│                                                          │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━░░░░░░░░░░░░░░░░░░░░░░░░░░░░  │
│  50%                                                     │
│                                                          │
│  ✓ connect vercel                              done     │
│  → connect github                         in progress   │
│  ○ provision services                        pending    │
│  ○ deploy                                    pending    │
└──────────────────────────────────────────────────────────┘
```

### Deploy Button

Primary CTA for deployment.

```tsx
interface DeployButtonProps {
  agentId: string;
  disabled?: boolean;
}

// Visual (default state)
┌──────────────────────────────────────────────────────────┐
│                  deploy your own                         │
└──────────────────────────────────────────────────────────┘

// Visual (hover state) - slight background change
┌──────────────────────────────────────────────────────────┐
│                  deploy your own                         │
└──────────────────────────────────────────────────────────┘
```

### Coming Soon Badge

For agents not yet available.

```tsx
// Visual
┌─────────────────┐
│  coming soon    │
└─────────────────┘
```

---

## Responsive Design

### Breakpoints

```css
/* Mobile first */
sm: 640px
md: 768px
lg: 1024px
```

### Mobile Adaptations

- container padding: 24px (vs 40px desktop)
- font sizes slightly smaller (text-sm vs text-base)
- agent cards stack vertically
- header remains fixed

---

## Accessibility

- all interactive elements have focus states
- sufficient color contrast (4.5:1 minimum)
- keyboard navigation support
- aria labels on icon-only buttons
- semantic HTML structure
- skip to main content link

---

## Animation

Minimal animations to maintain the portfolio's clean aesthetic:

- page transitions: none (instant navigation)
- button hover: subtle background color change
- progress bar: smooth width transition
- OAuth popup: system default
- loading states: simple text or spinner

```css
/* Transitions */
transition-colors: 150ms ease
transition-all: 200ms ease-out
```
