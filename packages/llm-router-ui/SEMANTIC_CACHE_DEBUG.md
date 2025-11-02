# Semantic Cache Debugging

## What I Added

### Detailed Logging
Added comprehensive logging to understand cache behavior:

```typescript
// When generating embeddings
console.log(`[Cache] Generating embedding for: "${text}..."`);
console.log(`[Cache] ✓ Embedding generated (256 dimensions)`);

// When looking up cache
console.log(`[Cache] Query: "${query}..."`);
console.log(`[Cache] Best match: "${cachedQuery}..." (similarity: 92.3%)`);
console.log(`[Cache] Threshold: 85.0%`);
console.log(`[Cache] ✓ HIT - Returning cached response`);
// or
console.log(`[Cache] ✗ MISS - Similarity below threshold`);
```

---

## What You'll See Now

### Test 1: Exact Match
```bash
# First request
Query: "hi"
[Cache] Generating embedding for: "hi"
[Cache] ✓ Embedding generated (256 dimensions)
[Cache] ✗ MISS - No cached entries yet
→ Calls LLM
→ Caches response

# Second request (exact same)
Query: "hi"
[Cache] Query: "hi"
[Cache] Best match: "hi" (similarity: 100.0%)
[Cache] Threshold: 85.0%
[Cache] ✓ HIT - Returning cached response
→ Returns instantly!
```

### Test 2: Semantic Match
```bash
# First request
Query: "what can you do?"
[Cache] ✗ MISS
→ Calls LLM
→ Caches response

# Second request (semantically similar)
Query: "how can you help me?"
[Cache] Query: "how can you help me?"
[Cache] Best match: "what can you do?" (similarity: 91.2%)
[Cache] Threshold: 85.0%
[Cache] ✓ HIT - Returning cached response
→ Returns cached! ✅
```

### Test 3: No Match
```bash
Query: "I've been charged twice..."
[Cache] Query: "I've been charged twice..."
[Cache] Best match: "hi" (similarity: 12.3%)
[Cache] Threshold: 85.0%
[Cache] ✗ MISS - Similarity below threshold
→ Calls LLM (correct behavior)
```

---

## Possible Issues & Solutions

### Issue 1: Embeddings Failing
**Symptom:**
```
[Cache] ✗ Failed to generate embedding: API key not found
[Cache] Best match: "hi" (similarity: 0.0%)
```

**Cause:** OpenAI API key missing or invalid

**Solution:**
```bash
# Check .env file
cat .env | grep OPENAI_API_KEY

# Should see:
OPENAI_API_KEY=sk-...
```

---

### Issue 2: All Similarities Are 0%
**Symptom:**
```
[Cache] Best match: "hi" (similarity: 0.0%)
[Cache] Best match: "hello" (similarity: 0.0%)
```

**Cause:** Embeddings are failing, returning zero vectors

**Solution:** Check console for embedding errors, verify API key

---

### Issue 3: Threshold Too High
**Symptom:**
```
[Cache] Best match: "how can you help?" (similarity: 82.5%)
[Cache] Threshold: 85.0%
[Cache] ✗ MISS - Similarity below threshold
```

**Cause:** Queries are similar but below 85% threshold

**Solution:** Lower threshold in agent initialization:
```typescript
const agent = new CustomerCareAgent(undefined, {
  cacheOptions: {
    similarityThreshold: 0.80, // Lower from 0.85
  },
});
```

---

## Expected Similarity Scores

### High Similarity (Should Cache)
```
"hi" → "hello"                           → 95-98%
"what can you do?" → "how can you help?" → 88-92%
"business hours" → "when are you open?"  → 90-94%
```

### Medium Similarity (Borderline)
```
"hi" → "good morning"                    → 75-82%
"help me" → "I need assistance"          → 80-85%
```

### Low Similarity (Should NOT Cache)
```
"hi" → "I've been charged twice"         → 5-15%
"hours" → "refund policy"                → 10-20%
```

---

## Testing Semantic Cache

### Test Sequence

**1. Simple greeting variations:**
```
Send: "hi"           → MISS (first time)
Send: "hello"        → HIT (95%+ similarity) ✅
Send: "hey there"    → HIT (90%+ similarity) ✅
```

**2. Help queries:**
```
Send: "what can you do?"     → MISS
Send: "how can you help me?" → HIT (88%+ similarity) ✅
Send: "what services?"       → HIT (85%+ similarity) ✅
```

**3. Different topics:**
```
Send: "business hours"       → MISS
Send: "refund policy"        → MISS (different topic)
Send: "when are you open?"   → HIT (matches "business hours") ✅
```

---

## Console Output Example

```bash
# Start server
pnpm dev

# First "hi"
[Cache] Generating embedding for: "hi"
[Cache] ✓ Embedding generated (256 dimensions)
[Cache] ✗ MISS - No cached entries yet
Routing: { cacheHit: false, cached: true }

# Send "hello" (similar)
[Cache] Generating embedding for: "hello"
[Cache] ✓ Embedding generated (256 dimensions)
[Cache] Query: "hello"
[Cache] Best match: "hi" (similarity: 96.8%)
[Cache] Threshold: 85.0%
[Cache] ✓ HIT - Returning cached response
→ No routing log (cache hit before routing!)

# Send "what can you do?"
[Cache] Generating embedding for: "what can you do?"
[Cache] ✓ Embedding generated (256 dimensions)
[Cache] Query: "what can you do?"
[Cache] Best match: "hi" (similarity: 18.2%)
[Cache] Threshold: 85.0%
[Cache] ✗ MISS - Similarity below threshold
Routing: { cacheHit: false, cached: true }

# Send "how can you help me?" (similar to above)
[Cache] Generating embedding for: "how can you help me?"
[Cache] ✓ Embedding generated (256 dimensions)
[Cache] Query: "how can you help me?"
[Cache] Best match: "what can you do?" (similarity: 91.3%)
[Cache] Threshold: 85.0%
[Cache] ✓ HIT - Returning cached response
→ Semantic match! ✅
```

---

## Troubleshooting

### If semantic matching isn't working:

1. **Check embedding generation:**
   - Look for `[Cache] ✓ Embedding generated`
   - If you see errors, check API key

2. **Check similarity scores:**
   - Should be 85%+ for similar queries
   - If always 0%, embeddings are failing

3. **Check threshold:**
   - Default is 85%
   - Lower to 80% if needed

4. **Check API key:**
   ```bash
   echo $OPENAI_API_KEY
   # Should output: sk-...
   ```

---

## Summary

**What to expect:**
- ✅ Exact matches: 100% similarity → Cache hit
- ✅ Semantic matches: 85%+ similarity → Cache hit
- ✅ Different topics: <85% similarity → Cache miss

**Console logs will show:**
- Embedding generation status
- Similarity scores for each query
- Cache hit/miss decisions
- Why decisions were made

**Test it now and watch the console!** 🔍
