# Squad - Personal Agents Platform

> "hyper personalised agents i built, deploy them for yourself and let them do your boring work"

**Version:** 0.2.0  
**Author:** Vishesh Baghel  
**Last Updated:** Dec 13, 2025  
**Status:** Updated - User Management + Free Deployment

---

## Table of Contents

1. [Problem Statement](#problem-statement)
2. [Goals & Non-Goals](#goals--non-goals)
3. [User Stories](#user-stories)
4. [Architecture Overview](#architecture-overview)
5. [Authentication Architecture](#authentication-architecture)
6. [Success Criteria](#success-criteria)
7. [Technical Stack](#technical-stack)
8. [Timeline & Milestones](#timeline--milestones)

### Detailed Specs (Separate Files)

- [Data Models](./DATA_MODELS.md)
- [UI Design](./UI_DESIGN.md)
- [User Flows](./USER_FLOWS.md)

---

## Problem Statement

### Current Pain Points

**For Portfolio Visitors:**
- see interesting AI agents in my portfolio but can't easily try them
- manual deployment requires reading READMEs, setting up env vars, and debugging issues
- even technical users spend 30-60 minutes on initial setup

**For Me (Vishesh):**
- want to showcase my engineering skills through working products
- want to build authority in the AI agent space
- need a frictionless way for people to experience my work
- monetization through Overseer (paid orchestration layer)

### Vision

Squad is the marketing and management platform for my personal AI agent ecosystem. It lets anyone:
1. **Experience** agents via visitor mode (see my live agents)
2. **Deploy** agents for free to their own infrastructure
3. **Purchase** Overseer ($99) for cross-agent intelligence
4. **Manage** all deployed agents from a single dashboard

**Time Savings:** 60 minutes manual setup → 2 minutes with Squad

---

## Goals & Non-Goals

### V1 (MVP)

**Core Features:**
- Landing page showcasing available agents (jack, sensie, etc.)
- Individual agent pages with visitor mode links
- **User authentication** (GitHub OAuth, Google OAuth, username/password)
- **Free 1-click deploy** via Vercel + GitHub OAuth
- **Dashboard** to manage deployed agents
- Automatic provisioning of required integrations (Neon DB, Vercel AI Gateway)
- Configurable agent registry (add new agents via config file)
- Design system matching portfolio (IBM Plex Mono, minimalist, sharp edges)

**Authentication:**
- **Squad Auth:** Better Auth with GitHub/Google OAuth + username/password
- **Deployment Auth:** Vercel + GitHub OAuth (used once, tokens discarded)
- User accounts with dashboard access

**Data Storage:**
- User accounts (username, password hash, optional email)
- Forked repo reference (for future deployments)
- Deployed agents list (agent ID, Vercel project name, deployed date)

**Transparency (explicitly communicated):**
- We store: username, password (hashed), optional email, forked repo name, deployed agents
- We DON'T store: GitHub tokens, Vercel tokens, any agent data

**What's NOT in V1:**
- Overseer purchase flow (V2)
- Payment integration
- Cross-agent SSO via Overseer

### V2 (Post-MVP)

- Overseer sales page with visitor mode
- Payment integration (DodoPayments/Stripe)
- Overseer purchase flow (fork private repo)
- SSO across agents via Overseer (for Overseer users)
- Advanced analytics on dashboard

---

## User Stories

### Primary User Story

**As a developer/creator visiting Vishesh's portfolio,**

I want to:
1. browse the available AI agents he's built
2. experience them via visitor mode (see Vishesh's live agents)
3. deploy an agent to my own infrastructure for free
4. manage all my deployed agents from one place

**So that** I can experience production-quality AI tools and potentially hire Vishesh for similar work.

### Core User Flows (MVP)

#### 1. Browse Agents

**As a visitor**, I want to:
1. land on squad.visheshbaghel.com
2. see a clean list of available agents
3. understand each agent's purpose at a glance
4. click to learn more about a specific agent

**Acceptance Criteria:**
- page loads in <2s
- each agent shows: name, tagline, brief description
- clear visual distinction between "available" and "coming soon" agents
- link to visitor mode (live demo) for each available agent

#### 2. Learn About an Agent

**As a visitor**, I want to:
1. click on an agent (e.g., jack)
2. see detailed description of what it does
3. **try it via visitor mode** (see Vishesh's live version)
4. understand the requirements (Vercel account, costs)
5. see what integrations will be provisioned

**Acceptance Criteria:**
- dedicated page for each agent
- prominent "Try Live Demo" button (visitor mode link)
- clear explanation of features
- transparent about costs (~$15/month for jack)
- shows required integrations (Neon, AI Gateway)

#### 3. Sign Up / Login

**As a visitor**, I want to:
1. create an account before deploying
2. use GitHub or Google OAuth for quick signup
3. or use username/password if I prefer

**Acceptance Criteria:**
- GitHub OAuth works
- Google OAuth works
- Username/password fallback (no email verification required)
- Email is optional (for invoices only)
- Clear privacy statement on what we store

#### 4. Deploy an Agent (Free)

**As a logged-in user**, I want to:
1. click "deploy" on an agent page
2. connect my GitHub account (if first time) to fork the experiments repo
3. connect my Vercel account to create the project
4. see integrations being provisioned
5. get my deployed agent URL
6. see the agent in my dashboard

**Acceptance Criteria:**
- total flow under 2 minutes
- clear progress indicators
- GitHub OAuth forks experiments repo (one-time, stored)
- Vercel OAuth used once, token discarded after deployment
- automatic Neon DB provisioning
- automatic Vercel AI Gateway setup
- success page with deployment URL
- agent appears in dashboard

#### 5. Manage Deployed Agents (Dashboard)

**As a logged-in user**, I want to:
1. see all my deployed agents in one place
2. click to open each deployed agent
3. deploy additional agents without re-connecting GitHub
4. see which agents I haven't deployed yet

**Acceptance Criteria:**
- dashboard shows deployed agents with status
- quick access to deployed agent URLs
- one-click deploy for additional agents (GitHub already connected)
- clear list of available agents to deploy

---

## Architecture Overview

### High-Level Components

```
┌─────────────────────────────────────────────────────────┐
│  Next.js 15 App (squad.visheshbaghel.com)               │
│                                                         │
│  Frontend: React + TailwindCSS + shadcn/ui              │
│  (matches portfolio design system)                      │
│                                                         │
│  Pages:                                                 │
│  ├── /              → Agent showcase (landing)          │
│  ├── /[agentId]     → Agent details + visitor mode      │
│  ├── /login         → Login page                        │
│  ├── /signup        → Signup page                       │
│  ├── /dashboard     → User's deployed agents            │
│  └── /deploy/[id]   → Deploy flow for agent             │
│                                                         │
│  API Routes:                                            │
│  ├── /api/auth/*           → Better Auth endpoints      │
│  ├── /api/deploy/github    → GitHub OAuth for fork      │
│  ├── /api/deploy/vercel    → Vercel OAuth for deploy    │
│  ├── /api/deploy/provision → Provision integrations     │
│  └── /api/deploy/create    → Create Vercel deployment   │
└─────────────────────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────┐
│  Database (Neon Postgres)                               │
│                                                         │
│  Tables:                                                │
│  ├── users           → User accounts (Better Auth)      │
│  ├── sessions        → Auth sessions (Better Auth)      │
│  ├── accounts        → OAuth accounts (Better Auth)     │
│  └── deployments     → Deployed agents per user         │
│                                                         │
│  Custom Fields:                                         │
│  ├── users.forked_repo    → GitHub fork reference       │
│  └── deployments.*        → Agent deployments           │
└─────────────────────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────┐
│  External Services                                      │
│                                                         │
│  Better Auth:                                           │
│  ├── GitHub OAuth (signup/login)                        │
│  ├── Google OAuth (signup/login)                        │
│  └── Username/password (fallback)                       │
│                                                         │
│  Vercel API:                                            │
│  ├── OAuth for deployment (one-time, token discarded)   │
│  ├── Project creation                                   │
│  ├── Environment variable setup                         │
│  ├── Neon DB integration provisioning                   │
│  └── AI Gateway integration provisioning                │
│                                                         │
│  GitHub API:                                            │
│  ├── OAuth for repo fork (stored as forked_repo)        │
│  └── Repository forking (one-time per user)             │
│                                                         │
│  Source Repository:                                     │
│  └── github.com/vishesh-baghel/experiments              │
│      └── packages/* (all agents)                        │
└─────────────────────────────────────────────────────────┘
```

### Key Design Decisions

1. **User Management with Better Auth:**
   - Full auth system with dashboard access
   - GitHub OAuth (primary - target audience is developers)
   - Google OAuth (secondary)
   - Username/password fallback (no email verification)
   - Email optional (for invoices only)

2. **Free Deployment Model:**
   - All agents deploy for free
   - Reduces friction to experience agents
   - Funnel users to Overseer (paid, V2)

3. **Token Handling:**
   - Squad auth tokens: Managed by Better Auth (persistent sessions)
   - Vercel OAuth: Used once per deployment, then discarded
   - GitHub OAuth: Fork reference stored, token discarded

4. **Vercel Integrations for Provisioning:**
   - use Vercel's marketplace integrations API
   - automatically provision Neon Postgres
   - automatically provision Vercel AI Gateway
   - user doesn't configure anything manually

5. **Config-Driven Agent Registry:**
   - agents defined in `agents.config.ts`
   - easy to add new agents without code changes
   - each agent specifies: source path, required integrations, env vars

6. **Portfolio Design System:**
   - exact same styling as visheshbaghel.com
   - IBM Plex Mono font
   - 0px border radius (sharp edges)
   - light/dark mode support
   - accent color #FF0000

7. **Transparency:**
   - Explicitly communicate what we store
   - Explicitly communicate what we DON'T store
   - Build trust with technical audience

### Deploy Flow Sequence

```
┌─────────┐     ┌─────────┐     ┌─────────┐     ┌─────────┐
│  User   │     │  Squad  │     │ Vercel  │     │ GitHub  │
└────┬────┘     └────┬────┘     └────┬────┘     └────┬────┘
     │               │               │               │
     │ Click Deploy  │               │               │
     │──────────────>│               │               │
     │               │               │               │
     │ Redirect to   │               │               │
     │ Vercel OAuth  │               │               │
     │<──────────────│               │               │
     │               │               │               │
     │ Authorize     │               │               │
     │──────────────────────────────>│               │
     │               │               │               │
     │ Callback with │               │               │
     │ access_token  │               │               │
     │<──────────────────────────────│               │
     │               │               │               │
     │ Redirect to   │               │               │
     │ GitHub OAuth  │               │               │
     │<──────────────│               │               │
     │               │               │               │
     │ Authorize     │               │               │
     │──────────────────────────────────────────────>│
     │               │               │               │
     │ Callback with │               │               │
     │ access_token  │               │               │
     │<──────────────────────────────────────────────│
     │               │               │               │
     │ Show Progress │               │               │
     │<──────────────│               │               │
     │               │               │               │
     │               │ Fork Repo     │               │
     │               │──────────────────────────────>│
     │               │               │               │
     │               │ Provision     │               │
     │               │ Neon DB       │               │
     │               │──────────────>│               │
     │               │               │               │
     │               │ Provision     │               │
     │               │ AI Gateway    │               │
     │               │──────────────>│               │
     │               │               │               │
     │               │ Create        │               │
     │               │ Deployment    │               │
     │               │──────────────>│               │
     │               │               │               │
     │ Success +     │               │               │
     │ Deploy URL    │               │               │
     │<──────────────│               │               │
     │               │               │               │
```

---

## Authentication Architecture

### Overview

Two completely isolated auth systems:

| Context | Purpose | Where | Method |
|---------|---------|-------|--------|
| **Squad Auth** | Platform access | squad.visheshbaghel.com | Better Auth (OAuth) |
| **Agent Auth** | Agent instance access | user's deployed agents | Custom passphrase + optional SSO |

**Important:** These systems do NOT share any auth state. Squad login does not grant access to agents.

### Squad Auth (Better Auth)

```
┌─────────────────────────────────────────────────────────────────┐
│  SQUAD PLATFORM AUTH                                            │
│  squad.visheshbaghel.com                                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Primary:   GitHub OAuth (target: developers)                   │
│  Secondary: Google OAuth                                        │
│  Fallback:  Username/Password                                   │
│                                                                 │
│  Stores in DB:                                                  │
│  ├── User account (id, name, email, image)                      │
│  ├── OAuth accounts (GitHub, Google links)                      │
│  ├── Sessions (managed by Better Auth)                          │
│  ├── Forked repo reference (for deployments)                    │
│  └── Deployed agents list                                       │
│                                                                 │
│  Does NOT store:                                                │
│  ├── GitHub access tokens (used once, discarded)                │
│  ├── Vercel access tokens (used once, discarded)                │
│  └── Any agent data or passphrases                              │
│                                                                 │
│  COMPLETELY ISOLATED from agent auth                            │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Agent Auth (Custom - Passphrase Based)

Each deployed agent has its own independent auth:

```
┌─────────────────────────────────────────────────────────────────┐
│  AGENT AUTH (per deployed agent)                                │
│  user-jack.vercel.app, user-sensie.vercel.app, etc.             │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Method: Passphrase (unique per agent, user's choice)           │
│  Storage: AGENT_PASSPHRASE_HASH env var (bcrypt)                │
│                                                                 │
│  Modes:                                                         │
│  ├── Visitor mode: No auth required (read-only demo)            │
│  └── Owner mode: Passphrase required for full access            │
│                                                                 │
│  Session: HTTP-only cookie (24h default)                        │
│                                                                 │
│  Implementation: Custom auth (NOT Better Auth)                  │
│  ├── Lightweight, zero external dependencies                    │
│  ├── Works offline                                              │
│  └── Simple: bcrypt verify + cookie session                     │
│                                                                 │
│  Login Page:                                                    │
│  ┌─────────────────────────────────────────┐                    │
│  │  Enter passphrase: [____________]       │                    │
│  │  [Login]                                │                    │
│  │                                         │                    │
│  │  ── or (if OVERSEER_URL is set) ──      │                    │
│  │                                         │                    │
│  │  [I am supreme commander, let me in]    │                    │
│  └─────────────────────────────────────────┘                    │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### SSO via Overseer (V2 - Paid Feature)

For Overseer users, SSO across all their deployed agents:

```
┌─────────────────────────────────────────────────────────────────┐
│  OVERSEER AS USER'S PERSONAL IdP (V2)                           │
│  user-overseer.vercel.app                                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Prerequisites:                                                 │
│  ├── User has purchased Overseer ($99)                          │
│  ├── Overseer is deployed to user's infra                       │
│  └── Other agents have OVERSEER_URL env var set                 │
│                                                                 │
│  Discovery: Agents find Overseer via OVERSEER_URL env var       │
│                                                                 │
│  SSO Flow:                                                      │
│  ┌─────────┐     ┌─────────┐     ┌──────────┐                   │
│  │  Jack   │     │ Overseer│     │  User    │                   │
│  └────┬────┘     └────┬────┘     └────┬─────┘                   │
│       │               │               │                         │
│       │ User clicks   │               │                         │
│       │ "supreme      │               │                         │
│       │ commander"    │               │                         │
│       │──────────────>│               │                         │
│       │               │               │                         │
│       │               │ If not logged │                         │
│       │               │ in, show      │                         │
│       │               │ passphrase    │                         │
│       │               │ prompt        │                         │
│       │               │<──────────────│                         │
│       │               │               │                         │
│       │               │ Verify        │                         │
│       │               │ passphrase    │                         │
│       │               │──────────────>│                         │
│       │               │               │                         │
│       │  Signed JWT   │               │                         │
│       │  + redirect   │               │                         │
│       │<──────────────│               │                         │
│       │               │               │                         │
│       │ Validate JWT  │               │                         │
│       │ Create local  │               │                         │
│       │ session       │               │                         │
│       │               │               │                         │
│  └─────────────────────────────────────────┘                    │
│                                                                 │
│  JWT Payload:                                                   │
│  {                                                              │
│    iss: "overseer",                                             │
│    sub: "owner",                                                │
│    iat: timestamp,                                              │
│    exp: timestamp + 5min,  // short-lived                       │
│    aud: "jack"             // target agent                      │
│  }                                                              │
│                                                                 │
│  Signed with: OVERSEER_JWT_SECRET (shared across agents)        │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Common Agent Auth Module

Lightweight, custom auth package shared by all agents:

```typescript
// packages/shared/agent-auth/index.ts

export interface AgentAuthConfig {
  passphraseHash: string;         // AGENT_PASSPHRASE_HASH from env
  overseerUrl?: string;           // OVERSEER_URL from env (enables SSO)
  jwtSecret?: string;             // OVERSEER_JWT_SECRET for SSO validation
  sessionDuration?: number;       // Default: 24 hours
  cookieName?: string;            // Default: "agent_session"
}

export interface AgentAuthResult {
  authenticated: boolean;
  mode: "visitor" | "owner";
  expiresAt?: Date;
}

// Core functions (always available)
export const verifyPassphrase: (input: string, hash: string) => Promise<boolean>;
export const createSession: (res: Response) => void;
export const validateSession: (req: Request) => AgentAuthResult;
export const clearSession: (res: Response) => void;

// SSO functions (only when OVERSEER_URL is configured)
export const getOverseerLoginUrl: (overseerUrl: string, returnUrl: string) => string;
export const validateOverseerJwt: (token: string, secret: string, agentId: string) => boolean;
```

### Auth Summary Table

| Concern | Solution |
|---------|----------|
| Squad login | Better Auth (GitHub/Google OAuth) |
| Agent login | Custom passphrase auth |
| SSO across agents | Overseer as IdP (V2, paid) |
| Passphrase sharing | User's choice (different per agent recommended) |
| Overseer discovery | `OVERSEER_URL` env var |
| SSO button visibility | Present if `OVERSEER_URL` is set |
| Token format | Signed JWT (short-lived, 5 min) |
| Secret sharing | `OVERSEER_JWT_SECRET` across agents |
| Squad ↔ Agent auth | Completely isolated, no shared state |

---

## Success Criteria

### User Experience

- **Signup:** <30 seconds to create account
- **Deploy Time:** <2 minutes from first click to deployed URL
- **Zero Config:** User provides no manual configuration
- **Clear Progress:** User always knows what's happening

### Technical Reliability

- **OAuth Success Rate:** >95% (fallback to manual instructions)
- **Provisioning Success:** >90% (with clear error messages)
- **Page Load:** <2s for all pages
- **Auth Success Rate:** >99% for login/signup

### Business Goals

- **Portfolio Extension:** Demonstrates production deployment skills
- **Lead Generation:** Visitors experience my work firsthand
- **Authority Building:** Showcases full-stack AI agent expertise
- **Funnel to Overseer:** Dashboard shows Overseer value prop

---

## Technical Stack

### Frontend

- **Framework:** Next.js 15 (App Router)
- **Styling:** TailwindCSS + shadcn/ui
- **Font:** IBM Plex Mono (matching portfolio)
- **Icons:** Lucide React
- **State:** React hooks (no complex state management)

### Backend

- **Runtime:** Next.js API routes
- **Auth:** Better Auth (GitHub, Google, credentials)
- **Database:** Neon Postgres
- **ORM:** Drizzle (Better Auth compatible)

### External APIs

- **Better Auth:** User authentication
- **Vercel API:** Project creation, integration provisioning
- **GitHub API:** Repository forking

### Deployment

- **Hosting:** Vercel
- **Domain:** squad.visheshbaghel.com
- **CI/CD:** GitHub Actions (from experiments monorepo)
- **Database:** Neon Postgres (serverless)

---

## Agent Configuration

Agents are defined in `src/config/agents.ts`:

```typescript
export interface AgentConfig {
  id: string;
  name: string;
  tagline: string;
  description: string;
  features: string[];
  
  // Visitor mode
  demoUrl?: string;          // URL to Vishesh's live version
  
  // Deployment
  sourceRepo: string;
  sourcePath: string;        // path within monorepo
  integrations: ('neon' | 'ai-gateway')[];
  envVars: {
    key: string;
    source: 'integration' | 'user' | 'generated';
    integration?: string;
    description?: string;    // For user-provided vars
  }[];
  
  // Costs
  requirements: {
    name: string;
    cost: string;
    description: string;
  }[];
  estimatedMonthlyCost: string;
  
  // Status
  status: 'available' | 'coming-soon';
}
```

**New Fields:**
- `demoUrl`: Link to visitor mode (Vishesh's live agent)
- `envVars.source: 'generated'`: For auto-generated values like passphrase hash

---

## Timeline & Milestones

### Week 1: Foundation + Design

- [x] project setup (Next.js 15 in experiments/packages/squad)
- [x] copy design system from portfolio (globals.css, fonts, components)
- [x] agent config structure
- [x] landing page with agent cards
- [x] individual agent pages with visitor mode links

### Week 2: Authentication

- [ ] Setup Neon Postgres database
- [ ] Install and configure Better Auth
- [ ] Implement GitHub OAuth
- [ ] Implement Google OAuth
- [ ] Implement username/password fallback
- [ ] Login and signup pages
- [ ] Protected routes middleware

### Week 3: Dashboard + User Management

- [ ] Dashboard page (deployed agents list)
- [ ] User profile with forked repo reference
- [ ] Deployments table and API
- [ ] Privacy/transparency page

### Week 4: Deploy Flow

- [ ] GitHub OAuth for repo forking
- [ ] Vercel OAuth for deployment
- [ ] deploy flow UI (multi-step progress)
- [ ] GitHub repo forking via API
- [ ] Vercel project creation via API

### Week 5: Provisioning + Launch

- [ ] Neon DB provisioning via Vercel integration
- [ ] AI Gateway provisioning via Vercel integration
- [ ] environment variable injection (including passphrase)
- [ ] deployment trigger and status polling
- [ ] success page with deployment details
- [ ] error handling and fallback flows
- [ ] deploy to squad.visheshbaghel.com

---

## Open Questions (Resolved)

| Question | Decision |
|----------|----------|
| Payment integration | V2 (DodoPayments) |
| User accounts | YES - Better Auth with GitHub/Google OAuth |
| Database | Neon Postgres |
| Auth method | Better Auth (OAuth + credentials) |
| Agent auth | Simple passphrase (not connected to Squad) |
| SSO across agents | V2 via Overseer (paid feature) |
| Email notifications | Not in V1 |
| Deployment pricing | Free (funnel to Overseer) |

---

## References

- [Personal Agents Distribution Strategy](/home/vishesh.baghel/Documents/workspace/strategy-docs/PERSONAL_AGENTS_DISTRIBUTION_STRATEGY.md)
- [Portfolio Project](/home/vishesh.baghel/Documents/workspace/portfolio)
- [Jack X Agent](/home/vishesh.baghel/Documents/workspace/experiments/packages/jack-x-agent)
- [Better Auth Docs](https://www.better-auth.com/)
- [Vercel API Docs](https://vercel.com/docs/rest-api)
- [Vercel Deploy Button](https://vercel.com/docs/deploy-button)
