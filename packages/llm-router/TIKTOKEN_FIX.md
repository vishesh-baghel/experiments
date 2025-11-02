# Tiktoken WASM Issue - Root Cause & Solutions

## The Problem

**Error:**
```
Error: Missing tiktoken_bg.wasm
at ../llm-router/src/utils/token-counter.ts:8:1
```

**Root cause:**
1. Next.js/Turbopack is importing from `src/` instead of `dist/`
2. Workspace dependency creates symlink to source
3. WASM files need special handling in Next.js
4. `tsc` doesn't bundle WASM dependencies

---

## Why This Happens

### Workspace Dependencies
```json
"llm-router": "workspace:*"
```

**What pnpm does:**
- Creates symlink: `node_modules/llm-router` → `../llm-router`
- Next.js resolves to source by default
- Ignores `main` and `exports` fields

**Evidence:**
```
../llm-router/src/utils/token-counter.ts  ← Source!
Should be: ../llm-router/dist/index.js    ← Dist!
```

---

## Solutions (In Order of Preference)

### Solution 1: Force Dist Resolution (Current Attempt)

**What we did:**
```json
{
  "exports": {
    ".": {
      "types": "./dist/index.d.ts",
      "import": "./dist/index.js",
      "require": "./dist/index.js",
      "default": "./dist/index.js"
    }
  },
  "files": ["dist"]
}
```

**Test:**
```bash
cd packages/llm-router
pnpm clean && pnpm build

cd ../llm-router-ui
pnpm dev
```

**If this works:** ✅ Done!
**If not:** Try Solution 2

---

### Solution 2: Use Bundler (tsup)

**Why:**
- `tsc` only compiles, doesn't bundle
- Need to handle WASM files properly
- Create proper ESM/CJS builds

**Install:**
```bash
cd packages/llm-router
pnpm add -D tsup
```

**Update package.json:**
```json
{
  "scripts": {
    "build": "tsup",
    "build:tsc": "tsc"  // Keep for type checking
  }
}
```

**Create tsup.config.ts:**
```typescript
import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm', 'cjs'],
  dts: true,
  splitting: false,
  sourcemap: true,
  clean: true,
  external: [
    '@dqbd/tiktoken',  // Don't bundle tiktoken
    '@ai-sdk/openai',
    '@ai-sdk/anthropic',
    '@ai-sdk/google',
    'ai',
  ],
});
```

---

### Solution 3: Publish to npm

**Most reliable but overkill for monorepo:**

```bash
# Publish llm-router to npm
cd packages/llm-router
npm publish

# Use as regular dependency
cd ../llm-router-ui
pnpm add llm-router@1.0.0
```

**package.json:**
```json
{
  "dependencies": {
    "llm-router": "^1.0.0"  // From npm, not workspace
  }
}
```

---

### Solution 4: Copy Dist to node_modules (Hack)

**Quick workaround:**
```json
{
  "scripts": {
    "postinstall": "cd ../llm-router && pnpm build && cp -r dist/* ../llm-router-ui/node_modules/llm-router/"
  }
}
```

**Not recommended:** Fragile and breaks on clean installs

---

## Recommended Approach

### For Development (Now)

**Option A:** Solution 1 (Force dist resolution)
- Already implemented
- Test if it works
- No extra dependencies

**If Option A fails:** Solution 2 (tsup bundler)
- Proper bundling
- Handles dependencies correctly
- Industry standard

### For Production (Later)

**Option:** Publish to npm
- Most reliable
- Works everywhere
- Proper versioning

---

## Testing Each Solution

### Test Solution 1
```bash
# Already done - just test
cd packages/llm-router-ui
pnpm dev

# Check error
# If still says ../llm-router/src/ → Failed
# If works → Success!
```

### Test Solution 2 (If needed)
```bash
cd packages/llm-router
pnpm add -D tsup
# Create tsup.config.ts
pnpm build
cd ../llm-router-ui
pnpm dev
```

---

## Why tsc Alone Isn't Enough

**What tsc does:**
```
src/index.ts → dist/index.js
src/router/index.ts → dist/router/index.js
```

**What tsc DOESN'T do:**
- ❌ Bundle dependencies
- ❌ Handle WASM files
- ❌ Create single entry point
- ❌ Resolve external imports properly

**What tsup/esbuild does:**
- ✅ Bundle code
- ✅ Handle externals
- ✅ Create proper ESM/CJS
- ✅ Tree-shaking
- ✅ Proper resolution

---

## Current Status

✅ Added explicit exports
✅ Added files array
✅ Rebuilt package

**Next:** Test if it works
**If not:** Implement Solution 2 (tsup)

---

## Quick Decision Tree

```
Does pnpm dev work now?
├─ Yes → ✅ Done! Solution 1 worked
└─ No → Still importing from src/?
    ├─ Yes → Use Solution 2 (tsup)
    └─ No → Different error?
        └─ Debug new error
```
