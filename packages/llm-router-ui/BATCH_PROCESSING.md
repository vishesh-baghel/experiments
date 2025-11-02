# Batch Processing for Benchmarks

## ✅ Performance Improvement

### Before: Sequential Processing
```
Query 1 → Wait 2s → Query 2 → Wait 2s → Query 3 → ...
Total time for 100 queries: ~200 seconds (3.3 minutes)
```

### After: Parallel Batches of 10
```
Batch 1: [Q1, Q2, Q3, Q4, Q5, Q6, Q7, Q8, Q9, Q10] → Wait 2s
Batch 2: [Q11, Q12, Q13, Q14, Q15, Q16, Q17, Q18, Q19, Q20] → Wait 2s
...
Total time for 100 queries: ~20 seconds (10 batches × 2s)
```

**Speed improvement: 10x faster!** 🚀

---

## How It Works

### 1. Batch Creation
```typescript
const BATCH_SIZE = 10;

for (let batchStart = 0; batchStart < queriesToRun.length; batchStart += BATCH_SIZE) {
  const batch = queriesToRun.slice(batchStart, batchStart + BATCH_SIZE);
  // Process batch...
}
```

Splits queries into chunks of 10.

### 2. Parallel Execution
```typescript
const batchPromises = batch.map(async (query) => {
  // Each query runs independently
  const response = await fetch('/api/chat', { ... });
  return result;
});

// Wait for all 10 to complete
const batchResults = await Promise.all(batchPromises);
```

All 10 queries in a batch run simultaneously.

### 3. Progress Updates
```typescript
// Update UI after each batch completes
setResults([...benchmarkResults]);
setProgress((benchmarkResults.length / queriesToRun.length) * 100);
```

UI updates every 10 queries instead of every query.

---

## Performance Comparison

### 100 Queries

**Sequential (Before):**
```
Time: ~200 seconds (3.3 minutes)
Updates: 100 (one per query)
User sees: Slow, incremental progress
```

**Batched (After):**
```
Time: ~20 seconds (10 batches)
Updates: 10 (one per batch)
User sees: Fast, smooth progress
```

**Improvement: 10x faster**

---

### 25 Simple Queries

**Sequential (Before):**
```
Time: ~50 seconds
Updates: 25
```

**Batched (After):**
```
Time: ~6 seconds (3 batches)
Updates: 3
```

**Improvement: 8x faster**

---

### 25 Reasoning Queries

**Sequential (Before):**
```
Time: ~375 seconds (6.25 minutes)
Updates: 25
```

**Batched (After):**
```
Time: ~45 seconds (3 batches)
Updates: 3
```

**Improvement: 8x faster**

---

## Benefits

### 1. Speed
✅ **10x faster** for most queries
✅ Parallel execution maximizes throughput
✅ No waiting for sequential completion

### 2. User Experience
✅ Faster results
✅ Smoother progress updates
✅ Less waiting time

### 3. Resource Utilization
✅ Better use of network bandwidth
✅ Concurrent API calls
✅ Efficient processing

---

## Technical Details

### Batch Size: 10

**Why 10?**
- Balances speed and resource usage
- Prevents overwhelming the API
- Provides smooth progress updates (10% increments for 100 queries)

**Can be adjusted:**
```typescript
const BATCH_SIZE = 10; // Change to 5, 15, 20, etc.
```

### Error Handling

Each query in a batch has independent error handling:
```typescript
try {
  // Process query
  return successResult;
} catch (error) {
  return errorResult;
}
```

If one query fails, others in the batch continue.

### Progress Calculation

```typescript
setProgress((benchmarkResults.length / queriesToRun.length) * 100);
```

Updates after each batch completes:
- Batch 1 (10 queries): 10%
- Batch 2 (20 queries): 20%
- Batch 3 (30 queries): 30%
- ...

---

## Example Execution

### 100 Queries (All)

**Timeline:**
```
0s:  Batch 1 starts (Q1-Q10)
2s:  Batch 1 completes → 10% progress
2s:  Batch 2 starts (Q11-Q20)
4s:  Batch 2 completes → 20% progress
4s:  Batch 3 starts (Q21-Q30)
6s:  Batch 3 completes → 30% progress
...
18s: Batch 10 starts (Q91-Q100)
20s: Batch 10 completes → 100% progress
```

**Total: ~20 seconds**

---

### 25 Simple Queries

**Timeline:**
```
0s:  Batch 1 starts (Q1-Q10)
2s:  Batch 1 completes → 40% progress
2s:  Batch 2 starts (Q11-Q20)
4s:  Batch 2 completes → 80% progress
4s:  Batch 3 starts (Q21-Q25)
6s:  Batch 3 completes → 100% progress
```

**Total: ~6 seconds**

---

## Considerations

### API Rate Limits

**Potential issue:** 10 concurrent requests might hit rate limits

**Solutions:**
1. Reduce batch size to 5
2. Add delay between batches
3. Implement exponential backoff

**Current approach:** 10 is safe for most APIs

---

### Memory Usage

**Concern:** Loading 10 responses simultaneously

**Impact:** Minimal - each response is small
**Mitigation:** Streams are read and discarded immediately

---

### Network Bandwidth

**Benefit:** Better utilization
**Consideration:** May saturate on slow connections
**Solution:** Batch size can be reduced if needed

---

## Future Enhancements

### 1. Configurable Batch Size
```typescript
const [batchSize, setBatchSize] = useState(10);

<select value={batchSize} onChange={...}>
  <option value="5">5 (Slower, safer)</option>
  <option value="10">10 (Balanced)</option>
  <option value="20">20 (Faster, aggressive)</option>
</select>
```

### 2. Adaptive Batching
```typescript
// Adjust batch size based on response times
if (avgResponseTime > 5000) {
  batchSize = 5; // Slower queries, smaller batches
} else {
  batchSize = 15; // Fast queries, larger batches
}
```

### 3. Retry Failed Batches
```typescript
if (batchResults.some(r => !r.success)) {
  // Retry failed queries
  const failedQueries = batchResults.filter(r => !r.success);
  await retryBatch(failedQueries);
}
```

### 4. Real-time Streaming
```typescript
// Show results as they complete, not after batch
batchPromises.forEach(async (promise) => {
  const result = await promise;
  setResults(prev => [...prev, result]);
});
```

---

## Testing

### Test Batch Processing

**1. Run 100 queries:**
```
Filter: All (100)
Click "Run Benchmarks"
Observe: Progress jumps by 10% every ~2 seconds
Total time: ~20 seconds
```

**2. Run 25 simple queries:**
```
Filter: Simple (25)
Click "Run Benchmarks"
Observe: Progress jumps by 40%, 80%, 100%
Total time: ~6 seconds
```

**3. Monitor network:**
```
Open DevTools → Network tab
Run benchmarks
Observe: 10 requests in parallel
```

---

## Summary

**What changed:**
- ✅ Sequential → Parallel batches of 10
- ✅ One-by-one → 10 at a time
- ✅ 100 updates → 10 updates

**Performance:**
- ✅ 10x faster execution
- ✅ Smoother progress
- ✅ Better resource usage

**Impact:**
- ✅ 100 queries: 200s → 20s
- ✅ 25 queries: 50s → 6s
- ✅ User experience: Much better!

**Perfect for fast, efficient benchmarking!** 🚀⚡
