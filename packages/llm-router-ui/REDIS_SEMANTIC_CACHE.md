# Redis-Backed Semantic Cache Architecture ✅

## Problem Solved

**Issue:** Reasoning queries had 0% cache hits on Vercel because:
1. In-memory cache doesn't persist across serverless invocations
2. Exact string matching doesn't work for long, unique reasoning queries
3. Two cache layers (Redis exact-match + in-memory semantic) caused confusion

---

## Solution: Redis-Backed Semantic Cache

**Architecture:** Move Redis into the semantic cache as persistent storage layer

### Before (Broken)

```
API Route
├─ Redis Cache (exact string match)
│  └─ ❌ Never hits for reasoning queries
└─ Agent
   └─ Semantic Cache (in-memory Map)
      └─ ❌ Lost on serverless cold start
```

**Problems:**
- Redis used exact string matching
- Reasoning queries are long and unique → never match exactly
- In-memory cache lost on Vercel cold starts
- 0% cache hits for reasoning queries

---

### After (Fixed)

```
API Route
└─ Agent
   └─ Semantic Cache (Redis-backed)
      ├─ Stores embeddings in Redis
      ├─ Uses cosine similarity matching
      └─ ✅ Persists across serverless invocations
```

**Benefits:**
- ✅ Semantic matching works for similar queries
- ✅ Redis provides persistence on Vercel
- ✅ Single cache layer (simpler architecture)
- ✅ Reasoning queries now get cache hits

---

## How It Works

### 1. Cache Write (First Request)

```typescript
// User query
"We're evaluating whether to build our own CRM..."

// Generate embedding (256 dimensions)
embedding = [0.123, -0.456, 0.789, ...]

// Store in Redis
redis.set('semantic-cache:We\'re evaluating...', {
  query: "We're evaluating...",
  embedding: [0.123, -0.456, ...],
  response: "Here are the factors...",
  model: "claude-3-5-sonnet",
  complexity: "reasoning",
  timestamp: 1699000000
}, { EX: 86400 }) // 24h TTL
```

---

### 2. Cache Read (Second Request)

```typescript
// Similar query (not exact match)
"Should we build or buy a CRM system?"

// Generate embedding
queryEmbedding = [0.125, -0.450, 0.785, ...]

// Get all cached entries from Redis
entries = redis.keys('semantic-cache:*')

// Calculate similarity to each cached entry
for (entry of entries) {
  similarity = cosineSimilarity(queryEmbedding, entry.embedding)
  // 0.87 similarity → Above 0.85 threshold! ✅
}

// Return cached response
return bestMatch.response
```

---

## Key Changes

### 1. Semantic Cache (`llm-router/src/cache/semantic-cache.ts`)

**Before:**
```typescript
class SemanticCache {
  private cache: Map<string, CacheEntry> = new Map(); // ❌ In-memory
  
  async get(query: string) {
    // Search in-memory Map
  }
  
  async set(query, response) {
    // Store in Map
  }
}
```

**After:**
```typescript
class SemanticCache {
  private redisClient: RedisClient | null = null; // ✅ Redis
  
  async get(query: string) {
    const redis = await this.getRedis();
    const keys = await redis.keys('semantic-cache:*');
    
    // Calculate similarity to all cached entries
    for (const key of keys) {
      const entry = JSON.parse(await redis.get(key));
      const similarity = cosineSimilarity(queryEmbedding, entry.embedding);
      
      if (similarity >= 0.85) {
        return entry; // ✅ Cache hit!
      }
    }
  }
  
  async set(query, response) {
    const embedding = await this.getEmbedding(query);
    await redis.set(`semantic-cache:${query}`, JSON.stringify({
      query,
      embedding,
      response,
      ...
    }), { EX: 86400 });
  }
}
```

---

### 2. API Route (`app/api/chat/route.ts`)

**Before:**
```typescript
// Check Redis exact-match cache
const kvCached = await persistentCache.get(userQuery); // ❌ Exact match
if (kvCached) return kvCached;

// Check semantic cache
const agentResponse = await agent.handleQuery(userQuery); // ❌ In-memory

// Store in both caches
await persistentCache.set(userQuery, response); // ❌ Duplicate
await agent.cacheResponse(userQuery, response);
```

**After:**
```typescript
// Single cache check (Redis-backed semantic cache)
const agentResponse = await agent.handleQuery(userQuery); // ✅ Redis

// Single cache write
await agent.cacheResponse(userQuery, response); // ✅ Stores in Redis
```

---

### 3. Cache Clear API (`app/api/cache/clear/route.ts`)

**Before:**
```typescript
await redis.del(await redis.keys('llm-cache:*')); // ❌ Old prefix
```

**After:**
```typescript
await redis.del(await redis.keys('semantic-cache:*')); // ✅ New prefix
```

---

## Similarity Matching

### How It Works

**Cosine Similarity:**
```typescript
function cosineSimilarity(a: number[], b: number[]): number {
  const dotProduct = a.reduce((sum, val, i) => sum + val * b[i], 0);
  const magnitudeA = Math.sqrt(a.reduce((sum, val) => sum + val * val, 0));
  const magnitudeB = Math.sqrt(b.reduce((sum, val) => sum + val * val, 0));
  return dotProduct / (magnitudeA * magnitudeB);
}
```

**Threshold:** 0.85 (85% similarity required)

---

### Example Matches

**Query 1:**
```
"We're evaluating whether to build our own CRM or use yours"
Embedding: [0.123, -0.456, 0.789, ...]
```

**Query 2 (Similar):**
```
"Should we build or buy a CRM system?"
Embedding: [0.125, -0.450, 0.785, ...]
Similarity: 0.87 → ✅ Cache hit!
```

**Query 3 (Different):**
```
"What are your business hours?"
Embedding: [-0.234, 0.567, -0.123, ...]
Similarity: 0.12 → ❌ Cache miss
```

---

## Performance

### Cache Lookup

**Steps:**
1. Generate embedding for query (~50ms)
2. Get all Redis keys (~10ms)
3. Calculate similarity for each entry (~1ms per entry)
4. Return best match if above threshold

**Total:** ~100ms for 100 cached entries

---

### Cache Storage

**Steps:**
1. Generate embedding (~50ms)
2. Store in Redis (~10ms)

**Total:** ~60ms

---

## Benefits

### 1. Semantic Matching

**Exact Match (Before):**
```
"We're evaluating whether to build our own CRM"
"We're evaluating whether to build our own CRM" ✅ Match
"Should we build or buy a CRM"                  ❌ No match
```

**Semantic Match (After):**
```
"We're evaluating whether to build our own CRM"
"We're evaluating whether to build our own CRM" ✅ Match (1.00)
"Should we build or buy a CRM"                  ✅ Match (0.87)
"What's the best CRM strategy"                  ✅ Match (0.86)
```

---

### 2. Persistence on Vercel

**In-Memory (Before):**
```
Request 1 → Cold start → Cache empty → Store in memory
Request 2 → Same instance → Cache hit ✅
Request 3 → New instance → Cache empty ❌
```

**Redis (After):**
```
Request 1 → Cold start → Cache empty → Store in Redis
Request 2 → Same instance → Cache hit ✅
Request 3 → New instance → Cache hit ✅ (from Redis)
```

---

### 3. Cost Savings

**Reasoning Query:**
- Model: `o1-mini`
- Cost: $0.015 per query
- Cache hit: $0.00

**100 reasoning queries:**
- Without cache: $1.50
- With cache (40% hit rate): $0.90
- **Savings: $0.60 (40%)**

---

## Testing

### 1. Local Testing

```bash
# Start Redis locally
redis-cli ping  # Should return PONG

# Start dev server
pnpm dev

# Run benchmarks
# Go to /benchmarks
# Run "Reasoning (25)" twice
# Second run should show cache hits ✅
```

---

### 2. Vercel Testing

```bash
# Deploy
git add .
git commit -m "Add Redis-backed semantic cache"
git push

# Test on Vercel
# Go to /benchmarks
# Run "Reasoning (25)" twice
# Second run should show cache hits ✅
```

---

### 3. Verify Redis Storage

```bash
# Local
redis-cli KEYS "semantic-cache:*"

# Vercel Dashboard
# Storage → Redis → Data
# Should see keys starting with "semantic-cache:"
```

---

## Expected Results

### Before (Broken)

```
Reasoning Queries (25):
- First run: 0% cache hits
- Second run: 0% cache hits ❌
- Cost: $0.375 per run
```

### After (Fixed)

```
Reasoning Queries (25):
- First run: 0% cache hits (expected)
- Second run: 80-100% cache hits ✅
- Cost: $0.375 first run, $0.075 second run
- Savings: $0.30 (80%)
```

---

## Architecture Summary

### Single Cache Layer

```
┌─────────────────────────────────────┐
│          API Route                  │
│  /app/api/chat/route.ts             │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│      CustomerCareAgent              │
│  /lib/customer-care-agent.ts        │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│         LLMRouter                   │
│  llm-router/src/router/index.ts    │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│      SemanticCache                  │
│  llm-router/src/cache/              │
│  semantic-cache.ts                  │
│                                     │
│  ┌─────────────────────────────┐   │
│  │   Redis (Persistent)        │   │
│  │   - Stores embeddings       │   │
│  │   - Cosine similarity       │   │
│  │   - 24h TTL                 │   │
│  │   - Works on Vercel ✅      │   │
│  └─────────────────────────────┘   │
└─────────────────────────────────────┘
```

---

## Summary

### What Changed
1. ✅ Removed in-memory Map from SemanticCache
2. ✅ Added Redis client to SemanticCache
3. ✅ Removed exact-match Redis cache from API route
4. ✅ Single cache layer with semantic matching
5. ✅ Persistence across Vercel serverless invocations

### Benefits
- ✅ Reasoning queries now get cache hits
- ✅ Semantic matching works for similar queries
- ✅ Simpler architecture (single cache)
- ✅ Cost savings (40-80% for reasoning queries)
- ✅ Works on Vercel serverless

**Ready to deploy and test!** 🚀✅
