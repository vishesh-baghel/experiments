# Sample Queries Guide

## Overview

The demo includes 6 carefully designed sample queries that demonstrate:
1. **Intelligent Routing** - Simple vs Complex query handling
2. **Semantic Caching** - Similar queries matching
3. **Exact Matching** - 100% cache hits

---

## Query Categories

### 💬 Simple Queries (Fast Models)

**Purpose:** Show routing to cheaper, faster models (gpt-4o-mini)

#### Query 1: "What are your business hours?"
```
Expected Routing:
- Model: gpt-4o-mini
- Complexity: simple
- Cost: ~$0.0003
- Cache: Miss (first time)
```

#### Query 2: "When are you open?" 
```
Semantic Match Test:
- Similarity to Query 1: ~90-95%
- Expected: Cache HIT ✅
- Cost: $0.00 (cached)
- Response Time: ~50ms vs 2500ms
```

**What this demonstrates:**
- Simple factual questions → cheap models
- Semantic similarity detection
- Cost savings from caching

---

### 🧠 Complex Queries (Advanced Models)

**Purpose:** Show routing to powerful models (gpt-4o) for complex issues

#### Query 3: "I've been charged twice for the same order, but only received one item. I also noticed my subscription was upgraded without my consent. Can you investigate this and explain what happened?"

```
Expected Routing:
- Model: gpt-4o (advanced reasoning needed)
- Complexity: complex
- Cost: ~$0.005
- Reasoning: Multiple issues, investigation required
- Keywords detected: charged, subscription, investigate, explain
```

#### Query 4: "I got double charged for my order and only got one item. Also my subscription got upgraded without asking me. What's going on?"

```
Semantic Match Test:
- Similarity to Query 3: ~85-92%
- Expected: Cache HIT ✅
- Cost: $0.00 (saved $0.005!)
- Same meaning, different wording
```

**What this demonstrates:**
- Complex problems → powerful models
- Multi-issue detection
- Semantic caching works across paraphrases
- Significant cost savings on expensive queries

---

### 🎯 Exact Match Test

**Purpose:** Show 100% cache hit rate for identical queries

#### Query 5: "Hello, how can you help me?"
```
Expected Routing:
- Model: gpt-4o-mini
- Complexity: simple
- Cost: ~$0.0003
- Cache: Miss (first time)
```

#### Query 6: "Hello, how can you help me?" (identical)
```
Exact Match:
- Similarity: 100%
- Expected: Cache HIT ✅
- Cost: $0.00
- Instant response
```

**What this demonstrates:**
- Perfect matching for repeated queries
- Instant responses (no LLM call)
- Zero cost for duplicates

---

## Testing Flow

### Recommended Testing Sequence

**Step 1: Test Simple Routing**
1. Click "What are your business hours?"
2. Observe: Model = gpt-4o-mini, Complexity = simple
3. Note the cost (~$0.0003)

**Step 2: Test Semantic Caching**
1. Click "When are you open?"
2. Observe: Cache HIT ✅, Cost = $0.00
3. Check console for similarity score (~90-95%)

**Step 3: Test Complex Routing**
1. Click the long complaint query
2. Observe: Model = gpt-4o, Complexity = complex
3. Note higher cost (~$0.005)

**Step 4: Test Semantic Caching (Complex)**
1. Click the paraphrased complaint
2. Observe: Cache HIT ✅, Cost = $0.00
3. Saved $0.005! (much more than simple queries)

**Step 5: Test Exact Matching**
1. Click "Hello, how can you help me?"
2. Click it again (same button)
3. Observe: 100% cache hit, instant response

**Step 6: Watch Metrics**
```
After all 6 queries:
- Total Cost: ~$0.0053 (only 2 LLM calls)
- Cost Saved: ~$0.0159 (4 cache hits)
- Cache Hit Rate: 66.7% (4 hits / 6 requests)
- Messages: 12 (6 user + 6 assistant)
```

---

## Expected Console Logs

### Query 1: Simple (Miss)
```
[Cache] ✗ MISS - No cached entries yet
Routing: {
  complexity: 'simple',
  selectedModel: 'gpt-4o-mini',
  cacheHit: false
}
```

### Query 2: Semantic Hit
```
[Cache] Query: "When are you open?"
[Cache] Best match: "What are your business hours?" (similarity: 92.3%)
[Cache] Threshold: 85.0%
[Cache] ✓ HIT - Returning cached response
→ No routing log (cache hit before routing!)
```

### Query 3: Complex (Miss)
```
[Cache] ✗ MISS - Similarity below threshold
Routing: {
  complexity: 'complex',
  selectedModel: 'gpt-4o',
  cacheHit: false
}
```

### Query 4: Semantic Hit (Complex)
```
[Cache] Query: "I got double charged..."
[Cache] Best match: "I've been charged twice..." (similarity: 88.7%)
[Cache] ✓ HIT - Returning cached response
```

### Query 5 & 6: Exact Match
```
[Cache] Query: "Hello, how can you help me?"
[Cache] Best match: "Hello, how can you help me?" (similarity: 100.0%)
[Cache] ✓ HIT - Returning cached response
```

---

## UI Indicators

### Visual Cues

**Cache Miss:**
```
Routing details ▼
Model: gpt-4o-mini
Provider: openai
Complexity: simple
Cost: $0.000300
Cache: ✗ Miss  ← Red/gray
```

**Cache Hit:**
```
Routing details ▼
Model: gpt-4o-mini
Provider: openai
Complexity: simple
Cost: $0.000000  ← Free!
Cache: ✓ Hit  ← Green
```

**Semantic Match Buttons:**
```
┌─────────────────────────────────────────────────┐
│ When are you open?                              │
│ ← Similar (cache test)  ← Green border         │
└─────────────────────────────────────────────────┘
```

**Exact Match Buttons:**
```
┌─────────────────────────────────────────────────┐
│ Hello, how can you help me?                     │
│ ← Exact (100% cache hit)  ← Blue border        │
└─────────────────────────────────────────────────┘
```

---

## Key Learnings

### 1. Routing Intelligence
- Simple queries → Fast, cheap models (gpt-4o-mini)
- Complex queries → Powerful models (gpt-4o)
- Automatic detection based on:
  - Keywords (investigate, charged, subscription)
  - Multiple issues
  - Sentence complexity

### 2. Semantic Caching
- Works across paraphrases (85%+ similarity)
- Saves more on expensive queries
- Uses OpenAI embeddings (256 dimensions)
- Threshold: 85% (configurable)

### 3. Cost Optimization
- Cache hits = $0 cost
- Simple queries: Save ~$0.0003 per hit
- Complex queries: Save ~$0.005 per hit
- 66% hit rate = 66% cost reduction

### 4. Performance
- Cache hits: ~50ms response time
- LLM calls: ~2500ms response time
- 50x faster with caching!

---

## Customization

### Add Your Own Samples

```typescript
<button
  onClick={() => handleInputChange({ 
    target: { value: 'Your custom query here' } 
  } as any)}
  className="text-left px-4 py-3 rounded-lg bg-muted hover:bg-muted/80 transition-colors text-sm"
>
  Your custom query here
</button>
```

### Adjust Cache Threshold

```typescript
// In agent initialization
const agent = new CustomerCareAgent(undefined, {
  cacheOptions: {
    similarityThreshold: 0.80, // Lower = more cache hits
  },
});
```

---

## Troubleshooting

### Cache Not Hitting?
1. Check console for similarity scores
2. Verify embeddings are generating
3. Check OpenAI API key
4. Lower threshold if needed

### Wrong Model Selected?
1. Check console for complexity score
2. Verify keywords are detected
3. Review classification logic

### Metrics Not Updating?
1. Check browser console for errors
2. Verify response headers
3. Refresh page and try again

---

## Summary

**Sample queries demonstrate:**
- ✅ Intelligent routing (simple vs complex)
- ✅ Semantic caching (similar queries)
- ✅ Exact matching (100% hits)
- ✅ Cost optimization (66% savings)
- ✅ Performance gains (50x faster)

**Perfect for demos showing:**
- Real-world cost savings
- Cache effectiveness
- Routing intelligence
- Production-ready features

**Try them now and watch the magic happen!** ✨
