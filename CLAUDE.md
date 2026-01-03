# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository Overview

This is a monorepo containing production-ready AI experiments and integration patterns. It uses pnpm workspaces with Turborepo for build orchestration. Each package is self-contained with its own documentation and can be run independently.

## Essential Commands

### Root-Level Commands
```bash
pnpm install              # Install all dependencies (uses pnpm workspaces)
pnpm build                # Build all packages (orchestrated by Turbo)
pnpm dev                  # Run all packages in dev mode
pnpm lint                 # Lint all packages
pnpm test                 # Run tests across all packages
pnpm clean                # Clean all build outputs
```

### Package-Specific Commands
```bash
# Run command in specific package
pnpm --filter <package-name> <command>

# Examples:
pnpm --filter llm-router dev
pnpm --filter llm-router test
pnpm --filter jack build
pnpm --filter squad test
```

## Repository Structure

### Workspace Configuration
- **Package Manager**: pnpm (v10.18.2+) with workspaces
- **Build System**: Turborepo (configured in `turbo.json`)
- **Node Version**: >= 18.0.0
- **Workspace Root**: `packages/*`

### Available Packages

#### 1. llm-router (`packages/llm-router/`)
**Type**: Pure utility library
**Purpose**: Intelligent LLM routing based on query complexity and cost optimization
**Tech Stack**: TypeScript, Vitest, AI SDK (OpenAI, Anthropic, Google)

Key Commands:
```bash
cd packages/llm-router
pnpm dev                  # Run demo with example queries
pnpm test                 # Run test suite
pnpm test:coverage        # Run tests with coverage
pnpm benchmark            # Run cost/performance benchmarks
pnpm train                # Train ML classifier (optional)
pnpm precompute           # Precompute embeddings for semantic cache
```

Core Architecture:
- **Complexity Analyzer**: Heuristic-based query classification (simple/moderate/complex/reasoning)
- **Model Selector**: Cost-optimized model selection across providers
- **Cost Calculator**: Token estimation and cost tracking
- **Semantic Cache**: Optional Redis/Upstash-backed caching layer
- **ML Classifier**: Optional embeddings-based complexity classification

Exports:
- `LLMRouter` - Main router class
- `ComplexityAnalyzer`, `ModelSelector`, `CostCalculator` - Component classes
- `SemanticCache` - Caching layer
- Model configurations and types

#### 2. llm-router-ui (`packages/llm-router-ui/`)
**Type**: Next.js web application
**Purpose**: Web UI demonstrating LLM router with live benchmarks
**Tech Stack**: Next.js 16, React 19, TailwindCSS, shadcn/ui

Key Commands:
```bash
cd packages/llm-router-ui
pnpm dev                  # Start dev server (http://localhost:3000)
pnpm build                # Build for production
pnpm start                # Run production build
```

Features:
- Interactive router demo with live cost comparison
- Benchmark results visualization
- Model selection interface

#### 3. jack-x-agent (`packages/jack-x-agent/`)
**Type**: Full-stack Next.js application with database
**Purpose**: AI-powered X (Twitter) content agent that learns from user's writing style
**Tech Stack**: Next.js 16, Mastra, Prisma, PostgreSQL, Langfuse

This package has its own `CLAUDE.md` at `packages/jack-x-agent/CLAUDE.md`. Refer to that file for detailed Jack-specific architecture and commands.

Key Commands:
```bash
cd packages/jack-x-agent
pnpm dev                  # Start Next.js dev server (http://localhost:3000)
pnpm test                 # Run unit tests
pnpm test:integration     # Run integration tests
pnpm db:generate          # Generate Prisma client
pnpm db:migrate           # Run database migrations
pnpm db:studio            # Open Prisma Studio
```

#### 4. squad (`packages/squad/`)
**Type**: Next.js marketing/deployment platform
**Purpose**: 1-click deployment platform for personal AI agents
**Tech Stack**: Next.js 15, TailwindCSS, PostHog, Vitest

Key Commands:
```bash
cd packages/squad
pnpm dev                  # Start dev server (http://localhost:3001)
pnpm test                 # Run test suite
pnpm build                # Build for production
```

Features:
- Vercel Deploy Button integration
- Deploy session management
- Agent configuration system (edit `src/config/agents.ts` to add agents)

## Turborepo Configuration

The monorepo uses Turborepo for efficient task orchestration:

- **Build Task**: Depends on `^build` (builds dependencies first), outputs to `dist/`, `.next/`
- **Dev Task**: No cache, runs persistently
- **Lint Task**: Depends on `^build`
- **Test Task**: Depends on `^build`
- **Clean Task**: No cache, removes build artifacts

## Important Patterns

### Package Dependencies
- `llm-router` is a standalone library with peer dependencies on AI SDKs
- `llm-router-ui` depends on `llm-router` (via file: protocol)
- `jack-x-agent` and `squad` are independent Next.js apps

### Testing Strategy
Each package has its own testing setup:
- **llm-router**: Vitest with coverage
- **llm-router-ui**: Next.js testing (if configured)
- **jack-x-agent**: Vitest with unit/integration separation
- **squad**: Vitest with React Testing Library

### Environment Variables
Each package manages its own `.env` file. Common patterns:
- `.env.example` files provide templates
- AI provider keys (OpenAI, Anthropic, etc.) in packages using LLMs
- Database URLs for packages with Prisma
- Service-specific keys (Langfuse, PostHog, etc.)

### TypeScript Configuration
- Root `tsconfig.json` provides base configuration
- Each package extends base config with package-specific settings
- Path alias `@/` points to package root (common in Next.js packages)

## Git Workflow

Recent commits show:
- Active development on jack-x-agent (auth, Apify integration, tests, tone config)
- Monorepo uses feature branches with PR workflow
- CI/CD via GitHub Actions (`.github/workflows/test.yml`)

### CI/CD Pipeline
The test workflow:
- Triggers on push/PR to main for `packages/squad/**` and `packages/jack-x-agent/**`
- Uses path filtering to run tests only for changed packages
- Runs tests, builds, and linting for affected packages
- jack-x-agent requires database setup (Prisma migrations)

## Design Philosophy

From the root README:
1. **Educational First** - Each experiment teaches patterns, not just code
2. **Production Quality** - Real-world code, not toy examples
3. **Actually Usable** - Works in dev/staging environments
4. **Well Documented** - Comprehensive guides and examples
5. **Open Source** - MIT licensed

## Common Workflows

### Adding a New Package
1. Create directory in `packages/`
2. Add `package.json` with workspace-compatible name
3. Package auto-discovered via `pnpm-workspace.yaml` (`packages/*` pattern)
4. Add package-specific commands to its `package.json`
5. Configure Turborepo tasks if needed
6. Add to CI/CD workflow if requiring automated tests

### Working on Specific Package
1. `cd packages/<package-name>` or use `pnpm --filter`
2. Install package-specific dependencies: `pnpm install`
3. Reference other workspace packages using workspace protocol or file path
4. Run package commands directly or via filter from root

### Running Tests Across Packages
```bash
# From root - runs all tests
pnpm test

# Specific package
pnpm --filter llm-router test

# With coverage
pnpm --filter jack test:ci
```

### Building for Production
```bash
# Build all packages (Turbo handles dependency order)
pnpm build

# Build specific package and its dependencies
pnpm --filter llm-router build
```

## Cost Optimization Patterns

The llm-router package demonstrates production cost optimization:
- Route 90% of simple queries to cheap models (GPT-3.5, Claude Haiku)
- Use expensive models (GPT-4, Claude Opus, o1) only for complex/reasoning tasks
- Track cost savings with metadata
- Example: 10K queries/day can save $2,460/month with intelligent routing

## Key Technologies

### Core Stack
- **Runtime**: Node.js 18+
- **Language**: TypeScript 5.7+
- **Package Manager**: pnpm 8+ (workspace mode)
- **Build System**: Turborepo 2.3+

### Frontend
- **Framework**: Next.js 15/16 (App Router)
- **Styling**: TailwindCSS 4 with shadcn/ui components
- **UI State**: React 19

### AI/ML
- **AI SDK**: Vercel AI SDK 4.x
- **Providers**: OpenAI, Anthropic, Google (via AI SDK)
- **Agent Framework**: Mastra 0.20+ (used in jack-x-agent)
- **Observability**: Langfuse (LLM tracing)

### Data/Infrastructure
- **Database**: PostgreSQL with Prisma ORM (jack-x-agent)
- **Cache**: Redis/Upstash Vector (llm-router semantic cache)
- **Testing**: Vitest 2.x + React Testing Library
- **Analytics**: PostHog (squad)

## Troubleshooting

### pnpm Installation Issues
```bash
# Clear caches
pnpm store prune

# Reinstall
rm -rf node_modules packages/*/node_modules
pnpm install
```

### Turborepo Cache Issues
```bash
# Clear Turbo cache
pnpm clean
rm -rf .turbo packages/*/.turbo
```

### Database Issues (jack-x-agent)
```bash
cd packages/jack-x-agent
pnpm db:generate          # Regenerate Prisma client
pnpm db:push              # Push schema changes
```

### TypeScript Errors After Package Changes
```bash
# Rebuild packages
pnpm build

# Or build specific package
pnpm --filter <package-name> build
```

## Package-Specific Documentation

For detailed information about specific packages:
- **llm-router**: See `packages/llm-router/README.md` (comprehensive guide with examples)
- **jack-x-agent**: See `packages/jack-x-agent/CLAUDE.md` (architecture, database schema, workflows)
- **squad**: See `packages/squad/README.md` (agent configuration, deploy flow)
- **llm-router-ui**: See `packages/llm-router-ui/README.md`

## Development Tips

### Workspace Dependencies
When one package depends on another workspace package, use:
```json
{
  "dependencies": {
    "llm-router": "file:../llm-router"
  }
}
```

### Running Multiple Packages
```bash
# Run dev in all packages simultaneously (managed by Turbo)
pnpm dev

# Or run specific packages in parallel
pnpm --filter llm-router --filter llm-router-ui dev
```

### Adding Dependencies
```bash
# Add to specific package
pnpm --filter <package-name> add <dependency>

# Add to root (workspace tooling)
pnpm add -w <dependency>

# Add as dev dependency
pnpm --filter <package-name> add -D <dependency>
```

### Version Overrides
Root `package.json` includes pnpm overrides for consistent versions:
```json
{
  "pnpm": {
    "overrides": {
      "zod": "^3.23.8",
      "vite": "^5.4.21"
    }
  }
}
```

Individual packages may have additional overrides (e.g., jack-x-agent overrides AI SDK version).
