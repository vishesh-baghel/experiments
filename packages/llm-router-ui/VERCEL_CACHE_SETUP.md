# Vercel Cache Setup - Persistent Caching

## Problem

**Cache works locally but not on Vercel deployments**

### Why?

**Local Development:**
```
Dev server runs continuously
↓
Cache stored in memory (Map)
↓
Cache persists between requests ✅
↓
Second benchmark run: 20-40% cache hits ✅
```

**Vercel Production:**
```
Serverless functions are stateless
↓
Each cold start = new instance
↓
Cache stored in memory (Map)
↓
Cache wiped on cold start ❌
↓
Second benchmark run: 0% cache hits ❌
```

---

## Solution: Vercel KV (Redis)

Use Vercel KV for persistent caching across serverless invocations.

### What We've Done

1. ✅ Installed `@vercel/kv`
2. ✅ Created `VercelKVCache` wrapper
3. ✅ Exported `CacheEntry` type from `llm-router`

### What You Need to Do

#### Step 1: Create Vercel KV Store

**In Vercel Dashboard:**

1. Go to your project
2. Click **Storage** tab
3. Click **Create Database**
4. Select **KV (Redis)**
5. Name it: `llm-router-cache`
6. Click **Create**

**Environment Variables (Auto-added):**
```
KV_REST_API_URL=https://...
KV_REST_API_TOKEN=...
```

---

#### Step 2: Update Customer Care Agent (Optional)

The current implementation uses the router's built-in cache. If you want to use Vercel KV, you'd need to modify the router itself or create a custom cache adapter.

**For now, the simplest solution is:**

**Option A: Keep Current Implementation (Recommended)**
- Cache works locally for development ✅
- Accept 0% cache on Vercel (first request always fresh)
- Trade-off: Slightly higher costs on production

**Option B: Implement Vercel KV Cache (Advanced)**
- Requires modifying `llm-router` package
- Add persistent cache adapter
- More complex but full caching on Vercel

---

## Option A: Accept Current Behavior (Recommended)

### Why This Is OK

**Development:**
- Fast iteration with cache ✅
- Test cache behavior locally ✅

**Production:**
- Always fresh responses ✅
- No stale cache issues ✅
- Slightly higher costs (acceptable for demo)

**Cost Impact:**
```
Without cache: $0.10/day
With cache (40%): $0.06/day
Difference: $0.04/day = $1.20/month

For a demo/benchmark app, this is negligible.
```

---

## Option B: Implement Vercel KV Cache (Advanced)

If you want full caching on Vercel, here's the approach:

### 1. Create Persistent Cache Adapter

```typescript
// packages/llm-router/src/cache/persistent-cache-adapter.ts
export interface PersistentCacheAdapter {
  get(key: string): Promise<CacheEntry | null>;
  set(key: string, value: CacheEntry): Promise<void>;
  getAllEntries(): Promise<CacheEntry[]>;
  clear(): Promise<void>;
  size(): Promise<number>;
}
```

### 2. Update SemanticCache

```typescript
export class SemanticCache {
  private adapter: PersistentCacheAdapter | null = null;
  
  constructor(options: {
    adapter?: PersistentCacheAdapter;
    // ... other options
  }) {
    this.adapter = options.adapter || null;
  }
  
  async get(query: string): Promise<CacheEntry | null> {
    if (this.adapter) {
      // Use persistent adapter
      const entries = await this.adapter.getAllEntries();
      // ... semantic search logic
    } else {
      // Use in-memory cache
      // ... existing logic
    }
  }
}
```

### 3. Use in API Route

```typescript
import { VercelKVCache } from '@/lib/vercel-kv-cache';

const kvCache = new VercelKVCache();

const agent = new CustomerCareAgent(undefined, {
  useCache: true,
  cacheAdapter: kvCache, // Pass Vercel KV adapter
});
```

---

## Recommendation

**For your use case (benchmarks/demo):**

### Use Option A (Current Implementation)

**Reasons:**
1. **Simpler** - No additional setup needed
2. **Works locally** - Full cache testing in dev
3. **Cost negligible** - $1-2/month difference
4. **Fresh responses** - No stale cache issues
5. **Faster deployment** - No KV setup needed

**Trade-offs:**
- 0% cache hit rate on Vercel
- Slightly higher API costs
- Each request hits LLM

---

## If You Still Want Vercel KV

### Quick Implementation

**1. Create cache adapter in API route:**

```typescript
// app/api/chat/route.ts
import { kv } from '@vercel/kv';

// Simple cache wrapper
const cache = {
  async get(query: string) {
    return await kv.get(`cache:${query}`);
  },
  async set(query: string, data: any) {
    await kv.set(`cache:${query}`, data, { ex: 86400 }); // 24h TTL
  }
};

export async function POST(req: Request) {
  const { messages } = await req.json();
  const userQuery = messages[messages.length - 1].content;
  
  // Check cache first
  const cached = await cache.get(userQuery);
  if (cached) {
    return Response.json(cached);
  }
  
  // ... rest of logic
  
  // Cache response
  await cache.set(userQuery, response);
}
```

**2. Deploy to Vercel:**

```bash
git add .
git commit -m "Add Vercel KV caching"
git push
```

**3. Verify in Vercel Dashboard:**
- Go to Storage → KV
- Check stored keys
- Monitor cache hits

---

## Testing Cache Behavior

### Local (Should Work)

```bash
# Terminal 1: Start dev server
pnpm dev

# Browser:
1. Go to /benchmarks
2. Run "Simple (25)"
3. Note: Cache Hit Rate: 0%

4. Run "Simple (25)" again
5. Note: Cache Hit Rate: 80-100% ✅
```

### Vercel (Currently 0%)

```bash
# Deploy
git push

# Browser (on Vercel URL):
1. Go to /benchmarks
2. Run "Simple (25)"
3. Note: Cache Hit Rate: 0%

4. Run "Simple (25)" again
5. Note: Cache Hit Rate: 0% ❌ (expected without KV)
```

### With Vercel KV (After Setup)

```bash
# Browser (on Vercel URL):
1. Go to /benchmarks
2. Run "Simple (25)"
3. Note: Cache Hit Rate: 0%

4. Run "Simple (25)" again
5. Note: Cache Hit Rate: 80-100% ✅
```

---

## Cost Analysis

### Without Cache (Current Vercel Behavior)

```
100 queries/day
Average cost: $0.001/query
Daily cost: $0.10
Monthly cost: $3.00
```

### With Cache (40% hit rate)

```
100 queries/day
60 fresh queries: $0.06
40 cached queries: $0.00
Daily cost: $0.06
Monthly cost: $1.80

Savings: $1.20/month
```

### Vercel KV Cost

```
Free tier: 30,000 commands/month
Your usage: ~3,000 commands/month
Cost: $0.00

Total savings: $1.20/month
```

**Verdict:** Worth it if you want to showcase caching, but not critical for demo.

---

## Summary

### Current State
- ✅ Cache works locally
- ❌ Cache doesn't work on Vercel (0% hit rate)
- ✅ All code changes done
- ⏳ Vercel KV setup pending

### Recommendation
**Option A: Keep current implementation**
- Simpler
- Works for demo
- Negligible cost difference

### If You Want Full Caching
**Option B: Set up Vercel KV**
1. Create KV store in Vercel Dashboard
2. Implement cache adapter in API route
3. Deploy and test

### Files Ready
- ✅ `lib/vercel-kv-cache.ts` - KV wrapper created
- ✅ `llm-router` - CacheEntry exported
- ⏳ API route - Needs KV integration (optional)

**Decision: Your call based on priorities!** 🚀
