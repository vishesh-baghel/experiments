# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

Squad is a deployment platform that enables one-click deployment of personal AI agents to Vercel infrastructure. Users can deploy pre-configured AI agents (like Jack, Sensie) to their own Vercel account with automatic GitHub repo forking and database provisioning.

**Core Value Proposition**: Zero-config deployment of production-ready AI agents. Users go from landing page to deployed agent in under 5 minutes with automatic setup of database, environment variables, and integrations.

## Essential Commands

```bash
pnpm dev                  # Start Next.js dev server (localhost:3001)
pnpm build                # Build for production
pnpm start                # Run production build
pnpm lint                 # Run ESLint
pnpm test                 # Run all tests once
pnpm test:watch           # Run tests in watch mode
```

## Architecture

### Deploy Flow (Single Step)

```
User visits /deploy/[agentId]
         ↓
POST /api/deploy/start → Creates iron-session with agentId
         ↓
User clicks Vercel Deploy Button (opens Vercel in new window)
         ↓
Vercel clones repo → provisions database → creates project
         ↓
Vercel redirects → GET /api/deploy/vercel/callback
         ↓
Callback stores deployment info in session → marks step complete
         ↓
User redirected to /deploy/[agentId]?success=true
         ↓
UI shows success → links to guide page
         ↓
User visits /deploy/[agentId]/guide for post-deployment setup
```

### Key Design Decisions

**Why Vercel Deploy Button over custom OAuth?**
- Simpler UX: One button click vs multi-step OAuth flow
- Vercel handles repo cloning, database provisioning, and env var setup
- No need to store OAuth tokens or manage GitHub API
- Built-in retry and error handling
- Users maintain full control (repo forked to their GitHub)

**Why iron-session over database?**
- Deploy sessions are temporary (30 minutes)
- No persistent data needed after deployment completes
- Encrypted cookie-based storage (secure, no DB required)
- Automatic expiration and cleanup
- Simpler infrastructure (no DB setup for Squad itself)

**Why single-step flow?**
- Originally designed for multi-step (OAuth → Provision → Deploy)
- Vercel Deploy Button handles all steps atomically
- Kept step infrastructure for potential future enhancements
- Clean separation of concerns (types, session, UI)

## Core Components

### Agent Configuration (`src/config/agents.ts`)

Central configuration file defining all deployable agents. Each `AgentConfig` includes:

**Metadata:**
- `id`, `name`, `tagline`, `description`
- `status`: "available" | "coming-soon"
- `estimatedMonthlyCost`: Display cost estimate
- `demoUrl`, `specUrl`: Optional links

**Technical Config:**
- `sourceRepo`: GitHub repository URL
- `sourcePath`: Path within repo (empty for root)
- `integrations`: Array of integrations ("neon", "prisma", "ai-gateway")
- `envVars`: Array of env var configs with source ("integration", "user", "generated")

**User-Facing Content:**
- `features`: Array of feature descriptions
- `requirements`: Array of service requirements with costs
- `deployInstructions`: Step-by-step deploy guide (shown on deploy page)
- `guideSteps`: Post-deployment setup steps (shown on guide page)

**Helper Functions:**
- `getAgentById(id)`: Get single agent by ID
- `getAvailableAgents()`: Filter by status === "available"
- `getComingSoonAgents()`: Filter by status === "coming-soon"

### Deploy Session Management (`src/lib/deploy/`)

**Types (`types.ts`):**
```typescript
DeploySession {
  agentId: string
  currentStep: "vercel-deploy"
  steps: DeployStepState[]
  vercel?: {...}  // Populated from callback
  createdAt: number
  expiresAt: number  // 30 minutes from creation
}
```

**Session Operations (`session.ts`):**
- Uses iron-session for encrypted cookie storage
- Session name: `squad_deploy_session`
- Secure in production, httpOnly, sameSite: lax
- Auto-expires after 30 minutes
- Functions:
  - `getDeploySession()`: Get current session, auto-clears if expired
  - `createDeploySession(agentId)`: Initialize new session
  - `updateDeploySession(updates)`: Partial update
  - `updateStepStatus(stepId, status, error?)`: Update specific step
  - `storeVercelDeployment(data)`: Save callback data
  - `clearDeploySession()`: Destroy session

### API Endpoints

**`POST /api/deploy/start`**
- Creates deploy session for agentId
- Validates agent exists and status === "available"
- Forces new session if agentId changed or step count outdated
- Returns session object

**`GET /api/deploy/vercel/callback`**
- Receives Vercel Deploy Button callback
- Query params: project-name, project-dashboard-url, deployment-url, deployment-dashboard-url, repository-url, state
- Decodes base64url state to get agentId (fallback to session)
- Stores deployment info in session
- Marks vercel-deploy step as "completed"
- Redirects to `/deploy/[agentId]?success=true`

### Analytics (`src/lib/analytics.ts`)

PostHog integration tracking:

**Page Views:**
- `trackAgentPageView(agentId)` - Agent detail page
- `trackDeployPageView(agentId)` - Deploy flow page
- `trackGuidePageView(agentId)` - Setup guide page

**User Interactions:**
- `trackAgentCardClick(agentId)` - Agent card clicked
- `trackDemoClick(agentId, url)` - Demo link clicked
- `trackSpecClick(agentId)` - Spec link clicked

**Deploy Flow:**
- `trackDeployStart(agentId)` - Deploy flow initiated
- `trackDeployButtonClick(agentId)` - Vercel button clicked
- `trackDeploySuccess(agentId, url)` - Deployment succeeded
- `trackDeployFailure(agentId, step, error)` - Deployment failed

**Setup Guide:**
- `trackGuideStepView(agentId, index, title)` - Guide step viewed
- `trackGuideComplete(agentId)` - All steps completed

**Other:**
- `trackExternalLinkClick(type, url, agentId?)` - External link clicked
- `trackError(type, message, context?)` - Error occurred

Configuration:
- `NEXT_PUBLIC_POSTHOG_KEY`: Required
- `NEXT_PUBLIC_POSTHOG_HOST`: Defaults to us.i.posthog.com
- Initialized client-side only
- `person_profiles: "identified_only"` (no auto profile creation)
- `capture_pageview: false` (manual page tracking)

### Page Structure

**`/` (Home):**
- Lists all agents (available + coming-soon)
- Uses `AgentCard` component
- Filters by status

**`/[agentId]` (Agent Detail):**
- Shows agent features, requirements, demo link
- "Deploy to Vercel" CTA button
- Links to specs if available
- Tracks page view via `AgentPageTracker`

**`/deploy/[agentId]` (Deploy Flow):**
- Initializes session on mount
- Shows Vercel Deploy Button with state parameter
- State contains base64url-encoded `{ agentId }`
- Deploy button URL: `https://vercel.com/new/clone?repository-url={sourceRepo}&repository-name={agentId}-{timestamp}&env=...`
- Displays deploy progress/success/error states
- Tracks deploy flow events
- Component: `DeployFlow`

**`/deploy/[agentId]/guide` (Setup Guide):**
- Post-deployment instructions
- Steps from `agent.guideSteps`
- Links to Vercel dashboard, documentation
- Tracks step views and completion
- Component: `GuidePageTracker`

## Environment Variables

Required:
- `SESSION_SECRET`: 32-character secret for iron-session encryption (generate with `openssl rand -hex 16`)
- `NEXT_PUBLIC_APP_URL`: App base URL (e.g., http://localhost:3001)

Optional:
- `SOURCE_REPO_NAME`: Repository name (default: "experiments")
- `NEXT_PUBLIC_POSTHOG_KEY`: PostHog API key
- `NEXT_PUBLIC_POSTHOG_HOST`: PostHog host (default: https://us.i.posthog.com)

## Testing Strategy

Tests use Vitest + React Testing Library with happy-dom environment.

**Test Organization:**
- `__tests__/components/` - Component tests
- `__tests__/api/` - API route tests
- `__tests__/lib/` - Utility function tests
- `__tests__/config/` - Configuration tests

**Component Tests:**
- `AgentCard`: Render, click tracking, status badges
- `DeployButton`: Vercel button rendering, click tracking
- `DeployProgress`: Step states, success/error display
- `DeployError`: Error messages, retry functionality
- Analytics trackers: Page view tracking

**API Tests:**
- `/api/deploy/start`: Session creation, validation

**Config Tests:**
- `agents.ts`: Helper functions, agent validation

**Setup:**
- `vitest.config.ts`: Test configuration
- `__tests__/setup.ts`: Global test setup

## Tech Stack

- **Framework**: Next.js 15 (App Router)
- **UI Components**: shadcn/ui (Radix UI primitives)
- **Styling**: TailwindCSS 4 + IBM Plex Mono font
- **Session Management**: iron-session (encrypted cookies)
- **Analytics**: PostHog
- **Testing**: Vitest + React Testing Library + happy-dom
- **Deployment**: Vercel

## Adding a New Agent

1. **Create Agent Configuration** in `src/config/agents.ts`:

```typescript
export const newAgent: AgentConfig = {
  id: "new-agent",
  name: "new agent",
  tagline: "your agent tagline",
  description: "what this agent does",
  features: [
    {
      title: "feature 1",
      description: "what it does",
    },
  ],
  requirements: [
    {
      name: "vercel account",
      cost: "free",
      description: "for hosting",
    },
  ],
  sourceRepo: "https://github.com/username/repo",
  sourcePath: "", // or "packages/agent-name" if in monorepo
  integrations: ["prisma", "ai-gateway"],
  envVars: [
    {
      key: "DATABASE_URL",
      source: "integration",
      integration: "prisma",
      description: "database connection",
      required: true,
    },
  ],
  deployInstructions: [
    {
      step: 1,
      title: "click deploy",
      description: "detailed step",
    },
  ],
  guideSteps: [
    {
      title: "verify deployment",
      description: "check dashboard",
      link: {
        text: "open dashboard",
        url: "https://vercel.com/dashboard",
      },
    },
  ],
  status: "available", // or "coming-soon"
  estimatedMonthlyCost: "~$X/month",
  demoUrl: "https://demo.example.com", // optional
  specUrl: "https://github.com/.../specs", // optional
};
```

2. **Add to agents array**:
```typescript
export const agents: AgentConfig[] = [jackAgent, sensieAgent, newAgent];
```

3. **Test the configuration**:
```bash
pnpm test __tests__/config/agents.test.ts
```

4. **Verify in dev**:
```bash
pnpm dev
# Visit http://localhost:3001
# Check agent card appears
# Test deploy flow
```

## Deploy Button URL Format

Vercel Deploy Button URL is constructed as:
```
https://vercel.com/new/clone
  ?repository-url={sourceRepo}
  &repository-name={agentId}-{timestamp}
  &project-name={agentId}-{timestamp}
  &redirect-url={callbackUrl}
  &env={envVarKeys}
```

State parameter:
- Base64url-encoded JSON: `{ agentId: string }`
- Passed back in callback to identify which agent was deployed
- Fallback to session if state decode fails

## Common Workflows

### Testing Deploy Flow Locally

1. Set up ngrok or similar to expose localhost:
```bash
ngrok http 3001
```

2. Update `.env`:
```bash
NEXT_PUBLIC_APP_URL=https://your-ngrok-url.ngrok.io
```

3. Test deploy:
- Visit https://your-ngrok-url.ngrok.io/deploy/jack
- Click Vercel button
- Complete Vercel flow
- Verify callback redirects back correctly

### Adding Analytics Events

1. Add event function in `src/lib/analytics.ts`:
```typescript
export const trackNewEvent = (param: string) => {
  if (typeof window === "undefined" || !initialized) return;
  posthog.capture("new_event", { param });
};
```

2. Call from component:
```typescript
import { trackNewEvent } from "@/lib/analytics";

const handleClick = () => {
  trackNewEvent("value");
  // ... rest of logic
};
```

3. Test locally (events logged to console if PostHog not configured)

### Debugging Session Issues

**Session not persisting:**
- Check `SESSION_SECRET` is set in `.env`
- Verify cookies are enabled in browser
- Check cookie domain/path in DevTools
- Ensure session operations are `await`ed

**Session expired:**
- Default TTL: 30 minutes
- Adjust in `getSessionOptions()` if needed
- Sessions auto-clear on expiration

**Session data lost:**
- Verify `session.save()` is called after updates
- Check session middleware is applied
- Ensure Next.js cookies are awaited: `await cookies()`

## Important Patterns

### Path Aliases

Uses `@/` alias pointing to `src/`:
```typescript
import { getAgentById } from "@/config/agents";
import { trackPageView } from "@/lib/analytics";
import { Button } from "@/components/ui/button";
```

### Component Organization

```
components/
├── ui/                    # shadcn/ui primitives (Button, etc.)
├── sections/              # Layout sections (Header, Footer)
├── deploy/                # Deploy flow components
├── analytics/             # Analytics tracker components
├── agent-card.tsx         # Agent list card
├── theme-provider.tsx     # Dark mode provider
└── posthog-provider.tsx   # PostHog initialization
```

### Server vs Client Components

- API routes: Server-side only
- Session operations: Server-side only (uses cookies())
- Analytics tracking: Client-side only (PostHog browser SDK)
- Page components: Server by default, use "use client" for interactivity
- Deploy flow: Client component (manages state, calls APIs)

### Error Handling

Deploy flow errors are handled at multiple levels:

1. **API validation**: Agent not found, coming-soon status
2. **Session errors**: Creation/update failures
3. **Callback errors**: Missing params, storage failures
4. **UI errors**: Display via `DeployError` component with retry

Errors redirect to deploy page with query param:
- `?error=missing_deployment_info`
- `?error=callback_failed`
- `?success=true` for success case

## PostHog Integration

**Client-Side Only:**
- Initialized in `PostHogProvider` component
- Wrapped around app in `layout.tsx`
- Uses `posthog-js` browser SDK

**Page View Tracking:**
- Custom tracking (not automatic)
- Dedicated tracker components:
  - `AgentPageTracker` - Tracks agent detail views
  - `DeployPageTracker` - Tracks deploy flow views
  - `GuidePageTracker` - Tracks guide views
- Placed in page components, use `useEffect` to capture on mount

**Event Properties:**
- Always include `agent_id` when relevant
- Include URLs for link clicks
- Include step info for guide tracking
- Include error details for failures

## Deployment

**Vercel Deployment:**
1. Connect GitHub repository
2. Set environment variables in Vercel dashboard:
   - `SESSION_SECRET` (required)
   - `NEXT_PUBLIC_APP_URL` (set to vercel domain)
   - `NEXT_PUBLIC_POSTHOG_KEY` (optional)
3. Deploy
4. Verify callback URL matches: `{domain}/api/deploy/vercel/callback`

**Environment-Specific Config:**
- Development: `NEXT_PUBLIC_APP_URL=http://localhost:3001`
- Production: `NEXT_PUBLIC_APP_URL=https://squad.yourdomain.com`
- Session cookies set `secure: true` in production

## Troubleshooting

### Deploy Button Not Working
- Verify source repository URL is public
- Check callback URL format in button href
- Ensure state parameter is properly base64url-encoded
- Check Vercel Deploy Button documentation for changes

### Callback Not Receiving Data
- Verify callback route exists: `/api/deploy/vercel/callback/route.ts`
- Check query parameters in URL
- Ensure session exists before callback
- Check server logs for errors

### Analytics Not Tracking
- Verify `NEXT_PUBLIC_POSTHOG_KEY` is set
- Check PostHog is initialized (console logs)
- Ensure events called client-side only
- Check PostHog dashboard for events

### Session Issues
- Generate new `SESSION_SECRET` if corrupted
- Clear browser cookies for domain
- Check session TTL (30 minutes)
- Verify iron-session version compatibility

## CI/CD

GitHub Actions workflow (`.github/workflows/test.yml`):
- Runs on push/PR to main for `packages/squad/**` changes
- Path filtering to run tests only when squad files change
- Steps:
  1. Install dependencies (`pnpm install --frozen-lockfile`)
  2. Run tests (`pnpm --filter squad test --run`)
  3. Build (`pnpm --filter squad build`)
  4. Lint (`pnpm --filter squad lint`)
