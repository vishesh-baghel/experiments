# Squad

> hyper personalised agents i built, deploy them for yourself and let them do your boring work

Squad is a deployment service that lets anyone deploy my personal AI agents to their own infrastructure with one click.

## Features

- **1-Click Deploy**: Connect Vercel + GitHub, we provision everything automatically
- **Zero Config**: Database, AI gateway, and all env vars set up for you
- **You Own It**: Code gets forked to your GitHub, deploys to your Vercel

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

# Build for production
pnpm build
```

## Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Styling**: TailwindCSS + shadcn/ui
- **Font**: IBM Plex Mono
- **APIs**: Vercel API, GitHub API

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
  integrations: ["neon", "ai-gateway"],
  envVars: [...],
  status: "coming-soon", // or "available"
  estimatedMonthlyCost: "~$X/month",
};

// Add to agents array
export const agents: AgentConfig[] = [jackAgent, sensieAgent, newAgent];
```

## License

MIT
