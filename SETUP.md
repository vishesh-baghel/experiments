# LLM Router - Setup Guide

Complete guide to getting the LLM Router experiment up and running.

## 📋 Prerequisites

### Required
- **Node.js**: >= 18.0.0
- **pnpm**: >= 8.0.0
- **API Keys**: At least one of:
  - OpenAI API key
  - Anthropic API key

### Install pnpm (if needed)

```bash
npm install -g pnpm
```

### Verify Installation

```bash
node --version  # Should be >= 18.0.0
pnpm --version  # Should be >= 8.0.0
```

---

##  Installation Steps

### Step 1: Install Dependencies

From the `experiments` directory:

```bash
cd /path/to/experiments
pnpm install
```

This will:
- Install Turborepo
- Install all workspace dependencies
- Link packages together
- Set up TypeScript

**Expected output**:
```
Packages: +XXX
Progress: resolved XXX, reused XXX, downloaded X
```

### Step 2: Setup Environment Variables

Navigate to the LLM Router package:

```bash
cd packages/llm-router
```

Copy the example environment file:

```bash
cp .env.example .env
```

Edit `.env` and add your API keys:

```bash
# .env
OPENAI_API_KEY=sk-proj-...
ANTHROPIC_API_KEY=sk-ant-...
```

**Getting API Keys**:
- OpenAI: https://platform.openai.com/api-keys
- Anthropic: https://console.anthropic.com/settings/keys

### Step 3: Build the Project

From the workspace root:

```bash
pnpm build
```

Or from the llm-router package:

```bash
cd packages/llm-router
pnpm build
```

**Expected output**:
```
> @experiments/llm-router@1.0.0 build
> tsc

# TypeScript compilation should complete without errors
```

### Step 4: Run the Demo

```bash
pnpm dev
```

**Expected output**:
```
================================================================================
 LLM ROUTER DEMO - Customer Care Agent
================================================================================

 DEMO 1: Query Complexity Comparison

────────────────────────────────────────
Testing SIMPLE query:
────────────────────────────────────────
 Routing Decision:
  Query: "What are your business hours?"
  Complexity: SIMPLE (score: 15/100)
  Selected Model: GPT-3.5 Turbo (openai)
  Estimated Cost: $0.000050
  ...
```

---

##  Verification Checklist

After setup, verify everything works:

- [ ] Dependencies installed without errors
- [ ] `.env` file created with API keys
- [ ] TypeScript compilation successful
- [ ] Demo runs and shows routing decisions
- [ ] Queries are processed and responses returned
- [ ] Cost tracking displays correctly

---

##  Test Individual Components

### Test 1: Basic Router

```bash
tsx examples/basic-usage.ts
```

**What to expect**: Should show routing decisions for different query types

### Test 2: Customer Care Agent

```bash
tsx examples/with-mastra-agent.ts
```

**What to expect**: Should execute actual API calls and show responses

### Test 3: Cost Comparison

```bash
tsx examples/cost-optimization.ts
```

**What to expect**: Should compare costs across all available models

---

##  Troubleshooting

### Problem: "Cannot find module '@mastra/core'"

**Solution**: Run `pnpm install` again from workspace root

```bash
cd /path/to/experiments
pnpm install
```

### Problem: "OPENAI_API_KEY is not set"

**Solution**: 
1. Check `.env` file exists in `packages/llm-router/`
2. Verify key format: `OPENAI_API_KEY=sk-proj-...`
3. Make sure no quotes around the key
4. Restart the dev server after editing .env

### Problem: "Rate limit exceeded"

**Solution**: Add delays between requests or use different API keys

```typescript
// Add this between queries
await new Promise(r => setTimeout(r, 2000));
```

### Problem: TypeScript errors

**Solution**: Rebuild the project

```bash
pnpm clean
pnpm build
```

### Problem: "Module not found" in examples

**Solution**: Make sure you're running from the correct directory

```bash
cd packages/llm-router
tsx examples/basic-usage.ts
```

---

##  Quick Validation Test

Run this to verify everything is working:

```bash
# From packages/llm-router directory
tsx -e "
import { LLMRouter } from './src/router';
const router = new LLMRouter();
router.routeQuery('Hello').then(r => {
  console.log(' Router working!');
  console.log('Model:', r.displayName);
  console.log('Cost:', r.estimatedCost.total);
}).catch(e => {
  console.error(' Error:', e.message);
});
"
```

**Expected output**:
```
 Router working!
Model: GPT-3.5 Turbo
Cost: 0.000025
```

---

##  Next Steps

After successful setup:

1. **Explore Examples**
   ```bash
   ls examples/
   # Try each one to understand different use cases
   ```

2. **Read the Documentation**
   - Main README: `packages/llm-router/README.md`
   - Code comments in `src/` directory

3. **Experiment with Options**
   ```typescript
   // Try different routing options
   await router.routeQuery(query, {
     preferCheaper: true,
     maxCostPerQuery: 0.001,
     forceProvider: 'anthropic'
   });
   ```

4. **Create Your Own Queries**
   - Add to `src/demo/queries.ts`
   - Test different complexity levels
   - Measure cost savings

5. **Integrate with Your App**
   - Use `CustomerCareAgent` class
   - Customize system prompt
   - Track usage statistics

---

##  Pro Tips

### Tip 1: Use tsx for Quick Tests

```bash
# Test any TypeScript file directly
tsx src/router/analyzer.ts
```

### Tip 2: Watch Mode

```bash
# Auto-rebuild on changes
pnpm build --watch
```

### Tip 3: Filter Workspace Commands

```bash
# Run commands for specific package
pnpm --filter @experiments/llm-router dev
```

### Tip 4: Check Logs

```bash
# Enable debug logging
DEBUG=* pnpm dev
```

### Tip 5: Cost Monitoring

Track your spending by checking the stats:

```typescript
const stats = agent.getStats();
console.log(`Total spent: $${stats.totalCost.toFixed(6)}`);
```

---

## 🆘 Getting Help

If you encounter issues:

1. **Check the docs**: `README.md` has comprehensive guides
2. **Review examples**: Working code examples in `examples/`
3. **Read error messages**: They usually indicate the problem
4. **Check API keys**: Most issues are authentication-related
5. **Verify versions**: Ensure Node.js >= 18 and pnpm >= 8

**Still stuck?**
- Email: hi@visheshbaghel.com
- Twitter/X: [@visheshbaghel](https://x.com/visheshbaghel)

---

##  You're All Set!

Your LLM Router is now ready to use. Start with the demo:

```bash
pnpm dev
```

And explore the examples to learn different patterns!

**Happy routing! **
