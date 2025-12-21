# Squad

> hyper personalised agents i built, deploy them for yourself and let them do your boring work

Squad is a deployment platform that lets anyone deploy my personal AI agents to their own infrastructure with one click.

## Features

- **1-Click Deploy**: Deploy via Vercel Deploy Button with automatic Prisma Postgres provisioning
- **Zero Config**: Database and environment variables configured automatically
- **You Own It**: Code gets forked to your GitHub, deploys to your Vercel
- **Setup Guide**: Step-by-step post-deployment configuration instructions

## Available Agents

### Jack
X content agent that learns your voice. Named after Jack Dorsey.
- Tracks 50-100 creators you follow
- Generates ideas from trending topics
- Learns from your "good" posts
- ~$15/month to run

### Sensie (Coming Soon)
Learning agent that tracks everything you learn.
- Your personal teacher in the age of AI
- Makes sure you're not getting dumb with new AI tools

## Development

```bash
# Install dependencies
pnpm install

# Run development server
pnpm dev

# Run tests
pnpm test

# Run tests in watch mode
pnpm test:watch

# Build for production
pnpm build

# Lint
pnpm lint
```

## Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Styling**: TailwindCSS + shadcn/ui
- **Font**: IBM Plex Mono
- **Testing**: Vitest + React Testing Library
- **Analytics**: PostHog
- **APIs**: Vercel Deploy Button, Prisma Postgres

## Project Structure

```
src/
  app/                    # Next.js App Router pages
    [agentId]/            # Agent detail pages
    deploy/[agentId]/     # Deploy flow pages
    api/deploy/           # Deploy API endpoints
  components/             # React components
    deploy/               # Deploy flow components
    sections/             # Layout sections (header, footer)
    ui/                   # shadcn/ui components
  config/                 # Agent configurations
  lib/                    # Utilities and helpers
    deploy/               # Deploy session management
    analytics.ts          # PostHog event tracking
  __tests__/              # Test files
```

## Adding New Agents

Edit `src/config/agents.ts` to add new agent configurations:

```typescript
export const newAgent: AgentConfig = {
  id: "new-agent",
  name: "new agent",
  tagline: "your agent tagline",
  description: "what this agent does",
  features: [...],
  requirements: [...],
  sourceRepo: "https://github.com/vishesh-baghel/experiments",
  sourcePath: "packages/new-agent",
  integrations: ["prisma", "ai-gateway"],
  envVars: [...],
  deployInstructions: [...],
  guideSteps: [...],
  status: "coming-soon", // or "available"
  estimatedMonthlyCost: "~$X/month",
};

// Add to agents array
export const agents: AgentConfig[] = [jackAgent, sensieAgent, newAgent];
```

## Testing

The project uses Vitest for testing with React Testing Library for component tests.

```bash
# Run all tests
pnpm test

# Run tests in watch mode
pnpm test:watch
```

Test coverage includes:
- API endpoint tests (deploy/start, vercel/authorize, vercel/callback)
- Component tests (AgentCard, OAuthButton, DeployError, DeployProgress)
- Configuration tests (agents.ts validation)
- Deploy session type tests

## CI/CD

GitHub Actions workflow runs on every push to main:
- Runs test suite
- Builds the application
- Runs linting

## License

MIT
