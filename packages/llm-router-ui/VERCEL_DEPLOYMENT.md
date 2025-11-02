# Vercel Deployment Guide for llm-router-ui

## Issue: Deployments Not Triggering

### Root Cause
Vercel wasn't detecting changes in the monorepo because:
1. Local file dependency (`file:../llm-router`) needs special build handling
2. Monorepo change detection wasn't configured
3. Build command didn't build the dependency package first

---

## ✅ Solution Applied

### 1. Updated `vercel.json`

```json
{
  "buildCommand": "cd ../llm-router && pnpm build && cd ../llm-router-ui && pnpm build",
  "installCommand": "pnpm install --shamefully-hoist",
  "ignoreCommand": "git diff --quiet HEAD^ HEAD ./",
  "framework": "nextjs",
  "env": {
    "OPENAI_API_KEY": "@openai-api-key",
    "ANTHROPIC_API_KEY": "@anthropic-api-key"
  }
}
```

**Key Changes:**
- **buildCommand**: Builds `llm-router` package first, then `llm-router-ui`
- **installCommand**: Uses `--shamefully-hoist` for monorepo compatibility
- **ignoreCommand**: Detects changes in current directory to trigger builds

---

## Vercel Project Settings

### Required Configuration

**1. Root Directory**
```
packages/llm-router-ui
```
✅ Already configured correctly

**2. Framework Preset**
```
Next.js
```

**3. Build & Development Settings**

| Setting | Value |
|---------|-------|
| Build Command | `cd ../llm-router && pnpm build && cd ../llm-router-ui && pnpm build` |
| Output Directory | `.next` (default) |
| Install Command | `pnpm install --shamefully-hoist` |
| Development Command | `pnpm dev` |

**4. Environment Variables**

Add these in Vercel Dashboard → Settings → Environment Variables:

```
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...
```

Make sure to use the secret names referenced in vercel.json:
- `@openai-api-key`
- `@anthropic-api-key`

---

## How It Works Now

### Build Process

1. **Install Phase**
   ```bash
   pnpm install --shamefully-hoist
   ```
   - Installs all dependencies
   - Hoists packages for monorepo compatibility
   - Links local `llm-router` package

2. **Build Phase**
   ```bash
   cd ../llm-router && pnpm build    # Build dependency first
   cd ../llm-router-ui && pnpm build # Build Next.js app
   ```
   - Builds `llm-router` package to `dist/`
   - Then builds Next.js app which imports from `llm-router`

3. **Deploy Phase**
   - Vercel deploys the built `.next` directory
   - Serves the application

---

## Change Detection

### How Vercel Detects Changes

The `ignoreCommand` tells Vercel when to build:

```bash
git diff --quiet HEAD^ HEAD ./
```

**Logic:**
- Checks if there are changes in `packages/llm-router-ui/` directory
- Returns exit code 0 (no changes) → Skip build
- Returns exit code 1 (has changes) → Trigger build

**Important:** Changes in `packages/llm-router/` won't trigger deployment automatically. You need to:
1. Make a change in `llm-router-ui` (even a comment)
2. Or manually trigger deployment in Vercel dashboard

---

## Troubleshooting

### Issue 1: "No deployments happening"

**Symptoms:**
- Push commits but no deployment triggered
- Vercel dashboard shows no new deployments

**Solutions:**

**A. Check if changes are in the right directory**
```bash
# Changes must be in packages/llm-router-ui/ to trigger deployment
git log --oneline --name-only -5
```

**B. Manually trigger deployment**
1. Go to Vercel Dashboard
2. Select your project
3. Click "Deployments" tab
4. Click "..." menu → "Redeploy"

**C. Update ignoreCommand to include llm-router changes**
```json
{
  "ignoreCommand": "git diff --quiet HEAD^ HEAD ./ ../llm-router"
}
```
This will trigger builds when either package changes.

---

### Issue 2: "Build fails with module not found"

**Symptoms:**
```
Error: Cannot find module 'llm-router'
```

**Solution:**
Ensure build command builds `llm-router` first:
```json
{
  "buildCommand": "cd ../llm-router && pnpm build && cd ../llm-router-ui && pnpm build"
}
```

---

### Issue 3: "pnpm install fails"

**Symptoms:**
```
Error: Unable to resolve dependencies
```

**Solutions:**

**A. Use shamefully-hoist flag**
```json
{
  "installCommand": "pnpm install --shamefully-hoist"
}
```

**B. Check pnpm-workspace.yaml exists at root**
```yaml
packages:
  - 'packages/*'
```

**C. Ensure package.json has correct dependency**
```json
{
  "dependencies": {
    "llm-router": "file:../llm-router"
  }
}
```

---

### Issue 4: "Environment variables not working"

**Symptoms:**
- API calls fail
- Missing API keys

**Solution:**

**1. Check Vercel Dashboard**
- Go to Settings → Environment Variables
- Ensure variables are set for all environments (Production, Preview, Development)

**2. Variable names must match**
```json
// vercel.json
{
  "env": {
    "OPENAI_API_KEY": "@openai-api-key"  // References secret
  }
}
```

**3. Create secrets in Vercel**
```bash
# Using Vercel CLI
vercel secrets add openai-api-key sk-...
vercel secrets add anthropic-api-key sk-ant-...
```

Or add via Dashboard → Settings → Environment Variables

---

## Alternative: Trigger Builds on Any Package Change

If you want deployments to trigger when `llm-router` changes too:

### Option 1: Update ignoreCommand

```json
{
  "ignoreCommand": "git diff --quiet HEAD^ HEAD ./ ../llm-router"
}
```

### Option 2: Remove ignoreCommand

```json
{
  "buildCommand": "cd ../llm-router && pnpm build && cd ../llm-router-ui && pnpm build",
  "installCommand": "pnpm install --shamefully-hoist",
  "framework": "nextjs"
}
```

This will trigger builds on every commit to the repo.

---

## Recommended Workflow

### For Development

1. **Make changes to llm-router**
   ```bash
   cd packages/llm-router
   # Make changes
   pnpm build
   ```

2. **Test in llm-router-ui**
   ```bash
   cd packages/llm-router-ui
   pnpm dev
   # Test changes
   ```

3. **Commit and push**
   ```bash
   git add .
   git commit -m "Update llm-router and UI"
   git push
   ```

4. **Trigger deployment**
   - If changes only in `llm-router`: Manually redeploy in Vercel
   - If changes in `llm-router-ui`: Auto-deploys

---

## Verification Steps

### After Configuration

1. **Test build locally**
   ```bash
   cd packages/llm-router-ui
   pnpm install --shamefully-hoist
   cd ../llm-router && pnpm build
   cd ../llm-router-ui && pnpm build
   ```

2. **Make a test commit**
   ```bash
   # Add a comment to any file in llm-router-ui
   git add .
   git commit -m "Test deployment"
   git push
   ```

3. **Check Vercel Dashboard**
   - Should see new deployment triggered
   - Build logs should show both packages building

4. **Verify deployment**
   - Check deployment URL
   - Test functionality
   - Check browser console for errors

---

## Current Status

✅ **Fixed Issues:**
- Build command now builds `llm-router` first
- Install command uses `--shamefully-hoist` for monorepo
- Ignore command configured for change detection

✅ **Next Steps:**
1. Commit and push the updated `vercel.json`
2. Verify deployment triggers in Vercel dashboard
3. Check build logs for any errors
4. Test deployed application

---

## Quick Reference

### Force Deployment
```bash
# Option 1: Via Vercel CLI
vercel --prod

# Option 2: Via Dashboard
Deployments → ... → Redeploy
```

### Check Build Logs
```
Vercel Dashboard → Deployments → [Latest] → Building
```

### Update Environment Variables
```
Vercel Dashboard → Settings → Environment Variables
```

### Test Build Locally
```bash
cd packages/llm-router-ui
pnpm install --shamefully-hoist
cd ../llm-router && pnpm build && cd ../llm-router-ui && pnpm build
```

---

## Summary

**Problem:** Vercel not detecting changes and triggering deployments

**Root Causes:**
1. Monorepo with local file dependency
2. Missing build configuration for dependency package
3. No change detection configured

**Solutions Applied:**
1. ✅ Updated build command to build both packages
2. ✅ Added `--shamefully-hoist` to install command
3. ✅ Configured `ignoreCommand` for change detection
4. ✅ Documented environment variable setup

**Result:** Deployments should now trigger automatically when you push changes to `packages/llm-router-ui/`

**Next:** Commit the updated `vercel.json` and push to trigger a deployment! 🚀
