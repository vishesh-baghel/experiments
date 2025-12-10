# Squad - Personal Agents Deployment Service

> "hyper personalised agents i built, deploy them for yourself and let them do your boring work"

**Version:** 0.1.0 (MVP)  
**Author:** Vishesh Baghel  
**Last Updated:** Dec 10, 2025  
**Status:** Draft - Pre-Implementation

---

## Table of Contents

1. [Problem Statement](#problem-statement)
2. [Goals & Non-Goals](#goals--non-goals)
3. [User Stories](#user-stories)
4. [Architecture Overview](#architecture-overview)
5. [Success Criteria](#success-criteria)
6. [Technical Stack](#technical-stack)
7. [Timeline & Milestones](#timeline--milestones)

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
- future monetization through convenience (paid deployment tier)

### Vision

squad is a deployment service that lets anyone deploy my personal AI agents to their own infrastructure with one click. users connect their Vercel + GitHub accounts, we provision all required services (database, AI gateway), and deploy a fully configured agent in under 2 minutes.

**Time Savings:** 60 minutes manual setup → 2 minutes with squad

---

## Goals & Non-Goals

### V1 (MVP)

**Core Features:**
- landing page showcasing available agents (jack, sensie)
- individual agent pages with detailed descriptions
- 1-click deploy flow via Vercel + GitHub OAuth
- automatic provisioning of required integrations (Neon DB, Vercel AI Gateway)
- configurable agent registry (add new agents via config file)
- design system matching portfolio (IBM Plex Mono, minimalist, sharp edges)

**Authentication:**
- Vercel OAuth for deployment permissions
- GitHub OAuth for repo cloning
- no user accounts or login required (stateless flow)

**What's NOT in V1:**
- payment integration (DodoPayments planned for V2)
- user dashboard or deployment history
- analytics or usage tracking
- email notifications

### V2 (Post-MVP)

- DodoPayments integration for "fast deploy" tier
- deployment tracking and history
- custom domain setup assistance
- advanced configuration options
- usage analytics for deployed agents

---

## User Stories

### Primary User Story

**As a developer/creator visiting Vishesh's portfolio,**

I want to:
1. browse the available AI agents he's built
2. understand what each agent does and why it's useful
3. deploy an agent to my own infrastructure without reading docs

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

#### 2. Learn About an Agent

**As a visitor**, I want to:
1. click on an agent (e.g., jack)
2. see detailed description of what it does
3. understand the requirements (Vercel account, costs)
4. see what integrations will be provisioned

**Acceptance Criteria:**
- dedicated page for each agent
- clear explanation of features
- transparent about costs (~$15/month for jack)
- shows required integrations (Neon, AI Gateway)

#### 3. Deploy an Agent

**As a visitor**, I want to:
1. click "deploy" on an agent page
2. connect my Vercel account (OAuth)
3. connect my GitHub account (OAuth)
4. see integrations being provisioned
5. get my deployed agent URL

**Acceptance Criteria:**
- total flow under 2 minutes
- clear progress indicators
- automatic Neon DB provisioning
- automatic Vercel AI Gateway setup
- success page with deployment URL

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
│  ├── /jack          → Jack agent details                │
│  ├── /sensie        → Sensie agent details (coming)     │
│  └── /deploy/[id]   → Deploy flow for agent             │
│                                                         │
│  API Routes:                                            │
│  ├── /api/auth/vercel       → Vercel OAuth callback     │
│  ├── /api/auth/github       → GitHub OAuth callback     │
│  ├── /api/deploy/provision  → Provision integrations    │
│  └── /api/deploy/create     → Create Vercel deployment  │
└─────────────────────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────┐
│  External Services                                      │
│                                                         │
│  Vercel API:                                            │
│  ├── OAuth for user authorization                       │
│  ├── Project creation                                   │
│  ├── Environment variable setup                         │
│  ├── Neon DB integration provisioning                   │
│  └── AI Gateway integration provisioning                │
│                                                         │
│  GitHub API:                                            │
│  ├── OAuth for user authorization                       │
│  └── Repository forking/cloning                         │
│                                                         │
│  Source Repository:                                     │
│  └── github.com/vishesh-baghel/experiments              │
│      └── packages/jack-x-agent                          │
└─────────────────────────────────────────────────────────┘
```

### Key Design Decisions

1. **Stateless Flow (V1):**
   - no database needed for squad itself
   - OAuth tokens used only during deployment session
   - no user accounts or persistent state
   - simplifies MVP significantly

2. **Vercel Integrations for Provisioning:**
   - use Vercel's marketplace integrations API
   - automatically provision Neon Postgres
   - automatically provision Vercel AI Gateway
   - user doesn't configure anything manually

3. **Config-Driven Agent Registry:**
   - agents defined in `agents.config.ts`
   - easy to add new agents without code changes
   - each agent specifies: source path, required integrations, env vars

4. **Portfolio Design System:**
   - exact same styling as visheshbaghel.com
   - IBM Plex Mono font
   - 0px border radius (sharp edges)
   - light/dark mode support
   - accent color #FF0000

5. **OAuth App (Not Vercel Integration):**
   - standard OAuth 2.0 flow with Vercel
   - we store tokens only during deployment session
   - simpler to implement than marketplace integration
   - sufficient for V1 scope

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

## Success Criteria

### User Experience

- **Deploy Time:** <2 minutes from first click to deployed URL
- **Zero Config:** User provides no manual configuration
- **Clear Progress:** User always knows what's happening

### Technical Reliability

- **OAuth Success Rate:** >95% (fallback to manual instructions)
- **Provisioning Success:** >90% (with clear error messages)
- **Page Load:** <2s for all pages

### Business Goals

- **Portfolio Extension:** Demonstrates production deployment skills
- **Lead Generation:** Visitors experience my work firsthand
- **Authority Building:** Showcases full-stack AI agent expertise

---

## Technical Stack

### Frontend

- **Framework:** Next.js 15 (App Router)
- **Styling:** TailwindCSS + shadcn/ui
- **Font:** IBM Plex Mono (matching portfolio)
- **Icons:** Lucide React
- **State:** React hooks (no complex state management)

### Backend

- **Runtime:** Next.js API routes (Edge-compatible)
- **Auth:** OAuth 2.0 (Vercel + GitHub)
- **No Database:** Stateless design for V1

### External APIs

- **Vercel API:** Project creation, integration provisioning
- **GitHub API:** Repository forking
- **No persistent storage** in V1

### Deployment

- **Hosting:** Vercel
- **Domain:** squad.visheshbaghel.com
- **CI/CD:** GitHub Actions (from experiments monorepo)

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
  requirements: {
    name: string;
    cost: string;
    description: string;
  }[];
  sourceRepo: string;
  sourcePath: string;  // path within monorepo
  integrations: ('neon' | 'ai-gateway')[];
  envVars: {
    key: string;
    source: 'integration' | 'user';
    integration?: string;
  }[];
  status: 'available' | 'coming-soon';
  estimatedMonthlyCost: string;
}
```

---

## Timeline & Milestones

### Week 1: Foundation

- [ ] project setup (Next.js 15 in experiments/packages/squad)
- [ ] copy design system from portfolio (globals.css, fonts, components)
- [ ] agent config structure
- [ ] landing page with agent cards
- [ ] individual agent pages

### Week 2: OAuth + Deploy Flow

- [ ] Vercel OAuth setup and callback
- [ ] GitHub OAuth setup and callback
- [ ] deploy flow UI (multi-step progress)
- [ ] session management for tokens (in-memory/cookies)

### Week 3: Provisioning + Deployment

- [ ] GitHub repo forking via API
- [ ] Vercel project creation via API
- [ ] Neon DB provisioning via Vercel integration
- [ ] AI Gateway provisioning via Vercel integration
- [ ] environment variable injection
- [ ] deployment trigger and status polling

### Week 4: Polish + Launch

- [ ] error handling and fallback flows
- [ ] success page with deployment details
- [ ] responsive design testing
- [ ] documentation for adding new agents
- [ ] deploy to squad.visheshbaghel.com

---

## Open Questions (Resolved)

| Question | Decision |
|----------|----------|
| Payment integration | V2 (DodoPayments) |
| User accounts | No - stateless flow |
| Database | None needed for V1 |
| Vercel Integration vs OAuth | OAuth app |
| Email notifications | Not in V1 |

---

## References

- [Personal Agents Distribution Strategy](/home/vishesh.baghel/Documents/workspace/strategy-docs/PERSONAL_AGENTS_DISTRIBUTION_STRATEGY.md)
- [Portfolio Project](/home/vishesh.baghel/Documents/workspace/portfolio)
- [Jack X Agent](/home/vishesh.baghel/Documents/workspace/experiments/packages/jack-x-agent)
- [Vercel API Docs](https://vercel.com/docs/rest-api)
- [Vercel Deploy Button](https://vercel.com/docs/deploy-button)
