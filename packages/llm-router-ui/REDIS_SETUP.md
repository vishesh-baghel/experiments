# Redis Cache Setup (June 2025+)

## Why Redis Instead of Vercel KV?

**As of June 2025, Vercel KV is deprecated.** We now use Redis directly via `node-redis`.

---

## What Was Done

### 1. Installed Redis Client
```bash
pnpm add redis
pnpm remove @vercel/kv
```

### 2. Updated API Route
**File:** `app/api/chat/route.ts`

**Changes:**
- Replaced `@vercel/kv` with `redis`
- Created Redis client with connection pooling
- Uses `REDIS_URL` environment variable
- Fallback to `localhost:6379` for local dev

---

## Environment Setup

### Local Development

**Option A: Use Vercel Redis (Recommended)**

1. Add Redis URL to `.env.local`:
```bash
# .env.local
REDIS_URL=redis://default:your-password@your-redis-url:6379
```

2. Get URL from Vercel Dashboard:
   - Go to **Storage** → **Redis**
   - Copy connection string
   - Add to `.env.local`

**Option B: Local Redis Server**

1. Install Redis locally:
```bash
# macOS
brew install redis
brew services start redis

# Ubuntu/Debian
sudo apt install redis-server
sudo systemctl start redis

# Windows (WSL)
sudo apt install redis-server
sudo service redis-server start
```

2. Use default URL (no .env needed):
```bash
# Defaults to redis://localhost:6379
```

---

### Vercel Production

**1. Create Redis Store in Vercel Dashboard**

1. Go to your project
2. Click **Storage** tab
3. Click **Create Database**
4. Select **Redis** (not KV)
5. Name it: `llm-router-cache`
6. Click **Create**

**2. Environment Variable (Auto-added)**
```
REDIS_URL=redis://default:password@host:port
```

**3. Deploy**
```bash
git add .
git commit -m "Switch to Redis from Vercel KV"
git push
```

---

## How It Works

### Redis Client Initialization

```typescript
// Singleton pattern - reuses connection
let redisClient: ReturnType<typeof createClient> | null = null;

async function getRedisClient() {
  if (!redisClient) {
    redisClient = createClient({
      url: process.env.REDIS_URL || 'redis://localhost:6379',
    });
    
    redisClient.on('error', (err) => 
      console.error('[Redis] Client Error:', err)
    );
    
    await redisClient.connect();
  }
  return redisClient;
}
```

**Benefits:**
- ✅ Connection pooling (reuses client)
- ✅ Error handling
- ✅ Works locally and on Vercel
- ✅ Automatic fallback to localhost

---

### Cache Operations

**Get from Cache:**
```typescript
const cached = await redis.get(`llm-cache:${query}`);
if (cached) {
  return JSON.parse(cached);
}
```

**Set to Cache:**
```typescript
await redis.setEx(
  `llm-cache:${query}`,
  86400, // 24h TTL
  JSON.stringify(data)
);
```

---

## Testing

### Local Testing

**1. Start Redis (if using local):**
```bash
# Check if Redis is running
redis-cli ping
# Should return: PONG

# If not running:
brew services start redis  # macOS
sudo service redis-server start  # Linux
```

**2. Start Dev Server:**
```bash
pnpm dev
```

**3. Test Cache:**
```bash
# Browser: http://localhost:3000/benchmarks
1. Run "Simple (25)"
   → Cache Hit Rate: 0%
   → Responses stored in Redis

2. Run "Simple (25)" again
   → Cache Hit Rate: 100% ✅
```

**4. Verify Redis Storage:**
```bash
# Terminal
redis-cli

# In Redis CLI
KEYS llm-cache:*
# Should show cached queries

GET "llm-cache:What are your business hours?"
# Should show cached response
```

---

### Vercel Testing

**1. Deploy:**
```bash
git push
```

**2. Test:**
```bash
# Browser: https://your-app.vercel.app/benchmarks
1. Run "Simple (25)"
   → Cache Hit Rate: 0%
   → Stored in Vercel Redis

2. Run "Simple (25)" again
   → Cache Hit Rate: 100% ✅
```

**3. Check Logs:**
```bash
# Vercel Dashboard → Deployments → [Latest] → Logs
Look for:
- "[Redis] Connected successfully"
- "[Cache] Redis get error:" (if issues)
```

---

## Environment Variables

### Required

**REDIS_URL** (Production)
```
redis://default:password@host:port
```

**Auto-added by Vercel when you create Redis store.**

### Optional

**Local Development:**
```bash
# .env.local (optional - defaults to localhost)
REDIS_URL=redis://localhost:6379

# Or use Vercel Redis locally:
REDIS_URL=redis://default:password@your-vercel-redis:6379
```

---

## Cache Behavior

### What Gets Cached

```typescript
{
  response: string,      // Full LLM response
  model: string,         // e.g., "gpt-4o-mini"
  provider: string,      // e.g., "openai"
  complexity: string,    // e.g., "simple"
  timestamp: number      // When cached
}
```

**Key Format:** `llm-cache:{query}`
**TTL:** 24 hours (86400 seconds)

---

### Cache Key Matching

**Exact match required:**
```typescript
// These are DIFFERENT keys:
"What are your hours?"
"What are your hours ?"  // Extra space
"what are your hours?"   // Different case
```

**To see all cached queries:**
```bash
redis-cli KEYS "llm-cache:*"
```

---

## Troubleshooting

### Error: "Redis connection failed"

**Check:**
1. Redis is running
2. `REDIS_URL` is correct
3. Network access (firewall/security groups)

**Fix:**
```bash
# Local
redis-cli ping  # Should return PONG

# Vercel
# Check Storage → Redis → Connection String
```

---

### Error: "ECONNREFUSED"

**Cause:** Redis server not running

**Fix:**
```bash
# macOS
brew services start redis

# Linux
sudo systemctl start redis
sudo service redis-server start
```

---

### Cache Not Working

**1. Check Redis Connection:**
```bash
# Terminal
redis-cli
> PING
PONG  # ✅ Working
```

**2. Check Environment Variable:**
```bash
# Local
echo $REDIS_URL

# Vercel
# Dashboard → Settings → Environment Variables
```

**3. Check Logs:**
```bash
# Look for:
[Redis] Connected successfully  # ✅
[Redis] Client Error: ...       # ❌
```

---

## Cost Analysis

### Vercel Redis Pricing

**Free Tier:**
```
256 MB storage
10,000 commands/day
```

**Your Usage:**
```
100 queries/day × 2 commands (get + set) = 200 commands/day
Cache size: ~1 MB (for 100 queries)

Usage: 200 / 10,000 = 2% of daily limit ✅
Storage: 1 MB / 256 MB = 0.4% ✅
Cost: $0.00
```

**Verdict:** Well within free tier! 🎉

---

### Upstash Redis (Alternative)

If you prefer Upstash:

**1. Create Database:**
- Go to [upstash.com](https://upstash.com)
- Create Redis database
- Copy connection string

**2. Add to Vercel:**
```bash
# Vercel Dashboard → Settings → Environment Variables
REDIS_URL=redis://default:password@upstash-host:port
```

**Free Tier:**
```
10,000 commands/day
256 MB storage
```

---

## Migration from Vercel KV

### What Changed

**Before (Vercel KV):**
```typescript
import { kv } from '@vercel/kv';

await kv.get('key');
await kv.set('key', value, { ex: 86400 });
```

**After (Redis):**
```typescript
import { createClient } from 'redis';

const redis = await getRedisClient();
await redis.get('key');
await redis.setEx('key', 86400, value);
```

---

### Data Migration

**If you had data in Vercel KV:**

1. Export from KV (if needed)
2. Redis will start fresh
3. Cache rebuilds automatically on first use

**No manual migration needed** - cache rebuilds naturally.

---

## Performance

### Connection Pooling

```typescript
// Singleton pattern - reuses connection
let redisClient: ReturnType<typeof createClient> | null = null;
```

**Benefits:**
- ✅ Fast (no reconnection overhead)
- ✅ Efficient (single connection)
- ✅ Reliable (automatic reconnection)

---

### Cache Hit Performance

**First Request:**
```
Check Redis → Miss → Call LLM → Store in Redis
Time: ~2000ms (LLM call)
Cost: $0.0003
```

**Second Request:**
```
Check Redis → Hit → Return cached
Time: ~50ms (Redis lookup)
Cost: $0.00
```

**Savings:** 40x faster, $0 cost ✅

---

## Monitoring

### Redis CLI Commands

```bash
# Connect
redis-cli

# Check all cache keys
KEYS llm-cache:*

# Get specific cache entry
GET "llm-cache:What are your hours?"

# Check TTL (time to live)
TTL "llm-cache:What are your hours?"

# Count cached queries
DBSIZE

# Clear all cache (careful!)
FLUSHDB
```

---

### Vercel Dashboard

**Storage → Redis:**
- Connection status
- Memory usage
- Commands per second
- Key count

---

## Summary

### Changes Made
- ✅ Removed `@vercel/kv`
- ✅ Added `redis` package
- ✅ Updated API route to use Redis
- ✅ Connection pooling implemented
- ✅ Error handling added

### Environment Setup
- ✅ `REDIS_URL` environment variable
- ✅ Fallback to localhost for dev
- ✅ Works with Vercel Redis
- ✅ Works with Upstash Redis
- ✅ Works with local Redis

### Testing
- ✅ Local: Use localhost or Vercel Redis
- ✅ Production: Use Vercel Redis
- ✅ Cache persistence across deployments
- ✅ 24h TTL on all entries

### Next Steps
1. Add `REDIS_URL` to `.env.local` (optional)
2. Deploy to Vercel
3. Test cache on production
4. Monitor Redis dashboard

**Ready to use!** 🚀✅
