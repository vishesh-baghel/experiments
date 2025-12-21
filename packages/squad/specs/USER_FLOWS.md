# Squad - User Flows

**Version:** 0.2.0  
**Last Updated:** Dec 21, 2025

---

## Overview

This document details all user flows in Squad V1. The deploy flow has been simplified to use Vercel's Deploy Button instead of OAuth.

Each flow includes:
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

## Flow 3: Deploy Agent (Simplified)

### Trigger
User clicks "deploy your own" button on agent detail page

### Entry Point
Deploy flow page (`/deploy/[agentId]`)

### Flow Overview

```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│  Step 1: Click "Deploy to Vercel"                           │
│                    │                                        │
│                    ▼                                        │
│  Step 2: Configure on Vercel (new tab)                      │
│          - Set up Prisma Postgres                           │
│          - Configure environment variables                  │
│          - Deploy                                           │
│                    │                                        │
│                    ▼                                        │
│  Step 3: Return to Squad (callback)                         │
│                    │                                        │
│                    ▼                                        │
│  Success: Show deployment URL + setup guide link            │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Step 1: Deploy Page

```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│  User clicks "deploy your own" on agent page                │
│                                                             │
│                    │                                        │
│                    ▼                                        │
│                                                             │
│  ┌───────────────────────────────────────────────────────┐ │
│  │  Deploy Page loads                                    │ │
│  │  - Session initialized via POST /api/deploy/start    │ │
│  │  - "deploy to vercel" button                          │ │
│  │  - Explanation text                                   │ │
│  │  - Link to setup guide                                │ │
│  └───────────────────────────────────────────────────────┘ │
│                                                             │
│                    │                                        │
│                    ▼                                        │
│                                                             │
│  User clicks "deploy to vercel"                             │
│                                                             │
│                    │                                        │
│                    ▼                                        │
│                                                             │
│  GET /api/deploy/vercel/deploy?agentId=jack                 │
│  → Redirects to Vercel Deploy Button in new tab             │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

**Technical Details:**
- Session created via `POST /api/deploy/start`
- Deploy button opens new tab via `GET /api/deploy/vercel/deploy`
- Redirect to `https://vercel.com/new/clone?...` with agent config

### Step 2: Vercel Configuration (External)

```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│  User is on Vercel's Deploy Button page (new tab)           │
│                                                             │
│                    │                                        │
│                    ▼                                        │
│                                                             │
│  ┌───────────────────────────────────────────────────────┐ │
│  │  Vercel Deploy Button Flow                            │ │
│  │  1. Log in to Vercel (if needed)                      │ │
│  │  2. Choose Git provider (GitHub)                      │ │
│  │  3. Configure Prisma Postgres (skippable)             │ │
│  │  4. Set environment variables                         │ │
│  │  5. Click "Deploy"                                    │ │
│  └───────────────────────────────────────────────────────┘ │
│                                                             │
│                    │                                        │
│         ┌─────────┴─────────┐                              │
│         │                   │                              │
│         ▼                   ▼                              │
│                                                             │
│  Deploy Success        User Cancels                        │
│  (callback triggered)  (no callback)                       │
│         │                   │                              │
│         ▼                   ▼                              │
│                                                             │
│  → Step 3             User can retry                       │
│                       from deploy page                     │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

**Technical Details:**
- Vercel handles repo cloning (no GitHub OAuth needed)
- Prisma Postgres integration configured via `products` param
- Environment variables prompted via `env` param
- On success, Vercel redirects to our callback URL

### Step 3: Callback & Success

```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│  Vercel deployment complete                                 │
│                                                             │
│                    │                                        │
│                    ▼                                        │
│                                                             │
│  GET /api/deploy/vercel/callback                            │
│  - Receives: state, deployment-url, project-dashboard-url  │
│  - Updates session with deployment data                     │
│  - Redirects to /deploy/[agentId]                          │
│                                                             │
│                    │                                        │
│                    ▼                                        │
│                                                             │
│  ┌───────────────────────────────────────────────────────┐ │
│  │  Deploy Page shows success state                      │ │
│  │  ✓ deployment successful                              │ │
│  │  - "see your agent" button                            │ │
│  │  - "vercel project" button                            │ │
│  │  - Link to setup guide                                │ │
│  └───────────────────────────────────────────────────────┘ │
│                                                             │
│                    │                                        │
│         ┌─────────┼─────────┐                              │
│         │         │         │                              │
│         ▼         ▼         ▼                              │
│                                                             │
│  Open           Vercel       Setup                         │
│  agent          dashboard    guide                         │
│  (new tab)      (new tab)    (navigate)                    │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

**Technical Details:**
- Callback: `GET /api/deploy/vercel/callback`
- Session updated with `vercel.deploymentUrl` and `vercel.projectDashboardUrl`
- Success state shown inline on deploy page
- Setup guide available at `/deploy/[agentId]/guide`

### Flow 3.1: Setup Guide

```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│  User clicks "view guide" on deploy page                    │
│                                                             │
│                    │                                        │
│                    ▼                                        │
│                                                             │
│  ┌───────────────────────────────────────────────────────┐ │
│  │  Setup Guide Page (/deploy/[agentId]/guide)           │ │
│  │  - Agent-specific configuration steps                 │ │
│  │  - External links to documentation                    │ │
│  │  - Step-by-step instructions                          │ │
│  └───────────────────────────────────────────────────────┘ │
│                                                             │
│  Steps rendered from agent.guideSteps config                │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

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
