# Memory - Design System

> **Note:** This package uses the shared Zed-inspired design system defined in [`/docs/DESIGN_GUIDELINES.md`](/docs/DESIGN_GUIDELINES.md). The guidelines below are Memory-specific extensions.

Inspired by [zed.dev](https://zed.dev) - minimal, crisp, and functional.

## Typography

### Font Stack

```css
:root {
  /* Headings - Serif for editorial feel */
  --font-heading: 'Lora', Georgia, 'Times New Roman', serif;

  /* Body - Clean sans-serif */
  --font-body: 'IBM Plex Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif;

  /* Monospace - For code and paths */
  --font-mono: 'Lilex', 'IBM Plex Mono', 'SF Mono', 'Fira Code', Consolas, monospace;
}
```

### Font Installation

```bash
# Google Fonts (Lora)
# Add to layout.tsx or global CSS
@import url('https://fonts.googleapis.com/css2?family=Lora:wght@400;500;600;700&display=swap');

# IBM Plex Sans (body)
@import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@400;500;600&display=swap');

# IBM Plex Mono (code)
@import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500&display=swap');
```

### Type Scale

| Element | Font | Size | Weight | Line Height |
|---------|------|------|--------|-------------|
| h1 | Lora | 2.5rem (40px) | 600 | 1.2 |
| h2 | Lora | 2rem (32px) | 600 | 1.25 |
| h3 | Lora | 1.5rem (24px) | 500 | 1.3 |
| h4 | Lora | 1.25rem (20px) | 500 | 1.4 |
| Body | IBM Plex Sans | 1rem (16px) | 400 | 1.6 |
| Small | IBM Plex Sans | 0.875rem (14px) | 400 | 1.5 |
| Caption | IBM Plex Sans | 0.8125rem (13px) | 400 | 1.4 |
| Code | IBM Plex Mono | 0.875rem (14px) | 400 | 1.5 |

---

## Color Palette

### Dark Mode (Primary)

```css
:root {
  /* Backgrounds */
  --bg-base: hsl(218, 13%, 7.5%);        /* #111318 - near-black with blue tint */
  --bg-surface: hsl(220, 13%, 10%);       /* #161921 - elevated surfaces */
  --bg-elevated: hsl(222, 13%, 13%);      /* #1c1f27 - cards, modals */
  --bg-hover: hsl(222, 46%, 11%);         /* #0f172a - hover states */

  /* Text */
  --text-primary: hsl(220, 13%, 91%);     /* #e4e6eb - main text */
  --text-secondary: hsl(220, 10%, 65%);   /* #9ca3af - muted text */
  --text-tertiary: hsl(220, 10%, 45%);    /* #6b7280 - disabled/hints */

  /* Accent */
  --accent-blue: hsl(217, 91%, 60%);      /* #3b82f6 - primary actions */
  --accent-blue-hover: hsl(217, 91%, 55%);
  --accent-blue-muted: hsl(217, 50%, 20%);

  /* Borders */
  --border-default: hsla(0, 0%, 100%, 0.1);   /* white/10 */
  --border-hover: hsla(0, 0%, 100%, 0.15);    /* white/15 */
  --border-focus: hsl(217, 91%, 60%);         /* accent blue */

  /* Semantic */
  --success: hsl(142, 71%, 45%);          /* #22c55e */
  --warning: hsl(38, 92%, 50%);           /* #f59e0b */
  --error: hsl(0, 84%, 60%);              /* #ef4444 */
}
```

### Light Mode (Secondary)

```css
:root.light {
  /* Backgrounds */
  --bg-base: hsl(40, 33%, 98%);           /* #fdfcfa - warm white */
  --bg-surface: hsl(40, 20%, 96%);        /* #f7f5f3 */
  --bg-elevated: hsl(0, 0%, 100%);        /* #ffffff */
  --bg-hover: hsl(214, 32%, 96%);         /* #f1f5f9 */

  /* Text */
  --text-primary: hsl(220, 13%, 13%);     /* #1f2128 */
  --text-secondary: hsl(220, 10%, 40%);   /* #5c6370 */
  --text-tertiary: hsl(220, 10%, 60%);    /* #8b939f */

  /* Borders */
  --border-default: hsla(220, 13%, 13%, 0.1);
  --border-hover: hsla(220, 13%, 13%, 0.15);
}
```

### Tailwind Config

```javascript
// tailwind.config.js
module.exports = {
  theme: {
    extend: {
      colors: {
        // Base backgrounds
        base: 'hsl(218, 13%, 7.5%)',
        surface: 'hsl(220, 13%, 10%)',
        elevated: 'hsl(222, 13%, 13%)',

        // Text
        'text-primary': 'hsl(220, 13%, 91%)',
        'text-secondary': 'hsl(220, 10%, 65%)',
        'text-tertiary': 'hsl(220, 10%, 45%)',

        // Accent
        accent: {
          DEFAULT: 'hsl(217, 91%, 60%)',
          hover: 'hsl(217, 91%, 55%)',
          muted: 'hsl(217, 50%, 20%)',
        },

        // Borders
        border: {
          DEFAULT: 'hsla(0, 0%, 100%, 0.1)',
          hover: 'hsla(0, 0%, 100%, 0.15)',
        },
      },
      fontFamily: {
        heading: ['Lora', 'Georgia', 'serif'],
        body: ['IBM Plex Sans', 'system-ui', 'sans-serif'],
        mono: ['IBM Plex Mono', 'Consolas', 'monospace'],
      },
    },
  },
}
```

---

## Components (Based on zed.dev Screenshots)

### Header Navigation

```tsx
// Main Header - sticky, dark with blur
<header className="
  sticky top-0 z-50
  h-14
  bg-base/90 backdrop-blur-md
  border-b border-white/5
  flex items-center justify-between
  px-4
">
  {/* Logo */}
  <div className="flex items-center gap-6">
    <Logo className="w-8 h-8" />

    {/* Nav Items */}
    <nav className="flex items-center gap-1">
      <NavItem label="Documents" hasDropdown />
      <NavItem label="Search" />
      <NavItem label="Tags" />
      <NavItem label="Settings" />
    </nav>
  </div>

  {/* Right Side */}
  <div className="flex items-center gap-3">
    {/* Search with Keyboard Shortcut */}
    <button className="
      flex items-center gap-2
      px-3 py-1.5
      text-text-tertiary text-sm
      hover:text-text-secondary
    ">
      <SearchIcon className="w-4 h-4" />
      <kbd className="font-mono text-xs text-text-tertiary">⌘K</kbd>
    </button>

    {/* Primary Action Button */}
    <button className="
      bg-accent text-white
      px-4 py-1.5 rounded-sm
      text-sm font-medium
      flex items-center gap-2
      hover:bg-accent-hover
    ">
      New
      <kbd className="
        bg-white/20 px-1.5 py-0.5 rounded-sm
        text-xs font-mono
      ">N</kbd>
    </button>
  </div>
</header>
```

### Dropdown Menu (from Image 1)

```tsx
// Dropdown with two-column layout and colored icons
<div className="
  absolute top-full left-0 mt-1
  min-w-[500px]
  bg-elevated
  border border-white/10
  rounded-md
  shadow-xl shadow-black/50
  p-2
">
  {/* Decorative corner dots */}
  <div className="absolute -top-1 -left-1 w-2 h-2 rotate-45 bg-elevated border-l border-t border-white/10" />

  <div className="grid grid-cols-2 gap-6 p-4">
    {/* Column 1 */}
    <div>
      <h3 className="
        text-[10px] font-medium uppercase tracking-wider
        text-text-tertiary mb-3
      ">
        Documents
      </h3>

      <div className="space-y-1">
        <DropdownItem
          icon={<FolderIcon className="text-blue-400" />}
          title="All Documents"
          description="Browse your knowledge base"
        />
        <DropdownItem
          icon={<ClockIcon className="text-amber-400" />}
          title="Recent"
          description="Recently viewed and edited"
          showArrow
        />
      </div>
    </div>

    {/* Column 2 */}
    <div>
      <h3 className="text-[10px] font-medium uppercase tracking-wider text-text-tertiary mb-3">
        Quick Actions
      </h3>

      <div className="space-y-1">
        <DropdownItem
          icon={<PlusIcon className="text-green-400" />}
          title="New Document"
          description="Create a new markdown file"
        />
        <DropdownItem
          icon={<SearchIcon className="text-purple-400" />}
          title="Search"
          description="Full-text search across all files"
        />
      </div>
    </div>
  </div>

  {/* Bottom Links */}
  <div className="border-t border-white/5 mt-2 pt-2 px-4">
    <a className="block py-2 text-sm text-text-primary hover:text-accent">
      View All Documents
    </a>
    <p className="text-xs text-text-tertiary">156 documents stored</p>
  </div>
</div>

// Dropdown Item Component
function DropdownItem({ icon, title, description, showArrow }) {
  return (
    <a className="
      group flex items-start gap-3
      px-3 py-2.5 rounded-md
      hover:bg-surface
      transition-colors duration-150
    ">
      <span className="mt-0.5">{icon}</span>
      <div className="flex-1">
        <div className="flex items-center gap-2">
          <span className="text-sm text-text-primary font-medium">
            {title}
          </span>
          {showArrow && (
            <ArrowRightIcon className="
              w-3 h-3 text-text-tertiary
              opacity-0 -translate-x-1
              group-hover:opacity-100 group-hover:translate-x-0
              transition-all duration-150
            " />
          )}
        </div>
        <span className="text-xs text-text-tertiary">{description}</span>
      </div>
    </a>
  );
}
```

### Sidebar Navigation (from Image 2)

```tsx
// Docs-style sidebar with collapsible sections
<aside className="
  w-64
  bg-surface
  border-r border-white/5
  h-[calc(100vh-3.5rem)]
  overflow-y-auto
">
  <nav className="p-3">
    {/* Collapsible Section */}
    <div className="mb-4">
      <button className="
        w-full flex items-center justify-between
        px-3 py-2
        text-accent text-sm font-medium
        hover:bg-elevated rounded-md
      ">
        <span>Documents</span>
        <ChevronDownIcon className="w-4 h-4" />
      </button>

      <div className="mt-1 ml-2">
        {/* Active Item - has blue background */}
        <a className="
          flex items-center gap-2
          px-3 py-1.5 rounded-md
          bg-accent/15 text-accent
          text-sm
        ">
          Getting Started
        </a>

        {/* Regular Items */}
        <a className="
          flex items-center gap-2
          px-3 py-1.5 rounded-md
          text-text-secondary text-sm
          hover:bg-elevated hover:text-text-primary
        ">
          Installation
        </a>

        {/* Nested Items - extra indent */}
        <div className="ml-4">
          <a className="
            flex items-center gap-2
            px-3 py-1.5 rounded-md
            text-text-tertiary text-sm
            hover:bg-elevated hover:text-text-secondary
          ">
            Update
          </a>
        </div>
      </div>
    </div>

    {/* Another Section */}
    <div className="mb-4">
      <button className="
        w-full flex items-center justify-between
        px-3 py-2
        text-accent text-sm font-medium
        hover:bg-elevated rounded-md
      ">
        <span>Configuration</span>
        <ChevronDownIcon className="w-4 h-4" />
      </button>
    </div>
  </nav>
</aside>
```

### Search Bar (from Image 2)

```tsx
// Search input with icon and keyboard shortcut
<div className="
  flex items-center
  bg-surface
  border border-white/10
  rounded-md
  px-3 py-2
  w-80
  focus-within:border-accent/50
  focus-within:ring-1 focus-within:ring-accent/20
">
  <SearchIcon className="w-4 h-4 text-text-tertiary mr-2" />
  <input
    type="text"
    placeholder="Search docs..."
    className="
      flex-1 bg-transparent
      text-sm text-text-primary
      placeholder:text-text-tertiary
      focus:outline-none
    "
  />
  <kbd className="
    text-[10px] text-text-tertiary
    bg-elevated px-1.5 py-0.5 rounded
    border border-white/5
    font-mono
  ">
    /
  </kbd>
</div>
```

### Feature Cards (from Image 3)

```tsx
// Three-column feature cards
<div className="
  grid grid-cols-3 gap-6
  p-6
  bg-surface
  border border-white/5
  rounded-lg
">
  <FeatureCard
    icon={<BoltIcon className="w-5 h-5 text-green-400" />}
    title="Fast"
    description="Sub-millisecond reads with edge-replicated database"
  />
  <FeatureCard
    icon={<BrainIcon className="w-5 h-5 text-blue-400" />}
    title="Intelligent"
    description="Full-text search across all your knowledge"
  />
  <FeatureCard
    icon={<UsersIcon className="w-5 h-5 text-purple-400" />}
    title="Connected"
    description="Works with Claude, ChatGPT, and any MCP client"
  />
</div>

// Feature Card Component
function FeatureCard({ icon, title, description }) {
  return (
    <div className="flex items-start gap-3">
      <div className="mt-1">{icon}</div>
      <div>
        <h3 className="font-medium text-text-primary">{title}</h3>
        <p className="text-sm text-text-secondary mt-1">{description}</p>
      </div>
    </div>
  );
}
```

### Content Area with Right Sidebar (from Image 2)

```tsx
// Main content layout like Zed docs
<div className="flex flex-1">
  {/* Main Content */}
  <main className="flex-1 max-w-3xl px-8 py-6">
    {/* Page Title - Serif, Blue */}
    <h1 className="
      font-heading text-4xl font-semibold
      text-accent
      mb-6
    ">
      Getting Started
    </h1>

    {/* Body Content */}
    <div className="prose-memory">
      <p className="text-text-secondary leading-relaxed">
        Welcome to Memory! This is your central knowledge base...
      </p>

      <h2 className="
        font-heading text-xl font-medium
        text-text-primary
        mt-8 mb-4
      ">
        Key Features
      </h2>

      <ul className="space-y-2 text-text-secondary">
        <li>
          <a href="#" className="text-accent hover:underline">Sub-millisecond Reads</a>:
          Edge-replicated database for instant access.
        </li>
        <li>
          <a href="#" className="text-accent hover:underline">Full-text Search</a>:
          Find anything in your knowledge base.
        </li>
      </ul>
    </div>
  </main>

  {/* Right Sidebar - On This Page */}
  <aside className="
    w-48
    hidden xl:block
    sticky top-14
    h-fit
    py-6 pr-4
  ">
    <h4 className="
      text-xs font-medium uppercase tracking-wider
      text-text-tertiary
      mb-3
    ">
      On This Page
    </h4>
    <nav className="space-y-2">
      <a className="block text-sm text-text-secondary hover:text-text-primary">
        Key Features
      </a>
      <a className="block text-sm text-text-secondary hover:text-text-primary">
        Installation
      </a>
    </nav>
  </aside>
</div>
```

### Buttons

```tsx
// Primary Button
<button className="
  bg-accent text-white
  px-4 py-2 rounded-sm
  font-body font-medium text-sm
  border border-transparent
  hover:bg-accent-hover
  focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 focus:ring-offset-base
  transition-colors duration-150
">
  Create Document
</button>

// Secondary Button (Ghost)
<button className="
  bg-transparent text-text-secondary
  px-4 py-2 rounded-sm
  font-body font-medium text-sm
  border border-border
  hover:bg-elevated hover:text-text-primary hover:border-border-hover
  focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 focus:ring-offset-base
  transition-colors duration-150
">
  Cancel
</button>

// Icon Button
<button className="
  p-2 rounded-sm
  text-text-tertiary
  hover:text-text-primary hover:bg-elevated
  transition-colors duration-150
">
  <Icon className="w-4 h-4" />
</button>
```

### Cards

```tsx
// Document Card
<div className="
  bg-surface
  border border-border rounded-sm
  p-4
  hover:border-border-hover hover:bg-elevated
  transition-all duration-150
  cursor-pointer
">
  <h3 className="font-heading font-medium text-text-primary">
    Document Title
  </h3>
  <p className="text-sm text-text-secondary mt-1">
    typescript, ai, project
  </p>
  <span className="text-xs text-text-tertiary mt-2 block">
    Updated 2 hours ago
  </span>
</div>
```

### Inputs

```tsx
// Text Input
<input
  type="text"
  className="
    w-full bg-base
    border border-border rounded-sm
    px-3 py-2
    font-body text-sm text-text-primary
    placeholder:text-text-tertiary
    hover:border-border-hover
    focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent
    transition-colors duration-150
  "
  placeholder="Search documents..."
/>

// Search Input with Icon
<div className="relative">
  <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-tertiary" />
  <input
    type="search"
    className="
      w-full bg-surface
      border border-border rounded-sm
      pl-10 pr-4 py-2
      font-body text-sm text-text-primary
      placeholder:text-text-tertiary
      focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent
    "
    placeholder="Search..."
  />
</div>
```

### Tags

```tsx
// Tag Chip
<span className="
  inline-flex items-center
  bg-accent-muted text-accent
  px-2 py-0.5 rounded-sm
  font-mono text-xs
">
  typescript
</span>

// Tag with Remove (Edit Mode)
<span className="
  inline-flex items-center gap-1
  bg-elevated text-text-secondary
  px-2 py-0.5 rounded-sm
  font-mono text-xs
  border border-border
">
  typescript
  <button className="hover:text-error">
    <XIcon className="w-3 h-3" />
  </button>
</span>
```

### Sidebar

```tsx
// Folder Tree Item
<button className="
  w-full flex items-center gap-2
  px-3 py-1.5 rounded-sm
  text-sm text-text-secondary
  hover:bg-elevated hover:text-text-primary
  transition-colors duration-150
">
  <ChevronIcon className="w-3 h-3" />
  <FolderIcon className="w-4 h-4" />
  <span className="truncate">projects</span>
</button>

// Active State
<button className="
  ...
  bg-accent-muted text-accent border-l-2 border-accent
">
```

### Latency Badge

```tsx
// Latency Display (Prominent Feature)
<div className="
  inline-flex items-center gap-1.5
  px-2 py-1 rounded-sm
  bg-surface border border-border
  font-mono text-xs
">
  <BoltIcon className="w-3 h-3 text-success" />
  <span className="text-text-secondary">Fetched in</span>
  <span className="text-success font-medium">0.42ms</span>
</div>

// Color coding by latency
const getLatencyColor = (ms: number) => {
  if (ms < 1) return 'text-success';      // Green: < 1ms
  if (ms < 5) return 'text-warning';      // Yellow: 1-5ms
  return 'text-error';                     // Red: > 5ms
};
```

---

## Layout

### Page Structure

```tsx
// Dashboard Layout
<div className="min-h-screen bg-base text-text-primary">
  {/* Header */}
  <header className="
    sticky top-0 z-50
    h-14 border-b border-border
    bg-base/80 backdrop-blur-sm
    flex items-center px-4
  ">
    <Logo />
    <SearchBar />
    <Actions />
  </header>

  {/* Main Content */}
  <div className="flex">
    {/* Sidebar */}
    <aside className="
      w-64 border-r border-border
      h-[calc(100vh-3.5rem)] sticky top-14
      overflow-y-auto
      bg-surface
    ">
      <FolderTree />
      <TagCloud />
    </aside>

    {/* Content Area */}
    <main className="flex-1 p-6">
      <Content />
    </main>
  </div>
</div>
```

### Spacing Scale

Use Tailwind's default scale, emphasizing these values:

| Name | Value | Usage |
|------|-------|-------|
| 1 | 4px | Tight gaps, icon spacing |
| 2 | 8px | Component internal spacing |
| 3 | 12px | Small gaps |
| 4 | 16px | Standard gaps |
| 6 | 24px | Section spacing |
| 8 | 32px | Large section gaps |

### Border Radius

Keep it minimal - Zed uses very subtle rounding:

```css
--radius-none: 0;
--radius-sm: 2px;    /* Most elements */
--radius-md: 4px;    /* Cards, modals */
--radius-lg: 6px;    /* Rarely used */
```

---

## Animations

### Transitions

```css
/* Default transition for interactive elements */
.transition-default {
  transition-property: color, background-color, border-color, opacity;
  transition-timing-function: ease-out;
  transition-duration: 150ms;
}

/* Subtle scale for clickable items */
.hover-lift {
  transition: transform 150ms ease-out;
}
.hover-lift:hover {
  transform: scale(1.02);
}
```

### Loading States

```tsx
// Skeleton loader
<div className="animate-pulse">
  <div className="h-4 bg-elevated rounded-sm w-3/4" />
  <div className="h-4 bg-elevated rounded-sm w-1/2 mt-2" />
</div>

// Spinner
<div className="
  w-4 h-4 border-2 border-border border-t-accent
  rounded-full animate-spin
" />
```

---

## Markdown Rendering

Use these styles for rendered markdown content:

```css
.prose-memory {
  /* Headings */
  h1, h2, h3, h4 {
    @apply font-heading font-semibold text-text-primary;
    @apply mt-8 mb-4;
  }
  h1 { @apply text-2xl; }
  h2 { @apply text-xl border-b border-border pb-2; }
  h3 { @apply text-lg; }

  /* Body */
  p { @apply text-text-secondary leading-relaxed mb-4; }

  /* Links */
  a { @apply text-accent hover:underline; }

  /* Code */
  code {
    @apply font-mono text-sm bg-elevated px-1.5 py-0.5 rounded-sm;
  }
  pre {
    @apply bg-elevated border border-border rounded-sm p-4 overflow-x-auto;
  }
  pre code {
    @apply bg-transparent p-0;
  }

  /* Lists */
  ul, ol { @apply pl-6 mb-4 text-text-secondary; }
  li { @apply mb-1; }

  /* Blockquotes */
  blockquote {
    @apply border-l-2 border-accent pl-4 italic text-text-tertiary;
  }

  /* Tables */
  table { @apply w-full border-collapse mb-4; }
  th, td { @apply border border-border px-3 py-2 text-left; }
  th { @apply bg-surface font-medium; }

  /* Horizontal rules */
  hr { @apply border-border my-8; }
}
```

---

## Dark/Light Mode

Default to dark mode (matches Zed). Support light mode via class toggle:

```tsx
// ThemeProvider.tsx
const ThemeContext = createContext<{ theme: 'dark' | 'light'; toggle: () => void }>();

// Usage in layout
<html className={theme}>
  <body className="bg-base text-text-primary">
    ...
  </body>
</html>
```

```css
/* CSS Variables with dark/light support */
:root {
  /* Dark mode defaults */
  --bg-base: hsl(218, 13%, 7.5%);
  /* ... */
}

:root.light {
  /* Light mode overrides */
  --bg-base: hsl(40, 33%, 98%);
  /* ... */
}
```

---

## Visitor Mode Banner

```tsx
<div className="
  bg-accent-muted border-b border-accent/30
  px-4 py-2
  flex items-center justify-center gap-2
  text-sm text-accent
">
  <EyeIcon className="w-4 h-4" />
  <span>Demo Mode</span>
  <span className="text-text-tertiary">—</span>
  <a href="/login" className="hover:underline font-medium">
    Sign in to access your knowledge
  </a>
</div>
```

---

## Responsive Breakpoints

```javascript
// tailwind.config.js
screens: {
  'sm': '640px',
  'md': '768px',
  'lg': '1024px',
  'xl': '1280px',
}
```

| Breakpoint | Sidebar | Layout |
|------------|---------|--------|
| < 768px | Hidden (hamburger) | Single column |
| 768-1024px | Overlay on toggle | Full width content |
| > 1024px | Fixed 256px | Sidebar + content |

---

## Key Design Observations from zed.dev

### From Screenshot Analysis

**Header (Image 1 & 3):**
- Sticky header with `backdrop-blur`
- Logo on left, nav items in center-left
- Search with keyboard shortcut badge (`Ctrl + Shift + P`)
- Primary action button (Download/New) with accent blue + keyboard shortcut badge inside
- Very subtle bottom border (`border-white/5`)

**Dropdown Menu (Image 1):**
- Two-column grid layout
- Section headers: UPPERCASE, 10px, letter-spacing, muted gray
- Menu items have colored icons (blue, amber, purple, green, magenta)
- Hover state: subtle background + arrow appears (`→`)
- Decorative corner elements (small rotated squares)
- Shadow: `shadow-xl shadow-black/50`
- Border: `border-white/10`

**Sidebar (Image 2):**
- Section headers in accent blue with chevron
- Active item: blue/accent background tint (`bg-accent/15`)
- Nested items indented with `ml-4`
- Items are small text (13-14px)
- Subtle hover states

**Content Area (Image 2):**
- Large serif heading (Lora) in accent blue
- Body text in secondary gray, monospace-like appearance
- Links are accent blue with underline on hover
- Bullet lists with proper spacing
- Right sidebar for "On This Page" navigation

**Feature Cards (Image 3):**
- Three-column grid
- Icon + title + description layout
- Icons are colorful (green, blue, purple)
- No visible card borders, just grid container has border
- Clean, minimal presentation

### Specific CSS Values Observed

```css
/* Border opacities */
border-white/5    /* Very subtle, almost invisible */
border-white/10   /* Visible but light */
border-white/15   /* Hover states */

/* Text hierarchy */
text-[10px]       /* Section labels, uppercase */
text-xs           /* 12px - captions, kbd */
text-sm           /* 14px - body, menu items */
text-base         /* 16px - main content */
text-xl           /* 20px - h2 */
text-4xl          /* 36px - h1 page titles */

/* Icon colors (semantic) */
text-blue-400     /* Primary/default */
text-green-400    /* Success/fast */
text-amber-400    /* Warning/recent */
text-purple-400   /* Search/special */
text-pink-400     /* AI/magic */

/* Spacing patterns */
gap-1             /* Nav items */
gap-2             /* Icon + text */
gap-3             /* Card content */
gap-6             /* Grid columns */
p-3               /* Sidebar padding */
p-4               /* Card padding */
px-8 py-6         /* Content area */
```

---

## Key Design Principles

1. **Minimal** - No unnecessary decoration. Every element serves a purpose.
2. **Crisp** - Sharp edges (2-4px radius max), clear boundaries.
3. **Functional** - Prioritize readability and usability over aesthetics.
4. **Dark-first** - Optimized for dark mode, light mode as secondary.
5. **Typography-driven** - Let beautiful fonts do the heavy lifting.
6. **Performance-visible** - Always show latency metrics prominently.
7. **Keyboard-first** - Show keyboard shortcuts prominently (kbd badges).
8. **Colorful icons** - Use distinct colors for icons to aid recognition.
9. **Subtle borders** - Use very low opacity borders (5-10% white).
