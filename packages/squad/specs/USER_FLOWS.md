# Squad - User Flows

**Version:** 0.1.0  
**Last Updated:** Dec 10, 2025

---

## Overview

This document details all user flows in Squad V1. Each flow includes:
- trigger and entry point
- step-by-step flow
- success and error states
- technical implementation notes

---

## Flow 1: Browse Agents

### Trigger
User visits squad.visheshbaghel.com

### Entry Point
Home page (`/`)

### Flow

```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│  User visits squad.visheshbaghel.com                        │
│                                                             │
│                    │                                        │
│                    ▼                                        │
│                                                             │
│  ┌───────────────────────────────────────────────────────┐ │
│  │  Home Page loads                                      │ │
│  │  - Hero section with headline                         │ │
│  │  - List of agent cards                                │ │
│  │  - Footer with links                                  │ │
│  └───────────────────────────────────────────────────────┘ │
│                                                             │
│                    │                                        │
│                    ▼                                        │
│                                                             │
│  User sees available agents:                                │
│  - jack (available)                                         │
│  - sensie (coming soon)                                     │
│                                                             │
│                    │                                        │
│         ┌─────────┴─────────┐                              │
│         │                   │                              │
│         ▼                   ▼                              │
│                                                             │
│  Click "learn more"    Click external link                 │
│  on agent card         (portfolio/github/cal)              │
│         │                   │                              │
│         ▼                   ▼                              │
│                                                             │
│  → Flow 2               Navigate away                      │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Success State
- page loads in <2 seconds
- all agent cards render correctly
- theme toggle works
- responsive on mobile

### Error States
- page fails to load: show vercel error page
- no agents configured: show "coming soon" message

### Technical Notes
- static page (ISR or SSG)
- agents loaded from config file
- no API calls needed

---

## Flow 2: View Agent Details

### Trigger
User clicks "learn more" on an agent card

### Entry Point
Agent detail page (`/jack` or `/sensie`)

### Flow

```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│  User clicks agent card                                     │
│                                                             │
│                    │                                        │
│                    ▼                                        │
│                                                             │
│  ┌───────────────────────────────────────────────────────┐ │
│  │  Agent Detail Page loads                              │ │
│  │  - Agent name and tagline                             │ │
│  │  - Full description                                   │ │
│  │  - Feature list                                       │ │
│  │  - Requirements/costs table                           │ │
│  │  - What we'll set up section                          │ │
│  │  - Deploy button                                      │ │
│  └───────────────────────────────────────────────────────┘ │
│                                                             │
│                    │                                        │
│         ┌─────────┼─────────┐                              │
│         │         │         │                              │
│         ▼         ▼         ▼                              │
│                                                             │
│  Click         Click       Click                           │
│  "deploy"      "demo"      "spec"                          │
│         │         │         │                              │
│         ▼         ▼         ▼                              │
│                                                             │
│  → Flow 3    Open demo   Open spec                         │
│              in new tab  in new tab                        │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Coming Soon Agent Flow

```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│  User visits /sensie (coming soon agent)                    │
│                                                             │
│                    │                                        │
│                    ▼                                        │
│                                                             │
│  ┌───────────────────────────────────────────────────────┐ │
│  │  Agent Detail Page loads                              │ │
│  │  - Agent name with "coming soon" badge                │ │
│  │  - Description of what it will do                     │ │
│  │  - No deploy button                                   │ │
│  │  - "notify me" placeholder (future)                   │ │
│  └───────────────────────────────────────────────────────┘ │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Success State
- page loads in <2 seconds
- all sections render correctly
- deploy button is visible and clickable (for available agents)
- demo/spec links work

### Error States
- agent not found: redirect to home with toast
- demo unavailable: show "demo unavailable" message

### Technical Notes
- dynamic route `/[agentId]`
- data from agents config
- static generation at build time

---

## Flow 3: Deploy Agent

### Trigger
User clicks "deploy your own" button

### Entry Point
Deploy flow page (`/deploy/[agentId]`)

### Flow Overview

```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│  Step 1: Connect Vercel                                     │
│                    │                                        │
│                    ▼                                        │
│  Step 2: Connect GitHub                                     │
│                    │                                        │
│                    ▼                                        │
│  Step 3: Provision Services                                 │
│                    │                                        │
│                    ▼                                        │
│  Step 4: Deploy                                             │
│                    │                                        │
│                    ▼                                        │
│  Success: Show deployment URL                               │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Step 1: Connect Vercel

```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│  User clicks "deploy your own"                              │
│                                                             │
│                    │                                        │
│                    ▼                                        │
│                                                             │
│  ┌───────────────────────────────────────────────────────┐ │
│  │  Deploy Page loads                                    │ │
│  │  - Progress indicator (step 1 of 4)                   │ │
│  │  - "connect vercel" button                            │ │
│  │  - Explanation text                                   │ │
│  └───────────────────────────────────────────────────────┘ │
│                                                             │
│                    │                                        │
│                    ▼                                        │
│                                                             │
│  User clicks "connect vercel"                               │
│                                                             │
│                    │                                        │
│                    ▼                                        │
│                                                             │
│  ┌───────────────────────────────────────────────────────┐ │
│  │  Browser opens Vercel OAuth popup                     │ │
│  │  - User logs in (if needed)                           │ │
│  │  - User authorizes Squad app                          │ │
│  └───────────────────────────────────────────────────────┘ │
│                                                             │
│                    │                                        │
│         ┌─────────┴─────────┐                              │
│         │                   │                              │
│         ▼                   ▼                              │
│                                                             │
│  Success               Denied/Error                        │
│  (token received)      (user cancelled)                    │
│         │                   │                              │
│         ▼                   ▼                              │
│                                                             │
│  → Step 2             Show error message                   │
│                       + retry button                       │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

**Technical Details:**
- OAuth redirect to `https://vercel.com/oauth/authorize`
- Scopes: `user`, `project`, `integration`
- Callback: `/api/auth/vercel/callback`
- Store token in encrypted cookie

### Step 2: Connect GitHub

```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│  Vercel connected successfully                              │
│                                                             │
│                    │                                        │
│                    ▼                                        │
│                                                             │
│  ┌───────────────────────────────────────────────────────┐ │
│  │  Progress updates (step 2 of 4)                       │ │
│  │  ✓ connect vercel (done)                              │ │
│  │  → connect github (current)                           │ │
│  │  - "connect github" button                            │ │
│  └───────────────────────────────────────────────────────┘ │
│                                                             │
│                    │                                        │
│                    ▼                                        │
│                                                             │
│  User clicks "connect github"                               │
│                                                             │
│                    │                                        │
│                    ▼                                        │
│                                                             │
│  ┌───────────────────────────────────────────────────────┐ │
│  │  Browser opens GitHub OAuth popup                     │ │
│  │  - User logs in (if needed)                           │ │
│  │  - User authorizes Squad app                          │ │
│  └───────────────────────────────────────────────────────┘ │
│                                                             │
│                    │                                        │
│         ┌─────────┴─────────┐                              │
│         │                   │                              │
│         ▼                   ▼                              │
│                                                             │
│  Success               Denied/Error                        │
│  (token received)      (user cancelled)                    │
│         │                   │                              │
│         ▼                   ▼                              │
│                                                             │
│  → Step 3             Show error message                   │
│                       + retry button                       │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

**Technical Details:**
- OAuth redirect to `https://github.com/login/oauth/authorize`
- Scopes: `repo`, `read:user`
- Callback: `/api/auth/github/callback`
- Store token in encrypted cookie

### Step 3: Provision Services

```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│  GitHub connected successfully                              │
│                                                             │
│                    │                                        │
│                    ▼                                        │
│                                                             │
│  ┌───────────────────────────────────────────────────────┐ │
│  │  Automatic provisioning starts                        │ │
│  │  Progress updates (step 3 of 4)                       │ │
│  │  ✓ connect vercel (done)                              │ │
│  │  ✓ connect github (done)                              │ │
│  │  → provision services (in progress)                   │ │
│  │                                                       │ │
│  │  Provisioning:                                        │ │
│  │  ⏳ forking repository...                             │ │
│  │  ○ neon postgres                                      │ │
│  │  ○ ai gateway                                         │ │
│  └───────────────────────────────────────────────────────┘ │
│                                                             │
│                    │                                        │
│                    ▼                                        │
│                                                             │
│  API call: POST /api/deploy/provision                       │
│  - Fork repo to user's GitHub                               │
│  - Create Vercel project                                    │
│  - Provision Neon DB integration                            │
│  - Provision AI Gateway integration                         │
│                                                             │
│                    │                                        │
│         ┌─────────┴─────────┐                              │
│         │                   │                              │
│         ▼                   ▼                              │
│                                                             │
│  Success               Error                               │
│  (all provisioned)     (partial failure)                   │
│         │                   │                              │
│         ▼                   ▼                              │
│                                                             │
│  → Step 4             Show error details                   │
│                       + manual instructions                │
│                       + retry button                       │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

**Technical Details:**
- API route: `POST /api/deploy/provision`
- GitHub API: fork repository
- Vercel API: create project, add integrations
- Poll for integration completion
- Timeout: 2 minutes

### Step 4: Deploy

```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│  Services provisioned successfully                          │
│                                                             │
│                    │                                        │
│                    ▼                                        │
│                                                             │
│  ┌───────────────────────────────────────────────────────┐ │
│  │  Deployment starts automatically                      │ │
│  │  Progress updates (step 4 of 4)                       │ │
│  │  ✓ connect vercel (done)                              │ │
│  │  ✓ connect github (done)                              │ │
│  │  ✓ provision services (done)                          │ │
│  │  → deploy (in progress)                               │ │
│  │                                                       │ │
│  │  ⏳ deploying to production...                        │ │
│  └───────────────────────────────────────────────────────┘ │
│                                                             │
│                    │                                        │
│                    ▼                                        │
│                                                             │
│  API call: POST /api/deploy/create                          │
│  - Set environment variables                                │
│  - Trigger production deployment                            │
│  - Poll for deployment status                               │
│                                                             │
│                    │                                        │
│         ┌─────────┴─────────┐                              │
│         │                   │                              │
│         ▼                   ▼                              │
│                                                             │
│  Success               Error                               │
│  (deployment live)     (build failed)                      │
│         │                   │                              │
│         ▼                   ▼                              │
│                                                             │
│  → Success Page       Show build logs                      │
│                       + retry button                       │
│                       + manual instructions                │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

**Technical Details:**
- API route: `POST /api/deploy/create`
- Vercel API: create deployment
- Poll deployment status every 2 seconds
- Timeout: 5 minutes
- On success: redirect to success page

### Success Page

```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│  Deployment successful                                      │
│                                                             │
│                    │                                        │
│                    ▼                                        │
│                                                             │
│  ┌───────────────────────────────────────────────────────┐ │
│  │  Success Page                                         │ │
│  │  - Deployment URL                                     │ │
│  │  - "open your agent" button                           │ │
│  │  - What was set up (checklist)                        │ │
│  │  - Next steps (manual config needed)                  │ │
│  │  - Links: back to squad, deploy another               │ │
│  └───────────────────────────────────────────────────────┘ │
│                                                             │
│                    │                                        │
│         ┌─────────┼─────────┐                              │
│         │         │         │                              │
│         ▼         ▼         ▼                              │
│                                                             │
│  Open           Back to      Deploy                        │
│  agent          squad        another                       │
│  (new tab)      (navigate)   (navigate)                    │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## Flow 4: Cancel Deployment

### Trigger
User clicks "cancel" during deploy flow

### Flow

```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│  User clicks "cancel" during any deploy step                │
│                                                             │
│                    │                                        │
│                    ▼                                        │
│                                                             │
│  ┌───────────────────────────────────────────────────────┐ │
│  │  Confirmation dialog                                  │ │
│  │  "are you sure? you'll need to start over."          │ │
│  │  [cancel] [continue deploying]                        │ │
│  └───────────────────────────────────────────────────────┘ │
│                                                             │
│                    │                                        │
│         ┌─────────┴─────────┐                              │
│         │                   │                              │
│         ▼                   ▼                              │
│                                                             │
│  Confirm cancel       Continue                             │
│         │                   │                              │
│         ▼                   ▼                              │
│                                                             │
│  Clear session        Close dialog                         │
│  Redirect to          Resume flow                          │
│  agent page                                                │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Technical Notes
- clear deploy session cookie
- no cleanup of partial resources (user can delete manually)
- redirect to agent detail page

---

## Flow 5: Error Recovery

### Trigger
Any error during deployment flow

### Flow

```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│  Error occurs during deployment                             │
│                                                             │
│                    │                                        │
│                    ▼                                        │
│                                                             │
│  ┌───────────────────────────────────────────────────────┐ │
│  │  Error display                                        │ │
│  │  - What went wrong (user-friendly message)            │ │
│  │  - Technical details (collapsed)                      │ │
│  │  - Retry button                                       │ │
│  │  - Manual instructions link                           │ │
│  │  - Cancel and start over                              │ │
│  └───────────────────────────────────────────────────────┘ │
│                                                             │
│                    │                                        │
│         ┌─────────┼─────────┐                              │
│         │         │         │                              │
│         ▼         ▼         ▼                              │
│                                                             │
│  Retry          Manual      Cancel                         │
│  (same step)    deploy      (start over)                   │
│         │         │         │                              │
│         ▼         ▼         ▼                              │
│                                                             │
│  Resume flow    Show        Clear session                  │
│  from current   README      Redirect home                  │
│  step           instructions                               │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Error Types

| Error | User Message | Recovery |
|-------|--------------|----------|
| Vercel OAuth denied | "you cancelled the vercel connection" | retry button |
| GitHub OAuth denied | "you cancelled the github connection" | retry button |
| Fork failed | "couldn't fork the repository" | retry or manual |
| Neon provision failed | "database setup failed" | retry or manual |
| AI Gateway failed | "ai gateway setup failed" | retry or manual |
| Deploy failed | "deployment failed - check build logs" | show logs, retry |
| Timeout | "this is taking longer than expected" | retry or wait |
| Network error | "connection lost" | retry button |

---

## Flow 6: Theme Toggle

### Trigger
User clicks theme toggle icon

### Flow

```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│  User clicks theme toggle (sun/moon icon)                   │
│                                                             │
│                    │                                        │
│                    ▼                                        │
│                                                             │
│  Toggle theme:                                              │
│  - light → dark                                             │
│  - dark → light                                             │
│  - system → explicit                                        │
│                                                             │
│                    │                                        │
│                    ▼                                        │
│                                                             │
│  Save preference to localStorage                            │
│  Apply CSS class to <html>                                  │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Technical Notes
- use `next-themes` package
- persist in localStorage
- respect system preference initially
- no flash on page load (SSR compatible)

---

## Session Management

### Deploy Session Lifecycle

```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│  Create Session                                             │
│  - When: user clicks "deploy"                               │
│  - Contains: agentId, step='initial'                        │
│  - TTL: 30 minutes                                          │
│                                                             │
│                    │                                        │
│                    ▼                                        │
│                                                             │
│  Update Session                                             │
│  - When: each OAuth callback succeeds                       │
│  - Add: tokens, advance step                                │
│  - Extend TTL on each update                                │
│                                                             │
│                    │                                        │
│                    ▼                                        │
│                                                             │
│  Clear Session                                              │
│  - When: deploy succeeds                                    │
│  - When: user cancels                                       │
│  - When: session expires (30 min)                           │
│  - When: unrecoverable error                                │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Cookie Structure

```typescript
// Encrypted cookie: squad_deploy_session
{
  agentId: string;
  step: 'initial' | 'vercel-auth' | 'github-auth' | 'provisioning' | 'deploying';
  vercelToken?: string;
  githubToken?: string;
  githubUsername?: string;
  createdAt: number;
  expiresAt: number;
}
```

---

## API Routes Summary

| Route | Method | Purpose |
|-------|--------|---------|
| `/api/auth/vercel` | GET | Start Vercel OAuth flow |
| `/api/auth/vercel/callback` | GET | Handle Vercel OAuth callback |
| `/api/auth/github` | GET | Start GitHub OAuth flow |
| `/api/auth/github/callback` | GET | Handle GitHub OAuth callback |
| `/api/deploy/provision` | POST | Fork repo, provision integrations |
| `/api/deploy/create` | POST | Create and trigger deployment |
| `/api/deploy/status` | GET | Poll deployment status |
