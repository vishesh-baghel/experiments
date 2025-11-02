# Fixes Applied

## Issue 1: LLM Router Not Built ✅

**Problem:**
```
pnpm dev failed because llm-router package wasn't built
```

**Solution:**
```bash
cd packages/llm-router
pnpm build
```

**Why it happened:**
- Workspace dependencies need to be built before use
- TypeScript needs to compile to dist/ folder
- Next.js imports from dist/index.js

**Permanent fix:**
Add to `llm-router-ui/package.json`:
```json
{
  "scripts": {
    "prebuild": "pnpm --filter llm-router build",
    "predev": "pnpm --filter llm-router build"
  }
}
```

---

## Issue 2: Tiktoken WASM Missing ✅

**Problem:**
```
⨯ Error: Missing tiktoken_bg.wasm
```

**Root cause:**
- Tiktoken uses WASM files for tokenization
- Next.js doesn't bundle WASM by default
- Webpack needs special configuration

**Solution Applied:**
Updated `next.config.ts`:
```typescript
webpack: (config, { isServer }) => {
  // Fix for tiktoken WASM file
  config.resolve.alias = {
    ...config.resolve.alias,
    'tiktoken_bg.wasm': require.resolve('@dqbd/tiktoken/tiktoken_bg.wasm'),
  };

  // Handle WASM files
  config.experiments = {
    ...config.experiments,
    asyncWebAssembly: true,
    layers: true,
  };

  return config;
},
// Transpile workspace package
transpilePackages: ['llm-router'],
```

---

## How to Run Now

### 1. Build LLM Router (One Time)
```bash
cd packages/llm-router
pnpm build
```

### 2. Start Dev Server
```bash
cd packages/llm-router-ui
pnpm dev
```

### 3. Open Browser
```
http://localhost:3000
```

---

## Automated Build (Optional)

To avoid manual builds, update `llm-router-ui/package.json`:

```json
{
  "scripts": {
    "predev": "cd ../llm-router && pnpm build",
    "prebuild": "cd ../llm-router && pnpm build",
    "dev": "next dev",
    "build": "next build"
  }
}
```

Or use Turborepo pipeline in root `turbo.json`:

```json
{
  "tasks": {
    "dev": {
      "dependsOn": ["^build"],
      "cache": false
    }
  }
}
```

---

## Testing the Fix

```bash
# 1. Clean everything
cd packages/llm-router
pnpm clean
cd ../llm-router-ui
rm -rf .next

# 2. Build router
cd ../llm-router
pnpm build

# 3. Start UI
cd ../llm-router-ui
pnpm dev

# Should work now! ✅
```

---

## Common Errors & Solutions

### Error: "Cannot find module 'llm-router'"
**Solution:** Build llm-router first
```bash
cd packages/llm-router && pnpm build
```

### Error: "tiktoken_bg.wasm not found"
**Solution:** Already fixed in next.config.ts

### Error: "Module not found: Can't resolve '@dqbd/tiktoken'"
**Solution:** Install dependencies
```bash
cd packages/llm-router && pnpm install
```

### Error: "Type error in llm-router"
**Solution:** Check TypeScript compilation
```bash
cd packages/llm-router && pnpm typecheck
```

---

## Why This Happens

**Workspace Dependencies:**
- pnpm workspaces link packages via `workspace:*`
- TypeScript packages need compilation before use
- Next.js imports the compiled output

**WASM Files:**
- Tiktoken uses WebAssembly for performance
- WASM files need special webpack config
- Next.js doesn't handle WASM by default

**Build Order:**
1. llm-router (library) → compile TypeScript
2. llm-router-ui (app) → import compiled library
3. Next.js → bundle everything

---

## Status: Fixed ✅

Both issues resolved:
- ✅ LLM Router built successfully
- ✅ Tiktoken WASM configured in Next.js
- ✅ Ready to run `pnpm dev`
