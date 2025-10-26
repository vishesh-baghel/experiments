# Vishesh's Experiments

Production-ready integration patterns and experiments built with modern AI frameworks.

##  Available Experiments

### 1. LLM Router - Intelligent Model Selection
**Location**: `packages/llm-router`

Automatically route queries to optimal LLMs based on complexity and cost. Built with Mastra for real-world customer care applications.

**What You'll Learn**:
- Query complexity analysis (heuristics-based)
- Cost-aware model selection
- Token estimation and savings tracking
- Building intelligent agents with Mastra

**Tech Stack**: TypeScript, Mastra, OpenAI, Anthropic

**Status**:  Complete and documented

[Read Full Documentation →](./packages/llm-router/README.md)

---

##  Getting Started

### Prerequisites
- Node.js >= 18.0.0
- pnpm >= 8.0.0

### Quick Setup

```bash
# Install dependencies
pnpm install

# Navigate to an experiment
cd packages/llm-router

# Setup environment
cp .env.example .env
# Add your API keys

# Run demo
pnpm dev
```

---

## 📁 Repository Structure

```
experiments/
├── packages/
│   └── llm-router/          # LLM Router experiment
├── package.json             # Workspace root
├── turbo.json               # Turborepo config
├── pnpm-workspace.yaml      # PNPM workspace config
└── README.md                # This file
```

---

##  Design Philosophy

Each experiment follows these principles:

1. **Educational First** - Teach patterns, not just show code
2. **Production Quality** - Real-world code, not toy examples
3. **Actually Usable** - Works in dev/staging environments
4. **Well Documented** - Comprehensive guides and examples
5. **Open Source** - MIT licensed, free to use and learn from

---

## 🛠 Development

```bash
# Build all packages
pnpm build

# Run specific experiment
pnpm --filter @experiments/llm-router dev

# Clean all builds
pnpm clean
```