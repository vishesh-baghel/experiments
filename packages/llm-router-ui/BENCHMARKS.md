# LLM Router Benchmarks

## Overview

The benchmarks page allows you to test the LLM router's performance across different query types, measure response times, costs, and cache effectiveness.

---

## Features

### 1. Automated Testing
- **10 benchmark queries** covering all complexity levels
- Automatic execution with progress tracking
- Real-time results display

### 2. Comprehensive Metrics
- Total queries executed
- Success/failure rate
- Average response time
- Total cost and cost saved
- Cache hit rate
- Token usage

### 3. Detailed Results Table
- Query text
- Detected complexity
- Selected model and provider
- Response time
- Cost per query
- Cache hit/miss status
- Success/failure indicator

---

## Navigation

### From Chat to Benchmarks
Click the **"Benchmarks"** button in the top-right header:
```
[Benchmarks] [GitHub]
```

### From Benchmarks to Chat
Click **"← Back to Chat"** link at the top

---

## Benchmark Queries

### Test Coverage

**Simple Queries (3):**
1. "What are your business hours?"
2. "When are you open?" (semantic match)
3. "How can I contact support?"

**Semantic Variations (2):**
4. "How do I reset my password?"
5. "I forgot my password, how can I change it?" (semantic match)

**Moderate Queries (2):**
6. "I've been charged twice for the same order..."
7. "I got double charged for my order..." (semantic match)

**Complex Queries (1):**
8. "I placed three orders last month but was charged for four..."

**Cache Testing (2):**
9. "What are your business hours?" (exact match - should hit cache)
10. "How do I reset my password?" (exact match - should hit cache)

---

## Running Benchmarks

### Step 1: Navigate to Benchmarks
Click **"Benchmarks"** button from the chat page

### Step 2: Run Tests
Click **"Run Benchmarks"** button

### Step 3: Watch Progress
- Progress bar shows completion percentage
- Results appear in real-time as each query completes
- Summary metrics update after completion

### Step 4: Review Results
- Check summary cards for overall performance
- Scroll through results table for detailed breakdown
- Identify cache hits and routing decisions

---

## Metrics Explained

### Summary Cards

**1. Total Queries**
```
Total Queries: 10
✓ 10 successful
```
- Total number of queries executed
- Success count (green)
- Failure count (if any)

**2. Avg Response Time**
```
Avg Response Time: 2,450ms
Total: 24.5s
```
- Average time per query
- Total time for all queries
- Lower is better

**3. Total Cost**
```
Total Cost: $0.002400
Saved: $0.000600
```
- Actual cost incurred (LLM calls)
- Cost saved from cache hits
- Shows ROI of caching

**4. Cache Hit Rate**
```
Cache Hit Rate: 20.0%
2 hits
```
- Percentage of queries served from cache
- Number of cache hits
- Higher is better (more savings)

---

## Results Table Columns

### Query
Full text of the query sent to the router

### Complexity
Detected complexity level:
- `simple` - Fast models (gpt-4o-mini)
- `moderate` - Advanced models (gpt-4o-mini)
- `complex` - Reasoning models (gpt-4o)

### Model
Selected model name:
- `gpt-4o-mini`
- `gpt-4o`
- `o1-mini`

### Provider
LLM provider:
- `openai`
- `anthropic`

### Time (ms)
Response time in milliseconds:
- Includes routing decision
- LLM response time
- Cache lookup time

### Cost
Cost for this query:
- `$0.000000` for cache hits
- Actual cost for LLM calls

### Cache
Cache status:
- `✓` Cache hit (green)
- `✗` Cache miss (gray)

### Status
Query execution status:
- ✓ Success (green checkmark)
- ✗ Failed (red X)

---

## Expected Results

### First Run (Cold Cache)

**Summary:**
```
Total Queries: 10
Successful: 10
Avg Response Time: ~2,500ms
Total Cost: ~$0.0024
Cache Hit Rate: 0%
```

**Observations:**
- All queries are cache misses
- Full LLM response time
- All queries cached for next run

---

### Second Run (Warm Cache)

**Summary:**
```
Total Queries: 10
Successful: 10
Avg Response Time: ~1,800ms
Total Cost: ~$0.0018
Cache Hit Rate: 20%
Cost Saved: ~$0.0006
```

**Observations:**
- 2 exact matches hit cache (queries 9, 10)
- Faster average response time
- Cost savings from cache

---

### Third Run (Full Cache)

**Summary:**
```
Total Queries: 10
Successful: 10
Avg Response Time: ~1,600ms
Total Cost: ~$0.0012
Cache Hit Rate: 40%
Cost Saved: ~$0.0012
```

**Observations:**
- 4 semantic matches hit cache
- Even faster response times
- 50% cost savings

---

## Performance Benchmarks

### Expected Response Times

| Query Type | Cache Miss | Cache Hit |
|------------|-----------|-----------|
| Simple | 1,500-2,000ms | 1,200-1,500ms |
| Moderate | 2,000-3,000ms | 1,500-2,000ms |
| Complex | 3,000-5,000ms | 2,000-2,500ms |

### Expected Costs

| Model | Cost per 1K tokens | Typical Query Cost |
|-------|-------------------|-------------------|
| gpt-4o-mini | $0.00015 | $0.0003 |
| gpt-4o | $0.005 | $0.005 |
| o1-mini | $0.015 | $0.015 |

### Cache Effectiveness

| Similarity Threshold | Expected Hit Rate |
|---------------------|------------------|
| 85% (current) | 20-40% |
| 80% | 30-50% |
| 90% | 10-30% |

---

## Interpreting Results

### Good Performance

✅ **Cache Hit Rate > 20%**
- Semantic matching is working
- Cost savings are significant

✅ **Avg Response Time < 2,500ms**
- Router is fast
- Cache is helping

✅ **All Queries Successful**
- No API errors
- Routing is stable

### Areas for Improvement

⚠️ **Cache Hit Rate < 10%**
- Similarity threshold may be too high
- Queries are too diverse
- Consider lowering threshold to 80%

⚠️ **Avg Response Time > 3,000ms**
- LLM responses are slow
- Network latency issues
- Consider using faster models

⚠️ **Failed Queries**
- API key issues
- Rate limiting
- Network errors

---

## Use Cases

### 1. Performance Testing
Run benchmarks to measure:
- Router overhead
- Cache effectiveness
- Model selection accuracy

### 2. Cost Analysis
Understand:
- Cost per query type
- Savings from caching
- ROI of semantic cache

### 3. Regression Testing
After changes:
- Verify routing still works
- Check cache hit rates
- Ensure no performance degradation

### 4. Optimization
Identify:
- Slow queries
- Expensive queries
- Cache misses that should hit

---

## Customizing Benchmarks

### Adding New Queries

Edit `/app/benchmarks/page.tsx`:

```typescript
const benchmarkQueries = [
  // Add your query
  { 
    query: 'Your custom query here', 
    expectedComplexity: 'simple' 
  },
  // ... existing queries
];
```

### Changing Test Parameters

**Adjust query count:**
```typescript
// Run only first 5 queries
benchmarkQueries.slice(0, 5)
```

**Add delays between queries:**
```typescript
await new Promise(resolve => setTimeout(resolve, 1000));
```

**Test specific complexity:**
```typescript
const simpleQueries = benchmarkQueries.filter(
  q => q.expectedComplexity === 'simple'
);
```

---

## Troubleshooting

### Issue: All Queries Fail

**Possible Causes:**
- Missing API keys
- Invalid API keys
- Rate limiting

**Solution:**
1. Check environment variables
2. Verify API keys in Vercel
3. Wait and retry

---

### Issue: No Cache Hits

**Possible Causes:**
- First run (cold cache)
- Similarity threshold too high
- Embedding generation failed

**Solution:**
1. Run benchmarks again
2. Check console for cache logs
3. Lower similarity threshold

---

### Issue: Slow Response Times

**Possible Causes:**
- Network latency
- LLM API slowness
- Synchronous embedding generation

**Solution:**
1. Check network connection
2. Try different time of day
3. Verify async embedding is working

---

## Technical Details

### Benchmark Flow

```
1. Click "Run Benchmarks"
2. For each query:
   a. Send POST to /api/chat
   b. Measure response time
   c. Extract metadata from headers
   d. Read response stream
   e. Record results
3. Calculate summary metrics
4. Display results
```

### Metadata Extraction

Headers read from response:
```typescript
X-Router-Model: gpt-4o-mini
X-Router-Provider: openai
X-Router-Complexity: simple
X-Router-Cost: 0.0003
X-Router-Cache-Hit: false
```

### Progress Tracking

```typescript
setProgress(((i + 1) / totalQueries) * 100);
```

---

## Best Practices

### 1. Run Multiple Times
- First run: Populate cache
- Second run: Test semantic matching
- Third run: Verify consistency

### 2. Clear Cache Between Tests
- Restart dev server
- Or implement cache clear endpoint

### 3. Monitor Costs
- Track total cost across runs
- Set budget alerts
- Optimize expensive queries

### 4. Document Results
- Screenshot summary metrics
- Note any anomalies
- Track improvements over time

---

## Future Enhancements

### Planned Features

**1. Export Results**
- Download as CSV
- Share benchmark reports
- Historical comparison

**2. Custom Query Sets**
- Upload CSV of queries
- Save query sets
- Share with team

**3. Advanced Metrics**
- Latency percentiles (p50, p95, p99)
- Cost per complexity level
- Model accuracy scoring

**4. Comparison Mode**
- Compare two runs
- A/B test configurations
- Visualize improvements

**5. Real-time Monitoring**
- Live metrics dashboard
- Alert on failures
- Cost tracking

---

## Summary

**What it does:**
- Tests LLM router with 10 diverse queries
- Measures performance, cost, and cache effectiveness
- Displays detailed results and summary metrics

**Why it's useful:**
- Verify routing decisions
- Measure cache ROI
- Identify performance issues
- Track improvements

**How to use:**
1. Click "Benchmarks" button
2. Click "Run Benchmarks"
3. Review results
4. Optimize based on findings

**Perfect for demos, testing, and optimization!** 🚀
