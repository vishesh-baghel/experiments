# Code Review Findings - LLM Router Packages

**Date**: November 4, 2025  
**Reviewer**: Cascade AI  
**Scope**: `packages/llm-router` and `packages/llm-router-ui`

---

## Executive Summary

Comprehensive review identified **7 critical issues** and **multiple broken/unused code patterns** across both packages:

1. ❌ **llm-router-ui doesn't use Mastra Agent primitive** - directly uses router + AI SDK
2. ❌ **Missing demo/queries.ts file** - exported but doesn't exist
3. ❌ **Unused StreamingRouter class** - never imported or used
4. ❌ **Duplicate CustomerCareAgent implementations** - different logic in each package
5. ❌ **2 failing tests** - complexity classification issues
6. ❌ **Missing @mastra/core dependency** in llm-router-ui
7. ⚠️ **Inconsistent agent patterns** - llm-router uses Mastra Agent, UI doesn't

---

## Critical Issues

### 1. llm-router-ui NOT Using Mastra Agent Primitive ❌

**Location**: `packages/llm-router-ui/app/api/chat/route.ts`

**Problem**: The UI directly uses `streamText` from AI SDK instead of using Mastra's Agent primitive.

```typescript
// CURRENT (WRONG) - Lines 68-89
const result = streamText({
  model,
  messages: allMessages,
  onFinish: async ({ text, usage }) => {
    // Direct AI SDK usage
  },
});
```

**Expected**: Should use Mastra Agent like the llm-router package does:

```typescript
// CORRECT (from llm-router/src/agent/customer-care-agent.ts)
const agent = new Agent({
  name: 'customer-care',
  instructions: this.systemPrompt,
  model: modelString,
});
const response = await agent.generate(query);
```

**Impact**: 
- Bypasses Mastra's agent abstraction layer
- Missing agent lifecycle management
- No consistency with llm-router package patterns
- Harder to add tools, memory, or other Mastra features

---

### 2. Missing demo/queries.ts File ❌

**Location**: `packages/llm-router/src/index.ts:34`

**Problem**: Exports non-existent module

```typescript
// Demo utilities (for testing)
export * from './demo/queries';  // ❌ This file/folder doesn't exist
```

**Evidence**:
- `src/demo/` directory doesn't exist
- Build will fail when trying to import from this path
- Likely leftover from refactoring

**Fix**: Either:
1. Remove the export line (if demo queries not needed)
2. Create the file if it's meant to export benchmark queries

---

### 3. Unused StreamingRouter Class ❌

**Location**: `packages/llm-router/src/router/streaming-router.ts`

**Problem**: 115 lines of code that's never used anywhere

**Evidence**:
```bash
# Search results show ZERO imports
grep -r "StreamingRouter" packages/llm-router/
# Only found in: streaming-router.ts (definition only)
```

**Not exported from**:
- `src/index.ts` - main entry point
- `src/router/index.ts` - router exports

**Not used in**:
- llm-router-ui
- Any tests
- Any examples

**Decision needed**: Delete or export if it's meant to be public API

---

### 4. Duplicate CustomerCareAgent Implementations ❌

**Problem**: Two different implementations with different logic

#### Implementation A: `llm-router/src/agent/customer-care-agent.ts` (204 lines)
- ✅ Uses Mastra Agent primitive
- ✅ Full ML classifier integration
- ✅ Complete usage tracking
- ✅ Comprehensive logging
- ❌ More complex

```typescript
private createAgent(provider: string, model: string): Agent {
  const modelString = `${provider}/${model}`;
  return new Agent({
    name: 'customer-care',
    instructions: this.systemPrompt,
    model: modelString,
  });
}
```

#### Implementation B: `llm-router-ui/lib/customer-care-agent.ts` (159 lines)
- ❌ Does NOT use Mastra Agent
- ✅ Simpler, focused on routing + caching
- ✅ Better for demo purposes
- ❌ Returns empty response (expects API route to fill it)

```typescript
// Returns routing info only, no actual LLM call
return {
  response: '', // Will be filled by streaming in API route
  routing: { ... },
  usage: { inputTokens: 0, outputTokens: 0, totalTokens: 0 },
  latency,
};
```

**Impact**:
- Confusing which one to use
- Different behaviors
- Code duplication
- Maintenance burden

**Recommendation**: 
- Keep Implementation A in llm-router (production-ready)
- Either delete Implementation B or rename it to `RouterHelper` to clarify it's not a full agent

---

### 5. Failing Tests ❌

**Test Results**:
```bash
❯ src/router/__tests__/analyzer.test.ts (22 tests | 1 failed)
  × ComplexityAnalyzer > Moderate Queries > should classify comparison questions as moderate
    → expected 'complex' to be 'moderate' // Object.is equality

❯ src/router/__tests__/index.test.ts (21 tests | 1 failed)
  × LLMRouter > Edge Cases > should handle empty query
    → expected 'moderate' to be 'simple' // Object.is equality
```

**Problem**: Complexity classification logic doesn't match test expectations

**Root Cause**: 
- Analyzer classifying queries differently than expected
- Tests may need updating OR analyzer logic needs fixing
- Edge case handling (empty query) not properly implemented

---

### 6. Missing Dependency in llm-router-ui ❌

**Location**: `packages/llm-router-ui/package.json`

**Problem**: Uses Mastra types but doesn't have `@mastra/core` dependency

**Evidence**:
```json
{
  "dependencies": {
    "@ai-sdk/anthropic": "^1.0.0",
    "@ai-sdk/openai": "^1.0.0",
    // ❌ Missing @mastra/core
    "llm-router": "file:../llm-router",
    // ...
  }
}
```

**Impact**: 
- If llm-router-ui needs to use Mastra Agent, it can't
- Type imports may fail
- Peer dependency warnings

---

### 7. Inconsistent Agent Patterns ⚠️

**llm-router package**:
- ✅ Uses Mastra Agent primitive
- ✅ Proper agent lifecycle
- ✅ Full feature support

**llm-router-ui package**:
- ❌ Bypasses Mastra Agent
- ❌ Direct AI SDK usage
- ❌ Manual streaming implementation

**Why this matters**:
- Defeats the purpose of using Mastra
- Can't leverage Mastra features (tools, memory, evals)
- Inconsistent patterns across codebase
- Harder to maintain

---

## Additional Issues

### Unused/Dead Code

1. **benchmarks/queries.ts** (21KB) - Duplicate of queries.json?
2. **classifier/train.ts** - Training script, not part of library
3. **classifier/upload-to-upstash.ts** - Deployment script, not library code
4. **benchmarks/benchmark.ts** - Testing script, not library code

**Recommendation**: Move scripts to separate `scripts/` folder, don't include in library build

### Package Structure Issues

**llm-router package.json**:
```json
"files": [
  "dist"  // ✅ Only ships compiled code
]
```

**Problem**: Scripts like `train.ts`, `benchmark.ts` are in `src/` but shouldn't be in published package

**Fix**: Move to `scripts/` folder outside `src/`

### Test Coverage Gaps

**Missing tests for**:
- StreamingRouter (because it's unused)
- CustomerCareAgent in llm-router-ui
- API routes in llm-router-ui
- Cache integration tests

---

## Architecture Issues

### 1. Confused Responsibilities

**llm-router package** should be:
- ✅ Pure routing logic
- ✅ Complexity analysis
- ✅ Cost calculation
- ❌ NOT agent implementation (that's Mastra's job)

**Current state**:
- Has CustomerCareAgent (mixing concerns)
- Has streaming logic (should use Mastra's streaming)

### 2. Missing Abstractions

**llm-router-ui** reimplements:
- Agent logic (should use Mastra Agent)
- Streaming (should use Mastra streaming)
- Model selection (should use router + Mastra)

**Better pattern**:
```typescript
// In API route
const router = new LLMRouter();
const routing = await router.routeQuery(query);

// Use Mastra Agent with routing result
const agent = new Agent({
  name: 'customer-care',
  instructions: systemPrompt,
  model: `${routing.provider}/${routing.model}`,
});

// Stream using Mastra
return agent.stream(messages);
```

---

## Priority Fixes

### P0 - Critical (Must Fix)

1. **Fix llm-router-ui to use Mastra Agent** (Issue #1)
   - Rewrite `app/api/chat/route.ts` to use Agent primitive
   - Remove direct AI SDK usage
   - Use Mastra's streaming

2. **Remove broken export** (Issue #2)
   - Delete `export * from './demo/queries'` from index.ts
   - OR create the missing file

3. **Fix failing tests** (Issue #5)
   - Update complexity analyzer logic
   - Fix edge case handling

### P1 - High (Should Fix)

4. **Resolve CustomerCareAgent duplication** (Issue #4)
   - Keep llm-router version
   - Delete or rename llm-router-ui version
   - Document which to use when

5. **Add @mastra/core to llm-router-ui** (Issue #6)
   - Add as dependency
   - Use proper Mastra patterns

### P2 - Medium (Nice to Have)

6. **Remove or export StreamingRouter** (Issue #3)
   - Delete if not needed
   - Export and document if needed

7. **Reorganize package structure**
   - Move scripts to `scripts/` folder
   - Clean up benchmarks
   - Separate library code from tooling

### P3 - Low (Cleanup)

8. **Add missing tests**
9. **Improve documentation**
10. **Standardize patterns**

---

## Recommended Refactoring Plan

### Phase 1: Fix Critical Issues (1-2 hours)

1. Remove `export * from './demo/queries'`
2. Fix failing tests
3. Add @mastra/core to llm-router-ui

### Phase 2: Mastra Integration (2-3 hours)

1. Rewrite llm-router-ui API route to use Mastra Agent
2. Remove duplicate CustomerCareAgent from UI
3. Test streaming with Mastra

### Phase 3: Cleanup (1-2 hours)

1. Move scripts to separate folder
2. Remove/export StreamingRouter
3. Update documentation

### Phase 4: Architecture (Optional, 3-4 hours)

1. Consider removing CustomerCareAgent from llm-router
2. Make llm-router pure utility (routing only)
3. Document integration patterns with Mastra

---

## Questions for Discussion

1. **Should llm-router include agent implementations?**
   - Pro: Convenient, batteries-included
   - Con: Mixing concerns, duplicates Mastra functionality

2. **What's the intended use of StreamingRouter?**
   - Keep and export?
   - Delete as unused?
   - Integrate with Mastra streaming?

3. **Should benchmarks/scripts be in the package?**
   - Current: In src/, included in build
   - Better: Separate scripts/ folder

4. **What's the demo/queries export for?**
   - Was it meant to export benchmark queries?
   - Should it be removed?

---

## Next Steps

1. **Review this document** - Discuss findings and priorities
2. **Decide on architecture** - Pure router vs batteries-included
3. **Create fix plan** - Break down into tasks
4. **Fix one by one** - Start with P0 issues

---

## Files Requiring Changes

### Immediate Changes Needed

- ✏️ `packages/llm-router/src/index.ts` - Remove broken export
- ✏️ `packages/llm-router-ui/app/api/chat/route.ts` - Use Mastra Agent
- ✏️ `packages/llm-router-ui/package.json` - Add @mastra/core
- ✏️ `packages/llm-router/src/router/__tests__/analyzer.test.ts` - Fix test
- ✏️ `packages/llm-router/src/router/__tests__/index.test.ts` - Fix test

### Consider Deleting

- 🗑️ `packages/llm-router/src/router/streaming-router.ts` (unused)
- 🗑️ `packages/llm-router-ui/lib/customer-care-agent.ts` (duplicate)

### Consider Moving

- 📦 `packages/llm-router/src/benchmarks/*` → `scripts/benchmarks/`
- 📦 `packages/llm-router/src/classifier/train.ts` → `scripts/training/`
- 📦 `packages/llm-router/src/classifier/upload-to-upstash.ts` → `scripts/deployment/`

---

**End of Review**
