# LLM Router UI

Interactive chat interface demonstrating intelligent LLM routing with cost optimization and caching.

## Features

- **Real-time Chat** - Streaming responses with Vercel AI SDK
- **Intelligent Routing** - Automatic model selection based on query complexity
- **Cost Tracking** - See cost per message and cumulative totals
- **Cache Visualization** - Track cache hits for cost savings
- **Expandable Details** - Toggle routing metadata for debugging

## Tech Stack

- **Next.js 16** - App Router with React Server Components
- **Vercel AI SDK** - Streaming chat interface
- **LLM Router** - Workspace dependency for intelligent routing
- **Tailwind CSS** - Styling
- **Lucide Icons** - UI icons

## Getting Started

### Prerequisites

```bash
# Set API keys
export OPENAI_API_KEY="your-key"
export ANTHROPIC_API_KEY="your-key"  # Optional
```

### Development

```bash
# Install dependencies (from monorepo root)
pnpm install

# Run dev server
pnpm dev

# Open http://localhost:3000
```

### Build

```bash
# Build for production
pnpm build

# Start production server
pnpm start
```

## Deploy to Vercel

### One-Click Deploy

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/vishesh-baghel/experiments&project-name=llm-router-ui&root-directory=packages/llm-router-ui)

### Manual Deploy

```bash
# Install Vercel CLI
pnpm add -g vercel

# Deploy
vercel

# Set environment variables in Vercel dashboard:
# - OPENAI_API_KEY
# - ANTHROPIC_API_KEY (optional)
```

## How It Works

1. **User sends message** - Chat component calls `/api/chat`
2. **API route** - Uses LLM Router to select optimal model
3. **Router analyzes** - Checks cache, classifies complexity, selects model
4. **Stream response** - Vercel AI SDK streams LLM response
5. **Show metadata** - Display routing decision, cost, cache status

## Routing Logic

```typescript
// Simple query - Cheap model
"What are your hours?" → gpt-4o-mini ($0.0001)

// Complex query - Advanced model
"Explain OAuth2 implementation" → gpt-4o ($0.002)

// Cached query - $0
"What are your hours?" (2nd time) → Cache Hit ($0)
```

## Project Structure

```
llm-router-ui/
├── app/
│   ├── api/chat/route.ts    # Chat API endpoint
│   ├── layout.tsx            # Root layout
│   └── page.tsx              # Home page
├── components/
│   └── chat.tsx              # Chat UI component
├── lib/
│   └── utils.ts              # Utility functions
├── vercel.json               # Vercel config
└── package.json              # Dependencies
```

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `OPENAI_API_KEY` | Yes | OpenAI API key |
| `ANTHROPIC_API_KEY` | No | Anthropic API key (optional) |

## Learn More

- [LLM Router Package](../llm-router) - Core routing library
- [Vercel AI SDK](https://sdk.vercel.ai/docs) - AI SDK documentation
- [Next.js Docs](https://nextjs.org/docs) - Next.js documentation
