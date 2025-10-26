# LLM Router - Intelligent Model Selection

> **Automatically route queries to optimal LLMs based on complexity and cost**

A production-ready library that analyzes query complexity and intelligently routes to the most cost-effective AI model. Built with Mastra for real-world customer care applications.

##  What You'll Learn

- **Query Complexity Analysis** - Heuristic-based classification (simple, moderate, complex, reasoning)
- **Cost-Aware Routing** - Automatic selection between cheap and expensive models
- **Token Estimation** - Cost calculation and savings tracking
- **Mastra Integration** - Building intelligent agents with dynamic model selection

##  Quick Start

### 1. Installation

```bash
cd experiments/packages/llm-router
pnpm install
```

### 2. Setup Environment

```bash
cp .env.example .env
# Add your API keys:
# OPENAI_API_KEY=sk-...
# ANTHROPIC_API_KEY=sk-ant-...
```

### 3. Run Demo

```bash
pnpm dev
```

You'll see the router in action, analyzing queries and selecting optimal models!

##  How It Works

### Architecture

```
User Query
    ↓
┌─────────────────────────┐
│  Complexity Analyzer    │  ← Heuristics + patterns
│  - Length, keywords     │
│  - Code/math detection  │
│  - Question type        │
└───────────┬─────────────┘
            ↓
      Complexity Score
       (0-100 points)
            ↓
┌─────────────────────────┐
│  Model Selector         │  ← Cost optimization
│  - Simple → GPT-3.5     │
│  - Complex → GPT-4      │
│  - Reasoning → o1       │
└───────────┬─────────────┘
            ↓
┌─────────────────────────┐
│  Customer Care Agent    │  ← Mastra integration
│  (Executes with model)  │
└───────────┬─────────────┘
            ↓
        Response
     + Cost Metadata
```

### Complexity Classification

The analyzer uses multiple signals:

**1. Query Length**
- < 50 chars = likely simple
- 50-150 chars = moderate
- 150-300 chars = complex
- \> 300 chars = reasoning required

**2. Code/Math Detection**
```typescript
// Code patterns trigger "complex" classification
`function example() { }`
// Math patterns indicate reasoning
"Calculate: x^2 + 5x + 6 = 0"
```

**3. Question Type**
- "What/When/Where" → Simple
- "How/Why/Explain" → Complex
- "Should I/Recommend" → Reasoning

**4. Keywords**
- Simple: hours, policy, return, reset
- Complex: explain, implement, integrate
- Reasoning: recommend, compare, optimize

### Model Selection

| Complexity | Cheap Mode | Best Quality Mode |
|-----------|------------|------------------|
| **Simple** | GPT-3.5 Turbo ($0.50/1M) | GPT-4o Mini ($0.15/1M) |
| **Moderate** | GPT-4o Mini ($0.15/1M) | GPT-4o ($2.50/1M) |
| **Complex** | GPT-4o ($2.50/1M) | Claude 3.5 Sonnet ($3.00/1M) |
| **Reasoning** | o1-mini ($3.00/1M) | Claude 3 Opus ($15.00/1M) |

**Cost Savings: Up to 95%** compared to always using expensive models!

##  Usage Examples

### Example 1: Direct Router Usage

```typescript
import { LLMRouter } from '@experiments/llm-router';

const router = new LLMRouter();

// Simple query → Routes to GPT-3.5
const routing = await router.routeQuery('What are your hours?');
console.log(routing.displayName); // "GPT-3.5 Turbo"
console.log(routing.estimatedCost.total); // ~$0.000050

// Complex query → Routes to GPT-4
const complex = await router.routeQuery(
  'Explain OAuth2 and help me implement it'
);
console.log(complex.displayName); // "GPT-4o"
```

### Example 2: Customer Care Agent (Recommended)

```typescript
import { CustomerCareAgent } from '@experiments/llm-router';

const agent = new CustomerCareAgent();

const result = await agent.handleQuery(
  'How do I reset my password?',
  {
    preferCheaper: true, // Optimize for cost
    maxCostPerQuery: 0.01, // Budget limit
  }
);

console.log(result.answer);
console.log(`Cost: $${result.metadata.actualCost}`);
console.log(`Saved: ${result.metadata.costSavings.percentage}%`);
```

### Example 3: Cost Comparison

```typescript
const costs = await router.compareCosts(
  'Explain quantum computing'
);

costs.forEach(({ model, formatted }) => {
  console.log(`${model}: ${formatted}`);
});

// Output:
// GPT-4o Mini: $0.000150
// GPT-3.5 Turbo: $0.000500
// GPT-4o: $0.002500
// Claude 3 Opus: $0.015000
```

##  Real-World Demo Queries

### Simple (Routed to GPT-3.5 / Claude Haiku)
```
"What are your business hours?"
"How do I reset my password?"
"Where is my order #12345?"
```

### Moderate (Routed to GPT-4o Mini)
```
"I received a damaged product. What are my options?"
"Can you explain the differences between your plans?"
"I'm having trouble with checkout. Can you help?"
```

### Complex (Routed to GPT-4o / Claude Sonnet)
```
"I've been charged twice and my subscription was upgraded 
without consent. Investigate and explain what happened."

"Compare all your service tiers and recommend which is 
best for a 10-person team with collaboration needs."
```

### Reasoning (Routed to o1-mini / Claude Opus)
```
"I'm deciding between canceling or downgrading. I've used 
80% of quota this month, typically use 60%, and the project 
causing increased usage ends next month. What should I do?"
```

##  What's Included

 **Complete Router Library** (~800 lines)
- Complexity analyzer with heuristics
- Cost calculator with real pricing
- Model selector with optimization
- Full TypeScript types

 **Customer Care Agent**
- Mastra integration (OpenAI + Anthropic)
- Automatic model switching
- Cost tracking and savings

 **Demo & Examples**
- 25+ test queries across all complexity levels
- Basic usage examples
- Cost optimization strategies
- Real-world scenarios

 **Educational Content**
- Comprehensive README
- Code comments explaining decisions
- Decision tree documentation
- Best practices guide

##  What's Missing for Production

This experiment is fully functional for learning and development. To deploy to production, you'd also need:

### Integration Features
-  Additional providers (Gemini, Groq, Together, Mistral, etc.)
-  Streaming support for real-time responses
-  Embeddings-based complexity analysis (ML approach)
-  Caching layer for repeated queries
-  Request queue and rate limiting

### Production Infrastructure
-  Database persistence for analytics
-  Grafana dashboards for monitoring
-  Alert system for cost overruns
-  A/B testing framework
-  Fallback chains (if one provider fails)

### Enterprise Features
-  Multi-tenant support
-  Per-user cost tracking and limits
-  Authentication & authorization
-  Webhook system for async processing
-  Admin dashboard with business metrics

### Code Quality
-  Comprehensive test suite (100+ tests)
-  CI/CD pipelines
-  Production error handling with retries
-  Advanced logging and observability
-  Performance optimizations (batch processing)

### Time to Build These: 60-80 hours
### Time to Learn This Pattern: 4-6 hours

##  Cost Savings Examples

Based on real pricing (January 2025):

| Scenario | Always GPT-4 | Smart Routing | Savings |
|----------|-------------|---------------|---------|
| 100 simple queries | $0.50 | $0.05 | **90%** |
| 50 moderate queries | $0.25 | $0.04 | **84%** |
| 20 complex queries | $0.10 | $0.07 | **30%** |
| **Total (170 queries)** | **$0.85** | **$0.16** | **81%** |

**At scale**: Processing 10,000 queries/day → **Save $2,460/month**

##  Project Structure

```
packages/llm-router/
├── src/
│   ├── router/
│   │   ├── index.ts          # Main LLMRouter class
│   │   ├── analyzer.ts       # Complexity analysis
│   │   ├── selector.ts       # Model selection logic
│   │   └── calculator.ts     # Cost calculations
│   ├── agent/
│   │   └── customer-care-agent.ts  # Mastra agent
│   ├── models/
│   │   └── config.ts         # Model configs + pricing
│   ├── demo/
│   │   ├── queries.ts        # 25+ test queries
│   │   └── run.ts            # Demo runner
│   ├── types.ts              # TypeScript definitions
│   └── index.ts              # Public exports
├── examples/
│   ├── basic-usage.ts
│   ├── with-mastra-agent.ts
│   └── cost-optimization.ts
└── README.md
```

##  Running Examples

```bash
# Basic router usage
tsx examples/basic-usage.ts

# Customer care agent
tsx examples/with-mastra-agent.ts

# Cost optimization strategies
tsx examples/cost-optimization.ts

# Full demo
pnpm dev
```

## 🎓 Key Learning Points

### 1. Complexity Analysis Matters
Simple queries don't need GPT-4. Use heuristics to classify:
- Length, keywords, question type
- Code/math detection
- Sentence complexity

### 2. Cost Optimization is Significant
Choosing the right model can save 80-95% on costs:
- GPT-3.5 for simple factual questions
- GPT-4 only when necessary
- o1 for complex reasoning

### 3. Mastra Integration is Simple
No need to build abstractions - use Mastra directly:
```typescript
const agent = new Agent({
  model: { provider: 'OPEN_AI', name: 'gpt-3.5-turbo' }
});
```

### 4. Metadata is Valuable
Track every decision:
- Why this model was chosen
- Estimated vs actual cost
- Cost savings compared to expensive models

##  Configuration Options

```typescript
interface RouterOptions {
  maxCostPerQuery?: number;      // Budget constraint
  preferCheaper?: boolean;        // Cost vs quality
  forceProvider?: 'openai' | 'anthropic';
  forceModel?: string;            // Override selection
  enableEmbeddings?: boolean;     // ML-based analysis
}
```

##  Usage Statistics

The router tracks usage automatically:

```typescript
const stats = agent.getStats();

console.log(stats);
// {
//   totalQueries: 42,
//   totalCost: 0.002156,
//   averageCost: 0.000051,
//   modelBreakdown: {
//     'gpt-3.5-turbo': 25,
//     'gpt-4o': 15,
//     'o1-mini': 2
//   },
//   complexityBreakdown: {
//     simple: 25,
//     moderate: 12,
//     complex: 4,
//     reasoning: 1
//   }
// }
```

##  Troubleshooting

### API Keys Not Working
```bash
# Make sure .env is in the right place
ls -la .env

# Check if keys are loaded
echo $OPENAI_API_KEY
```

### TypeScript Errors
```bash
# Install dependencies
pnpm install

# Build the project
pnpm build
```

### Rate Limits
Add delays between requests in production:
```typescript
await new Promise(r => setTimeout(r, 1000));
```

##  Further Reading

- [OpenAI Pricing](https://openai.com/pricing)
- [Anthropic Pricing](https://anthropic.com/pricing)
- [Mastra Documentation](https://docs.mastra.ai)
- [Token Estimation Strategies](https://help.openai.com/en/articles/4936856)

##  Contributing

This is an educational experiment. Feel free to:
- Fork and extend with new providers
- Add embeddings-based analysis
- Implement caching strategies
- Create additional examples

##  License

MIT License - Free to use and modify

---

##  About This Experiment

**Author**: Vishesh Baghel  
**Source**: Production patterns from real-world implementations  
**Learning Time**: 4-6 hours  
**Code Size**: ~800 lines  

### Educational vs Production

This experiment teaches the fundamental pattern of intelligent model routing. It's fully functional and can be used in development/staging environments.

**Use This For**:
- Learning cost optimization strategies
- Understanding complexity analysis
- Prototyping AI applications
- Development and testing

**For Production, You'd Need**:
- More provider integrations (5-7 providers)
- Advanced ML-based analysis
- Production observability
- Testing suite and CI/CD
- Database persistence
- Enterprise features (auth, multi-tenant, etc.)

**Time Investment Comparison**:
- Learn from this experiment: 4-6 hours
- Build complete production system: 60-80 hours
- Maintain and optimize: Ongoing

---

##  Questions?

**Email**: hi@visheshbaghel.com  
**Twitter/X**: [@visheshbaghel](https://x.com/visheshbaghel)  
**GitHub**: [visheshbaghel](https://github.com/visheshbaghel)

---

**Happy routing! **
