# Zed Design Guidelines

A comprehensive design system inspired by zed.dev, featuring a dark, technical aesthetic with elegant typography and subtle accent colors.

---

## Table of Contents

1. [Design Philosophy](#design-philosophy)
2. [Color System](#color-system)
3. [Typography](#typography)
4. [Spacing & Layout](#spacing--layout)
5. [Components](#components)
6. [Patterns](#patterns)
7. [Code Examples](#code-examples)

---

## Design Philosophy

Zed's design embodies:

- **Technical Elegance**: Monospace body text paired with italic serif headlines creates a sophisticated developer aesthetic
- **Dark Mode First**: Deep, muted backgrounds reduce eye strain and highlight content
- **Subtle Accents**: Blue accents draw attention without overwhelming
- **Information Density**: Clean layouts that communicate efficiently
- **Grid Precision**: Subtle grid overlays and precise alignment throughout

---

## Color System

### Background Colors

| Token | Value | Usage |
|-------|-------|-------|
| `--bg-primary` | `#0e1015` | Main page background |
| `--bg-secondary` | `#13161c` | Card backgrounds, elevated surfaces |
| `--bg-tertiary` | `#1a1d24` | Hover states, code blocks |
| `--bg-elevated` | `#1e2128` | Modal backgrounds, dropdowns |

### Text Colors

| Token | Value | Usage |
|-------|-------|-------|
| `--text-primary` | `#f1f2f4` | Headlines, emphasized text |
| `--text-secondary` | `#b8bdc7` | Body text, descriptions |
| `--text-muted` | `#a8afbd` | Secondary information |
| `--text-subtle` | `#6b7280` | Timestamps, metadata |

### Accent Colors

| Token | Value | Usage |
|-------|-------|-------|
| `--accent-blue` | `#0751cf` | Primary buttons, CTAs |
| `--accent-blue-light` | `#9dbcfb` | Headlines, links |
| `--accent-blue-hover` | `#0862e8` | Button hover states |
| `--accent-cyan` | `#56d4dd` | Icons, feature highlights |
| `--accent-purple` | `#9e9eff` | Links, interactive elements |

### Semantic Colors

| Token | Value | Usage |
|-------|-------|-------|
| `--success` | `#4ade80` | Success states, checkmarks |
| `--warning` | `#fbbf24` | Warning indicators |
| `--error` | `#f87171` | Error states |
| `--info` | `#60a5fa` | Information callouts |

### Border Colors

| Token | Value | Usage |
|-------|-------|-------|
| `--border-default` | `rgba(255, 255, 255, 0.08)` | Card borders, dividers |
| `--border-hover` | `rgba(255, 255, 255, 0.12)` | Hover states |
| `--border-accent` | `rgba(7, 81, 207, 0.5)` | Featured cards, focus states |

### CSS Variables

```css
:root {
  /* Backgrounds */
  --bg-primary: #0e1015;
  --bg-secondary: #13161c;
  --bg-tertiary: #1a1d24;
  --bg-elevated: #1e2128;

  /* Text */
  --text-primary: #f1f2f4;
  --text-secondary: #b8bdc7;
  --text-muted: #a8afbd;
  --text-subtle: #6b7280;

  /* Accents */
  --accent-blue: #0751cf;
  --accent-blue-light: #9dbcfb;
  --accent-blue-hover: #0862e8;
  --accent-cyan: #56d4dd;
  --accent-purple: #9e9eff;

  /* Borders */
  --border-default: rgba(255, 255, 255, 0.08);
  --border-hover: rgba(255, 255, 255, 0.12);
  --border-accent: rgba(7, 81, 207, 0.5);

  /* Shadows */
  --shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.3);
  --shadow-md: 0 4px 6px rgba(0, 0, 0, 0.4);
  --shadow-lg: 0 10px 15px rgba(0, 0, 0, 0.5);
}
```

---

## Typography

### Font Families

| Purpose | Font | Fallbacks |
|---------|------|-----------|
| Headlines | **Lora** (italic) | Georgia, serif |
| Body Text | **IA Writer Quattro S** | system-ui, sans-serif |
| Code | **ui-monospace** | SFMono-Regular, Menlo, Monaco, Consolas |

### Font Stack CSS

```css
:root {
  --font-headline: 'Lora', Georgia, 'Times New Roman', serif;
  --font-body: 'IA Writer Quattro S', 'Inter', system-ui, -apple-system, sans-serif;
  --font-mono: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', monospace;
}
```

### Type Scale

| Element | Size | Line Height | Weight | Style |
|---------|------|-------------|--------|-------|
| Hero H1 | 48px | 1.2 | 400 | italic |
| Page H1 | 34px | 1.3 | 480 | italic |
| H2 | 28px | 1.3 | 400 | italic |
| H3 | 22px | 1.4 | 400 | italic |
| H4 | 18px | 1.4 | 500 | normal |
| Body | 16px | 1.5 | 400 | normal |
| Small | 14px | 1.5 | 400 | normal |
| Caption | 12px | 1.4 | 400 | normal |

### Typography Classes

```css
/* Headlines - Lora Italic */
.headline-hero {
  font-family: var(--font-headline);
  font-size: 48px;
  font-weight: 400;
  font-style: italic;
  line-height: 1.2;
  color: var(--accent-blue-light);
}

.headline-page {
  font-family: var(--font-headline);
  font-size: 34px;
  font-weight: 480;
  font-style: italic;
  line-height: 1.3;
  color: var(--accent-blue-light);
}

.headline-section {
  font-family: var(--font-headline);
  font-size: 28px;
  font-weight: 400;
  font-style: italic;
  line-height: 1.3;
  color: var(--accent-blue-light);
}

/* Body Text - IA Writer Quattro */
.body-text {
  font-family: var(--font-body);
  font-size: 16px;
  font-weight: 400;
  line-height: 1.5;
  color: var(--text-secondary);
}

/* Labels - Uppercase Spaced */
.label {
  font-family: var(--font-body);
  font-size: 12px;
  font-weight: 500;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--text-muted);
}

/* Code */
.code-inline {
  font-family: var(--font-mono);
  font-size: 14px;
  background: rgba(9, 88, 246, 0.2);
  padding: 2px 6px;
  border-radius: 4px;
  color: var(--text-primary);
}
```

---

## Spacing & Layout

### Spacing Scale

| Token | Value | Usage |
|-------|-------|-------|
| `--space-1` | 4px | Tight spacing, icon gaps |
| `--space-2` | 8px | Small padding, inline spacing |
| `--space-3` | 12px | Card padding, button padding |
| `--space-4` | 16px | Standard spacing |
| `--space-5` | 20px | Section padding |
| `--space-6` | 24px | Card gaps, larger padding |
| `--space-8` | 32px | Section margins |
| `--space-10` | 40px | Large gaps |
| `--space-12` | 48px | Section dividers |
| `--space-16` | 64px | Page sections |
| `--space-20` | 80px | Major sections |
| `--space-24` | 96px | Hero sections |

### Container Widths

```css
.container-narrow { max-width: 680px; }   /* Blog posts, documentation */
.container-default { max-width: 1024px; } /* Standard pages */
.container-wide { max-width: 1280px; }    /* Full layouts */
.container-full { max-width: 1440px; }    /* Homepage sections */
```

### Grid System

```css
/* 12-column grid */
.grid {
  display: grid;
  gap: var(--space-6);
}

.grid-2 { grid-template-columns: repeat(2, 1fr); }
.grid-3 { grid-template-columns: repeat(3, 1fr); }
.grid-4 { grid-template-columns: repeat(4, 1fr); }

/* Feature grid (uneven columns) */
.grid-feature {
  display: grid;
  grid-template-columns: 1fr 1.5fr;
  gap: var(--space-8);
}
```

### Layout Patterns

```css
/* Sidebar layout (docs) */
.layout-docs {
  display: grid;
  grid-template-columns: 240px 1fr 200px;
  gap: var(--space-8);
}

/* Two-column content */
.layout-split {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--space-8);
  align-items: center;
}
```

---

## Components

### Buttons

#### Primary Button

```css
.btn-primary {
  display: inline-flex;
  align-items: center;
  gap: var(--space-2);
  padding: 10px 16px;
  background: var(--accent-blue);
  color: white;
  font-family: var(--font-body);
  font-size: 14px;
  font-weight: 500;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  transition: background-color 0.15s ease;
}

.btn-primary:hover {
  background: var(--accent-blue-hover);
}
```

#### Secondary Button (Outline)

```css
.btn-secondary {
  display: inline-flex;
  align-items: center;
  gap: var(--space-2);
  padding: 10px 16px;
  background: transparent;
  color: var(--text-primary);
  font-family: var(--font-body);
  font-size: 14px;
  font-weight: 500;
  border: 1px solid var(--border-default);
  border-radius: 4px;
  cursor: pointer;
  transition: border-color 0.15s ease, background-color 0.15s ease;
}

.btn-secondary:hover {
  border-color: var(--border-hover);
  background: rgba(255, 255, 255, 0.02);
}
```

#### Link Button

```css
.btn-link {
  display: inline-flex;
  align-items: center;
  gap: var(--space-1);
  padding: 8px 12px;
  background: transparent;
  color: var(--text-primary);
  font-family: var(--font-body);
  font-size: 14px;
  border: 1px solid var(--border-default);
  border-radius: 4px;
  text-decoration: none;
  transition: border-color 0.15s ease;
}

.btn-link:hover {
  border-color: var(--border-hover);
}

.btn-link::after {
  content: '>';
  margin-left: 4px;
}
```

### Cards

#### Basic Card

```css
.card {
  background: var(--bg-secondary);
  border: 1px solid var(--border-default);
  border-radius: 8px;
  padding: var(--space-6);
}

.card:hover {
  border-color: var(--border-hover);
}
```

#### Feature Card

```css
.card-feature {
  background: var(--bg-secondary);
  border: 1px solid var(--border-default);
  border-radius: 8px;
  padding: var(--space-6);
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}

.card-feature-icon {
  color: var(--accent-cyan);
  width: 20px;
  height: 20px;
}

.card-feature-title {
  font-family: var(--font-body);
  font-size: 16px;
  font-weight: 600;
  color: var(--text-primary);
}

.card-feature-description {
  font-family: var(--font-body);
  font-size: 14px;
  color: var(--text-secondary);
  line-height: 1.5;
}
```

#### Featured/Highlighted Card

```css
.card-featured {
  background: var(--bg-secondary);
  border: 1px solid var(--border-accent);
  border-radius: 8px;
  padding: var(--space-6);
  position: relative;
}

/* Optional: Gradient border effect */
.card-featured::before {
  content: '';
  position: absolute;
  inset: -1px;
  border-radius: 9px;
  background: linear-gradient(135deg, var(--accent-blue), transparent 50%);
  z-index: -1;
  opacity: 0.5;
}
```

#### Pricing Card

```css
.card-pricing {
  background: var(--bg-secondary);
  border: 1px solid var(--border-default);
  border-radius: 8px;
  padding: var(--space-8);
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}

.card-pricing.featured {
  border-color: var(--accent-blue);
}

.card-pricing-tier {
  font-family: var(--font-body);
  font-size: 12px;
  font-weight: 500;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--text-muted);
}

.card-pricing-price {
  display: flex;
  align-items: baseline;
  gap: var(--space-1);
}

.card-pricing-amount {
  font-family: var(--font-body);
  font-size: 48px;
  font-weight: 400;
  color: var(--text-primary);
}

.card-pricing-period {
  font-family: var(--font-body);
  font-size: 16px;
  color: var(--text-muted);
}
```

#### Blog Card

```css
.card-blog {
  background: var(--bg-secondary);
  border: 1px solid var(--border-default);
  border-radius: 8px;
  overflow: hidden;
  transition: border-color 0.15s ease;
}

.card-blog:hover {
  border-color: var(--border-hover);
}

.card-blog-image {
  width: 100%;
  aspect-ratio: 16/9;
  object-fit: cover;
}

.card-blog-content {
  padding: var(--space-6);
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}

.card-blog-title {
  font-family: var(--font-body);
  font-size: 18px;
  font-weight: 600;
  color: var(--text-primary);
}

.card-blog-excerpt {
  font-family: var(--font-body);
  font-size: 14px;
  color: var(--text-secondary);
  line-height: 1.5;
}

.card-blog-meta {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: auto;
}

.card-blog-authors {
  display: flex;
  align-items: center;
  gap: -8px; /* Overlapping avatars */
}

.card-blog-avatar {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  border: 2px solid var(--bg-secondary);
}

.card-blog-date {
  font-family: var(--font-body);
  font-size: 12px;
  color: var(--text-subtle);
}
```

### Navigation

#### Main Navigation

```css
.nav {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--space-4) var(--space-8);
  background: var(--bg-primary);
  border-bottom: 1px solid var(--border-default);
}

.nav-links {
  display: flex;
  align-items: center;
  gap: var(--space-6);
}

.nav-link {
  font-family: var(--font-body);
  font-size: 14px;
  color: var(--text-secondary);
  text-decoration: none;
  transition: color 0.15s ease;
}

.nav-link:hover {
  color: var(--text-primary);
}

.nav-link.active {
  color: var(--text-primary);
}
```

#### Sidebar Navigation (Docs)

```css
.sidebar-nav {
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
}

.sidebar-section {
  margin-bottom: var(--space-4);
}

.sidebar-section-title {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--space-2) var(--space-3);
  font-family: var(--font-body);
  font-size: 14px;
  font-weight: 500;
  color: var(--accent-blue-light);
  cursor: pointer;
}

.sidebar-link {
  display: block;
  padding: var(--space-2) var(--space-3);
  font-family: var(--font-body);
  font-size: 14px;
  color: var(--text-secondary);
  text-decoration: none;
  border-radius: 4px;
  transition: background-color 0.15s ease;
}

.sidebar-link:hover {
  background: rgba(255, 255, 255, 0.02);
}

.sidebar-link.active {
  background: var(--accent-blue);
  color: white;
}

.sidebar-link-nested {
  padding-left: var(--space-6);
}
```

### Form Elements

#### Input Field

```css
.input {
  width: 100%;
  padding: var(--space-3) var(--space-4);
  background: var(--bg-tertiary);
  border: 1px solid var(--border-default);
  border-radius: 4px;
  font-family: var(--font-body);
  font-size: 14px;
  color: var(--text-primary);
  transition: border-color 0.15s ease;
}

.input::placeholder {
  color: var(--text-subtle);
}

.input:focus {
  outline: none;
  border-color: var(--accent-blue);
}
```

#### Search Input

```css
.search-input {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-2) var(--space-4);
  background: var(--bg-tertiary);
  border: 1px solid var(--border-default);
  border-radius: 4px;
  min-width: 200px;
}

.search-input input {
  flex: 1;
  background: transparent;
  border: none;
  font-family: var(--font-body);
  font-size: 14px;
  color: var(--text-primary);
}

.search-input input::placeholder {
  color: var(--text-subtle);
}

.search-input-shortcut {
  font-family: var(--font-mono);
  font-size: 12px;
  color: var(--text-subtle);
  padding: 2px 6px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 3px;
}
```

#### Toggle Switch

```css
.toggle {
  position: relative;
  width: 44px;
  height: 24px;
  background: var(--bg-tertiary);
  border-radius: 12px;
  cursor: pointer;
  transition: background-color 0.2s ease;
}

.toggle.active {
  background: var(--accent-blue);
}

.toggle::after {
  content: '';
  position: absolute;
  top: 2px;
  left: 2px;
  width: 20px;
  height: 20px;
  background: white;
  border-radius: 50%;
  transition: transform 0.2s ease;
}

.toggle.active::after {
  transform: translateX(20px);
}
```

### Code Blocks

#### Inline Code

```css
.code-inline {
  font-family: var(--font-mono);
  font-size: 0.875em;
  background: rgba(9, 88, 246, 0.2);
  color: var(--text-primary);
  padding: 2px 6px;
  border-radius: 4px;
}
```

#### Code Block

```css
.code-block {
  background: var(--bg-tertiary);
  border: 1px solid var(--border-default);
  border-radius: 8px;
  overflow: hidden;
}

.code-block-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--space-3) var(--space-4);
  background: rgba(255, 255, 255, 0.02);
  border-bottom: 1px solid var(--border-default);
}

.code-block-language {
  font-family: var(--font-mono);
  font-size: 12px;
  color: var(--text-subtle);
}

.code-block-content {
  padding: var(--space-4);
  overflow-x: auto;
}

.code-block pre {
  margin: 0;
  font-family: var(--font-mono);
  font-size: 14px;
  line-height: 1.6;
  color: var(--text-primary);
}
```

#### Syntax Highlighting Colors

```css
/* Based on Zed's editor theme */
.token-keyword { color: #e879f9; }     /* Purple - keywords */
.token-string { color: #a5d6ff; }      /* Light blue - strings */
.token-number { color: #fbbf24; }      /* Yellow - numbers */
.token-function { color: #60a5fa; }    /* Blue - functions */
.token-comment { color: #6b7280; }     /* Gray - comments */
.token-variable { color: #f1f2f4; }    /* White - variables */
.token-property { color: #fbbf24; }    /* Yellow - JSON keys */
.token-boolean { color: #f97316; }     /* Orange - booleans */
```

### Callouts/Alerts

```css
.callout {
  display: flex;
  gap: var(--space-3);
  padding: var(--space-4);
  border: 1px solid var(--border-default);
  border-radius: 8px;
  background: var(--bg-secondary);
}

.callout-icon {
  flex-shrink: 0;
  width: 20px;
  height: 20px;
}

.callout-content {
  font-family: var(--font-body);
  font-size: 14px;
  color: var(--text-secondary);
  line-height: 1.5;
}

.callout.info {
  border-color: rgba(96, 165, 250, 0.3);
  background: rgba(96, 165, 250, 0.05);
}

.callout.warning {
  border-color: rgba(251, 191, 36, 0.3);
  background: rgba(251, 191, 36, 0.05);
}

.callout.error {
  border-color: rgba(248, 113, 113, 0.3);
  background: rgba(248, 113, 113, 0.05);
}
```

### Testimonials

```css
.testimonial {
  background: var(--bg-secondary);
  border: 1px solid var(--border-default);
  border-radius: 8px;
  padding: var(--space-6);
}

.testimonial.featured {
  border-left: 3px solid var(--accent-cyan);
}

.testimonial-quote {
  font-family: var(--font-body);
  font-size: 14px;
  color: var(--text-secondary);
  line-height: 1.6;
  margin-bottom: var(--space-4);
}

.testimonial-highlight {
  color: var(--accent-cyan);
}

.testimonial-author {
  display: flex;
  align-items: center;
  gap: var(--space-3);
}

.testimonial-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
}

.testimonial-info {
  display: flex;
  flex-direction: column;
}

.testimonial-name {
  font-family: var(--font-body);
  font-size: 14px;
  font-weight: 500;
  color: var(--text-primary);
}

.testimonial-role {
  font-family: var(--font-body);
  font-size: 12px;
  color: var(--text-subtle);
}
```

### Footer

```css
.footer {
  background: var(--bg-secondary);
  border-top: 1px solid var(--border-default);
  padding: var(--space-16) var(--space-8);
}

.footer-grid {
  display: grid;
  grid-template-columns: 1.5fr repeat(4, 1fr);
  gap: var(--space-8);
  max-width: 1280px;
  margin: 0 auto;
}

.footer-brand {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}

.footer-logo {
  width: 32px;
  height: 32px;
}

.footer-copyright {
  font-family: var(--font-body);
  font-size: 14px;
  color: var(--text-secondary);
}

.footer-legal {
  display: flex;
  gap: var(--space-2);
}

.footer-legal-link {
  font-family: var(--font-body);
  font-size: 12px;
  color: var(--text-subtle);
  text-decoration: none;
}

.footer-legal-link:hover {
  color: var(--text-secondary);
}

.footer-column-title {
  font-family: var(--font-body);
  font-size: 14px;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: var(--space-4);
}

.footer-links {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}

.footer-link {
  font-family: var(--font-body);
  font-size: 14px;
  color: var(--text-secondary);
  text-decoration: none;
  transition: color 0.15s ease;
}

.footer-link:hover {
  color: var(--text-primary);
}

.footer-link-external::after {
  content: ' ↗';
  font-size: 12px;
}
```

---

## Patterns

### Section Headers

```css
.section-header {
  text-align: center;
  margin-bottom: var(--space-12);
}

.section-label {
  font-family: var(--font-body);
  font-size: 12px;
  font-weight: 500;
  letter-spacing: 0.15em;
  text-transform: uppercase;
  color: var(--text-muted);
  margin-bottom: var(--space-4);
}

.section-title {
  font-family: var(--font-headline);
  font-size: 34px;
  font-weight: 400;
  font-style: italic;
  color: var(--accent-blue-light);
  margin-bottom: var(--space-4);
}

.section-description {
  font-family: var(--font-body);
  font-size: 16px;
  color: var(--text-secondary);
  max-width: 600px;
  margin: 0 auto;
}
```

### Logo Marquee

```css
.logo-marquee {
  display: flex;
  align-items: center;
  gap: var(--space-12);
  overflow: hidden;
  padding: var(--space-8) 0;
  border-top: 1px solid var(--border-default);
  border-bottom: 1px solid var(--border-default);
}

.logo-marquee img {
  height: 24px;
  opacity: 0.6;
  filter: grayscale(100%);
  transition: opacity 0.15s ease, filter 0.15s ease;
}

.logo-marquee img:hover {
  opacity: 1;
  filter: grayscale(0%);
}
```

### Stats Grid

```css
.stats-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: var(--space-4);
}

.stat-card {
  background: var(--bg-tertiary);
  border-radius: 8px;
  padding: var(--space-4);
  text-align: center;
}

.stat-value {
  font-family: var(--font-body);
  font-size: 32px;
  font-weight: 400;
  color: var(--accent-blue-light);
}

.stat-label {
  font-family: var(--font-body);
  font-size: 12px;
  color: var(--text-muted);
  margin-top: var(--space-1);
}
```

### Grid Background Pattern

```css
.bg-grid {
  background-image:
    linear-gradient(rgba(255, 255, 255, 0.03) 1px, transparent 1px),
    linear-gradient(90deg, rgba(255, 255, 255, 0.03) 1px, transparent 1px);
  background-size: 50px 50px;
}
```

### Table of Contents (Sticky)

```css
.toc {
  position: sticky;
  top: var(--space-8);
}

.toc-title {
  font-family: var(--font-body);
  font-size: 12px;
  font-weight: 500;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--text-muted);
  margin-bottom: var(--space-4);
}

.toc-list {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.toc-link {
  font-family: var(--font-body);
  font-size: 14px;
  color: var(--text-secondary);
  text-decoration: none;
  padding: var(--space-1) 0;
  border-left: 2px solid transparent;
  padding-left: var(--space-3);
  transition: color 0.15s ease, border-color 0.15s ease;
}

.toc-link:hover {
  color: var(--text-primary);
}

.toc-link.active {
  color: var(--accent-blue-light);
  border-color: var(--accent-blue-light);
}

.toc-link-nested {
  padding-left: var(--space-6);
  font-size: 13px;
}
```

---

## Code Examples

### Hero Section

```html
<section class="hero">
  <div class="container-default">
    <h1 class="headline-hero">Love your editor again</h1>
    <p class="body-text">
      Zed is a minimal code editor crafted for speed
      and collaboration with humans and AI.
    </p>
    <div class="hero-actions">
      <a href="/download" class="btn-primary">
        <svg><!-- download icon --></svg>
        Download now
        <kbd>D</kbd>
      </a>
      <a href="/source" class="btn-secondary">
        <svg><!-- github icon --></svg>
        Clone source
        <kbd>C</kbd>
      </a>
    </div>
    <p class="hero-platforms">
      Available for macOS, Linux, and Windows
    </p>
  </div>
</section>
```

### Feature Grid

```html
<section class="features">
  <div class="section-header">
    <span class="section-label">Forever Shipping</span>
    <h2 class="section-title">Zed just works</h2>
    <p class="section-description">
      Incredibly powerful out of the box. And it only gets better as,
      every week, there's always a new version.
    </p>
    <a href="/releases" class="btn-link">View all releases</a>
  </div>

  <div class="grid grid-3">
    <article class="card-feature">
      <svg class="card-feature-icon"><!-- icon --></svg>
      <h3 class="card-feature-title">Agentic Editing</h3>
      <p class="card-feature-description">
        Zed now natively supports agentic editing, enabling fluent
        collaboration between humans and AI.
      </p>
    </article>
    <!-- More feature cards -->
  </div>
</section>
```

### Pricing Table

```html
<section class="pricing">
  <div class="section-header">
    <span class="section-label">Pricing</span>
    <h2 class="section-title">Build better with Zed</h2>
  </div>

  <div class="grid grid-3">
    <article class="card-pricing">
      <span class="card-pricing-tier">Personal</span>
      <div class="card-pricing-price">
        <span class="card-pricing-amount">$0</span>
        <span class="card-pricing-period">forever</span>
      </div>
      <p class="body-text">The next-generation code editor. Free forever.</p>
      <ul class="pricing-features">
        <li><svg><!-- check --></svg> 2,000 accepted edit predictions</li>
        <li><svg><!-- check --></svg> Unlimited use with your API keys</li>
      </ul>
      <a href="/download" class="btn-secondary">Download Now</a>
    </article>

    <article class="card-pricing featured">
      <div class="card-pricing-header">
        <span class="card-pricing-tier">Pro</span>
        <label class="toggle">Free Trial</label>
      </div>
      <div class="card-pricing-price">
        <span class="card-pricing-amount">$10</span>
        <span class="card-pricing-period">per month</span>
      </div>
      <p class="body-text">The next-generation code editor + AI.</p>
      <ul class="pricing-features">
        <li><svg><!-- check --></svg> Unlimited edit predictions</li>
        <li><svg><!-- check --></svg> $5 of tokens included</li>
      </ul>
      <a href="/upgrade" class="btn-primary">Get Started</a>
    </article>
  </div>
</section>
```

---

## Quick Reference

### Font Imports

```css
/* Google Fonts - Lora (headlines) */
@import url('https://fonts.googleapis.com/css2?family=Lora:ital,wght@0,400;0,500;1,400;1,500&display=swap');

/* For IA Writer Quattro, you'll need to self-host or use a similar monospace-friendly font */
/* Alternative: Inter for body text */
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&display=swap');
```

### Tailwind CSS Config

```js
// tailwind.config.js
module.exports = {
  theme: {
    extend: {
      colors: {
        'bg-primary': '#0e1015',
        'bg-secondary': '#13161c',
        'bg-tertiary': '#1a1d24',
        'text-primary': '#f1f2f4',
        'text-secondary': '#b8bdc7',
        'text-muted': '#a8afbd',
        'accent-blue': '#0751cf',
        'accent-blue-light': '#9dbcfb',
        'accent-cyan': '#56d4dd',
      },
      fontFamily: {
        headline: ['Lora', 'Georgia', 'serif'],
        body: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['ui-monospace', 'SFMono-Regular', 'monospace'],
      },
      borderRadius: {
        DEFAULT: '4px',
        md: '6px',
        lg: '8px',
      },
    },
  },
}
```

---

## Summary

Key characteristics of the Zed design system:

1. **Dark, muted backgrounds** with very subtle gray undertones
2. **Italic serif headlines** (Lora) for elegance and distinction
3. **Monospace-friendly body text** (IA Writer Quattro) for technical content
4. **Blue accent color** (#0751cf) for primary actions and emphasis
5. **Cyan highlights** for icons and feature callouts
6. **Subtle borders** using low-opacity white
7. **Grid background patterns** for visual texture
8. **Consistent 4px/8px spacing rhythm**
9. **Clean, functional components** without excessive decoration
10. **Technical but approachable** overall aesthetic

This system works particularly well for developer tools, technical documentation, and SaaS products targeting technical audiences.
