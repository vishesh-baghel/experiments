# Squad Design Specification: Linear-Style Dark Minimal

## Overview

This document defines the design system for Squad's Linear-style dark minimal aesthetic. Squad is a personal project portfolio that lets users try AI agents that the creator uses daily in their workflows.

---

## Brand Voice & Messaging

### Core Message

Squad is NOT a generic "deploy AI agents" platform. It's a personal showcase of agents the creator actually uses daily. The messaging should reflect:

1. **Personal** - "My AI agents" not "Deploy AI agents"
2. **Authentic** - These are real tools used in real workflows
3. **Invitational** - "Try them yourself" not "Sign up now"
4. **Transparent** - Open source, you own everything

### Key Phrases

**DO use:**
- "My AI agents. Try them yourself."
- "Agents I use daily in my workflows"
- "Deploy your own instance"
- "See how they work for you"
- "Why I'm sharing these"

**DON'T use:**
- "Deploy AI agents in 2 minutes" (too generic/marketing-y)
- "Pre-built, production-ready agents" (sounds like a SaaS product)
- "One-click deployment" (focus on the personal aspect, not the tech)

### Tone

- First person ("I built", "I use", "my workflows")
- Conversational but professional
- Show, don't tell (let them try the agents)
- Humble confidence (proud of the work, not boastful)

---

## Design Philosophy

### Core Principles

1. **Dark-first** - Optimized for developer environments, reduces eye strain
2. **Content hierarchy** - Typography does the heavy lifting, not decoration
3. **Intentional color** - Monochrome base with single accent color
4. **Subtle depth** - Glassmorphism for layering, not decoration
5. **Performance** - Visual effects achievable with pure CSS
6. **Sharp edges** - 0px border-radius for consistency with portfolio

### Personality

- Professional but not corporate
- Technical but approachable
- Minimal but not cold
- Personal and authentic
- Fast and keyboard-friendly

---

## Color System

### Dark Theme (Primary)

```css
/* Background layers */
--background:        #0a0a0a;    /* Base background */
--background-subtle: #111111;    /* Elevated surfaces */
--background-muted:  #171717;    /* Cards, hover states */

/* Foreground */
--foreground:        #fafafa;    /* Primary text */
--foreground-muted:  #a1a1a1;    /* Secondary text */
--foreground-subtle: #737373;    /* Tertiary text, placeholders */

/* Borders */
--border:            #262626;    /* Default borders */
--border-hover:      #404040;    /* Hover state borders */

/* Accent - Your signature red */
--accent:            #ff0000;    /* Primary accent */
--accent-muted:      #cc0000;    /* Hover state */
--accent-subtle:     rgba(255, 0, 0, 0.1);  /* Backgrounds */

/* Semantic */
--success:           #22c55e;
--warning:           #eab308;
--error:             #ef4444;

/* Glassmorphism */
--glass-background:  rgba(255, 255, 255, 0.03);
--glass-border:      rgba(255, 255, 255, 0.06);
--glass-blur:        12px;
```

### Light Theme (Secondary)

```css
--background:        #fafafa;
--background-subtle: #f5f5f5;
--background-muted:  #e5e5e5;

--foreground:        #0a0a0a;
--foreground-muted:  #525252;
--foreground-subtle: #737373;

--border:            #e5e5e5;
--border-hover:      #d4d4d4;

--accent:            #dc0000;    /* Slightly darker for contrast */
```

---

## Typography

### Font Stack

```css
/* Primary - Clean, readable */
--font-sans: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;

/* Monospace - Technical accents, code */
--font-mono: 'JetBrains Mono', 'Fira Code', 'SF Mono', monospace;
```

### Type Scale

| Name      | Size   | Weight | Line Height | Usage                    |
|-----------|--------|--------|-------------|--------------------------|
| display   | 48px   | 600    | 1.1         | Hero headlines           |
| h1        | 32px   | 600    | 1.2         | Page titles              |
| h2        | 24px   | 600    | 1.3         | Section headers          |
| h3        | 18px   | 500    | 1.4         | Card titles              |
| body      | 16px   | 400    | 1.6         | Body copy                |
| small     | 14px   | 400    | 1.5         | Secondary text, labels   |
| caption   | 12px   | 500    | 1.4         | Tags, badges, metadata   |

### Font Features

```css
body {
  font-feature-settings: 'ss01' on, 'ss02' on, 'cv01' on;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}
```

---

## Spacing System

Based on 4px grid:

```css
--space-1:  4px;
--space-2:  8px;
--space-3:  12px;
--space-4:  16px;
--space-5:  20px;
--space-6:  24px;
--space-8:  32px;
--space-10: 40px;
--space-12: 48px;
--space-16: 64px;
--space-20: 80px;
--space-24: 96px;
```

### Layout

```css
--max-width:      800px;    /* Content max width */
--max-width-wide: 1200px;   /* Wide content (comparisons) */
--container-padding: 24px;  /* Mobile */
--container-padding-md: 40px; /* Desktop */
```

---

## Components

### 1. Agent Card

```
┌─────────────────────────────────────────────────────┐
│  ┌─────────┐                                        │
│  │  Icon   │   Agent Name                           │
│  │  32x32  │   Short tagline here (tight spacing)   │
│  └─────────┘                                        │
│                                                     │
│  Description text that explains what this agent     │
│  does in 1-2 sentences maximum.                     │
│                                                     │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐          │
│  │ Feature  │  │ Feature  │  │ Feature  │          │
│  └──────────┘  └──────────┘  └──────────┘          │
│                                                     │
│  ~$11/mo                          [Learn more →]   │
└─────────────────────────────────────────────────────┘
```

**Specifications:**
- Background: `var(--glass-background)`
- Border: 1px `var(--glass-border)`
- Border radius: 0px (sharp edges for portfolio consistency)
- Padding: 24px
- Hover: Border becomes `var(--border-hover)`, subtle translateY(-2px)
- Backdrop filter: blur(12px)
- Name/tagline spacing: Use `leading-tight`, no margin between them

### 2. Button Variants

**Primary (Accent)**
```css
.btn-primary {
  background: var(--accent);
  color: white;
  padding: 12px 20px;
  border-radius: 8px;
  font-weight: 500;
  transition: background 0.15s ease;
}
.btn-primary:hover {
  background: var(--accent-muted);
}
```

**Secondary (Ghost)**
```css
.btn-secondary {
  background: transparent;
  color: var(--foreground);
  border: 1px solid var(--border);
  padding: 12px 20px;
  border-radius: 8px;
}
.btn-secondary:hover {
  background: var(--background-muted);
  border-color: var(--border-hover);
}
```

**Text Link**
```css
.btn-link {
  color: var(--foreground-muted);
  text-decoration: none;
  transition: color 0.15s ease;
}
.btn-link:hover {
  color: var(--foreground);
}
```

### 3. Badge/Tag

```css
.badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 10px;
  background: var(--background-muted);
  border: 1px solid var(--border);
  border-radius: 6px;
  font-size: 12px;
  font-weight: 500;
  color: var(--foreground-muted);
}

.badge-accent {
  background: var(--accent-subtle);
  border-color: var(--accent);
  color: var(--accent);
}
```

### 4. Section Divider

Subtle gradient line:
```css
.divider {
  height: 1px;
  background: linear-gradient(
    90deg,
    transparent,
    var(--border) 20%,
    var(--border) 80%,
    transparent
  );
}
```

---

## Layout Structure

### Homepage

```
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│  squad                                 [Theme Toggle] [GitHub]  │
│                                                                 │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│                                                                 │
│              My AI agents.                                      │
│              Try them yourself.                                 │
│                                                                 │
│              These are agents I use daily in my workflows.      │
│              Deploy your own instance and see how they work     │
│              for you.                                           │
│                                                                 │
│              [Browse agents ↓]                                  │
│                                                                 │
│                                                                 │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Available                                                      │
│                                                                 │
│  ┌─────────────────────────┐  ┌─────────────────────────┐      │
│  │                         │  │                         │      │
│  │      Jack Agent         │  │     Sensie Agent        │      │
│  │                         │  │                         │      │
│  └─────────────────────────┘  └─────────────────────────┘      │
│                                                                 │
│                                                                 │
│  Coming Soon                                                    │
│                                                                 │
│  ┌─────────────────────────┐                                    │
│  │                         │                                    │
│  │      Gary Agent         │                                    │
│  │                         │                                    │
│  └─────────────────────────┘                                    │
│                                                                 │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Why I'm sharing these                                          │
│                                                                 │
│  I built these agents for my own workflows...                   │
│  Instead of just talking about what I build...                  │
│  Everything is open source...                                   │
│                                                                 │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Portfolio · GitHub · Book a call                               │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Agent Detail Page

```
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│  [← Back to agents]                    [Theme] [GitHub]         │
│                                                                 │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌────┐                                                         │
│  │Icon│  Jack                                                   │
│  └────┘  Your AI content strategist for X/Twitter              │
│                                                                 │
│          ~$11/mo    [Try demo →]    [Deploy your own]          │
│                                                                 │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  What it does                                                   │
│  ─────────────                                                  │
│  Feature grid or list...                                        │
│                                                                 │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Requirements                                                   │
│  ────────────                                                   │
│  Service/cost table...                                          │
│                                                                 │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  [Deploy your own →]                                            │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## Micro-interactions

### Hover States

```css
/* Cards */
.card {
  transition: transform 0.2s ease, border-color 0.2s ease;
}
.card:hover {
  transform: translateY(-2px);
  border-color: var(--border-hover);
}

/* Links */
.link {
  transition: color 0.15s ease;
}

/* Buttons */
.button {
  transition: background 0.15s ease, transform 0.1s ease;
}
.button:active {
  transform: scale(0.98);
}
```

### Focus States

```css
*:focus-visible {
  outline: 2px solid var(--accent);
  outline-offset: 2px;
}
```

### Loading States

Subtle pulse animation for skeleton loading:
```css
@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}
.skeleton {
  background: var(--background-muted);
  animation: pulse 2s ease-in-out infinite;
}
```

---

## Glassmorphism Usage

Apply sparingly for visual hierarchy:

```css
.glass {
  background: rgba(255, 255, 255, 0.03);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.06);
}
```

**Where to use:**
- Agent cards
- Modal overlays
- Floating navigation (if needed)

**Where NOT to use:**
- Page backgrounds
- Every element (overuse kills the effect)

---

## Responsive Breakpoints

```css
/* Mobile first */
--breakpoint-sm:  640px;
--breakpoint-md:  768px;
--breakpoint-lg:  1024px;
--breakpoint-xl:  1280px;
```

### Mobile Adaptations

- Reduce hero text size (48px → 32px)
- Stack agent cards vertically
- Reduce padding (24px → 16px)
- Full-width buttons
- Hamburger menu if needed (prefer no navigation)

---

## Accessibility

### Color Contrast

All text combinations must meet WCAG 2.1 AA:
- `--foreground` on `--background`: 15.8:1 ✓
- `--foreground-muted` on `--background`: 7.2:1 ✓
- `--accent` on `--background`: 5.1:1 ✓

### Motion

```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

### Keyboard Navigation

- All interactive elements must be focusable
- Logical tab order
- Skip links for main content
- Focus visible on all elements

---

## Implementation Checklist

- [ ] Update CSS variables in globals.css
- [ ] Add Inter and JetBrains Mono fonts
- [ ] Create glass card component
- [ ] Update button variants
- [ ] Build new homepage layout
- [ ] Build new agent detail layout
- [ ] Add micro-interactions
- [ ] Test dark/light mode
- [ ] Verify accessibility
- [ ] Test responsive behavior

---

## File Structure

```
src/
├── app/
│   ├── prototype/           # New design prototype
│   │   ├── page.tsx         # Prototype homepage
│   │   └── [agentId]/
│   │       └── page.tsx     # Prototype agent detail
│   └── globals.css          # Updated with new design system
├── components/
│   └── prototype/           # Prototype components
│       ├── agent-card.tsx
│       ├── header.tsx
│       ├── footer.tsx
│       └── button.tsx
```

---

*Design spec version 1.0 - January 2026*
